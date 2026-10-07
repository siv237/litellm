import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, renderWithProviders, screen, testQueryClient, chooseSelectOption } from "../../../tests/test-utils";
import { SHIPPED_SCORER_DEFAULTS } from "../../../tests/mocks/complexityScorerDefaults";
import HeuristicScoringConfig from "./HeuristicScoringConfig";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { getComplexityScorerDefaults } from "@/components/networking";

vi.mock("@/components/networking", () => ({ getComplexityScorerDefaults: vi.fn() }));

const base: ComplexityRouterConfigValue = {
  classifier_type: "heuristic",
  tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: [] },
};
function Editor({ initial = base }: { initial?: ComplexityRouterConfigValue }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <HeuristicScoringConfig value={value} onChange={setValue} />
      <output aria-label="Черновик Конфигурация">{JSON.stringify(value)}</output>
    </>
  );
}
const draft = (): ComplexityRouterConfigValue => JSON.parse(screen.getByLabelText("Черновик Конфигурация").textContent!);

beforeEach(() => {
  testQueryClient.clear();
  vi.mocked(getComplexityScorerDefaults).mockResolvedValue(SHIPPED_SCORER_DEFAULTS);
});

describe("combined heuristic editor", () => {
  it("adds and edits a graded dimension, rebalances builtins, preserves matcher-only edits, and removes it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Editor />);
    await user.click(screen.getByText("Расширенное оценивание"));
    expect(await screen.findByRole("button", { name: "Restore default weights" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Добавить своё измерение" }));
    expect(screen.getByRole("button", { name: "Restore default weights" })).toBeEnabled();
    expect(draft().dimension_weights?.codePresence).toBeCloseTo(0.27, 12);
    expect(draft().custom_dimensions?.[0].scoring_mode).toBe("match_count");
    expect(screen.getByRole("group", { name: "Своё измерение 1" })).toContainElement(
      screen.getByLabelText("Название", { exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Название", { exact: true }), { target: { value: "domain" } });
    fireEvent.change(screen.getByLabelText("Ключевые слова (по одному в строке)"), { target: { value: "orbitmesh\nfluxgate" } });
    fireEvent.change(screen.getByLabelText("Вес", { exact: true }), { target: { value: "0.2" } });
    expect(screen.getByLabelText("Code presence", { exact: true })).toHaveValue("0.24");
    expect(screen.getByTestId("dimension-Вес-Всего")).toHaveTextContent("Всего 1.00");
    const beforeMatchers = draft().dimension_weights;
    fireEvent.change(screen.getByLabelText("Regex patterns (по одному в строке)"), { target: { value: "abc" } });
    await chooseSelectOption(user, screen.getByLabelText("Оценивание"), "Бинарный");
    expect(draft().dimension_weights).toEqual(beforeMatchers);
    expect(draft().custom_dimensions?.[0].scoring_mode).toBe("Бинарный");
    await user.click(screen.getByRole("button", { name: "Убрать Своё измерение 1" }));
    expect(draft().custom_dimensions).toBeUndefined();
    expect(draft().dimension_weights?.codePresence).toBeCloseTo(0.3, 12);
  });

  it("preserves a legacy vector on load and resets both fields only when requested", async () => {
    const legacy = {
      ...base,
      dimension_weights: { codePresence: 0.4 },
      custom_dimensions: [{ id: "stored-0", name: "domain", weight: 0.7, keywords: ["a"] }],
    };
    renderWithProviders(<Editor initial={legacy} />);
    await userEvent.click(screen.getByText("Расширенное оценивание"));
    expect(await screen.findByTestId("dimension-Вес-Всего")).toHaveTextContent("Всего 1.10");
    expect(draft()).toEqual(legacy);
    expect(screen.getByLabelText("Токен count", { exact: true })).toHaveValue("0");
    await userEvent.click(screen.getByRole("button", { name: "Restore default weights" }));
    expect(draft().custom_dimensions).toBeUndefined();
    expect(draft().dimension_weights).toBeUndefined();
  });

  it("drops hidden custom drafts on a fallback-only Вес Изменить so switching Назад cannot exceed the Бюджет", async () => {
    const initial: ComplexityRouterConfigValue = {
      ...base,
      classifier_type: "llm",
      classifier_fallback: "heuristic",
      custom_dimensions: [{ id: "a", name: "domain", weight: 0.7, keywords: ["a"] }],
    };
    renderWithProviders(<Editor initial={initial} />);
    await userEvent.click(screen.getByText("Расширенное оценивание"));
    fireEvent.change(await screen.findByLabelText("Code presence", { exact: true }), { target: { value: "0.5" } });
    expect(draft().custom_dimensions).toBeUndefined();
    expect(Object.values(draft().dimension_weights!).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 12);
    expect(screen.queryByRole("button", { name: "Добавить своё измерение" })).not.toBeInTheDocument();
  });
});
