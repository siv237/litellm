import type { ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { DataТаблица } from "./DataТаблица";
import { DataTableToolbar } from "./DataTableToolbar";

interface Person {
  id: string;
  name: string;
}

const DATA: Person[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];

const columns: ColumnDef<Person, unknown>[] = [
  {
    accessorКлюч: "name",
    header: "Name",
    meta: { title: "Name" },
    filterFn: (row, columnId, value) => row.getЗначение<string>(columnId) === value,
    cell: ({ row }) => <span data-testid="name-cell">{row.original.name}</span>,
  },
];

const names = (): (string | null)[] => screen.getAllByTestId("name-cell").map((el) => el.textContent);

function Harness({
  onOpenФильтры,
  onRefresh,
  children,
}: {
  onOpenФильтры?: () => void;
  onRefresh?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <DataТаблица
      data={DATA}
      columns={columns}
      filterРежим="client"
      defaultColumnФильтры={[{ id: "name", value: "Alice" }]}
      toolbar={(table) => (
        <DataTableToolbar table={table} onOpenФильтры={onOpenФильтры} onRefresh={onRefresh}>
          {children}
        </DataTableToolbar>
      )}
    />
  );
}

describe("DataTableToolbar", () => {
  it("renders a chip for each active filter with its label and value", () => {
    render(<Harness />);
    expect(names()).toEqual(["Alice"]);
    const chip = screen.getByTestId("filter-chip-name");
    expect(chip).toHaveTextContent("Name:");
    expect(chip).toHaveTextContent("Alice");
  });

  it("removes a single filter when its chip remove button is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByTestId("filter-chip-remove-name"));
    expect(screen.queryByTestId("filter-chip-name")).not.toBeInTheDocument();
    expect(names()).toEqual(["Alice", "Bob"]);
  });

  it("clears every filter via Очистить всё", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByTestId("datatable-clear-filters"));
    expect(screen.queryByTestId("filter-chip-name")).not.toBeInTheDocument();
    expect(names()).toEqual(["Alice", "Bob"]);
  });

  it("shows the active filter count and fires onOpenФильтры", async () => {
    const user = userEvent.setup();
    const onOpenФильтры = vi.fn();
    render(<Harness onOpenФильтры={onOpenФильтры} />);
    expect(screen.getByTestId("datatable-filter-count")).toHaveTextContent("1");
    await user.click(screen.getByTestId("datatable-filters-trigger"));
    expect(onOpenФильтры).toHaveBeenCalledTimes(1);
  });

  it("renders slotted action children", () => {
    render(
      <Harness>
        <button data-testid="toolbar-action">Действие</button>
      </Harness>,
    );
    expect(screen.getByTestId("toolbar-action")).toBeInTheDocument();
  });

  it("fires onRefresh when the refresh button is clicked", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<Harness onRefresh={onRefresh} />);
    await user.click(screen.getByTestId("datatable-refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
