import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import CreateMCPСервер from "./CreateMCPСервер";
import { selectOption } from "./testUtils";

vi.mock("@/components/networking", () => ({
  createMCPСервер: vi.fn(),
  fetchOpenAPIRegistry: vi.fn().mockResolvedЗначение({ apis: [] }),
  registerMCPСервер: vi.fn(),
  storeMCPOAuthUserCredential: vi.fn().mockResolvedЗначение({}),
  testMCPИнструментыListЗапрос: vi.fn().mockResolvedЗначение({ tools: [], error: null }),
}));

vi.mock("@/utils/mcpТокенStore", () => ({
  setТокен: vi.fn(),
}));

vi.mock("./OpenAPIQuickPicker", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useMcpOAuthFlow", () => ({
  useMcpOAuthFlow: () => ({
    startOAuthFlow: vi.fn(),
    status: "idle",
    error: null,
    tokenОтвет: null,
    reset: vi.fn(),
  }),
}));

vi.mock("./mcp_server_cost_config", () => ({
  default: () => <div data-testid="mcp-cost-config" />,
}));

vi.mock("./mcp_tool_configuration", () => ({
  default: () => <div data-testid="mcp-инструмента-config" />,
}));

vi.mock("./mcp_connection_status", () => ({
  default: () => <div data-testid="mcp-connection-status" />,
}));

vi.mock("./StdioКонфигурацияuration", () => ({
  default: () => <div data-testid="stdio-config" />,
}));

const defaultProps = {
  userRole: "Admin",
  accessТокен: "test-token",
  onCreateSuccess: vi.fn(),
  isModalVisible: true,
  setModalVisible: vi.fn(),
  availableAccessGroups: ["group-a", "group-b"],
};

const getСерверNameВход = () => document.getElementById("server_name") as HTMLВходElement;

// The switches live behind a collapsed panel, so they only reach the accessibility tree once an
// operator expands it.
const expandPermissionPanel = async (): Promise<void> => {
  const trigger = screen.getByRole("button", { name: /Permission Management/ });
  if (trigger.getAttribute("aria-expanded") !== "true") {
    await userEvent.setup({ delay: null }).click(trigger);
  }
};

const switchFor = async (labelText: string): Promise<HTMLElement> => {
  await expandPermissionPanel();
  return screen.getByRole("switch", { name: labelText });
};

const fillМин.imalHttpСервер = async (name: string) => {
  await selectOption("Транспорт Type", "Streamable HTTP");
  await waitFor(() => {
    expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
  });
  const user = userEvent.setup({ delay: null });
  await user.type(getСерверNameВход(), name);
  await user.type(screen.getByPlaceholderText("https://your-mcp-server.com"), "https://example.com/mcp");
  await selectOption("Аутентификация", "None");
};

const submitAndReadPayload = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
  });
  await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
  return vi.mocked(networking.createMCPСервер).mock.calls[0][1];
};

const createdСервер = {
  server_id: "new-server-1",
  server_name: "Perm_Сервер",
  alias: "Perm_Сервер",
  url: "https://example.com/mcp",
  transport: "http",
  auth_type: "none",
  created_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-01T00:00:00Z",
  updated_by: "user-1",
};

describe("CreateMCPСервер permission toggles reaching the payload", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение(createdСервер);
  });

  it("sends the panel's untouched defaults rather than dropping the keys the panel owns", async () => {
    render(<CreateMCPСервер {...defaultProps} />);
    await fillМин.imalHttpСервер("Perm_Сервер");

    const payload = await submitAndReadPayload();

    expect(payload.allow_all_keys).toBe(false);
    expect(payload.available_on_public_internet).toBe(true);
  });

  it("sends allow_all_keys true once the operator turns the public-to-all-keys switch on", async () => {
    render(<CreateMCPСервер {...defaultProps} />);
    await fillМин.imalHttpСервер("Perm_Сервер");

    const allowВсеКлючи = await switchFor("Разрешить Все LiteLLM ключей");
    await act(async () => {
      fireEvent.click(allowВсеКлючи);
    });

    const payload = await submitAndReadPayload();

    expect(payload.allow_all_keys).toBe(true);
  });

  it("sends available_on_public_internet false when the operator restricts the server to the internal network", async () => {
    render(<CreateMCPСервер {...defaultProps} />);
    await fillМин.imalHttpСервер("Perm_Сервер");

    const internalOnly = await switchFor("Internal network only");
    expect(internalOnly).toHaveAttribute("aria-checked", "false");

    await act(async () => {
      fireEvent.click(internalOnly);
    });
    expect(internalOnly).toHaveAttribute("aria-checked", "true");

    const payload = await submitAndReadPayload();

    expect(payload.available_on_public_internet).toBe(false);
  });

  it("omits delegate_auth_to_upstream's true value on a none-auth server, whose gate never mounts that switch", async () => {
    render(<CreateMCPСервер {...defaultProps} />);
    await fillМин.imalHttpСервер("Perm_Сервер");

    expect(screen.getByText("Разрешить Все LiteLLM ключей")).toBeInTheDocument();
    expect(screen.queryByText("Delegate auth to upstream (PKCE passthrough)")).not.toBeInTheDocument();

    const payload = await submitAndReadPayload();

    expect(payload.delegate_auth_to_upstream).toBe(false);
  });
});
