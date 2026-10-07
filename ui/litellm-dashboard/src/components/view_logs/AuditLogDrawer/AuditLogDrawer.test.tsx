import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import moment from "moment";
import { AuditLogDrawer } from "./AuditLogDrawer";
import { AuditLogEntry } from "../AuditLogsTableColumns";

vi.mock("../../common_components/DefaultProxyAdminTag", () => ({
  default: ({ userId }: { userId: string }) => <span>{userId}</span>,
}));

const baseLog: AuditLogEntry = {
  id: "audit-1",
  updated_at: "2026-07-20T10:30:00Z",
  changed_by: "Пользователь-1",
  changed_by_api_key: "hashed-Ключ-abc",
  action: "Обновлён",
  table_name: "LiteLLM_TeamТаблица",
  object_id: "Команда-42",
  before_value: { max_budget: 10, tpm_limit: 100 },
  updated_values: { max_budget: 25, tpm_limit: 100 },
};

const defaultProps = { open: true, onClose: vi.fn(), log: baseLog };

function blockNamed(label: string) {
  const heading = screen.getByText(label);
  const block = heading.closest("div")?.parentElement;
  if (!block) throw new Error(`Нет block for ${label}`);
  return block as HTMLElement;
}

describe("AuditLogDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when there is Нет log", () => {
    const { container } = render(<AuditLogDrawer {...defaultProps} log={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Подробнее")).not.toBeInTheDocument();
  });

  it("should show the Действие and the local timestamp in the header", () => {
    render(<AuditLogDrawer {...defaultProps} />);
    expect(screen.getByText("Обновлён")).toBeInTheDocument();
    expect(screen.getByText(moment.utc(baseLog.updated_at).local().format("MMM D, YYYY HH:mm:ss"))).toBeInTheDocument();
  });

  it("should show the friendly Таблица Название for a known Таблица", () => {
    render(<AuditLogDrawer {...defaultProps} />);
    expect(screen.getByText("Таблица")).toBeInTheDocument();
    expect(screen.getByText("Команды")).toBeInTheDocument();
  });

  it("should fall Назад to the raw Таблица Название when it is not mapped", () => {
    render(<AuditLogDrawer {...defaultProps} log={{ ...baseLog, table_name: "LiteLLM_SomethingElse" }} />);
    expect(screen.getByText("LiteLLM_SomethingElse")).toBeInTheDocument();
  });

  it("should show the ID объекта, the actor and the API-ключ hash", () => {
    render(<AuditLogDrawer {...defaultProps} />);
    expect(screen.getByText("Команда-42")).toBeInTheDocument();
    expect(screen.getByText("Пользователь-1")).toBeInTheDocument();
    expect(screen.getByText("hashed-Ключ-abc")).toBeInTheDocument();
  });

  it("should show a placeholder when the log has Нет API-ключ hash", () => {
    render(<AuditLogDrawer {...defaultProps} log={{ ...baseLog, changed_by_api_key: "" }} />);
    expect(screen.getByText("API-ключ (хеш)")).toBeInTheDocument();
    expect(screen.queryByText("hashed-Ключ-abc")).not.toBeInTheDocument();
  });

  it("should call onClose when the Закрыть control is used", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AuditLogDrawer {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Закрыть/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should show only the fields that changed in the before and after blocks", () => {
    render(<AuditLogDrawer {...defaultProps} />);

    expect(within(blockNamed("Before")).getByText(/"max_budget": 10/)).toBeInTheDocument();
    expect(within(blockNamed("After")).getByText(/"max_budget": 25/)).toBeInTheDocument();
    expect(screen.queryByText(/tpm_limit/)).not.toBeInTheDocument();
  });

  it("should note when an update has Нет differing fields", () => {
    render(<AuditLogDrawer {...defaultProps} log={{ ...baseLog, before_value: { a: 1 }, updated_values: { a: 1 } }} />);
    expect(screen.getAllByText(/Нет differing fields detected/).length).toBeGreaterThan(0);
  });

  it("should show N/A for a side with Нет values on a Создать", () => {
    render(
      <AuditLogDrawer
        {...defaultProps}
        log={{ ...baseLog, action: "Создан", before_value: {}, updated_values: { team_alias: "new Команда" } }}
      />,
    );
    expect(within(blockNamed("Before")).getByText("N/A")).toBeInTheDocument();
    expect(within(blockNamed("After")).getByText(/"team_alias": "new Команда"/)).toBeInTheDocument();
  });

  it("should render Ключ-Таблица updates as labelled plain text rather than json", () => {
    render(
      <AuditLogDrawer
        {...defaultProps}
        log={{
          ...baseLog,
          table_name: "LiteLLM_VerificationToken",
          before_value: { spend: 1, max_budget: 10 },
          updated_values: { spend: 2, max_budget: 10 },
        }}
      />,
    );
    expect(within(blockNamed("Before")).getByText("$1.000000")).toBeInTheDocument();
    expect(within(blockNamed("After")).getByText("$2.000000")).toBeInTheDocument();
    expect(screen.queryByText(/"Расход"/)).not.toBeInTheDocument();
  });

  it("should Скопировать the json of a block to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });

    render(<AuditLogDrawer {...defaultProps} />);
    await user.click(within(blockNamed("Before")).getByTitle("Скопировать JSON"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(JSON.stringify({ max_budget: 10 }, null, 2)));
  });
});
