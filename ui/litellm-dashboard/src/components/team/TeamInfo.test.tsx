import { useTeamMetadataSchema } from "@/app/(dashboard)/hooks/teams/useTeamMetadataSchema";
import * as networking from "@/components/networking";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseSelectOption, renderWithProviders, testRequestClient } from "../../../tests/test-utils";
import { toast } from "@/lib/toast";
import type { EffectiveMcpСервер } from "../mcp_server_management/effectiveMcp-серверы";
import type { MCPСервер } from "../mcp_tools/types";
import TeamInfoView, {
  grantedMcpServerIds,
  type McpGrantВход,
  retainedMcpToolPermissions,
  standingToolPermissionServerIds,
  type TeamData,
} from "./TeamInfo";

const authState = vi.hoisted(() => ({ userRole: "Admin" }));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({
    token: "123",
    accessТокен: "123",
    userId: "user-1",
    userEmail: "user@example.com",
    userRole: authState.userRole,
    premiumUser: false,
    disabledPersonalKeyCreation: null,
    showSSOBanner: false,
  }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/components/networking", () => ({
  serverRootПуть: "",
  teamInfoCall: vi.fn(),
  teamMemberDeleteCall: vi.fn(),
  teamMemberAddCall: vi.fn(),
  teamMemberUpdateCall: vi.fn(),
  teamUpdateCall: vi.fn(),
  getGuardrailsList: vi.fn(),
  getPoliciesList: vi.fn(),
  getPolicyInfoWithГардрейлы: vi.fn(),
  fetchMCPAccessGroups: vi.fn(),
  getTeamPermissionsCall: vi.fn(),
  organizationInfoCall: vi.fn(),
  getRouterSettingsCall: vi.fn().mockResolvedЗначение({ fields: [] }),
  getPassThroughEndpointsCall: vi.fn().mockResolvedЗначение({ endpoints: [] }),
  fetchMCP-серверы: vi.fn().mockResolvedЗначение([]),
  fetchMCPToolsets: vi.fn().mockResolvedЗначение([]),
  listMCPИнструменты: vi.fn().mockResolvedЗначение({ tools: [] }),
  vectorStoreListCall: vi.fn().mockResolvedЗначение({ data: [] }),
  getAgentsList: vi.fn().mockResolvedЗначение({ agents: [] }),
  getClaudeCodePluginsList: vi.fn().mockResolvedЗначение({ plugins: [], count: 0 }),
}));

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

vi.mock("@/components/utils/dataUtils", () => ({
  copyToClipboard: vi.fn().mockResolvedЗначение(true),
  formatNumberWithCommas: vi.fn((value: number) => value.toLocaleString()),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeamMetadataSchema", () => ({
  useTeamMetadataSchema: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useModels", () => ({
  useAllProxyModels: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useКоманды", () => ({
  useTeam: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  organizationКлючи: { all: ["organizations"] },
  useОрганизация: vi.fn(),
  useOrganizations: vi.fn().mockReturnЗначение({ data: [], isLoading: false }),
}));

vi.mock("@/app/(dashboard)/hooks/users/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы", () => ({
  useMCP-серверы: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCPToolsets", () => ({
  useMCPToolsets: vi.fn(),
}));

vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: { servers: string[]; accessGroups: string[]; toolsets?: string[] };
    onChange: (next: { servers: string[]; accessGroups: string[]; toolsets: string[] }) => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() =>
          onChange({ servers: [], accessGroups: value?.accessGroups ?? [], toolsets: value?.toolsets ?? [] })
        }
      >
        deselect all mcp servers
      </button>
      <button type="button" onClick={() => onChange({ servers: value?.servers ?? [], accessGroups: [], toolsets: [] })}>
        remove all access groups
      </button>
    </>
  ),
}));

vi.mock("@/components/team/TeamMemberTab", () => ({
  default: vi.fn(({ setIsAddMemberModalVisible }) => (
    <div>
      <button onClick={() => setIsAddMemberModalVisible(true)}>Add Member</button>
    </div>
  )),
}));

vi.mock("@/components/common_components/user_search_modal", () => ({
  default: vi.fn(({ isVisible, onCancel, onSubmit }) =>
    isVisible ? (
      <div>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSubmit({ user_email: "new@test.com", user_id: "new-user", role: "user" })}>
          Submit
        </button>
      </div>
    ) : null,
  ),
}));

vi.mock("@/components/team/EditMembership", () => ({
  default: vi.fn(({ visible, onCancel, onSubmit }) =>
    visible ? (
      <div>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSubmit({ user_email: "edit@test.com", user_id: "edit-user", role: "admin" })}>
          Submit
        </button>
      </div>
    ) : null,
  ),
}));

vi.mock("@/components/common_components/DeleteResourceModal", () => ({
  default: vi.fn(({ isOpen, onCancel, onOk }) =>
    isOpen ? (
      <div>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onOk}>Confirm Delete</button>
      </div>
    ) : null,
  ),
}));

vi.mock("@/components/team/member_permissions", () => ({
  default: vi.fn(() => <div>Права участника</div>),
}));

vi.mock("@/components/common_components/РежимlAliasManager", () => ({
  default: vi.fn(({ initialModelAliases, onAliasUpdate }) => (
    <div>
      <div data-testid="alias-editor-initial">{JSON.stringify(initialModelAliases)}</div>
      <button type="button" onClick={() => onAliasUpdate({ "gpt-4o": "gpt-4" })}>
        Set Alias
      </button>
      <button type="button" onClick={() => onAliasUpdate({})}>
        Clear Aliases
      </button>
    </div>
  )),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: vi.fn().mockReturnЗначение({
    data: [
      { access_group_id: "ag-1", access_group_name: "Group 1", access_mcp_server_ids: [] },
      { access_group_id: "ag-2", access_group_name: "Group 2", access_mcp_server_ids: [] },
    ],
    isLoading: false,
    isОшибка: false,
  }),
}));

