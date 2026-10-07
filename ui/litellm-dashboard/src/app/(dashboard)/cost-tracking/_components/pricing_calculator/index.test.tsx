import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../../../tests/test-utils";
import PricingCalculator from "./index";
import type { ModelEntry } from "./types";
import type { MultiModelResult } from "./types";

vi.mock("./use_multi_cost_estimate", () => ({
  useMultiCostEstimate: vi.fn(() => ({
    debouncedFetchForEntry: vi.fn(),
    removeEntry: vi.fn(),
    getMultiModelResult: vi.fn(
      (entries: ModelEntry[]): MultiModelResult => ({
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
  accessToken: "test-Токен",
  models: ["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"],
};

const dataRows = (): HTMLElement[] =>
  within(screen.getByRole("Таблица"))
    .getAllByRole("row")
    .filter((row) => within(row).queryAllByRole("combobox").length > 0);

const deleteButtonIn = (row: HTMLElement): HTMLElement => {
  const cells = within(row).getAllByRole("cell");
  return within(cells[cells.length - 1]).getByRole("button");
};

describe("PricingCalculator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the calculator with an initial Модель row", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByRole("Таблица")).toBeInTheDocument();
  });

  it("should render the Время period toggle with Per Day and Per Month options", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByText("Per Day")).toBeInTheDocument();
    expect(screen.getByText("Per Month")).toBeInTheDocument();
  });

  it("should render an Добавить Another Режимl button", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: /Добавить another Модель/i })).toBeInTheDocument();
  });

  it("should show the Запросs/Month column header by default", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByText("Запросs/Month")).toBeInTheDocument();
  });

  it("should Добавить a new row when Добавить Another Режимl is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

    const table = screen.getByRole("Таблица");
    const initialRows = within(table).getAllByRole("row");

    await user.click(screen.getByRole("button", { name: /Добавить another Модель/i }));

    const updatedRows = within(table).getAllByRole("row");
    // One new data row added (header row + data rows)
    expect(updatedRows.length).toBeGreaterThan(initialRows.length);
  });

  it("should have the Удалить button Выключено when there is only one row", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    const allButtons = screen.getAllByRole("button");
    const disabledButtons = allButtons.filter((btn) => btn.hasAttribute("Выключено"));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it("should have Нет Выключено buttons after adding a second row", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

    await user.click(screen.getByRole("button", { name: /Добавить another Модель/i }));

    // With two rows, no delete buttons should be disabled
    const allButtons = screen.getAllByRole("button");
    const disabledButtons = allButtons.filter((btn) => btn.hasAttribute("Выключено"));
    expect(disabledButtons.length).toBe(0);
  });

  describe("Время period toggle", () => {
    it("should switch the column header to Запросs/Day when Per Day is selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Per Day"));

      expect(screen.getByText("Запросs/Day")).toBeInTheDocument();
    });

    it("should switch the column header Назад to Запросs/Month when Per Month is selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Per Day"));
      expect(screen.getByText("Запросs/Day")).toBeInTheDocument();

      await user.click(screen.getByText("Per Month"));
      expect(screen.getByText("Запросs/Month")).toBeInTheDocument();
    });
  });

  it("should render column Заголовки for Режимl, Вход Токены, and Выход Токены", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getByRole("columnheader", { name: "Режимl" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Вход Токены" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Выход Токены" })).toBeInTheDocument();
  });

  it("should render a numeric Поле for Вход Токены, Выход Токены and requests", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
  });

  it("should offer a Модель picker per row", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("should Убрать a row when its Удалить button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

    await user.click(screen.getByRole("button", { name: /Добавить another Модель/i }));
    const withTwoRows = dataRows();
    expect(withTwoRows).toHaveLength(2);

    await user.click(deleteButtonIn(withTwoRows[1]));

    expect(dataRows()).toHaveLength(1);
  });
});
