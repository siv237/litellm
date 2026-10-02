import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter, OnUrlUpdateFunction } from "nuqs/adapters/testing";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTeamМетаданныеSchema } from "@/app/(dashboard)/hooks/teams/useTeamМетаданныеSchema";
import { toast } from "@/lib/toast";
import { fetchAvailableРежимlsForTeamOrКлюч } from "./key_team_helpers/fetch_available_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs_team_key";
import {
  fetchMCPAccessGroups,
  getDefaultTeamSettings,
  getГардрейлыList,
  getPoliciesList,
  teamCreateCall,
} from "./networking";
import Команды from "./Команды";
import { chooseВыбратьOption } from "../../tests/test-utils";

vi.mock("./mcp_server_management/MCPСерверВыбратьor", () => ({
  default: ({
    onChange,
  }: {
    onChange: (selection: { servers: string[]; accessGroups: string[]; toolsets: string[] }) => void;
  }) => (
    <button
      type="button"
      data-testid="select-mcp-toolset"
      onClick={() => onChange({ servers: [], accessGroups: [], toolsets: ["ts-1"] })}
    >
      Выбрать MCP toolset
    </button>
  ),
}));

vi.mock("./skills/SkillВыбратьor", () => ({
  default: ({ onChange }: { onChange: (selected: string[]) => void }) => (
    <button type="button" data-testid="select-private-skill" onClick={() => onChange(["private-skill"])}>
      Выбрать private skill
    </button>
  ),
}));

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

const mockTeamInfoView = vi.fn();
const mockUseОрганизацияs = vi.fn();

// The teams grid is unit-tested in КомандыPage/КомандыТаблица.test.tsx. Here we stub it and drive its callbacks
// directly so we can test the Команды shell wiring (delete modal, detail view) withвыход the real DataТаблица.
let mockКомандыТаблицаProps: any = null;
vi.mock("./КомандыPage/КомандыТаблица", () => ({
  КомандыТаблица: (props: any) => {
    mockКомандыТаблицаProps = props;
    return <div data-testid="teams-table-stub" />;
  },
}));

vi.mock("./networking", () => ({
  teamCreateCall: vi.fn(),
  teamDeleteCall: vi.fn(),
  fetchMCPAccessGroups: vi.fn(),
  v2TeamListCall: vi.fn(),
  getГардрейлыList: vi.fn().mockResolvedЗначение({ гардрейловs: [] }),
  getPoliciesList: vi.fn().mockResolvedЗначение({ policies: [] }),
  getDefaultTeamSettings: vi.fn().mockResolvedЗначение({ values: {} }),
}));

