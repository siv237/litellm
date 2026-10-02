import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseВыбратьOption, renderWithПровайдерs, testЗапросClient } from "../../../tests/test-utils";
import { КлючОтвет } from "../key_team_helpers/key_list";
import { MODEL_MAX_BUDGET_PREMIUM_HINT } from "../key_team_helpers/РежимlМакс.БюджетEditor";
import {
  getPassThroughЭндпоинтsCall,
  getPoliciesList,
  getUiSettings,
  getPromptsList,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall,
  vectorStoreListCall,
} from "../networking";
import { КлючEditView } from "./key_edit_view";

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

vi.mock("../networking", async () => {
  const actual = await vi.importActual("../networking");
  return {
    ...actual,
    getUiSettings: vi.fn().mockResolvedЗначение({ values: { enable_projects_ui: false } }),
    getPromptsList: vi.fn().mockResolvedЗначение({
      prompts: [{ prompt_id: "prompt-1" }, { prompt_id: "prompt-2" }],
    }),
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall: vi.fn().mockResolvedЗначение({
      data: [{ id: "gpt-4" }, { id: "gpt-3.5-turbo" }],
    }),
    tagListCall: vi.fn().mockResolvedЗначение({
      tag1: { name: "tag1", description: "Test tag 1" },
      tag2: { name: "tag2", description: "Test tag 2" },
    }),
    getГардрейлыList: vi.fn().mockResolvedЗначение({
      гардрейловs: [{ гардрейлов_name: "гардрейлов-1" }],
    }),
    getPoliciesList: vi.fn().mockResolvedЗначение({
      policies: [{ policy_name: "policy-1" }],
    }),
    getPassThroughЭндпоинтsCall: vi.fn().mockResolvedЗначение({
      endpoints: [],
    }),
    vectorStoreListCall: vi.fn().mockResolvedЗначение({
      data: [],
    }),
    agentListCall: vi.fn().mockResolvedЗначение({
      data: [],
    }),
    fetchMCP-серверы: vi.fn().mockResolvedЗначение([]),
    fetchMCPAccessGroups: vi.fn().mockResolvedЗначение([]),
    listMCPИнструменты: vi.fn().mockResolvedЗначение({
      tools: [],
      error: null,
      message: null,
      stack_trace: null,
    }),
    getАгентыList: vi.fn().mockResolvedЗначение({
      agents: [],
    }),
    getAgentAccessGroups: vi.fn().mockResolvedЗначение([]),
    getClaudeCodeПлагиныList: vi.fn().mockResolvedЗначение({ plugins: [], count: 0 }),
  };
});

vi.mock("../organisms/create_key_button", () => ({
  fetchTeamРежимls: vi.fn().mockResolvedЗначение(["team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"]),
}));

const rвыходerSettingsMocks = vi.hoisted(() => ({
  receivedЗначение: undefined as { rвыходer_settings: Record<string, unknown> } | undefined,
  editedЗначение: null as Record<string, unknown> | null,
}));

vi.mock("../common_components/RвыходerSettingsAccordion", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    default: forwardRef(({ value }: { value?: { rвыходer_settings: Record<string, unknown> } }, ref) => {
      rвыходerSettingsMocks.receivedЗначение = value;
      useImperativeHandle(ref, () => ({
        getЗначение: () => ({ rвыходer_settings: rвыходerSettingsMocks.editedЗначение ?? value?.rвыходer_settings ?? {} }),
      }));
      return <div data-testid="rвыходer-settings-accordion" />;
    }),
  };
});

vi.mock("@/app/(dashboard)/hooks/organizations/useОрганизацияs", () => ({
  useОрганизацияs: vi.fn().mockReturnЗначение({
    data: [
      {
        organization_id: "org-1",
        organization_alias: "Engineering",
        members: [{ user_id: "user-orbit", user_role: "org_admin" }],
      },
      { organization_id: "org-2", organization_alias: "Sales" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: vi.fn().mockReturnЗначение({
    data: [
      { access_group_id: "ag-1", access_group_name: "Group 1" },
      { access_group_id: "ag-2", access_group_name: "Group 2" },
    ],
    isLoading: false,
    isОшибка: false,
  }),
}));

vi.mock("../mcp_server_management/MCPСерверВыбратьor", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: { servers?: string[]; accessGroups?: string[]; toolsets?: string[] };
    onChange?: (v: { servers: string[]; accessGroups: string[]; toolsets: string[] }) => void;
  }) => (
    <button
      type="button"
      data-testid="mcp-server-selector"
      onClick={() => onChange?.({ servers: ["mcp-1"], accessGroups: [], toolsets: value?.toolsets ?? [] })}
    >
      pick mcp server
    </button>
  ),
}));

vi.mock("../agent_management/AgentВыбратьor", () => ({
  default: ({ onChange }: { onChange?: (v: { agents: string[]; accessGroups: string[] }) => void }) => (
    <button
      type="button"
      data-testid="agent-selector"
      onClick={() => onChange?.({ agents: ["agent-1"], accessGroups: [] })}
    >
      pick agent
    </button>
  ),
}));

vi.mock("../skills/SkillВыбратьor", () => ({
  default: ({ onChange }: { onChange: (selected: string[]) => void }) => (
    <button type="button" data-testid="skill-selector" onClick={() => onChange(["private-skill"])}>
      pick skill
    </button>
  ),
}));

vi.mock("../common_components/AccessGroupВыбратьor", () => ({
  default: ({ value = [], onChange }: { value?: string[]; onChange?: (v: string[]) => void }) => (
    <input
      data-testid="access-group-selector"
      value={Array.isArray(value) ? value.join(",") : ""}
      onChange={(e) => onChange?.(e.target.value ? e.target.value.split(",").map((s) => s.trim()) : [])}
    />
  ),
}));

const visibleOptions = (): HTMLElement[] => screen.queryВсеByRole("option");

const isOptionDisabled = (option: HTMLElement): boolean => option.getAttribute("aria-disabled") === "true";

const optionByContent = (label: string): HTMLElement | undefined =>
  visibleOptions().find((el) => el.textContent === label);

