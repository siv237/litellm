"""fork: read-only эндпоинт `/dashboard/state` — живой дашборд мониторинга.

Источник данных — ТОЛЬКО процесс LiteLLM-прокси (рамка пользователя 06.10.2026):
in-flight реестр (`proxy/gantt/inflight.py`), его накопительные счёты, состояние
роутера (модели/deployment'ы/кулдауны) и короткий SELECT из SpendLogs для истории.
Никаких внешних опросов: ни Prometheus, ни /metrics бэкендов.
Авторизация: человеческие UI-роли (как `/gantt`).
"""
from __future__ import annotations

import json
import time
from typing import Any, Dict, Final, List

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from litellm.proxy._types import UserAPIKeyAuth
from litellm.proxy.auth.user_api_key_auth import user_api_key_auth
from litellm.proxy.gantt.gantt_endpoints import _ALLOWED_ROLES, _user_names
from litellm.proxy.gantt.inflight import registry as _inflight

router: Final = APIRouter()

_RECENT_WINDOW_SEC: Final = 900
_RECENT_LIMIT: Final = 25

_SQL_RECENT: Final = """
SELECT COALESCE(json_agg(r ORDER BY t0 DESC), '[]') AS data FROM (
  SELECT
    floor(extract(epoch FROM s."startTime") * 1000)::bigint AS t0,
    floor(extract(epoch FROM s."endTime") * 1000)::bigint AS t1,
    COALESCE(s."user", '') AS u,
    COALESCE(uu.user_email, '') AS email,
    COALESCE(NULLIF(s."model", ''), '?') AS model,
    s."prompt_tokens" AS p,
    s."completion_tokens" AS c,
    COALESCE(s."status", '') AS status,
    LEFT(COALESCE(s.api_key, ''), 12) AS key_short
  FROM "LiteLLM_SpendLogs" s
  LEFT JOIN "LiteLLM_UserTable" uu ON uu.user_id = s."user"
  WHERE s."startTime" >= (now() AT TIME ZONE 'utc') - make_interval(secs => $1)
    AND NOT (COALESCE(s."status", '') = 'failure'
             AND COALESCE(s."model", '') = ''
             AND COALESCE(s."prompt_tokens", 0) + COALESCE(s."completion_tokens", 0) = 0)
  ORDER BY s."startTime" DESC
  LIMIT $2
) r;
"""


def _tok_s(t_start_ms: int, t_end_ms: int, tokens: int) -> float:
    dur = (t_end_ms - t_start_ms) / 1000.0
    if tokens > 0 and dur > 0.5:
        return round(tokens / dur, 1)
    return 0.0


def _models_state() -> List[Dict[str, Any]]:
    """Алиасы моделей и состояние их deployment'ов глазами роутера."""
    from litellm.proxy.proxy_server import llm_router

    if llm_router is None:
        return []
    out: List[Dict[str, Any]] = []
    try:
        names = llm_router.get_model_names()
    except Exception:
        return []
    for name in names:
        deps = [d for d in (llm_router.model_list or []) if d.get("model_name") == name]
        dep_ids = [str(d.get("litellm_params", {}).get("model_id") or "") for d in deps]
        dep_ids = [x for x in dep_ids if x]
        cooldown_sec = 0.0
        try:
            cooldown_sec = float(llm_router.cooldown_cache.get_min_cooldown(dep_ids, None) or 0.0)
        except Exception:
            pass
        max_input = None
        for d in deps:
            try:
                dep = llm_router.get_deployment(str(d.get("litellm_params", {}).get("model_id") or ""))
                mi = getattr(dep, "model_info", None) if dep else None
                mit = getattr(mi, "max_input_tokens", None) if mi else None
                if isinstance(mit, (int, float)) and mit > 0:
                    max_input = int(mit)
                    break
            except Exception:
                pass
        out.append(
            {
                "name": name,
                "deployments": len(deps),
                "max_input_tokens": max_input,
                "cooldown_sec": round(cooldown_sec, 1),
                "state": "cooldown" if cooldown_sec > 0 else "ok",
            }
        )
    return out