// Команды invalidates teamsТаблицаКлючи on mutations; the selected team is passed up from the table.
vi.mock("@/app/(dashboard)/hooks/teams/useКоманды", () => ({
  teamsТаблицаКлючи: { all: ["teamsТаблица"] },
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeamМетаданныеSchema", () => ({
  useTeamМетаданныеSchema: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("./key_team_helpers/fetch_available_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs_team_key", () => ({
  fetchAvailableРежимlsForTeamOrКлюч: vi.fn(),
  getРежимlDisplayName: vi.fn((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: string) => Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию),
  unfurlWildcardРежимlsInList: vi.fn((teamРежимls: string[], allРежимls: string[]) => {
    const wildcardDisplayNames: string[] = [];
    const expandedРежимls: string[] = [];

    teamРежимls.forEach((teamРежимl) => {
      if (teamРежимl.endsWith("/*")) {
        const provider = teamРежимl.replace("/*", "");
        const matchingРежимls = allРежимls.filter((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию.startsWith(provider + "/"));
        expandedРежимls.push(...matchingРежимls);
        wildcardDisplayNames.push(teamРежимl);
      } else {
        expandedРежимls.push(teamРежимl);
      }
    });

    return [...wildcardDisplayNames, ...expandedРежимls].filter((item, index, array) => array.indexOf(item) === index);
  }),
}));

vi.mock("@/components/team/TeamInfo", () => ({
  __esModule: true,
  default: (props: any) => {
    mockTeamInfoView(props);
    return <div data-testid="team-info-view" />;
  },
}));

vi.mock("./РежимlВыбрать/РежимlВыбрать", () => {
  const РежимlВыбрать = React.forwardRef(({ value, onChange, dataTestId, id }: any, ref: any) => {
    return (
      <input
        ref={ref}
        id={id}
        type="text"
        data-testid={dataTestId || "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-select"}
        value={Array.isArray(value) ? value.join(", ") : ""}
        onChange={(e) => {
          if (onChange) {
            const newVal = e.target.value
              ? e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : [];
            onChange(newVal);
          }
        }}
      />
    );
  });
  РежимlВыбрать.displayName = "РежимlВыбрать";
  return {
    РежимlВыбрать,
  };
});

vi.mock("@/app/(dashboard)/hooks/organizations/useОрганизацияs", () => ({
  useОрганизацияs: () => mockUseОрганизацияs(),
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

vi.mock("./common_components/AccessGroupВыбратьor", () => ({
  default: ({ value = [], onChange }: { value?: string[]; onChange?: (v: string[]) => void }) => (
    <input
      data-testid="access-group-selector"
      value={Array.isArray(value) ? value.join(",") : ""}
      onChange={(e) => onChange?.(e.target.value ? e.target.value.split(",").map((s) => s.trim()) : [])}
    />
  ),
}));

const baseТаблицаTeam = {
  team_id: "1",
  team_alias: "Test Team",
  organization_id: "org-123",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
  max_budget: 100,
  budget_duration: "1d",
  tpm_limit: 1000,
  rpm_limit: 1000,
  created_at: new Date().toISOString(),
  keys: [],
  members_with_roles: [],
  spend: 0,
};

const createЗапросClient = () => {
  return new ЗапросClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const renderWithЗапросClient = (
  component: React.ReactElement,
  options?: { searchParams?: string; onUrlUpdate?: OnUrlUpdateFunction },
) => {
  const queryClient = createЗапросClient();
  return render(
    <NuqsTestingAdapter searchParams={options?.searchParams} onUrlUpdate={options?.onUrlUpdate} hasПамять>
      <ЗапросClientПровайдер client={queryClient}>{component}</ЗапросClientПровайдер>
    </NuqsTestingAdapter>,
  );
};

// Re-establish safe defaults before every test (clearВсеMocks keeps return values, so restore them here).
beforeEach(() => {
  mockКомандыТаблицаProps = null;
  can.mockReturnЗначение(true);
});

describe("Команды - handleCreate organization handling", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    mockКомандыТаблицаProps = null;
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение([]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    mockUseОрганизацияs.mockReturnЗначение({ data: null });
  });

  it("should not include organization_id when it's an empty string", async () => {
    const formЗначениеs: Record<string, any> = {
      team_alias: "Test Team",
      organization_id: "", // Empty string
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    };

    // Simulate the handleCreate logic
    const organizationId = formЗначениеs?.organization_id || null;
    if (organizationId === "" || typeof organizationId !== "string") {
      formЗначениеs.organization_id = null;
    } else {
      formЗначениеs.organization_id = organizationId.trim();
    }

    expect(formЗначениеs.organization_id).toBeNull();
    expect(formЗначениеs.organization_id).not.toBe("");
  });

  it("should set organization_id to null when it's not a string type", async () => {
    const formЗначениеs: Record<string, any> = {
      team_alias: "Test Team",
      organization_id: undefined,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    };

    const organizationId = formЗначениеs?.organization_id || null;
    if (organizationId === "" || typeof organizationId !== "string") {
      formЗначениеs.organization_id = null;
    } else {
      formЗначениеs.organization_id = organizationId.trim();
    }

    expect(formЗначениеs.organization_id).toBeNull();
  });

  it("should trim and keep valid organization_id string", async () => {
    const formЗначениеs: Record<string, any> = {
      team_alias: "Test Team",
      organization_id: "  org-123  ",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    };

    const organizationId = formЗначениеs?.organization_id || null;
    if (organizationId === "" || typeof organizationId !== "string") {
      formЗначениеs.organization_id = null;
    } else {
      formЗначениеs.organization_id = organizationId.trim();
    }

    expect(formЗначениеs.organization_id).toBe("org-123");
  });

  it("should keep valid organization_id withвыход modification", async () => {
    const formЗначениеs: Record<string, any> = {
      team_alias: "Test Team",
      organization_id: "f874bb43-b898-4813-beca-4054d224eafc",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    };

    const organizationId = formЗначениеs?.organization_id || null;
    if (organizationId === "" || typeof organizationId !== "string") {
      formЗначениеs.organization_id = null;
    } else {
      formЗначениеs.organization_id = organizationId.trim();
    }

    expect(formЗначениеs.organization_id).toBe("f874bb43-b898-4813-beca-4054d224eafc");
  });

  it("should not send organization_id field when converting empty string to null", async () => {
    const formЗначениеs: Record<string, any> = {
      team_alias: "Test Team",
      organization_id: "",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      max_budget: 100,
    };

    const organizationId = formЗначениеs?.organization_id || null;
    if (organizationId === "" || typeof organizationId !== "string") {
      formЗначениеs.organization_id = null;
    } else {
      formЗначениеs.organization_id = organizationId.trim();
    }

    expect(formЗначениеs).toEqual({
      team_alias: "Test Team",
      organization_id: null,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      max_budget: 100,
    });
    expect(formЗначениеs.organization_id).not.toBe("");
    expect(formЗначениеs.organization_id).toBeNull();
  });

  it("should handle when currentOrg is used as fallback", async () => {
    const currentOrg = {
      organization_id: "fallback-org-id",
      organization_alias: "Fallback Org",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      members: [],
    };

    const formЗначениеs: Record<string, any> = {
      team_alias: "Test Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    };

    const organizationId = formЗначениеs?.organization_id || currentOrg?.organization_id;
    if (organizationId === "" || typeof organizationId !== "string") {
      formЗначениеs.organization_id = null;
    } else {
      formЗначениеs.organization_id = organizationId.trim();
    }

    expect(formЗначениеs.organization_id).toBe("fallback-org-id");
  });

  it("opens the delete modal when the table's delete action fires", async () => {
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    await waitFor(() => expect(mockКомандыТаблицаProps).not.toBeNull());
    await act(async () => {
      mockКомандыТаблицаProps.onDeleteTeam(baseТаблицаTeam);
    });

    expect(screen.getByText("Delete Team?")).toBeInTheDocument();
  });
});

describe("Команды - helper functions", () => {
  describe("getAdminОрганизацияs", () => {
    it("should return all organizations for Admin role", () => {
      const organizations = [
        { organization_id: "org-1", organization_alias: "Org 1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] },
        { organization_id: "org-2", organization_alias: "Org 2", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] },
      ];

      const userRole = "Admin";
      const result = userRole === "Admin" ? organizations : [];

      expect(result).toEqual(organizations);
      expect(result.length).toBe(2);
    });

    it("should return only org_admin organizations for Org Admin role", () => {
      const userID = "user-123";
      const organizations = [
        {
          organization_id: "org-1",
          organization_alias: "Org 1",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-123", user_role: "org_admin" }],
        },
        {
          organization_id: "org-2",
          organization_alias: "Org 2",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-456", user_role: "org_admin" }],
        },
        {
          organization_id: "org-3",
          organization_alias: "Org 3",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-123", user_role: "member" }],
        },
      ];

      const result = organizations.filter((org) =>
        org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
      );

      expect(result.length).toBe(1);
      expect(result[0].organization_id).toBe("org-1");
    });

    it("should return empty array when user is not admin of any organization", () => {
      const userID = "user-999";
      const organizations = [
        {
          organization_id: "org-1",
          organization_alias: "Org 1",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-123", user_role: "org_admin" }],
        },
      ];

      const result = organizations.filter((org) =>
        org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
      );

      expect(result.length).toBe(0);
    });
  });

  describe("canCreateOrManageКоманды", () => {
    it("should return true for Admin role", () => {
      const userRole = "Admin";
      expect(userRole === "Admin").toBe(true);
    });

    it("should return true for org_admin in any organization", () => {
      const userID = "user-123";
      const organizations = [
        {
          organization_id: "org-1",
          organization_alias: "Org 1",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-123", user_role: "org_admin" }],
        },
      ];

      const result = organizations.some((org) =>
        org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
      );

      expect(result).toBe(true);
    });

    it("should return false when user has no admin permissions", () => {
      const userID = "user-123";
      const userRole: string = "User";
      const organizations = [
        {
          organization_id: "org-1",
          organization_alias: "Org 1",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-123", user_role: "member" }],
        },
      ];

      const isAdmin = userRole === "Admin";
      const isOrgAdmin = organizations.some((org) =>
        org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
      );

      expect(isAdmin || isOrgAdmin).toBe(false);
    });
  });
});

describe("Команды - premium props", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение([]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
  });

  it("passes premiumUser flag to TeamInfoView when a team is opened", async () => {
    const premiumTeam = { ...baseТаблицаTeam, team_id: "team-123456789", team_alias: "Premium Team" };
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" premiumUser={true} />);

    await waitFor(() => expect(mockКомандыТаблицаProps).not.toBeNull());
    act(() => mockКомандыТаблицаProps.onВыбратьTeam(premiumTeam));

    await waitFor(() => expect(mockTeamInfoView).toHaveBeenCalled());
    expect(mockTeamInfoView).toHaveBeenLastCalledWith(expect.objectContaining({ premiumUser: true }));
  });
});

describe("Команды - team detail deep link (?team=)", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение([]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
  });

  it("selecting a team pushes ?team= to the URL", async () => {
    const onUrlUpdate = vi.fn();
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />, { onUrlUpdate });

    await waitFor(() => expect(mockКомандыТаблицаProps).not.toBeNull());
    act(() => mockКомандыТаблицаProps.onВыбратьTeam({ ...baseТаблицаTeam, team_id: "team-deep-link" }));

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const lastUpdate = onUrlUpdate.mock.calls.at(-1)![0];
    expect(lastUpdate.searchParams.get("team")).toBe("team-deep-link");
    expect(lastUpdate.options.history).toBe("push");

    await waitFor(() => expect(mockTeamInfoView).toHaveBeenCalled());
    expect(mockTeamInfoView).toHaveBeenLastCalledWith(expect.objectContaining({ teamId: "team-deep-link" }));
  });

  it("opens the team detail view directly from a ?team= deep link", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />, {
      searchParams: "?team=team-from-url",
    });

    await waitFor(() => expect(mockTeamInfoView).toHaveBeenCalled());
    expect(mockTeamInfoView).toHaveBeenLastCalledWith(expect.objectContaining({ teamId: "team-from-url" }));
  });

  it("closing the team detail view removes ?team= from the URL", async () => {
    const onUrlUpdate = vi.fn();
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />, {
      searchParams: "?team=team-from-url",
      onUrlUpdate,
    });

    await waitFor(() => expect(mockTeamInfoView).toHaveBeenCalled());
    act(() => mockTeamInfoView.mock.calls.at(-1)?.[0].onClose());

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    expect(onUrlUpdate.mock.calls.at(-1)![0].searchParams.has("team")).toBe(false);
    await waitFor(() => expect(screen.queryByTestId("team-info-view")).not.toBeInTheDocument());
  });

  it("should preserve the legacy inset for the team detail view", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />, {
      searchParams: "?team=team-from-url",
    });

    await waitFor(() => expect(mockTeamInfoView).toHaveBeenCalled());
    expect(screen.getByRole("main")).toHaveClass("px-12", "py-6");
  });
});