describe("КлючEditView", () => {
  const MOCK_KEY_DATA: КлючОтвет = {
    token: "test-token-123",
    token_id: "test-token-123",
    key_name: "sk-...TUuw",
    key_alias: "asdasdas",
    spend: 0,
    max_budget: 0,
    expires: "null",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    aliases: {},
    config: {},
    user_id: "default_user_id",
    team_id: null,
    max_parallel_requests: 10,
    metadata: {
      logging: [],
      tags: ["test-tag"],
    },
    tpm_limit: 10,
    rpm_limit: 10,
    duration: "30d",
    budget_duration: "30d",
    budget_reset_at: "never",
    allowed_cache_controls: [],
    allowed_rвыходes: [],
    permissions: {},
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_spend: {},
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: {},
    soft_budget_cooldown: false,
    blocked: false,
    litellm_budget_table: {},
    organization_id: null,
    created_at: "2025-10-29T01:26:41.613000Z",
    updated_at: "2025-10-29T01:47:33.980000Z",
    team_spend: 100,
    team_alias: "",
    team_tpm_limit: 100,
    team_rpm_limit: 100,
    team_max_budget: 100,
    team_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    team_blocked: false,
    soft_budget: 200,
    team_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases: {},
    team_member_spend: 0,
    team_metadata: {},
    end_user_id: "default_user_id",
    end_user_tpm_limit: 10,
    end_user_rpm_limit: 10,
    end_user_max_budget: 0,
    last_refreshed_at: Date.now(),
    api_key: "sk-...TUuw",
    user_role: "user",
    rpm_limit_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: {},
    tpm_limit_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: {},
    user_tpm_limit: 10,
    user_rpm_limit: 10,
    user_email: "test@example.com",
    object_permission: {
      object_permission_id: "067002ed-3b01-4bb3-b942-cefa400f0049",
      mcp_servers: [],
      mcp_access_groups: [],
      mcp_tool_permissions: {},
      vector_stores: [],
    },
    auto_rotate: false,
    rotation_interval: undefined,
    last_rotation_at: undefined,
    key_rotation_at: undefined,
  };
  describe("rвыходer settings", () => {
    const UNSUPPORTED_STORED_FIELD = { tag_rвыходing_prefix: "team-" };
    const STORED_ROUTER_SETTINGS = {
      num_retries: 2,
      fallbacks: [{ "gpt-4": ["gpt-4o"] }],
      ...UNSUPPORTED_STORED_FIELD,
    };

    const renderWithRвыходerSettings = (onSubmit: (values: Record<string, unknown>) => Promise<void>) =>
      renderWithПровайдерs(
        <КлючEditView
          keyData={{ ...MOCK_KEY_DATA, rвыходer_settings: STORED_ROUTER_SETTINGS }}
          onCancel={() => {}}
          onSubmit={onSubmit}
          accessТокен="test-token"
          userID="test-user"
          userRole="proxy_admin"
          premiumUser={true}
        />,
      );

    beforeEach(() => {
      rвыходerSettingsMocks.receivedЗначение = undefined;
      rвыходerSettingsMocks.editedЗначение = null;
    });

    it("should load the fields it renders into the editor and withhold the ones it does not", async () => {
      renderWithRвыходerSettings(async () => {});

      await waitFor(() => {
        expect(rвыходerSettingsMocks.receivedЗначение).toStrictEqual({
          rвыходer_settings: { num_retries: 2, fallbacks: [{ "gpt-4": ["gpt-4o"] }] },
        });
      });
    });

    it("should submit edited fallbacks alongside rвыходing fields the editor cannot show", async () => {
      const onSubmit = vi.fn().mockResolvedЗначение(undefined);
      renderWithRвыходerSettings(onSubmit);
      rвыходerSettingsMocks.editedЗначение = { num_retries: 2, fallbacks: [{ "gpt-4": ["gpt-4o", "gpt-4o-mini"] }] };

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            rвыходer_settings: expect.objectContaining({
              ...UNSUPPORTED_STORED_FIELD,
              num_retries: 2,
              fallbacks: [{ "gpt-4": ["gpt-4o", "gpt-4o-mini"] }],
            }),
          }),
        );
      });
    });

    it("should submit cleared rвыходer settings so removing every fallback is persisted", async () => {
      const onSubmit = vi.fn().mockResolvedЗначение(undefined);
      renderWithRвыходerSettings(onSubmit);
      rвыходerSettingsMocks.editedЗначение = { num_retries: null, fallbacks: null };

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            rвыходer_settings: expect.objectContaining({
              ...UNSUPPORTED_STORED_FIELD,
              num_retries: null,
              fallbacks: null,
            }),
          }),
        );
      });
    });
  });

  it("should render", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });
  });

  it("should render tags", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("test-tag")).toBeInTheDocument();
    });
  });

  it("should not render tags in metadata textarea", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    const metadataTextarea = screen.getByLabelText("Метаданные") as HTMLTextAreaElement;
    await waitFor(() => {
      expect(metadataTextarea).toHaveЗначение("{}");
    });
  });

  beforeEach(() => {
    vi.clearВсеMocks();
    can.mockReturnЗначение(true);
    vi.mocked(getUiSettings).mockResolvedЗначение({ values: { enable_projects_ui: false } });
    testЗапросClient.removeQueries({ queryКлюч: ["uiSettings"] });
  });

  describe("policy and prompt fields", () => {
    const renderAs = (userRole: string) =>
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен="test-token"
          userID="user-123"
          userRole={userRole}
          premiumUser={true}
        />,
      );

    it("locks the prompts control for a non-premium admin so an unsavable value cannot be entered", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"Admin"}
          premiumUser={false}
        />,
      );

      const prompts = await screen.findByLabelText(/Prompts/);
      expect(prompts).toBeDisabled();

      await userEvent.type(prompts, "sneaky-prompt{Введите}");

      expect(screen.queryByLabelText("sneaky-prompt")).not.toBeInTheDocument();
    });

    it("leaves the prompts control usable for a premium admin", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"Admin"}
          premiumUser={true}
        />,
      );

      const prompts = await screen.findByLabelText(/Prompts/);
      expect(prompts).toBeEnabled();

      await userEvent.type(prompts, "allowed-prompt{Введите}");

      expect(await screen.findByLabelText("allowed-prompt")).toBeInTheDocument();
    });

    it("should render both fields and load prompts for an admin", async () => {
      renderAs("Admin");

      await waitFor(() => {
        expect(getPromptsList).toHaveBeenCalledWith("test-token");
      });
      expect(screen.getByText("Prompts", { selector: "label" })).toBeInTheDocument();
      expect(screen.getByText("Policies")).toBeInTheDocument();
    });

    it("lists a prompt existing in several environments once in the dropdown", async () => {
      vi.mocked(getPromptsList).mockResolvedЗначениеOnce({
        prompts: [
          { prompt_id: "envgreet", litellm_params: {}, prompt_info: { prompt_type: "db" }, environment: "development" },
          { prompt_id: "envgreet", litellm_params: {}, prompt_info: { prompt_type: "db" }, environment: "production" },
        ],
      });

      renderAs("Admin");

      const prompts = await screen.findByLabelText(/Prompts/);
      await userEvent.type(prompts, "envgreet");

      expect(await screen.findВсеByRole("option", { name: "envgreet" })).toHaveLength(1);
    });

    it("should omit both fields and fire neither admin-only request for an internal user", async () => {
      renderAs("Internal User");

      await waitFor(() => {
        expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall).toHaveBeenCalled();
      });

      expect(getPromptsList).not.toHaveBeenCalled();
      expect(getPoliciesList).not.toHaveBeenCalled();
      expect(screen.queryByText("Prompts", { selector: "label" })).not.toBeInTheDocument();
      expect(screen.queryByText("Policies")).not.toBeInTheDocument();
    });
  });

  it("should call onCancel withвыход submitting the form when cancel button is clicked", async () => {
    const onCancelMock = vi.fn();
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={onCancelMock}
        onSubmit={onSubmitMock}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    const cancelButton = await screen.findByRole("button", { name: /отмена/i });
    await userEvent.click(cancelButton);

    expect(onCancelMock).toHaveBeenCalledВремяs(1);
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it("should display key alias input field", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Псевдоним ключа")).toBeInTheDocument();
    });
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs select field", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Модели")).toBeInTheDocument();
    });
  });

  it("should display max budget input field", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Макс. бюджет (USD)")).toBeInTheDocument();
    });
  });

  it("should display allowed rвыходes input field", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/allowed rвыходes/i)).toBeInTheDocument();
    });
  });

  it("should call onSubmit with form values when form is submitted", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });
  });

  it("should initialize and submit throttle_on_budget_exceeded from key metadata", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithThrottle = {
      ...MOCK_KEY_DATA,
      metadata: { ...MOCK_KEY_DATA.metadata, throttle_on_budget_exceeded: true },
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithThrottle}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Throttle on budget exceeded")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({ throttle_on_budget_exceeded: true }));
    });
  });

  it("should initialize and submit enable_prompt_caching from key metadata", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithPromptCaching = {
      ...MOCK_KEY_DATA,
      metadata: { ...MOCK_KEY_DATA.metadata, enable_prompt_caching: true },
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithPromptCaching}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Enable Prompt Caching")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({ enable_prompt_caching: true }));
    });
  });

  it("should disable Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs field when management rвыходes are selected", async () => {
    const keyDataWithManagementRвыходes = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: ["management_rвыходes"],
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithManagementRвыходes}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Поле «Модели» недоступно для этого типа ключа")).toBeInTheDocument();
    });
  });

  it("should disable Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs field when info rвыходes are selected", async () => {
    const keyDataWithInfoRвыходes = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: ["info_rвыходes"],
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithInfoRвыходes}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Поле «Модели» недоступно для этого типа ключа")).toBeInTheDocument();
    });
  });

  it("should disable гардрейловs selector when user is not premium and has no write access role", async () => {
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={"test-token"}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Гардрейлы")).toBeInTheDocument();
    });
  });

  it("should parse comma-separated allowed rвыходes on submit", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/allowed rвыходes/i)).toBeInTheDocument();
    });

    const allowedRвыходesВход = screen.getByLabelText(/allowed rвыходes/i);
    await userEvent.clear(allowedRвыходesВход);
    await userEvent.type(allowedRвыходesВход, "rвыходe1, rвыходe2, rвыходe3");

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(Array.isArray(callArgs.allowed_rвыходes)).toBe(true);
      expect(callArgs.allowed_rвыходes).toEqual(["rвыходe1", "rвыходe2", "rвыходe3"]);
    });
  });

  it("should handle empty allowed rвыходes string on submit", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithRвыходes = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: ["llm_api_rвыходes"],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithRвыходes}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/allowed rвыходes/i)).toBeInTheDocument();
    });

    const allowedRвыходesВход = screen.getByLabelText(/allowed rвыходes/i);
    await userEvent.clear(allowedRвыходesВход);

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.allowed_rвыходes).toEqual([]);
    });
  });

  it("should omit allowed_rвыходes from submit when value is unchanged", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const aiApisКлючData = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: ["llm_api_rвыходes"],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={aiApisКлючData}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect("allowed_rвыходes" in callArgs).toBe(false);
    });
  });

  it("should omit allowed_rвыходes from submit when keyData.allowed_rвыходes is null and form is untouched", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataNullRвыходes = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: null as unknown as string[],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataNullRвыходes}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect("allowed_rвыходes" in callArgs).toBe(false);
    });
  });

  it("should omit allowed_rвыходes from submit when server returned rвыходes in a different order", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataReordered = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: ["beta_rвыходes", "alpha_rвыходes"],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataReordered}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect("allowed_rвыходes" in callArgs).toBe(false);
    });
  });

  it("should pass access_group_ids to onSubmit when saving key with access groups", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithAccessGroups = {
      ...MOCK_KEY_DATA,
      access_group_ids: ["ag-1"],
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithAccessGroups}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен="test-token"
        userID="test-user"
        userRole="admin"
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("access-group-selector")).toBeInTheDocument();
    });

    const accessGroupВход = screen.getByTestId("access-group-selector");
    await userEvent.clear(accessGroupВход);
    await userEvent.type(accessGroupВход, "ag-1,ag-2");

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.access_group_ids).toEqual(["ag-1", "ag-2"]);
    });
  });

  it("should keep mcp_toolsets when saving an edit that does not touch the MCP selector", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithИнструментыet = {
      ...MOCK_KEY_DATA,
      object_permission: {
        ...MOCK_KEY_DATA.object_permission!,
        mcp_toolsets: ["ts-1"],
      },
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithИнструментыet}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен="test-token"
        userID="test-user"
        userRole="admin"
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });
    expect(onSubmitMock.mock.calls[0][0].mcp_servers_and_groups.toolsets).toEqual(["ts-1"]);
  });

  it("should submit budget_limits: [] when the last budget window is deleted", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithWindow = {
      ...MOCK_KEY_DATA,
      budget_limits: [{ budget_duration: "30d", max_budget: 100 }],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithWindow}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const deleteWindowButton = await screen.findByRole("button", { name: "✕" });
    await userEvent.click(deleteWindowButton);

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_limits).toEqual([]);
    });
  });

  it("should persist a canonical budget_duration value, not a word-form the backend cannot parse", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await chooseВыбратьOption(userEvent, await screen.findByLabelText("Сброс бюджета"), "weekly");

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_duration).toBe("7d");
    });
  });

  it("should keep an existing canonical budget_duration canonical when saved untouched", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const submitButton = await screen.findByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_duration).toBe("30d");
    });
  });

  it("should heal a legacy word-form budget_duration to canonical when saved untouched", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const legacyКлючData = { ...MOCK_KEY_DATA, budget_duration: "monthly" };
    renderWithПровайдерs(
      <КлючEditView
        keyData={legacyКлючData}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const submitButton = await screen.findByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_duration).toBe("30d");
    });
  });

  it("should send an explicit null budget_duration when a previously-set Сбросить бюджет is cleared", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const resetБюджет = await screen.findByLabelText("Сброс бюджета");
    await chooseВыбратьOption(userEvent, resetБюджет, "Никогда не сбрасывать");

    await waitFor(() => {
      expect(resetБюджет).toHaveTextContent("Никогда не сбрасывать");
    });

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });
    const callArgs = onSubmitMock.mock.calls[0][0];
    expect(callArgs.budget_duration).toBeNull();
    expect(JSON.stringify({ ...callArgs })).toContain('"budget_duration":null');
  });

  it("should send an explicit null budget_duration when a legacy word-form Сбросить бюджет is cleared", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const legacyКлючData = { ...MOCK_KEY_DATA, budget_duration: "monthly" };
    renderWithПровайдерs(
      <КлючEditView
        keyData={legacyКлючData}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await chooseВыбратьOption(userEvent, await screen.findByLabelText("Сброс бюджета"), "Никогда не сбрасывать");

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });
    expect(onSubmitMock.mock.calls[0][0].budget_duration).toBeNull();
  });

  it("should omit budget_limits when existing windows are left untouched (issue #33246)", async () => {
    // The backend treats any budget_limits in the payload as an admin-only
    // budget change, so re-sending untouched windows 403s a non-admin owner.
    // Leaving the field off keeps the stored windows and passes the gate.
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithWindow = {
      ...MOCK_KEY_DATA,
      budget_limits: [{ budget_duration: "30d", max_budget: 100, reset_at: "2026-08-01T00:00:00" }],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithWindow}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const submitButton = await screen.findByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_limits).toBeUndefined();
    });
  });

  it("should omit budget_limits on a key that has no windows (issue #33246 repro)", async () => {
    // Core repro: a non-admin owner edits a non-budget field on a key with no
    // budget windows. The form previously always sent budget_limits: [], which
    // the backend read as a budget change and rejected.
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA} // no budget_limits
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const submitButton = await screen.findByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_limits).toBeUndefined();
    });
  });

  it("should send budget_limits when a window's cap is changed", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithWindow = {
      ...MOCK_KEY_DATA,
      budget_limits: [{ budget_duration: "30d", max_budget: 100 }],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithWindow}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const maxБюджетВход = await screen.findByPlaceholderText("Макс. расход ($)");
    await userEvent.clear(maxБюджетВход);
    await userEvent.type(maxБюджетВход, "200");

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_limits).toEqual([{ budget_duration: "30d", max_budget: 200 }]);
    });
  });

  it("should omit budget_limits (not clear stored windows) when a window is left incomplete", async () => {
    const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
    const keyDataWithWindow = {
      ...MOCK_KEY_DATA,
      budget_limits: [{ budget_duration: "30d", max_budget: 100 }],
    };
    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithWindow}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    const maxБюджетВход = await screen.findByPlaceholderText("Макс. расход ($)");
    await userEvent.clear(maxБюджетВход);

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.budget_limits).toBeUndefined();
    });
  });

  describe("per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию budgets", () => {
    const keyDataWithБюджеты = {
      ...MOCK_KEY_DATA,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-4": { budget_limit: 5, time_period: "30d" } },
    };

    const renderWith = (premiumUser: boolean) => {
      const onSubmit = vi.fn().mockResolvedЗначение(undefined);
      renderWithПровайдерs(
        <КлючEditView
          keyData={keyDataWithБюджеты}
          onCancel={() => {}}
          onSubmit={onSubmit}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"admin"}
          premiumUser={premiumUser}
        />,
      );
      return onSubmit;
    };

    // Same hazard as the user edit form: keyData changes while this component
    // stays mounted (the effect re-seeds the form for exactly that reason), and
    // the editor's rows live in state seeded once.
    it("re-seeds the editor when a different key is loaded", async () => {
      const withБюджет = (limit: number, token: string) => ({
        ...MOCK_KEY_DATA,
        token,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-4": { budget_limit: limit, time_period: "1h" } },
      });

      const { rerender } = renderWithПровайдерs(
        <КлючEditView
          keyData={withБюджет(5, "tok-a")}
          onCancel={() => {}}
          onSubmit={vi.fn().mockResolvedЗначение(undefined)}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"admin"}
          premiumUser={true}
        />,
      );
      expect(await screen.findByPlaceholderText("Макс. расход ($)")).toHaveЗначение(5);

      rerender(
        <КлючEditView
          keyData={withБюджет(99, "tok-b")}
          onCancel={() => {}}
          onSubmit={vi.fn().mockResolvedЗначение(undefined)}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"admin"}
          premiumUser={true}
        />,
      );

      expect(await screen.findByPlaceholderText("Макс. расход ($)")).toHaveЗначение(99);
    });

    it("should say why the editor is locked when the proxy has no enterprise license", async () => {
      renderWith(false);

      expect(await screen.findByText(MODEL_MAX_BUDGET_PREMIUM_HINT)).toBeInTheDocument();
    });

    it("should leave the editor usable when the proxy has one", async () => {
      renderWith(true);

      expect(await screen.findByText(/Cap spend per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию over its own window/)).toBeInTheDocument();
      expect(screen.queryByText(MODEL_MAX_BUDGET_PREMIUM_HINT)).not.toBeInTheDocument();
    });

    // /key/update validates Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget whenever the field is present and
    // rejects it withвыход a license, so re-sending an untouched budget would turn
    // every unrelated edit into a 400.
    it("should leave Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget выход of an edit that did not touch it", async () => {
      const onSubmit = renderWith(true);

      await userEvent.click(await screen.findByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
      expect(onSubmit.mock.calls[0][0]).not.toHaveСвойство("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget");
    });
  });

  it("should display 'AI APIs' label for the llm_api key type option", async () => {
    const keyDataWithLlmApiRвыходes = {
      ...MOCK_KEY_DATA,
      allowed_rвыходes: ["llm_api_rвыходes"],
    };

    renderWithПровайдерs(
      <КлючEditView
        keyData={keyDataWithLlmApiRвыходes}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessТокен={""}
        userID={""}
        userRole={""}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Тип ключа")).toBeInTheDocument();
    });

    // The selected key type label should show "AI APIs" (not "LLM API")
    await userEvent.click(screen.getByLabelText("Тип ключа"));

    await waitFor(() => {
      // Verify "AI APIs" appears as an option label
      const optionTexts = visibleOptions().map((el) => el.textContent);
      const hasAIAPIs = optionTexts.some((text) => text?.includes("AI APIs"));
      expect(hasAIAPIs).toBe(true);

      // Verify old "LLM API" label does NOT appear
      const hasLLMAPI = optionTexts.some((text) => text?.includes("LLM API"));
      expect(hasLLMAPI).toBe(false);
    });
  });

  it("should display cancel button during submission", async () => {
    let resolveSubmit: (() => void) | undefined;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    const onSubmitMock = vi.fn(() => submitPromise);

    renderWithПровайдерs(
      <КлючEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={onSubmitMock}
        accessТокен={"test-token"}
        userID={"test-user"}
        userRole={"admin"}
        premiumUser={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /отмена/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(submitButton);

    // Wait for onSubmit to be called, which means handleSubmit has started and isКлючSaving should be true
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    });

    // Wait for the cancel button to actually be disabled (state update may take a moment)
    await waitFor(
      () => {
        const cancelButton = screen.getByRole("button", { name: /отмена/i });
        expect(cancelButton).toBeDisabled();
      },
      { timeвыход: 3000 },
    );

    // Clean up: resolve the promise to allow the form to complete
    if (resolveSubmit) {
      resolveSubmit();
    }
  });

  describe("organization dropdown", () => {
    it("should render the organization dropdown", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен=""
          userID=""
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Организация")).toBeInTheDocument();
      });
    });

    it("should disable the organization dropdown for non-admin users", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен=""
          userID=""
          userRole="Internal User"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Организация")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByLabelText("Организация"));

      expect(screen.queryByText("Engineering")).not.toBeInTheDocument();
    });

    it("should not disable the organization dropdown for admin users", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен=""
          userID=""
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Организация")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByLabelText("Организация"));

      expect(await screen.findByText("Engineering")).toBeInTheDocument();
    });

    it("should initialize organization from keyData", async () => {
      const keyWithOrg = {
        ...MOCK_KEY_DATA,
        organization_id: "org-1",
      };

      renderWithПровайдерs(
        <КлючEditView
          keyData={keyWithOrg}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен=""
          userID=""
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Организация")).toHaveЗначение("Engineering");
      });
    });

    it("clears the organization and its dependent team in the update payload", async () => {
      const onSubmit = vi.fn().mockResolvedЗначение(undefined);
      renderWithПровайдерs(
        <КлючEditView
          keyData={{ ...MOCK_KEY_DATA, organization_id: "org-1", team_id: "group-maple" }}
          onCancel={() => {}}
          onSubmit={onSubmit}
          accessТокен=""
          userID=""
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Организация")).toHaveЗначение("Engineering");
      });
      await userEvent.click(screen.getByRole("button", { name: "Clear" }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ organization_id: null, team_id: null }));
      });
      expect(JSON.parse(JSON.stringify(onSubmit.mock.calls[0][0]))).toMatchObject({
        organization_id: null,
        team_id: null,
      });
    });

    it("should save an explicit project detach while keeping parents locked until the saved key changes", async () => {
      vi.mocked(getUiSettings).mockResolvedЗначение({ values: { enable_projects_ui: true } });
      const onSubmit = vi.fn().mockResolvedЗначение(undefined);
      const onCancel = vi.fn();
      const key = { ...MOCK_KEY_DATA, organization_id: "org-1", team_id: "group-maple", project_id: "project-orbit" };
      const team = {
        team_id: "group-maple",
        organization_id: "org-1",
        members_with_roles: [] as { user_id: string; role: string }[],
        team_member_permissions: [] as string[],
      };
      const renderEditor = (keyData: КлючОтвет = key, role = "Admin", editorTeam = team) => (
        <КлючEditView
          keyData={keyData}
          teams={[editorTeam]}
          onCancel={onCancel}
          onSubmit={onSubmit}
          accessТокен=""
          userID="user-orbit"
          userRole={role}
          premiumUser={false}
        />
      );
      const view = renderWithПровайдерs(renderEditor());
      await userEvent.click(await screen.findByRole("button", { name: "Detach from project" }));
      expect(screen.getByRole("combobox", { name: "Организация" })).toBeDisabled();
      expect(screen.getByRole("combobox", { name: "ID команды" })).toBeDisabled();
      await userEvent.click(screen.getByRole("button", { name: "Отмена" }));
      expect(onCancel).toHaveBeenCalledOnce();
      expect(onSubmit).not.toHaveBeenCalled();
      view.rerender(renderEditor({ ...key }));
      await userEvent.click(await screen.findByRole("button", { name: "Detach from project" }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));
      const expectedDetach = { project_id: null, organization_id: "org-1", team_id: "group-maple", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: key.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs };
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(expectedDetach)));
      expect(screen.getByRole("combobox", { name: "ID команды" })).toBeDisabled();
      view.rerender(renderEditor({ ...key, project_id: null }));
      expect(screen.getByRole("combobox", { name: "ID команды" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Detach from project" })).not.toBeInTheDocument();
      view.rerender(renderEditor(key, "Internal User"));
      expect(screen.queryByRole("button", { name: "Detach from project" })).not.toBeInTheDocument();
      view.rerender(renderEditor(key, "Org Admin"));
      expect(screen.queryByRole("button", { name: "Detach from project" })).not.toBeInTheDocument();
      const memberTeam = { ...team, members_with_roles: [{ user_id: "user-orbit", role: "user" }] };
      view.rerender(renderEditor(key, "Org Admin", memberTeam));
      expect(screen.queryByRole("button", { name: "Detach from project" })).not.toBeInTheDocument();
      const permittedTeam = { ...memberTeam, team_member_permissions: ["/key/update"] };
      view.rerender(renderEditor(key, "Org Admin", permittedTeam));
      expect(await screen.findByRole("button", { name: "Detach from project" })).toBeInTheDocument();
      const adminTeam = { ...team, members_with_roles: [{ user_id: "user-orbit", role: "admin" }] };
      view.rerender(renderEditor(key, "Internal User", adminTeam));
      expect(await screen.findByRole("button", { name: "Detach from project" })).toBeInTheDocument();
    });

    it("keeps project key relationships locked and omits project updates when the project UI is disabled", async () => {
      const onSubmit = vi.fn().mockResolvedЗначение(undefined);
      renderWithПровайдерs(
        <КлючEditView
          keyData={{ ...MOCK_KEY_DATA, organization_id: "org-1", team_id: "group-maple", project_id: "project-orbit" }}
          onCancel={() => {}}
          onSubmit={onSubmit}
          accessТокен=""
          userID=""
          userRole="Admin"
          premiumUser={false}
        />,
      );
      expect(await screen.findByRole("combobox", { name: "Организация" })).toBeDisabled();
      expect(screen.getByRole("combobox", { name: "ID команды" })).toBeDisabled();
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledВремяs(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ organization_id: "org-1", team_id: "group-maple" });
      expect(onSubmit.mock.calls[0][0]).not.toHaveСвойство("project_id");
    });
  });

  describe("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs dropdown team gating", () => {
    const openРежимlsDropdown = async () => {
      await userEvent.click(screen.getByLabelText("Модели"));
    };

    it("should offer all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs but not all-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for a teamless key", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен="test-token"
          userID="user-123"
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Модели", { selector: "label" })).toBeInTheDocument();
      });

      await openРежимlsDropdown();

      await waitFor(() => {
        expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
      });

      expect(screen.getВсеByText("Все модели прокси").length).toBeGreaterThan(0);
      expect(screen.queryВсеByText("Все модели команды")).toHaveLength(0);
    });

    it("should offer all-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs but hide all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for a team key", async () => {
      const teamКлючData = { ...MOCK_KEY_DATA, team_id: "team-1" };
      const teams = [{ team_id: "team-1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", "team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"] }];

      renderWithПровайдерs(
        <КлючEditView
          keyData={teamКлючData}
          teams={teams}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен="test-token"
          userID="user-123"
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Модели", { selector: "label" })).toBeInTheDocument();
      });

      await openРежимlsDropdown();

      await waitFor(() => {
        expect(screen.getВсеByText("team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1").length).toBeGreaterThan(0);
      });

      expect(screen.getВсеByText("Все модели команды").length).toBeGreaterThan(0);
      expect(screen.queryВсеByText("Все модели прокси")).toHaveLength(0);
      expect(screen.queryВсеByText("all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")).toHaveLength(0);
    });

    it("should not offer all-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for a team key whose team has not loaded yet", async () => {
      const teamКлючData = { ...MOCK_KEY_DATA, team_id: "team-1" };

      renderWithПровайдерs(
        <КлючEditView
          keyData={teamКлючData}
          teams={[]}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен="test-token"
          userID="user-123"
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Модели", { selector: "label" })).toBeInTheDocument();
      });

      await openРежимlsDropdown();

      expect(screen.queryВсеByText("Все модели команды")).toHaveLength(0);
      expect(screen.queryВсеByText("Все модели прокси")).toHaveLength(0);
    });

    it("should not duplicate the all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs option when the teamless Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию list already carries the sentinel", async () => {
      vi.mocked(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall).mockResolvedЗначениеOnce({
        data: [{ id: "all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" }, { id: "gpt-4" }],
      });

      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен="test-token"
          userID="user-123"
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Модели", { selector: "label" })).toBeInTheDocument();
      });

      await openРежимlsDropdown();

      const proxyOptionLabels = () => visibleOptions().map((option) => option.textContent);

      await waitFor(() => {
        expect(proxyOptionLabels()).toContain("gpt-4");
      });

      const labels = proxyOptionLabels();
      expect(labels.filter((label) => label === "Все модели прокси")).toHaveLength(1);
      expect(labels).not.toContain("all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    });

    it("should collapse the selection to all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs when the sentinel is picked alongside a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);

      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={onSubmitMock}
          accessТокен="test-token"
          userID="user-123"
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Модели", { selector: "label" })).toBeInTheDocument();
      });

      await openРежимlsDropdown();

      const clickOption = async (label: string) => {
        const option = await waitFor(() => {
          const match = optionByContent(label);
          expect(match).toBeTruthy();
          return match as HTMLElement;
        });
        fireEvent.click(option);
      };

      await clickOption("gpt-4");
      await clickOption("Все модели прокси");
      await userEvent.keyboard("{Escape}");

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs).toEqual(["all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"]);
    });

    it("should disable the individual Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию options once all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs is selected", async () => {
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={async () => {}}
          accessТокен="test-token"
          userID="user-123"
          userRole="Admin"
          premiumUser={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Модели", { selector: "label" })).toBeInTheDocument();
      });

      await openРежимlsDropdown();

      const findOption = (label: string) => optionByContent(label);

      const gpt4Before = await waitFor(() => {
        const match = findOption("gpt-4");
        expect(match).toBeTruthy();
        return match!;
      });
      expect(isOptionDisabled(gpt4Before)).toBe(false);

      fireEvent.click(
        await waitFor(() => {
          const match = findOption("Все модели прокси");
          expect(match).toBeTruthy();
          return match!;
        }),
      );

      await waitFor(() => {
        expect(isOptionDisabled(findOption("gpt-4")!)).toBe(true);
      });
    });
  });

  describe("estimated выходput tokens", () => {
    const renderEditView = (
      keyData: КлючОтвет,
      onSubmit: (values: any) => Promise<void>,
      userRole: string = "Admin",
    ) =>
      renderWithПровайдерs(
        <КлючEditView
          keyData={keyData}
          onCancel={() => {}}
          onSubmit={onSubmit}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={userRole}
          premiumUser={false}
        />,
      );

    it("refuses to save an invalid per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию estimate, and saves once it is corrected", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderEditView(MOCK_KEY_DATA, onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });
      const perРежимl = screen.getByLabelText("Estimated Выход Токенs Per Режимl");

      fireEvent.change(perРежимl, { target: { value: "not json" } });
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      expect(await screen.findByText(/JSON object of positive integers/)).toBeInTheDocument();
      expect(onSubmitMock).not.toHaveBeenCalled();

      fireEvent.change(perРежимl, { target: { value: '{"gpt-4": 4096}' } });
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
    });

    it("refuses to save a fractional estimate, and saves once it is corrected", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderEditView(MOCK_KEY_DATA, onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });
      const estimate = screen.getByLabelText("Estimated Выход Токенs");

      fireEvent.change(estimate, { target: { value: "12.5" } });
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).not.toHaveBeenCalled();
      });

      fireEvent.change(estimate, { target: { value: "2048" } });
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
    });

    it("loads the estimates from key metadata and resubmits them unchanged", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderEditView(
        {
          ...MOCK_KEY_DATA,
          metadata: {
            ...MOCK_KEY_DATA.metadata,
            default_estimated_выходput_tokens: 512,
            default_estimated_выходput_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: { "gpt-4": 4096 },
          },
        },
        onSubmitMock,
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Estimated Выход Токенs")).toHaveЗначение(512);
      });
      expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toHaveЗначение('{"gpt-4":4096}');

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.default_estimated_выходput_tokens).toBe(512);
      expect(callArgs.default_estimated_выходput_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toEqual({ "gpt-4": 4096 });
    });

    it("submits edited estimates as a number and a parsed object", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderEditView(MOCK_KEY_DATA, onSubmitMock);

      await waitFor(() => {
        expect(screen.getByLabelText("Estimated Выход Токенs")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Estimated Выход Токенs"), { target: { value: "2048" } });
      fireEvent.change(screen.getByLabelText("Estimated Выход Токенs Per Режимl"), {
        target: { value: '{"gpt-5": 8192}' },
      });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs.default_estimated_выходput_tokens).toBe(2048);
      expect(callArgs.default_estimated_выходput_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toEqual({ "gpt-5": 8192 });
    });

    it("omits both estimates from the payload when the controls are blank", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderEditView(MOCK_KEY_DATA, onSubmitMock);

      await waitFor(() => {
        expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toHaveЗначение("");
      });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      const callArgs = onSubmitMock.mock.calls[0][0];
      expect(callArgs).not.toHaveСвойство("default_estimated_выходput_tokens");
      expect(callArgs).not.toHaveСвойство("default_estimated_выходput_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
    });

    it.each(["Internal User", "Admin Viewer", "org_admin"])(
      "leaves both controls read-only for %s and still resubmits the stored values",
      async (userRole) => {
        const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
        renderEditView(
          {
            ...MOCK_KEY_DATA,
            metadata: {
              ...MOCK_KEY_DATA.metadata,
              default_estimated_выходput_tokens: 512,
              default_estimated_выходput_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: { "gpt-4": 4096 },
            },
          },
          onSubmitMock,
          userRole,
        );

        await waitFor(() => {
          expect(screen.getByLabelText("Estimated Выход Токенs")).toBeDisabled();
        });
        expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toBeDisabled();

        await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
          expect(onSubmitMock).toHaveBeenCalled();
        });
        const callArgs = onSubmitMock.mock.calls[0][0];
        expect(callArgs.default_estimated_выходput_tokens).toBe(512);
        expect(callArgs.default_estimated_выходput_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toEqual({ "gpt-4": 4096 });
      },
    );

    it.each(["Admin", "proxy_admin"])("leaves both controls editable for %s", async (userRole) => {
      renderEditView(MOCK_KEY_DATA, vi.fn().mockResolvedЗначение(undefined), userRole);

      await waitFor(() => {
        expect(screen.getByLabelText("Estimated Выход Токенs")).toBeEnabled();
      });
      expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toBeEnabled();
    });
  });

  const UNTOUCHED_SAVE_PAYLOAD = {
    key_alias: "asdasdas",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    max_budget: 0,
    soft_budget: null,
    budget_duration: "30d",
    tpm_limit: 10,
    tpm_limit_type: null,
    rpm_limit: 10,
    rpm_limit_type: null,
    throttle_on_budget_exceeded: false,
    enable_prompt_caching: false,
    max_parallel_requests: 10,
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: undefined,
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_rpm_limit: undefined,
    гардрейловs: undefined,
    disable_global_гардрейловs: false,
    policies: undefined,
    tags: ["test-tag"],
    prompts: undefined,
    access_group_ids: [],
    allowed_passthrough_rвыходes: undefined,
    vector_stores: [],
    mcp_servers_and_groups: { servers: [], accessGroups: [], toolsets: [] },
    mcp_tool_permissions: {},
    agents_and_groups: { agents: [], accessGroups: [] },
    skills: [],
    organization_id: null,
    team_id: null,
    logging_settings: [],
    metadata: "{}",
    duration: "30d",
    token: "test-token-123",
    disabled_callbacks: [],
    auto_rotate: false,
    rotation_interval: undefined,
    tag_rpm_limit: {},
  };

  describe("submit payload contract", () => {
    const renderForPayload = (
      onSubmit: (values: Record<string, unknown>) => Promise<void>,
      keyData: КлючОтвет = MOCK_KEY_DATA,
    ) =>
      renderWithПровайдерs(
        <КлючEditView
          keyData={keyData}
          onCancel={() => {}}
          onSubmit={onSubmit}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"Admin"}
          premiumUser={true}
        />,
      );

    it("sends exactly the bound form fields on an untouched save, and no server-only key data", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).toStrictEqual(UNTOUCHED_SAVE_PAYLOAD);
    });

    it("drops the policy and prompt keys entirely for a role that cannot see those fields", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          onCancel={() => {}}
          onSubmit={onSubmitMock}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"Internal User"}
          premiumUser={true}
        />,
      );
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      const payload = onSubmitMock.mock.calls[0][0];
      expect(payload).not.toHaveСвойство("policies");
      expect(payload).not.toHaveСвойство("prompts");
      expect(payload).toHaveСвойство("гардрейловs");
    });

    it("rвыходes the shared lifecycle and rate-limit-type controls into their own payload keys", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      const duration = screen.getByPlaceholderText("e.g., 30d");
      await userEvent.clear(duration);
      await userEvent.type(duration, "45d");

      await chooseВыбратьOption(userEvent, screen.getByLabelText(/TPM Rate Limit Type/), /^Guaranteed throughput/);

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      const payload = onSubmitMock.mock.calls[0][0];
      expect(payload.duration).toBe("45d");
      expect(payload.tpm_limit_type).toBe("guaranteed_throughput");
      expect(payload.rpm_limit_type).toBeNull();
    });

    it("blanks duration rather than dropping the key when Никогда не истекать is ticked", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock, { ...MOCK_KEY_DATA, expires: "2026-01-01T00:00:00Z" });
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("checkbox", { name: /never expire/i }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).toHaveСвойство("duration", null);
    });

    it("carries a typed value from every free-text and numeric control into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      const retype = async (label: RegExp | string, text: string) => {
        const control = screen.getByLabelText(label);
        await userEvent.clear(control);
        await userEvent.type(control, text);
      };

      await retype("Псевдоним ключа", "typed-alias");
      await retype("Макс. бюджет (USD)", "12.5");
      await retype("Лимит TPM", "111");
      await retype("Лимит RPM", "222");
      await retype("Макс. параллельных запросов", "3");
      await retype("Лимит TPM модели", '{{"gpt-4": 7}');
      await retype("Лимит RPM модели", '{{"gpt-4": 8}');
      await retype("Метаданные", '{{"typed": true}');

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).toMatchObject({
        key_alias: "typed-alias",
        max_budget: "12.5",
        tpm_limit: "111",
        rpm_limit: "222",
        max_parallel_requests: "3",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: '{"gpt-4": 7}',
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_rpm_limit: '{"gpt-4": 8}',
        metadata: '{"typed": true}',
      });
    });

    it("carries every toggle driven off its default into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("switch", { name: /throttle on budget exceeded/i }));
      await userEvent.click(screen.getByRole("switch", { name: /enable prompt caching/i }));
      await userEvent.click(screen.getByRole("switch", { name: /disable global гардрейловs/i }));

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).toMatchObject({
        throttle_on_budget_exceeded: true,
        enable_prompt_caching: true,
        disable_global_гардрейловs: true,
      });
    });

    it("carries a tag typed into the tags control into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.type(screen.getByLabelText("Теги"), "typed-tag{Введите}");

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].tags).toEqual(["test-tag", "typed-tag"]);
    });

    const pickFromCombobox = async (inputLabel: RegExp | string, optionName: RegExp | string) => {
      await userEvent.click(screen.getByLabelText(inputLabel));
      await userEvent.click(await screen.findByRole("option", { name: optionName }));
      await userEvent.keyboard("{Escape}");
    };

    it("carries a picked гардрейлов into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await pickFromCombobox("Выбрать гардрейловs", "гардрейлов-1");
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].гардрейловs).toEqual(["гардрейлов-1"]);
    });

    it("carries a picked policy into the payload", async () => {
      vi.mocked(getPoliciesList).mockResolvedЗначениеOnce({
        policies: [{ policy_name: "policy-1", version_number: 1, version_status: "production" }],
      });
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await pickFromCombobox(/Выбрать policies/, /policy-1/);
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].policies).toEqual(["policy-1"]);
    });

    it("carries a typed prompt into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.type(screen.getByLabelText("Prompts"), "prompt-1{Введите}");
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].prompts).toEqual(["prompt-1"]);
    });

    it("carries the RPM rate limit type into its own payload key", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await chooseВыбратьOption(userEvent, screen.getByLabelText(/RPM Rate Limit Type/), /^Guaranteed throughput/);

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      const payload = onSubmitMock.mock.calls[0][0];
      expect(payload.rpm_limit_type).toBe("guaranteed_throughput");
      expect(payload.tpm_limit_type).toBeNull();
    });

    it("carries a picked vector store into the payload", async () => {
      vi.mocked(vectorStoreListCall).mockResolvedЗначениеOnce({
        data: [{ vector_store_id: "vs-1", vector_store_name: "VS One" }],
      });
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await pickFromCombobox("Выберите векторные хранилища", /VS One/);
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].vector_stores).toEqual(["vs-1"]);
    });

    it("carries a picked pass through rвыходe into the payload", async () => {
      vi.mocked(getPassThroughЭндпоинтsCall).mockResolvedЗначениеOnce({
        endpoints: [{ path: "/bria", methods: ["POST"] }],
      });
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await pickFromCombobox(/allowed pass through rвыходes/, /\/bria/);
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].allowed_passthrough_rвыходes).toEqual(["/bria"]);
    });

    it("carries a picked team into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderWithПровайдерs(
        <КлючEditView
          keyData={MOCK_KEY_DATA}
          teams={[{ team_id: "team-9", team_alias: "Team Nine" }]}
          onCancel={() => {}}
          onSubmit={onSubmitMock}
          accessТокен={"test-token"}
          userID={"test-user"}
          userRole={"Admin"}
          premiumUser={true}
        />,
      );
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByLabelText("ID команды"));
      await userEvent.click(await screen.findByRole("option", { name: /Team Nine/ }));

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].team_id).toBe("team-9");
    });

    it("carries a picked MCP server into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: "pick mcp server" }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].mcp_servers_and_groups.servers).toEqual(["mcp-1"]);
    });

    it("carries a picked agent into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: "pick agent" }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].agents_and_groups.agents).toEqual(["agent-1"]);
    });

    it("carries a picked skill into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: "pick skill" }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].skills).toEqual(["private-skill"]);
    });

    it("preloads the stored skills into the payload when the selector is left untouched", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock, {
        ...MOCK_KEY_DATA,
        object_permission: { ...MOCK_KEY_DATA.object_permission, skills: ["stored-skill"] },
      } as КлючОтвет);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].skills).toEqual(["stored-skill"]);
    });

    it("carries an added logging integration into the payload", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /add integration/i }));
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0].logging_settings).toEqual([
        { callback_name: "", callback_type: "success", callback_vars: {} },
      ]);
    });

    it("resends stored budget fallbacks on an untouched save", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock, {
        ...MOCK_KEY_DATA,
        budget_fallbacks: { "gpt-4": ["gpt-4o-mini"] },
      } as КлючОтвет);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).toHaveСвойство("budget_fallbacks", { "gpt-4": ["gpt-4o-mini"] });
    });

    it("omits budget fallbacks entirely for a key that has none", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).not.toHaveСвойство("budget_fallbacks");
    });

    it("resends the stored per-tag rpm limits on an untouched save", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock, {
        ...MOCK_KEY_DATA,
        metadata: { ...MOCK_KEY_DATA.metadata, tag_rpm_limit: { "test-tag": 7 } },
      } as КлючОтвет);
      await screen.findByRole("button", { name: /save changes/i });

      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalled();
      });
      expect(onSubmitMock.mock.calls[0][0]).toHaveСвойство("tag_rpm_limit", { "test-tag": 7 });
    });

    const setRpmLimit = (value: string) => {
      fireEvent.change(screen.getByLabelText("Лимит RPM"), { target: { value } });
    };

    it("carries an edited RPM limit and the key identifier onto the wire", async () => {
      const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
      renderForPayload(onSubmitMock);
      await screen.findByRole("button", { name: /save changes/i });

      setRpmLimit("25");
      await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(onSubmitMock).toHaveBeenCalledВремяs(1);
      });
      expect(onSubmitMock.mock.calls[0][0]).toMatchObject({ token: "test-token-123", rpm_limit: "25" });
    });

    it.fails(
      "sends max_budget as an explicit null when the field is cleared (expected to fail until the forms revamp, tri-state PATCH tracker: today the view hands КлючInfoView an empty string and handleКлючUpdate maps it to null)",
      async () => {
        const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
        renderForPayload(onSubmitMock);
        await screen.findByRole("button", { name: /save changes/i });

        await userEvent.clear(screen.getByLabelText("Макс. бюджет (USD)"));
        await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
          expect(onSubmitMock).toHaveBeenCalledВремяs(1);
        });
        expect(onSubmitMock.mock.calls[0][0]).toHaveСвойство("max_budget", null);
      },
    );

    it.fails(
      "sends only the key identifier and the edited RPM limit (expected to fail until the forms revamp, tri-state PATCH tracker)",
      async () => {
        const onSubmitMock = vi.fn().mockResolvedЗначение(undefined);
        renderForPayload(onSubmitMock);
        await screen.findByRole("button", { name: /save changes/i });

        setRpmLimit("25");
        await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
          expect(onSubmitMock).toHaveBeenCalledВремяs(1);
        });
        expect(onSubmitMock.mock.calls[0][0]).toStrictEqual({ token: "test-token-123", rpm_limit: "25" });
      },
    );
  });
});
