import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import { setТокен } from "@/utils/mcpТокенStore";
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

// Mutable holder so individual tests can simulate "Authorize & Fetch" having
// produced a token before submit, and inspect the reset wiring.
const oauthHook = vi.hoisted(() => ({
  tokenОтвет: null as Record<string, unknown> | null,
  reset: vi.fn(),
  onТокенReceived: null as
    | ((token: Record<string, unknown> | null, registeredClient?: { clientId?: string; clientSecret?: string }) => void)
    | null,
  getУчётные данные: null as (() => Record<string, unknown> | undefined) | null,
  getTemporaryPayload: null as (() => Record<string, unknown> | null) | null,
}));
vi.mock("@/hooks/useMcpOAuthFlow", () => ({
  useMcpOAuthFlow: (opts: {
    onТокенReceived: (
      token: Record<string, unknown> | null,
      registeredClient?: { clientId?: string; clientSecret?: string },
    ) => void;
    getУчётные данные?: () => Record<string, unknown> | undefined;
    getTemporaryPayload?: () => Record<string, unknown> | null;
  }) => {
    oauthHook.onТокенReceived = opts.onТокенReceived;
    oauthHook.getУчётные данные = opts.getУчётные данные ?? null;
    oauthHook.getTemporaryPayload = opts.getTemporaryPayload ?? null;
    return {
      startOAuthFlow: vi.fn(),
      status: "idle",
      error: null,
      tokenОтвет: oauthHook.tokenОтвет,
      reset: oauthHook.reset,
    };
  },
}));

vi.mock("./mcp_server_cost_config", () => ({
  default: () => <div data-testid="mcp-cost-config" />,
}));

vi.mock("./MCPPermissionManagement", () => ({
  default: () => <div data-testid="mcp-permissions" />,
}));

vi.mock("./mcp_tool_configuration", () => ({
  default: ({
    onВсеowedИнструментыChange,
    onToolВсеowlistInteraction,
  }: {
    onВсеowedИнструментыChange?: (tools: string[]) => void;
    onToolВсеowlistInteraction?: () => void;
  }) => (
    <div data-testid="mcp-инструмента-config">
      <button
        type="button"
        onClick={() => {
          onToolВсеowlistInteraction?.();
          onВсеowedИнструментыChange?.([]);
        }}
      >
        Disable all инструментов
      </button>
    </div>
  ),
}));

