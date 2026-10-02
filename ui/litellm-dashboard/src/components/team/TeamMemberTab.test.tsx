import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithПровайдерs } from "../../../tests/test-utils";
import { TeamData } from "./TeamInfo";
import TeamучастниковComponent from "./TeamMemberTab";

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({
  isUserTeamAdminForSingleTeam: vi.fn(() => false),
  isProxyAdminRole: vi.fn(() => false),
}));

import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useАвторизовано from "@/app/(dashboard)/hooks/useАвторизовано";
import { isProxyAdminRole, isUserTeamAdminForSingleTeam } from "@/utils/roles";

const mockHandleMemberDelete = vi.fn();
const mockSetВыбраноEditMember = vi.fn();
const mockSetIsEditMemberModalVisible = vi.fn();
const mockSetIsAddMemberModalVisible = vi.fn();

const budgetResetIso = new Date(2026, 6, 15, 12, 0, 0).toISOString();

const createMockTeamData = (overrides: Partial<TeamData> = {}): TeamData => ({
  team_id: "team-123",
  team_info: {
    team_alias: "Test Team",
    team_id: "team-123",
    organization_id: null,
    admins: ["admin@test.com"],
    members: ["user1@test.com"],
    members_with_roles: [
      {
        user_id: "user1@test.com",
        user_email: "user1@test.com",
        role: "member",
      },
      {
        user_id: "user2@test.com",
        user_email: "user2@test.com",
        role: "admin",
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
    litellm_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_table: null,
    created_at: "2024-01-01T00:00:00Z",
    team_member_budget_table: null,
  },
  keys: [],
  team_memberships: [
    {
      user_id: "user1@test.com",
      team_id: "team-123",
      budget_id: "budget1",
      spend: 100.5,
      total_spend: 1538.2608,
      litellm_budget_table: {
        budget_id: "budget1",
        soft_budget: null,
        max_budget: 1000,
        max_parallel_requests: null,
        tpm_limit: 10000,
        rpm_limit: 100,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: null,
        budget_duration: null,
        budget_reset_at: budgetResetIso,
      },
    },
  ],
  ...overrides,
});

describe("TeamучастниковComponent", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(useUISettings).mockReturnЗначение({
      data: { values: { disable_team_admin_delete_team_user: false } },
      isLoading: false,
      isОшибка: false,
      error: null,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useАвторизовано).mockReturnЗначение({
      isLoading: false,
      isАвторизовано: true,
      userId: "test-user-id",
      userRole: "Admin",
      accessТокен: "test-token",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });
  });

  it("should render", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("should render team members table with headers", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByRole("columnheader", { name: /user email/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /user id/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /team role/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /actions/i })).toBeInTheDocument();
  });

  it("should render team members data", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    // user1@test.com appears twice (ID пользователя and User Email columns)
    expect(screen.getВсеByText("user1@test.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getВсеByText("user2@test.com").length).toBeGreaterThanOrEqual(1);
    const table = screen.getByRole("table");
    expect(table).toHaveTextContent("member");
    expect(table).toHaveTextContent("admin");
  });

  it("clears the member search when a different team is shown", () => {
    const props = {
      canEditTeam: false,
      handleMemberDelete: mockHandleMemberDelete,
      setВыбраноEditMember: mockSetВыбраноEditMember,
      setIsEditMemberModalVisible: mockSetIsEditMemberModalVisible,
      setIsAddMemberModalVisible: mockSetIsAddMemberModalVisible,
    };
    const { rerender } = renderWithПровайдерs(<TeamучастниковComponent teamData={createMockTeamData()} {...props} />);

    fireEvent.change(screen.getByTestId("datatable-search"), { target: { value: "user2" } });
    expect(screen.queryByText("user1@test.com")).not.toBeInTheDocument();

    const otherTeam = createMockTeamData({ team_id: "team-456" });
    rerender(<TeamучастниковComponent teamData={otherTeam} {...props} />);

    expect(screen.getByTestId("datatable-search")).toHaveЗначение("");
    expect(screen.getВсеByText("user1@test.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getВсеByText("user2@test.com").length).toBeGreaterThanOrEqual(1);
  });

  it("should render Add Member button", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Add Member")).toBeInTheDocument();
  });

  it("should display dash when user email is null", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData({
          team_info: {
            ...createMockTeamData().team_info,
            members_with_roles: [
              {
                user_id: "user-withвыход-email",
                user_email: null,
                role: "user",
              },
            ],
          },
        })}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getВсеByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("should display Default Proxy Admin tag for default_user_id", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData({
          team_info: {
            ...createMockTeamData().team_info,
            members_with_roles: [
              {
                user_id: "default_user_id",
                user_email: "admin@proxy.com",
                role: "admin",
              },
            ],
          },
        })}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Default Proxy Admin")).toBeInTheDocument();
  });

  it("should display spend and rate limits for member with membership", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("$100.50")).toBeInTheDocument();
    expect(screen.getByText("$1,538.26")).toBeInTheDocument();
    expect(screen.getByText(/100 RPM/)).toBeInTheDocument();
    expect(screen.getByText(/10000 TPM/)).toBeInTheDocument();
  });

  it("should display the budget reset date for member with a budget reset", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Jul 15, 2026")).toBeInTheDocument();
  });

  it("should display formatted budget and Без ограничений for member with no budget", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("Без ограничений")).toBeInTheDocument();
  });

  it("should display No Limits for rate limits when member has no limits", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("No Limits")).toBeInTheDocument();
  });

  it("should call setIsEditMemberModalVisible and setВыбраноEditMember when edit button is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(isProxyAdminRole).mockReturnЗначение(true);
    vi.mocked(isUserTeamAdminForSingleTeam).mockReturnЗначение(false);

    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    const editButtons = screen.getВсеByTestId("edit-member");
    await user.click(editButtons[0]);

    expect(mockSetIsEditMemberModalVisible).toHaveBeenCalledWith(true);
    expect(mockSetВыбраноEditMember).toHaveBeenCalled();
  });

  it("keeps a member's stored 0 limits as 0 in the table and in the edit payload, never unlimited", async () => {
    const user = userEvent.setup();
    vi.mocked(isProxyAdminRole).mockReturnЗначение(true);
    const baseTeamData = createMockTeamData();
    const teamData = {
      ...baseTeamData,
      team_memberships: baseTeamData.team_memberships.map((membership, index) =>
        index === 0
          ? {
              ...membership,
              litellm_budget_table: { ...membership.litellm_budget_table, max_budget: 0, tpm_limit: 0, rpm_limit: 0 },
            }
          : membership,
      ),
    };

    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={teamData}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    const memberRow = screen.getByRole("row", { name: /user1@test\.com/ });
    expect(within(memberRow).getByText("0 RPM / 0 TPM")).toBeInTheDocument();
    expect(within(memberRow).queryByText("No Limits")).not.toBeInTheDocument();

    await user.click(within(memberRow).getByTestId("edit-member"));

    const zeroLimitsMember = { user_id: "user1@test.com", max_budget_in_team: 0, tpm_limit: 0, rpm_limit: 0 };
    expect(mockSetВыбраноEditMember).toHaveBeenCalledWith(expect.objectContaining(zeroLimitsMember));
  });

  it("should call setIsAddMemberModalVisible when Add Member button is clicked", async () => {
    const user = userEvent.setup();

    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    const addButton = screen.getByRole("button", { name: /add member/i });
    await user.click(addButton);

    expect(mockSetIsAddMemberModalVisible).toHaveBeenCalledWith(true);
  });

  it("should hide delete button when disable_team_admin_delete_team_user is true and user is team admin", () => {
    vi.mocked(isProxyAdminRole).mockReturnЗначение(false);
    vi.mocked(isUserTeamAdminForSingleTeam).mockReturnЗначение(true);
    vi.mocked(useUISettings).mockReturnЗначение({
      data: { values: { disable_team_admin_delete_team_user: true } },
      isLoading: false,
      isОшибка: false,
      error: null,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.queryByTestId("delete-member")).not.toBeInTheDocument();
    expect(screen.getВсеByTestId("edit-member")).toHaveLength(2);
  });

  it("should show delete button for proxy admin when canEditTeam is true", () => {
    vi.mocked(isProxyAdminRole).mockReturnЗначение(true);
    vi.mocked(isUserTeamAdminForSingleTeam).mockReturnЗначение(false);

    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getВсеByTestId("delete-member")).toHaveLength(2);
    expect(screen.getВсеByTestId("edit-member")).toHaveLength(2);
  });

  it("should hide action buttons when canEditTeam is false", () => {
    renderWithПровайдерs(
      <TeamучастниковComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setВыбраноEditMember={mockSetВыбраноEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.queryByTestId("edit-member")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-member")).not.toBeInTheDocument();
  });
});
