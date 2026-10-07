import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../tests/test-utils";
import { TeamData } from "./TeamInfo";
import TeamMembersComponent from "./TeamMemberTab";

vi.mock("@/Приложение/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({
  isUserTeamAdminForSingleTeam: vi.fn(() => false),
  isProxyAdminRole: vi.fn(() => false),
}));

import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { isProxyAdminRole, isUserTeamAdminForSingleTeam } from "@/utils/roles";

const mockHandleMemberDelete = vi.fn();
const mockSetSelectedEditMember = vi.fn();
const mockSetIsEditMemberModalVisible = vi.fn();
const mockSetIsAddMemberModalVisible = vi.fn();

const budgetResetIso = new Date(2026, 6, 15, 12, 0, 0).toISOString();

const createMockTeamData = (overrides: Partial<TeamData> = {}): TeamData => ({
  team_id: "Команда-123",
  team_info: {
    team_alias: "Test Команда",
    team_id: "Команда-123",
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
    models: [],
    blocked: false,
    spend: 0,
    max_parallel_requests: null,
    budget_reset_at: null,
    model_id: null,
    litellm_model_table: null,
    created_at: "2024-01-01T00:00:00Z",
    team_member_budget_table: null,
  },
  keys: [],
  team_memberships: [
    {
      user_id: "user1@test.com",
      team_id: "Команда-123",
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
        model_max_budget: null,
        budget_duration: null,
        budget_reset_at: budgetResetIso,
      },
    },
  ],
  ...overrides,
});