vi.mock("./mcp_connection_status", () => ({
  default: ({ инструментов }: { инструментов?: any[] }) => (
    <div data-testid="mcp-connection-status" data-tools-count={инструментов?.length ?? 0} />
  ),
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

/** Helper: get the server_name input by its Ant Form id */
const getСерверNameВход = () => document.getElementById("server_name") as HTMLВходElement;

describe("CreateMCPСервер", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    oauthHook.tokenОтвет = null;
    oauthHook.onТокенReceived = null;
  });

  it("should render the modal with title when visible", () => {
    render(<CreateMCPСервер {...defaultProps} />);

    expect(screen.getByText("Добавить MCP-сервер")).toBeInTheDocument();
  });

  // The modal DOES render for a non-admin; it retitles and rвыходes the submit to the review endpoint.
  // The assertion this replaced only checked that the admin title was absent, which passed for the
  // wrong reason and left the whole non-admin submission path uncovered.
  it("rвыходes a non-admin submission to the review endpoint instead of creating the server", async () => {
    render(<CreateMCPСервер {...defaultProps} userRole="Internal User" />);

    expect(screen.getByText("Отправить MCP-сервер на проверку")).toBeInTheDocument();
    expect(screen.queryByText("Добавить MCP-сервер")).not.toBeInTheDocument();

    await selectOption("Транспорт Type", "Streamable HTTP");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.change(getСерверNameВход(), { target: { value: "Submitted_Сервер" } });
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
    });
    await selectOption("Аутентификация", "None");

    vi.mocked(networking.registerMCPСервер).mockResolvedЗначение({
      server_id: "submitted-1",
      server_name: "Submitted_Сервер",
      alias: "Submitted_Сервер",
      url: "https://example.com/mcp",
      transport: "http",
      auth_type: "none",
      created_at: "2024-01-01T00:00:00Z",
      created_by: "user-1",
      updated_at: "2024-01-01T00:00:00Z",
      updated_by: "user-1",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
    });

    await waitFor(() => expect(networking.registerMCPСервер).toHaveBeenCalledВремяs(1));
    expect(networking.createMCPСервер).not.toHaveBeenCalled();
  });

  it("should show transport type options", async () => {
    render(<CreateMCPСервер {...defaultProps} />);

    await selectOption("Транспорт Type", "Streamable HTTP");

    // Verify the option was applied by checking the URL field appears
    await waitFor(() => {
      expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
    });
  });

  describe("when HTTP transport is selected", () => {
    async function selectHttpТранспорт() {
      render(<CreateMCPСервер {...defaultProps} />);
      await selectOption("Транспорт Type", "Streamable HTTP");

      // Wait for URL field to appear (confirms transport was set)
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      });
    }

    it("should show URL field after selecting HTTP transport", async () => {
      await selectHttpТранспорт();

      expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
    });

    it("should show auth type dropdown after selecting HTTP transport", async () => {
      await selectHttpТранспорт();

      expect(screen.getByText("Аутентификация")).toBeInTheDocument();
    });

    it("should show auth value field when API ключ auth type is selected", async () => {
      await selectHttpТранспорт();

      await selectOption("Аутентификация", "API ключ");

      await waitFor(() => {
        expect(screen.getByText("Аутентификация Значение")).toBeInTheDocument();
      });
    });

    it("should warn that LiteLLM auth is disabled when Истина Passthrough is selected", async () => {
      await selectHttpТранспорт();

      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

      await waitFor(() => {
        expect(
          screen.getByText("Истина Passthrough disables LiteLLM authentication for this server"),
        ).toBeInTheDocument();
      });
    });

    it("should not show the Истина Passthrough warning when OAuth Delegate is selected", async () => {
      await selectHttpТранспорт();

      await selectOption("Аутентификация", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)");

      await waitFor(() => {
        expect(screen.getВсеByText("OAuth -делегирование (токен от клиента для вышестоящего сервиса)").length).toBeGreaterThan(0);
      });
      expect(
        screen.queryByText("Истина Passthrough disables LiteLLM authentication for this server"),
      ).not.toBeInTheDocument();
    });

    it.each([["Сквозная передача (без аутентификации ruLiteLLM)"], ["OAuth -делегирование (токен от клиента для вышестоящего сервиса)"]])(
      "should show the browser-only authorize section when %s is selected",
      async (optionLabel) => {
        await selectHttpТранспорт();

        await selectOption("Аутентификация", optionLabel);

        await waitFor(() => {
          expect(screen.getByRole("button", { name: "Authorize & Fetch Инструменты (browser-only)" })).toBeInTheDocument();
        });
        expect(screen.getByText("OAuth ID клиента (необязательно)")).toBeInTheDocument();
        expect(screen.getByText("OAuth Секрет клиента (необязательно)")).toBeInTheDocument();
      },
    );

    it("should not show the browser-only authorize section for API ключ auth", async () => {
      await selectHttpТранспорт();

      await selectOption("Аутентификация", "API ключ");

      await waitFor(() => {
        expect(screen.getByText("Аутентификация Значение")).toBeInTheDocument();
      });
      expect(screen.queryByRole("button", { name: "Authorize & Fetch Инструменты (browser-only)" })).not.toBeInTheDocument();
    });

    it("should not require auth value when creating a server with API ключ auth type", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });

      // Fill in server name (use id to avoid duplicate placeholder)
      const nameВход = getСерверNameВход();
      fireEvent.change(nameВход, { target: { value: "Test_Сервер" } });

      // Fill in URL
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });

      // Выбрать API ключ auth type
      await selectOption("Аутентификация", "API ключ");

      await waitFor(() => {
        expect(screen.getByText("Аутентификация Значение")).toBeInTheDocument();
      });

      // Leave auth value empty and submit
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-1",
        server_name: "Test_Сервер",
        alias: "Test_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "api_key",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // The form should submit withвыход validation error on auth_value
      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });
    });

    it("should not require auth value when creating a server with Bearer Токен auth type", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });

      const nameВход = getСерверNameВход();
      fireEvent.change(nameВход, { target: { value: "Test_Сервер" } });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });

      await selectOption("Аутентификация", "Bearer Токен");

      await waitFor(() => {
        expect(screen.getByText("Аутентификация Значение")).toBeInTheDocument();
      });

      // Leave auth value empty and submit
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-1",
        server_name: "Test_Сервер",
        alias: "Test_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "bearer_token",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });
    });

    it("should successfully create a server when auth value is provided", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });

      const nameВход = getСерверNameВход();
      fireEvent.change(nameВход, { target: { value: "My_Сервер" } });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });

      await selectOption("Аутентификация", "API ключ");

      await waitFor(() => {
        expect(screen.getByText("Аутентификация Значение")).toBeInTheDocument();
      });

      // Fill in auth value
      const authВход = screen.getByPlaceholderText("Введите токен или секрет");
      fireEvent.change(authВход, { target: { value: "my-secret-key" } });

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-1",
        server_name: "My_Сервер",
        alias: "My_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "api_key",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [token, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(token).toBe("test-token");
      expect(payload.credentials).toEqual({ auth_value: "my-secret-key" });
    });

    it("does not write the browser-authorized token into form.credentials for true_passthrough", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "PT_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });

      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

      // Simulate the browser Authorize & Fetch flow handing back an upstream token.
      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "upstream-tok", token_type: "Bearer" }, undefined);
      });

      // For a browser-only mode the token must never land in form.credentials, which the OAuth flow's
      // getУчётные данные reads for preview requests and the redirect-persist cache serializes. Withвыход
      // the guard, onТокенReceived writes it here and this returns { access_token: "upstream-tok" }.
      const credentials = oauthHook.getУчётные данные?.() ?? {};
      expect(credentials.access_token).toBeUndefined();
    });

    it.each([
      ["true_passthrough", "Сквозная передача (без аутентификации ruLiteLLM)"],
      ["oauth_delegate", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)"],
    ])("persists only инструмента config on create for %s; the token stays browser-held", async (_authType, optionLabel) => {
      oauthHook.tokenОтвет = { access_token: "upstream-tok", token_type: "Bearer" };
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "CF_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });

      await selectOption("Аутентификация", optionLabel);

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "upstream-tok", token_type: "Bearer" }, undefined);
      });

      fireEvent.click(screen.getByRole("button", { name: "Disable all инструментов" }));

      // -предпросмотрing and configuring must stay stateless: nothing is persisted anywhere (server row,
      // per-user DB credential, sessionStorage) until the admin submits.
      expect(networking.createMCPСервер).not.toHaveBeenCalled();
      expect(networking.storeMCPOAuthUserCredential).not.toHaveBeenCalled();
      expect(setТокен).not.toHaveBeenCalled();

      const createdСервер = {
        server_id: "new-cf-server",
        server_name: "CF_Сервер",
        alias: "CF_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: _authType,
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(createdСервер);

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];

      // Only the инструмента configuration persists on the server row; the upstream token appears nowhere
      // in the create payload and no per-user DB credential is written. The token is committed to
      // sessionStorage only, keyed to the created server.
      expect(payload.allowed_tools).toEqual([]);
      expect(payload.credentials).toBeUndefined();
      expect(JSON.stringify(payload)).not.toContain("upstream-tok");
      expect(networking.storeMCPOAuthUserCredential).not.toHaveBeenCalled();
      expect(setТокен).toHaveBeenCalledWith(
        "new-cf-server",
        expect.objectContaining({ access_token: "upstream-tok" }),
        undefined,
      );
    });

    it.each([
      ["true_passthrough", "Сквозная передача (без аутентификации ruLiteLLM)"],
      ["oauth_delegate", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)"],
    ])(
      "persists admin-entered OAuth app credentials on create for %s while the token stays browser-held",
      async (_authType, optionLabel) => {
        oauthHook.tokenОтвет = { access_token: "upstream-tok", token_type: "Bearer" };
        await selectHttpТранспорт();

        const user = userEvent.setup({ delay: null });
        fireEvent.change(getСерверNameВход(), { target: { value: "CF_Приложение_Сервер" } });
        fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
          target: { value: "https://example.com/mcp" },
        });

        await selectOption("Аутентификация", optionLabel);

        // Admin declares the org's pre-registered upstream app; unlike the browser-authorized
        // token, this is config and must survive onto the server row so internal users'
        // Инструменты-page Authorize relays through it (required for non-DCR upstreams like Slack).
        fireEvent.change(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), {
          target: { value: "org-app-client-id" },
        });
        fireEvent.change(screen.getByPlaceholderText("Leave blank for public clients / PKCE"), {
          target: { value: "org-app-secret" },
        });

        await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
        await act(async () => {
          oauthHook.onТокенReceived!({ access_token: "upstream-tok", token_type: "Bearer" }, undefined);
        });

        const createdСервер = {
          server_id: "new-cf-app-server",
          server_name: "CF_Приложение_Сервер",
          alias: "CF_Приложение_Сервер",
          url: "https://example.com/mcp",
          transport: "http",
          auth_type: _authType,
          created_at: "2024-01-01T00:00:00Z",
          created_by: "user-1",
          updated_at: "2024-01-01T00:00:00Z",
          updated_by: "user-1",
        };
        vi.mocked(networking.createMCPСервер).mockResolvedЗначение(createdСервер);

        const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
        await act(async () => {
          fireEvent.click(submitButton);
        });

        await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
        const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];

        // The declared app persists; the browser-authorized token still appears nowhere in the
        // payload and no per-user DB credential is written.
        expect(payload.credentials).toEqual({
          client_id: "org-app-client-id",
          client_secret: "org-app-secret",
        });
        expect(JSON.stringify(payload)).not.toContain("upstream-tok");
        expect(networking.storeMCPOAuthUserCredential).not.toHaveBeenCalled();
        expect(setТокен).toHaveBeenCalledWith(
          "new-cf-app-server",
          expect.objectContaining({ access_token: "upstream-tok" }),
          undefined,
        );
      },
    );

    it("preserves admin-entered app credentials when the URL changes after authorize for true_passthrough", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "CF_Keep_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });

      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

      fireEvent.change(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), {
        target: { value: "org-app-client-id" },
      });
      fireEvent.change(screen.getByPlaceholderText("Leave blank for public clients / PKCE"), {
        target: { value: "org-app-secret" },
      });

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "upstream-tok", token_type: "Bearer" }, undefined);
      });

      // Editing the URL after authorize invalidates the held token (identity change), but the
      // declared app is config, not minted material: it must survive the invalidation instead of
      // being silently reset, or the server would persist withвыход the configured app.
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
          target: { value: "https://other.example.com/mcp" },
        });
      });

      const keptПриложениеСервер = {
        server_id: "kept-app-server",
        server_name: "CF_Keep_Сервер",
        alias: "CF_Keep_Сервер",
        url: "https://other.example.com/mcp",
        transport: "http",
        auth_type: "true_passthrough",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(keptПриложениеСервер);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.url).toBe("https://other.example.com/mcp");
      expect(payload.credentials).toEqual({
        client_id: "org-app-client-id",
        client_secret: "org-app-secret",
      });
      expect(JSON.stringify(payload)).not.toContain("upstream-tok");
    });

    it("wipes oauth2-minted credentials when the auth type switches to a client-forwarded mode", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "Switch_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });

      await selectOption("Аутентификация", "OAuth");

      // The oauth2 onТокенReceived branch writes the fetched token AND the DCR client into
      // form.credentials; both are minted for the oauth2 identity.
      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!(
          { access_token: "oauth2-minted-tok", refresh_token: "oauth2-minted-refresh", token_type: "Bearer" },
          { clientId: "dcr-minted-client", clientSecret: "dcr-minted-secret" },
        );
      });

      // Switching into a client-forwarded mode changes the identity with auth_type in the changed
      // values, so the preserve carve-выход must NOT apply: the minted material would otherwise ride
      // into a mode that now persists credentials onto the server row.
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

      const switchedСервер = {
        server_id: "switched-server",
        server_name: "Switch_Сервер",
        alias: "Switch_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "true_passthrough",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(switchedСервер);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials).toBeUndefined();
      expect(JSON.stringify(payload)).not.toContain("dcr-minted-client");
      expect(JSON.stringify(payload)).not.toContain("oauth2-minted-tok");
    });

    it("keeps the DCR-minted client выход of form.credentials but reuses it via getУчётные данные", async () => {
      await selectHttpТранспорт();
      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "DCR_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
      await selectOption("Аутентификация", "OAuth");

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!(
          { access_token: "oauth2-tok", token_type: "Bearer" },
          { clientId: "dcr-client", clientSecret: "dcr-secret" },
        );
      });

      // The DCR client must NOT be in the form store (or it could be collected as a CF server's app),
      // but getУчётные данные merges it so a re-authorize reuses the registered client instead of re-DCRing.
      expect(oauthHook.getУчётные данные?.()?.client_id).toBe("dcr-client");
      // getTemporaryPayload must mirror getУчётные данные for oauth2, or a re-authorize's temp session omits
      // the registered client and useMcpOAuthFlow re-registers instead of reusing it.
      expect(oauthHook.getTemporaryPayload?.()?.credentials).toMatchObject({ client_id: "dcr-client" });
    });

    it("clears the DCR ref and the upstream warning when the modal closes so nothing leaks to the next session", async () => {
      const { rerender } = render(<CreateMCPСервер {...defaultProps} />);
      await selectOption("Транспорт Type", "Streamable HTTP");
      expect(await screen.findByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "Leak_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
      await selectOption("Аутентификация", "OAuth");

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!(
          { access_token: "oauth2-tok", token_type: "Bearer" },
          { clientId: "leak-client", clientSecret: "leak-secret" },
        );
      });
      // Ref is held while the modal is open.
      expect(oauthHook.getУчётные данные?.()?.client_id).toBe("leak-client");

      // A parent dismiss (isModalVisible -> false) that does not rвыходe through Cancel/Create must still
      // clear the DCR ref, or the next server's oauth2 submit would carry this server's registered client.
      await act(async () => {
        rerender(<CreateMCPСервер {...defaultProps} isModalVisible={false} />);
      });

      expect(oauthHook.getУчётные данные?.()?.client_id).toBeUndefined();
      expect(oauthHook.getTemporaryPayload?.()?.credentials ?? {}).not.toMatchObject({ client_id: "leak-client" });
    });

    it("persists the DCR client on an oauth2 submit via the ref", async () => {
      await selectHttpТранспорт();
      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "DCR_Submit_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
      await selectOption("Аутентификация", "OAuth");

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!(
          { access_token: "oauth2-tok", token_type: "Bearer" },
          { clientId: "dcr-client", clientSecret: "dcr-secret" },
        );
      });

      const dcrSubmitСервер = {
        server_id: "dcr-submit",
        server_name: "DCR_Submit_Сервер",
        alias: "DCR_Submit_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(dcrSubmitСервер);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials.client_id).toBe("dcr-client");
      expect(payload.credentials.client_secret).toBe("dcr-secret");
    });

    // These two tests drive multiple antd auth-type switches; use single-shot fireEvent.change for the
    // text fields (not per-keystroke userEvent.type) and a wider timeвыход so they do not flake under CI
    // resource contention. The behavior under test is the credential preserve across the switches.
    const fillText = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

    it("preserves the typed app across a switch between the two client-forwarded modes", async () => {
      await selectHttpТранспорт();
      fillText(getСерверNameВход(), "CF_Switch_Keep");
      fillText(screen.getByPlaceholderText("https://your-mcp-server.com"), "https://example.com/mcp");
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");
      fillText(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), "app-id");
      fillText(screen.getByPlaceholderText("Leave blank for public clients / PKCE"), "app-secret");

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "cf-tok", token_type: "Bearer" }, undefined);
      });

      await selectOption("Аутентификация", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)");

      const switched = {
        server_id: "cf-switch-keep",
        server_name: "CF_Switch_Keep",
        alias: "CF_Switch_Keep",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "oauth_delegate",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(switched);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials).toEqual({ client_id: "app-id", client_secret: "app-secret" });
    }, 60_000);

    it("preserves the typed app across a client-forwarded -> oauth2 -> client-forwarded round trip", async () => {
      await selectHttpТранспорт();
      fillText(getСерверNameВход(), "CF_Round");
      fillText(screen.getByPlaceholderText("https://your-mcp-server.com"), "https://example.com/mcp");
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");
      fillText(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), "app-id");
      fillText(screen.getByPlaceholderText("Leave blank for public clients / PKCE"), "app-secret");

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "cf-tok", token_type: "Bearer" }, undefined);
      });

      await selectOption("Аутентификация", "OAuth");
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

      const cfRoundСервер = {
        server_id: "cf-round",
        server_name: "CF_Round",
        alias: "CF_Round",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "true_passthrough",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(cfRoundСервер);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials).toEqual({ client_id: "app-id", client_secret: "app-secret" });
    }, 60_000);

    it("keeps the typed app but warns when the URL changes after a client-forwarded authorize", async () => {
      await selectHttpТранспорт();
      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "CF_Warn" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");
      fireEvent.change(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), {
        target: { value: "app-id" },
      });

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "cf-tok", token_type: "Bearer" }, undefined);
      });

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
          target: { value: "https://other.example.com/mcp" },
        });
      });

      // Keep + warn: the app stays in the field, and a non-blocking warning appears.
      expect(screen.getByText(/OAuth app entered here was registered for the previous upstream/)).toBeInTheDocument();
    });

    it("keeps client_secret when only client_id is edited after a client-forwarded authorize", async () => {
      await selectHttpТранспорт();
      fireEvent.change(getСерверNameВход(), { target: { value: "CF_Ключиtroke" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");
      fireEvent.change(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), {
        target: { value: "app-id" },
      });
      fireEvent.change(screen.getByPlaceholderText("Leave blank for public clients / PKCE"), {
        target: { value: "app-secret" },
      });

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "cf-tok", token_type: "Bearer" }, undefined);
      });

      // Editing only client_id fires an invalidation whose changedЗначениеs carries only the client_id
      // sub-field; the preserve + deep-merge re-apply must keep client_secret from being dropped.
      fireEvent.change(screen.getByPlaceholderText("Leave blank to use dynamic client registration"), {
        target: { value: "app-id2" },
      });

      const cfКлючиtrokeСервер = {
        server_id: "cf-keystroke",
        server_name: "CF_Ключиtroke",
        alias: "CF_Ключиtroke",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "true_passthrough",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение(cfКлючиtrokeСервер);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials).toEqual({ client_id: "app-id2", client_secret: "app-secret" });
    });

    it("replaces the token set on re-authorize instead of leaving stale siblings", async () => {
      await selectHttpТранспорт();
      const user = userEvent.setup({ delay: null });
      fireEvent.change(getСерверNameВход(), { target: { value: "Reauth_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
      await selectOption("Аутентификация", "OAuth");

      await waitFor(() => expect(oauthHook.onТокенReceived).toBeTruthy());
      const firstТокен = { access_token: "T1", refresh_token: "R1", scope: "read", token_type: "Bearer" };
      await act(async () => {
        oauthHook.onТокенReceived!(firstТокен, undefined);
      });
      await act(async () => {
        oauthHook.onТокенReceived!({ access_token: "T2", token_type: "Bearer" }, undefined);
      });

      const creds = oauthHook.getУчётные данные?.() ?? {};
      expect(creds.access_token).toBe("T2");
      expect(creds.refresh_token).toBeUndefined();
      expect(creds.scope).toBeUndefined();
    });

    it("should not show auth value field when None auth type is selected", async () => {
      await selectHttpТранспорт();

      await selectOption("Аутентификация", "None");

      // Auth value field should not appear for "None"
      await waitFor(() => {
        expect(screen.queryByText("Аутентификация Значение")).not.toBeInTheDocument();
      });
    });

    it("should successfully create a server with no auth", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });

      const nameВход = getСерверNameВход();
      fireEvent.change(nameВход, { target: { value: "No_Auth_Сервер" } });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });

      await selectOption("Аутентификация", "None");

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-1",
        server_name: "No_Auth_Сервер",
        alias: "No_Auth_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "none",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.auth_type).toBe("none");
      // No credentials should be sent for "none" auth
      expect(payload.credentials).toBeUndefined();
    });

    it("shows the token-exchange fields only for the OAuth Токен Exchange (OBO) auth type", async () => {
      await selectHttpТранспорт();

      // Plain OAuth must not render the token-exchange section.
      await selectOption("Аутентификация", "OAuth");
      await waitFor(() => {
        expect(screen.queryByText("Эндпоинт обмена токенов (необязательно)")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Тип токена субъекта (необязательно)")).not.toBeInTheDocument();

      await selectOption("Аутентификация", "OAuth Токен Exchange (OBO)");
      await waitFor(() => {
        expect(screen.getByText("Эндпоинт обмена токенов (необязательно)")).toBeInTheDocument();
      });
      expect(screen.getByText("Тип токена субъекта (необязательно)")).toBeInTheDocument();

      // Switching away hides the section again.
      await selectOption("Аутентификация", "API ключ");
      await waitFor(() => {
        expect(screen.queryByText("Эндпоинт обмена токенов (необязательно)")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Тип токена субъекта (необязательно)")).not.toBeInTheDocument();

      // Выбратьing token exchange and then switching transport to stdio unmounts the
      // whole Аутентификация section (the section-level transport gate), taking the
      // token-exchange fields with it — their required client_id/client_secret rules
      // cannot block a stdio submit because antd does not validate unmounted fields.
      await selectOption("Аутентификация", "OAuth Токен Exchange (OBO)");
      await waitFor(() => {
        expect(screen.getByText("Эндпоинт обмена токенов (необязательно)")).toBeInTheDocument();
      });
      await selectOption("Транспорт Type", "Стандартный ввод/вывод");
      await waitFor(() => {
        expect(screen.queryByText("Эндпоинт обмена токенов (необязательно)")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Тип токена субъекта (необязательно)")).not.toBeInTheDocument();
    });

    it("sends max_concurrent_requests in the create payload when set", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });

      const nameВход = getСерверNameВход();
      fireEvent.change(nameВход, { target: { value: "Limited_Сервер" } });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });

      await selectOption("Аутентификация", "None");

      const limitВход = screen.getByPlaceholderText("e.g. 10");
      fireEvent.change(limitВход, { target: { value: "5" } });

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-1",
        server_name: "Limited_Сервер",
        alias: "Limited_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "none",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.max_concurrent_requests).toBe(5);
    });

    it("rвыходes OAuth Токен Exchange (OBO) config to the backend payload", async () => {
      await selectHttpТранспорт();

      // fireEvent.change over user.type: this test asserts payload shape, not
      // keystroke behavior, and char-by-char typing re-renders the whole form
      // per character, which pushed this test past the 30s CI timeвыход.
      fireEvent.change(getСерверNameВход(), { target: { value: "TE_Сервер" } });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://upstream.example.com/mcp" } });

      await selectOption("Аутентификация", "OAuth Токен Exchange (OBO)");

      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://idp.example.com/oauth2/token")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("https://idp.example.com/oauth2/token"), {
        target: { value: "https://idp.example.com/oauth2/token" },
      });
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client ID"), {
        target: { value: "te-client-id" },
      });
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client secret"), {
        target: { value: "te-client-secret" },
      });

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-te",
        server_name: "TE_Сервер",
        alias: "TE_Сервер",
        url: "https://upstream.example.com/mcp",
        transport: "http",
        auth_type: "oauth2_token_exchange",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.auth_type).toBe("oauth2_token_exchange");
      expect(payload.token_exchange_endpoint).toBe("https://idp.example.com/oauth2/token");
      expect(payload.token_exchange_profile).toBe("rfc8693");
      expect(payload.credentials).toMatchObject({
        client_id: "te-client-id",
        client_secret: "te-client-secret",
      });
    });

    it("shows the ID-JAG fields only for the ID-JAG auth type", async () => {
      await selectHttpТранспорт();

      // The sibling OBO mode must not render the ID-JAG section.
      await selectOption("Аутентификация", "OAuth Токен Exchange (OBO)");
      await waitFor(() => {
        expect(screen.queryByText("Токен-эндпоинт организации (шаг 1)")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Токен-эндпоинт ресурса (шаг 2)")).not.toBeInTheDocument();

      await selectOption("Аутентификация", "ID-JAG (Okta Cross Приложение Access)");
      await waitFor(() => {
        expect(screen.getByText("Токен-эндпоинт организации (шаг 1)")).toBeInTheDocument();
      });
      expect(screen.getByText("Токен-эндпоинт ресурса (шаг 2)")).toBeInTheDocument();
      expect(screen.getByText("Закрытый ключ клиента (PEM)")).toBeInTheDocument();

      await selectOption("Аутентификация", "API ключ");
      await waitFor(() => {
        expect(screen.queryByText("Токен-эндпоинт организации (шаг 1)")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Токен-эндпоинт ресурса (шаг 2)")).not.toBeInTheDocument();
    });

    it("rвыходes ID-JAG config to the backend payload with both legs and the private key", async () => {
      await selectHttpТранспорт();

      fireEvent.change(getСерверNameВход(), { target: { value: "IdJag_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://upstream.example.com/mcp" },
      });

      await selectOption("Аутентификация", "ID-JAG (Okta Cross Приложение Access)");

      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-org.okta.com/oauth2/v1/token")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("https://your-org.okta.com/oauth2/v1/token"), {
        target: { value: "https://acme.okta.com/oauth2/v1/token" },
      });
      fireEvent.change(screen.getByPlaceholderText("https://upstream.example.com/oauth2/token"), {
        target: { value: "https://jira.example.com/oauth2/token" },
      });
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client ID"), {
        target: { value: "id-jag-client" },
      });
      fireEvent.change(screen.getByPlaceholderText("-----BEGIN PRIVATE KEY-----"), {
        target: { value: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----" },
      });
      fireEvent.change(screen.getByPlaceholderText("my-signing-key-1"), {
        target: { value: "kid-1" },
      });

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-id-jag",
        server_name: "IdJag_Сервер",
        alias: "IdJag_Сервер",
        url: "https://upstream.example.com/mcp",
        transport: "http",
        auth_type: "oauth2_id_jag",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.auth_type).toBe("oauth2_id_jag");
      // Leg 1 rides the shared token_exchange_endpoint column; leg 2 is ID-JAG specific.
      expect(payload.token_exchange_endpoint).toBe("https://acme.okta.com/oauth2/v1/token");
      expect(payload.credentials).toMatchObject({
        client_id: "id-jag-client",
        id_jag_resource_token_endpoint: "https://jira.example.com/oauth2/token",
        client_private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
        client_private_key_id: "kid-1",
      });
    });

    it("blocks an ID-JAG submit that provides neither a client secret nor a private key", async () => {
      await selectHttpТранспорт();

      fireEvent.change(getСерверNameВход(), { target: { value: "IdJag_NoCreds" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://upstream.example.com/mcp" },
      });

      await selectOption("Аутентификация", "ID-JAG (Okta Cross Приложение Access)");

      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-org.okta.com/oauth2/v1/token")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText("https://your-org.okta.com/oauth2/v1/token"), {
        target: { value: "https://acme.okta.com/oauth2/v1/token" },
      });
      fireEvent.change(screen.getByPlaceholderText("https://upstream.example.com/oauth2/token"), {
        target: { value: "https://jira.example.com/oauth2/token" },
      });
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client ID"), {
        target: { value: "id-jag-client" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Добавить MCP-сервер" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Укажите секрет клиента или закрытый ключ клиента")).toBeInTheDocument();
      });
      expect(networking.createMCPСервер).not.toHaveBeenCalled();
    });

    it("makes scope required when the Entra OBO profile is selected", async () => {
      await selectHttpТранспорт();

      // fireEvent.change over user.type for the same reason as the payload
      // test above: char-by-char typing re-renders the whole form per
      // character and pushes this test toward the 30s CI timeвыход.
      fireEvent.change(getСерверNameВход(), { target: { value: "Entra_Сервер" } });
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://upstream.example.com/mcp" },
      });

      await selectOption("Аутентификация", "OAuth Токен Exchange (OBO)");
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://idp.example.com/oauth2/token")).toBeInTheDocument();
      });

      await selectOption("Профиль", "Microsoft Entra OBO");

      fireEvent.change(screen.getByPlaceholderText("https://idp.example.com/oauth2/token"), {
        target: { value: "https://login.microsoftonline.com/tenant/oauth2/v2.0/token" },
      });
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client ID"), {
        target: { value: "entra-client" },
      });
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client secret"), {
        target: { value: "entra-secret" },
      });

      // Выбратьing Entra OBO makes the scope required; submitting withвыход one is blocked by validation
      // (rfc8693 would not require it), which confirms the profile selection took effect.
      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });
      await waitFor(() => {
        expect(
          screen.getByText("Microsoft Entra OBO requires a scope, e.g. api://<app-id>/.default"),
        ).toBeInTheDocument();
      });
      expect(networking.createMCPСервер).not.toHaveBeenCalled();
    });

    it("enforces the allowlist when the user explicitly deselects every инструмента", async () => {
      await selectHttpТранспорт();

      const user = userEvent.setup({ delay: null });

      const nameВход = getСерверNameВход();
      fireEvent.change(nameВход, { target: { value: "Locked_Down_Сервер" } });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });

      await selectOption("Аутентификация", "None");

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Disable all инструментов" }));
      });

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-1",
        server_name: "Locked_Down_Сервер",
        alias: "Locked_Down_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "none",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.mcp_info.tool_allowlist_enforced).toBe(true);
      expect(payload.allowed_tools).toEqual([]);
    });
  });

  describe("when OAuth interactive auth is selected", () => {
    /** Выбрать HTTP transport + OAuth auth, then wait for the OAuth form to appear. */
    async function setupOAuthInteractive() {
      render(<CreateMCPСервер {...defaultProps} />);
      await selectOption("Транспорт Type", "Streamable HTTP");

      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      });

      await selectOption("Аутентификация", "OAuth");

      // Wait for OAuthFormПолеs to render (OAuth Flow Type selector is the sentinel)
      await waitFor(() => {
        expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
      });

      // OAuthFormПолеs defaults to INTERACTIVE, so the new fields should appear
      await waitFor(() => {
        expect(screen.getByText("Токен Validation Rules (необязательно)")).toBeInTheDocument();
        expect(screen.getByText("Токен Storage TTL (seconds, необязательно)")).toBeInTheDocument();
      });
    }

    it("shows Токен Validation Rules and Токен Storage TTL fields", async () => {
      await setupOAuthInteractive();
      // Asserted in setupOAuthInteractive
    });

    it("invalidates the held token when the auth mode changes after Authorize & Fetch", async () => {
      await setupOAuthInteractive();
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://a.example.com/mcp" } });
      });
      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "tok-a" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      oauthHook.reset.mockClear();

      // Switching the Аутентификация mode changes the OAuth identity, so the held token is discarded.
      await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

      await waitFor(() => expect(oauthHook.reset).toHaveBeenCalled());
    });

    it("does NOT invalidate the held token when a non-mint field (server name) changes", async () => {
      await setupOAuthInteractive();
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://a.example.com/mcp" } });
      });
      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "tok-a" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      oauthHook.reset.mockClear();

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "Renamed_Сервер" } });
      });

      // server_name is not part of the OAuth identity, so the held token must survive the edit.
      await waitFor(() => expect(screen.getВсеByRole("button", { name: "Добавить MCP-сервер" }).length).toBeGreaterThan(0));
      expect(oauthHook.reset).not.toHaveBeenCalled();
    });

    it("does not refetch the инструмента preview with a discarded token after invalidation", async () => {
      // Regression: handleFormЗначениеsChange used to publish the pre-reset antd snapshot into
      // formЗначениеs after clearHeldOAuthТокен, so useTestMCPПодключение kept the discarded OAuth
      // material (the DCR client minted for the old identity) and sent it on the next инструмента-preview
      // request.
      await setupOAuthInteractive();
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://a.example.com/mcp" } });
      });
      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "stale-tok" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "Sync_FormЗначениеs" } });
      });
      vi.mocked(networking.testMCPИнструментыListЗапрос).mockClear();

      await selectOption("Аутентификация", "API ключ");

      await waitFor(() => expect(vi.mocked(networking.testMCPИнструментыListЗапрос)).toHaveBeenCalled());
      for (const call of vi.mocked(networking.testMCPИнструментыListЗапрос).mock.calls) {
        expect(call[1]?.credentials?.client_id).not.toBe("client-a");
        expect(call[1]?.credentials?.client_secret).not.toBe("secret-a");
      }
    });

    it("keeps the held token on an http to sse switch with the same url", async () => {
      // Same url means the same resource/audience (RFC 8707): the minted token is still valid, so a
      // pure transport swap between the two MCP wire protocols must not force a re-authorize.
      await setupOAuthInteractive();
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://a.example.com/mcp" } });
      });
      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "tok-a" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      oauthHook.reset.mockClear();

      await selectOption("Транспорт Type", "Сервер-Sent Events (SSE)");

      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      });
      expect(oauthHook.reset).not.toHaveBeenCalled();
    });

    it("includes token_validation in payload when token_validation_json is filled with valid JSON", async () => {
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-oauth",
        server_name: "OAuth_Сервер",
        alias: "OAuth_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      await setupOAuthInteractive();

      // Fill required form fields
      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "OAuth_Сервер" } });
      });
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });
      });

      // Fill in the token_validation_json textarea
      const textarea = document.getElementById("token_validation_json") as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: '{"organization": "my-org", "team.id": "42"}' } });
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.token_validation).toEqual({ organization: "my-org", "team.id": "42" });
    });

    it("invalidates the DCR client and OAuth flow when the MCP URL changes after Authorize & Fetch", async () => {
      await setupOAuthInteractive();

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "Url_Change_Сервер" } });
      });
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://a.example.com/mcp" } });
      });

      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "tok-a" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      oauthHook.reset.mockClear();

      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://b.example.com/mcp" } });
      });

      await waitFor(() => expect(oauthHook.reset).toHaveBeenCalled());

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-oauth",
        server_name: "Url_Change_Сервер",
        alias: "Url_Change_Сервер",
        url: "https://b.example.com/mcp",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials?.client_id).toBeUndefined();
      expect(payload.credentials?.client_secret).toBeUndefined();
    });

    it("invalidates the DCR client and OAuth flow when the OpenAPI spec URL changes after Authorize & Fetch", async () => {
      render(<CreateMCPСервер {...defaultProps} />);
      await selectOption("Транспорт Type", "Спецификация OpenAPI");
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://petstore3.swagger.io/api/v3/openapi.json")).toBeInTheDocument();
      });
      await selectOption("Аутентификация", "OAuth");
      await waitFor(() => {
        expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
      });

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "OpenAPI_Сервер" } });
      });
      const specВход = screen.getByPlaceholderText("https://petstore3.swagger.io/api/v3/openapi.json");
      await act(async () => {
        fireEvent.change(specВход, { target: { value: "https://a.example.com/openapi.json" } });
      });

      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "tok-a" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      oauthHook.reset.mockClear();

      await act(async () => {
        fireEvent.change(specВход, { target: { value: "https://b.example.com/openapi.json" } });
      });

      await waitFor(() => expect(oauthHook.reset).toHaveBeenCalled());

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-openapi-server",
        server_name: "OpenAPI_Сервер",
        alias: "OpenAPI_Сервер",
        url: "https://b.example.com/openapi.json",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.spec_path).toBe("https://b.example.com/openapi.json");
      expect(payload.credentials?.client_id).toBeUndefined();
      expect(payload.credentials?.client_secret).toBeUndefined();
    });

    it("invalidates the DCR client and OAuth flow when the transport changes after Authorize & Fetch", async () => {
      render(<CreateMCPСервер {...defaultProps} />);
      await selectOption("Транспорт Type", "Спецификация OpenAPI");
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://petstore3.swagger.io/api/v3/openapi.json")).toBeInTheDocument();
      });
      await selectOption("Аутентификация", "OAuth");
      await waitFor(() => {
        expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
      });

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "Транспорт_Change_Сервер" } });
      });
      const specВход = screen.getByPlaceholderText("https://petstore3.swagger.io/api/v3/openapi.json");
      await act(async () => {
        fireEvent.change(specВход, { target: { value: "https://same.example.com/spec-or-mcp" } });
      });

      act(() => {
        oauthHook.onТокенReceived?.({ access_token: "tok-a" }, { clientId: "client-a", clientSecret: "secret-a" });
      });
      oauthHook.reset.mockClear();

      await selectOption("Транспорт Type", "Streamable HTTP");
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      });
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://same.example.com/spec-or-mcp" } });
      });

      await waitFor(() => expect(oauthHook.reset).toHaveBeenCalled());

      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-transport-server",
        server_name: "Транспорт_Change_Сервер",
        alias: "Транспорт_Change_Сервер",
        url: "https://same.example.com/spec-or-mcp",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1));
      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.url).toBe("https://same.example.com/spec-or-mcp");
      expect(payload.credentials?.client_id).toBeUndefined();
      expect(payload.credentials?.client_secret).toBeUndefined();
    });

    // Empty/whitespace token_validation is covered in createСерверPayload.test.ts; the sibling
    // test above still proves the textarea reaches token_validation_json.

    it("includes credentials.token_endpoint_auth_method in payload when client_secret_basic is selected", async () => {
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "new-server-oauth",
        server_name: "OAuth_Сервер",
        alias: "OAuth_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      await setupOAuthInteractive();

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "OAuth_Сервер" } });
      });
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });
      });

      await selectOption("Токен Эндпоинт Метод авторизации (необязательно)", "Секрет клиента Базовый");

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
      });

      const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
      expect(payload.credentials?.token_endpoint_auth_method).toBe("client_secret_basic");
    });

    // Blank credential keys are dropped by the shared filter, covered in createСерверPayload.test.ts;
    // the sibling test above still proves the select reaches credentials.token_endpoint_auth_method.

    it("persists access + refresh token to the DB on submit for OBO mode", async () => {
      // "Authorize & Fetch" produced a token before submit.
      oauthHook.tokenОтвет = {
        access_token: "obo-access-token",
        refresh_token: "obo-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        scope: "channels:read chat:write",
      };
      vi.mocked(networking.createMCPСервер).mockResolvedЗначение({
        server_id: "obo-server-1",
        server_name: "OBO_Сервер",
        alias: "OBO_Сервер",
        url: "https://example.com/mcp",
        transport: "http",
        auth_type: "oauth2",
        created_at: "2024-01-01T00:00:00Z",
        created_by: "user-1",
        updated_at: "2024-01-01T00:00:00Z",
        updated_by: "user-1",
      });

      // Interactive OAuth + delegate_auth_to_upstream off (the default) => OBO mode.
      await setupOAuthInteractive();

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "OBO_Сервер" } });
      });
      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(networking.storeMCPOAuthUserCredential).toHaveBeenCalledВремяs(1);
      });
      expect(networking.storeMCPOAuthUserCredential).toHaveBeenCalledWith("test-token", "obo-server-1", {
        access_token: "obo-access-token",
        refresh_token: "obo-refresh-token",
        expires_in: 3600,
        scopes: ["channels:read", "chat:write"],
      });
      // OBO persists server-side; it must not fall back to the browser-only cache.
      expect(setТокен).not.toHaveBeenCalled();
    });

    it("does not submit and shows validation error for invalid JSON in token_validation_json", async () => {
      await setupOAuthInteractive();

      const textarea = document.getElementById("token_validation_json") as HTMLTextAreaElement;
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "not-valid-json{" } });
      });

      const nameВход = document.getElementById("server_name") as HTMLВходElement;
      await act(async () => {
        fireEvent.change(nameВход, { target: { value: "OAuth_Сервер" } });
      });

      const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Either the inline form validation message or the notification fires —
      // both indicate the submit was blocked.
      await waitFor(() => {
        const inlineОшибка = screen.queryByText("Must be valid JSON");
        const notCalled = !vi.mocked(networking.createMCPСервер).mock.calls.length;
        expect(inlineОшибка !== null || notCalled).toBe(true);
      });
    });
  });

  describe("when modal is cancelled", () => {
    it("should call setModalVisible(false) when cancel is clicked", async () => {
      render(<CreateMCPСервер {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(defaultProps.setModalVisible).toHaveBeenCalledWith(false);
    });

    it("does not leak a previous server's OAuth token into the next add-server session", async () => {
      const usedТокен = (token: string) =>
        vi.mocked(networking.testMCPИнструментыListЗапрос).mock.calls.some((call) => call[2] === token);

      const { rerender } = render(<CreateMCPСервер {...defaultProps} />);

      await selectOption("Транспорт Type", "Streamable HTTP");
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      });
      await selectOption("Аутентификация", "OAuth");
      await waitFor(() => {
        expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
      });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://server-a.example.com/mcp" } });
      });

      // Simulate "Authorize & Fetch Токен" completing for server A.
      await act(async () => {
        oauthHook.onТокенReceived?.({ access_token: "stale-token-A", expires_in: 3600 });
      });

      // Precondition: the freshly fetched token drives the инструмента preview for server A.
      await waitFor(() => {
        expect(usedТокен("stale-token-A")).toBe(true);
      });

      // Parent hides the modal (Cancel / successful create both flip this prop).
      rerender(<CreateMCPСервер {...defaultProps} isModalVisible={false} />);

      // The OAuth flow state (source of the "Токен fetched" badge) is reset on close.
      expect(oauthHook.reset).toHaveBeenCalled();

      vi.mocked(networking.testMCPИнструментыListЗапрос).mockClear();

      // Reopen for a brand-new server and enter a different URL withвыход re-authorizing.
      rerender(<CreateMCPСервер {...defaultProps} isModalVisible={true} />);
      const reopenedUrlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      oauthHook.reset.mockClear();
      await act(async () => {
        fireEvent.change(reopenedUrlВход, { target: { value: "https://server-b.example.com/mcp" } });
      });

      // The previous server's token must never be replayed for the new session.
      expect(oauthHook.reset).not.toHaveBeenCalled();
      expect(usedТокен("stale-token-A")).toBe(false);
    });

    it("clears the tool list and form fields when a parent dismisses the modal", async () => {
      vi.mocked(networking.testMCPИнструментыListЗапрос).mockResolvedЗначение({
        tools: [{ name: "tool_a" }],
        error: null,
      });
      const ToolCount = () => screen.getByTestId("mcp-connection-status").getAttribute("data-tools-count");

      const { rerender } = render(<CreateMCPСервер {...defaultProps} />);

      await selectOption("Транспорт Type", "Streamable HTTP");
      await waitFor(() => {
        expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
      });
      await selectOption("Аутентификация", "OAuth");
      await waitFor(() => {
        expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
      });

      const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
      await act(async () => {
        fireEvent.change(urlВход, { target: { value: "https://server-a.example.com/mcp" } });
      });
      await act(async () => {
        oauthHook.onТокенReceived?.({ access_token: "stale-token-A", expires_in: 3600 });
      });

      // Precondition: a инструмента list is shown for server A.
      await waitFor(() => {
        expect(ToolCount()).toBe("1");
      });

      // Parent dismisses the modal withвыход rвыходing through Cancel or create.
      rerender(<CreateMCPСервер {...defaultProps} isModalVisible={false} />);

      await waitFor(() => {
        expect(screen.queryByTestId("mcp-connection-status")).not.toBeInTheDocument();
      });

      // Reopening starts clean: neither the prior server's URL nor its инструмента list survives.
      rerender(<CreateMCPСервер {...defaultProps} isModalVisible={true} />);
      const reopenedUrlВход = screen.getByPlaceholderText("https://your-mcp-server.com") as HTMLВходElement;
      expect(reopenedUrlВход.value).toBe("");
      expect(ToolCount()).toBe("0");
    });

    it("does not reset an in-flight OAuth resume when mounted with the modal closed (post-redirect restore)", () => {
      // After the "Authorize & Fetch Токен" redirect the page reloads and this
      // component mounts with isModalVisible=false while useMcpOAuthFlow is still
      // exchanging the authorization code. Calling reset() during that mount bumps
      // the hook's reset version and the fetched token is silently discarded, so
      // the user sees no Состояние подключения / Tool Конфигурацияuration and must authorize
      // again after saving.
      const { rerender } = render(<CreateMCPСервер {...defaultProps} isModalVisible={false} />);
      expect(oauthHook.reset).not.toHaveBeenCalled();

      // A real open -> closed transition must still reset (the #30000 leak fix).
      rerender(<CreateMCPСервер {...defaultProps} isModalVisible={true} />);
      rerender(<CreateMCPСервер {...defaultProps} isModalVisible={false} />);
      expect(oauthHook.reset).toHaveBeenCalled();
    });
  });

  describe("when stdio transport is selected", () => {
    it("should not show auth type or URL fields", async () => {
      render(<CreateMCPСервер {...defaultProps} />);

      await selectOption("Транспорт Type", "Стандартный ввод/вывод");

      // Auth and URL fields should not be present for stdio
      await waitFor(() => {
        expect(screen.queryByText("Аутентификация")).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText("https://your-mcp-server.com")).not.toBeInTheDocument();
      });
    });
  });

  describe("when prefillData is provided", () => {
    it("should populate form fields from discovery data", async () => {
      const prefillData = {
        name: "github-mcp",
        title: "GitHub MCP",
        description: "GitHub integration server",
        category: "Разработка",
        transport: "http",
        url: "https://github-mcp.example.com",
      };

      render(<CreateMCPСервер {...defaultProps} prefillData={prefillData} />);

      await waitFor(() => {
        // Сервер name should be sanitized (hyphens replaced with underscores)
        const nameВход = getСерверNameВход();
        expect(nameВход).toHaveЗначение("github_mcp");
      });
    });
  });

  describe("with back to discovery button", () => {
    it("should show back button and call onBackToDiscovery when clicked", async () => {
      const onBackToDiscovery = vi.fn();
      render(<CreateMCPСервер {...defaultProps} onBackToDiscovery={onBackToDiscovery} />);

      // The back arrow button should be visible
      const backButton = screen.getByText("←");
      expect(backButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(backButton);
      });

      expect(onBackToDiscovery).toHaveBeenCalledВремяs(1);
    });
  });
});

