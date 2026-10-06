"""fork: реестр НЕзавершённых запросов для Request Gantt.

SpendLogs пишется по завершении, поэтому «живой» запрос там не виден.
CustomLogger-хуки закрывают разрыв: `async_pre_call_hook` регистрирует
запрос прямо перед отправкой на бэкенд, `async_log_success_event` /
`async_log_failure_event` снимают его (для стрима — по концу потока,
совпадая с моментом появления строки SpendLogs).

Прокси 937 — один uvicorn-worker без Redis, поэтому реестр в памяти
процесса надёжен; при рестарте сервиса очищается (окно 2–3 с).
"""
from __future__ import annotations

import threading
import time
import uuid
from typing import Any, Dict, Final, List, Optional, Union

from litellm.integrations.custom_logger import CustomLogger

_META_KEY: Final = "gantt_inflight_id"
_TTL_SEC: Final = 2 * 3600
# завершённые держим, пока SpendLogs не дописался (пачковый flush ~10–20 с),
# иначе на Ганте «дырка» между концом live-бара и появлением строки
_FINISHED_GRACE_SEC: Final = 180
_MAX_ENTRIES: Final = 2000


class InFlightRegistry(CustomLogger):
    def __init__(self) -> None:
        super().__init__()
        self._lock = threading.Lock()
        self._items: Dict[str, Dict[str, Any]] = {}

    async def async_pre_call_hook(
        self,
        user_api_key_dict: Any,
        cache: Any,
        data: Dict[str, Any],
        call_type: str,
    ) -> Optional[Union[Exception, str, Dict[str, Any]]]:
        try:
            rid = uuid.uuid4().hex
            entry = {
                "t0": time.time(),
                "t1": None,
                "u": getattr(user_api_key_dict, "user_id", None) or "",
                "token": getattr(user_api_key_dict, "token", None) or "",
                "key_alias": getattr(user_api_key_dict, "key_alias", None) or "",
                "model": str(data.get("model") or ""),
            }
            with self._lock:
                if len(self._items) >= _MAX_ENTRIES:
                    self._prune_locked()
                    if len(self._items) >= _MAX_ENTRIES:
                        return data
                self._items[rid] = entry
            injected = False
            for key in ("metadata", "litellm_metadata"):
                meta = data.get(key)
                if isinstance(meta, dict):
                    meta[_META_KEY] = rid
                    injected = True
                    break
            if not injected:
                data["metadata"] = {_META_KEY: rid}
        except Exception:
            pass
        return data

    def _finish(self, kwargs: Any) -> None:
        try:
            if not isinstance(kwargs, dict):
                return
            candidates: List[Any] = [kwargs.get("metadata"), kwargs.get("litellm_metadata")]
            lp = kwargs.get("litellm_params")
            if isinstance(lp, dict):
                candidates.extend([lp.get("metadata"), lp.get("litellm_metadata")])
            for meta in candidates:
                if isinstance(meta, dict) and isinstance(meta.get(_META_KEY), str):
                    resolved: Any = None
                    if isinstance(lp, dict) and isinstance(lp.get("model"), str) and lp["model"]:
                        resolved = lp["model"]
                    else:
                        spo = kwargs.get("standard_logging_object")
                        if isinstance(spo, dict) and isinstance(spo.get("model"), str) and spo["model"]:
                            resolved = spo["model"]
                    with self._lock:
                        entry = self._items.get(meta[_META_KEY])
                        if entry is not None and entry.get("t1") is None:
                            entry["t1"] = time.time()
                            # SpendLogs пишет разыменённое имя deployment'а —
                            # приводим модель записи к нему, чтобы бар сел в свою дорожку
                            if isinstance(resolved, str) and resolved:
                                entry["model"] = resolved
                    return
        except Exception:
            pass

    async def async_log_success_event(
        self, kwargs: Any, response_obj: Any, start_time: Any, end_time: Any
    ) -> None:
        self._finish(kwargs)

    async def async_log_failure_event(
        self, kwargs: Any, response_obj: Any, start_time: Any, end_time: Any
    ) -> None:
        self._finish(kwargs)

    async def async_log_stream_event(
        self, kwargs: Any, response_obj: Any, start_time: Any, end_time: Any
    ) -> None:
        # стримы без собранного ответа идут сюда, а не в success — иначе бар зависнет live
        self._finish(kwargs)

    def snapshot(self) -> List[Dict[str, Any]]:
        now = time.time()
        with self._lock:
            self._prune_locked(now)
            return [
                {
                    "t0": int(e["t0"] * 1000),
                    "t1": int(e["t1"] * 1000) if e.get("t1") else None,
                    "u": e["u"],
                    "key_alias": e["key_alias"],
                    "key_short": e["token"][:12],
                    "model": e["model"],
                }
                for e in self._items.values()
            ]

    def _prune_locked(self, now: Optional[float] = None) -> None:
        now = now if now is not None else time.time()
        dead = [
            rid
            for rid, e in self._items.items()
            if (e.get("t1") and now - e["t1"] > _FINISHED_GRACE_SEC)
            or (not e.get("t1") and now - e["t0"] > _TTL_SEC)
        ]
        for rid in dead:
            del self._items[rid]
        if len(self._items) >= _MAX_ENTRIES:
            done = sorted(
                ((rid, e["t1"]) for rid, e in self._items.items() if e.get("t1")),
                key=lambda x: x[1],
            )
            for rid, _ in done[: max(len(done) - _MAX_ENTRIES // 2, 0)]:
                del self._items[rid]


registry: Final = InFlightRegistry()


def register() -> None:
    """Подключить реестр к глобальным callback'ам (вызывается при импорте роутера)."""
    import litellm

    if not any(isinstance(cb, InFlightRegistry) for cb in litellm.callbacks):
        litellm.callbacks.append(registry)
