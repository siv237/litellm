"use client";

// fork: слой 2 — ручная «оценка периода» (дайджест → один запрос к выбранной модели)

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "@/components/networking";
import { downloadMd, REPORT_PROSE_CLS } from "./shared";

const LS_MODEL = "journal-eval-model";

interface Props {
  accessToken: string;
  models: string[];
  onClose: () => void;
  onDone: () => void;
  target?: { u?: string; sid?: string; display?: string };
}

export default function EvaluateDialog({ accessToken, models, onClose, onDone, target }: Props) {
  const isSession = !!target?.sid;
  const [days, setDays] = useState(isSession ? 7 : 1);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [meta, setMeta] = useState("");

  useEffect(() => {
    if (model && models.includes(model)) return;
    let saved = "";
    try {
      saved = localStorage.getItem(LS_MODEL) || "";
    } catch {
      /* localStorage может быть недоступен */
    }
    setModel(saved && models.includes(saved) ? saved : models[0] || "");
  }, [models, model]);

  const pickModel = (m: string) => {
    setModel(m);
    try {
      localStorage.setItem(LS_MODEL, m);
    } catch {
      /* localStorage может быть недоступен */
    }
  };

  const run = async () => {
    setBusy(true);
    setError("");
    setReport("");
    try {
      const r = await apiClient.post<{ report: string; error: string; gen_s: number; digest_chars: number }>(
        "/dashboard/journal/evaluate",
        { accessToken, body: { days, model, u: target?.u || "", sid: target?.sid || "" } },
      );
      setReport(r.report || "");
      setError(r.error || "");
      setMeta(`модель ${model} · дайджест ${r.digest_chars} симв. · генерация ${r.gen_s} с`);
      onDone();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={busy ? undefined : onClose}>
      <div
        className="flex h-[80vh] w-[80vw] max-w-[1400px] flex-col rounded-lg border border-input bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">
              {isSession ? `Оценка сессии · ${target?.display || ""}` : target?.u ? `Оценка периода · ${target.display}` : "Оценка периода"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isSession ? "дайджест сессии → один запрос к модели. Запуск только вручную." : "дайджест журнала → один запрос к модели → отчёт «кто чем занят». Запуск только вручную, окно ≤ 7 суток."}
            </div>
          </div>
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={onClose} disabled={busy}>
            ✕
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            Период
            <select
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              disabled={busy}
            >
              <option value={1}>последние 24 часа</option>
              <option value={3}>3 суток</option>
              <option value={7}>7 суток</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            Модель
            <select
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              value={model}
              onChange={(e) => pickModel(e.target.value)}
              disabled={busy}
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={run}
            disabled={busy || !model}
          >
            {busy ? "генерация ~1 мин…" : "Оценить"}
          </button>
          {report && !busy && (
            <button
              className="rounded border border-input px-3 py-1.5 text-xs hover:bg-muted/50"
              onClick={() =>
                downloadMd(
                  `ai-otsenka-${target?.u || target?.sid || "period"}-${days}d.md`,
                  `# Оценка ИИ · ${target?.display || target?.u || target?.sid || "период журнала"} · ${days} сут\n\nмодель ${model}${meta ? ` · ${meta}` : ""}\n\n---\n\n${report}`,
                )
              }
            >
              Скачать .md
            </button>
          )}
        </div>

        {error && <div className="mb-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">{error}</div>}

        <div className={`${REPORT_PROSE_CLS} min-h-0 flex-1 overflow-y-auto rounded border border-input/50 bg-background p-5`}>
          {report ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          ) : busy ? (
            <span className="text-muted-foreground">Модель читает дайджест и пишет отчёт…</span>
          ) : (
            <span className="text-muted-foreground">Настройте период и модель и нажмите «Оценить».</span>
          )}
        </div>
        {meta && <div className="mt-2 text-[10px] text-muted-foreground">{meta}</div>}
      </div>
    </div>
  );
}
