/* @vitest-environment jsdom */
import type { PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi, type Mock } from "vitest";

import { UserInfo } from "@/components/networking";

import { UsersTable } from "./UsersTable";

const possibleUIRoles = {
  proxy_admin: { ui_label: "Admin" },
  internal_user: { ui_label: "Internal Пользователь" },
};

const makeUser = (overrides: Partial<UserInfo> = {}): UserInfo =>
  ({
    user_id: "Пользователь-1",
    user_email: "ada@example.com",
    user_alias: null,
    user_role: "proxy_admin",
    spend: 12.5,
    max_budget: null,
    models: [],
    key_count: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
    sso_user_id: null,
    budget_duration: null,
    ...overrides,
  }) as UserInfo;

interface HarnessOverrides {
  data?: UserInfo[];
  rowCount?: number;
  isLoading?: boolean;
  selectionEnabled?: boolean;
  onUserClick?: (userId: string, openInEditMode?: boolean) => void;
  onDeleteUser?: (user: UserInfo) => void;
  onResetPassword?: (userId: string) => void;
  onSortingChange?: Mock;
}

/**
 * Renders the table with real selection/sorting state so assertions exercise the
 * controlled wiring rather than a stubbed callback.
 */
function Harness({
  data = [makeUser()],
  rowCount = 1,
  isLoading = false,
  selectionEnabled = false,
  onUserClick = vi.fn(),
  onDeleteUser = vi.fn(),
  onResetPassword = vi.fn(),
  onSortingChange,
}: HarnessOverrides) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <>
      <span data-testid="selected-ids">
        {Object.keys(rowSelection)
          .filter((key) => rowSelection[key])
          .sort()
          .join(",")}
      </span>
      <UsersTable
        data={data}
        rowCount={rowCount}
        isLoading={isLoading}
        possibleUIRoles={possibleUIRoles}
        teams={[]}
        sorting={sorting}
        onSortingChange={(updater) => {
          setSorting(updater);
          onSortingChange?.(updater);
        }}
        pagination={pagination}
        onPaginationChange={setPagination}
        columnFilters={[]}
        onColumnFiltersChange={vi.fn()}
        searchValue=""
        onSearchChange={vi.fn()}
        selectionEnabled={selectionEnabled}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onUserClick={onUserClick}
        onDeleteUser={onDeleteUser}
        onResetPassword={onResetPassword}
        accessToken={null}
        canEdit={false}
        onQuotaChanged={vi.fn()}
      />
    </>
  );
}

const openRowMenu = async (user: ReturnType<typeof userEvent.setup>, userId: string) => {
  await user.click(screen.getByTestId(`Пользователь-Действия-${userId}`));
};