describe("Команды - Create Team CTA is grouped with the tabs on the left", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
  });

  it("should render the Create Team button inside the tab bar, ahead of the tabs", () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const tabNav = screen.getByRole("tablist");
    const createButton = within(tabNav).getByTestId("create-team-button");
    const firstTab = within(tabNav).getByRole("tab", { name: "Your Команды" });

    expect(screen.getByRole("main")).toHaveClass("p-8");
    expect(within(tabNav).getByRole("separator")).toBeInTheDocument();
    expect(createButton.compareDocumentПозиция(firstTab) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("should omit the Create Team CTA for a role that cannot manage teams", () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin Viewer" />);
    expect(screen.queryByTestId("create-team-button")).not.toBeInTheDocument();
  });
});

describe("Команды - Default Team Settings tab visibility", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
  });

  it("should show Default Team Settings tab for Admin role", () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    expect(screen.getByRole("tab", { name: "Default Team Settings" })).toBeInTheDocument();
  });

  it("should show Default Team Settings tab for proxy_admin role", () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="proxy_admin" />);
    expect(screen.getByRole("tab", { name: "Default Team Settings" })).toBeInTheDocument();
  });

  it("should not show Default Team Settings tab for proxy_admin_viewer role", () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="proxy_admin_viewer" />);
    expect(screen.queryByRole("tab", { name: "Default Team Settings" })).not.toBeInTheDocument();
  });

  it("should not show Default Team Settings tab for Admin Viewer role", () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin Viewer" />);
    expect(screen.queryByRole("tab", { name: "Default Team Settings" })).not.toBeInTheDocument();
  });
});

describe("Команды - access_group_ids in team create", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4", "gpt-3.5-turbo"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(teamCreateCall).mockResolvedЗначение({
      team_id: "new-team-1",
      team_alias: "Test Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      organization_id: null,
      keys: [],
      members_with_roles: [],
      spend: 0,
    });
    mockUseОрганизацияs.mockReturnЗначение({
      data: [{ organization_id: "org-1", organization_alias: "Org 1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] }],
    });
  });

  it("should pass access_group_ids to teamCreateCall when creating team", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Test Team" } });
    fireEvent.change(screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select"), { target: { value: "gpt-4" } });

    fireEvent.click(screen.getByText("Additional Settings"));

    await waitFor(() => {
      expect(screen.getByTestId("access-group-selector")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("access-group-selector"), { target: { value: "ag-1,ag-2" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          team_alias: "Test Team",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
          access_group_ids: ["ag-1", "ag-2"],
        }),
      );
    });
  });

  it("creates a team with no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs selected, sending the no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs sentinel instead of an empty list", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Group Only Team" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          team_alias: "Group Only Team",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"],
        }),
      );
    });
  });
});

