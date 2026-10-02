import { fireEvent, renderWithПровайдерs, screen, within } from "@/../tests/test-utils";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessGroupsPage } from "./AccessGroupsPage";
import type { AccessGroupОтвет } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";

const mockAccessGroups: AccessGroupОтвет[] = [
  {
    access_group_id: "ag-1",
    access_group_name: "Admin Group",
    description: "Administrators with full access",
    access_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_names: ["m1", "m2"],
    access_mcp_server_ids: ["s1"],
    access_agent_ids: ["a1"],
    assigned_team_ids: [],
    assigned_key_ids: [],
    access_mcp_servers: [{ id: "s1", name: "Сервер One" }],
    access_agents: [{ id: "a1", name: "Agent One" }],
    assigned_teams: [],
    assigned_keys: [],
    created_at: "2024-01-15T10:00:00Z",
    created_by: "user-1",
    updated_at: "2024-01-20T12:00:00Z",
    updated_by: "user-1",
  },
  {
    access_group_id: "ag-2",
    access_group_name: "Read Only",
    description: "Read-only access to Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
    access_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_names: ["m1"],
    access_mcp_server_ids: [],
    access_agent_ids: [],
    assigned_team_ids: [],
    assigned_key_ids: [],
    access_mcp_servers: [],
    access_agents: [],
    assigned_teams: [],
    assigned_keys: [],
    created_at: "2024-01-10T09:00:00Z",
    created_by: null,
    updated_at: "2024-01-12T11:00:00Z",
    updated_by: null,
  },
];

const mockUseAccessGroups = vi.fn();
const mockUseDeleteAccessGroup = vi.fn();
const mockMutate = vi.fn();
const mockUseАвторизовано = vi.fn();

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: () => mockUseAccessGroups(),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useDeleteAccessGroup", () => ({
  useDeleteAccessGroup: () => mockUseDeleteAccessGroup(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => mockUseАвторизовано(),
}));