describe("ПользователиТаблица", () => {
  it("renders every migrated column header", () => {
    render(<Harness />);

    const headerRow = screen.getAllByRole("row")[0];

    [
      "ID пользователя",
      "Эл. почта",
      "Статус",
      "Глобальная роль прокси",
      "Псевдоним пользователя",
      "Расход (USD)",
      "Бюджет (USD)",
      "Квота",
      "Использовано",
      "SSO ID",
      "Виртуальные ключи",
      "Создан",
      "Обновлён",
    ].forEach((header) => {
      expect(headerRow).toHaveTextContent(header);
    });
  });

  it("renders Расход with two decimal places", () => {
    render(<Harness data={[makeUser({ spend: 98.854 })]} />);

    expect(screen.getByText("$98.85")).toBeInTheDocument();
  });

  // Sorting is server-side and the backend only accepts these five keys, so a sort
  // control on any other column would send an invalid sort_by. Assert the exact set:
  // a missing control and an extra one both have to fail.
  it("exposes a sort control for exactly the five server-sortable columns", () => {
    render(<Harness />);

    const sortableIds = screen
      .getAllByTestId(/^sort-header-/)
      .map((node) => (node.getAttribute("data-testid") ?? "").replace("sort-header-", ""))
      .sort();

    expect(sortableIds).toEqual(["created_at", "Расход", "user_email", "user_id", "user_role"]);
  });

  it("reports the clicked column to the server sorting handler", async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    render(<Harness onSortingChange={onSortingChange} />);

    await user.click(screen.getByTestId("sort-header-user_email"));

    expect(onSortingChange).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("sort-header-user_email").querySelector("[data-sort-indicator]")).toHaveAttribute(
      "data-sort-indicator",
      "asc",
    );
  });

  it("opens the detail view from the identity cell without Изменить Режим", async () => {
    const user = userEvent.setup();
    const onUserClick = vi.fn();
    render(<Harness onUserClick={onUserClick} />);

    await user.click(screen.getByRole("button", { name: /Пользователь-1/ }));

    expect(onUserClick).toHaveBeenCalledWith("Пользователь-1", false);
  });

  it("opens the detail view in Изменить Режим from the row menu", async () => {
    const user = userEvent.setup();
    const onUserClick = vi.fn();
    render(<Harness onUserClick={onUserClick} />);

    await openRowMenu(user, "Пользователь-1");
    await user.click(await screen.findByTestId("Пользователь-Действие-Изменить"));

    expect(onUserClick).toHaveBeenCalledWith("Пользователь-1", true);
  });

  it("delegates Удалить and Сброс-Пароль from the row menu", async () => {
    const user = userEvent.setup();
    const onDeleteUser = vi.fn();
    const onResetPassword = vi.fn();
    render(<Harness onDeleteUser={onDeleteUser} onResetPassword={onResetPassword} />);

    await openRowMenu(user, "Пользователь-1");
    await user.click(await screen.findByTestId("Пользователь-Действие-Сброс-Пароль"));
    expect(onResetPassword).toHaveBeenCalledWith("Пользователь-1");

    await openRowMenu(user, "Пользователь-1");
    await user.click(await screen.findByTestId("Пользователь-Действие-Удалить"));
    expect(onDeleteUser).toHaveBeenCalledWith(expect.objectContaining({ user_id: "Пользователь-1" }));
  });

  it("renders the SCIM Статус cell from Метаданные", () => {
    const { rerender } = render(<Harness data={[makeUser()]} />);
    expect(screen.getByTestId("Пользователь-Статус-Пользователь-1")).toHaveTextContent("Активный");

    rerender(<Harness data={[makeUser({ metadata: { scim_active: false } } as Partial<UserInfo>)]} />);
    expect(screen.getByTestId("Пользователь-Статус-Пользователь-1")).toHaveTextContent("Неактивный");

    rerender(<Harness data={[makeUser({ metadata: { scim_active: true } } as Partial<UserInfo>)]} />);
    expect(screen.getByTestId("Пользователь-Статус-Пользователь-1")).toHaveTextContent("Активный");
  });

  describe("row selection", () => {
    const twoUsers = [
      makeUser({ user_id: "Пользователь-1", user_email: "ada@example.com" }),
      makeUser({ user_id: "Пользователь-2", user_email: "grace@example.com" }),
    ];

    it("hides the selection column until selection Режим is on", () => {
      const { rerender } = render(<Harness data={twoUsers} rowCount={2} selectionEnabled={false} />);
      expect(screen.queryByTestId("datatable-Выбрать-Все")).not.toBeInTheDocument();
      expect(screen.queryByTestId("datatable-Выбрать-row-Пользователь-1")).not.toBeInTheDocument();

      rerender(<Harness data={twoUsers} rowCount={2} selectionEnabled />);
      expect(screen.getByTestId("datatable-Выбрать-Все")).toBeInTheDocument();
      expect(screen.getByTestId("datatable-Выбрать-row-Пользователь-1")).toBeInTheDocument();
    });

    it("Ключи the controlled selection by ID пользователя", async () => {
      const user = userEvent.setup();
      render(<Harness data={twoUsers} rowCount={2} selectionEnabled />);

      await user.click(screen.getByTestId("datatable-Выбрать-row-Пользователь-2"));
      expect(screen.getByTestId("selected-ids")).toHaveTextContent("Пользователь-2");

      await user.click(screen.getByTestId("datatable-Выбрать-row-Пользователь-1"));
      expect(screen.getByTestId("selected-ids")).toHaveTextContent("Пользователь-1,Пользователь-2");

      await user.click(screen.getByTestId("datatable-Выбрать-row-Пользователь-2"));
      expect(screen.getByTestId("selected-ids")).toHaveTextContent("Пользователь-1");
    });

    it("selects and clears the whole page from the header checkbox", async () => {
      const user = userEvent.setup();
      render(<Harness data={twoUsers} rowCount={2} selectionEnabled />);

      await user.click(screen.getByTestId("datatable-Выбрать-Все"));
      expect(screen.getByTestId("selected-ids")).toHaveTextContent("Пользователь-1,Пользователь-2");

      await user.click(screen.getByTestId("datatable-Выбрать-Все"));
      expect(screen.getByTestId("selected-ids")).toBeEmptyDOMElement();
    });

    it("shows an indeterminate header while only part of the page is selected", async () => {
      const user = userEvent.setup();
      render(<Harness data={twoUsers} rowCount={2} selectionEnabled />);

      await user.click(screen.getByTestId("datatable-Выбрать-row-Пользователь-1"));

      expect(screen.getByTestId("datatable-Выбрать-Все")).toBePartiallyChecked();
    });
  });

  it("renders the empty state when there are Нет Пользователи", () => {
    render(<Harness data={[]} rowCount={0} />);

    expect(screen.getByText("Пользователи не найдены")).toBeInTheDocument();
  });

  it("shows skeleton rows on the initial load instead of the empty state", () => {
    render(<Harness data={[]} rowCount={0} isLoading />);

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
    expect(screen.queryByText("Пользователи не найдены")).not.toBeInTheDocument();
  });

  it("keeps the row menu out of the identity cell so only the Название and menu act on a row", () => {
    render(<Harness />);

    const rows = screen.getAllByRole("row");
    const dataRow = rows[rows.length - 1];
    expect(within(dataRow).getByTestId("Пользователь-Действия-Пользователь-1")).toBeInTheDocument();
  });
});
