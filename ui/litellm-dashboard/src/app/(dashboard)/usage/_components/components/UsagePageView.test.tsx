import { useАгенты } from "@/app/(dashboard)/hooks/agents/useАгенты";
import { useCustomers } from "@/app/(dashboard)/hooks/customers/useCustomers";
import useАвторизовано from "@/app/(dashboard)/hooks/useАвторизовано";
import useIsOrgAdmin from "@/app/(dashboard)/hooks/useIsOrgAdmin";
import { useCurrentUser } from "@/app/(dashboard)/hooks/users/useCurrentUser";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeВсе, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import type { Организация } from "@/components/networking";
import * as networking from "@/components/networking";
import ИспользованиеPage from "./ИспользованиеPageView";

// Polyfill ResizeObserver for test environment
beforeВсе(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

// Mock the networking module
vi.mock("@/components/networking", () => ({
  userDailyActivityCall: vi.fn(),
  userDailyActivityAggregatedCall: vi.fn(),
  gatewayDailyActivityCall: vi.fn(),
  tagListCall: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock("@/components/activity_metrics", () => ({
  ActivityMetrics: ({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs }: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs?: { __source?: string } }) => (
    <div>{`activity-source:${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs?.__source ?? "none"}`}</div>
  ),
  processActivityData: (_data: unknown, key: string) => ({ __source: key }),
}));

vi.mock("@/components/view_user_spend", () => ({
  default: () => <div>View User Расход</div>,
}));

vi.mock("@/components/ИспользованиеPage/components/EntityИспользование/TopKeyView", () => ({
  default: () => <div>Top Ключи</div>,
}));

vi.mock("./EntityИспользование/EntityИспользование", () => ({
  default: ({ entityType, entityList }: { entityType: string; entityList: unknown }) => (
    <div data-testid="entity-usage" data-entity-type={entityType} data-entity-list={JSON.stringify(entityList ?? null)}>
      Entity Использование
    </div>
  ),
  EntityList: [],
}));

vi.mock("./EntityИспользование/РасходByПровайдер", () => ({
  default: () => <div>Расход By Провайдер</div>,
}));

vi.mock("./ЭндпоинтИспользование/ЭндпоинтИспользование", () => ({
  default: () => <div>Эндпоинт Использование</div>,
}));

vi.mock("./ИспользованиеViewВыбрать/ИспользованиеViewВыбрать", async () => {
  const React = await import("react");
  const ИспользованиеViewВыбрать = ({ value, onChange, canViewTagИспользование = false }: any) => {
    const tagOption = canViewTagИспользование ? React.createElement("option", { value: "tag" }, "Tag Использование") : null;
    return React.createElement(
      "select",
      {
        value,
        onChange: (e: any) => onChange?.(e.target.value),
        role: "combobox",
        "data-testid": "usage-view-select",
      },
      React.createElement("option", { value: "global" }, "Глобально Использование"),
      React.createElement("option", { value: "team" }, "Team Использование"),
      React.createElement("option", { value: "organization" }, "Организация Использование"),
      React.createElement("option", { value: "customer" }, "Customer Использование"),
      tagOption,
      React.createElement("option", { value: "agent" }, "Agent Использование"),
      React.createElement("option", { value: "user" }, "User Использование"),
      React.createElement("option", { value: "user-agent-activity" }, "User Agent Activity"),
    );
  };
  ИспользованиеViewВыбрать.displayName = "ИспользованиеViewВыбрать";
  return { ИспользованиеViewВыбрать };
});

vi.mock("@/components/shared/advanced_date_picker", async () => {
  const React = await import("react");
  // The button is how a test drives a range change; the real picker's own UI is
  // not what any test here is asserting on.
  const AdvancedDatePicker = ({ onValueChange }: { onValueChange?: (value: unknown) => void }) =>
    React.createElement(
      "div",
      { "data-testid": "advanced-date-picker" },
      "Date Picker",
      React.createElement(
        "button",
        {
          "data-testid": "pick-a-different-range",
          onClick: () =>
            onValueChange?.({ from: new Date("2024-01-01T00:00:00Z"), to: new Date("2024-01-08T00:00:00Z") }),
        },
        "pick",
      ),
    );
  AdvancedDatePicker.displayName = "AdvancedDatePicker";
  return { default: AdvancedDatePicker };
});

vi.mock("@/components/user_agent_activity", () => ({
  default: () => <div>User Agent Activity</div>,
}));

vi.mock("@/components/cloudzero_export_modal", () => ({
  default: () => <div>CloudZero Export Modal</div>,
}));

vi.mock("@/components/EntityUsageExport", () => ({
  default: () => <div>Entity Использование Export Modal</div>,
}));

vi.mock("./ИспользованиеAIChatPanel", () => ({
  default: () => <div data-testid="usage-ai-chat-panel">Использование AI Chat Panel</div>,
}));

vi.mock("@/app/(dashboard)/hooks/customers/useCustomers", () => ({
  useCustomers: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/agents/useАгенты", () => ({
  useАгенты: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useIsOrgAdmin", () => ({
  __esModule: true,
  default: vi.fn(() => false),
}));

vi.mock("@/app/(dashboard)/hooks/users/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/users/useUsers", () => ({
  useInfiniteUsers: vi.fn(),
  useUserLookup: vi.fn(() => ({ data: null })),
}));

describe("ИспользованиеPage", () => {
  const mockUserDailyActivityAggregatedCall = vi.mocked(networking.userDailyActivityAggregatedCall);
  const mockUserDailyActivityCall = vi.mocked(networking.userDailyActivityCall);
  const mockTagListCall = vi.mocked(networking.tagListCall);
  const mockGatewayDailyActivityCall = vi.mocked(networking.gatewayDailyActivityCall);
  const mockUseCustomers = vi.mocked(useCustomers);
  const mockUseАгенты = vi.mocked(useАгенты);
  const mockUseАвторизовано = vi.mocked(useАвторизовано);
  const mockUseCurrentUser = vi.mocked(useCurrentUser);
  const mockUseInfiniteUsers = vi.mocked(useInfiniteUsers);

  const mockSpendData = {
    results: [
      {
        date: "2025-01-01",
        metrics: {
          spend: 125.75,
          api_requests: 1500,
          successful_requests: 1450,
          failed_requests: 50,
          total_tokens: 75000,
          prompt_tokens: 45000,
          completion_tokens: 30000,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        breakdown: {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
            "gpt-4": {
              metrics: {
                spend: 75.5,
                api_requests: 800,
                successful_requests: 780,
                failed_requests: 20,
                total_tokens: 40000,
                prompt_tokens: 24000,
                completion_tokens: 16000,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              metadata: {},
              api_key_breakdown: {},
            },
          },
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {
            "gpt-4": {
              metrics: {
                spend: 75.5,
                api_requests: 800,
                successful_requests: 780,
                failed_requests: 20,
                total_tokens: 40000,
                prompt_tokens: 24000,
                completion_tokens: 16000,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              metadata: {},
              api_key_breakdown: {},
            },
          },
          api_keys: {
            "sk-test123": {
              metrics: {
                spend: 125.75,
                api_requests: 1500,
                successful_requests: 1450,
                failed_requests: 50,
                total_tokens: 75000,
                prompt_tokens: 45000,
                completion_tokens: 30000,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
              metadata: {
                key_alias: "Test Ключ",
                tags: ["production"],
              },
            },
          },
          providers: {
            openai: {
              metrics: {
                spend: 125.75,
                api_requests: 1500,
                successful_requests: 1450,
                failed_requests: 50,
                total_tokens: 75000,
                prompt_tokens: 45000,
                completion_tokens: 30000,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
            },
          },
          mcp_servers: {},
        },
      },
    ],
    metadata: {
      total_spend: 125.75,
      total_api_requests: 1500,
      total_successful_requests: 1450,
      total_failed_requests: 50,
      total_tokens: 75000,
    },
  };

  const mockOrganizations: Организация[] = [
    {
      organization_id: "org-123",
      organization_alias: "Acme Org",
      budget_id: "budget-1",
      metadata: {},
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      spend: 0,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_spend: {},
      created_at: "2025-01-01T00:00:00Z",
      created_by: "user-123",
      updated_at: "2025-01-02T00:00:00Z",
      updated_by: "user-123",
      litellm_budget_table: null,
      teams: null,
      users: null,
      members: null,
    },
  ];

  const mockCustomers = [
    {
      user_id: "customer-123",
      alias: "Test Customer",
      spend: 0,
      blocked: false,
      allowed_model_region: null,
      default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: null,
      budget_id: null,
      litellm_budget_table: null,
    },
  ];

  const mockАгенты = [
    {
      agent_id: "agent-123",
      agent_name: "Test Agent",
    },
  ];

  // The same session the suite runs as, minus the admin role. Named rather than
  // inlined so the test reads as "this session, but not an admin".
  const nonAdminСессия = {
    isLoading: false,
    isАвторизовано: true,
    token: "mock-token",
    accessТокен: "test-token",
    userId: "user-123",
    userEmail: "test@example.com",
    userRole: "Internal User",
    userRoleLabel: "Internal User",
    isViewOnly: false,
    premiumUser: true,
    disabledPersonalKeyCreation: false,
    showSSOBanner: false,
  };

  // Counts deliberately unlike anything in mockSpendData: the gateway tile must be
  // readable as coming from /gateway/daily/activity and from nothing else.
  const mockGatewayActivity = {
    total_successful_requests: 424242,
    total_failed_requests: 909,
    by_date: [{ date: "2025-01-01", successful_requests: 424242, failed_requests: 909 }],
    by_route: [{ category: "llm", route: "/chat/completions", successful_requests: 424242, failed_requests: 909 }],
  };

  const defaultProps = {
    teams: [
      {
        team_id: "team-1",
        team_alias: "Test Team",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        max_budget: null,
        spend: 0,
        tpm_limit: null,
        rpm_limit: null,
        blocked: false,
        metadata: {},
        budget_duration: null,
        organization_id: "org-123",
        created_at: "2025-01-01T00:00:00Z",
        keys: [],
        members_with_roles: [],
      },
    ],
    organizations: [],
  };

  beforeEach(() => {
    mockUseАвторизовано.mockReturnЗначение({
      isLoading: false,
      isАвторизовано: true,
      token: "mock-token",
      accessТокен: "test-token",
      userId: "user-123",
      userEmail: "test@example.com",
      userRole: "Admin",
      premiumUser: true,
      disabledPersonalKeyCreation: false,
      showSSOBanner: false,
    });
    mockUseCurrentUser.mockReturnЗначение({
      data: {
        user_id: "user-123",
        max_budget: null,
      },
      isLoading: false,
      error: null,
    } as any);
    mockUserDailyActivityAggregatedCall.mockClear();
    mockUserDailyActivityCall.mockClear();
    mockTagListCall.mockClear();
    mockGatewayDailyActivityCall.mockClear();
    mockUserDailyActivityAggregatedCall.mockResolvedЗначение(mockSpendData);
    mockGatewayDailyActivityCall.mockResolvedЗначение(mockGatewayActivity);
    mockUseInfiniteUsers.mockReturnЗначение({
      data: {
        pages: [
          {
            users: [
              { user_id: "user-001", user_alias: "Alice", user_email: "alice@example.com" },
              { user_id: "user-002", user_alias: null, user_email: "bob@example.com" },
              { user_id: "user-003", user_alias: null, user_email: null },
            ],
            page: 1,
            total_pages: 1,
            total_count: 3,
          },
        ],
        pageParams: [1],
      },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
    } as any);
    mockTagListCall.mockResolvedЗначение({});
    mockUseCustomers.mockReturnЗначение({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    mockUseАгенты.mockReturnЗначение({
      data: { agents: [] },
      isLoading: false,
      error: null,
    } as any);
  });

  it("should render and fetch usage data on mount", async () => {
    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    // Wait for data to be fetched
    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    // Check that key metrics are displayed
    const totalRequestElements = screen.getAllByText("Всего запросов");
    expect(totalRequestElements.length).toBeGreaterThan(0);
    const successfulRequestLabelElements = screen.getAllByText("Успешных запросов");
    expect(successfulRequestLabelElements.length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getAllByText("424,242").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("909").length).toBeGreaterThan(0);
    expect(screen.getByText("425,151")).toBeInTheDocument();
    expect(screen.queryByText("1,500")).not.toBeInTheDocument();
    expect(screen.queryByText("1,450")).not.toBeInTheDocument();
  });

  it("should stop showing the previous range's totals while a new range is in flight", async () => {
    // The request tiles read the gateway counts and fall through to the
    // spend-derived ones. Withholding a superseded gateway result is only worth
    // something if the fallback is withheld too, otherwise the tile keeps
    // showing the previous range's number by the other route.
    let releaseSecondFetch: () => void = () => {};
    mockUserDailyActivityAggregatedCall.mockReset();
    mockUserDailyActivityAggregatedCall.mockResolvedValueOnce(mockSpendData).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseSecondFetch = () => resolve(mockSpendData);
        }),
    );

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getAllByText("75,000").length).toBeGreaterThan(0);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("pick-a-different-range"));
    });

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText("75,000")).not.toBeInTheDocument();

    await act(async () => {
      releaseSecondFetch();
    });
    await waitFor(() => {
      expect(screen.getAllByText("75,000").length).toBeGreaterThan(0);
    });
  });

  it("should fall back to the spend-derived count when the gateway endpoint is unavailable", async () => {
    mockGatewayDailyActivityCall.mockRejectedЗначение(new Ошибка("gateway activity unavailable"));

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockGatewayDailyActivityCall).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getAllByText("1,450").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.queryByText("424,242")).not.toBeInTheDocument();
    expect(screen.queryByText("909")).not.toBeInTheDocument();
    expect(screen.queryByText("425,151")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gateway-requests-by-endpoint")).not.toBeInTheDocument();
  });

  it("should not request deployment-wide gateway counts for a non-admin", async () => {
    mockUseАвторизовано.mockReturnЗначение(nonAdminСессия);

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });
    expect(mockGatewayDailyActivityCall).not.toHaveBeenCalled();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.queryByText("424,242")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gateway-requests-by-endpoint")).not.toBeInTheDocument();
  });

  it("should display usage metrics and charts", async () => {
    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    // Check for usage metrics cards
    const totalRequestElements = screen.getAllByText("Всего запросов");
    expect(totalRequestElements.length).toBeGreaterThan(0);
    const successfulRequestElements = screen.getAllByText("Успешных запросов");
    expect(successfulRequestElements.length).toBeGreaterThan(0);
    const failedRequestElements = screen.getAllByText("Запросов с ошибкой");
    expect(failedRequestElements.length).toBeGreaterThan(0);
    const totalTokensElements = screen.getAllByText("Всего токенов");
    expect(totalTokensElements.length).toBeGreaterThan(0);

    // Check for chart titles (these are in the Стоимость tab)
    expect(screen.getByText("Дневной расход")).toBeInTheDocument();
    expect(screen.getByText("Top Виртуальный ключs")).toBeInTheDocument();
  });

  it("should render the daily spend and top Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs charts with cyan bars", async () => {
    const { container } = renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    // The gateway endpoint breakdown is a separate chart with its own palette,
    // so it is excluded rather than allowed to widen the expected fill set.
    const spendBars = () => {
      const gatewayCard = container.querySelector('[data-testid="gateway-requests-by-endpoint"]');
      return Array.from(container.querySelectorВсе("path.recharts-rectangle")).filter(
        (rect) => !gatewayCard?.contains(rect),
      );
    };

    await waitFor(() => {
      expect(spendBars()).toHaveLength(2);
    });

    const fills = new Set(spendBars().map((rect) => rect.getAttribute("fill")));
    expect(fills).toEqual(new Set(["var(--color-cyan-500, #06b6d4)"]));

    expect(screen.getAllByText("2025-01-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
  });

  it("should switch between usage views correctly", async () => {
    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    // Default view should show Глобально Использование (for admin)
    expect(screen.getByText("Дневной расход")).toBeInTheDocument();

    // Switch to Team Использование view
    const usageВыбрать = screen.getByTestId("usage-view-select");
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "team" } });
    });

    // Should render EntityИспользование component
    await waitFor(() => {
      const entityUsageElements = screen.getAllByText("Entity Использование");
      expect(entityUsageElements.length).toBeGreaterThan(0);
    });

    // Switch to Tag Использование view (admin only)
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "tag" } });
    });

    // Should still render EntityИспользование component for tags
    await waitFor(() => {
      const entityUsageElements = screen.getAllByText("Entity Использование");
      expect(entityUsageElements.length).toBeGreaterThan(0);
    });
  });

  it("should withhold the tag list until it resolves so no empty state is shown while loading", async () => {
    let resolveTagList: (tags: Record<string, unknown>) => void = () => {};
    mockTagListCall.mockReturnЗначение(
      new Promise((resolve) => {
        resolveTagList = resolve;
      }) as ReturnType<typeof networking.tagListCall>,
    );

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    act(() => {
      fireEvent.change(screen.getByTestId("usage-view-select"), { target: { value: "tag" } });
    });

    const entityИспользование = await screen.findByTestId("entity-usage");
    expect(entityИспользование).toHaveAttribute("data-entity-list", "null");

    await act(async () => {
      resolveTagList({});
    });

    expect(screen.getByTestId("entity-usage")).toHaveAttribute("data-entity-list", "[]");
  });

  it("should drop the previous range's tags as soon as the range changes", async () => {
    mockTagListCall.mockResolvedЗначение({ "old-range-tag": { name: "old-range-tag" } } as never);

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    act(() => {
      fireEvent.change(screen.getByTestId("usage-view-select"), { target: { value: "tag" } });
    });

    await waitFor(() => {
      expect(screen.getByTestId("entity-usage")).toHaveAttribute(
        "data-entity-list",
        JSON.stringify([{ label: "old-range-tag", value: "old-range-tag" }]),
      );
    });

    let resolveNewRange: (tags: Record<string, unknown>) => void = () => {};
    mockTagListCall.mockReturnЗначение(
      new Promise((resolve) => {
        resolveNewRange = resolve;
      }) as ReturnType<typeof networking.tagListCall>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId("pick-a-different-range"));
    });

    expect(screen.getByTestId("entity-usage")).toHaveAttribute("data-entity-list", "null");

    await act(async () => {
      resolveNewRange({});
    });

    expect(screen.getByTestId("entity-usage")).toHaveAttribute("data-entity-list", "[]");
  });

  it("should show tag usage selector option for internal users", async () => {
    mockUseАвторизовано.mockReturnЗначение({
      isLoading: false,
      isАвторизовано: true,
      token: "mock-token",
      accessТокен: "test-token",
      userId: "user-123",
      userEmail: "test@example.com",
      userRole: "internal_user",
      premiumUser: true,
      disabledPersonalKeyCreation: false,
      showSSOBanner: false,
    });

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    expect(screen.getByRole("option", { name: "Tag Использование" })).toBeInTheDocument();
  });

  it("should show organization usage banner and view for admins", async () => {
    renderWithProviders(<ИспользованиеPage {...defaultProps} organizations={mockOrganizations} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    const usageВыбрать = screen.getByTestId("usage-view-select");
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "organization" } });
    });

    await waitFor(() => {
      const entityUsageElements = screen.getAllByText("Entity Использование");
      expect(entityUsageElements.length).toBeGreaterThan(0);
    });
  });

  // Org-admin membership comes from the server, so it can be revoked while the
  // page is open. The Организация Использование option and its panel both disappear,
  // and withвыход a fallback the selector keeps a value it no longer offers,
  // leaving the user on a blank trigger over a blank panel with nothing to
  // click. An internal user is used because that is the session role an org
  // admin actually carries.
  it("should leave the organization view when org-admin membership is revoked mid-session", async () => {
    const mockUseIsOrgAdmin = vi.mocked(useIsOrgAdmin);
    mockUseIsOrgAdmin.mockReturnЗначение(true);
    mockUseАвторизовано.mockReturnЗначение({
      isLoading: false,
      isАвторизовано: true,
      token: "mock-token",
      accessТокен: "test-token",
      userId: "user-123",
      userEmail: "test@example.com",
      userRole: "Internal User",
      premiumUser: true,
      disabledPersonalKeyCreation: false,
      showSSOBanner: false,
    } as any);

    const { rerender } = renderWithProviders(<ИспользованиеPage {...defaultProps} organizations={mockOrganizations} />);

    const usageВыбрать = screen.getByTestId("usage-view-select");
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "organization" } });
    });
    await waitFor(() => {
      expect(screen.getAllByText("Entity Использование").length).toBeGreaterThan(0);
    });
    expect((usageВыбрать as HTMLSelectElement).value).toBe("organization");

    mockUseIsOrgAdmin.mockReturnЗначение(false);
    act(() => {
      rerender(<ИспользованиеPage {...defaultProps} organizations={mockOrganizations} />);
    });

    await waitFor(() => {
      expect((screen.getByTestId("usage-view-select") as HTMLSelectElement).value).toBe("global");
    });
  });

  it("should show customer usage view for admins", async () => {
    mockUseCustomers.mockReturnЗначение({
      data: mockCustomers,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    const usageВыбрать = screen.getByTestId("usage-view-select");
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "customer" } });
    });

    await waitFor(() => {
      const entityUsageElements = screen.getAllByText("Entity Использование");
      expect(entityUsageElements.length).toBeGreaterThan(0);
    });
  });

  it("should withhold the customer list while it is still loading", async () => {
    mockUseCustomers.mockReturnЗначение({ data: undefined, isLoading: true, error: null } as any);

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    act(() => {
      fireEvent.change(screen.getByTestId("usage-view-select"), { target: { value: "customer" } });
    });

    const entityИспользование = await screen.findByTestId("entity-usage");
    expect(entityИспользование).toHaveAttribute("data-entity-list", "null");
  });

  it("should show agent usage view for admins", async () => {
    mockUseАгенты.mockReturnЗначение({
      data: { agents: mockАгенты },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<ИспользованиеPage {...defaultProps} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    const usageВыбрать = screen.getByTestId("usage-view-select");
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "agent" } });
    });

    await waitFor(() => {
      const entityUsageElements = screen.getAllByText("Entity Использование");
      expect(entityUsageElements.length).toBeGreaterThan(0);
    });
  });

  it.each(["organization", "agent"])("should not render the %s usage view for an internal user", async (usageView) => {
    mockUseАвторизовано.mockReturnЗначение(nonAdminСессия);

    renderWithProviders(<ИспользованиеPage {...defaultProps} organizations={mockOrganizations} />);

    await waitFor(() => {
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
    });

    const usageВыбрать = screen.getByTestId("usage-view-select");
    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: "team" } });
    });
    expect(screen.getAllByText("Entity Использование").length).toBeGreaterThan(0);

    act(() => {
      fireEvent.change(usageВыбрать, { target: { value: usageView } });
    });
    expect(screen.queryByText("Entity Использование")).not.toBeInTheDocument();
  });

  describe("admin user selector", () => {
    // Anchored on the field's own label, so it does not depend on which library draws the control.
    const userSelectCombobox = (): HTMLElement => {
      let node: HTMLElement | null = screen.getByText("Фильтр by user");
      while (node && !node.querySelector('[role="combobox"]')) {
        node = node.parentElement;
      }
      const combobox = node?.querySelector('[role="combobox"]') ?? null;
      expect(combobox).not.toBeNull();
      return combobox as HTMLElement;
    };

    const openUserВыбрать = async () => {
      await userEvent.setup().click(userSelectCombobox());
    };

    // One library paints the prompt as its own text node and the other leaves it on the input's
    // placeholder attribute, so either one means the user is being told what to type.
    const promptsWith = (text: string) =>
      screen.queryAllByText(text).length + screen.queryAllByPlaceholderText(text).length > 0;

    it("should render user selector for admin users in global view", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      expect(userSelectCombobox()).toBeInTheDocument();
      expect(promptsWith("Search users by email…")).toBe(true);
    });

    it("should format user options with alias when available", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      await openUserВыбрать();

      // User with alias should show "alias (id)"
      expect(screen.getByText("Alice (user-001)")).toBeInTheDocument();
      // User withвыход alias but with email should show "email (id)"
      expect(screen.getByText("bob@example.com (user-002)")).toBeInTheDocument();
      // User with neither alias nor email should show just the id
      expect(screen.getByText("user-003")).toBeInTheDocument();
    });

    it("should call useInfiniteUsers with debounced search", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // useInfiniteUsers should be called with default page size
      expect(mockUseInfiniteUsers).toHaveBeenCalledWith(50, undefined);
    });

    it("should deduplicate users across pages", async () => {
      mockUseInfiniteUsers.mockReturnЗначение({
        data: {
          pages: [
            {
              users: [{ user_id: "user-dup", user_alias: "DupUser", user_email: null }],
              page: 1,
              total_pages: 2,
              total_count: 2,
            },
            {
              users: [
                { user_id: "user-dup", user_alias: "DupUser", user_email: null },
                { user_id: "user-unique", user_alias: "UniqueUser", user_email: null },
              ],
              page: 2,
              total_pages: 2,
              total_count: 2,
            },
          ],
          pageParams: [1, 2],
        },
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
      } as any);

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      await openUserВыбрать();

      // Duplicate user should appear only once
      const dupElements = screen.getAllByText("DupUser (user-dup)");
      expect(dupElements).toHaveLength(1);
      // Unique user should also appear
      expect(screen.getByText("UniqueUser (user-unique)")).toBeInTheDocument();
    });

    it("should pass selected userId to aggregated call", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // Initially called with null (global view for admin)
      expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalledWith(
        "test-token",
        expect.any(Date),
        expect.any(Date),
        null,
      );
    });
  });

  describe("user usage view", () => {
    it("should hand EntityИспользование no user list so its own filter can search every user", async () => {
      mockUseInfiniteUsers.mockReturnЗначение({
        data: {
          pages: [
            {
              users: Array.from({ length: 50 }, (_, index) => ({
                user_id: `user-${index}`,
                user_alias: null,
                user_email: `user${index}@example.com`,
              })),
              page: 1,
              total_pages: 4,
              total_count: 200,
            },
          ],
          pageParams: [1],
        },
        fetchNextPage: vi.fn(),
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
      } as unknown as ReturnType<typeof useInfiniteUsers>);

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      act(() => {
        fireEvent.change(screen.getByTestId("usage-view-select"), { target: { value: "user" } });
      });

      const entityИспользование = await screen.findByTestId("entity-usage");
      expect(entityИспользование).toHaveAttribute("data-entity-type", "user");
      expect(entityИспользование).toHaveAttribute("data-entity-list", "null");
    });
  });

  describe("non-admin user behavior", () => {
    it("should not render user selector for non-admin users", async () => {
      mockUseАвторизовано.mockReturnЗначение({
        isLoading: false,
        isАвторизовано: true,
        token: "mock-token",
        accessТокен: "test-token",
        userId: "user-123",
        userEmail: "test@example.com",
        userRole: "Internal User",
        premiumUser: false,
        disabledPersonalKeyCreation: false,
        showSSOBanner: false,
      });

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // The admin case above proves this label is rendered when the selector exists, so its
      // absence here is a live assertion rather than a query that can never match.
      expect(screen.queryByText("Фильтр by user")).not.toBeInTheDocument();
    });

    it("should always pass own userId for non-admin users", async () => {
      mockUseАвторизовано.mockReturnЗначение({
        isLoading: false,
        isАвторизовано: true,
        token: "mock-token",
        accessТокен: "test-token",
        userId: "user-123",
        userEmail: "test@example.com",
        userRole: "Internal User",
        premiumUser: false,
        disabledPersonalKeyCreation: false,
        showSSOBanner: false,
      });

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalledWith(
          "test-token",
          expect.any(Date),
          expect.any(Date),
          "user-123",
        );
      });
    });
  });

  describe("aggregated endpoint fallback", () => {
    it("should fall back to paginated calls when aggregated endpoint fails", async () => {
      mockUserDailyActivityAggregatedCall.mockRejectedЗначение(new Ошибка("Aggregated endpoint not available"));
      mockUserDailyActivityCall.mockResolvedЗначение({
        ...mockSpendData,
        metadata: {
          ...mockSpendData.metadata,
          total_pages: 1,
          page: 1,
        },
      });

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
        expect(mockUserDailyActivityCall).toHaveBeenCalled();
      });

      // Should still render the data from the paginated fallback, which lands a render after the call
      expect(await screen.findByText("75,000")).toBeInTheDocument();
    });

    it("should stop showing the previous range's paginated pages while a new range is in flight", async () => {
      // Same rule as the aggregate, one fallback further down. The flag that
      // decides whether these pages are read belongs to the range the failure
      // happened on, or the previous range's pages reach the tile through it.
      let releaseSecondAggregated: () => void = () => {};
      mockUserDailyActivityAggregatedCall.mockReset();
      mockUserDailyActivityAggregatedCall
        .mockRejectedValueOnce(new Ошибка("Aggregated endpoint not available"))
        .mockImplementationOnce(
          () =>
            new Promise((_resolve, reject) => {
              releaseSecondAggregated = () => reject(new Ошибка("Aggregated endpoint not available"));
            }),
        );
      mockUserDailyActivityCall.mockResolvedЗначение({
        ...mockSpendData,
        metadata: { ...mockSpendData.metadata, total_pages: 1, page: 1 },
      });

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getAllByText("75,000").length).toBeGreaterThan(0);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("pick-a-different-range"));
      });

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalledTimes(2);
      });
      expect(screen.queryByText("75,000")).not.toBeInTheDocument();

      await act(async () => {
        releaseSecondAggregated();
      });
      await waitFor(() => {
        expect(screen.getAllByText("75,000").length).toBeGreaterThan(0);
      });
    });

    it("should aggregate multiple pages when paginated endpoint has more than 1 page", async () => {
      mockUserDailyActivityAggregatedCall.mockRejectedЗначение(new Ошибка("Недоступно"));

      const page1Data = {
        results: [mockSpendData.results[0]],
        metadata: {
          total_spend: 60,
          total_api_requests: 700,
          total_successful_requests: 680,
          total_failed_requests: 20,
          total_tokens: 35000,
          total_pages: 2,
          page: 1,
        },
      };

      const page2Data = {
        results: [
          {
            ...mockSpendData.results[0],
            date: "2025-01-02",
          },
        ],
        metadata: {
          total_spend: 65.75,
          total_api_requests: 800,
          total_successful_requests: 770,
          total_failed_requests: 30,
          total_tokens: 40000,
          total_pages: 2,
          page: 2,
        },
      };

      mockUserDailyActivityCall.mockResolvedValueOnce(page1Data).mockResolvedValueOnce(page2Data);

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        // Both pages should have been fetched
        expect(mockUserDailyActivityCall).toHaveBeenCalledTimes(2);
      });

      // Verify first page call
      expect(mockUserDailyActivityCall).toHaveBeenCalledWith("test-token", expect.any(Date), expect.any(Date), 1, null);

      // Verify second page call
      expect(mockUserDailyActivityCall).toHaveBeenCalledWith("test-token", expect.any(Date), expect.any(Date), 2, null);
    });
  });

  describe("MCP Сервер Activity tab", () => {
    it("should render MCP Сервер Activity tab", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // The tab list should contain MCP Сервер Activity
      expect(screen.getByText("MCP Сервер Activity")).toBeInTheDocument();
    });
  });

  describe("User Agent Activity view", () => {
    it("should render User Agent Activity component when view is selected", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      const usageВыбрать = screen.getByTestId("usage-view-select");
      act(() => {
        fireEvent.change(usageВыбрать, { target: { value: "user-agent-activity" } });
      });

      await waitFor(() => {
        // "User Agent Activity" appears both in the select option and in the rendered component
        const elements = screen.getAllByText("User Agent Activity");
        expect(elements.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Export Data button", () => {
    it("should render Export Data button in global view for admin", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      expect(screen.getByText("Export Data")).toBeInTheDocument();
    });
  });

  describe("Спросить ИИ button", () => {
    it("should render Спросить ИИ button in global view", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      expect(screen.getByText("Спросить ИИ")).toBeInTheDocument();
    });

    it("should render AI chat panel component", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      expect(screen.getByTestId("usage-ai-chat-panel")).toBeInTheDocument();
    });
  });

  describe("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию view toggle", () => {
    it("should show Публичное название модели view by default", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // Default should be "groups" view showing "Top Публичное название моделиs"
      expect(screen.getByText("Top Публичное название моделиs")).toBeInTheDocument();
      expect(screen.getAllByText("Публичное название модели").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Litellm Название модели").length).toBeGreaterThan(0);
    });

    it("should switch to Litellm Название модели view on toggle click", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // Click the "Litellm Название модели" toggle
      const litellmToggle = screen.getAllByText("Litellm Название модели")[0];
      act(() => {
        fireEvent.click(litellmToggle);
      });

      // Title should change to "Top Litellm Режимls"
      await waitFor(() => {
        expect(screen.getByText("Top Litellm Режимls")).toBeInTheDocument();
      });
    });

    it("should switch back to Публичное название модели view", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      // Switch to individual first
      const litellmToggle = screen.getAllByText("Litellm Название модели")[0];
      act(() => {
        fireEvent.click(litellmToggle);
      });

      await waitFor(() => {
        expect(screen.getByText("Top Litellm Режимls")).toBeInTheDocument();
      });

      // Switch back to groups
      const publicToggle = screen.getAllByText("Публичное название модели")[0];
      act(() => {
        fireEvent.click(publicToggle);
      });

      await waitFor(() => {
        expect(screen.getByText("Top Публичное название моделиs")).toBeInTheDocument();
      });
    });

    it("should feed the Режимl Activity tab from the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups breakdown by default", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      expect(screen.getByText("activity-source:Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups")).toBeInTheDocument();
      expect(screen.queryByText("activity-source:Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")).not.toBeInTheDocument();
    });

    it("should switch the Режимl Activity tab to the litellm Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs breakdown on toggle click", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      act(() => {
        fireEvent.click(screen.getAllByText("Litellm Название модели")[0]);
      });

      await waitFor(() => {
        expect(screen.getByText("activity-source:Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")).toBeInTheDocument();
      });
      expect(screen.queryByText("activity-source:Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups")).not.toBeInTheDocument();
    });
  });

  describe("customer usage banner", () => {
    it("should show and be dismissible in customer view", async () => {
      mockUseCustomers.mockReturnЗначение({
        data: mockCustomers,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      const usageВыбрать = screen.getByTestId("usage-view-select");
      act(() => {
        fireEvent.change(usageВыбрать, { target: { value: "customer" } });
      });

      await waitFor(() => {
        const entityUsageElements = screen.getAllByText("Entity Использование");
        expect(entityUsageElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("agent usage banner", () => {
    it("should show agent usage banner with A2A info", async () => {
      mockUseАгенты.mockReturnЗначение({
        data: { agents: mockАгенты },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      const usageВыбрать = screen.getByTestId("usage-view-select");
      act(() => {
        fireEvent.change(usageВыбрать, { target: { value: "agent" } });
      });

      await waitFor(() => {
        const entityUsageElements = screen.getAllByText("Entity Использование");
        expect(entityUsageElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("tab navigation in global view", () => {
    it("should render all expected tabs", async () => {
      renderWithProviders(<ИспользованиеPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockUserDailyActivityAggregatedCall).toHaveBeenCalled();
      });

      expect(screen.getByText("Стоимость")).toBeInTheDocument();
      expect(screen.getByText("Режимl Activity")).toBeInTheDocument();
      expect(screen.getByText("Ключ Activity")).toBeInTheDocument();
      expect(screen.getByText("MCP Сервер Activity")).toBeInTheDocument();
      expect(screen.getByText("Эндпоинт Activity")).toBeInTheDocument();
    });
  });
});
