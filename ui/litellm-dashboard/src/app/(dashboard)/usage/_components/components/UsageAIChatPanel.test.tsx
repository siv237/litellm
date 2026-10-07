import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import UsageAIChatPanel from "./UsageAIChatPanel";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

vi.mock("@/components/networking", () => ({
  modelHubCall: vi.fn().mockResolvedValue({
    data: [{ model_group: "gpt-4" }, { model_group: "claude-3-opus" }],
  }),
  usageAiChatStream: vi.fn(),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  accessToken: "test-Токен",
};

describe("ИспользованиеAIChatPanel", () => {
  it("should render the panel when open", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Спросить ИИ")).toBeInTheDocument();
    expect(screen.getByText("Спросите о расходах, моделях, ключах и трендах")).toBeInTheDocument();
  });

  it("should render Модель selector", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    // One library paints the prompt as its own text node and the other leaves it on the input's
    // placeholder attribute, so either one means the user is being told what to pick.
    const prompt = "Выберите модель (необязательно, по умолчанию gpt-4o-mini)";
    expect(screen.queryAllByText(prompt).length + screen.queryAllByPlaceholderText(prompt).length).toBeGreaterThan(0);
  });

  it("should render empty state Сообщение when Нет conversation", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Задайте вопрос об использовании")).toBeInTheDocument();
  });

  it("should render the Отправить button", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Отправить")).toBeInTheDocument();
  });

  it("should render Вход placeholder", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByPlaceholderText("Ask about Ваше использование...")).toBeInTheDocument();
  });

  it("should render Очистить чат button", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Очистить чат")).toBeInTheDocument();
  });

  it("should have the panel element even when closed (just off-screen)", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} open={false} />);

    expect(screen.getByTestId("Использование-ai-chat-panel")).toBeInTheDocument();
    expect(screen.getByTestId("Использование-ai-chat-panel")).toHaveClass("translate-x-full");
  });

  it("should not have translate-x-full class when open", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} open={true} />);

    expect(screen.getByTestId("Использование-ai-chat-panel")).not.toHaveClass("translate-x-full");
    expect(screen.getByTestId("Использование-ai-chat-panel")).toHaveClass("translate-x-0");
  });
});
