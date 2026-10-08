// fork: общий слой данных панели «Журнал активности» (admin-only, v1 08.10.2026)

export interface CellT {
  d: string;
  h: number;
  n: number;
  tok: number;
  ppl: number;
}

export interface ParticipantT {
  u: string;
  display: string;
  type: "human" | "system" | "anon";
  reqs: number;
  tok: number;
  sess: number;
  exch: number;
  hours: string;
  models: string;
  t_first: string;
  t_last: string;
}

export interface RecentT {
  u: string;
  display: string;
  t: string;
  txt: string;
  turns: number;
}

export interface StateResponse {
  days: number;
  tz: string;
  now: number;
  cells: CellT[];
  totals: {
    reqs: number;
    tok: number;
    people: number;
    systems: number;
    participants: number;
    peak_hour: number | null;
    prev_reqs: number;
    prev_tok: number;
    prev_people: number;
  };
  participants: ParticipantT[];
  recent: RecentT[];
  models: string[];
}

export interface SessionT {
  sid: string;
  t0: string;
  t1: string;
  dur_min: number;
  turns: number;
  exch: number;
  tok: number;
  model: string;
  agent: string;
  first: string;
}

export interface UserResponse {
  u: string;
  display: string;
  email: string;
  days: number;
  tz: string;
  totals: { reqs: number; tok: number; sess: number; exch: number };
  daily: { d: string; n: number; tok: number }[];
  top_models: { m: string; n: number; pct: number }[];
  sessions: SessionT[];
  facts: { longest_min: number; top_agent: string };
}

export interface EvaluationT {
  id: number;
  created: string;
  periodDays: number;
  model: string;
  digestChars: number;
  rlen: number;
  error: string;
  createdBy: string;
  preview: string;
}

export function fnum(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function fmtKtok(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}

// стабильный оттенок участнику по рангу (золотой угол — как в Мониторинге)
export function userHues(displays: string[]): Map<string, number> {
  const m = new Map<string, number>();
  [...displays].sort().forEach((d, i) => m.set(d, Math.round((i * 137.508) % 360)));
  return m;
}

export const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  human: {
    label: "Человек",
    cls: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  system: {
    label: "Система",
    cls: "border-border bg-muted text-muted-foreground",
  },
  anon: {
    label: "Аноним",
    cls: "border-border bg-muted/50 text-muted-foreground",
  },
};

export function fmtDelta(cur: number, prev: number): { txt: string; up: boolean } | null {
  if (!prev) return null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { txt: `${p >= 0 ? "↑" : "↓"} ${Math.abs(p)}%`, up: p >= 0 };
}