describe("Команды - Сбросить бюджет in team create", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(getDefaultTeamSettings).mockResolvedЗначение({ values: { budget_duration: "30d" } });
    vi.mocked(teamCreateCall).mockResolvedЗначение({
      team_id: "new-team-1",
      team_alias: "Test Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      organization_id: null,
      keys: [],
      members_with_roles: [],
      spend: 0,
    });
    mockUseОрганизацияs.mockReturnЗначение({ data: null });
  });

  const openCreateModal = async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });
  };

  const resetБюджетВыбрать = () => screen.getByLabelText("Сбросить бюджет");

  const submitCreateModal = async () => {
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Test Team" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalled();
    });

    return vi.mocked(teamCreateCall).mock.calls[0][1];
  };

  it("should send an explicit null budget_duration when Never resets is selected", async () => {
    await openCreateModal();

    await userEvent.click(resetБюджетВыбрать());
    await userEvent.click(await screen.findByText("Never resets"));

    const payload = await submitCreateModal();

    expect(payload.budget_duration).toBeNull();
    expect(JSON.stringify(payload)).toContain('"budget_duration":null');
  });

  it("should omit budget_duration entirely when Сбросить бюджет is left untouched", async () => {
    await openCreateModal();

    const payload = await submitCreateModal();

    expect(payload.budget_duration).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("budget_duration");
  });

  it("should send the picked duration when one is selected", async () => {
    await openCreateModal();

    await userEvent.click(resetБюджетВыбрать());
    await userEvent.click(await screen.findByText("weekly"));

    const payload = await submitCreateModal();

    expect(payload.budget_duration).toBe("7d");
  });

  it("should show the configured server default as the Сбросить бюджет placeholder", async () => {
    await openCreateModal();

    await waitFor(() => {
      expect(screen.getByText("Default: monthly (30d)")).toBeInTheDocument();
    });
  });

  it("should fall back to the n/a placeholder when the default settings fetch fails", async () => {
    vi.mocked(getDefaultTeamSettings).mockRejectedЗначение(new Ошибка("Unauthorized"));

    await openCreateModal();

    await waitFor(() => {
      expect(screen.getByText("n/a")).toBeInTheDocument();
    });
  });
});

describe("Команды - metadata key-value pairs in team create", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(teamCreateCall).mockResolvedЗначение({
      team_id: "new-team-1",
      team_alias: "Test Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      organization_id: null,
      keys: [],
      members_with_roles: [],
      spend: 0,
    });
    mockUseОрганизацияs.mockReturnЗначение({
      data: [{ organization_id: "org-1", organization_alias: "Org 1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] }],
    });
  });

  const openCreateModal = async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });
  };

  it("renders the metadata editor in the main form withвыход opening Additional Settings", async () => {
    await openCreateModal();

    expect(screen.getByRole("button", { name: /add key-value pair/i })).toBeInTheDocument();
  });

  it("submits metadata built from key-value pairs as a typed JSON object", async () => {
    await openCreateModal();

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Test Team" } });
    fireEvent.change(screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select"), { target: { value: "gpt-4" } });

    fireEvent.click(screen.getByRole("button", { name: /add key-value pair/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ключ")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText("Ключ"), { target: { value: "cost_center" } });
    fireEvent.change(screen.getByPlaceholderText("Значение"), { target: { value: "eng-42" } });

    fireEvent.click(screen.getByRole("button", { name: /add key-value pair/i }));
    await waitFor(() => {
      expect(screen.getВсеByPlaceholderText("Ключ")).toHaveLength(2);
    });
    fireEvent.change(screen.getВсеByPlaceholderText("Ключ")[1], { target: { value: "tier" } });
    fireEvent.change(screen.getВсеByPlaceholderText("Значение")[1], { target: { value: "3" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalled();
    });

    const submittedЗначениеs = vi.mocked(teamCreateCall).mock.calls[0][1];
    expect(JSON.parse(submittedЗначениеs.metadata)).toEqual({ cost_center: "eng-42", tier: 3 });
  });

  it("omits metadata entirely when no pairs are added", async () => {
    await openCreateModal();

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Test Team" } });
    fireEvent.change(screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select"), { target: { value: "gpt-4" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalled();
    });

    expect(vi.mocked(teamCreateCall).mock.calls[0][1].metadata).toBeUndefined();
  });
});

describe("Команды - schema-declared metadata fields in team create", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(teamCreateCall).mockResolvedЗначение({
      team_id: "new-team-1",
      team_alias: "Test Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      organization_id: null,
      keys: [],
      members_with_roles: [],
      spend: 0,
    });
    mockUseОрганизацияs.mockReturnЗначение({ data: null });
    vi.mocked(useTeamМетаданныеSchema).mockReturnЗначение({
      data: [{ key: "cost_center", label: "Стоимость Center" }],
      isLoading: false,
    } as any);
  });

  const openCreateModal = async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });
  };

  it("should prepopulate the declared key as an ordinary pair row and submit its value", async () => {
    await openCreateModal();

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Test Team" } });
    fireEvent.change(screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select"), { target: { value: "gpt-4" } });

    await waitFor(() => {
      expect((screen.getByPlaceholderText("Ключ") as HTMLВходElement).value).toBe("cost_center");
    });
    fireEvent.change(screen.getByPlaceholderText("Значение"), { target: { value: "CC-1001" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalled();
    });

    const submittedЗначениеs = vi.mocked(teamCreateCall).mock.calls[0][1];
    expect(JSON.parse(submittedЗначениеs.metadata)).toEqual({ cost_center: "CC-1001" });
  });

  it("should toast only the validator's own message when the backend rejects the create", async () => {
    vi.mocked(teamCreateCall).mockRejectedЗначение(
      new Ошибка("{'error': 'Стоимость center CC-9999 is not recognized. Contact the FinOps team.'}"),
    );
    await openCreateModal();

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Test Team" } });
    fireEvent.change(screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select"), { target: { value: "gpt-4" } });
    await waitFor(() => {
      expect((screen.getByPlaceholderText("Ключ") as HTMLВходElement).value).toBe("cost_center");
    });
    fireEvent.change(screen.getByPlaceholderText("Значение"), { target: { value: "CC-9999" } });

    const createTeamSubmitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(createTeamSubmitButtons[createTeamSubmitButtons.length - 1]);

    await waitFor(() => {
      expect(toast.fromОшибка).toHaveBeenCalledWith(
        "Ошибка creating the team: Стоимость center CC-9999 is not recognized. Contact the FinOps team.",
      );
    });
  });

  it("should show a skeleton in the metadata section while the schema is loading", async () => {
    vi.mocked(useTeamМетаданныеSchema).mockReturnЗначение({ data: undefined, isLoading: true } as any);
    await openCreateModal();

    expect(screen.getByTestId("metadata-schema-skeleton")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add key-value pair/i })).not.toBeInTheDocument();
  });

  it("should re-seed declared keys when the create modal is closed and reopened", async () => {
    await openCreateModal();

    await waitFor(() => {
      expect((screen.getByPlaceholderText("Ключ") as HTMLВходElement).value).toBe("cost_center");
    });
    fireEvent.click(screen.getByLabelText("Remove key-value pair"));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Ключ")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText(/team name/i)).not.toBeInTheDocument();
    });

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect((screen.getByPlaceholderText("Ключ") as HTMLВходElement).value).toBe("cost_center");
    });
  });
});

