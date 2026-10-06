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
        self.started_at = time.time()
        # накопительные счёты процесса (с момента запуска, Redis нет)
        self.counters: Dict[str, int] = {
            "requests": 0,
            "success": 0,
            "failure": 0,
            "stream": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
        }

    async def async_pre_call_hook(
        self,
        user_api_key_dict: Any,
        cache: Any,
        data: Dict[str, Any],
        call_type: str,
    ) -> Optional[Union[Exception, str, Dict[str, Any]]]:
        try:
            rid = uuid.uuid4().hex
            is_stream = bool(data.get("stream"))
            entry = {
                "t0": time.time(),
                "t1": None,
                "tf": None,  # время первого content-чанка (live TTFT)
                "ntok": 0,  # content-чанков получено (≈ токенов сгенерировано)
                "stream": is_stream,
                "u": getattr(user_api_key_dict, "user_id", None) or "",
                "token": getattr(user_api_key_dict, "token", None) or "",
                "key_alias": getattr(user_api_key_dict, "key_alias", None) or "",
                "model": str(data.get("model") or ""),
            }
            with self._lock:
                self.counters["requests"] += 1
                if is_stream:
                    self.counters["stream"] += 1
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

    def _finish(self, kwargs: Any, outcome: str = "success") -> None:
        try:
            if not isinstance(kwargs, dict):
                return
            spo = kwargs.get("standard_logging_object")
            spo = spo if isinstance(spo, dict) else {}
            p_tok = spo.get("prompt_tokens")
            c_tok = spo.get("completion_tokens")
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
                        if isinstance(spo.get("model"), str) and spo["model"]:
                            resolved = spo["model"]
                    with self._lock:
                        entry = self._items.get(meta[_META_KEY])
                        if entry is not None and entry.get("t1") is None:
                            entry["t1"] = time.time()
                            # SpendLogs пишет разыменённое имя deployment'а —
                            # приводим модель записи к нему, чтобы бар сел в свою дорожку
                            if isinstance(resolved, str) and resolved:
                                entry["model"] = resolved
                        self.counters[outcome] = self.counters.get(outcome, 0) + 1
                        if isinstance(p_tok, int) and p_tok > 0:
                            self.counters["prompt_tokens"] += p_tok
                        if isinstance(c_tok, int) and c_tok > 0:
                            self.counters["completion_tokens"] += c_tok
                    return
        except Exception:
            pass

    @staticmethod
    def _meta_from_request(request_data: Any) -> Any:
        # model_call_details кладёт metadata в litellm_params (см. litellm_logging),
        # рядом с той же схемой, что и в success/failure kwargs
        if not isinstance(request_data, dict):
            return None
        for key in ("metadata", "litellm_metadata"):
            m = request_data.get(key)
            if isinstance(m, dict) and _META_KEY in m:
                return m
        lp = request_data.get("litellm_params")
        if isinstance(lp, dict):
            for key in ("metadata", "litellm_metadata"):
                m = lp.get(key)
                if isinstance(m, dict) and _META_KEY in m:
                    return m
        return None

    @staticmethod
    def _chunk_has_text(chunk: Any) -> bool:
        # Delta в этом апстриме — подкласс dict (в wrapper'е читают delta.get("content"));
        # reasoning-модели льют токены в reasoning_content — считаем и то, и то:
        # для «модель генерит N токенов» важны оба потока
        try:
            choices = getattr(chunk, "choices", None)
            if not choices and isinstance(chunk, dict):
                choices = chunk.get("choices")
            if not choices:
                return False
            first = choices[0]
            delta = first.get("delta") if isinstance(first, dict) else getattr(first, "delta", None)
            if delta is None:
                return False
            if isinstance(delta, dict):
                return bool(delta.get("content")) or bool(delta.get("reasoning_content"))
            return bool(getattr(delta, "content", None)) or bool(getattr(delta, "reasoning_content", None))
        except Exception:
            return False

    def on_stream_chunk(self, request_data: Any, chunk: Any) -> None:
        # синхронный вызов из CustomStreamWrapper на КАЖДЫЙ чанк (патч форка
        # streaming_handler): TTFT + счётчик content-чанков ≈ живые токены
        try:
            meta = self._meta_from_request(request_data)
            if not isinstance(meta, dict):
                return
            rid = meta.get(_META_KEY)
            if not isinstance(rid, str):
                return
            has_content = self._chunk_has_text(chunk)
            with self._lock:
                entry = self._items.get(rid)
                if entry is not None and entry.get("t1") is None:
                    if entry.get("tf") is None:
                        entry["tf"] = time.time()
                    if has_content:
                        entry["ntok"] = int(entry.get("ntok", 0)) + 1
        except Exception:
            pass

    async def async_post_call_streaming_deployment_hook(
        self,
        request_data: dict,
        response_chunk: Any,
        call_type: Any,
    ) -> Any:
        # в этой версии апстрима вызывается только на ПОСЛЕДНИМ чанке
        # (per-chunk считает on_stream_chunk); оставлен как страховка для
        # путей, не проходящих через __anext__
        try:
            meta = self._meta_from_request(request_data)
            if not isinstance(meta, dict):
                return None
            rid = meta.get(_META_KEY)
            if not isinstance(rid, str):
                return None
            has_content = self._chunk_has_text(response_chunk)
            with self._lock:
                entry = self._items.get(rid)
                if entry is not None and entry.get("t1") is None:
                    if entry.get("tf") is None:
                        entry["tf"] = time.time()
                    if has_content:
                        entry["ntok"] = int(entry.get("ntok", 0)) + 1
        except Exception:
            pass
        return None

    async def async_log_success_event(
        self, kwargs: Any, response_obj: Any, start_time: Any, end_time: Any
    ) -> None:
        self._finish(kwargs, "success")

    async def async_log_failure_event(
        self, kwargs: Any, response_obj: Any, start_time: Any, end_time: Any
    ) -> None:
        self._finish(kwargs, "failure")

    async def async_log_stream_event(
        self, kwargs: Any, response_obj: Any, start_time: Any, end_time: Any
    ) -> None:
        # стримы без собранного ответа идут сюда, а не в success — иначе бар зависнет live
        self._finish(kwargs, "success")

    def snapshot(self) -> List[Dict[str, Any]]:
        now = time.time()
        with self._lock:
            self._prune_locked(now)
            return [
                {
                    "t0": int(e["t0"] * 1000),
                    "t1": int(e["t1"] * 1000) if e.get("t1") else None,
                    "tf": int(e["tf"] * 1000) if e.get("tf") else None,
                    "ntok": int(e.get("ntok", 0)),
                    "stream": bool(e.get("stream")),
                    "u": e["u"],
                    "key_alias": e["key_alias"],
                    "key_short": e["token"][:12],
                    "model": e["model"],
                }
                for e in self._items.values()
            ]

    def counters_snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "uptime_sec": int(time.time() - self.started_at),
                **self.counters,
            }

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