vi.mock("@/components/common_components/AccessGroupSelector", () => ({
  default: ({ value, onChange }: { value?: string[]; onChange?: (next: string[]) => void }) => (
    <button type="button" onClick={() => onChange?.((value ?? []).slice(1))}>
      remove first unified access group
    </button>
  ),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useКлючи", () => ({
  useКлючи: vi.fn().mockReturnЗначение({
    data: { keys: [], total_count: 0, current_page: 1, total_pages: 1 },
    isPending: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("../key_team_helpers/filter_helpers", () => ({
  fetchTeamFilterOptions: vi.fn().mockResolvedЗначение({
    keyAliases: [],
    organizationIds: [],
    userIds: [],
  }),
  fetchВсеКлючAliases: vi.fn().mockResolvedЗначение([]),
  fetchВсеОрганизацияs: vi.fn().mockResolvedЗначение([]),
}));

import { useAllProxyModels } from "@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useModels";
import { useКлючи } from "@/app/(dashboard)/hooks/keys/useКлючи";
import { useОрганизация } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useTeam } from "@/app/(dashboard)/hooks/teams/useКоманды";
import { useCurrentUser } from "@/app/(dashboard)/hooks/users/useCurrentUser";
import { useMCP-серверы } from "@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcp-серверы/useMCPToolsets";
import { useAccessGroups } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";

const mockUseAllProxyModels = vi.mocked(useAllProxyModels);
const mockUseКлючи = vi.mocked(useКлючи);
const mockUseTeam = vi.mocked(useTeam);
const mockUseОрганизация = vi.mocked(useОрганизация);
const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseMCP-серверы = vi.mocked(useMCP-серверы);
const mockUseMCPToolsets = vi.mocked(useMCPToolsets);
const mockUseAccessGroups = vi.mocked(useAccessGroups);

const createMockTeamData = (overrides = {}) => ({
  team_id: "123",
  team_info: {
    team_alias: "Test Team",
    team_id: "123",
    organization_id: null,
    admins: ["admin@test.com"],
    members: ["user1@test.com"],
    members_with_roles: [
      {
        user_id: "user1@test.com",
        user_email: "user1@test.com",
        role: "member",
        spend: 0,
        budget_id: "budget1",
      },
    ],
    metadata: {},
    tpm_limit: null,
    rpm_limit: null,
    max_budget: null,
    budget_duration: null,
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    blocked: false,
    spend: 0,
    max_parallel_requests: null,
    budget_reset_at: null,
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_id: null,
    litellm_model_table: null,
    created_at: "2024-01-01T00:00:00Z",
    team_member_budget_table: null,
    гардрейловs: [],
    policies: [],
    object_permission: null,
    ...overrides,
  },
  keys: [],
  team_memberships: [],
});

const seedDefaultMocks = () => {
  mockUseAllProxyModels.mockReturnЗначение({
    data: { data: [] },
    isLoading: false,
  } as any);
  mockUseTeam.mockReturnЗначение({
    data: undefined,
    isLoading: false,
  } as any);
  mockUseОрганизация.mockReturnЗначение({
    data: undefined,
    isLoading: false,
  } as any);
  mockUseCurrentUser.mockReturnЗначение({
    data: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [] },
    isLoading: false,
  } as any);
  mockUseMCP-серверы.mockReturnЗначение({ data: [], isLoading: false, isОшибка: false } as any);
  mockUseMCPToolsets.mockReturnЗначение({ data: [], isLoading: false, isОшибка: false } as any);
  mockUseAccessGroups.mockReturnЗначение({
    data: [
      { access_group_id: "ag-1", access_group_name: "Group 1", access_mcp_server_ids: [] },
      { access_group_id: "ag-2", access_group_name: "Group 2", access_mcp_server_ids: [] },
    ],
    isLoading: false,
    isОшибка: false,
  } as any);
  mockUseКлючи.mockReturnЗначение({
    data: { keys: [], total_count: 0, current_page: 1, total_pages: 1 },
    isPending: false,
    isFetching: false,
    refetch: vi.fn(),
  } as any);
  vi.mocked(useTeamMetadataSchema).mockReturnЗначение({ data: [], isLoading: false } as any);

  can.mockReturnЗначение(true);
  vi.mocked(networking.getGuardrailsList).mockResolvedЗначение({ гардрейловs: [] });
  vi.mocked(networking.getPoliciesList).mockResolvedЗначение({ policies: [] });
  vi.mocked(networking.fetchMCPAccessGroups).mockResolvedЗначение([]);
  vi.mocked(networking.getTeamPermissionsCall).mockResolvedЗначение({
    all_available_permissions: [],
    team_member_permissions: [],
  });
};

describe("TeamInfoView", () => {
  const defaultProps = {
    teamId: "123",
    onUpdate: vi.fn(),
    onClose: vi.fn(),
    accessТокен: "test-token",
    is_team_admin: true,
    is_proxy_admin: true,
    userModels: ["gpt-4", "gpt-3.5-turbo"],
    editTeam: false,
    premiumUser: false,
  };

  beforeEach(seedDefaultMocks);

  afterEach(() => {
    vi.clearAllMocks();
    authState.userRole = "Admin";
  });

  describe("display and rendering", () => {
    it("should render", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });
    });

    it("links direct and access-group Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию badges to the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs page filtered to that group", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4.1"],
          access_group_models: ["claude-sonnet-5"],
          access_group_details: [{ access_group_id: "ag-1", access_group_name: "prod", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["claude-sonnet-5"] }],
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      expect(await screen.findByRole("link", { name: "gpt-4.1" })).toHaveAttribute(
        "href",
        expect.stringContaining("/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-and-endpoints?Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group=gpt-4.1"),
      );
      expect(screen.getByRole("link", { name: "claude-sonnet-5" })).toHaveAttribute(
        "href",
        expect.stringContaining("/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-and-endpoints?Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group=claude-sonnet-5"),
      );
    });

    it("shows MCP servers and agents inherited from access groups in the Object Permissions card, naming the group on hover", async () => {
      const user = userEvent.setup();
      vi.mocked(networking.fetchMCP-серверы).mockResolvedЗначение([
        { server_id: "mcp-github-1234", server_name: "github", alias: "github" },
      ]);
      vi.mocked(networking.getAgentsList).mockResolvedЗначение({
        agents: [{ agent_id: "agent-support-5678", agent_name: "support_agent" }],
      });
      const platformToolsGroup = {
        access_group_id: "ag-1",
        access_group_name: "platform-tools",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        mcp_server_ids: ["mcp-github-1234"],
        agent_ids: ["agent-support-5678"],
      };
      const inheritedGrants = {
        object_permission: null,
        access_group_ids: ["ag-1"],
        access_group_mcp_server_ids: ["mcp-github-1234"],
        access_group_agent_ids: ["agent-support-5678"],
        access_group_details: [platformToolsGroup],
      };
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData(inheritedGrants));

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      const serverRow = await screen.findByText(/github \(mcp\.\.\.1234\)/);
      const agentRow = await screen.findByText(/support_agent \(age\.\.\.5678\)/);
      expect(screen.queryByText("No MCP servers, access groups, or toolsets configured")).not.toBeInTheDocument();
      expect(screen.queryByText("No agents or access groups configured")).not.toBeInTheDocument();

      await user.hover(serverRow);
      expect(
        await screen.findByText("Granted via access group platform-tools. Full ID: mcp-github-1234"),
      ).toBeInTheDocument();
      await user.hover(agentRow);
      expect(
        await screen.findByText("Granted via access group platform-tools. Full ID: agent-support-5678"),
      ).toBeInTheDocument();
    });

    it("keeps the all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs badge non-clickable", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["all-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"] }));

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      expect(await screen.findByText("Все proxy Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Все proxy Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" })).not.toBeInTheDocument();
    });

    it("should display loading state while fetching team data", () => {
      vi.mocked(networking.teamInfoCall).mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should display error message when team is not found", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение({
        team_id: "123",
        team_info: null as any,
        keys: [],
        team_memberships: [],
      });

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Team not found")).toBeInTheDocument();
      });
    });

    it("should display budget information in overview", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          max_budget: 1000,
          spend: 250.5,
          budget_duration: "30d",
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Бюджет Status")).toBeInTheDocument();
      });
      expect(screen.getByText("$250.50")).toBeInTheDocument();
      expect(screen.getByText(/of \$1,000\.00/)).toBeInTheDocument();
    });

    it("renders a tpm/rpm/budget limit of 0 as 0 in the overview and settings tabs, never as Без ограничений or No Limit", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          tpm_limit: 0,
          rpm_limit: 0,
          team_member_budget_table: { max_budget: 0, budget_duration: null, tpm_limit: 0, rpm_limit: 0 },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      const overview = await screen.findByRole("tabpanel", { name: "Обзор" });
      expect(within(overview).getByText("TPM: 0")).toBeInTheDocument();
      expect(within(overview).getByText("RPM: 0")).toBeInTheDocument();

      await userEvent.setup({ delay: null }).click(screen.getByRole("tab", { name: "Settings" }));
      const settings = await screen.findByRole("tabpanel", { name: "Settings" });
      expect(within(settings).getByText("TPM: 0")).toBeInTheDocument();
      expect(within(settings).getByText("RPM: 0")).toBeInTheDocument();
      expect(within(settings).getByText("Лимит TPM: 0")).toBeInTheDocument();
      expect(within(settings).getByText("Лимит RPM: 0")).toBeInTheDocument();
      expect(within(settings).getByText("Макс. бюджет: 0")).toBeInTheDocument();
      expect(screen.queryByText("TPM: Без ограничений")).not.toBeInTheDocument();
      expect(screen.queryByText("RPM: Без ограничений")).not.toBeInTheDocument();
      expect(screen.queryByText("Лимит TPM: No Limit")).not.toBeInTheDocument();
      expect(screen.queryByText("Лимит RPM: No Limit")).not.toBeInTheDocument();
    });

    it("should display гардрейловs in overview when present", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: { гардрейловs: ["гардрейлов1", "гардрейлов2"] },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Настройки гардрейлов")).toBeInTheDocument();
      });
      expect(screen.getByText("гардрейлов1")).toBeInTheDocument();
      expect(screen.getByText("гардрейлов2")).toBeInTheDocument();
    });

    it("should display policies in overview when present", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          policies: ["policy1"],
        }),
      );
      vi.mocked(networking.getPolicyInfoWithГардрейлы).mockResolvedЗначение({
        resolved_guardrails: ["гардрейлов1"],
      });

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Policies")).toBeInTheDocument();
      });
    });

    it("should display team member budget information when present", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          team_member_budget_table: {
            max_budget: 500,
            budget_duration: "30d",
            tpm_limit: 5000,
            rpm_limit: 50,
          },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Бюджет Status")).toBeInTheDocument();
      });
      expect(screen.getByText("Team Member Бюджет: $500.00")).toBeInTheDocument();
    });

    it("should display virtual keys information", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение({
        ...createMockTeamData(),
        keys: [{ user_id: "user1", token: "key1" }, { token: "key2" }],
      });

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Виртуальный ключs" })).toBeInTheDocument();
      });
    });

    it("should display object permissions when present", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          object_permission: {
            object_permission_id: "perm-1",
            mcp_servers: ["server1"],
            vector_stores: ["store1"],
          },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });
    });

    it("should open Settings tab by default when editTeam is true and user can edit", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} editTeam={true} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Team Settings")).toBeInTheDocument();
    });

    it("should open Обзор tab by default when editTeam is false", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} editTeam={false} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Бюджет Status")).toBeInTheDocument();
    });

    it("should open Обзор tab by default when editTeam is true but user cannot edit", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(
        <TeamInfoView {...defaultProps} editTeam={true} is_team_admin={false} is_proxy_admin={false} />,
      );

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Бюджет Status")).toBeInTheDocument();
    });
  });

  describe("tabs and navigation", () => {
    it("should show members tab when user can edit team", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "участников" })).toBeInTheDocument();
      });
    });

    it("should not show members tab when user cannot edit team", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} is_team_admin={false} is_proxy_admin={false} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryByRole("tab", { name: "участников" })).not.toBeInTheDocument();
    });

    it("should show settings tab when user can edit team", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Settings" })).toBeInTheDocument();
      });
    });

    it("shows edit tabs when the fetched team data marks the session user as team admin, even withвыход the is_team_admin prop", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          members_with_roles: [
            {
              user_id: "user-1",
              user_email: "admin@test.com",
              role: "admin",
              spend: 0,
              budget_id: "budget1",
            },
          ],
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} is_team_admin={false} is_proxy_admin={false} />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Settings" })).toBeInTheDocument();
      });
      expect(screen.getByRole("tab", { name: "участников" })).toBeInTheDocument();
    });

    it("should navigate to settings tab when clicked", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText("Team Settings")).toBeInTheDocument();
      });
    });

    it("should call onClose when back button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const backButton = screen.getByRole("button", { name: /back to teams/i });
      await user.click(backButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should copy team ID to clipboard when copy button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const copyButtons = screen.getAllByRole("button");
      const copyButton = copyButtons.find((btn) => btn.querySelector("svg"));
      expect(copyButton).toBeTruthy();

      if (copyButton) {
        await user.click(copyButton);
      }
    });

    it("should show Виртуальный ключs tab when user cannot edit team", async () => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} is_team_admin={false} is_proxy_admin={false} />);

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: "Виртуальный ключs" })).toBeInTheDocument();
      });
    });

    it("should display X участников in Виртуальный ключs tab when navigated to", async () => {
      const user = userEvent.setup();
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());
      const fiveКлючи = Array.from({ length: 5 }, (_, i) => ({
        token: `sk-${i}`,
        token_id: `key-${i}`,
        key_alias: `key_${i}`,
        key_name: `sk-...${i}`,
        user_id: `user-${i}`,
        organization_id: null,
        user: { user_id: `user-${i}`, user_email: `user${i}@test.com` },
        created_at: "2024-01-01T00:00:00Z",
        team_id: "123",
        spend: 0,
        max_budget: 100,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      }));
      mockUseКлючи.mockReturnЗначение({
        data: { keys: fiveКлючи, total_count: 5, current_page: 1, total_pages: 1 },
        isPending: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const virtualKeysTab = screen.getByRole("tab", { name: "Виртуальный ключs" });
      await user.click(virtualKeysTab);

      await waitFor(() => {
        expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-5 of 5");
      });
    });

    it("should show Фильтры and pagination controls in Виртуальный ключs tab", async () => {
      const user = userEvent.setup();
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());
      mockUseКлючи.mockReturnЗначение({
        data: {
          keys: [
            {
              token: "sk-1",
              token_id: "key-1",
              key_alias: "key1",
              key_name: "sk-...1",
              user_id: "user-1",
              organization_id: null,
              user: { user_id: "user-1", user_email: "user1@test.com" },
              created_at: "2024-01-01T00:00:00Z",
              team_id: "123",
              spend: 0,
              max_budget: 100,
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
            },
          ],
          total_count: 1,
          current_page: 1,
          total_pages: 1,
        },
        isPending: false,
        isFetching: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const virtualKeysTab = screen.getByRole("tab", { name: "Виртуальный ключs" });
      await user.click(virtualKeysTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Фильтры" })).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
      expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-1 of 1");
      expect(screen.getByTestId("pagination-prev")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-next")).toBeInTheDocument();
    });
  });

  describe("settings and editing", () => {
    const policiesFormFieldLabel = () => screen.queryByText("Policies", { selector: "label" });

    it("should offer the policies field and load it for a caller with the viewPolicies capability", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(networking.getPoliciesList).toHaveBeenCalled();
      });
      expect(can).toHaveBeenCalledWith("viewPolicies");

      await user.click(screen.getByRole("tab", { name: "Settings" }));
      await user.click(await screen.findByRole("button", { name: /edit settings/i }));

      await waitFor(() => {
        expect(policiesFormFieldLabel()).toBeInTheDocument();
      });
    });

    it("should omit the policies field and skip the admin-only list withвыход the capability", async () => {
      can.mockReturnЗначение(false);
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await user.click(await screen.findByRole("tab", { name: "Settings" }));
      await user.click(await screen.findByRole("button", { name: /edit settings/i }));

      expect(await screen.findByLabelText("Название команды")).toBeInTheDocument();

      expect(networking.getPoliciesList).not.toHaveBeenCalled();
      expect(policiesFormFieldLabel()).not.toBeInTheDocument();
    });

    it("should open edit mode when edit button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Название команды")).toBeInTheDocument();
      });
    });

    it("should close edit mode when cancel button is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Название команды")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByLabelText("Название команды")).not.toBeInTheDocument();
      });
    });

    it("should disable secret manager settings for non-premium users", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: {
            secret_manager_settings: { provider: "aws", secret_id: "abc" },
          },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} premiumUser={false} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      await user.click(editButton);

      const secretПоле = await screen.findByPlaceholderText(
        '{"namespace": "admin", "mount": "secret", "path_prefix": "litellm"}',
      );
      expect(secretПоле).toBeDisabled();
    });

    it("should allow premium users to edit secret manager settings", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: {
            secret_manager_settings: { provider: "aws", secret_id: "abc" },
          },
        }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} premiumUser={true} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      await user.click(editButton);

      const secretПоле = await screen.findByPlaceholderText(
        '{"namespace": "admin", "mount": "secret", "path_prefix": "litellm"}',
      );
      expect(secretПоле).toBeEnabled();
    });

    it("should add team member when form is submitted", async () => {
      const user = userEvent.setup({ delay: null });
      const onUpdate = vi.fn();
      const teamData = createMockTeamData();
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(teamData);
      vi.mocked(networking.teamMemberAddCall).mockResolvedЗначение({} as any);

      renderWithProviders(<TeamInfoView {...defaultProps} onUpdate={onUpdate} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const membersTab = screen.getByRole("tab", { name: "участников" });
      await user.click(membersTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add member/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /add member/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(networking.teamMemberAddCall).toHaveBeenCalled();
      });
    });

    it("should display soft budget in settings view when present", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          soft_budget: 500.75,
          max_budget: 1000,
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText("Team Settings")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Soft Бюджет:/)).toBeInTheDocument();
        expect(screen.getByText(/\$500\.75/)).toBeInTheDocument();
      });
    });

    it("should display soft budget alerting emails in settings view when present", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: {
            soft_budget_alerting_emails: ["alert1@test.com", "alert2@test.com"],
          },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText("Team Settings")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Soft Бюджет Alerting Emails:/)).toBeInTheDocument();
        expect(screen.getByText(/alert1@test\.com, alert2@test\.com/)).toBeInTheDocument();
      });
    });

    it("should pass access_group_ids to teamUpdateCall when saving team settings", async () => {
      const user = userEvent.setup({ delay: null });
      const accessGroupIds = ["ag-1", "ag-2"];
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          access_group_ids: accessGroupIds,
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      const settingsTab = screen.getByRole("tab", { name: "Settings" });
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      const editButton = screen.getByRole("button", { name: /edit settings/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Название команды")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalledWith(
          "test-token",
          expect.objectContaining({
            access_group_ids: accessGroupIds,
            team_id: "123",
          }),
        );
      });
    });

    const openSettingsEditorForTeam = async (
      user: ReturnType<typeof userEvent.setup>,
      teamOverrides: Record<string, unknown>,
    ) => {
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData(teamOverrides));
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /edit settings/i }));
      await waitFor(() => {
        expect(screen.getByLabelText("Название команды")).toBeInTheDocument();
      });

      return screen.getByLabelText("Сбросить бюджет");
    };

    it("should send an explicit null budget_duration when a stored Сбросить бюджет is cleared", async () => {
      const user = userEvent.setup({ delay: null });
      const resetБюджетВыбрать = await openSettingsEditorForTeam(user, { budget_duration: "30d" });

      await chooseSelectOption(user, resetБюджетВыбрать, "Never resets");

      await waitFor(() => {
        expect(resetБюджетВыбрать).toHaveTextContent("Never resets");
      });

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      const updateArg = vi.mocked(networking.teamUpdateCall).mock.calls[0][1];
      expect(updateArg.budget_duration).toBeNull();
      expect(JSON.stringify(updateArg)).toContain('"budget_duration":null');
    });

    it("should keep a stored Сбросить бюджет when the form is saved untouched", async () => {
      const user = userEvent.setup({ delay: null });
      await openSettingsEditorForTeam(user, { budget_duration: "30d" });

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      expect(vi.mocked(networking.teamUpdateCall).mock.calls[0][1].budget_duration).toBe("30d");
    });

    it("should send the newly picked budget_duration when one is selected", async () => {
      const user = userEvent.setup({ delay: null });
      const resetБюджетВыбрать = await openSettingsEditorForTeam(user, { budget_duration: null });

      await chooseSelectOption(user, resetБюджетВыбрать, "weekly");

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      expect(vi.mocked(networking.teamUpdateCall).mock.calls[0][1].budget_duration).toBe("7d");
    });
  });

  describe("metadata key-value editing", () => {
    const openSettingsEditor = async (user: ReturnType<typeof userEvent.setup>) => {
      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /edit settings/i }));

      await waitFor(() => {
        expect(screen.getByLabelText("Название команды")).toBeInTheDocument();
      });
    };

    it("should preserve metadata types and hide managed keys", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: {
            department: "research",
            tier: 3,
            beta: true,
            config: { region: "us" },
            logging: [{ callback_name: "langfuse", callback_type: "success", callback_vars: {} }],
            гардрейловs: ["g1"],
            disable_global_guardrails: false,
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: { "gpt-4": 100 },
          },
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);
      await openSettingsEditor(user);

      const keyValues = screen.getAllByPlaceholderText("Ключ").map((input) => (input as HTMLInElement).value);
      expect(keyValues).toEqual(["department", "tier", "beta", "config"]);
      const valueValues = screen.getAllByPlaceholderText("Значение").map((input) => (input as HTMLInElement).value);
      expect(valueValues).toEqual(["research", "3", "true", '{"region":"us"}']);

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      const updateArg = vi.mocked(networking.teamUpdateCall).mock.calls[0][1];
      expect(updateArg.metadata).toMatchObject({
        department: "research",
        tier: 3,
        beta: true,
        config: { region: "us" },
        logging: [{ callback_name: "langfuse", callback_type: "success", callback_vars: {} }],
      });
      expect(updateArg.metadata).not.toHaveСвойство("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit");
      expect(updateArg.model_tpm_limit).toEqual({ "gpt-4": 100 });
    });

    it("prefills the estimated выходput token controls, hides them from the pair editor, and saves edits", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: {
            department: "research",
            default_estimated_output_tokens: 512,
            default_estimated_output_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: { "gpt-4": 4096 },
          },
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);
      await openSettingsEditor(user);

      expect(screen.getByLabelText("Estimated Выход Токенs")).toHaveЗначение(512);
      expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toHaveЗначение('{"gpt-4":4096}');
      const keyValues = screen.queryAllByPlaceholderText("Ключ").map((input) => (input as HTMLInElement).value);
      expect(keyValues).toEqual(["department"]);

      fireEvent.change(screen.getByLabelText("Estimated Выход Токенs"), { target: { value: "999" } });

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      const updateArg = vi.mocked(networking.teamUpdateCall).mock.calls[0][1];
      expect(updateArg.metadata.default_estimated_output_tokens).toBe(999);
      expect(updateArg.metadata.default_estimated_output_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toEqual({ "gpt-4": 4096 });
    });

    it("omits the estimated выходput token settings when both controls are blank", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"] }));
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);
      await openSettingsEditor(user);

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      const updateArg = vi.mocked(networking.teamUpdateCall).mock.calls[0][1];
      expect(updateArg.metadata).not.toHaveСвойство("default_estimated_output_tokens");
      expect(updateArg.metadata).not.toHaveСвойство("default_estimated_output_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
    });

    it.each(["Internal User", "Admin Viewer", "org_admin"])(
      "leaves both estimate controls read-only for %s and still resubmits the stored values",
      async (userRole) => {
        authState.userRole = userRole;
        const user = userEvent.setup({ delay: null });
        vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
          createMockTeamData({
            metadata: {
              default_estimated_output_tokens: 512,
              default_estimated_output_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: { "gpt-4": 4096 },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
          }),
        );
        vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

        renderWithProviders(<TeamInfoView {...defaultProps} />);
        await openSettingsEditor(user);

        expect(screen.getByLabelText("Estimated Выход Токенs")).toBeDisabled();
        expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toBeDisabled();

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
          expect(networking.teamUpdateCall).toHaveBeenCalled();
        });

        const updateArg = vi.mocked(networking.teamUpdateCall).mock.calls[0][1];
        expect(updateArg.metadata.default_estimated_output_tokens).toBe(512);
        expect(updateArg.metadata.default_estimated_output_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toEqual({ "gpt-4": 4096 });
      },
    );

    it.each(["Admin", "proxy_admin"])("leaves both estimate controls editable for %s", async (userRole) => {
      authState.userRole = userRole;
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"] }));

      renderWithProviders(<TeamInfoView {...defaultProps} />);
      await openSettingsEditor(user);

      expect(screen.getByLabelText("Estimated Выход Токенs")).toBeEnabled();
      expect(screen.getByLabelText("Estimated Выход Токенs Per Режимl")).toBeEnabled();
    });

    it("should keep declared keys as ordinary prefilled rows and submit the edited value", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(useTeamMetadataSchema).mockReturnЗначение({
        data: [
          { key: "cost_center", label: "Стоимость Center" },
          { key: "app_name", label: "Приложениеlication Name" },
        ],
        isLoading: false,
      } as any);
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: { cost_center: "CC-OLD", department: "research" },
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);
      await openSettingsEditor(user);

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText("Ключ").map((input) => (input as HTMLInElement).value)).toEqual([
          "cost_center",
          "department",
          "app_name",
        ]);
      });
      expect(screen.getAllByPlaceholderText("Значение")[0]).toHaveЗначение("CC-OLD");

      await user.clear(screen.getAllByPlaceholderText("Значение")[0]);
      fireEvent.change(screen.getAllByPlaceholderText("Значение")[0], { target: { value: "CC-NEW" } });
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      expect(vi.mocked(networking.teamUpdateCall).mock.calls[0][1].metadata).toMatchObject({
        cost_center: "CC-NEW",
        department: "research",
        app_name: "",
      });
    });
  });

  describe("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию aliases", () => {
    const openSettingsEditor = async (user: ReturnType<typeof userEvent.setup>) => {
      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /edit settings/i }));

      await waitFor(() => {
        expect(screen.getByLabelText("Название команды")).toBeInTheDocument();
      });
    };

    it("should render existing Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию aliases in the read-only settings view", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          litellm_model_table: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases: { "my-smart-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": "gpt-4", "my-fast-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": "gpt-3.5-turbo" } },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByText("Team Settings")).toBeInTheDocument();
      });

      expect(screen.getByText("Режимl Aliases")).toBeInTheDocument();
      expect(screen.getByText("my-smart-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toBeInTheDocument();
      expect(screen.getByText("gpt-4")).toBeInTheDocument();
      expect(screen.getByText("my-fast-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toBeInTheDocument();
      expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();
    });

    it("should render the estimated выходput token settings in the overview and read-only settings views", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          metadata: {
            default_estimated_output_tokens: 512,
            default_estimated_output_tokens_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: { "gpt-4": 4096 },
          },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByText("Team Settings")).toBeInTheDocument();
      });

      expect(screen.getAllByText("Estimated Выход Токенs: 512")).toHaveLength(2);
      expect(screen.getAllByText('Estimated Выход Токенs Per Режимl: {"gpt-4":4096}')).toHaveLength(2);
    });

    it("should show an empty state when the team has no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию aliases", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ litellm_model_table: null }));

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByText("Team Settings")).toBeInTheDocument();
      });

      expect(screen.getByText("No Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию aliases configured")).toBeInTheDocument();
    });

    it("should seed the alias editor from existing team aliases", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
          litellm_model_table: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases: { "my-smart-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": "gpt-4" } },
        }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await openSettingsEditor(user);

      expect(screen.getByTestId("alias-editor-initial")).toHaveTextContent(
        JSON.stringify({ "my-smart-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": "gpt-4" }),
      );
    });

    it("should pass Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases to teamUpdateCall when aliases are added", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"] }));
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await openSettingsEditor(user);

      await user.click(screen.getByRole("button", { name: "Set Alias" }));
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalledWith(
          "test-token",
          expect.objectContaining({
            team_id: "123",
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases: { "gpt-4o": "gpt-4" },
          }),
        );
      });
    });

    it("should send an empty Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases map to clear existing aliases", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
          litellm_model_table: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases: { "my-smart-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": "gpt-4" } },
        }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await openSettingsEditor(user);

      await user.click(screen.getByRole("button", { name: "Clear Aliases" }));
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      const payload = vi.mocked(networking.teamUpdateCall).mock.calls[0][1] as Record<string, unknown>;
      expect(payload.model_aliases).toEqual({});
    });

    it("should not include Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases when the team has none and the editor is untouched", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], litellm_model_table: null }),
      );
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await openSettingsEditor(user);

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalled();
      });

      const payload = vi.mocked(networking.teamUpdateCall).mock.calls[0][1] as Record<string, unknown>;
      expect(payload).not.toHaveСвойство("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases");
    });
  });

  describe("team member settings", () => {
    it("should populate Default Ключ Длительность from the team's stored metadata", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
        createMockTeamData({ metadata: { team_member_key_duration: "30d" } }),
      );

      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /edit settings/i }));

      await user.click(await screen.findByRole("button", { name: /team member settings/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/^Default Ключ Длительность/)).toHaveЗначение("30d");
      });
    });
  });

  describe("гардрейловs dropdown grouping", () => {
    const гардрейлов = (name: string, defaultOn: boolean) => ({
      гардрейлов_name: name,
      litellm_params: { default_on: defaultOn },
    });

    const openGuardrailsDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
      renderWithProviders(<TeamInfoView {...defaultProps} />);

      await waitFor(() => {
        const teamNameElements = screen.queryAllByText("Test Team");
        expect(teamNameElements.length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /edit settings/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/^Гардрейлы/)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/^Гардрейлы/));

      const listbox = await screen.findByRole("listbox", {}, { timeвыход: 5000 });
      return listbox.closest('[data-slot="combobox-content"]') as HTMLElement;
    };

    beforeEach(() => {
      testRequestClient.clear();
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData());
    });

    it("should not render the Глобально or Other group headers when no global гардрейловs exist", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.getGuardrailsList).mockResolvedЗначение({
        гардрейловs: [гардрейлов("dwacxzcz", false), гардрейлов("dwadsa", false)],
      });

      const dropdown = await openGuardrailsDropdown(user);

      await waitFor(() => {
        expect(within(dropdown).getByTitle("dwacxzcz")).toBeInTheDocument();
      });
      expect(within(dropdown).getByTitle("dwadsa")).toBeInTheDocument();
      expect(within(dropdown).queryByText("Глобально")).not.toBeInTheDocument();
      expect(within(dropdown).queryByText("Other")).not.toBeInTheDocument();
    });

    it("should not render the Глобально or Other group headers when every гардрейлов is global", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.getGuardrailsList).mockResolvedЗначение({
        гардрейловs: [гардрейлов("always-on", true)],
      });

      const dropdown = await openGuardrailsDropdown(user);

      await waitFor(() => {
        expect(within(dropdown).getByTitle("always-on")).toBeInTheDocument();
      });
      expect(within(dropdown).queryByText("Глобально")).not.toBeInTheDocument();
      expect(within(dropdown).queryByText("Other")).not.toBeInTheDocument();
    });

    it("should render both group headers when global and non-global гардрейловs exist", async () => {
      const user = userEvent.setup({ delay: null });
      vi.mocked(networking.getGuardrailsList).mockResolvedЗначение({
        гардрейловs: [гардрейлов("always-on", true), гардрейлов("opt-in", false)],
      });

      const dropdown = await openGuardrailsDropdown(user);

      await waitFor(() => {
        expect(within(dropdown).getByText("Глобально")).toBeInTheDocument();
      });
      expect(within(dropdown).getByText("Other")).toBeInTheDocument();
      expect(within(dropdown).getByTitle("always-on")).toBeInTheDocument();
      expect(within(dropdown).getByTitle("opt-in")).toBeInTheDocument();
    });
  });

  describe("allowed pass through routes", () => {
    beforeEach(() => {
      testRequestClient.clear();
      vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"] }));
      vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);
      vi.mocked(networking.getPassThroughEndpointsCall).mockResolvedЗначение({
        endpoints: [{ path: "/bedrock-passthrough", methods: ["POST"] }],
      });
    });

    it("should show a route picked from the dropdown in the field and save it", async () => {
      const user = userEvent.setup({ delay: null });

      renderWithProviders(<TeamInfoView {...defaultProps} premiumUser={true} />);

      await waitFor(() => {
        expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0);
      });

      await user.click(screen.getByRole("tab", { name: "Settings" }));
      await user.click(await screen.findByRole("button", { name: /edit settings/i }));

      await user.click(await screen.findByRole("combobox", { name: "Выбрать pass through routes" }));

      const option = await screen.findByText("POST /bedrock-passthrough");
      await user.click(option);

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.getByText("POST /bedrock-passthrough")).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(networking.teamUpdateCall).toHaveBeenCalledWith(
          "test-token",
          expect.objectContaining({
            team_id: "123",
            metadata: expect.objectContaining({
              allowed_passthrough_routes: ["/bedrock-passthrough"],
            }),
          }),
        );
      });
    });
  });
});

