import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { БюджетРезервные моделиEditor } from "./БюджетРезервные моделиEditor";

const MODELS = ["gpt-4", "gpt-3.5-turbo", "claude-3", "claude-haiku"];

describe("БюджетРезервные моделиEditor", () => {
  it("renders empty state with add button", () => {
    const onChange = vi.fn();
    render(<БюджетРезервные моделиEditor value={{}} onChange={onChange} availableModels={MODELS} />);
    expect(screen.getByText("Add Бюджет Fallback")).toBeInTheDocument();
    expect(screen.getByText(/reroute to fallback models/)).toBeInTheDocument();
  });

  it("renders existing entries from value prop", () => {
    const onChange = vi.fn();
    render(
      <БюджетРезервные моделиEditor
        value={{ "gpt-4": ["gpt-3.5-turbo", "claude-3"] }}
        onChange={onChange}
        availableModels={MODELS}
      />,
    );
    expect(screen.getByText("IF BUDGET EXCEEDED, TRY")).toBeInTheDocument();
    expect(screen.getByText("Primary Режимl")).toBeInTheDocument();
    expect(screen.getByText("Fallback Режимls")).toBeInTheDocument();
  });

  it("adds a new empty entry when clicking add button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<БюджетРезервные моделиEditor value={{}} onChange={onChange} availableModels={MODELS} />);

    await user.click(screen.getByText("Add Бюджет Fallback"));
    expect(screen.getByText("Primary Режимl")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({});
  });

  it("removes an entry and emits updated dict", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <БюджетРезервные моделиEditor
        value={{ "gpt-4": ["gpt-3.5-turbo"], "claude-3": ["claude-haiku"] }}
        onChange={onChange}
        availableModels={MODELS}
      />,
    );

    const removeButtons = container.querySelectorВсе<HTMLButtonElement>(".relative > button[type='button']");
    expect(removeButtons.length).toBe(2);

    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenLastCalledWith({ "claude-3": ["claude-haiku"] });
  });

  it("renders multiple entries for multiple fallback groups", () => {
    const onChange = vi.fn();
    render(
      <БюджетРезервные моделиEditor
        value={{ "gpt-4": ["claude-3"], "gpt-3.5-turbo": ["claude-haiku"] }}
        onChange={onChange}
        availableModels={MODELS}
      />,
    );
    const labels = screen.getAllByText("Primary Режимl");
    expect(labels.length).toBe(2);
  });

  it("resets internal state when remounted with empty value via key prop", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <БюджетРезервные моделиEditor
        key={1}
        value={{ "gpt-4": ["gpt-3.5-turbo"] }}
        onChange={onChange}
        availableModels={MODELS}
      />,
    );
    expect(screen.getAllByText("Primary Режимl").length).toBe(1);

    rerender(<БюджетРезервные моделиEditor key={2} value={{}} onChange={onChange} availableModels={MODELS} />);
    expect(screen.queryByText("Primary Режимl")).not.toBeInTheDocument();
    expect(screen.getByText("Add Бюджет Fallback")).toBeInTheDocument();
  });

  it("shows ordering hint when multiple fallback Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs are configured", () => {
    const onChange = vi.fn();
    render(
      <БюджетРезервные моделиEditor
        value={{ "gpt-4": ["gpt-3.5-turbo", "claude-3"] }}
        onChange={onChange}
        availableModels={MODELS}
      />,
    );
    expect(screen.getByText(/first Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию still within its own budget/)).toBeInTheDocument();
  });
});
