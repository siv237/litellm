"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient } from "@/components/networking";

interface InflightT {
  t0: number;
  t1: number | null;
  tf: number | null;
  ntok: number;
  stream: boolean;
  u: string;
  display: string;
  model: string;
  key_alias: string;
  key_short: string;
  elapsed_ms: number;
  ttft_ms: number | null;
  tok_s: number;
}

interface RecentT {
  t0: number;
  t1: number | null;
  u: string;
  display: string;
  model: string;
  p: number;
  c: number;
  status: string;
  duration_ms: number | null;
  tok_s: number;
}

interface ModelStateT {
  name: string;
  deployments: number;
  max_input_tokens: number | null;
  cooldown_sec: number;
  state: string;
}

interface CountersT {
  uptime_sec: number;
  requests: number;
  success: number;
  failure: number;
  stream: number;
  prompt_tokens: number;
  completion_tokens: number;
}

interface StateResponse {
  now: number;
  counters: CountersT;
  state: string;
  inflight: InflightT[];
  recent: RecentT[];
  models: ModelStateT[];
}

const REFRESH_MS = 2000;
const HISTORY_MAX = 150;

function fnum(n: number): string {
  return n.toLocaleString("ru-RU");
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("ru-RU", { hour12: false });
}

function fmtDur(ms: number | null): string {
  if (ms == null) return "—";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} с`;
  if (s < 3600) return `${Math.floor(s / 60)} мин ${Math.round(s % 60)} с`;
  return `${Math.floor(s / 3600)} ч ${Math.floor((s % 3600) / 60)} мин`;
}

function fmtUptime(sec: number): string {
  if (sec < 3600) return `${Math.floor(sec / 60)} мин`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} ч ${Math.floor((sec % 3600) / 60)} мин`;
  return `${Math.floor(sec / 86400)} сут ${Math.floor((sec % 86400) / 3600)} ч`;
}

const normModel = (m: string) => (m.includes("/") ? m.slice(m.indexOf("/") + 1) : m);

function Sparkline({ points }: { points: { ts: number; tok: number }[] }) {
  const W = 300;
  const H = 56;
  if (points.length < 2) {
    return <div className="text-xs text-muted-foreground">накопление истории…</div>;
  }
  const maxTok = Math.max(...points.map((p) => p.tok), 1);
  const step = W / (HISTORY_MAX - 1);
  const x0 = W - (points.length - 1) * step;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(x0 + i * step).toFixed(1)},${(H - (p.tok / maxTok) * (H - 6) - 3).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-14 w-full">
      <path d={`${path} L${W},${H} L${x0.toFixed(1)},${H} Z`} fill="currentColor" opacity={0.12} className="text-blue-500" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-blue-600 dark:text-blue-400" />
    </svg>
  );
}