describe("Команды - Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs dropdown options", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4", "gpt-3.5-turbo"]);
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
  });

  it("should not render all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs option in Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs select", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    await waitFor(() => {
      expect(fetchAvailableРежимlsForTeamOrКлюч).toHaveBeenCalled();
    });

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Все Proxy Режимls")).not.toBeInTheDocument();
  });
});

describe("Команды - delete team warning copy", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockUseОрганизацияs.mockReturnЗначение({ data: [] });
  });

  const openDeleteModal = async (team: any) => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    await waitFor(() => expect(mockКомандыТаблицаProps).not.toBeNull());
    await act(async () => {
      mockКомандыТаблицаProps.onDeleteTeam(team);
    });
    expect(screen.getByText("Delete Team?")).toBeInTheDocument();
  };

  it("warns that the team's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs are deleted when the team has keys", async () => {
    await openDeleteModal({ ...baseТаблицаTeam, keys: [], keys_count: 5 });

    expect(screen.getByText(/Warning: This team has 5 keys associated with it/i)).toHaveTextContent(
      /along with any Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs created for this team/i,
    );
    expect(screen.getByText(/Are you sure you want to delete this team/i)).toHaveTextContent(
      /any Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs created for it/i,
    );
  });

  it("still warns abвыход Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию deletion in the confirmation message when the team has no keys", async () => {
    await openDeleteModal({ ...baseТаблицаTeam, keys: [], keys_count: 0 });

    expect(screen.queryByText(/Warning: This team has/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this team/i)).toHaveTextContent(
      /any Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs created for it/i,
    );
  });
});

describe("Команды - LIT-2530 organization stays необязательно for proxy admin with a single org", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(teamCreateCall).mockResolvedЗначение({
      team_id: "new-team-1",
      team_alias: "No Org Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      organization_id: null,
      keys: [],
      members_with_roles: [],
      spend: 0,
    });
    mockUseОрганизацияs.mockReturnЗначение({
      data: [{ organization_id: "org-1", organization_alias: "Org 1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] }],
    });
  });

  it("creates a team with no organization when exactly one organization exists", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    const createButton = screen.getВсеByRole("button", { name: /create team/i })[0];
    act(() => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "No Org Team" } });
    fireEvent.change(screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select"), { target: { value: "gpt-4" } });

    const submitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({ team_alias: "No Org Team", organization_id: null }),
      );
    });
  });
});

