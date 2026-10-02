import { renderHook, screen, waitFor, renderWithПровайдерs } from "../../../tests/test-utils";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Team } from "../key_team_helpers/key_list";
import type { CredentialItem } from "../networking";
import { Провайдерs } from "../provider_info_helpers";
import { projectMountedЗначениеs, useMountRegistry, type MountedFormЗначениеs } from "../common_components/MountedFormПоле";
import { useForm } from "react-hook-form";
import AddРежимlForm from "./AddРежимlForm";

vi.mock("../molecules/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/ПровайдерLogo", () => ({
  ПровайдерLogo: ({ provider, className }: { provider: string; className?: string }) => (
    <div className={className} data-testid={`provider-logo-${provider}`}>
      {provider}
    </div>
  ),
}));

vi.mock("../networking", async () => {
  const actual = await vi.importActual("../networking");
  return {
    ...actual,
    getГардрейлыList: vi.fn().mockResolvedЗначение({
      гардрейловs: [{ гардрейлов_name: "test-гардрейлов-1" }, { гардрейлов_name: "test-гардрейлов-2" }],
    }),
    tagListCall: vi.fn().mockResolvedЗначение({}),
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall: vi.fn().mockResolvedЗначение({
      data: [{ id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-group-1" }, { id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-group-2" }],
    }),
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubCall: vi.fn().mockResolvedЗначение({
      data: [
        { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
        { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo", mode: "chat" },
      ],
    }),
    testПодключениеЗапрос: vi.fn().mockResolvedЗначение({ status: "success" }),
    getПровайдерCreateМетаданные: vi.fn().mockResolvedЗначение([
      {
        provider: "OpenAI",
        provider_display_name: "OpenAI",
        litellm_provider: "openai",
        default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_placeholder: "gpt-3.5-turbo",
        credential_fields: [],
      },
    ]),
  };
});

vi.mock("@/app/(dashboard)/hooks/providers/useПровайдерПолеs", () => ({
  useПровайдерПолеs: vi.fn().mockReturnЗначение({
    data: [
      {
        provider: "OpenAI",
        provider_display_name: "OpenAI",
        litellm_provider: "openai",
        default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_placeholder: "gpt-3.5-turbo",
        credential_fields: [],
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useКоманды", () => ({
  useInfiniteКоманды: () => ({
    data: {
      pages: [
        {
          teams: [{ team_id: "team-1", team_alias: "Test Team", organization_id: "org-1" }],
          total: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
        },
      ],
    },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/гардрейловs/useГардрейлы", () => ({
  useГардрейлы: vi.fn().mockReturnЗначение({
    data: {
      гардрейловs: [{ гардрейлов_name: "test-гардрейлов" }],
      globalGuardrailNames: new Set<string>(),
      необязательноGuardrailNames: new Set<string>(["test-гардрейлов"]),
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/tags/useТеги", () => ({
  useТеги: vi.fn().mockReturnЗначение({
    data: { tag1: ["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию2"] },
    isLoading: false,
    error: null,
  }),
}));

const mockАвторизованоUser = (userRole: string, userId: string, premiumUser: boolean) => ({
  token: "test-token",
  accessТокен: "test-access-token",
  userId,
  userEmail: "test@example.com",
  userRole,
  premiumUser,
  disabledЛичнаяКлючCreation: false,
  showSSOBanner: false,
});

const testTeam: Team = {
  team_id: "team-1",
  team_alias: "Test Team",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
  max_budget: 100,
  budget_duration: "monthly",
  tpm_limit: null,
  rpm_limit: null,
  organization_id: "org-1",
  created_at: "2024-01-01T00:00:00Z",
  keys: [],
  members_with_roles: [],
};

const createTestProps = (userRole = "proxy_admin", userId = "user-1", isTeamAdmin = false) => {
  const { result } = renderHook(() => {
    const form = useForm<MountedFormЗначениеs>({ mode: "onChange" });
    const registry = useMountRegistry();
    return { form, registry };
  });
  const { form, registry } = result.current;

  const teams = [
    {
      ...testTeam,
      members_with_roles: isTeamAdmin ? [{ user_id: userId, role: "admin" }] : [],
    },
  ];

  const credentials: CredentialItem[] = [
    {
      credential_name: "test-credential",
      credential_values: {},
      credential_info: {
        custom_llm_provider: "openai",
        description: "Test credential",
      },
    },
  ];

  return {
    form,
    registry,
    mountedЗначениеs: () => projectMountedЗначениеs(registry, form.getЗначениеs),
    handleOk: vi.fn().mockResolvedЗначение(true),
    setВыбраноПровайдер: vi.fn(),
    setПровайдерРежимlsFn: vi.fn(),
    getPlaceholder: vi.fn((provider: string) => `Введите ${provider} Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name`),
    setShowAdvancedSettings: vi.fn(),
    selectedПровайдер: Провайдерs.OpenAI,
    providerРежимls: ["gpt-4", "gpt-3.5-turbo"],
    showAdvancedSettings: false,
    teams,
    credentials,
    userRole,
    userId,
  };
};

describe("AddРежимlForm", () => {
  it("should render", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", true));

    const props = createTestProps();

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    expect(await screen.findByRole("heading", { name: "Add Режимl" })).toBeInTheDocument();
  });

  it("should show proxy admin only (not team admin) - should not see Выбрать Team dropdown unless switch is toggled", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", true));

    const props = createTestProps("proxy_admin", "user-1", false);

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    await screen.findByText("Провайдер");

    expect(screen.queryByText("Team Выбратьion Обязательно")).not.toBeInTheDocument();
    expect(screen.queryByText("Выбрать Team")).not.toBeInTheDocument();

    const teamSwitch = screen.getByRole("switch");
    expect(teamSwitch).toBeInTheDocument();

    expect(screen.queryByText("Выбрать Team")).not.toBeInTheDocument();

    await userEvent.click(teamSwitch);

    expect(await screen.findByText("Выбрать Team")).toBeInTheDocument();
  });

  it("should show proxy admin who is also team admin - should not see Выбрать Team dropdown unless switch is toggled", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", true));

    const props = createTestProps("proxy_admin", "user-1", true);

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    await screen.findByText("Провайдер");

    expect(screen.queryByText("Team Выбратьion Обязательно")).not.toBeInTheDocument();
    expect(screen.queryByText("Выбрать Team")).not.toBeInTheDocument();

    const teamSwitch = screen.getByRole("switch");
    expect(teamSwitch).toBeInTheDocument();

    expect(screen.queryByText("Выбрать Team")).not.toBeInTheDocument();

    await userEvent.click(teamSwitch);

    expect(await screen.findByText("Выбрать Team")).toBeInTheDocument();
  });

  it("should show team admin (not proxy admin) - should see alert and team select, must select team before seeing remaining fields", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("team_member", "user-1", true));

    const props = createTestProps("team_member", "user-1", true);

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    await screen.findByRole("heading", { name: "Add Режимl" });

    expect(screen.getByText("Team Выбратьion Обязательно")).toBeInTheDocument();

    expect(screen.getByText("Выбрать Team")).toBeInTheDocument();

    expect(screen.queryByText("Провайдер")).not.toBeInTheDocument();

    const teamВыбрать = screen.getByRole("combobox");
    await userEvent.click(teamВыбрать);
    await userEvent.click(screen.getByText("Test Team"));

    await waitFor(() => {
      expect(screen.getByText("Провайдер")).toBeInTheDocument();
    });
  });

  it("should show team admin (not proxy admin) - should not see team-BYOK switch", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("team_member", "user-1", true));

    const props = createTestProps("team_member", "user-1", true);

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    await screen.findByText("Выбрать Team");

    const teamВыбрать = screen.getByRole("combobox");
    await userEvent.click(teamВыбрать);
    await userEvent.click(screen.getByText("Test Team"));

    await waitFor(() => {
      expect(screen.getByText("Провайдер")).toBeInTheDocument();
    });

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should handle non-admin, non-team-admin users - should not see team selection or switch", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("user", "user-1", false));

    const props = createTestProps("user", "user-1", false);

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    await screen.findByRole("heading", { name: "Add Режимl" });

    expect(screen.queryByText("Team Выбратьion Обязательно")).not.toBeInTheDocument();

    expect(screen.queryByText("Выбрать Team")).not.toBeInTheDocument();

    expect(screen.queryByText("Провайдер")).not.toBeInTheDocument();

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("should display the provider field and the Test Подключить / Add Режимl buttons", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", true));

    const props = createTestProps();

    renderWithПровайдерs(<AddРежимlForm {...props} />);

    expect(await screen.findByText("Провайдер")).toBeInTheDocument();
    expect((await screen.findВсеByRole("button", { name: "Test Подключить" })).length).toBeGreaterThan(0);
    expect(await screen.findByRole("button", { name: "Add Режимl" })).toBeInTheDocument();
  });

  it("shows only the Close button in the connection test dialog footer", async () => {
    const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
    mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", true));

    renderWithПровайдерs(<AddРежимlForm {...createTestProps()} />);

    await userEvent.click(await screen.findByTestId("test-connect-btn"));

    const dialog = await screen.findByRole("dialog");
    const footer = dialog.queryВыбратьor('[data-slot="dialog-footer"]');
    expect(footer).not.toBeNull();
    expect(footer!.textContent?.trim()).toBe("Close");
  });

  describe("the enterprise gate on the Team-BYOK switch", () => {
    const renderForm = async (premiumUser: boolean) => {
      const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
      mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", premiumUser));
      renderWithПровайдерs(<AddРежимlForm {...createTestProps()} />);
      return screen.findByRole("switch", { name: "Team-BYOK Режимl" });
    };

    it("explains the gate on hover even though the switch it sits on is disabled", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      const teamOnlySwitch = await renderForm(false);
      expect(teamOnlySwitch).toHaveAttribute("aria-disabled", "true");

      await user.hover(teamOnlySwitch);

      expect(await screen.findByText(/enterprise-only feature/)).toBeInTheDocument();
    });

    it("says nothing on hover once the user is premium", async () => {
      const user = userEvent.setup();
      const teamOnlySwitch = await renderForm(true);
      expect(teamOnlySwitch).not.toHaveAttribute("aria-disabled", "true");

      await user.hover(teamOnlySwitch);

      expect(screen.queryByText(/enterprise-only feature/)).not.toBeInTheDocument();
    });
  });

  describe("cache control bindings reach the parent form store", () => {
    const renderWithForm = async () => {
      const mockUseАвторизовано = vi.mocked(await import("@/app/(dashboard)/hooks/useАвторизовано"));
      mockUseАвторизовано.default.mockReturnЗначение(mockАвторизованоUser("proxy_admin", "user-1", true));
      const props = createTestProps();
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithПровайдерs(<AddРежимlForm {...props} />);
      await screen.findByText("Провайдер");

      return {
        user,
        openCacheControl: async () => {
          await user.click(await screen.findByText("Расширенные настройки"));
          await user.click(screen.getByRole("switch", { name: "Cache Control Injection Points" }));
          await screen.findByText("Add Injection Point");
        },
        closeCacheControl: async () => {
          await user.click(screen.getByRole("switch", { name: "Cache Control Injection Points" }));
          await waitFor(() => expect(screen.queryByText("Add Injection Point")).not.toBeInTheDocument());
        },
        mountedЗначениеs: async (): Promise<Record<string, unknown>> => props.mountedЗначениеs(),
      };
    };

    it("omits both cache control keys while the section is untouched", async () => {
      const { mountedЗначениеs } = await renderWithForm();
      const values = await mountedЗначениеs();
      expect(values).not.toHaveСвойство("cache_control_injection_points");
      expect(values.cache_control).toBeUndefined();
    });

    it("sends the seeded injection point once the toggle is on", async () => {
      const { openCacheControl, mountedЗначениеs } = await renderWithForm();
      await openCacheControl();
      const values = await mountedЗначениеs();
      expect(values.cache_control).toBe(true);
      expect(values.cache_control_injection_points).toEqual([{ location: "message" }]);
    });

    it("carries an edited role and keeps the index a string, as the antd control did", async () => {
      const { user, openCacheControl, mountedЗначениеs } = await renderWithForm();
      await openCacheControl();

      await user.click(screen.getByText("Выберите роль"));
      await user.click(await screen.findByText("System"));
      await user.type(screen.getByPlaceholderText("Optional"), "3");

      const values = await mountedЗначениеs();
      expect(values.cache_control_injection_points).toEqual([{ location: "message", role: "system", index: "3" }]);
    });

    it("adds a second injection point row", async () => {
      const { user, openCacheControl, mountedЗначениеs } = await renderWithForm();
      await openCacheControl();

      await user.click(screen.getByText("Add Injection Point"));
      await waitFor(() => expect(screen.getВсеByPlaceholderText("Optional")).toHaveLength(2));
      await user.type(screen.getВсеByPlaceholderText("Optional")[1], "7");

      const values = await mountedЗначениеs();
      expect(values.cache_control_injection_points).toEqual([
        { location: "message" },
        { location: "message", index: "7" },
      ]);
    });

    it("drops the injection points again when the toggle goes back off", async () => {
      const { openCacheControl, closeCacheControl, mountedЗначениеs } = await renderWithForm();
      await openCacheControl();
      await closeCacheControl();

      const values = await mountedЗначениеs();
      expect(values.cache_control).toBe(false);
      expect(values).not.toHaveСвойство("cache_control_injection_points");
    });
  });
});
