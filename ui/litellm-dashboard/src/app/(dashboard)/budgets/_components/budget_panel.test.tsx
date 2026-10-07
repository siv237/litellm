import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/http/client";

import BudgetPanel from "./budget_panel";

const { getMock, budgetDeleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  budgetDeleteMock: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  apiClient: { get: getMock },
  budgetCreateCall: vi.fn(),
  budgetUpdateCall: vi.fn(),
  budgetDeleteCall: budgetDeleteMock,
  getProxyBaseUrl: () => "",
}));

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessToken: "sk-test", userRole: "Admin", userId: "u1" }),
}));

interface BudgetSeed {
  budget_id: string;
  max_budget: number | null;
  budget_duration: string | null;
}

const budgetRow = (seed: BudgetSeed) => ({
  soft_budget: null,
  tpm_limit: 1000,
  rpm_limit: 10,
  budget_reset_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...seed,
});

const FORBIDDEN_PROBLEM = {
  type: "about:blank",
  title: "Forbidden",
  status: 403,
  detail: "Only proxy admins can view Бюджеты",
};

const DEFAULT_ROWS = [
  budgetRow({ budget_id: "ecc1869c-6231-4380-a56d-1a0be457477d", max_budget: 100, budget_duration: "30d" }),
];

const respondWith = (rows: ReturnType<typeof budgetRow>[], totalCount: number) => {
  getMock.mockResolvedValue({
    data: rows,
    meta: { total_count: totalCount, page: 1, page_size: 50, total_pages: Math.ceil(totalCount / 50) },
  });
};

type QueryRecord = Record<string, string | number>;

const queries = (): QueryRecord[] => getMock.mock.calls.map((call) => (call[1] as { query: QueryRecord }).query);
const lastQuery = (): QueryRecord => queries()[queries().length - 1];
const paths = (): string[] => getMock.mock.calls.map((call) => String(call[0]));

const renderPanel = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <BudgetPanel accessToken="sk-test" />
    </QueryClientProvider>,
  );
};

const openFilters = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("datatable-Фильтры-trigger"));
  await screen.findByTestId("filter-drawer-body");
};

