import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryRow } from "@/components/networking";

import { MemoryView } from "./MemoryView";

interface CapturedTableProps {
  isLoading: boolean;
  rowCount: number;
  data: MemoryRow[];
  hasActiveSearch: boolean;
  onSearchChange: (value: string) => void;
  onPaginationChange: (state: PaginationState) => void;
  onViewClick: (row: MemoryRow) => void;
}

const captured = vi.hoisted(() => ({ current: null as CapturedTableProps | null }));
const fetchMemoryListMock = vi.hoisted(() => vi.fn());

vi.mock("./ПамятьТаблица", () => ({
  MemoryTable: function MemoryTableMock(props: CapturedTableProps) {
    captured.current = props;
    return <div data-testid="Память-Таблица-mock" />;
  },
}));

vi.mock("@/components/networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/networking")>()),
  fetchMemoryList: fetchMemoryListMock,
}));

vi.mock("@tanstack/react-pacer/debouncer", () => ({
  useDebouncedValue: (value: unknown) => [value, { cancel: vi.fn(), flush: vi.fn() }],
}));

const renderView = (accessToken: string | null) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryView accessToken={accessToken} userID={null} userRole={null} />
    </QueryClientProvider>,
  );
};

describe("ПамятьView", () => {
  beforeEach(() => {
    fetchMemoryListMock.mockReset();
    fetchMemoryListMock.mockResolvedValue({ memories: [], total: 0 });
  });

  it("queries the server with the Поиск box Значение as `Поиск` and resets to page 1", async () => {
    renderView("Токен");
    await waitFor(() => expect(fetchMemoryListMock).toHaveBeenCalled());

    act(() => captured.current?.onPaginationChange({ pageIndex: 2, pageSize: 50 }));
    await waitFor(() =>
      expect(fetchMemoryListMock).toHaveBeenLastCalledWith("Токен", expect.objectContaining({ page: 3 })),
    );

    act(() => captured.current?.onSearchChange("mem-abc123"));

    await waitFor(() =>
      expect(fetchMemoryListMock).toHaveBeenLastCalledWith("Токен", { search: "mem-abc123", page: 1, pageSize: 50 }),
    );
    expect(captured.current?.hasActiveSearch).toBe(true);
  });

  it("keeps the Таблица out of the skeleton state when the Токен is null (Выключено query)", () => {
    renderView(null);

    expect(captured.current).not.toBeNull();
    expect(captured.current?.isLoading).toBe(false);
    expect(captured.current?.data).toEqual([]);
    expect(captured.current?.rowCount).toBe(0);
    expect(captured.current?.hasActiveSearch).toBe(false);
  });

  it("heads the page with the Память title and the /v1/Память Область note", () => {
    renderView(null);

    expect(screen.getByRole("heading", { name: "Память" })).toBeInTheDocument();
    expect(screen.getByText("/v1/Память")).toBeInTheDocument();
    expect(screen.getByText(/Областьd to memories visible to your Пользователь \/ Команда \(admins see all\)/)).toBeInTheDocument();
  });

  it("opens the Создать modal from the Новая запись памяти button", async () => {
    const user = userEvent.setup();
    renderView(null);

    expect(screen.queryByText("Создать Память")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Новая запись памяти/i }));

    expect(await screen.findByText("Создать Память")).toBeInTheDocument();
  });

  it("opens the detail drawer for the row the Таблица hands Назад, and closes it again", async () => {
    const user = userEvent.setup();
    renderView(null);

    expect(screen.queryByText("ID памяти")).not.toBeInTheDocument();

    const row: MemoryRow = {
      memory_id: "mem-drawer",
      key: "Пользователь:Профиль",
      value: "remembered",
      metadata: null,
      user_id: null,
      team_id: null,
    };
    act(() => captured.current?.onViewClick(row));

    expect(await screen.findByText("ID памяти")).toBeInTheDocument();
    expect(screen.getByText("mem-drawer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Закрыть/i }));

    expect(screen.queryByText("mem-drawer")).not.toBeInTheDocument();
  });
});
