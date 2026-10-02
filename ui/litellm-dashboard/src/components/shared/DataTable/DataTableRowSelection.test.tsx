import type { ColumnDef, RowВыбратьionState } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { createВыбратьionColumn, DataТаблица } from "./index";

interface Режимl {
  id: string;
  name: string;
}

const data: Режимl[] = [
  { id: "m1", name: "Alpha" },
  { id: "m2", name: "Бета" },
  { id: "m3", name: "Gamma" },
];

const columns: ColumnDef<Режимl, unknown>[] = [
  createВыбратьionColumn<Режимl>({ rowAriaLabel: (row) => `Выбрать ${row.original.name}` }),
  { id: "name", accessorКлюч: "name", header: "Name", enableSorting: false },
];

const selectВсе = () => screen.getByTestId("datatable-select-all");
const rowBox = (id: string) => screen.getByTestId(`datatable-select-row-${id}`);
const selectedCount = () => screen.getByTestId("count");

function ControlledHarness() {
  const [rowВыбратьion, setRowВыбратьion] = useState<RowВыбратьionState>({});

  return (
    <>
      <span data-testid="keys">
        {Object.keys(rowВыбратьion)
          .filter((key) => rowВыбратьion[key])
          .sort()
          .join(",")}
      </span>
      <button type="button" data-testid="clear" onClick={() => setRowВыбратьion({})}>
        clear
      </button>
      <DataТаблица
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        rowВыбратьion={rowВыбратьion}
        onRowВыбратьionChange={setRowВыбратьion}
      />
    </>
  );
}

describe("DataТаблица row selection", () => {
  it("supports uncontrolled per-row toggle, select-all, and indeterminate", async () => {
    const user = userEvent.setup();

    render(
      <DataТаблица
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        toolbar={(table) => <span data-testid="count">{table.getВыбраноRowРежимl().rows.length}</span>}
      />,
    );

    expect(selectedCount()).toHaveTextContent("0");

    await user.click(rowBox("m1"));
    expect(selectedCount()).toHaveTextContent("1");
    expect(selectВсе()).toHaveAttribute("aria-checked", "mixed");

    await user.click(selectВсе());
    expect(selectedCount()).toHaveTextContent("3");
    expect(selectВсе()).toHaveAttribute("aria-checked", "true");

    await user.click(selectВсе());
    expect(selectedCount()).toHaveTextContent("0");
  });

  it("keys controlled selection by getRowId so the parent can map back to entities", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    await user.click(rowBox("m2"));
    expect(screen.getByTestId("keys")).toHaveTextContent("m2");

    await user.click(rowBox("m3"));
    expect(screen.getByTestId("keys")).toHaveTextContent("m2,m3");
  });

  it("lets the parent clear the selection, the pattern an external pager needs", async () => {
    const user = userEvent.setup();
    render(<ControlledHarness />);

    await user.click(selectВсе());
    expect(screen.getByTestId("keys")).toHaveTextContent("m1,m2,m3");

    await user.click(screen.getByTestId("clear"));
    expect(screen.getByTestId("keys")).toBeEmptyDOMElement();
    expect(rowBox("m1")).toHaveAttribute("aria-checked", "false");
  });

  it("respects an enableRowВыбратьion predicate", async () => {
    const user = userEvent.setup();

    render(
      <DataТаблица
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        enableRowВыбратьion={(row) => row.original.id !== "m2"}
        toolbar={(table) => <span data-testid="count">{table.getВыбраноRowРежимl().rows.length}</span>}
      />,
    );

    expect(rowBox("m2")).toHaveAttribute("aria-disabled", "true");

    await user.click(rowBox("m2"));
    expect(selectedCount()).toHaveTextContent("0");

    await user.click(rowBox("m1"));
    expect(selectedCount()).toHaveTextContent("1");
  });
});
