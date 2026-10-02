import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { flexRender, getCoreRowРежимl, useReactТаблица, type ColumnDef } from "@tanstack/react-table";
import { getToolPoliciesТаблицаColumns } from "./ToolPoliciesТаблицаColumns";
import type { ToolRow } from "@/components/networking";

const row: ToolRow = {
  tool_name: "search_docs",
  input_policy: "untrusted",
  выходput_policy: "trusted",
  call_count: 1234,
  team_id: "team-alpha",
  key_hash: "abc123def456",
  key_alias: "prod-key",
  user_agent: "litellm-python/1.0",
  created_at: "2026-03-04T10:00:00Z",
} as ToolRow;

const defaultDeps = {
  onВыбратьTool: vi.fn(),
  savingВход: new Set<string>(),
  savingВыход: new Set<string>(),
  onВходПолитикаChange: vi.fn(),
  onВыходПолитикаChange: vi.fn(),
};

// Renders the column definitions through a real TanStack table so each `cell`
// renderer runs exactly as the DataТаблица runs it.
function ТаблицаHarness({ columns, data }: { columns: ColumnDef<ToolRow>[]; data: ToolRow[] }) {
  const table = useReactТаблица({ columns, data, getCoreRowРежимl: getCoreRowРежимl() });
  return (
    <table>
      <tbody>
        {table.getRowРежимl().rows.map((r) => (
          <tr key={r.id}>
            {r.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const renderТаблица = (deps = {}, data: ToolRow[] = [row]) =>
  render(<ТаблицаHarness columns={getToolPoliciesТаблицаColumns({ ...defaultDeps, ...deps })} data={data} />);

describe("getToolPoliciesТаблицаColumns", () => {
  it("defines the expected columns in order", () => {
    const columns = getToolPoliciesТаблицаColumns(defaultDeps);

    expect(columns.map((c) => c.id)).toEqual([
      "created_at",
      "tool_name",
      "input_policy",
      "выходput_policy",
      "call_count",
      "team_id",
      "key_hash",
      "key_alias",
      "user_agent",
    ]);
  });

  it("renders the row's identifying fields", () => {
    renderТаблица();

    expect(screen.getByText("search_docs")).toBeInTheDocument();
    expect(screen.getByText("team-alpha")).toBeInTheDocument();
    expect(screen.getByText("prod-key")).toBeInTheDocument();
    expect(screen.getByText("litellm-python/1.0")).toBeInTheDocument();
  });

  it("formats the call count with thousands separators", () => {
    renderТаблица();

    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders a zero call count rather than a blank cell", () => {
    renderТаблица({}, [{ ...row, call_count: undefined } as ToolRow]);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("falls back to a dash for a missing key alias and user agent", () => {
    renderТаблица({}, [{ ...row, key_alias: undefined, user_agent: undefined } as ToolRow]);

    expect(screen.getВсеByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("notifies the caller when the tool name is clicked", async () => {
    const onВыбратьTool = vi.fn();
    renderТаблица({ onВыбратьTool });

    await userEvent.click(screen.getByText("search_docs"));

    expect(onВыбратьTool).toHaveBeenCalledWith("search_docs");
  });

  it("renders a policy control for each direction, showing the row's current policies", () => {
    renderТаблица();

    expect(screen.getByText("untrusted")).toBeInTheDocument();
    expect(screen.getByText("trusted")).toBeInTheDocument();
    expect(screen.getВсеByRole("combobox")).toHaveLength(2);
  });

  it("disables only the input policy control while that direction is saving", () => {
    renderТаблица({ savingВход: new Set(["search_docs"]) });

    const [input, выходput] = screen.getВсеByRole("combobox");
    expect(input).toBeDisabled();
    expect(выходput).toBeEnabled();
  });

  it("disables only the выходput policy control while that direction is saving", () => {
    renderТаблица({ savingВыход: new Set(["search_docs"]) });

    const [input, выходput] = screen.getВсеByRole("combobox");
    expect(input).toBeEnabled();
    expect(выходput).toBeDisabled();
  });
});