describe("TeamInfoView - which team member fields reach the update payload depends on the open sections", () => {
  const props = {
    teamId: "123",
    onUpdate: vi.fn(),
    onClose: vi.fn(),
    accessТокен: "test-token",
    is_team_admin: true,
    is_proxy_admin: true,
    userModels: ["gpt-4"],
    editTeam: false,
  };

  beforeEach(seedDefaultMocks);

  afterEach(() => {
    vi.clearAllMocks();
  });

  const openEditor = async (
    user: ReturnType<typeof userEvent.setup>,
    teamMemberБюджетТаблица: TeamData["team_info"]["team_member_budget_table"] = {
      max_budget: 42,
      budget_duration: "30d",
      tpm_limit: 11,
      rpm_limit: 22,
    },
  ) => {
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({
        team_member_budget_table: teamMemberБюджетТаблица,
        default_team_member_models: ["gpt-4"],
      }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");
  };

  const save = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(networking.teamUpdateCall).toHaveBeenCalled());
    return vi.mocked(networking.teamUpdateCall).mock.calls[0][1] as Record<string, unknown>;
  };

  it("omits every stored team member field when Team Member Settings is left closed", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    const payload = await save(user);

    expect(payload.team_member_budget_duration).toBeUndefined();
    expect(payload).not.toHaveСвойство("team_member_budget");
    expect(payload).not.toHaveСвойство("team_member_tpm_limit");
    expect(payload).not.toHaveСвойство("team_member_rpm_limit");
    expect(payload).not.toHaveСвойство("default_team_member_models");

    const wireBody = JSON.parse(JSON.stringify(payload));
    expect(Object.keys(wireBody).filter((key) => key.startsWith("team_member"))).toEqual([]);
    expect(wireBody).not.toHaveСвойство("default_team_member_models");
  });

  it("resends every stored team member field once Team Member Settings is opened", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(screen.getByText("Team Member Settings"));
    await screen.findByLabelText("Default Бюджет (USD)");
    const payload = await save(user);

    expect(payload.team_member_budget_duration).toBe("30d");
    expect(payload.team_member_budget).toBe(42);
    expect(payload.team_member_tpm_limit).toBe(11);
    expect(payload.team_member_rpm_limit).toBe(22);
    expect(payload.default_team_member_models).toEqual(["gpt-4"]);
  });

  it("sends a null team_member_budget_duration when Default Бюджет Длительность is set to never reset", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(screen.getByText("Team Member Settings"));
    await screen.findByLabelText("Default Бюджет (USD)");
    await chooseSelectOption(user, screen.getByLabelText("Default Бюджет Длительность"), "Never resets");

    const payload = await save(user);

    expect(payload.team_member_budget_duration).toBeNull();
    expect(payload.team_member_budget).toBe(42);
    expect(JSON.stringify(payload)).toContain('"team_member_budget_duration":null');
  });

  it("shows Never resets for a stored member budget whose duration is null", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user, { max_budget: 42, budget_duration: null, tpm_limit: null, rpm_limit: null });

    await user.click(screen.getByText("Team Member Settings"));

    expect(await screen.findByLabelText("Default Бюджет Длительность")).toHaveTextContent("Never resets");
  });

  it("omits team_member_budget_duration when the dropdown is left untouched on a team with no member budget", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user, null);

    await user.click(screen.getByText("Team Member Settings"));
    const durationВыбрать = await screen.findByLabelText("Default Бюджет Длительность");
    expect(durationВыбрать).toHaveTextContent("Inherit team reset period");
    expect(durationВыбрать).not.toHaveTextContent("Never resets");
    await user.type(screen.getByLabelText("Default Бюджет (USD)"), "100");

    const payload = await save(user);

    expect(payload.team_member_budget).toBe(100);
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveСвойство("team_member_budget_duration");
  });

  it("omits object_permission.search_tools while Search Tool Settings is closed", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    const payload = await save(user);

    expect(payload.object_permission).not.toHaveСвойство("search_tools");
  });

  it("includes object_permission.search_tools once Search Tool Settings is opened", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(screen.getByText("Search Tool Settings"));
    await screen.findByPlaceholderText("Выбрать search tools (необязательно, empty = all allowed)");
    const payload = await save(user);

    expect(payload.object_permission).toHaveСвойство("search_tools");
  });
});

