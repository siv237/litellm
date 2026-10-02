import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "../../../../../../tests/test-utils";
import PricingCalculator from "./index";
import type { РежимlEntry } from "./types";
import type { MultiРежимlРезультат } from "./types";

vi.mock("./use_multi_cost_estimate", () => ({
  useMultiСтоимостьEstimate: vi.fn(() => ({
    debouncedFetchForEntry: vi.fn(),
    removeEntry: vi.fn(),
    getMultiРежимlРезультат: vi.fn(
      (entries: РежимlEntry[]): MultiРежимlРезультат => ({
        entries: entries.map((e) => ({ entry: e, result: null, loading: false, error: null })),
        totals: {
          cost_per_request: 0,
          daily_cost: null,
          monthly_cost: null,
          margin_per_request: 0,
          daily_margin: null,
          monthly_margin: null,
        },
      }),
    ),
  })),
}));

vi.mock("./multi_export_utils", () => ({
  exportMultiToPDF: vi.fn(),
  exportMultiToCSV: vi.fn(),
}));

vi.mock("@/utils/dataUtils", () => ({
  formatNumberWithCommas: vi.fn((v: number, d: number = 0) => (Number.isFinite(v) ? v.toFixed(d) : "-")),
}));

const DEFAULT_PROPS = {
  accessТокен: "test-token",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"],
};

const dataRows = (): HTMLElement[] =>
  within(screen.getByRole("table"))
    .getВсеByRole("row")
    .filter((row) => within(row).queryВсеByRole("combobox").length > 0);

const deleteButtonIn = (row: HTMLElement): HTMLElement => {
  const cells = within(row).getВсеByRole("cell");
  return within(cells[cells.length - 1]).getByRole("button");
};

describe("PricingCalculator", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should render the calculator with an initial Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию row", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("should render the time period toggle with Per Day and Per Month options", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByText("Per Day")).toBeInTheDocument();
    expect(screen.getByText("Per Month")).toBeInTheDocument();
  });

  it("should render an Add Another Режимl button", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: /add another Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i })).toBeInTheDocument();
  });

  it("should show the Запросs/Month column header by default", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByText("Запросs/Month")).toBeInTheDocument();
  });

  it("should add a new row when Add Another Режимl is clicked", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);

    const table = screen.getByRole("table");
    const initialRows = within(table).getВсеByRole("row");

    await user.click(screen.getByRole("button", { name: /add another Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i }));

    const updatedRows = within(table).getВсеByRole("row");
    // One new data row added (header row + data rows)
    expect(updatedRows.length).toBeGreaterThan(initialRows.length);
  });

  it("should have the delete button disabled when there is only one row", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    const allButtons = screen.getВсеByRole("button");
    const disabledButtons = allButtons.filter((btn) => btn.hasAttribute("disabled"));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it("should have no disabled buttons after adding a second row", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);

    await user.click(screen.getByRole("button", { name: /add another Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i }));

    // With two rows, no delete buttons should be disabled
    const allButtons = screen.getВсеByRole("button");
    const disabledButtons = allButtons.filter((btn) => btn.hasAttribute("disabled"));
    expect(disabledButtons.length).toBe(0);
  });

  describe("time period toggle", () => {
    it("should switch the column header to Запросs/Day when Per Day is selected", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Per Day"));

      expect(screen.getByText("Запросs/Day")).toBeInTheDocument();
    });

    it("should switch the column header back to Запросs/Month when Per Month is selected", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Per Day"));
      expect(screen.getByText("Запросs/Day")).toBeInTheDocument();

      await user.click(screen.getByText("Per Month"));
      expect(screen.getByText("Запросs/Month")).toBeInTheDocument();
    });
  });

  it("should render column headers for Режимl, Вход Токенs, and Выход Токенs", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByRole("columnheader", { name: "Режимl" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Вход Токенs" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Выход Токенs" })).toBeInTheDocument();
  });

  it("should render a numeric field for input tokens, выходput tokens and requests", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getВсеByRole("spinbutton")).toHaveLength(3);
  });

  it("should offer a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию picker per row", () => {
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getВсеByRole("combobox")).toHaveLength(1);
  });

  it("should remove a row when its delete button is clicked", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<PricingCalculator {...DEFAULT_PROPS} />);

    await user.click(screen.getByRole("button", { name: /add another Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i }));
    const withTwoRows = dataRows();
    expect(withTwoRows).toHaveLength(2);

    await user.click(deleteButtonIn(withTwoRows[1]));

    expect(dataRows()).toHaveLength(1);
  });
});