export default function Monitoring({ accessToken }: { accessToken: string | null }) {
  const [data, setData] = useState<StateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const history = useRef<{ ts: number; tok: number }[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await apiClient.get<StateResponse>("/dashboard/state", { accessToken });
      setData(res);
      setError(null);
      const tok = res.inflight.reduce((a, e) => a + (e.tok_s || 0), 0);
      history.current.push({ ts: res.now, tok });
      if (history.current.length > HISTORY_MAX) history.current.splice(0, history.current.length - HISTORY_MAX);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [accessToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const liveTok = data ? data.inflight.reduce((a, e) => a + (e.tok_s || 0), 0) : 0;
  const counters = data?.counters;

  const stateBadge = () => {
    if (error && !data) return { text: "Нет связи с прокси", cls: "bg-red-600 text-white" };
    if (data?.state === "generating")
      return { text: `Генерация · ${data.inflight.length}`, cls: "bg-green-600 text-white animate-pulse" };
    return { text: "Ожидание", cls: "bg-slate-500 text-white" };
  };
  const badge = stateBadge();

  return (
    <div className="space-y-3 p-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded px-3 py-1 text-sm font-semibold ${badge.cls}`}>{badge.text}</span>
        {(data?.models || []).map((m) => (
          <span
            key={m.name}
            className={`rounded border px-2 py-0.5 text-xs ${
              m.state === "cooldown"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-input text-muted-foreground"
            }`}
            title={`deployment'ов: ${m.deployments}${m.max_input_tokens ? `, макс. вход: ${fnum(m.max_input_tokens)}` : ""}`}
          >
            {m.name}
            {m.state === "cooldown" ? ` · кулдаун ${Math.ceil(m.cooldown_sec)} с` : ""}
          </span>
        ))}
        {error && data && <span className="text-xs text-amber-600 dark:text-amber-400">нет связи: {error}</span>}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded border border-input bg-card p-3">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium">Скорость генерации</span>
            <span className="text-2xl font-bold tabular-nums">{liveTok.toFixed(1)} ток/с</span>
          </div>
          <Sparkline points={history.current} />
        </div>

        <div className="rounded border border-input bg-card p-3">
          <div className="mb-2 text-sm font-medium">Запросы в работе</div>
          {data && data.inflight.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pr-2 font-normal">Пользователь</th>
                  <th className="pr-2 font-normal">Модель</th>
                  <th className="pr-2 text-right font-normal">Идёт</th>
                  <th className="pr-2 text-right font-normal">Перв. ответ</th>
                  <th className="pr-2 text-right font-normal">Токенов</th>
                  <th className="text-right font-normal">Ток/с</th>
                </tr>
              </thead>
              <tbody>
                {data.inflight.map((e, i) => (
                  <tr key={`${e.t0}-${i}`} className="border-t border-input/40">
                    <td className="py-1 pr-2">{e.display}</td>
                    <td className="pr-2">{normModel(e.model)}</td>
                    <td className="pr-2 text-right tabular-nums">{fmtDur(e.elapsed_ms)}</td>
                    <td className="pr-2 text-right tabular-nums">{e.ttft_ms != null ? fmtDur(e.ttft_ms) : "…"}</td>
                    <td className="pr-2 text-right tabular-nums">{e.stream ? fnum(e.ntok) : "—"}</td>
                    <td className="text-right tabular-nums">{e.stream ? e.tok_s.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">нет активных запросов</div>
          )}
        </div>
      </div>

      <div className="rounded border border-input bg-card p-3">
        <div className="mb-2 text-sm font-medium">Последние запросы</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pr-2 font-normal">Время</th>
              <th className="pr-2 font-normal">Статус</th>
              <th className="pr-2 font-normal">Пользователь</th>
              <th className="pr-2 font-normal">Модель</th>
              <th className="pr-2 text-right font-normal">Вход</th>
              <th className="pr-2 text-right font-normal">Выход</th>
              <th className="pr-2 text-right font-normal">Ток/с</th>
              <th className="text-right font-normal">Длит.</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent || []).map((r, i) => (
              <tr key={`${r.t0}-${i}`} className="border-t border-input/40">
                <td className="py-1 pr-2 tabular-nums">{fmtTime(r.t0)}</td>
                <td className={`pr-2 ${r.status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {r.status === "success" ? "ок" : r.status === "failure" ? "ошибка" : r.status}
                </td>
                <td className="pr-2">{r.display}</td>
                <td className="pr-2">{normModel(r.model)}</td>
                <td className="pr-2 text-right tabular-nums">{r.p ? fnum(r.p) : "—"}</td>
                <td className="pr-2 text-right tabular-nums">{r.c ? fnum(r.c) : "—"}</td>
                <td className="pr-2 text-right tabular-nums">{r.tok_s ? r.tok_s.toFixed(1) : "—"}</td>
                <td className="text-right tabular-nums">{fmtDur(r.duration_ms)}</td>
              </tr>
            ))}
            {(!data || data.recent.length === 0) && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-muted-foreground">
                  нет данных за 15 минут
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {counters && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded border border-input bg-card p-3 text-xs text-muted-foreground">
          <span>с момента запуска прокси ({fmtUptime(counters.uptime_sec)}):</span>
          <span>запросов: <b className="text-foreground tabular-nums">{fnum(counters.requests)}</b></span>
          <span>успешных: <b className="text-foreground tabular-nums">{fnum(counters.success)}</b></span>
          <span>ошибок: <b className="text-foreground tabular-nums">{fnum(counters.failure)}</b></span>
          <span>прочитано токенов: <b className="text-foreground tabular-nums">{fnum(counters.prompt_tokens)}</b></span>
          <span>записано токенов: <b className="text-foreground tabular-nums">{fnum(counters.completion_tokens)}</b></span>
        </div>
      )}
    </div>
  );
}