describe("TeamInfoView - the exact bytes the update call sends", () => {
  const props = {
    teamId: "123",
    onUpdate: vi.fn(),
    onClose: vi.fn(),
    accessТокен: "test-token",
    is_team_admin: true,
    is_proxy_admin: true,
    userModels: ["gpt-4"],
    editTeam: false,
  };

  beforeEach(seedDefaultMocks);

  afterEach(() => {
    vi.clearAllMocks();
  });

  const storedTeam = () =>
    createMockTeamData({
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      max_budget: 100,
      budget_duration: "1d",
      tpm_limit: 1000,
      rpm_limit: 1000,
      team_member_budget_table: { max_budget: 42, budget_duration: "30d", tpm_limit: 11, rpm_limit: 22 },
      default_team_member_models: ["gpt-4"],
      object_permission: { search_tools: ["tool-a"], vector_stores: ["vs-1"] },
    });

  const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(storedTeam());
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");
  };

  const save = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(networking.teamUpdateCall).toHaveBeenCalled());
    return vi.mocked(networking.teamUpdateCall).mock.calls[0][1] as Record<string, unknown>;
  };

  const wireBody = (payload: Record<string, unknown>) => JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

  const alwaysSent = {
    team_id: "123",
    team_alias: "Test Team",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
    tpm_limit: 1000,
    rpm_limit: 1000,
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: {},
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_rpm_limit: {},
    max_budget: 100,
    soft_budget: null,
    budget_duration: "1d",
    metadata: {
      allowed_passthrough_routes: [],
      гардрейловs: [],
      opted_out_global_guardrails: [],
      disable_global_guardrails: false,
      soft_budget_alerting_emails: [],
    },
    access_group_ids: [],
  };

  const mcpPermissions = {
    mcp_servers: [],
    mcp_access_groups: [],
    mcp_tool_permissions: {},
    mcp_toolsets: [],
    agents: [],
    agent_access_groups: [],
    vector_stores: ["vs-1"],
    skills: [],
  };

  it("leaves every team member key выход of the request body for an untouched save with both sections closed", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    const payload = await save(user);

    expect(payload).toStrictEqual({
      ...alwaysSent,
      team_member_budget_duration: undefined,
      object_permission: mcpPermissions,
    });
    expect(wireBody(payload)).toStrictEqual({
      ...alwaysSent,
      object_permission: mcpPermissions,
    });
  });

  const openEditorWithАгенты = async (user: ReturnType<typeof userEvent.setup>) => {
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        object_permission: { agents: ["agent-1"], agent_access_groups: ["group-a"] },
      }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");
  };

  it("resends the stored agents and agent_access_groups when the selector is left untouched", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditorWithАгенты(user);

    const payload = await save(user);

    const objectPermission = wireBody(payload).object_permission as Record<string, unknown>;
    expect(objectPermission.agents).toStrictEqual(["agent-1"]);
    expect(objectPermission.agent_access_groups).toStrictEqual(["group-a"]);
  });

  it("sends empty agents and agent_access_groups arrays after the last agent chip is removed", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditorWithАгенты(user);

    await user.click(within(screen.getByLabelText("agent-1")).getByRole("button"));
    await user.click(within(screen.getByLabelText("group:group-a")).getByRole("button"));
    expect(screen.queryByLabelText("agent-1")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("group:group-a")).not.toBeInTheDocument();

    const payload = await save(user);

    const objectPermission = wireBody(payload).object_permission as Record<string, unknown>;
    expect(objectPermission.agents).toStrictEqual([]);
    expect(objectPermission.agent_access_groups).toStrictEqual([]);
  });

  it("resends the stored skills when the selector is left untouched", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], object_permission: { skills: ["private-skill"] } }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");

    const payload = await save(user);

    const objectPermission = wireBody(payload).object_permission as Record<string, unknown>;
    expect(objectPermission.skills).toStrictEqual(["private-skill"]);
  });

  it("sends an empty skills array after the last skill chip is removed", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], object_permission: { skills: ["private-skill"] } }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");

    await user.click(within(screen.getByLabelText("private-skill")).getByRole("button"));
    expect(screen.queryByLabelText("private-skill")).not.toBeInTheDocument();

    const payload = await save(user);

    const objectPermission = wireBody(payload).object_permission as Record<string, unknown>;
    expect(objectPermission.skills).toStrictEqual([]);
  });

  it("sends an empty vector_stores array after the last vector store chip is removed", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(within(screen.getByLabelText("vs-1")).getByRole("button"));
    expect(screen.queryByLabelText("vs-1")).not.toBeInTheDocument();

    const payload = await save(user);

    const objectPermission = wireBody(payload).object_permission as Record<string, unknown>;
    expect(objectPermission.vector_stores).toStrictEqual([]);
  });

  it("resends every stored value once both sections are opened", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(screen.getByText("Team Member Settings"));
    await screen.findByLabelText("Default Бюджет (USD)");
    await user.click(screen.getByText("Search Tool Settings"));
    await screen.findByPlaceholderText("Выбрать search tools (необязательно, empty = all allowed)");

    const payload = await save(user);

    const expected = {
      ...alwaysSent,
      team_member_budget_duration: "30d",
      team_member_budget: 42,
      team_member_tpm_limit: 11,
      team_member_rpm_limit: 22,
      default_team_member_models: ["gpt-4"],
      object_permission: { ...mcpPermissions, search_tools: ["tool-a"] },
    };
    expect(payload).toStrictEqual(expected);
    expect(wireBody(payload)).toStrictEqual(expected);
  });

  it("carries every typed value to the update payload at the type and shape antd sends today", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    const alias = screen.getByLabelText("Название команды");
    await user.clear(alias);
    await user.type(alias, "Renamed Team");

    const softБюджет = screen.getByLabelText("Soft Бюджет (USD)");
    await user.clear(softБюджет);
    await user.type(softБюджет, "9.5");

    const emails = screen.getByLabelText(/Soft Бюджет Alerting Emails/);
    await user.clear(emails);
    await user.type(emails, "a@test.com,  b@test.com ");

    const tpm = screen.getByLabelText("Лимит токенов в минуту (TPM)");
    await user.clear(tpm);
    await user.type(tpm, "555");

    const payload = await save(user);

    expect(payload.team_alias).toBe("Renamed Team");
    expect(payload.soft_budget).toBe("9.5");
    expect(payload.tpm_limit).toBe("555");
    expect((payload.metadata as Record<string, unknown>).soft_budget_alerting_emails).toStrictEqual([
      "a@test.com",
      "b@test.com",
    ]);
  });

  it("builds Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_rpm_limit from the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-specific rate limit rows", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        max_budget: 100,
        budget_duration: "1d",
        tpm_limit: 1000,
        rpm_limit: 1000,
        object_permission: { vector_stores: ["vs-1"] },
        metadata: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: { "gpt-4": 30 }, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_rpm_limit: { "gpt-4": 40 } },
      }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");

    const payload = await save(user);

    expect(payload.model_tpm_limit).toStrictEqual({ "gpt-4": 30 });
    expect(payload.model_rpm_limit).toStrictEqual({ "gpt-4": 40 });
  });

  it("keeps a team member budget edited before the section is collapsed and resends it on reopen", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(screen.getByText("Team Member Settings"));
    const budgetВход = await screen.findByLabelText("Default Бюджет (USD)");
    await user.clear(budgetВход);
    await user.type(budgetВход, "77");

    await user.click(screen.getByText("Team Member Settings"));
    await waitFor(() => expect(screen.queryByLabelText("Default Бюджет (USD)")).not.toBeInTheDocument());

    await user.click(screen.getByText("Team Member Settings"));
    expect(await screen.findByLabelText("Default Бюджет (USD)")).toHaveЗначение(77);

    const payload = await save(user);
    expect(payload.team_member_budget).toBe(77);
  });

  it("sends no team member key at all when the section is collapsed again after an edit", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.click(screen.getByText("Team Member Settings"));
    const budgetВход = await screen.findByLabelText("Default Бюджет (USD)");
    await user.clear(budgetВход);
    await user.type(budgetВход, "77");

    await user.click(screen.getByText("Team Member Settings"));
    await waitFor(() => expect(screen.queryByLabelText("Default Бюджет (USD)")).not.toBeInTheDocument());

    const payload = await save(user);

    expect(Object.keys(wireBody(payload)).filter((key) => key.startsWith("team_member"))).toEqual([]);
    expect(wireBody(payload)).not.toHaveСвойство("default_team_member_models");
  });

  it("puts the global гардрейловs back on the team when the kill switch is turned off again", async () => {
    const user = userEvent.setup({ delay: null });
    testRequestClient.clear();
    vi.mocked(networking.getGuardrailsList).mockResolvedЗначение({
      гардрейловs: [
        { гардрейлов_name: "always-on", litellm_params: { default_on: true } },
        { гардрейлов_name: "opt-in", litellm_params: { default_on: false } },
      ],
    });
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        metadata: { гардрейловs: ["opt-in"], disable_global_guardrails: true },
      }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} premiumUser={true} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");

    expect(screen.queryAllByLabelText("always-on")).toHaveLength(0);

    await user.click(screen.getByRole("switch", { name: /Disable all global гардрейловs/ }));

    expect(await screen.findAllByLabelText("always-on")).toHaveLength(1);

    const payload = await save(user);

    expect(payload.metadata).toStrictEqual(
      expect.objectContaining({
        гардрейловs: ["opt-in"],
        opted_out_global_guardrails: [],
        disable_global_guardrails: false,
      }),
    );
  });

  it("sends a typed Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию rate limit as a number", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], metadata: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: { "gpt-4": 30 } } }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");

    const rpmВход = await screen.findByPlaceholderText("Лимит RPM");
    await user.clear(rpmВход);
    await user.type(rpmВход, "45");

    const payload = await save(user);

    expect(payload.model_rpm_limit).toStrictEqual({ "gpt-4": 45 });
    expect(payload.model_tpm_limit).toStrictEqual({ "gpt-4": 30 });
  });

  it("leaves stored policies выход of the update body for a caller withвыход the viewPolicies capability", async () => {
    const user = userEvent.setup({ delay: null });
    can.mockReturnЗначение(false);
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(createMockTeamData({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], policies: ["pci"] }));
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(<TeamInfoView {...props} />);
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");

    const payload = await save(user);

    expect(payload).toHaveСвойство("team_alias");
    expect(wireBody(payload)).not.toHaveСвойство("policies");
  });

  it("blocks the save on an empty team name and names the rule", async () => {
    const user = userEvent.setup({ delay: null });
    await openEditor(user);

    await user.clear(screen.getByLabelText("Название команды"));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Please input a team name")).toBeInTheDocument();
    expect(networking.teamUpdateCall).not.toHaveBeenCalled();
  });
});