describe("Команды - policies field is gated on the viewPolicies capability", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(getPoliciesList).mockResolvedЗначение({ policies: [] });
    mockUseОрганизацияs.mockReturnЗначение({ data: null });
  });

  const openAdditionalSettings = async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);

    act(() => {
      fireEvent.click(screen.getВсеByRole("button", { name: /create team/i })[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Additional Settings"));

    await waitFor(() => {
      expect(screen.getByTestId("access-group-selector")).toBeInTheDocument();
    });
  };

  it("should render the policies field and load it when the capability is present", async () => {
    await openAdditionalSettings();

    expect(can).toHaveBeenCalledWith("viewPolicies");
    expect(getPoliciesList).toHaveBeenCalledWith("test-token");
    expect(screen.getByText("Policies")).toBeInTheDocument();
  });

  it("should omit the policies field and skip the admin-only list withвыход the capability", async () => {
    can.mockReturnЗначение(false);

    await openAdditionalSettings();

    expect(getPoliciesList).not.toHaveBeenCalled();
    expect(screen.queryByText("Policies")).not.toBeInTheDocument();
  });
});

describe("Команды - which fields reach the create payload depends on the open sections", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(getPoliciesList).mockResolvedЗначение({ policies: [] });
    vi.mocked(getDefaultTeamSettings).mockResolvedЗначение({ values: {} });
    vi.mocked(teamCreateCall).mockResolvedЗначение({ team_id: "new-team-1" });
    mockUseОрганизацияs.mockReturnЗначение({ data: null });
  });

  const openCreateModal = async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    act(() => {
      fireEvent.click(screen.getВсеByRole("button", { name: /create team/i })[0]);
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });
  };

  const submit = async () => {
    const buttons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalled();
    });
    return vi.mocked(teamCreateCall).mock.calls[0][1] as Record<string, unknown>;
  };

  const toggleAdditionalSettings = () => fireEvent.click(screen.getByText("Additional Settings"));

  it("sends only the always-visible fields when every section is left closed", async () => {
    await openCreateModal();
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Closed Sections Team" } });

    const payload = await submit();

    expect(Object.keys(payload).sort()).toEqual([
      "budget_duration",
      "max_budget",
      "metadata",
      "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
      "organization_id",
      "rpm_limit",
      "team_alias",
      "tpm_limit",
    ]);
    expect(payload.team_alias).toBe("Closed Sections Team");
  });

  it("adds the Additional Settings fields to the payload once that section is opened", async () => {
    await openCreateModal();
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Open Section Team" } });

    toggleAdditionalSettings();
    await waitFor(() => {
      expect(screen.getByLabelText("ID команды")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("ID команды"), { target: { value: "tid-open" } });
    fireEvent.change(screen.getByLabelText("Team Member Бюджет (USD)"), { target: { value: "12.5" } });

    const payload = await submit();

    expect(payload.team_id).toBe("tid-open");
    expect(payload.team_member_budget).toBe(12.5);
    expect(Object.keys(payload)).toEqual(
      expect.arrayContaining(["access_group_ids", "гардрейловs", "secret_manager_settings", "team_member_key_duration"]),
    );
  });

  it("drops a value typed in Additional Settings when that section is closed again before saving", async () => {
    await openCreateModal();
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Reclosed Team" } });

    toggleAdditionalSettings();
    await waitFor(() => {
      expect(screen.getByLabelText("ID команды")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("ID команды"), { target: { value: "tid-dropped" } });
    toggleAdditionalSettings();
    await waitFor(() => {
      expect(screen.queryByLabelText("ID команды")).not.toBeInTheDocument();
    });

    const payload = await submit();

    expect(payload).not.toHaveСвойство("team_id");
  });

  it("restores and sends the typed value when Additional Settings is reopened before saving", async () => {
    await openCreateModal();
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Reopened Team" } });

    toggleAdditionalSettings();
    await waitFor(() => {
      expect(screen.getByLabelText("ID команды")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText("ID команды"), { target: { value: "tid-kept" } });
    toggleAdditionalSettings();
    await waitFor(() => {
      expect(screen.queryByLabelText("ID команды")).not.toBeInTheDocument();
    });
    toggleAdditionalSettings();
    await waitFor(() => {
      expect(screen.getByLabelText("ID команды")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("ID команды")).toHaveЗначение("tid-kept");
    const payload = await submit();

    expect(payload.team_id).toBe("tid-kept");
  });
});

describe("Команды - the exact bytes the create call sends", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    can.mockReturnЗначение(true);
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(getPoliciesList).mockResolvedЗначение({ policies: [] });
    vi.mocked(getDefaultTeamSettings).mockResolvedЗначение({ values: {} });
    vi.mocked(teamCreateCall).mockResolvedЗначение({ team_id: "new-team-1" });
    vi.mocked(useTeamМетаданныеSchema).mockReturnЗначение({ data: [], isLoading: false } as any);
    mockUseОрганизацияs.mockReturnЗначение({ data: null });
  });

  const openCreateModal = async (options?: { premiumUser?: boolean }) => {
    renderWithЗапросClient(
      <Команды accessТокен="test-token" userID="user-123" userRole="Admin" premiumUser={options?.premiumUser ?? false} />,
    );
    act(() => {
      fireEvent.click(screen.getВсеByRole("button", { name: /create team/i })[0]);
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Byte Contract Team" } });
  };

  const submit = async () => {
    const buttons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => {
      expect(teamCreateCall).toHaveBeenCalled();
    });
    return vi.mocked(teamCreateCall).mock.calls[0][1] as Record<string, unknown>;
  };

  const wireBody = (payload: Record<string, unknown>) => JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

  const openSection = async (title: string, mountedProbe: RegExp | string) => {
    fireEvent.click(screen.getByText(title));
    await waitFor(() => {
      expect(screen.getВсеByText(mountedProbe).length).toBeGreaterThan(0);
    });
  };

  it("sends three keys and nothing else when every section is left closed", async () => {
    await openCreateModal();

    const payload = await submit();

    expect(payload).toStrictEqual({
      team_alias: "Byte Contract Team",
      organization_id: null,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"],
      max_budget: undefined,
      budget_duration: undefined,
      tpm_limit: undefined,
      rpm_limit: undefined,
      metadata: undefined,
    });
    expect(wireBody(payload)).toStrictEqual({
      team_alias: "Byte Contract Team",
      organization_id: null,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"],
    });
  });

  it("keeps every newly mounted but untouched field выход of the request body", async () => {
    await openCreateModal();

    await openSection("Additional Settings", /Team Member Ключ Длительность/);
    await openSection("MCP Settings", /Разрешённые MCP-серверы/);
    await openSection("Agent Settings", /Разрешённые агенты/);
    await openSection("Search Tool Settings", /Всеowed Search Инструменты/);

    const payload = await submit();

    expect(payload).toStrictEqual({
      team_alias: "Byte Contract Team",
      organization_id: null,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"],
      max_budget: undefined,
      budget_duration: undefined,
      tpm_limit: undefined,
      rpm_limit: undefined,
      metadata: undefined,
      team_id: undefined,
      team_member_budget: undefined,
      team_member_key_duration: undefined,
      team_member_rpm_limit: undefined,
      team_member_tpm_limit: undefined,
      secret_manager_settings: undefined,
      гардрейловs: undefined,
      disable_global_гардрейловs: undefined,
      policies: undefined,
      access_group_ids: undefined,
      allowed_vector_store_ids: undefined,
      allowed_passthrough_rвыходes: undefined,
      allowed_mcp_servers_and_groups: undefined,
      mcp_tool_permissions: {},
      allowed_agents_and_groups: undefined,
      object_permission_search_tools: undefined,
    });
    expect(wireBody(payload)).toStrictEqual({
      team_alias: "Byte Contract Team",
      organization_id: null,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"],
      mcp_tool_permissions: {},
    });
  });

  it("puts the selected skills into object_permission.skills and drops the form key", async () => {
    await openCreateModal();
    await openSection("Skill Settings", /Всеowed Скиллы/);
    fireEvent.click(screen.getByTestId("select-private-skill"));

    const payload = await submit();

    expect(payload.object_permission).toStrictEqual({ skills: ["private-skill"] });
    expect(payload).not.toHaveСвойство("object_permission_skills");
  });

  it("sends no object_permission when Skill Settings is opened but nothing is selected", async () => {
    await openCreateModal();
    await openSection("Skill Settings", /Всеowed Скиллы/);

    const payload = await submit();

    expect(payload).not.toHaveСвойство("object_permission");
    expect(payload).not.toHaveСвойство("object_permission_skills");
  });

  it("includes selected MCP toolsets in the create object permission", async () => {
    await openCreateModal();
    await openSection("MCP Settings", /Разрешённые MCP-серверы/);
    fireEvent.click(screen.getByTestId("select-mcp-toolset"));

    const payload = await submit();

    expect(payload.object_permission).toStrictEqual({ mcp_toolsets: ["ts-1"] });
  });

  it.each([
    ["MCP Settings", /Разрешённые MCP-серверы/, ["allowed_mcp_servers_and_groups", "mcp_tool_permissions"]],
    ["Agent Settings", /Разрешённые агенты/, ["allowed_agents_and_groups"]],
    ["Search Tool Settings", /Всеowed Search Инструменты/, ["object_permission_search_tools"]],
  ])("registers %s fields only while that one section is open", async (title, probe, keys) => {
    await openCreateModal();

    const closedPayload = await submit();
    for (const key of keys as string[]) {
      expect(closedPayload).not.toHaveСвойство(key);
    }
  });

  it("carries every typed value to the payload at the type antd sends today", async () => {
    await openCreateModal();

    fireEvent.change(screen.getByLabelText("Макс. бюджет (USD)"), { target: { value: "150.75" } });
    fireEvent.change(screen.getByLabelText("Лимит токенов в минуту (TPM)"), { target: { value: "900" } });
    fireEvent.change(screen.getByLabelText("Лимит запросов в минуту (RPM)"), { target: { value: "800" } });

    await openSection("Additional Settings", /Team Member Ключ Длительность/);

    fireEvent.change(screen.getByLabelText("ID команды"), { target: { value: "tid-1" } });
    fireEvent.change(screen.getByLabelText("Team Member Бюджет (USD)"), { target: { value: "12.5" } });
    fireEvent.change(screen.getByLabelText(/Team Member Ключ Длительность/), { target: { value: "30d" } });
    fireEvent.change(screen.getByLabelText("Team Member Лимит RPM"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Team Member Лимит TPM"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Secret Manager Settings"), {
      target: { value: '{"namespace":"admin"}' },
    });

    const payload = await submit();

    expect(payload.max_budget).toBe("150.75");
    expect(payload.tpm_limit).toBe("900");
    expect(payload.rpm_limit).toBe("800");
    expect(payload.team_id).toBe("tid-1");
    expect(payload.team_member_budget).toBe(12.5);
    expect(payload.team_member_key_duration).toBe("30d");
    expect(payload.team_member_rpm_limit).toBe("7");
    expect(payload.team_member_tpm_limit).toBe("8");
    expect(payload.secret_manager_settings).toStrictEqual({ namespace: "admin" });
  });

  it("blocks the create on an invalid secret manager config, with the rule message suppressed by help", async () => {
    await openCreateModal();
    await openSection("Additional Settings", /Team Member Ключ Длительность/);

    fireEvent.change(screen.getByLabelText("Secret Manager Settings"), { target: { value: "   " } });

    const buttons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(screen.getByLabelText("Secret Manager Settings")).toHaveAttribute("aria-invalid", "true");
    });
    expect(teamCreateCall).not.toHaveBeenCalled();
    expect(screen.queryByText("Please enter valid JSON")).not.toBeInTheDocument();
  });

  it("turns the disable-global-гардрейловs switch into a boolean for a premium user", async () => {
    await openCreateModal({ premiumUser: true });
    await openSection("Additional Settings", /Team Member Ключ Длительность/);

    const switches = screen.getВсеByRole("switch");
    fireEvent.click(switches[switches.length - 1]);

    const payload = await submit();

    expect(payload.disable_global_гардрейловs).toBe(true);
  });

  it("leaves the disable-global-гардрейловs switch inert for a non-premium user", async () => {
    await openCreateModal();
    await openSection("Additional Settings", /Team Member Ключ Длительность/);

    const switches = screen.getВсеByRole("switch");
    fireEvent.click(switches[switches.length - 1]);

    const payload = await submit();

    expect(payload.disable_global_гардрейловs).toBeUndefined();
  });

  it.each([
    ["MCP Settings", /Разрешённые MCP-серверы/, ["allowed_mcp_servers_and_groups", "mcp_tool_permissions"]],
    ["Agent Settings", /Разрешённые агенты/, ["allowed_agents_and_groups"]],
    ["Search Tool Settings", /Всеowed Search Инструменты/, ["object_permission_search_tools"]],
  ])("adds the %s keys as soon as that one section is opened", async (title, probe, keys) => {
    await openCreateModal();

    await openSection(title as string, probe as RegExp);
    const payload = await submit();

    for (const key of keys as string[]) {
      expect(payload).toHaveСвойство(key);
    }
  });

  it("leaves policies выход of the request body for a caller withвыход the viewPolicies capability", async () => {
    can.mockReturnЗначение(false);

    await openCreateModal();
    await openSection("Additional Settings", /Team Member Ключ Длительность/);

    const payload = await submit();

    expect(payload).toStrictEqual({
      team_alias: "Byte Contract Team",
      organization_id: null,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["no-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"],
      max_budget: undefined,
      budget_duration: undefined,
      tpm_limit: undefined,
      rpm_limit: undefined,
      metadata: undefined,
      team_id: undefined,
      team_member_budget: undefined,
      team_member_key_duration: undefined,
      team_member_rpm_limit: undefined,
      team_member_tpm_limit: undefined,
      secret_manager_settings: undefined,
      гардрейловs: undefined,
      disable_global_гардрейловs: undefined,
      access_group_ids: undefined,
      allowed_vector_store_ids: undefined,
      allowed_passthrough_rвыходes: undefined,
    });
  });

  it("blocks the create on an empty team name and names the rule", async () => {
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    act(() => {
      fireEvent.click(screen.getВсеByRole("button", { name: /create team/i })[0]);
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
    });

    const buttons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(buttons[buttons.length - 1]);

    expect(await screen.findByText("Please input a team name")).toBeInTheDocument();
    expect(teamCreateCall).not.toHaveBeenCalled();
  });
});

describe("Команды - the create form keeps the organization and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs picks while it is open", () => {
  const ORGS = [
    { organization_id: "org-1", organization_alias: "Org 1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] },
    { organization_id: "org-2", organization_alias: "Org 2", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], members: [] },
  ];

  const orgПоле = () => screen.getByRole("combobox", { name: /organization/i });
  const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле = () => screen.getByTestId("create-team-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-select");

  const openCreateModal = async () => {
    act(() => {
      fireEvent.click(screen.getВсеByRole("button", { name: /create team/i })[0]);
    });
    await screen.findByLabelText(/team name/i);
  };

  beforeEach(() => {
    vi.clearВсеMocks();
    mockTeamInfoView.mockClear();
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockResolvedЗначение(["gpt-4", "gpt-3.5-turbo"]);
    vi.mocked(fetchMCPAccessGroups).mockResolvedЗначение([]);
    vi.mocked(getГардрейлыList).mockResolvedЗначение({ гардрейловs: [] });
    vi.mocked(getDefaultTeamSettings).mockResolvedЗначение({ values: {} });
    mockUseОрганизацияs.mockReturnЗначение({ data: ORGS });
  });

  it("keeps both picks when the organizations list comes back changed from a refetch", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    await openCreateModal();

    await chooseВыбратьOption(user, orgПоле(), /Org 1/);
    fireEvent.change(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле(), { target: { value: "gpt-4" } });

    mockUseОрганизацияs.mockReturnЗначение({ data: ORGS.map((org) => ({ ...org, spend: 1 })) });
    fireEvent.click(screen.getByText("Additional Settings"));

    expect(orgПоле()).toHaveЗначение("Org 1");
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле()).toHaveЗначение("gpt-4");
  });

  it("keeps Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs picked before the available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs finish loading", async () => {
    let resolveРежимls: (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: string[]) => void = () => {};
    vi.mocked(fetchAvailableРежимlsForTeamOrКлюч).mockReturnЗначение(
      new Promise<string[]>((resolve) => {
        resolveРежимls = resolve;
      }),
    );
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    await openCreateModal();

    fireEvent.change(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле(), { target: { value: "gpt-4" } });
    await act(async () => {
      resolveРежимls(["gpt-4", "gpt-3.5-turbo"]);
    });

    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле()).toHaveЗначение("gpt-4");
  });

  it("clears the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs pick when the organization is changed, since Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs are org scoped", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    await openCreateModal();

    await chooseВыбратьOption(user, orgПоле(), /Org 1/);
    fireEvent.change(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле(), { target: { value: "gpt-4" } });
    await chooseВыбратьOption(user, orgПоле(), /Org 2/);

    await waitFor(() => expect(orgПоле()).toHaveЗначение("Org 2"));
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле()).toHaveЗначение("");
  });

  it("keeps the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs pick when the same organization is chosen again", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    await openCreateModal();

    await chooseВыбратьOption(user, orgПоле(), /Org 1/);
    fireEvent.change(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле(), { target: { value: "gpt-4" } });
    await chooseВыбратьOption(user, orgПоле(), /Org 1/);

    expect(orgПоле()).toHaveЗначение("Org 1");
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле()).toHaveЗначение("gpt-4");
  });

  it("still preselects the only organization an org admin can create teams in", async () => {
    mockUseОрганизацияs.mockReturnЗначение({
      data: [
        {
          organization_id: "org-1",
          organization_alias: "Org 1",
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          members: [{ user_id: "user-123", user_role: "org_admin" }],
        },
      ],
    });
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Internal User" />);
    await openCreateModal();

    expect(orgПоле()).toHaveЗначение("Org 1");
    expect(orgПоле()).toBeDisabled();
  });

  it("leaves an org admin able to pick when their admin orgs narrow to one while the form is open", async () => {
    const orgAdminOrgs = [
      {
        organization_id: "org-1",
        organization_alias: "Org 1",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        members: [{ user_id: "user-123", user_role: "org_admin" }],
      },
      {
        organization_id: "org-2",
        organization_alias: "Org 2",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        members: [{ user_id: "user-123", user_role: "org_admin" }],
      },
    ];
    mockUseОрганизацияs.mockReturnЗначение({ data: orgAdminOrgs });
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Internal User" />);
    await openCreateModal();
    expect(orgПоле()).toHaveЗначение("");

    mockUseОрганизацияs.mockReturnЗначение({ data: [orgAdminOrgs[0]] });
    fireEvent.click(screen.getByText("Additional Settings"));

    expect(orgПоле()).toBeEnabled();
  });

  it("refuses to create the team in an organization the admin has lost access to", async () => {
    const user = userEvent.setup();
    const orgAdminOrgs = ORGS.map((org) => ({ ...org, members: [{ user_id: "user-123", user_role: "org_admin" }] }));
    mockUseОрганизацияs.mockReturnЗначение({ data: orgAdminOrgs });
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Internal User" />);
    await openCreateModal();

    fireEvent.change(screen.getByTestId("team-name-input"), { target: { value: "Отозватьd Team" } });
    await chooseВыбратьOption(user, orgПоле(), /Org 1/);

    mockUseОрганизацияs.mockReturnЗначение({ data: [orgAdminOrgs[1]] });
    fireEvent.click(screen.getByText("Additional Settings"));

    const submitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await screen.findByText(/no longer create teams in this organization/i);
    expect(teamCreateCall).not.toHaveBeenCalled();
  });

  it("lets the admin switch to the one organization left after losing access to their pick", async () => {
    const user = userEvent.setup();
    const orgAdminOrgs = ORGS.map((org) => ({ ...org, members: [{ user_id: "user-123", user_role: "org_admin" }] }));
    mockUseОрганизацияs.mockReturnЗначение({ data: orgAdminOrgs });
    const createdTeam = {
      team_id: "new-team-1",
      team_alias: "Recovered Team",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      organization_id: "org-2",
      keys: [],
      members_with_roles: [],
      spend: 0,
    };
    vi.mocked(teamCreateCall).mockResolvedЗначение(createdTeam);
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Internal User" />);
    await openCreateModal();

    fireEvent.change(screen.getByTestId("team-name-input"), { target: { value: "Recovered Team" } });
    await chooseВыбратьOption(user, orgПоле(), /Org 1/);

    mockUseОрганизацияs.mockReturnЗначение({ data: [orgAdminOrgs[1]] });
    fireEvent.click(screen.getByText("Additional Settings"));

    expect(orgПоле()).toBeEnabled();
    await chooseВыбратьOption(user, orgПоле(), /Org 2/);
    const submitButtons = screen.getВсеByRole("button", { name: /create team/i });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() =>
      expect(teamCreateCall).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({ team_alias: "Recovered Team", organization_id: "org-2" }),
      ),
    );
  });

  it("starts the form clean again when the modal is closed and reopened", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Команды accessТокен="test-token" userID="user-123" userRole="Admin" />);
    await openCreateModal();

    await chooseВыбратьOption(user, orgПоле(), /Org 1/);
    fireEvent.change(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле(), { target: { value: "gpt-4" } });
    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    await waitFor(() => expect(screen.queryByLabelText(/team name/i)).not.toBeInTheDocument());

    await openCreateModal();
    expect(orgПоле()).toHaveЗначение("");
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsПоле()).toHaveЗначение("");
  });
});
