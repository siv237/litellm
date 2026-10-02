import { screen } from "@testing-library/react";
import { beforeВсе, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import ИспользованиеAIChatPanel from "./ИспользованиеAIChatPanel";

beforeВсе(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

vi.mock("@/components/networking", () => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubCall: vi.fn().mockResolvedЗначение({
    data: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4" }, { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "claude-3-opus" }],
  }),
  usageAiChatStream: vi.fn(),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  accessТокен: "test-token",
};

describe("ИспользованиеAIChatPanel", () => {
  it("should render the panel when open", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Спросить ИИ")).toBeInTheDocument();
    expect(screen.getByText("Спросите о расходах, моделях, ключах и трендах")).toBeInTheDocument();
  });

  it("should render Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selector", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} />);

    // One library paints the prompt as its own text node and the other leaves it on the input's
    // placeholder attribute, so either one means the user is being told what to pick.
    const prompt = "Выберите модель (необязательно, по умолчанию gpt-4o-mini)";
    expect(screen.queryAllByText(prompt).length + screen.queryAllByPlaceholderText(prompt).length).toBeGreaterThan(0);
  });

  it("should render empty state message when no conversation", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Задайте вопрос об использовании")).toBeInTheDocument();
  });

  it("should render the send button", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("should render input placeholder", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} />);

    expect(screen.getByPlaceholderText("Ask abвыход your usage...")).toBeInTheDocument();
  });

  it("should render clear chat button", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Очистить чат")).toBeInTheDocument();
  });

  it("should have the panel element even when closed (just off-screen)", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} open={false} />);

    expect(screen.getByTestId("usage-ai-chat-panel")).toBeInTheDocument();
    expect(screen.getByTestId("usage-ai-chat-panel")).toHaveClass("translate-x-full");
  });

  it("should not have translate-x-full class when open", () => {
    renderWithProviders(<ИспользованиеAIChatPanel {...defaultProps} open={true} />);

    expect(screen.getByTestId("usage-ai-chat-panel")).not.toHaveClass("translate-x-full");
    expect(screen.getByTestId("usage-ai-chat-panel")).toHaveClass("translate-x-0");
  });
});
