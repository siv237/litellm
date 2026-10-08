"use client";

// fork: слой 2 — ручная «оценка периода» (дайджест → один запрос к выбранной модели)

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "@/components/networking";

interface Props {
  accessToken: string;
  models: string[];
  onClose: () => void;
  onDone: () => void;
}

export default function EvaluateDialog({ accessToken, models, onClose, onDone }: Props) {
  const [days, setDays] = useState(1);
  const [model, setModel] = useState(models[0] || "");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [meta, setMeta] = useState("");

  const run = async () => {
    setBusy(true);
    setError("");
    setReport("");
    try {
      const r = await apiClient.post<{ report: string; error: string; gen_s: number; digest_chars: number }>(
        "/dashboard/journal/evaluate",
        { accessToken, body: { days, model } },
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
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-input bg-card p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Оценка периода</div>
            <div className="text-[11px] text-muted-foreground">
              дайджест журнала → один запрос к модели → отчёт «кто чем занят». Запуск только вручную, окно ≤ 7 суток.
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
              onChange={(e) => setModel(e.target.value)}
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
        </div>

        {error && <div className="mb-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">{error}</div>}

        <div className="prose prose-sm dark:prose-invert max-h-[55vh] max-w-none flex-1 overflow-y-auto rounded border border-input/50 bg-background p-3 text-xs [&_p]:text-xs [&_li]:text-xs">
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
