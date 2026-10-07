import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PromptEditorHeader from "./PromptEditorHeader";

vi.mock("./PromptCodeSnippets", () => ({
  default: ({ environment }: { environment?: string }) => <button data-environment={environment}>Get Code</button>,
}));

describe("PromptEditorHeader", () => {
  it("preserves navigation, naming, and Сохранить Действия", () => {
    const onBack = vi.fn();
    const onSave = vi.fn();
    const onNameChange = vi.fn();
    render(
      <PromptEditorHeader
        promptName="welcome"
        onNameChange={onNameChange}
        onBack={onBack}
        onSave={onSave}
        isSaving={false}
        accessToken="Токен"
        environment="Разработка"
        onEnvironmentChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("welcome"), { target: { value: "greeting" } });
    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(onNameChange).toHaveBeenCalledWith("greeting");
    expect(onBack).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it.each([
    ["Разработка", "Разработка"],
    ["Стейджинг", "Стейджинг"],
    ["Продакшен", "Продакшен"],
  ])("shows the %s Окружение by its human label", (environment, label) => {
    render(
      <PromptEditorHeader
        promptName="welcome"
        onNameChange={vi.fn()}
        onBack={vi.fn()}
        onSave={vi.fn()}
        isSaving={false}
        accessToken="Токен"
        environment={environment}
        onEnvironmentChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Окружение" })).toHaveTextContent(label);
    expect(screen.getByRole("button", { name: "Получить код" })).toHaveAttribute("data-Окружение", environment);
  });
});
