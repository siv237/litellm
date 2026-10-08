"use client";

// fork: панель «Журнал активности» (замена enterprise-журнала аудита, v1 08.10.2026).
// Слой 1 — журнал (тепловая карта, участники, последние начала сессий) — чистый SQL.
// Слой 2 — «Оценить период» — ручной вызов модели, летопись оценок.

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/components/networking";
import Heatmap from "./heatmap";
import EvaluateDialog from "./evaluate";
import UserView from "./userView";
import {
  fmtDelta,
  fmtKtok,
  fnum,
  TYPE_BADGE,
  userHues,
  type EvaluationT,
  type StateResponse,
} from "./shared";

interface Props {
  accessToken: string;
}

export default function Journal({ accessToken }: Props) {
  const [days, setDays] = useState(30);
  const [model, setModel] = useState("");
  const [agent, setAgent] = useState("");
  const [key, setKey] = useState("");
  const [data, setData] = useState<StateResponse | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationT[]>([]);
  const [showEval, setShowEval] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const q = new URLSearchParams({ days: String(days) });
      if (model) q.set("model", model);
      if (agent) q.set("agent", agent);
      if (key) q.set("key", key);
      const r = await apiClient.get<StateResponse>(`/dashboard/journal/state?${q}`, { accessToken });
      setData(r);
      setError("");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }, [accessToken, days, model, agent, key]);

  const loadEvals = useCallback(async () => {
    if (!accessToken) return;
    try {
      const r = await apiClient.get<{ items: EvaluationT[] }>("/dashboard/journal/evaluations?limit=30", { accessToken });
      setEvaluations(r.items || []);
    } catch {
      /* летопись не критична */
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadEvals();
  }, [loadEvals]);

  const hues = useMemo(
    () => userHues(data ? [...data.participants.map((p) => p.display), ...data.recent.map((r2) => r2.display)] : []),
    [data],
  );

  if (selected) {
    return (
      <>
        <UserView
          accessToken={accessToken}
          u={selected}
          onBack={() => setSelected(null)}
          onEvaluate={() => setShowEval(true)}
          evaluations={evaluations}
        />
        {showEval && (
          <EvaluateDialog
            accessToken={accessToken}
            models={data?.models || []}
            onClose={() => setShowEval(false)}
            onDone={loadEvals}
          />
        )}
      </>
    );
  }

  const t = data?.totals;
  const dReqs = t && fmtDelta(t.reqs, t.prev_reqs);
  const dPeople = t && fmtDelta(t.people, t.prev_people);

  const kpi = (label: string, value: string, delta?: { txt: string; up: boolean } | null, hint?: string) => (
    <div className="rounded border border-input bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {delta && <div className={`text-[11px] ${delta.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{delta.txt}</div>}
      <div className="text-[10px] text-muted-foreground">{hint || "к предыдущему периоду"}</div>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Журнал активности</h1>
          <div className="text-xs text-muted-foreground">Кто и как пользуется ИИ · только администраторы</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-input bg-background px-2 py-1.5 text-xs"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>последние 7 дней</option>
            <option value={30}>последние 30 дней</option>
            <option value={90}>90 дней</option>
          </select>
          <button
            className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            onClick={() => setShowEval(true)}
          >
            Оценить период
          </button>
        </div>
      </div>

      <div className="shrink-0 rounded border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-[11px] text-muted-foreground">
        Журнал текстов ведётся с 06.10.2026 — ранее доступна только статистика. Время — Владивосток (UTC+10).
      </div>

      {error && <div className="shrink-0 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600">{error}</div>}

      <div className="grid shrink-0 gap-3 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded border border-input bg-card p-3">
          <div className="mb-2 text-sm font-medium">Активность</div>
          {data ? <Heatmap cells={data.cells} /> : <div className="text-xs text-muted-foreground">загрузка…</div>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {kpi("Запросы", t ? fnum(t.reqs) : "…", dReqs)}
          {kpi("Участники", t ? fnum(t.participants) : "…", null, "люди + системы")}
          {kpi("Люди", t ? fnum(t.people) : "…", dPeople)}
          {kpi("Системы", t ? fnum(t.systems) : "…", null, "боты и сервисы")}
          {kpi("Пиковый час", t?.peak_hour != null ? `${String(t.peak_hour).padStart(2, "0")}:00` : "…", null, "максимум запросов по часам")}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.7fr_1fr]">
        <div className="flex min-h-0 flex-col rounded border border-input bg-card p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Участники</span>
            <div className="flex items-center gap-2 text-[11px]">
              <select
                className="rounded border border-input bg-background px-2 py-1"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                title="фильтр по модели"
              >
                <option value="">Все модели</option>
                {(data?.models || []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                className="w-28 rounded border border-input bg-background px-2 py-1"
                placeholder="агент (UA)"
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                onBlur={load}
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
              <input
                className="w-28 rounded border border-input bg-background px-2 py-1"
                placeholder="ключ"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onBlur={load}
                onKeyDown={(e) => e.key === "Enter" && load()}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-muted-foreground">
                  <th className="pr-2 font-normal">Участник</th>
                  <th className="pr-2 font-normal">Тип</th>
                  <th className="pr-2 text-right font-normal">Запросы</th>
                  <th className="pr-2 text-right font-normal">Токены</th>
                  <th className="pr-2 text-right font-normal">Сессии</th>
                  <th className="pr-2 text-right font-normal" title="user-реплики в последнем теле сессии (тексты с 06.10)">
                    Обмены
                  </th>
                  <th className="pr-2 font-normal">Активные часы</th>
                  <th className="pr-2 font-normal">Топ-модели</th>
                  <th className="text-right font-normal">Последняя активность</th>
                </tr>
              </thead>
              <tbody>
                {(data?.participants || []).map((p) => (
                  <tr
                    key={p.u || "anon"}
                    className="cursor-pointer border-t border-input/40 hover:bg-muted/50"
                    onClick={() => setSelected(p.u)}
                    title="открыть страницу участника"
                  >
                    <td className="max-w-[10rem] truncate py-1.5 pr-2">
                      <span
                        className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                        style={{ backgroundColor: `hsl(${hues.get(p.display) ?? 0} 65% 55%)` }}
                      />
                      {p.display}
                    </td>
                    <td className="pr-2">
                      <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${TYPE_BADGE[p.type].cls}`}>
                        {TYPE_BADGE[p.type].label}
                      </span>
                    </td>
                    <td className="pr-2 text-right tabular-nums">{fnum(p.reqs)}</td>
                    <td className="pr-2 text-right tabular-nums">{fmtKtok(p.tok)}</td>
                    <td className="pr-2 text-right tabular-nums">{fnum(p.sess)}</td>
                    <td className="pr-2 text-right tabular-nums">{fnum(p.exch)}</td>
                    <td className="pr-2 tabular-nums text-muted-foreground">{p.hours}</td>
                    <td className="max-w-[12rem] truncate pr-2 text-muted-foreground" title={p.models}>
                      {p.models}
                    </td>
                    <td className="text-right tabular-nums text-muted-foreground">{p.t_last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && !data.participants.length && <div className="py-6 text-center text-xs text-muted-foreground">нет данных за период</div>}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded border border-input bg-card p-3">
          <div className="mb-2 text-sm font-medium">Последняя активность</div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {(data?.recent || []).map((r2, i) => (
              <div key={i} className="flex gap-2 border-t border-input/40 py-1.5 first:border-t-0">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `hsl(${hues.get(r2.display) ?? 0} 65% 55%)` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium">{r2.display}</span>
                    <span className="tabular-nums text-muted-foreground">{r2.t}</span>
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground" title={r2.txt}>
                    {r2.txt}
                  </div>
                </div>
                <span className="shrink-0 self-center text-[10px] tabular-nums text-muted-foreground" title="запросов в сессии">
                  {r2.turns} зап.
                </span>
              </div>
            ))}
            {data && !data.recent.length && <div className="py-6 text-center text-xs text-muted-foreground">нет сессий с текстами за период</div>}
          </div>
        </div>
      </div>

      {showEval && (
        <EvaluateDialog
          accessToken={accessToken}
          models={data?.models || []}
          onClose={() => setShowEval(false)}
          onDone={loadEvals}
        />
      )}
    </div>
  );
}