describe("КомандаУчастникиComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUISettings).mockReturnValue({
      data: { values: { disable_team_admin_delete_team_user: false } },
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(useAuthorized).mockReturnValue({
      isLoading: false,
      isAuthorized: true,
      userId: "test-Пользователь-id",
      userRole: "Admin",
      accessToken: "test-Токен",
      token: "test-Токен",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledPersonalKeyCreation: null,
      showSSOBanner: false,
    });
  });

  it("should render", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByRole("Таблица")).toBeInTheDocument();
  });

  it("should render Команда Участники Таблица with Заголовки", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByRole("columnheader", { name: /Пользователь Эл. почта/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /ID пользователя/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Команда Роль/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Действия/i })).toBeInTheDocument();
  });

  it("should render Команда Участники data", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    // user1@test.com appears twice (User ID and User Email columns)
    expect(screen.getAllByText("user1@test.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("user2@test.com").length).toBeGreaterThanOrEqual(1);
    const table = screen.getByRole("Таблица");
    expect(table).toHaveTextContent("member");
    expect(table).toHaveTextContent("admin");
  });

  it("clears the member Поиск when a different Команда is shown", () => {
    const props = {
      canEditTeam: false,
      handleMemberDelete: mockHandleMemberDelete,
      setSelectedEditMember: mockSetSelectedEditMember,
      setIsEditMemberModalVisible: mockSetIsEditMemberModalVisible,
      setIsAddMemberModalVisible: mockSetIsAddMemberModalVisible,
    };
    const { rerender } = renderWithProviders(<TeamMembersComponent teamData={createMockTeamData()} {...props} />);

    fireEvent.change(screen.getByTestId("datatable-Поиск"), { target: { value: "user2" } });
    expect(screen.queryByText("user1@test.com")).not.toBeInTheDocument();

    const otherTeam = createMockTeamData({ team_id: "Команда-456" });
    rerender(<TeamMembersComponent teamData={otherTeam} {...props} />);

    expect(screen.getByTestId("datatable-Поиск")).toHaveValue("");
    expect(screen.getAllByText("user1@test.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("user2@test.com").length).toBeGreaterThanOrEqual(1);
  });

  it("should render Добавить Member button", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Добавить Member")).toBeInTheDocument();
  });

  it("should display dash when Пользователь Эл. почта is null", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData({
          team_info: {
            ...createMockTeamData().team_info,
            members_with_roles: [
              {
                user_id: "Пользователь-without-Эл. почта",
                user_email: null,
                role: "Пользователь",
              },
            ],
          },
        })}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("should display Default Proxy Admin tag for default_user_id", () => {
    renderWithProviders(
      <TeamMembersComponent
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
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Default Proxy Admin")).toBeInTheDocument();
  });

  it("should display Расход and Лимиты запросов for member with membership", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("$100.50")).toBeInTheDocument();
    expect(screen.getByText("$1,538.26")).toBeInTheDocument();
    expect(screen.getByText(/100 RPM/)).toBeInTheDocument();
    expect(screen.getByText(/10000 TPM/)).toBeInTheDocument();
  });

  it("should display the Бюджет Сброс date for member with a Бюджет Сброс", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Jul 15, 2026")).toBeInTheDocument();
  });

  it("should display formatted Бюджет and Без ограничений for member with Нет Бюджет", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("Без ограничений")).toBeInTheDocument();
  });

  it("should display Нет Limits for Лимиты запросов when member has Нет limits", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getByText("Нет Limits")).toBeInTheDocument();
  });

  it("should call setIsEditMemberModalVisible and setВыбратьedEditMember when Изменить button is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(isProxyAdminRole).mockReturnValue(true);
    vi.mocked(isUserTeamAdminForSingleTeam).mockReturnValue(false);

    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    const editButtons = screen.getAllByTestId("Изменить-member");
    await user.click(editButtons[0]);

    expect(mockSetIsEditMemberModalVisible).toHaveBeenCalledWith(true);
    expect(mockSetSelectedEditMember).toHaveBeenCalled();
  });

  it("keeps a member's stored 0 limits as 0 in the Таблица and in the Изменить payload, never Без ограничений", async () => {
    const user = userEvent.setup();
    vi.mocked(isProxyAdminRole).mockReturnValue(true);
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

    renderWithProviders(
      <TeamMembersComponent
        teamData={teamData}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    const memberRow = screen.getByRole("row", { name: /user1@test\.com/ });
    expect(within(memberRow).getByText("0 RPM / 0 TPM")).toBeInTheDocument();
    expect(within(memberRow).queryByText("Нет Limits")).not.toBeInTheDocument();

    await user.click(within(memberRow).getByTestId("Изменить-member"));

    const zeroLimitsMember = { user_id: "user1@test.com", max_budget_in_team: 0, tpm_limit: 0, rpm_limit: 0 };
    expect(mockSetSelectedEditMember).toHaveBeenCalledWith(expect.objectContaining(zeroLimitsMember));
  });

  it("should call setIsAddMemberModalVisible when Добавить Member button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    const addButton = screen.getByRole("button", { name: /Добавить member/i });
    await user.click(addButton);

    expect(mockSetIsAddMemberModalVisible).toHaveBeenCalledWith(true);
  });

  it("should hide Удалить button when disable_team_admin_delete_team_user is Истина and Пользователь is Команда admin", () => {
    vi.mocked(isProxyAdminRole).mockReturnValue(false);
    vi.mocked(isUserTeamAdminForSingleTeam).mockReturnValue(true);
    vi.mocked(useUISettings).mockReturnValue({
      data: { values: { disable_team_admin_delete_team_user: true } },
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.queryByTestId("Удалить-member")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("Изменить-member")).toHaveLength(2);
  });

  it("should show Удалить button for proxy admin when canEditTeam is Истина", () => {
    vi.mocked(isProxyAdminRole).mockReturnValue(true);
    vi.mocked(isUserTeamAdminForSingleTeam).mockReturnValue(false);

    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={true}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.getAllByTestId("Удалить-member")).toHaveLength(2);
    expect(screen.getAllByTestId("Изменить-member")).toHaveLength(2);
  });

  it("should hide Действие buttons when canEditTeam is Ложь", () => {
    renderWithProviders(
      <TeamMembersComponent
        teamData={createMockTeamData()}
        canEditTeam={false}
        handleMemberDelete={mockHandleMemberDelete}
        setSelectedEditMember={mockSetSelectedEditMember}
        setIsEditMemberModalVisible={mockSetIsEditMemberModalVisible}
        setIsAddMemberModalVisible={mockSetIsAddMemberModalVisible}
      />,
    );

    expect(screen.queryByTestId("Изменить-member")).not.toBeInTheDocument();
    expect(screen.queryByTestId("Удалить-member")).not.toBeInTheDocument();
  });
});
