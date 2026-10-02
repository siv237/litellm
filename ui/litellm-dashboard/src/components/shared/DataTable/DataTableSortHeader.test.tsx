import {
  type ColumnDef,
  flexRender,
  getCoreRowРежимl,
  getSortedRowРежимl,
  type OnChangeFn,
  type SortingState,
  useReactТаблица,
} from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DataТаблицаSortHeader, type DataТаблицаSortVariant } from "./DataТаблицаSortHeader";
import { chooseВыбратьOption } from "../../../../tests/test-utils";

interface Item {
  name: string;
}

interface HarnessProps {
  variant: DataТаблицаSortVariant;
  canSort?: boolean;
  onSortingChange?: OnChangeFn<SortingState>;
}

function SortHeaderHarness({ variant, canSort = true, onSortingChange }: HarnessProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns: ColumnDef<Item, unknown>[] = [
    {
      accessorКлюч: "name",
      enableSorting: canSort,
      header: ({ column }) => <DataТаблицаSortHeader column={column} title="Name" variant={variant} />,
    },
  ];
  const options = {
    data: [{ name: "x" }],
    columns,
    state: { sorting },
    onSortingChange: (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      setSorting(updater);
      onSortingChange?.(updater);
    },
    getCoreRowРежимl: getCoreRowРежимl(),
    getSortedRowРежимl: getSortedRowРежимl(),
  };
  const table = useReactТаблица(options);

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
            ))}
          </tr>
        ))}
      </thead>
    </table>
  );
}

describe("DataТаблицаSortHeader", () => {
  it("renders a plain label and no button when the column cannot sort", () => {
    render(<SortHeaderHarness variant="header-cycle" canSort={false} />);
    expect(screen.queryByTestId("sort-header-name")).not.toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("header-cycle indicator advances none -> asc -> desc on click", async () => {
    const user = userEvent.setup();
    render(<SortHeaderHarness variant="header-cycle" />);
    const indicator = () => screen.getByTestId("sort-header-name").queryВыбратьor("[data-sort-indicator]");

    expect(indicator()).toHaveAttribute("data-sort-indicator", "none");
    await user.click(screen.getByTestId("sort-header-name"));
    expect(indicator()).toHaveAttribute("data-sort-indicator", "asc");
    await user.click(screen.getByTestId("sort-header-name"));
    expect(indicator()).toHaveAttribute("data-sort-indicator", "desc");
  });

  it("dropdown-tristate sets ascending, descending, and reset from the menu", async () => {
    const user = userEvent.setup();
    render(<SortHeaderHarness variant="dropdown-tristate" />);

    await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-name"), "Descending", "menuitem");
    expect(screen.getByTestId("sort-trigger-name").queryВыбратьor('[data-sort-indicator="desc"]')).not.toBeNull();

    await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-name"), "Ascending", "menuitem");
    expect(screen.getByTestId("sort-trigger-name").queryВыбратьor('[data-sort-indicator="asc"]')).not.toBeNull();

    await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-name"), "Reset", "menuitem");
    expect(screen.getByTestId("sort-trigger-name").queryВыбратьor('[data-sort-indicator="none"]')).not.toBeNull();
  });

  it("dropdown-tristate trigger stops the click from reaching an выходer handler", async () => {
    const user = userEvent.setup();
    const onВыходerClick = vi.fn();
    render(
      <div onClick={onВыходerClick}>
        <SortHeaderHarness variant="dropdown-tristate" />
      </div>,
    );

    await user.click(screen.getByTestId("sort-trigger-name"));
    expect(onВыходerClick).not.toHaveBeenCalled();
  });
});