describe("TeamInfo MCP permission retention", () => {
  beforeEach(seedDefaultMocks);

  afterEach(() => {
    vi.clearAllMocks();
  });

  const server = (serverId: string, serverName: string, alias?: string): MCPСервер =>
    ({
      server_id: serverId,
      server_name: serverName,
      alias,
      mcp_access_groups: [],
      created_at: "",
      created_by: "",
      updated_at: "",
      updated_by: "",
    }) as MCPСервер;

  const effective = (serverId: string, kind: EffectiveMcpСервер["source"]["kind"]): EffectiveMcpСервер =>
    ({
      server: server(serverId, serverId),
      permissionКлюч: serverId,
      supersededКлючи: [],
      ambiguousКлючи: [],
      keyedИнструменты: undefined,
      toolsetИнструменты: undefined,
      allowedИнструменты: undefined,
      source: kind === "accessGroup" ? { kind, name: "ops_readonly" } : { kind },
    }) as EffectiveMcpСервер;

  const UNIFIED_SERVER = server("unified-server", "wiki");
  const UNIFIED_GROUPS = [
    { access_group_id: "ag-1", access_group_name: "Group 1", access_mcp_server_ids: ["unified-server"] },
    { access_group_id: "ag-2", access_group_name: "Group 2", access_mcp_server_ids: [] },
  ];

  const unifiedTeam = (toolPermissions: Record<string, string[]>, serverIds: string[] = []) => {
    const teamData = {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
      access_group_ids: ["ag-1", "ag-2"],
      access_group_mcp_server_ids: serverIds,
      object_permission: {
        mcp_servers: [],
        mcp_access_groups: [],
        mcp_toolsets: [],
        mcp_tool_permissions: toolPermissions,
      },
    };
    return createMockTeamData(teamData);
  };

  const renderMcpEditor = async (
    user: ReturnType<typeof userEvent.setup>,
    {
      initialTeam = unifiedTeam({ wiki: ["read_page"] }, ["unified-server"]),
      freshTeam = initialTeam,
      accessGroups = [],
    }: {
      initialTeam?: ReturnType<typeof createMockTeamData>;
      freshTeam?: ReturnType<typeof createMockTeamData>;
      accessGroups?: typeof UNIFIED_GROUPS;
    } = {},
  ) => {
    mockUseMCP-серверы.mockReturnЗначение({ data: [UNIFIED_SERVER], isLoading: false, isОшибка: false } as any);
    mockUseMCPToolsets.mockReturnЗначение({ data: [], isLoading: false, isОшибка: false } as any);
    mockUseAccessGroups.mockReturnЗначение({ data: accessGroups, isLoading: false, isОшибка: false } as any);
    vi.mocked(networking.teamInfoCall).mockResolvedValueOnce(initialTeam).mockResolvedЗначение(freshTeam);
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(
      <TeamInfoView
        teamId="123"
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        accessТокен="test-token"
        is_team_admin
        is_proxy_admin
        userModels={["gpt-4"]}
        editTeam={false}
      />,
    );
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await screen.findByLabelText("Название команды");
  };

  const saveMcpEditor = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(networking.teamUpdateCall).toHaveBeenCalled());
    const calls = vi.mocked(networking.teamUpdateCall).mock.calls;
    const [, payload] = calls[calls.length - 1];
    return payload.object_permission.mcp_tool_permissions;
  };

  const refuseMcpSave = async (user: ReturnType<typeof userEvent.setup>, reason: RegExp) => {
    const errorToast = vi.spyOn(toast, "fromОшибка").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(errorToast).toHaveBeenCalledWith(expect.stringMatching(reason)));
    expect(networking.teamUpdateCall).not.toHaveBeenCalled();
    errorToast.mockRestore();
  };

  const resolveGrants = (overrides: Partial<McpGrantВход>) => {
    const input: McpGrantВход = {
      effective-серверы: [effective("server-1", "direct")],
      selectedAccessGroupIds: ["ag-1"],
      accessGroups: [],
      standingServerIds: new Set(),
      loadTeamGroups: vi.fn(),
      ...overrides,
    };
    return grantedMcpServerIds(input);
  };

  it("retains permissions for directly and indirectly granted servers", async () => {
    const resolution = await resolveGrants({
      effective-серверы: [effective("direct", "direct"), effective("inherited", "toolPermission")],
      accessGroups: [{ access_group_id: "ag-1", access_mcp_server_ids: ["inherited"] }],
    });
    expect(resolution.kind).toBe("resolved");
    if (resolution.kind !== "resolved") return;

    expect(
      retainedMcpToolPermissions(
        { direct: ["create_issue"], inherited: ["list_issues"], removed: ["delete_repo"] },
        resolution.serverIds,
        [server("direct", "deploy_tracker"), server("inherited", "issue_tracker"), server("removed", "old_tracker")],
      ),
    ).toEqual({
      direct: ["create_issue"],
      inherited: ["list_issues"],
    });
  });

  it("matches name and alias permission keys to granted server ids", () => {
    const catalog = [server("server-1", "issue_tracker", "issues")];

    expect(
      retainedMcpToolPermissions(
        { issue_tracker: ["list_issues"], issues: ["create_issue"] },
        new Set(["server-1"]),
        catalog,
      ),
    ).toEqual({
      issue_tracker: ["list_issues"],
      issues: ["create_issue"],
    });
  });

  it("does not reload the team when the access group list covers the selection", async () => {
    const loadTeamGroups = vi.fn();
    await expect(
      resolveGrants({
        accessGroups: [{ access_group_id: "ag-1", access_mcp_server_ids: ["group-server"] }],
        loadTeamGroups,
      }),
    ).resolves.toEqual({
      kind: "resolved",
      serverIds: new Set(["server-1", "group-server"]),
    });
    expect(loadTeamGroups).not.toHaveBeenCalled();
  });

  it("falls back to the team's loaded access group servers when the list is unavailable and the selection is unchanged", async () => {
    expect(
      await resolveGrants({
        loadTeamGroups: vi.fn().mockResolvedЗначение({ ids: ["ag-1"], serverIds: ["group-server"] }),
      }),
    ).toEqual({
      kind: "resolved",
      serverIds: new Set(["server-1", "group-server"]),
    });
  });

  it("adds standing tool-permission grants to the reloaded team grants", async () => {
    expect(
      await resolveGrants({
        effective-серверы: [effective("server-1", "direct"), effective("standing", "toolPermission")],
        standingServerIds: new Set(["standing"]),
        loadTeamGroups: vi.fn().mockResolvedЗначение({ ids: ["ag-1"], serverIds: ["group-server"] }),
      }),
    ).toEqual({
      kind: "resolved",
      serverIds: new Set(["server-1", "group-server", "standing"]),
    });
  });

  it("is unresolvable when the list is unavailable and the selection changed", async () => {
    expect(
      await resolveGrants({
        loadTeamGroups: vi.fn().mockResolvedЗначение({ ids: ["ag-1", "ag-2"], serverIds: ["group-server"] }),
      }),
    ).toEqual({
      kind: "unresolvable",
      reason: expect.stringMatching(/access groups could not be loaded/),
    });
  });

  it("is unresolvable when the team reload fails", async () => {
    expect(await resolveGrants({ loadTeamGroups: vi.fn().mockRejectedЗначение(new Ошибка("boom")) })).toEqual({
      kind: "unresolvable",
      reason: expect.stringMatching(/access groups could not be reloaded/),
    });
  });

  it("refuses an unresolved selected access group", async () => {
    expect(
      await resolveGrants({
        selectedAccessGroupIds: ["missing"],
        loadTeamGroups: vi.fn().mockResolvedЗначение({ ids: [], serverIds: [] }),
      }),
    ).toEqual({
      kind: "unresolvable",
      reason: expect.stringMatching(/access groups could not be loaded/),
    });
  });

  it("retains an unknown permission key so an inventory refresh cannot erase it", () => {
    expect(retainedMcpToolPermissions({ "not-yet-loaded": ["read"] }, new Set(), [])).toEqual({
      "not-yet-loaded": ["read"],
    });
  });

  it("splits an ambiguous permission across the matching granted server", () => {
    const catalog = [server("server-1", "shared"), server("server-2", "shared")];

    expect(
      retainedMcpToolPermissions({ shared: ["read"], "server-1": ["write"] }, new Set(["server-1"]), catalog),
    ).toEqual({
      "server-1": ["write", "read"],
    });
  });

  it("keeps an ambiguous permission when all matching servers remain granted", () => {
    const catalog = [server("server-1", "shared"), server("server-2", "shared")];

    expect(retainedMcpToolPermissions({ shared: ["read"] }, new Set(["server-1", "server-2"]), catalog)).toEqual({
      shared: ["read"],
    });
  });

  it("keeps the group server allowlist when the access group list is unavailable and the selection is unchanged", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user);

    await user.clear(screen.getByLabelText("Название команды"));
    await user.type(screen.getByLabelText("Название команды"), "Renamed Team");

    expect(await saveMcpEditor(user)).toEqual({ wiki: ["read_page"] });
  });

  it("refuses a save when the access group list is unavailable and the selection changed", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user);

    await user.click(screen.getByRole("button", { name: "remove first unified access group" }));
    await refuseMcpSave(user, /access groups could not be loaded/);
  });

  it("keeps the group server allowlist when a selected access group is missing from the list", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user, {
      accessGroups: [UNIFIED_GROUPS[1]],
      initialTeam: unifiedTeam({ wiki: ["read_page"] }, ["unified-server"]),
    });

    expect(await saveMcpEditor(user)).toEqual({ wiki: ["read_page"] });
  });

  it("uses current group grants when a server was revoked after the page loaded", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user, {
      initialTeam: unifiedTeam({ wiki: ["read_page"] }, ["unified-server"]),
      freshTeam: unifiedTeam({ wiki: ["read_page"] }),
    });

    expect(await saveMcpEditor(user)).toEqual({});
  });

  it("uses current group grants when a server was granted after the page loaded", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user, {
      initialTeam: unifiedTeam({ wiki: ["read_page"] }),
      freshTeam: unifiedTeam({ wiki: ["read_page"] }, ["unified-server"]),
    });

    expect(await saveMcpEditor(user)).toEqual({ wiki: ["read_page"] });
  });

  it("keeps a standing allowlist that no group grant covers at load or at save", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user, {
      initialTeam: unifiedTeam({ wiki: ["read_page"] }),
      freshTeam: unifiedTeam({ wiki: ["read_page"] }),
    });

    expect(await saveMcpEditor(user)).toEqual({ wiki: ["read_page"] });
  });

  it("refuses a save when the access group list is unavailable and the team reload fails", async () => {
    const user = userEvent.setup({ delay: null });
    await renderMcpEditor(user);
    vi.mocked(networking.teamInfoCall).mockRejectedValueOnce(new Ошибка("boom"));

    await refuseMcpSave(user, /access groups could not be reloaded/);
  });

  it("identifies standing tool-permission grants not covered by loaded access groups", () => {
    expect(
      standingToolPermissionServerIds(
        [effective("a", "toolPermission"), effective("b", "toolPermission"), effective("c", "direct")],
        ["ag-1"],
        [{ access_group_id: "ag-1", access_mcp_server_ids: ["b"] }],
        [],
      ),
    ).toEqual(new Set(["a"]));
  });

  it("does not treat a server granted by the team's loaded access groups as standing", () => {
    expect(
      standingToolPermissionServerIds(
        [effective("a", "toolPermission"), effective("b", "toolPermission")],
        ["ag-1"],
        [],
        ["b"],
      ),
    ).toEqual(new Set(["a"]));
  });

  it("includes standing tool-permission grants in the resolved server ids", async () => {
    const standingOnly = { effective-серверы: [effective("x", "toolPermission")], selectedAccessGroupIds: [] };
    expect(await resolveGrants({ ...standingOnly, standingServerIds: new Set(["x"]) })).toEqual({
      kind: "resolved",
      serverIds: new Set(["x"]),
    });
    expect(await resolveGrants(standingOnly)).toEqual({
      kind: "resolved",
      serverIds: new Set(),
    });
  });

  it("retains an indirectly granted server on an unrelated team save", async () => {
    const user = userEvent.setup({ delay: null });
    const catalog = [server("direct-server", "deploy_tracker"), server("perm-only-server", "issue_tracker")];
    mockUseMCP-серверы.mockReturnЗначение({ data: catalog, isLoading: false, isОшибка: false } as any);
    mockUseMCPToolsets.mockReturnЗначение({ data: [], isLoading: false, isОшибка: false } as any);
    mockUseAccessGroups.mockReturnЗначение({
      data: [],
      isLoading: false,
      isОшибка: false,
    } as any);
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        access_group_ids: [],
        object_permission: {
          mcp_servers: ["direct-server"],
          mcp_access_groups: [],
          mcp_toolsets: [],
          mcp_tool_permissions: {
            "direct-server": ["create_issue"],
            "perm-only-server": ["list_issues"],
          },
        },
      }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);

    renderWithProviders(
      <TeamInfoView
        teamId="123"
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        accessТокен="test-token"
        is_team_admin
        is_proxy_admin
        userModels={["gpt-4"]}
        editTeam={false}
      />,
    );
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await user.clear(screen.getByLabelText("Название команды"));
    await user.type(screen.getByLabelText("Название команды"), "Renamed Team");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(networking.teamUpdateCall).toHaveBeenCalled());
    const [, payload] = vi.mocked(networking.teamUpdateCall).mock.calls[0];
    expect(payload.object_permission.mcp_tool_permissions).toEqual({
      "direct-server": ["create_issue"],
      "perm-only-server": ["list_issues"],
    });
  });

  it("refuses a save with MCP permissions while the server inventory is unavailable", async () => {
    const user = userEvent.setup({ delay: null });
    mockUseMCP-серверы.mockReturnЗначение({ data: [], isLoading: false, isОшибка: true } as any);
    vi.mocked(networking.teamInfoCall).mockResolvedЗначение(
      createMockTeamData({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"],
        object_permission: {
          mcp_servers: ["direct-server"],
          mcp_access_groups: [],
          mcp_toolsets: [],
          mcp_tool_permissions: { "direct-server": ["create_issue"] },
        },
      }),
    );
    vi.mocked(networking.teamUpdateCall).mockResolvedЗначение({ data: {}, team_id: "123" } as any);
    const errorToast = vi.spyOn(toast, "fromОшибка").mockImplementation(() => {});

    renderWithProviders(
      <TeamInfoView
        teamId="123"
        onUpdate={vi.fn()}
        onClose={vi.fn()}
        accessТокен="test-token"
        is_team_admin
        is_proxy_admin
        userModels={["gpt-4"]}
        editTeam={false}
      />,
    );
    await waitFor(() => expect(screen.queryAllByText("Test Team").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /edit settings/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith(expect.stringMatching(/server list could not be loaded/)),
    );
    expect(networking.teamUpdateCall).not.toHaveBeenCalled();
    errorToast.mockRestore();
  });
});
