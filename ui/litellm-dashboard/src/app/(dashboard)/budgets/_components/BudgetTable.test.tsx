import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, testQueryClient } from "@/../tests/test-utils";
import BudgetTable from "./BudgetTable";
import type { budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import type { ResourceListResult } from "@/app/(dashboard)/hooks/common/useResourceList";
import { ApiError } from "@/lib/http/client";

const { copyToClipboardMock } = vi.hoisted(() => ({ copyToClipboardMock: vi.fn() }));

vi.mock("@/utils/dataUtils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/dataUtils")>()),
  copyToClipboard: copyToClipboardMock,
}));

const makeBudget = (overrides: Partial<budgetItem> = {}): budgetItem => ({
  budget_id: "Бюджет-1",
  max_budget: 100,
  soft_budget: null,
  tpm_limit: 1000,
  rpm_limit: 10,
  budget_duration: "30d",
  budget_reset_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const makeList = (overrides: Partial<ResourceListResult<budgetItem>> = {}): ResourceListResult<budgetItem> => ({
  rows: [makeBudget()],
  rowCount: 1,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  sorting: [{ id: "created_at", desc: true }],
  onSortingChange: vi.fn(),
  pagination: { pageIndex: 0, pageSize: 50 },
  onPaginationChange: vi.fn(),
  columnFilters: [],
  onColumnFiltersChange: vi.fn(),
  searchValue: "",
  onSearchChange: vi.fn(),
  ...overrides,
});

const FORBIDDEN_PROBLEM = {
  type: "about:blank",
  title: "Forbidden",
  status: 403,
  detail: "Only proxy admins can view Бюджеты",
};

const showColumn = async (user: ReturnType<typeof userEvent.setup>, columnId: string) => {
  await user.click(screen.getByTestId("view-options-trigger"));
  await user.click(await screen.findByTestId(`view-option-${columnId}`));
};

const defaultProps = {
  canModify: true,
  onEditClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

describe("БюджетТаблица", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testQueryClient.clear();
  });

  it("should display Бюджет Информация", () => {
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList()} />);
    expect(screen.getByText("Бюджет-1")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should open on the four columns the page has always shown, with Сброс and Создан off", () => {
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList()} />);
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(expect.arrayContaining(["ID бюджета", "Макс. бюджет", "TPM", "RPM"]));
    expect(headers).not.toContain("Сброс");
    expect(headers).not.toContain("Создан");
  });

  it("should render the Сброс column with the friendly Длительность label once it is turned on", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList()} />);
    await showColumn(user, "budget_duration");
    expect(screen.getByText("Каждый месяц")).toBeInTheDocument();
  });

  it("should render 'Не задано' when a Бюджет has Без сброса Длительность", async () => {
    const user = userEvent.setup();
    const list = makeList({ rows: [makeBudget({ budget_duration: null })] });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    await showColumn(user, "budget_duration");
    expect(screen.getByText("Не задано")).toBeInTheDocument();
  });

  it("should render the ID бюджета in full, with Нет truncation", () => {
    const budgetId = "ecc1869c-6231-4380-a56d-1a0be457477d";
    const list = makeList({ rows: [makeBudget({ budget_id: budgetId })] });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    const idCell = screen.getByText(budgetId);
    expect(idCell).not.toHaveClass("truncate");
    expect(idCell.className).not.toMatch(/Макс.-w-\[\d+(ch|rem|px)\]/);
  });

  it("should keep the ID бюджета on a single line", () => {
    const budgetId = "ecc1869c-6231-4380-a56d-1a0be457477d";
    const list = makeList({ rows: [makeBudget({ budget_id: budgetId })] });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    expect(screen.getByText(budgetId)).toHaveClass("whitespace-nowrap");
  });

  it("should Скопировать the ID бюджета from the cell's Скопировать button", async () => {
    const user = userEvent.setup();
    const budgetId = "ecc1869c-6231-4380-a56d-1a0be457477d";
    const list = makeList({ rows: [makeBudget({ budget_id: budgetId })] });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    await user.click(screen.getByRole("button", { name: "Скопировать ID" }));
    expect(copyToClipboardMock).toHaveBeenCalledWith(budgetId);
  });

  it("should offer sorting on every backend-sortable column", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList()} />);
    await showColumn(user, "created_at");
    for (const field of ["budget_id", "max_budget", "tpm_limit", "rpm_limit", "created_at"]) {
      expect(screen.getByTestId(`sort-header-${Поле}`)).toBeInTheDocument();
    }
  });

  it("should not make the Сброс column sortable", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList()} />);
    await showColumn(user, "budget_duration");
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toContain("Сброс");
    expect(screen.queryByTestId("sort-header-budget_duration")).not.toBeInTheDocument();
  });

  it("should ask the list for a new sort when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList({ onSortingChange })} />);
    await user.click(screen.getByTestId("sort-header-max_budget"));
    expect(onSortingChange).toHaveBeenCalled();
  });

  it("should show n/a for missing Лимиты запросов and Без ограничений for a missing Макс. бюджет", () => {
    const list = makeList({ rows: [makeBudget({ max_budget: null, tpm_limit: null, rpm_limit: null })] });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    expect(screen.getAllByText("n/a")).toHaveLength(2);
    expect(screen.getByText("Без ограничений")).toBeInTheDocument();
  });

  it("should call onEditНажмите from the Действия menu", async () => {
    const user = userEvent.setup();
    const list = makeList();
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    await user.click(screen.getByTestId("Бюджет-Действия-Бюджет-1"));
    await user.click(await screen.findByTestId("Бюджет-Действие-Изменить"));
    expect(defaultProps.onEditClick).toHaveBeenCalledWith(list.rows[0]);
  });

  it("should call onDeleteНажмите from the Действия menu", async () => {
    const user = userEvent.setup();
    const list = makeList();
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    await user.click(screen.getByTestId("Бюджет-Действия-Бюджет-1"));
    await user.click(await screen.findByTestId("Бюджет-Действие-Удалить"));
    expect(defaultProps.onDeleteClick).toHaveBeenCalledWith(list.rows[0]);
  });

  it("should not render the Действия menu when the Пользователь cannot modify Бюджеты", () => {
    renderWithProviders(<BudgetTable {...defaultProps} canModify={false} list={makeList()} />);
    expect(screen.queryByTestId("Бюджет-Действия-Бюджет-1")).not.toBeInTheDocument();
  });

  it("should show skeleton rows when Загрузка", () => {
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList({ rows: [], isLoading: true })} />);
    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
  });

  it("should show the empty state when there are Нет Бюджеты", () => {
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList({ rows: [], rowCount: 0 })} />);
    expect(screen.getByText("Нет Бюджеты yet")).toBeInTheDocument();
  });

  it("should tell the Пользователь their Поиск matched nothing rather than that Нет Бюджеты exist", () => {
    const list = makeList({ rows: [], rowCount: 0, searchValue: "nope" });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    expect(screen.getByText("Нет matching Бюджеты")).toBeInTheDocument();
  });

  it("should render an access-denied state for a 403 instead of an empty Таблица", () => {
    const error = new ApiError("Only proxy admins can view Бюджеты", 403, FORBIDDEN_PROBLEM);
    const list = makeList({ rows: [], rowCount: 0, error });
    const { container } = renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    expect(screen.getByText("You do not have access to Бюджеты")).toBeInTheDocument();
    expect(screen.queryByText("Нет Бюджеты yet")).not.toBeInTheDocument();
    expect(container.querySelector(".lucide-shield-alert")).not.toBeNull();
  });

  it("should surface the problem detail for a non-403 failure", () => {
    const error = new ApiError("Бюджет store unavailable", 500, null);
    const list = makeList({ rows: [], rowCount: 0, error });
    renderWithProviders(<BudgetTable {...defaultProps} list={list} />);
    expect(screen.getByText("Could not load Бюджеты")).toBeInTheDocument();
    expect(screen.getByText("Бюджет store unavailable")).toBeInTheDocument();
  });
});
