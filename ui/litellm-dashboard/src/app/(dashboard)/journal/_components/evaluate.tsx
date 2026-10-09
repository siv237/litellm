"use client";

// fork: слой 2 — ручная «оценка периода» (дайджест → один запрос к выбранной модели); период свой или пресет

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiClient } from "@/components/networking";
import { downloadMd, REPORT_PROSE_CLS, type CellT } from "./shared";

const LS_MODEL = "journal-eval-model";

const pad = (n: number) => String(n).padStart(2, "0");

// epoch ms → «YYYY-MM-DDTHH:MM» по Владивостоку (UTC+10, без DST)
function localIso(ms: number): string {
  return new Date(ms + 10 * 3600_000).toISOString().slice(0, 16);
}

function cellRange(c: CellT): { from: string; to: string } {
  const start = Date.UTC(+c.d.slice(0, 4), +c.d.slice(5, 7) - 1, +c.d.slice(8, 10), c.h);
  return { from: new Date(start).toISOString().slice(0, 16), to: new Date(start + 3600_000).toISOString().slice(0, 16) };
}

interface Props {
  accessToken: string;
  models: string[];
  onClose: () => void;
  onDone: () => void;
  target?: { u?: string; sid?: string; display?: string };
  cell?: CellT | null;
}

export default function EvaluateDialog({ accessToken, models, onClose, onDone, target, cell }: Props) {
  const isSession = !!target?.sid;
  const [custom, setCustom] = useState(!!cell && !isSession);
  const [days, setDays] = useState(isSession ? 7 : 1);
  const init = useMemo(() => (cell && !isSession ? cellRange(cell) : { from: localIso(Date.now() - 86400_000), to: localIso(Date.now()) }), [cell, isSession]);
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
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

  useEffect(() => {
    if (cell && !isSession) {
      const r = cellRange(cell);
      setCustom(true);
      setFrom(r.from);
      setTo(r.to);
    }
  }, [cell, isSession]);

  const pickModel = (m: string) => {
    setModel(m);
    try {
      localStorage.setItem(LS_MODEL, m);
    } catch {
      /* localStorage может быть недоступен */
    }
  };

  const spanDays = (new Date(to).getTime() - new Date(from).getTime()) / 86400_000;
  const customOk = !custom || (from < to && spanDays > 0 && spanDays <= 31);
  const periodTxt = custom ? `${from.replace("T", " ")} → ${to.replace("T", " ")}` : `последние ${days} сут`;

  const run = async () => {
    setBusy(true);
    setError("");
    setReport("");
    try {
      const body = custom
        ? { days: 0, model, u: target?.u || "", sid: target?.sid || "", from: from.replace("T", " "), to: to.replace("T", " ") }
        : { days, model, u: target?.u || "", sid: target?.sid || "" };
      const r = await apiClient.post<{ report: string; error: string; gen_s: number; digest_chars: number }>(
        "/dashboard/journal/evaluate",
        { accessToken, body },
      );
      setReport(r.report || "");
      setError(r.error || "");
      setMeta(`модель ${model} · период ${periodTxt} · дайджест ${r.digest_chars} симв. · генерация ${r.gen_s} с`);
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
              {isSession
                ? `Оценка сессии · ${target?.display || ""}`
                : cell
                  ? `Оценка · кирпич ${cell.d.slice(5)} ${pad(cell.h)}:00`
                  : target?.u
                    ? `Оценка периода · ${target.display}`
                    : "Оценка периода"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isSession
                ? "дайджест сессии → один запрос к модели. Запуск только вручную."
                : cell
                  ? "период подставлен по кирпичику тепловой карты — начало и конец можно поменять"
                  : "дайджест журнала → один запрос к модели → отчёт «кто чем занят». Запуск только вручную."}
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
              value={custom ? "custom" : days}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustom(true);
                  setFrom(localIso(Date.now() - 86400_000));
                  setTo(localIso(Date.now()));
                } else {
                  setCustom(false);
                  setDays(Number(e.target.value));
                }
              }}
              disabled={busy || isSession}
            >
              <option value={1}>последние 24 часа</option>
              <option value={3}>3 суток</option>
              <option value={7}>7 суток</option>
              {!isSession && <option value="custom">свой период…</option>}
            </select>
          </label>
          {custom && (
            <>
              <input
                type="datetime-local"
                className="rounded border border-input bg-background px-2 py-1 text-xs tabular-nums"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={busy}
                title="начало (Владивосток)"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="datetime-local"
                className="rounded border border-input bg-background px-2 py-1 text-xs tabular-nums"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={busy}
                title="конец (Владивосток)"
              />
              {!customOk && <span className="text-[10px] text-red-500">проверьте границы (≤ 31 сут)</span>}
            </>
          )}
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
            disabled={busy || !model || !customOk}
          >
            {busy ? "генерация ~1 мин…" : "Оценить"}
          </button>
          {report && !busy && (
            <button
              className="rounded border border-input px-3 py-1.5 text-xs hover:bg-muted/50"
              onClick={() =>
                downloadMd(
                  `ai-otsenka-${(target?.u || target?.sid || "period").slice(0, 24)}-${periodTxt.replace(/[^0-9A-Za-zА-Яа-я.]+/g, "-")}.md`,
                  `# Оценка ИИ · ${target?.display || target?.u || target?.sid || "период журнала"} · ${periodTxt}\n\nмодель ${model}${meta ? ` · ${meta}` : ""}\n\n---\n\n${report}`,
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
