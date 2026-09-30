import type { LogEntry } from "./columns";

// Optional operator mapping user-id -> display name for the "Internal User" column.
// Ship empty: deployments provide their own mapping at runtime (no personal data in
// the product), e.g. by pre-setting `window.__LITELLM_INTERNAL_USER_NAMES` before app
// load. Unknown ids (including service accounts like default_user_id) print as-is.
const RUNTIME_NAMES: Record<string, string> | undefined =
  typeof window !== "undefined"
    ? (window as unknown as { __LITELLM_INTERNAL_USER_NAMES?: Record<string, string> })
        .__LITELLM_INTERNAL_USER_NAMES
    : undefined;

const INTERNAL_USER_NAMES: Record<string, string> = RUNTIME_NAMES ?? {};

export function getInternalUserDisplay(log: LogEntry): string | undefined {
  const raw = log.user;
  if (raw === undefined) return undefined;
  return INTERNAL_USER_NAMES[raw] ?? raw;
}