@router.get(
    "/dashboard/state",
    tags=["dashboard"],
    include_in_schema=False,
)
async def get_dashboard_state(
    response: Response,
    recent: int = Query(default=_RECENT_LIMIT, description="строк истории в ответе"),
    user_api_key_dict: UserAPIKeyAuth = Depends(user_api_key_auth),
):
    from litellm.proxy.proxy_server import prisma_client

    if user_api_key_dict.user_role not in _ALLOWED_ROLES:
        raise HTTPException(
            status_code=403,
            detail={"error": "Дашборд доступен только UI-пользователям прокси"},
        )

    now_ms = int(time.time() * 1000)
    snap = _inflight.snapshot()
    live = [e for e in snap if e["t1"] is None]
    finished = [e for e in snap if e["t1"] is not None]

    for e in live:
        base = e["tf"] if e["tf"] else e["t0"]
        e["elapsed_ms"] = max(now_ms - e["t0"], 0)
        e["ttft_ms"] = (e["tf"] - e["t0"]) if e["tf"] else None
        e["tok_s"] = _tok_s(base, now_ms, e["ntok"]) if e["stream"] else 0.0

    rows: List[Dict[str, Any]] = []
    if prisma_client is not None:
        try:
            result = await prisma_client.db.query_raw(_SQL_RECENT, _RECENT_WINDOW_SEC, min(max(recent, 1), _RECENT_LIMIT))
            data = result[0].get("data") if result and isinstance(result[0], dict) else []
            if isinstance(data, str):
                data = json.loads(data)
            rows = [dict(row) for row in (data or [])]
        except Exception:
            rows = []

    # FIN-мост: завершённые, ещё не дописанные в SpendLogs (flush 10–20 с)
    if finished and rows:
        buckets: Dict[tuple, List[int]] = {}
        for r in rows:
            buckets.setdefault((r["u"], r["key_short"]), []).append(r["t0"])
        finished = [
            e
            for e in finished
            if not any(abs(t0 - e["t0"]) <= 1500 for t0 in buckets.get((e["u"], e["key_short"]), []))
        ]

    names: Dict[str, str] = {}
    if prisma_client is not None and (rows or snap):
        try:
            names = await _user_names(prisma_client)
        except Exception:
            names = {}

    def _disp(u: str, email: str = "") -> str:
        return email.split("@")[0] if email else (names.get(u) or u or "—")

    recent_rows: List[Dict[str, Any]] = []
    for r in rows:
        dur = (r["t1"] - r["t0"]) if r["t1"] and r["t0"] else None
        c = int(r.get("c") or 0)
        recent_rows.append(
            {
                "t0": r["t0"],
                "t1": r["t1"],
                "u": r["u"],
                "display": _disp(r["u"], r.get("email") or ""),
                "model": r["model"],
                "p": int(r.get("p") or 0),
                "c": c,
                "status": r["status"],
                "duration_ms": dur,
                "tok_s": _tok_s(r["t0"], r["t1"], c) if r["t1"] else 0.0,
            }
        )
    for e in finished:
        recent_rows.append(
            {
                "t0": e["t0"],
                "t1": e["t1"],
                "u": e["u"],
                "display": _disp(e["u"]),
                "model": e["model"],
                "p": 0,
                "c": e["ntok"] if e["stream"] else 0,
                "status": "success",
                "duration_ms": (e["t1"] - e["t0"]) if e["t1"] else None,
                "tok_s": _tok_s(e["tf"] or e["t0"], e["t1"], e["ntok"]) if e["t1"] and e["stream"] else 0.0,
            }
        )
    recent_rows.sort(key=lambda x: x["t0"], reverse=True)
    recent_rows = recent_rows[: min(max(recent, 1), _RECENT_LIMIT)]

    for e in live:
        e["display"] = _disp(e["u"])

    return {
        "now": now_ms,
        "counters": _inflight.counters_snapshot(),
        "state": "generating" if live else "idle",
        "inflight": live,
        "recent": recent_rows,
        "models": _models_state(),
    }
