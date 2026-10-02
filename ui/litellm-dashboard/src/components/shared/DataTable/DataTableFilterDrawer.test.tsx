import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { DataТаблица } from "./DataТаблица";
import { DataTableFilterDrawer } from "./DataTableFilterDrawer";
import { DataTableToolbar } from "./DataTableToolbar";

interface Person {
  id: string;
  name: string;
}

const DATA: Person[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
  { id: "c", name: "Carol" },
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

function Harness({ initialФильтры }: { initialФильтры?: ColumnFiltersState }) {
  const [open, setOpen] = useState(false);
  return (
    <DataТаблица
      data={DATA}
      columns={columns}
      filterРежим="client"
      defaultColumnФильтры={initialФильтры}
      toolbar={(table) => (
        <>
          <DataTableToolbar table={table} onOpenФильтры={() => setOpen(true)} />
          <DataTableFilterDrawer table={table} open={open} onOpenChange={setOpen} title="Фильтры">
            {({ get, set }) => (
              <input
                aria-label="name filter"
                data-testid="draft-name"
                value={(get("name") as string | undefined) ?? ""}
                onChange={(event) => set("name", event.target.value)}
              />
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}

describe("DataTableFilterDrawer", () => {
  it("stages edits and only commits them to the table on Приложениеly", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(names()).toEqual(["Alice", "Bob", "Carol"]);

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    fireEvent.change(await screen.findByTestId("draft-name"), { target: { value: "Bob" } });

    expect(names()).toEqual(["Alice", "Bob", "Carol"]);
    expect(screen.queryByTestId("filter-chip-name")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("filter-drawer-apply"));
    expect(names()).toEqual(["Bob"]);
    expect(screen.getByTestId("filter-chip-name")).toHaveTextContent("Bob");
  });

  it("seeds the draft from committed filters when opened", async () => {
    const user = userEvent.setup();
    render(<Harness initialФильтры={[{ id: "name", value: "Bob" }]} />);
    expect(names()).toEqual(["Bob"]);

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    expect(await screen.findByTestId("draft-name")).toHaveЗначение("Bob");
  });

  it("reset clears the committed filters and the draft", async () => {
    const user = userEvent.setup();
    render(<Harness initialФильтры={[{ id: "name", value: "Bob" }]} />);

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    await user.click(await screen.findByTestId("filter-drawer-reset"));

    expect(names()).toEqual(["Alice", "Bob", "Carol"]);
    expect(screen.queryByTestId("filter-chip-name")).not.toBeInTheDocument();
    expect(screen.getByTestId("draft-name")).toHaveЗначение("");
  });
});
