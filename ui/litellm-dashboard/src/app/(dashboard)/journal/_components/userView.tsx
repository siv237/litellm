"use client";

// fork: страница участника журнала (v1 — без тем/проектов, темы появятся из оценок)

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "@/components/networking";
import { fmtKtok, fnum, TYPE_BADGE, type EvaluationT, type UserResponse } from "./shared";

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-500" />
    </svg>
  );
}

interface Props {
  accessToken: string;
  u: string;
  onBack: () => void;
  onEvaluate: () => void;
  evaluations: EvaluationT[];
}

export default function UserView({ accessToken, u, onBack, onEvaluate, evaluations }: Props) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<UserResponse | null>(null);
  const [error, setError] = useState("");
  const [openEval, setOpenEval] = useState<EvaluationT | null>(null);
  const [fullReport, setFullReport] = useState("");

  const toggleEval = async (ev: EvaluationT) => {
    if (openEval?.id === ev.id) {
      setOpenEval(null);
      return;
    }
    setOpenEval(ev);
    setFullReport("");
    try {
      const r = await apiClient.get<{ report: string }>(`/dashboard/journal/evaluation?id=${ev.id}`, { accessToken });
      setFullReport(r.report || "");
    } catch {
      setFullReport(ev.preview);
    }
  };

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get<UserResponse>(`/dashboard/journal/user?u=${encodeURIComponent(u)}&days=${days}`, {
        accessToken,
      });
      setData(r);
      setError("");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }, [accessToken, u, days]);

  useEffect(() => {
    load();
  }, [load]);

  const exportMd = () => {
    if (!data) return;
    const lines = [
      `# Журнал: ${data.display} (${data.email || data.u}) — ${data.days} сут`,
      "",
      `Запросов: ${data.totals.reqs} · токенов: ${data.totals.tok} · сессий: ${data.totals.sess} · обменов: ${data.totals.exch}`,
      "",
      "| Начало (Владивосток) | Мод. | Токены | Обмены | Первая реплика |",
      "|---|---|---|---|---|",
      ...data.sessions.map((s) => `| ${s.t0} | ${s.model} | ${s.tok} | ${s.exch} | ${s.first.replace(/\|/g, "\\|")} |`),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
    a.download = `journal-${data.display}-${data.days}d.md`;
    a.click();
  };

  const t = data?.totals;
  const kpi = (label: string, value: string, hint?: string) => (
    <div className="rounded border border-input bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <button className="w-fit text-xs text-muted-foreground hover:text-foreground" onClick={onBack}>
        ← Назад к журналу
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-600 dark:text-sky-400">
            {(data?.display || "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-base font-semibold">{data?.display || "…"}</div>
            <div className="text-[11px] text-muted-foreground">{data?.email || data?.u || ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-input bg-background px-2 py-1.5 text-xs"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={1}>последние 24 часа</option>
            <option value={7}>7 суток</option>
            <option value={30}>30 суток</option>
          </select>
          <button
            className="rounded border border-input bg-background px-3 py-1.5 text-xs hover:bg-muted"
            onClick={exportMd}
            disabled={!data}
          >
            Экспорт .md
          </button>
          <button
            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            onClick={onEvaluate}
          >
            Оценить период
          </button>
        </div>
      </div>

      {error && <div className="rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600">{error}</div>}

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpi("Всего запросов", t ? fnum(t.reqs) : "…")}
        {kpi("Токены", t ? fmtKtok(t.tok) : "…")}
        {kpi("Сессии", t ? fnum(t.sess) : "…", "у скриптов = запросов")}
        {kpi("Обмены", t ? fnum(t.exch) : "…", "по последнему телу сессии")}
        <div className="rounded border border-input bg-card p-3">
          <div className="text-[11px] text-muted-foreground">Топ-модели</div>
          <div className="mt-1 space-y-0.5">
            {(data?.top_models || []).slice(0, 3).map((m) => (
              <div key={m.m} className="flex justify-between text-[11px]">
                <span className="max-w-[8rem] truncate" title={m.m}>
                  {m.m}
                </span>
                <span className="tabular-nums text-muted-foreground">{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex min-h-0 flex-col rounded border border-input bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Журнал сессий</span>
            <span className="text-[10px] text-muted-foreground">
              по времени (Владивосток) · longest {data?.facts.longest_min || 0} мин
              {data?.facts.top_agent ? ` · агент: ${data.facts.top_agent.split("/")[0]}` : ""}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mb-1 text-muted-foreground">
              <Spark values={(data?.daily || []).map((d) => d.n)} />
            </div>
            {(data?.sessions || []).map((s) => (
              <div key={s.sid} className="border-t border-input/40 py-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span className="font-medium tabular-nums">{s.t0}</span>
                  <span className="text-muted-foreground">
                    {s.dur_min >= 60 ? `${Math.floor(s.dur_min / 60)} ч ${s.dur_min % 60} мин` : `${s.dur_min} мин`}
                  </span>
                  <span className="truncate" title={s.model}>
                    {s.model}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{fmtKtok(s.tok)} ток</span>
                  <span className="tabular-nums text-muted-foreground" title="user-реплики в последнем теле сессии">
                    {s.exch} обм. · {s.turns} зап.
                  </span>
                </div>
                {s.first && <div className="mt-0.5 truncate text-xs text-muted-foreground" title={s.first}>{s.first}</div>}
              </div>
            ))}
            {data && !data.sessions.length && <div className="py-4 text-center text-xs text-muted-foreground">нет сессий за период</div>}
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded border border-input bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Анализ ИИ (оценки периодов)</span>
            <span className="text-[10px] text-muted-foreground">летопись · запуск вручную</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {evaluations.length === 0 && (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Оценок пока нет. Нажмите «Оценить период» — модель прочитает дайджест и напишет отчёт (~1 мин).
              </div>
            )}
            {evaluations.map((ev) => (
              <button
                key={ev.id}
                className="mb-1 block w-full rounded border border-input/50 p-2 text-left text-[11px] hover:bg-muted/50"
                onClick={() => toggleEval(ev)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    {ev.created} · {ev.periodDays} сут
                  </span>
                  <span className="text-muted-foreground">{ev.model}</span>
                </div>
                {openEval?.id !== ev.id ? (
                  <div className="mt-0.5 line-clamp-2 text-muted-foreground">{ev.error ? `⚠ ${ev.error}` : ev.preview}</div>
                ) : (
                  <div className="prose prose-xs mt-1 max-w-none text-[11px] [&_p]:text-[11px] [&_li]:text-[11px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullReport || "…"}</ReactMarkdown>
                  </div>
                )}
              </button>
            ))}
            {openEval && openEval.rlen > 200 && (
              <div className="mt-1 text-[10px] text-muted-foreground">отчёт загружен целиком из летописи оценок.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
