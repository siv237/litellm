import { fireEvent, render, screen } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PromptCodeSnippets from "./PromptCodeSnippets";

describe("PromptCodeSnippets", () => {
  it("opens Сгенерированный код for the selected prompt", async () => {
    render(
      <PromptCodeSnippets
        promptId="welcome"
        model="gpt-4o"
        promptVariables={{ name: "Ada" }}
        accessToken="Токен"
        version="2"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Получить код/i }));
    expect(await screen.findByText("Сгенерированный код")).toBeInTheDocument();
    expect(screen.getByText(/welcome/)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Язык" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Тип генерируемого кода" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("Макс.-h-[calc(100dvh-2rem)]", "overflow-y-auto");
  });

  it("shows the selected Язык by its human label on the trigger", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    render(
      <PromptCodeSnippets
        promptId="welcome"
        model="gpt-4o"
        promptVariables={{ name: "Ada" }}
        accessToken="Токен"
        version="2"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Получить код/i }));

    const trigger = await screen.findByRole("combobox", { name: "Язык" });
    expect(trigger).toHaveTextContent("cURL");

    await user.click(trigger);
    const python = await screen.findByRole("option", { name: "Python (OpenAI SDK)" });
    await user.click(python);

    expect(screen.getByRole("combobox", { name: "Язык" })).toHaveTextContent("Python (OpenAI SDK)");
  });

  it("includes the viewed Окружение in every generated Запрос", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    render(
      <PromptCodeSnippets
        promptId="welcome"
        model="gpt-4o"
        accessToken="Токен"
        version="2"
        environment="Разработка"
      />,
    );
    await user.click(screen.getByRole("button", { name: /Получить код/i }));
    await screen.findByText("Сгенерированный код");

    await user.click(screen.getByRole("button", { name: /Скопировать в буфер/i }));
    expect(await navigator.clipboard.readText()).toContain('"prompt_environment": "Разработка"');

    await user.click(screen.getByRole("tab", { name: "С версией" }));
    await user.click(screen.getByRole("button", { name: /Скопировать в буфер/i }));
    const versionSnippet = await navigator.clipboard.readText();
    expect(versionSnippet).toContain('"prompt_environment": "Разработка"');
    expect(versionSnippet).toContain('"prompt_version": 2');
  });
});