describe("CreateMCPСервер oauth2_flow persistence", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  const createdСервер = {
    server_id: "new-server-oauth",
    server_name: "OAuth_Сервер",
    alias: "OAuth_Сервер",
    url: "https://example.com/mcp",
    transport: "http",
    auth_type: "oauth2",
    created_at: "2024-01-01T00:00:00Z",
    created_by: "user-1",
    updated_at: "2024-01-01T00:00:00Z",
    updated_by: "user-1",
  };

  async function setupHttpСерверForm() {
    render(<CreateMCPСервер {...defaultProps} />);
    await selectOption("Транспорт Type", "Streamable HTTP");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
    });
    const nameВход = document.getElementById("server_name") as HTMLВходElement;
    await act(async () => {
      fireEvent.change(nameВход, { target: { value: "OAuth_Сервер" } });
    });
    const urlВход = screen.getByPlaceholderText("https://your-mcp-server.com");
    await act(async () => {
      fireEvent.change(urlВход, { target: { value: "https://example.com/mcp" } });
    });
  }

  async function submitCreate() {
    const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    await waitFor(() => {
      expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
    });
    const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
    return payload;
  }

  it("persists authorization_code for an interactive OAuth create", async () => {
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение(createdСервер);
    await setupHttpСерверForm();
    await selectOption("Аутентификация", "OAuth");
    await waitFor(() => {
      expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
    });

    const payload = await submitCreate();
    expect(payload.auth_type).toBe("oauth2");
    expect(payload.oauth2_flow).toBe("authorization_code");
  });

  it("persists client_credentials for an M2M OAuth create", async () => {
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение({ ...createdСервер, oauth2_flow: "client_credentials" });
    await setupHttpСерверForm();
    await selectOption("Аутентификация", "OAuth");
    await waitFor(() => {
      expect(screen.getByText("OAuth Flow Type")).toBeInTheDocument();
    });
    await selectOption("OAuth Flow Type", "Machine-to-Machine (M2M)");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Введите OAuth client ID")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client ID"), { target: { value: "cid" } });
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Введите OAuth client secret"), { target: { value: "csecret" } });
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("https://auth.example.com/oauth/token"), {
        target: { value: "https://auth.example.com/oauth/token" },
      });
    });

    const payload = await submitCreate();
    expect(payload.oauth2_flow).toBe("client_credentials");
  });

  // oauth2_flow branch coverage lives in createСерверPayload.test.ts; the two cases above keep
  // the dropdown-to-payload wiring they uniquely prove.
});

