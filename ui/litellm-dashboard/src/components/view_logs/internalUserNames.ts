import type { LogEntry } from "./columns";

// user_id -> display name resolved from the proxy DB (`GET /gantt/users`), never
// hardcoded in the product. Operators may also pre-set
// `window.__LITELLM_INTERNAL_USER_NAMES` before app load; it wins over the API.
// Unknown ids (including service accounts like default_user_id) print as-is.
let NAMES: Record<string, string> =
  (typeof window !== "undefined" &&
    (window as unknown as { __LITELLM_INTERNAL_USER_NAMES?: Record<string, string> })
      .__LITELLM_INTERNAL_USER_NAMES) ||
  {};

let fetchStarted = false;

function startUserMapFetch(): void {
  if (fetchStarted) return;
  fetchStarted = true;
  import("../networking")
    .then(({ apiClient }) => apiClient.get<{ users?: Record<string, string> }>("/gantt/users"))
    .then((data) => {
      if (data?.users) NAMES = { ...data.users, ...NAMES };
    })
    .catch(() => {
      fetchStarted = false; // allow retry on next render path
    });
}

export function getInternalUserDisplay(log: LogEntry): string | undefined {
  const raw = log.user;
  if (raw === undefined) return undefined;
  if (Object.keys(NAMES).length === 0) startUserMapFetch();
  return NAMES[raw] ?? raw;
}