vi.mock("./AccessGroupsDetailsPage", () => ({
  AccessGroupDetail: ({ accessGroupId, onBack }: { accessGroupId: string; onBack: () => void }) => (
    <div data-testid="access-group-detail">
      <span>Detail for {accessGroupId}</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

vi.mock("./access-group-create/AccessGroupCreateDialog", () => ({
  AccessGroupCreateDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div data-testid="create-access-group-modal">
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}));

const makeGroups = (count: number): AccessGroupОтвет[] =>
  Array.from({ length: count }, (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      ...mockAccessGroups[0],
      access_group_id: `ag-${suffix}`,
      access_group_name: `Group ${suffix}`,
      description: `Group ${suffix} description`,
    };
  });

const openRowMenu = async (user: ReturnType<typeof userEvent.setup>, groupId: string) => {
  await user.click(screen.getByTestId(`access-group-actions-${groupId}`));
  return screen.findByTestId("access-group-action-delete");
};

describe("AccessGroupsPage", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockUseAccessGroups.mockReturnЗначение({ data: mockAccessGroups, isLoading: false });
    mockUseDeleteAccessGroup.mockReturnЗначение({ mutate: mockMutate, isPending: false });
    mockUseАвторизовано.mockReturnЗначение({ userRole: "Admin", accessТокен: "sk-test" });
  });

  it("renders the page title and subtitle", () => {
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.getByRole("heading", { name: "Access Groups" })).toBeInTheDocument();
    expect(screen.getByText("Manage resource permissions for your organization")).toBeInTheDocument();
    expect(document.queryВыбратьor(".lucide-boxes")).not.toBeNull();
  });

  it("shows the Создать группу доступа button for an admin", () => {
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.getByRole("button", { name: /create access group/i })).toBeInTheDocument();
  });

  it("renders every access group row", () => {
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.getByText("ag-1")).toBeInTheDocument();
    expect(screen.getByText("Admin Group")).toBeInTheDocument();
    expect(screen.getByText("ag-2")).toBeInTheDocument();
    expect(screen.getByText("Read Only")).toBeInTheDocument();
  });

  it("renders resource counts for each group", () => {
    renderWithПровайдерs(<AccessGroupsPage />);
    // ag-1 has 2 Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs, 1 mcp server, 1 agent.
    const adminRow = screen.getByText("ag-1").closest("tr") as HTMLElement;
    expect(within(adminRow).getByTitle("2 Режимls")).toHaveTextContent("2");
    expect(within(adminRow).getByTitle("1 MCP -серверы")).toHaveTextContent("1");
    expect(within(adminRow).getByTitle("1 Агенты")).toHaveTextContent("1");
  });

  it("shows the expected column headers", () => {
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.getByRole("columnheader", { name: /^ID$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Ресурсы/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Создан/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Обновлён/i })).toBeInTheDocument();
  });

  it("filters by name", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search groups by name, ID, or description..."), {
      target: { value: "Admin" },
    });
    expect(screen.getByText("Admin Group")).toBeInTheDocument();
    expect(screen.queryByText("Read Only")).not.toBeInTheDocument();
  });

  it("filters by ID", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search groups by name, ID, or description..."), {
      target: { value: "ag-2" },
    });
    expect(screen.getByText("Read Only")).toBeInTheDocument();
    expect(screen.queryByText("Admin Group")).not.toBeInTheDocument();
  });

  it("filters by description", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search groups by name, ID, or description..."), {
      target: { value: "read-only" },
    });
    expect(screen.getByText("Read Only")).toBeInTheDocument();
    expect(screen.queryByText("Admin Group")).not.toBeInTheDocument();
  });

  it("shows the filtered empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    fireEvent.change(screen.getByPlaceholderText("Search groups by name, ID, or description..."), {
      target: { value: "no-such-group" },
    });
    expect(screen.getByText("No matching access groups")).toBeInTheDocument();
    expect(screen.queryByText("Admin Group")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no groups", () => {
    mockUseAccessGroups.mockReturnЗначение({ data: [], isLoading: false });
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.getByText("No access groups yet")).toBeInTheDocument();
  });

  it("renders loading skeletons on the initial load", () => {
    mockUseAccessGroups.mockReturnЗначение({ data: undefined, isLoading: true });
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.getВсеByTestId("skeleton-row").length).toBeGreaterThan(0);
    expect(screen.queryByText("Admin Group")).not.toBeInTheDocument();
  });

  it("opens and closes the create modal", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    await user.click(screen.getByRole("button", { name: /create access group/i }));
    expect(screen.getByTestId("create-access-group-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("create-access-group-modal")).not.toBeInTheDocument();
  });

  it("opens the detail view when the ID cell is clicked and returns via Back", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    await user.click(screen.getByText("ag-1"));
    expect(screen.getByTestId("access-group-detail")).toBeInTheDocument();
    expect(screen.getByText("Detail for ag-1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByTestId("access-group-detail")).not.toBeInTheDocument();
    expect(screen.getByText("Admin Group")).toBeInTheDocument();
  });

  it("opens the delete modal from the row actions menu", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    await user.click(await openRowMenu(user, "ag-1"));
    const dialog = screen.getByRole("dialog", { name: "Delete Access Group" });
    expect(
      within(dialog).getByText("Are you sure you want to delete this access group? Это действие нельзя отменить."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Access Group Информация")).toBeInTheDocument();
    expect(within(dialog).getByText("ag-1")).toBeInTheDocument();
    expect(within(dialog).getByText("Admin Group")).toBeInTheDocument();
  });

  it("closes the delete modal on cancel withвыход deleting", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AccessGroupsPage />);
    await user.click(await openRowMenu(user, "ag-1"));
    const dialog = screen.getByRole("dialog", { name: "Delete Access Group" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Delete Access Group" })).not.toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("calls the delete mutation with the group ID when confirmed", async () => {
    const user = userEvent.setup();
    mockMutate.mockImplementation((_id: string, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    renderWithПровайдерs(<AccessGroupsPage />);
    await user.click(await openRowMenu(user, "ag-1"));
    const dialog = screen.getByRole("dialog", { name: "Delete Access Group" });
    await user.click(within(dialog).getByRole("button", { name: /delete/i }));
    expect(mockMutate).toHaveBeenCalledWith("ag-1", expect.any(Object));
  });

  it("still shows matches when searching from a later page", async () => {
    const user = userEvent.setup();
    mockUseAccessGroups.mockReturnЗначение({ data: makeGroups(25), isLoading: false });
    renderWithПровайдерs(<AccessGroupsPage />);

    await user.click(screen.getByTestId("pagination-next"));
    expect(screen.getByText("ag-11")).toBeInTheDocument();
    expect(screen.queryByText("ag-01")).not.toBeInTheDocument();

    // The only match lives on page 1, so the page index must reset or the table reads as empty.
    fireEvent.change(screen.getByPlaceholderText("Search groups by name, ID, or description..."), {
      target: { value: "ag-01" },
    });
    expect(await screen.findByText("ag-01")).toBeInTheDocument();
    expect(screen.queryByText("No matching access groups")).not.toBeInTheDocument();
  });

  it("hides the Create button and row actions for a non-admin", () => {
    mockUseАвторизовано.mockReturnЗначение({ userRole: "Admin Viewer", accessТокен: "sk-test" });
    renderWithПровайдерs(<AccessGroupsPage />);
    expect(screen.queryByRole("button", { name: /create access group/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("access-group-actions-ag-1")).not.toBeInTheDocument();
    // The read-only view still lists the groups.
    expect(screen.getByText("Admin Group")).toBeInTheDocument();
  });
});