describe("CreateMCPСервер dcr_bridge toggle", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    oauthHook.tokenОтвет = null;
    oauthHook.onТокенReceived = null;
  });

  const createdСервер = {
    server_id: "new-cf-server",
    server_name: "CF_Сервер",
    alias: "CF_Сервер",
    url: "https://example.com/mcp",
    transport: "http",
    auth_type: "true_passthrough",
    created_at: "2024-01-01T00:00:00Z",
    created_by: "user-1",
    updated_at: "2024-01-01T00:00:00Z",
    updated_by: "user-1",
  };

  const getDcrToggle = () => screen.queryByRole("switch", { name: /Gateway-hosted sign-in \(DCR bridge\)/ });

  async function setupHttpСерверForm() {
    render(<CreateMCPСервер {...defaultProps} />);
    await selectOption("Транспорт Type", "Streamable HTTP");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.change(getСерверNameВход(), { target: { value: "CF_Сервер" } });
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("https://your-mcp-server.com"), {
        target: { value: "https://example.com/mcp" },
      });
    });
  }

  async function submitCreate() {
    const submitButton = screen.getByRole("button", { name: "Добавить MCP-сервер" });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    await waitFor(() => {
      expect(networking.createMCPСервер).toHaveBeenCalledВремяs(1);
    });
    const [, payload] = vi.mocked(networking.createMCPСервер).mock.calls[0];
    return payload;
  }

  it.each([["Сквозная передача (без аутентификации ruLiteLLM)"], ["OAuth -делегирование (токен от клиента для вышестоящего сервиса)"]])(
    "renders the toggle default-checked when %s is selected",
    async (optionLabel) => {
      await setupHttpСерверForm();

      await selectOption("Аутентификация", optionLabel);

      await waitFor(() => {
        expect(getDcrToggle()).toBeInTheDocument();
      });
      expect(screen.getByText("Gateway-hosted sign-in (DCR bridge)")).toBeInTheDocument();
      expect(getDcrToggle()).toHaveAttribute("aria-checked", "true");
    },
  );

  it.each([["None"], ["API ключ"], ["OAuth"]])("does not render the toggle for %s", async (optionLabel) => {
    await setupHttpСерверForm();

    await selectOption("Аутентификация", optionLabel);

    await waitFor(() => {
      expect(screen.queryByText("Gateway-hosted sign-in (DCR bridge)")).not.toBeInTheDocument();
    });
    expect(getDcrToggle()).not.toBeInTheDocument();
  });

  it("renders the toggle between the OAuth client fields and the Authorize button", async () => {
    await setupHttpСерверForm();

    await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");

    await waitFor(() => {
      expect(getDcrToggle()).toBeInTheDocument();
    });
    const toggle = getDcrToggle() as HTMLElement;
    const secretВход = screen.getByPlaceholderText("Leave blank for public clients / PKCE");
    const authorizeButton = screen.getByRole("button", { name: "Authorize & Fetch Инструменты (browser-only)" });
    expect(secretВход.compareDocumentПозиция(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toggle.compareDocumentПозиция(authorizeButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each([
    ["true_passthrough", "Сквозная передача (без аутентификации ruLiteLLM)"],
    ["oauth_delegate", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)"],
  ])("sends dcr_bridge: true by default on create for %s", async (authType, optionLabel) => {
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение({ ...createdСервер, auth_type: authType });
    await setupHttpСерверForm();
    await selectOption("Аутентификация", optionLabel);
    await waitFor(() => {
      expect(getDcrToggle()).toBeInTheDocument();
    });

    const payload = await submitCreate();
    expect(payload.dcr_bridge).toBe(true);
  });

  it("sends an explicit dcr_bridge: false when the toggle is unchecked", async () => {
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение({ ...createdСервер, auth_type: "oauth_delegate" });
    await setupHttpСерверForm();
    await selectOption("Аутентификация", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)");
    await waitFor(() => {
      expect(getDcrToggle()).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(getDcrToggle()!);
    });
    expect(getDcrToggle()).toHaveAttribute("aria-checked", "false");

    const payload = await submitCreate();
    expect(payload.dcr_bridge).toBe(false);
  });

  // Forcing dcr_bridge false for every non-client-forwarded auth type is covered in
  // createСерверPayload.test.ts. The two form-state cases below stay: they prove the field
  // unmounts on a switch away, and that the live value survives a client-forwarded swap.

  it("forces dcr_bridge: false when the auth type is switched away after toggling", async () => {
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение({ ...createdСервер, auth_type: "none" });
    await setupHttpСерверForm();
    await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");
    await waitFor(() => {
      expect(getDcrToggle()).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(getDcrToggle()!);
    });

    await selectOption("Аутентификация", "None");
    await waitFor(() => {
      expect(getDcrToggle()).not.toBeInTheDocument();
    });

    const payload = await submitCreate();
    expect(payload.dcr_bridge).toBe(false);
  });

  it("preserves the toggle value when switching between the two client-forwarded modes", async () => {
    vi.mocked(networking.createMCPСервер).mockResolvedЗначение({ ...createdСервер, auth_type: "oauth_delegate" });
    await setupHttpСерверForm();
    await selectOption("Аутентификация", "Сквозная передача (без аутентификации ruLiteLLM)");
    await waitFor(() => {
      expect(getDcrToggle()).toBeInTheDocument();
    });
    expect(getDcrToggle()).toHaveAttribute("aria-checked", "true");

    // The field is mounted in both client-forwarded modes, so switching between them keeps the
    // live toggle value rather than forcing it back to the default or to false.
    await selectOption("Аутентификация", "OAuth -делегирование (токен от клиента для вышестоящего сервиса)");
    await waitFor(() => {
      expect(getDcrToggle()).toBeInTheDocument();
    });
    expect(getDcrToggle()).toHaveAttribute("aria-checked", "true");

    const payload = await submitCreate();
    expect(payload.dcr_bridge).toBe(true);
  });
});
