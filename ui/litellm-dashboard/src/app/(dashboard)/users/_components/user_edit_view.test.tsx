import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, testRequestClient } from "../../../../../tests/test-utils";
import { UserEditView } from "./user_edit_view";
import * as networking from "@/components/networking";

vi.mock("@/components/networking");

vi.mock("@/components/key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: vi.fn((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: string) => Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию),
}));

vi.mock("@/utils/roles", () => ({
  all_admin_roles: ["Admin", "Admin Viewer", "proxy_admin", "proxy_admin_viewer", "org_admin"],
}));

describe("UserEditView", () => {
  const MOCK_USER_DATA = {
    user_id: "user-123",
    user_info: {
      user_email: "test@example.com",
      user_alias: "Test User",
      user_role: "proxy_admin",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4", "gpt-3.5-turbo"],
      max_budget: 100.5,
      budget_duration: "30d",
      metadata: {
        key1: "value1",
        key2: "value2",
      },
    },
  };

  const MOCK_POSSIBLE_UI_ROLES = {
    proxy_admin: {
      ui_label: "Proxy Admin",
      description: "Full access to proxy",
    },
    proxy_admin_viewer: {
      ui_label: "Proxy Admin Viewer",
      description: "Read-only access",
    },
    user: {
      ui_label: "User",
      description: "Standard user",
    },
  };

  const defaultProps = {
    userData: MOCK_USER_DATA,
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
    teams: null,
    accessТокен: "test-token",
    userID: "current-user-1",
    userRole: "Admin",
    userModels: ["gpt-4", "gpt-3.5-turbo", "claude-3"],
    possibleUIRoles: MOCK_POSSIBLE_UI_ROLES,
    isBulkEdit: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    testRequestClient.clear();
    vi.mocked(networking.fetchMCP-серверы).mockResolvedЗначение([]);
    vi.mocked(networking.fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(networking.fetchMCPToolsets).mockResolvedЗначение([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("should render", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });
  });

  it("should display user ID field when not in bulk edit mode", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("ID пользователя")).toBeInTheDocument();
    });

    const userIdВход = screen.getByLabelText("ID пользователя");
    expect(userIdВход).toBeDisabled();
    expect(userIdВход).toHaveЗначение("user-123");
  });

  it("should not display user ID field when in bulk edit mode", async () => {
    renderWithProviders(<UserEditView {...defaultProps} isBulkEdit={true} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("ID пользователя")).not.toBeInTheDocument();
  });

  it("should display email field when not in bulk edit mode", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    const emailВход = screen.getByLabelText("Email");
    expect(emailВход).toHaveЗначение("test@example.com");
  });

  it("should not display email field when in bulk edit mode", async () => {
    renderWithProviders(<UserEditView {...defaultProps} isBulkEdit={true} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("should display user alias field with initial value", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("User Alias")).toBeInTheDocument();
    });

    const aliasВход = screen.getByLabelText("User Alias");
    expect(aliasВход).toHaveЗначение("Test User");
  });

  it("should display personal Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs select with available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Личная Режимls")).toBeInTheDocument();
    });

    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsВыбрать = screen.getByRole("combobox", { name: /select Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/i });
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsВыбрать).toBeInTheDocument();
  });

  it("should disable Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs select when user role is not admin", async () => {
    renderWithProviders(<UserEditView {...defaultProps} userRole="user" />);

    await waitFor(() => {
      const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsВыбрать = screen.getByRole("combobox", { name: /select Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/i });
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsВыбрать).toBeDisabled();
    });
  });

  it("should enable Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs select when user role is admin", async () => {
    renderWithProviders(<UserEditView {...defaultProps} userRole="Admin" />);

    await waitFor(() => {
      const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsВыбрать = screen.getByRole("combobox", { name: /select Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/i });
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsВыбрать).toBeEnabled();
    });
  });

  it("should display max budget input field", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Макс. бюджет (USD)")).toBeInTheDocument();
    });
  });

  it("should display unlimited budget checkbox", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Без ограничений Бюджет" })).toBeInTheDocument();
    });
  });

  it("should check unlimited budget when clicking its visible text", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("spinbutton", { name: /max budget/i })).toBeEnabled();
    });

    await userEvent.click(screen.getByText("Без ограничений Бюджет"));

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Без ограничений Бюджет" })).toBeChecked();
    });
    expect(screen.getByRole("spinbutton", { name: /max budget/i })).toBeDisabled();
  });

  it("should set unlimited budget checkbox when max_budget is null", async () => {
    const userDataWithNullБюджет = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        max_budget: null,
      },
    };

    renderWithProviders(<UserEditView {...defaultProps} userData={userDataWithNullБюджет} />);

    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox", { name: "Без ограничений Бюджет" });
      expect(checkbox).toBeChecked();
    });
  });

  it("should disable budget input when unlimited budget is checked", async () => {
    const userDataWithNullБюджет = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        max_budget: null,
      },
    };

    renderWithProviders(<UserEditView {...defaultProps} userData={userDataWithNullБюджет} />);

    await waitFor(() => {
      const budgetВход = screen.getByRole("spinbutton", { name: /max budget/i });
      expect(budgetВход).toBeDisabled();
    });
  });

  it("should enable budget input when unlimited budget is unchecked", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      const budgetВход = screen.getByRole("spinbutton", { name: /max budget/i });
      expect(budgetВход).toBeEnabled();
    });
  });

  it("should clear budget value when unlimited budget is checked", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Без ограничений Бюджет" })).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox", { name: "Без ограничений Бюджет" });
    await userEvent.click(checkbox);

    await waitFor(() => {
      const budgetВход = screen.getByRole("spinbutton", { name: /max budget/i });
      expect(budgetВход).toHaveЗначение(null);
    });
  });

  it("should display metadata textarea with formatted JSON", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Метаданные")).toBeInTheDocument();
    });

    const metadataTextarea = screen.getByLabelText("Метаданные");
    const expectedJson = JSON.stringify(MOCK_USER_DATA.user_info.metadata, null, 2);
    expect(metadataTextarea).toHaveЗначение(expectedJson);
  });

  it("should display empty metadata textarea when metadata is undefined", async () => {
    const userDataWithвыходМетаданные = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        metadata: undefined,
      },
    };

    renderWithProviders(<UserEditView {...defaultProps} userData={userDataWithвыходМетаданные} />);

    await waitFor(() => {
      const metadataTextarea = screen.getByLabelText("Метаданные");
      expect(metadataTextarea).toHaveЗначение("");
    });
  });

  it("should call onCancel when cancel button is clicked", async () => {
    const onCancelMock = vi.fn();
    renderWithProviders(<UserEditView {...defaultProps} onCancel={onCancelMock} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it("should call onSubmit with form values when form is submitted", async () => {
    const onSubmitMock = vi.fn();
    renderWithProviders(<UserEditView {...defaultProps} onSubmit={onSubmitMock} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });

    const callArgs = onSubmitMock.mock.calls[0][0];
    expect(callArgs.user_id).toBe("user-123");
    expect(callArgs.user_email).toBe("test@example.com");
    expect(callArgs.user_alias).toBe("Test User");
    expect(callArgs.user_role).toBe("proxy_admin");
    expect(callArgs.models).toEqual(["gpt-4", "gpt-3.5-turbo"]);
    expect(callArgs.max_budget).toBe(100.5);
    expect(callArgs.budget_duration).toBe("30d");
    expect(callArgs.metadata).toEqual(MOCK_USER_DATA.user_info.metadata);
  });

  it("should set max_budget to null when unlimited budget is checked on submit", async () => {
    const onSubmitMock = vi.fn();
    const userDataWithNullБюджет = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        max_budget: null,
      },
    };

    renderWithProviders(<UserEditView {...defaultProps} userData={userDataWithNullБюджет} onSubmit={onSubmitMock} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });

    const callArgs = onSubmitMock.mock.calls[0][0];
    expect(callArgs.max_budget).toBeNull();
  });

  it("should require budget when unlimited budget is not checked", async () => {
    renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Макс. бюджет (USD)")).toBeInTheDocument();
    });

    const budgetВход = screen.getByRole("spinbutton", { name: /max budget/i });
    await userEvent.clear(budgetВход);

    const checkbox = screen.getByRole("checkbox", { name: "Без ограничений Бюджет" });
    expect(checkbox).not.toBeChecked();

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Please enter a budget or select Без ограничений Бюджет")).toBeInTheDocument();
    });
  });

  it("should allow submission when unlimited budget is checked even if budget is empty", async () => {
    const onSubmitMock = vi.fn();
    renderWithProviders(<UserEditView {...defaultProps} onSubmit={onSubmitMock} />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Без ограничений Бюджет" })).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox", { name: "Без ограничений Бюджет" });
    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });
  });

  it("should update form values when userData changes", async () => {
    const { rerender } = renderWithProviders(<UserEditView {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText("User Alias")).toHaveЗначение("Test User");
    });

    const updatedUserData = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        user_alias: "Обновлён Alias",
      },
    };

    rerender(<UserEditView {...defaultProps} userData={updatedUserData} />);

    await waitFor(() => {
      expect(screen.getByLabelText("User Alias")).toHaveЗначение("Обновлён Alias");
    });
  });

  it("should handle user data with empty Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs array", async () => {
    const userDataWithEmptyModels = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      },
    };

    renderWithProviders(<UserEditView {...defaultProps} userData={userDataWithEmptyModels} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });

    const callArgs = defaultProps.onSubmit.mock.calls[0][0];
    expect(callArgs.models).toEqual([]);
  });

  it("should handle user data with undefined max_budget", async () => {
    const userDataWithUndefinedБюджет = {
      ...MOCK_USER_DATA,
      user_info: {
        ...MOCK_USER_DATA.user_info,
        max_budget: undefined,
      },
    };

    renderWithProviders(<UserEditView {...defaultProps} userData={userDataWithUndefinedБюджет} />);

    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox", { name: "Без ограничений Бюджет" });
      expect(checkbox).toBeChecked();
    });
  });
  describe("submit payload parity", () => {
    const submittedPayload = async (props: Partial<Parameters<typeof UserEditView>[0]> = {}) => {
      const onSubmit = vi.fn();
      renderWithProviders(<UserEditView {...defaultProps} {...props} onSubmit={onSubmit} />);
      await userEvent.click(await screen.findByRole("button", { name: /save changes/i }));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
      return onSubmit.mock.calls[0][0];
    };

    it("should send exactly the ten keys an admin edit produces, with seeded types preserved", async () => {
      const payload = await submittedPayload();

      expect(Object.keys(payload).sort()).toEqual([
        "budget_duration",
        "max_budget",
        "mcp_servers_and_groups",
        "mcp_tool_permissions",
        "metadata",
        "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
        "user_alias",
        "user_email",
        "user_id",
        "user_role",
      ]);
      expect(payload).toStrictEqual({
        user_id: "user-123",
        user_email: "test@example.com",
        user_alias: "Test User",
        user_role: "proxy_admin",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4", "gpt-3.5-turbo"],
        max_budget: 100.5,
        budget_duration: "30d",
        metadata: { key1: "value1", key2: "value2" },
        mcp_servers_and_groups: { servers: [], accessGroups: [], toolsets: [] },
        mcp_tool_permissions: {},
      });
      expect(typeof payload.max_budget).toBe("number");
    });

    it("should drop user_id, user_email and both mcp keys in bulk edit mode", async () => {
      const payload = await submittedPayload({ isBulkEdit: true });

      expect(Object.keys(payload).sort()).toEqual([
        "budget_duration",
        "max_budget",
        "metadata",
        "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
        "user_alias",
        "user_role",
      ]);
    });

    it("should drop both mcp keys for a non-admin editor while keeping identity keys", async () => {
      const payload = await submittedPayload({ userRole: "user" });

      expect(Object.keys(payload).sort()).toEqual([
        "budget_duration",
        "max_budget",
        "metadata",
        "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
        "user_alias",
        "user_email",
        "user_id",
        "user_role",
      ]);
    });

    it("should send a typed budget as a string, not a number", async () => {
      const onSubmit = vi.fn();
      renderWithProviders(<UserEditView {...defaultProps} onSubmit={onSubmit} />);

      const budgetВход = await screen.findByRole("spinbutton", { name: /max budget/i });
      await userEvent.clear(budgetВход);
      await userEvent.type(budgetВход, "42.57");
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
      expect(onSubmit.mock.calls[0][0].max_budget).toBe("42.57");
    });

    it("should still submit when the loaded user has null instead of missing необязательно fields", async () => {
      const onSubmit = vi.fn();
      renderWithProviders(
        <UserEditView
          {...defaultProps}
          onSubmit={onSubmit}
          userData={{
            user_id: "user-null",
            user_info: {
              user_email: "null@example.com",
              user_alias: null,
              user_role: null,
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: null,
              max_budget: null,
              budget_duration: null,
              metadata: null,
            },
          }}
        />,
      );

      await userEvent.click(await screen.findByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
      expect(onSubmit.mock.calls[0][0]).toMatchObject({
        user_id: "user-null",
        user_email: "null@example.com",
        user_alias: null,
        user_role: null,
        budget_duration: null,
        max_budget: null,
      });
    });

    it("should keep the budget input's native step constraint armed", async () => {
      renderWithProviders(<UserEditView {...defaultProps} />);

      const budgetВход = await screen.findByRole("spinbutton", { name: /max budget/i });
      expect(budgetВход).toHaveAttribute("step", "0.01");
      expect(budgetВход).not.toHaveAttribute("min");
      expect(budgetВход.closest("form")).not.toHaveAttribute("novalidate");
    });

    it("shows the tool matrix for servers the user reaches only through an access group or toolset", async () => {
      vi.mocked(networking.fetchMCP-серверы).mockResolvedЗначение([
        { server_id: "srv-group", server_name: "Group Сервер", alias: "Group Сервер", mcp_access_groups: ["group-a"] },
        { server_id: "srv-toolset", server_name: "Инструментыet Сервер", alias: "Инструментыet Сервер" },
      ]);
      vi.mocked(networking.fetchMCPAccessGroups).mockResolvedЗначение(["group-a"]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedЗначение([
        {
          toolset_id: "toolset-a",
          toolset_name: "Инструментыet A",
          tools: [{ server_id: "srv-toolset", tool_name: "list_issues" }],
        } as never,
      ]);
      vi.mocked(networking.listMCPИнструменты).mockResolvedЗначение({
        tools: [{ name: "list_issues", description: "List issues" }],
        error: false,
      });

      renderWithProviders(
        <UserEditView
          {...defaultProps}
          objectPermission={
            {
              mcp_servers: [],
              mcp_access_groups: ["group-a"],
              mcp_toolsets: ["toolset-a"],
              mcp_tool_permissions: {},
            } as never
          }
        />,
      );

      expect(await screen.findByText("Via access group: group-a")).toBeInTheDocument();
      expect(await screen.findByText("Via toolset: Инструментыet A")).toBeInTheDocument();
      expect(networking.listMCPИнструменты).toHaveBeenCalledWith("test-token", "srv-group");
      expect(networking.listMCPИнструменты).toHaveBeenCalledWith("test-token", "srv-toolset");
    });

    it("should send objects for the mcp keys seeded from objectPermission", async () => {
      const payload = await submittedPayload({
        objectPermission: {
          mcp_servers: ["server-a"],
          mcp_access_groups: ["group-a"],
          mcp_toolsets: ["toolset-a"],
          mcp_tool_permissions: { "server-a": ["tool-a"] },
        } as never,
      });

      expect(payload.mcp_servers_and_groups).toStrictEqual({
        servers: ["server-a"],
        accessGroups: ["group-a"],
        toolsets: ["toolset-a"],
      });
      expect(payload.mcp_tool_permissions).toStrictEqual({ "server-a": ["tool-a"] });
    });

    it("should not submit at all when metadata is not valid JSON", async () => {
      const onSubmit = vi.fn();
      renderWithProviders(<UserEditView {...defaultProps} onSubmit={onSubmit} />);

      const metadata = await screen.findByLabelText("Метаданные");
      await userEvent.clear(metadata);
      await userEvent.type(metadata, "not json");
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByLabelText("Метаданные")).toHaveЗначение("not json");
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // /user/new validates Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget behind an enterprise license, so a
    // form that re-sends what is already stored turns an unrelated edit into a
    // 400 on a proxy withвыход one.
    describe("per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию budgets", () => {
      const withStoredБюджеты = {
        ...MOCK_USER_DATA,
        user_info: {
          ...MOCK_USER_DATA.user_info,
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-4": { budget_limit: 5, time_period: "30d" } },
        },
      };

      it("should leave Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget выход of an edit that did not touch it", async () => {
        const payload = await submittedPayload({ userData: withStoredБюджеты, premiumUser: true });

        expect(payload).not.toHaveСвойство("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget");
      });

      // The proxy stores Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget as a plain dict, exactly as the client
      // sent it, and БюджетКонфигурация documents the max_budget/budget_duration
      // spelling. A row hydrated from the spelling the editor does not read mounts
      // with an empty cap, and every edit re-emits ALL rows, so touching one
      // Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию's budget silently deletes another's.
      it("should keep a row stored under the БюджетКонфигурация aliases when a sibling row is edited", async () => {
        const onSubmit = vi.fn();
        renderWithProviders(
          <UserEditView
            {...defaultProps}
            premiumUser={true}
            onSubmit={onSubmit}
            userData={{
              ...MOCK_USER_DATA,
              user_info: {
                ...MOCK_USER_DATA.user_info,
                Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: {
                  "gpt-4": { max_budget: 5, budget_duration: "30d" },
                  "gpt-3.5-turbo": { budget_limit: 2, time_period: "1h" },
                },
              },
            }}
          />,
        );

        const [aliasRow, canonicalRow] = await screen.findAllByPlaceholderText("Макс. расход ($)");
        expect(aliasRow).toHaveЗначение(5);

        fireEvent.change(canonicalRow, { target: { value: "3" } });
        await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalled();
        });
        expect(onSubmit.mock.calls[0][0].model_max_budget).toEqual({
          "gpt-4": { budget_limit: 5, time_period: "30d" },
          "gpt-3.5-turbo": { budget_limit: 3, time_period: "1h" },
        });
      });

      // The effect already re-seeds the form on a userData change, so that change
      // does happen while this component stays mounted. The editor holds its rows
      // in state seeded once, so withвыход a matching re-seed the rows on screen
      // keep describing the previously loaded user and a save overwrites theirs.
      it("re-seeds the editor when a different user is loaded", async () => {
        const withБюджет = (limit: number, id: string) => ({
          ...MOCK_USER_DATA,
          user_id: id,
          user_info: {
            ...MOCK_USER_DATA.user_info,
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-4": { budget_limit: limit, time_period: "1h" } },
          },
        });

        const { rerender } = renderWithProviders(
          <UserEditView {...defaultProps} premiumUser={true} userData={withБюджет(5, "user-a")} />,
        );
        expect(await screen.findByPlaceholderText("Макс. расход ($)")).toHaveЗначение(5);

        rerender(<UserEditView {...defaultProps} premiumUser={true} userData={withБюджет(99, "user-b")} />);

        expect(await screen.findByPlaceholderText("Макс. расход ($)")).toHaveЗначение(99);
      });

      // BulkEditUsers copies a fixed field list into its payload and never reads
      // Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget, so an editor rendered here would take input and throw
      // it away. It also has no single stored budget to diff against, since its
      // userData stands in for every selected user.
      it("does not offer the editor in bulk edit, where the value would be discarded", async () => {
        renderWithProviders(
          <UserEditView
            {...defaultProps}
            isBulkEdit={true}
            premiumUser={true}
            userData={{
              ...MOCK_USER_DATA,
              user_info: {
                ...MOCK_USER_DATA.user_info,
                Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-4": { budget_limit: 5, time_period: "1h" } },
              },
            }}
          />,
        );

        await screen.findByRole("button", { name: /save changes/i });
        expect(screen.queryByPlaceholderText("Макс. расход ($)")).not.toBeInTheDocument();
      });

      it("should lock the editor when the proxy has no enterprise license", async () => {
        renderWithProviders(<UserEditView {...defaultProps} userData={withStoredБюджеты} />);

        expect(await screen.findByPlaceholderText("Макс. расход ($)")).toBeDisabled();
      });

      it("should leave the editor usable when the proxy has one", async () => {
        renderWithProviders(<UserEditView {...defaultProps} userData={withStoredБюджеты} premiumUser={true} />);

        expect(await screen.findByPlaceholderText("Макс. расход ($)")).toBeEnabled();
      });
    });

    it("should send an empty-string metadata through untouched rather than as an object", async () => {
      const onSubmit = vi.fn();
      renderWithProviders(<UserEditView {...defaultProps} onSubmit={onSubmit} />);

      await userEvent.clear(await screen.findByLabelText("Метаданные"));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
      expect(onSubmit.mock.calls[0][0].metadata).toBe("");
    });
  });
});
