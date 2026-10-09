"use client";

// fork: летопись ИИ-оценок — список карточек + модалка чтения полного отчёта

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "@/components/networking";
import { downloadMd, fnum, periodLabel, REPORT_PROSE_CLS, type EvaluationT } from "./shared";

interface Props {
  accessToken: string;
  items: EvaluationT[];
  empty: string;
}

export default function EvalList({ accessToken, items, empty }: Props) {
  const [open, setOpen] = useState<EvaluationT | null>(null);
  const [fullReport, setFullReport] = useState("");
  const [loading, setLoading] = useState(false);

  const openEval = async (ev: EvaluationT) => {
    setOpen(ev);
    setFullReport("");
    setLoading(true);
    try {
      const r = await apiClient.get<{ report: string }>(`/dashboard/journal/evaluation?id=${ev.id}`, { accessToken });
      setFullReport(r.report || "");
    } catch {
      setFullReport(ev.preview);
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) return <div className="py-4 text-center text-xs text-muted-foreground">{empty}</div>;

  return (
    <>
      <div className="space-y-1.5">
        {items.map((ev) => (
          <button
            key={ev.id}
            className="block w-full rounded border border-input/50 bg-background p-2 text-left text-[11px] hover:border-primary/40 hover:bg-primary/5"
            onClick={() => openEval(ev)}
            title="открыть отчёт целиком"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium tabular-nums">
                период {periodLabel(ev)} · {ev.periodDays} сут{ev.targetSid ? " · сессия" : ""}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">{ev.model}</span>
            </div>
            <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">оценено {ev.created}</div>
            <div className="mt-0.5 line-clamp-2 break-words text-muted-foreground">{ev.error ? `⚠ ${ev.error}` : ev.preview}</div>
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(null)}>
          <div
            className="flex h-[80vh] w-[80vw] max-w-[1400px] flex-col rounded-lg border border-input bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold tabular-nums">
                Анализ ИИ · период {periodLabel(open)} ({open.periodDays} сут){open.targetSid ? " · сессия" : ""}
              </div>
              <button className="shrink-0 text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(null)}>
                ✕
              </button>
            </div>
            <div className="mb-3 text-[11px] text-muted-foreground">
              модель {open.model} · дайджест {fnum(open.digestChars)} симв. · отчёт {fnum(open.rlen)} симв.
              {open.createdBy && ` · создал ${open.createdBy}`}
            </div>
            {open.error && (
              <div className="mb-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">{open.error}</div>
            )}
            <div className={`${REPORT_PROSE_CLS} min-h-0 flex-1 overflow-y-auto rounded border border-input/50 bg-background p-5`}>
              {loading ? <span className="text-muted-foreground">загрузка отчёта…</span> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullReport}</ReactMarkdown>}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="rounded border border-input px-3 py-1.5 text-xs hover:bg-muted/50"
                onClick={() =>
                  downloadMd(
                    `ai-otsenka-${periodLabel(open).replace(/[ :→]+/g, "-")}.md`,
                    `# Анализ ИИ · период ${periodLabel(open)} (${open.periodDays} сут)\n\nмодель ${open.model} · оценено ${open.created}\n\n---\n\n${fullReport}`,
                  )
                }
                disabled={loading || !fullReport}
              >
                Скачать .md
              </button>
              <button className="rounded border border-input px-3 py-1.5 text-xs hover:bg-muted/50" onClick={() => setOpen(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
