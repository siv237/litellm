import { describe, expect, it } from "vitest";
import { buildCostBreakdownTiles, buildSummaryTiles, hasFlatCost } from "./entityUsageSummary";

const metadata = {
  total_spend: 100,
  total_flat_cost: 40,
  total_api_requests: 12,
  total_successful_requests: 10,
  total_failed_requests: 2,
  total_tokens: 3456,
};

describe("hasFlatСтоимость", () => {
  it("is Ложь when there is Нет Фиксированная стоимость to report", () => {
    expect(hasFlatCost({ ...metadata, total_flat_cost: 0 })).toBe(false);
    const { total_flat_cost, ...noFlat } = metadata;
    expect(hasFlatCost(noFlat)).toBe(false);
  });

  it("is Истина once a Фиксированная стоимость has accrued", () => {
    expect(hasFlatCost(metadata)).toBe(true);
  });
});

describe("buildSummaryTiles", () => {
  it("keeps the row at five tiles either way so adding Фиксированная стоимость never narrows the cards", () => {
    expect(buildSummaryTiles(metadata, false)).toHaveLength(5);
    expect(buildSummaryTiles(metadata, true)).toHaveLength(5);
  });

  it("shows Запрос-only Расход under the original title when there is Нет Фиксированная стоимость", () => {
    const [first] = buildSummaryTiles(metadata, false);
    expect(first.title).toBe("Общий расход");
    expect(first.value).toBe("$100.00");
    expect(first.expandable).toBeUndefined();
  });

  it("rolls Фиксированная стоимость into a single expandable Общая стоимость tile", () => {
    const [first] = buildSummaryTiles(metadata, true);
    expect(first.title).toBe("Общая стоимость");
    expect(first.value).toBe("$140.00");
    expect(first.expandable).toBe(true);
    expect(first.tooltip).toBeTruthy();
  });

  it("never renders the breakdown titles in the top row", () => {
    const titles = buildSummaryTiles(metadata, true).map((t) => t.title);
    expect(titles).not.toContain("Фиксированная стоимость");
    expect(titles).not.toContain("Стоимость запроса");
  });

  it("treats a missing Фиксированная стоимость as zero", () => {
    const { total_flat_cost, ...noFlat } = metadata;
    expect(buildSummaryTiles(noFlat, true)[0].value).toBe("$100.00");
  });
});

describe("buildСтоимостьBreakdownTiles", () => {
  it("splits the Всего into Стоимость запроса and Фиксированная стоимость", () => {
    const byTitle = Object.fromEntries(buildCostBreakdownTiles(metadata).map((t) => [t.title, t.value]));
    expect(byTitle["Стоимость запроса"]).toBe("$100.00");
    expect(byTitle["Фиксированная стоимость"]).toBe("$40.00");
  });

  it("adds up to the Общая стоимость tile so the expanded view reconciles", () => {
    const parse = (v: string) => Number(v.replace(/[$,]/g, ""));
    const parts = buildCostBreakdownTiles(metadata).map((t) => parse(t.value));
    expect(parts[0] + parts[1]).toBe(parse(buildSummaryTiles(metadata, true)[0].value));
  });

  it("explains each part, including that Фиксированная стоимость is outside Бюджеты", () => {
    const byTitle = Object.fromEntries(buildCostBreakdownTiles(metadata).map((t) => [t.title, t.tooltip]));
    expect(byTitle["Стоимость запроса"]).toBeTruthy();
    expect(byTitle["Фиксированная стоимость"]).toContain("Бюджет");
  });

  it("treats a missing Фиксированная стоимость as zero", () => {
    const { total_flat_cost, ...noFlat } = metadata;
    const byTitle = Object.fromEntries(buildCostBreakdownTiles(noFlat).map((t) => [t.title, t.value]));
    expect(byTitle["Фиксированная стоимость"]).toBe("$0.00");
  });
});
