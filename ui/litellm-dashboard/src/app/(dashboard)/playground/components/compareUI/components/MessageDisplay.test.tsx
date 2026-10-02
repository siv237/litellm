import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { СообщениеType } from "@/components/chat_ui/types";
import { СообщениеDisplay } from "./СообщениеDisplay";

vi.mock("@/components/chat_ui/ReasoningContent", () => ({
  default: ({ reasoningContent }: { reasoningContent: string }) => (
    <div data-testid="reasoning-content">{reasoningContent}</div>
  ),
}));

vi.mock("@/components/chat_ui/ОтветМетрикаs", () => ({
  default: () => <div data-testid="response-metrics">ОтветМетрикаs</div>,
}));

vi.mock("../../chat_ui/SearchРезультатsDisplay", () => ({
  SearchРезультатsDisplay: () => <div data-testid="search-results">SearchРезультатsDisplay</div>,
}));

vi.mock("../../chat_ui/ChatImageRenderer", () => ({
  default: ({ message }: { message: any }) =>
    message.image-предпросмотрUrl ? (
      <div data-testid="chat-image-renderer">
        <img src={message.image-предпросмотрUrl} alt="User uploaded image" />
      </div>
    ) : null,
}));

describe("СообщениеDisplay", () => {
  it("should render", () => {
    const messages: СообщениеType[] = [
      {
        role: "user",
        content: "Hello",
      },
      {
        role: "assistant",
        content: "Hi there!",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      },
    ];
    render(<СообщениеDisplay messages={messages} isLoading={false} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("displays user and assistant messages with proper grouping and shows loading state", () => {
    const messages: СообщениеType[] = [
      {
        role: "user",
        content: "What is 2+2?",
      },
      {
        role: "assistant",
        content: "2+2 equals 4",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
        toolName: "calculator",
        timeToFirstТокен: 100,
        totalLatency: 500,
        usage: {
          completionТокенs: 10,
          promptТокенs: 20,
          totalТокенs: 30,
        },
      },
    ];
    render(<СообщениеDisplay messages={messages} isLoading={false} />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("calculator")).toBeInTheDocument();
    expect(screen.getByText("2+2 equals 4")).toBeInTheDocument();
    expect(screen.getByTestId("response-metrics")).toBeInTheDocument();
  });

  it("should display image attachment in user message", () => {
    const messages: СообщениеType[] = [
      {
        role: "user",
        content: "What is in this image? [Image attached]",
        image-предпросмотрUrl: "blob:test-image-url",
      },
      {
        role: "assistant",
        content: "This is a test image",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      },
    ];
    render(<СообщениеDisplay messages={messages} isLoading={false} />);
    expect(screen.getByText("What is in this image? [Image attached]")).toBeInTheDocument();
    expect(screen.getByTestId("chat-image-renderer")).toBeInTheDocument();
    const image = screen.getByTestId("chat-image-renderer").queryВыбратьor("img");
    expect(image).toHaveAttribute("src", "blob:test-image-url");
  });
});