describe("Бюджет Panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    respondWith(DEFAULT_ROWS, 1);
  });

  it("renders the standard page header with the sidebar's Бюджеты icon", async () => {
    const { container } = renderPanel();

    expect(await screen.findByRole("heading", { level: 1, name: "Бюджеты" })).toBeInTheDocument();
    expect(screen.getByText("Расход, TPM and RPM limits you can assign to customers.")).toBeInTheDocument();
    expect(container.querySelector(".lucide-wallet")).not.toBeNull();
  });

  it("loads the first page of Бюджеты, newest first", async () => {
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());
    expect(paths()[0]).toBe("/management/v1/Бюджеты");
    expect(queries()[0]).toEqual({ page: 1, page_size: 50, sort: "-created_at" });
    expect(await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d")).toBeInTheDocument();
  });

  it("asks the server to sort when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await user.click(screen.getByTestId("sort-header-max_budget"));
    await waitFor(() => expect(lastQuery().sort).toBe("-max_budget"));

    await user.click(screen.getByTestId("sort-header-max_budget"));
    await waitFor(() => expect(lastQuery().sort).toBe("max_budget"));

    await user.click(screen.getByTestId("sort-header-budget_id"));
    await waitFor(() => expect(lastQuery().sort).toBe("budget_id"));
  });

  it("searches on budget_id with a debounced q", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    fireEvent.change(screen.getByTestId("datatable-Поиск"), { target: { value: "ecc" } });
    await waitFor(() => expect(lastQuery().q).toBe("ecc"));
    expect(queries().some((query) => query.q === "e" || query.q === "ec")).toBe(false);
  });

  it("Фильтры by Сброс Длительность and clears it again", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    await user.click(screen.getByTestId("Бюджет-filter-Длительность-7d"));
    await user.click(screen.getByTestId("Бюджет-filter-Длительность-30d"));
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() => expect(lastQuery()["filter[budget_duration][in]"]).toBe("7d,30d"));

    await user.click(screen.getByTestId("filter-chip-Убрать-budget_duration"));
    await waitFor(() => expect(lastQuery()).not.toHaveProperty("filter[budget_duration][in]"));
  });

  it("Фильтры by Бюджеты with Без сброса Длительность", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    await user.click(screen.getByTestId("Бюджет-filter-Длительность-__unset__"));
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() => expect(lastQuery()["filter[budget_duration][is_null]"]).toBe("Истина"));
    expect(lastQuery()).not.toHaveProperty("filter[budget_duration][in]");
  });

  it("Фильтры by a Макс. бюджет range and clears it again", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    fireEvent.change(screen.getByTestId("Бюджет-filter-Макс.-Бюджет-Мин."), { target: { value: "10" } });
    fireEvent.change(screen.getByTestId("Бюджет-filter-Макс.-Бюджет-Макс."), { target: { value: "500" } });
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() => expect(lastQuery()["filter[max_budget][gte]"]).toBe("10"));
    expect(lastQuery()["filter[max_budget][lte]"]).toBe("500");

    await user.click(screen.getByTestId("datatable-clear-Фильтры"));
    await waitFor(() => expect(lastQuery()).not.toHaveProperty("filter[max_budget][gte]"));
    expect(lastQuery()).not.toHaveProperty("filter[max_budget][lte]");
  });

  it("Фильтры to Без ограничений Бюджеты only", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    fireEvent.change(screen.getByTestId("Бюджет-filter-Макс.-Бюджет-Мин."), { target: { value: "10" } });
    await user.click(screen.getByTestId("Бюджет-filter-Макс.-Бюджет-Без ограничений"));
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() => expect(lastQuery()["filter[max_budget][is_null]"]).toBe("Истина"));
    expect(lastQuery()).not.toHaveProperty("filter[max_budget][gte]");
  });

  it("Фильтры by a Создан date range covering whole local days", async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await openFilters(user);
    fireEvent.change(screen.getByTestId("Бюджет-filter-Создан-from"), { target: { value: "2026-01-05" } });
    fireEvent.change(screen.getByTestId("Бюджет-filter-Создан-to"), { target: { value: "2026-01-06" } });
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() =>
      expect(lastQuery()["filter[created_at][gte]"]).toBe(new Date("2026-01-05T00:00:00.000").toISOString()),
    );
    expect(lastQuery()["filter[created_at][lte]"]).toBe(new Date("2026-01-06T23:59:59.999").toISOString());
  });

  it("pages through the results and changes page size", async () => {
    const user = userEvent.setup();
    respondWith(DEFAULT_ROWS, 400);
    renderPanel();
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    await user.click(screen.getByTestId("pagination-Далее"));
    await waitFor(() => expect(lastQuery().page).toBe(2));
    expect(lastQuery().page_size).toBe(50);

    await user.click(screen.getByTestId("pagination-page-size"));
    await user.click(await screen.findByRole("option", { name: "25" }));
    await waitFor(() => expect(lastQuery().page_size).toBe(25));
  });

  it("renders an access-denied state when the route rejects the caller", async () => {
    getMock.mockRejectedValue(new ApiError("Only proxy admins can view Бюджеты", 403, FORBIDDEN_PROBLEM));
    renderPanel();
    expect(await screen.findByText("You do not have access to Бюджеты")).toBeInTheDocument();
    expect(screen.queryByText("Нет Бюджеты yet")).not.toBeInTheDocument();
  });

  it("deletes a Бюджет from the Действия menu", async () => {
    const user = userEvent.setup();
    budgetDeleteMock.mockResolvedValue(undefined);
    renderPanel();
    await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d");

    await user.click(screen.getByTestId("Бюджет-Действия-ecc1869c-6231-4380-a56d-1a0be457477d"));
    await user.click(await screen.findByTestId("Бюджет-Действие-Удалить"));
    await screen.findByText("Удалить бюджет?");
    await user.click(screen.getByRole("button", { name: /^Удалить$/i }));

    await waitFor(() =>
      expect(budgetDeleteMock).toHaveBeenCalledWith("sk-test", "ecc1869c-6231-4380-a56d-1a0be457477d"),
    );
  });

  it("refetches the current page after a Удалить", async () => {
    const user = userEvent.setup();
    budgetDeleteMock.mockResolvedValue(undefined);
    renderPanel();
    await screen.findByText("ecc1869c-6231-4380-a56d-1a0be457477d");
    const before = getMock.mock.calls.length;

    await user.click(screen.getByTestId("Бюджет-Действия-ecc1869c-6231-4380-a56d-1a0be457477d"));
    await user.click(await screen.findByTestId("Бюджет-Действие-Удалить"));
    await screen.findByText("Удалить бюджет?");
    await user.click(screen.getByRole("button", { name: /^Удалить$/i }));

    await waitFor(() => expect(getMock.mock.calls.length).toBeGreaterThan(before));
  });
});
