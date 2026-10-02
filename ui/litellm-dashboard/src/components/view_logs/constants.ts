export const ERROR_CODE_OPTIONS: { label: string; value: string }[] = [
  { label: "400 — неверный запрос", value: "400" },
  { label: "401 — неверная аутентификация", value: "401" },
  { label: "403 — доступ запрещён", value: "403" },
  { label: "404 — не найдено", value: "404" },
  { label: "408 — тайм-аут запроса", value: "408" },
  { label: "422 — необработываемая сущность", value: "422" },
  { label: "429 — превышен лимит запросов", value: "429" },
  { label: "500 — внутренняя ошибка сервера", value: "500" },
  { label: "502 — неверный шлюз", value: "502" },
  { label: "503 — сервис недоступен", value: "503" },
  { label: "529 — перегрузка", value: "529" },
];

/** Call types that represent MCP tool invocations (shared across columns, index, drawer). */
export const MCP_CALL_TYPES = ["call_mcp_tool", "list_mcp_tools"];

/** Call types that represent agent/A2A requests (e.g. asend_message). */
export const AGENT_CALL_TYPES = ["asend_message"];

/** Call types that represent Batch API operations (creation and retrieval, sync and async). */
export const BATCH_CALL_TYPES = ["acreate_batch", "create_batch", "aretrieve_batch", "retrieve_batch"];

export const QUICK_SELECT_OPTIONS: { label: string; value: number; unit: string }[] = [
  { label: "Последняя минута", value: 1, unit: "minutes" },
  { label: "Последние 15 минут", value: 15, unit: "minutes" },
  { label: "Последний час", value: 1, unit: "hours" },
  { label: "Последние 4 часа", value: 4, unit: "hours" },
  { label: "Последние 24 часа", value: 24, unit: "hours" },
  { label: "Последние 7 дней", value: 7, unit: "days" },
];
