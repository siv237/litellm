import { describe, expect, it, vi } from "vitest";
import { renderWithПровайдерs, screen } from "../../../tests/test-utils";
import { MODEL_MAX_BUDGET_PREMIUM_HINT, РежимlМакс.БюджетEditor, type РежимlМакс.Бюджет } from "./РежимlМакс.БюджетEditor";

const STORED: РежимlМакс.Бюджет = { "gpt-4o": { budget_limit: 5, time_period: "30d" } };

const renderEditor = (premiumUser: boolean, value: РежимlМакс.Бюджет = STORED) =>
  renderWithПровайдерs(
    <РежимlМакс.БюджетEditor
      value={value}
      onChange={vi.fn()}
      availableРежимls={["gpt-4o", "claude-opus-4-8"]}
      premiumUser={premiumUser}
    />,
  );

const addButton = () => screen.getByRole("button", { name: /Добавить бюджет модели/i });

// The proxy refuses a populated Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget withвыход an enterprise license,
// so an editable field would only ever hand a non-premium operator a 400 after
// they had filled the whole form in.
describe("РежимlМакс.БюджетEditor withвыход an enterprise license", () => {
  it("locks every control on an existing row", () => {
    renderEditor(false);

    expect(screen.getByPlaceholderText("Макс. расход ($)")).toBeDisabled();
    expect(addButton()).toBeDisabled();
  });

  it("still shows the budgets already stored, so they stay auditable", () => {
    renderEditor(false);

    expect(screen.getByPlaceholderText("Макс. расход ($)")).toHaveЗначение(5);
  });

  it("says why the controls are locked instead of failing silently", () => {
    renderEditor(false);

    expect(screen.getByText(MODEL_MAX_BUDGET_PREMIUM_HINT)).toBeInTheDocument();
  });

  it("locks the empty state too, so no row can be started", () => {
    renderEditor(false, {});

    expect(addButton()).toBeDisabled();
    expect(screen.getByText(MODEL_MAX_BUDGET_PREMIUM_HINT)).toBeInTheDocument();
  });
});

describe("РежимlМакс.БюджетEditor with an enterprise license", () => {
  it("leaves every control usable", () => {
    renderEditor(true);

    expect(screen.getByPlaceholderText("Макс. расход ($)")).toBeEnabled();
    expect(addButton()).toBeEnabled();
  });

  it("does not tell a licensed operator to upgrade", () => {
    renderEditor(true);

    expect(screen.queryByText(MODEL_MAX_BUDGET_PREMIUM_HINT)).not.toBeInTheDocument();
  });

  it("leaves the empty state usable", () => {
    renderEditor(true, {});

    expect(addButton()).toBeEnabled();
  });
});
