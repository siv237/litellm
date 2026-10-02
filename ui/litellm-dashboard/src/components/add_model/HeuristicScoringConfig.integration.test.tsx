import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent, renderWithПровайдерs, screen, testЗапросClient, chooseВыбратьOption } from "../../../tests/test-utils";
import { SHIPPED_SCORER_DEFAULTS } from "../../../tests/mocks/complexityОценкаrDefaults";
import HeuristicОцениваниеКонфигурация from "./HeuristicОцениваниеКонфигурация";
import type { — сложностьRвыходerКонфигурацияЗначение } from "./— сложностьRвыходerКонфигурация";
import { get— сложностьОценкаrDefaults } from "@/components/networking";

vi.mock("@/components/networking", () => ({ get— сложностьОценкаrDefaults: vi.fn() }));

const base: — сложностьRвыходerКонфигурацияЗначение = {
  classifier_type: "heuristic",
  tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: [] },
};
function Editor({ initial = base }: { initial?: — сложностьRвыходerКонфигурацияЗначение }) {
  const [value, setЗначение] = useState(initial);
  return (
    <>
      <HeuristicОцениваниеКонфигурация value={value} onChange={setЗначение} />
      <выходput aria-label="Черновик config">{JSON.stringify(value)}</выходput>
    </>
  );
}
const draft = (): — сложностьRвыходerКонфигурацияЗначение => JSON.parse(screen.getByLabelText("Черновик config").textContent!);

beforeEach(() => {
  testЗапросClient.clear();
  vi.mocked(get— сложностьОценкаrDefaults).mockResolvedЗначение(SHIPPED_SCORER_DEFAULTS);
});

describe("combined heuristic editor", () => {
  it("adds and edits a graded dimension, rebalances builtins, preserves matcher-only edits, and removes it", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<Editor />);
    await user.click(screen.getByText("Расширенное оценивание"));
    expect(await screen.findByRole("button", { name: "Restore default weights" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Ключевые слова сопоставляются с текущим запросом. Regex проверяет первые 2048 символов и допускает повторы одного символа до 64 раз. Прокси проверяет паттерны при сохранении." }));
    expect(screen.getByRole("button", { name: "Restore default weights" })).toBeEnabled();
    expect(draft().dimension_weights?.codePresence).toBeCloseTo(0.27, 12);
    expect(draft().custom_dimensions?.[0].scoring_mode).toBe("match_count");
    expect(screen.getByRole("group", { name: "Своё измерение 1" })).toContainElement(
      screen.getByLabelText("Name", { exact: true }),
    );
    fireEvent.change(screen.getByLabelText("Name", { exact: true }), { target: { value: "domain" } });
    fireEvent.change(screen.getByLabelText("Ключевые слова (one per line)"), { target: { value: "orbitmesh\nfluxgate" } });
    fireEvent.change(screen.getByLabelText("Вес", { exact: true }), { target: { value: "0.2" } });
    expect(screen.getByLabelText("Code presence", { exact: true })).toHaveЗначение("0.24");
    expect(screen.getByTestId("dimension-weight-total")).toHaveTextContent("total 1.00");
    const beforeMatchers = draft().dimension_weights;
    fireEvent.change(screen.getByLabelText("Regex patterns (one per line)"), { target: { value: "abc" } });
    await chooseВыбратьOption(user, screen.getByLabelText("Оценивание"), "Бинарный");
    expect(draft().dimension_weights).toEqual(beforeMatchers);
    expect(draft().custom_dimensions?.[0].scoring_mode).toBe("binary");
    await user.click(screen.getByRole("button", { name: "Remove custom dimension 1" }));
    expect(draft().custom_dimensions).toBeUndefined();
    expect(draft().dimension_weights?.codePresence).toBeCloseTo(0.3, 12);
  });

  it("preserves a legacy vector on load and resets both fields only when requested", async () => {
    const legacy = {
      ...base,
      dimension_weights: { codePresence: 0.4 },
      custom_dimensions: [{ id: "stored-0", name: "domain", weight: 0.7, keywords: ["a"] }],
    };
    renderWithПровайдерs(<Editor initial={legacy} />);
    await userEvent.click(screen.getByText("Расширенное оценивание"));
    expect(await screen.findByTestId("dimension-weight-total")).toHaveTextContent("total 1.10");
    expect(draft()).toEqual(legacy);
    expect(screen.getByLabelText("Токен count", { exact: true })).toHaveЗначение("0");
    await userEvent.click(screen.getByRole("button", { name: "Restore default weights" }));
    expect(draft().custom_dimensions).toBeUndefined();
    expect(draft().dimension_weights).toBeUndefined();
  });

  it("drops hidden custom drafts on a fallback-only weight edit so switching back cannot exceed the budget", async () => {
    const initial: — сложностьRвыходerКонфигурацияЗначение = {
      ...base,
      classifier_type: "llm",
      classifier_fallback: "heuristic",
      custom_dimensions: [{ id: "a", name: "domain", weight: 0.7, keywords: ["a"] }],
    };
    renderWithПровайдерs(<Editor initial={initial} />);
    await userEvent.click(screen.getByText("Расширенное оценивание"));
    fireEvent.change(await screen.findByLabelText("Code presence", { exact: true }), { target: { value: "0.5" } });
    expect(draft().custom_dimensions).toBeUndefined();
    expect(Object.values(draft().dimension_weights!).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 12);
    expect(screen.queryByRole("button", { name: "Ключевые слова сопоставляются с текущим запросом. Regex проверяет первые 2048 символов и допускает повторы одного символа до 64 раз. Прокси проверяет паттерны при сохранении." })).not.toBeInTheDocument();
  });
});
