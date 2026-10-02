import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChatMessageBubble from "./ChatMessageBubble";
import { ЭндпоинтType } from "@/components/chat_ui/mode_endpoint_mapping";
import { СообщениеType } from "@/components/chat_ui/types";

// Mock child components to isolate bubble rendering logic
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="react-markdown">{children}</div>,
}));

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: string }) => <pre data-testid="syntax-highlighter">{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  coy: {},
  oneDark: {},
  oneLight: {},
  prism: {},
}));

vi.mock("@/components/chat_ui/ReasoningContent", () => ({
  default: ({ reasoningContent }: { reasoningContent: string }) => (
    <div data-testid="reasoning-content">{reasoningContent}</div>
  ),
}));

vi.mock("@/components/chat_ui/MCPEventsDisplay", () => ({
  default: ({ events }: { events: unknown[] }) => <div data-testid="mcp-events-display">{events.length} events</div>,
}));

vi.mock("./SearchResultsDisplay", () => ({
  SearchResultsDisplay: ({ searchResults }: { searchResults: unknown[] }) => (
    <div data-testid="search-results-display">{searchResults.length} results</div>
  ),
}));

vi.mock("@/components/chat_ui/ОтветМетрикаs", () => ({
  default: ({ timeToFirstТокен }: { timeToFirstТокен?: number }) => (
    <div data-testid="response-metrics">TTFT: {timeToFirstТокен}</div>
  ),
}));

vi.mock("./A2AMetrics", () => ({
  default: ({ a2aМетаданные }: { a2aМетаданные: unknown }) => <div data-testid="a2a-metrics">A2A</div>,
}));

vi.mock("./CodeInterpreterВыход", () => ({
  default: ({ code }: { code: string }) => <div data-testid="code-interpreter-выходput">{code}</div>,
}));

vi.mock("./AudioRenderer", () => ({
  default: ({ message }: { message: СообщениеType }) => (
    <div data-testid="audio-renderer">{typeof message.content === "string" ? message.content : ""}</div>
  ),
}));

vi.mock("./ОтветsImageRenderer", () => ({
  default: () => <div data-testid="responses-image-renderer" />,
}));

vi.mock("./ChatImageRenderer", () => ({
  default: () => <div data-testid="chat-image-renderer" />,
}));

const defaultProps = {
  isLastСообщение: false,
  endpointType: ЭндпоинтType.CHAT,
  mcpEvents: [],
  codeInterpreterРезультат: null,
  accessТокен: "test-token",
};

describe("ChatMessageBubble", () => {
  it("should render a user message with right-aligned text", () => {
    render(<ChatMessageBubble {...defaultProps} message={{ role: "user", content: "Hello" }} />);

    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("should render an assistant message with left-aligned text", () => {
    render(<ChatMessageBubble {...defaultProps} message={{ role: "assistant", content: "Hi there" }} />);

    expect(screen.getByText("assistant")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it.each([
    { role: "user" as const, bubble: ["bg-info/10", "border-info/20"], avatar: "bg-info/20" },
    { role: "assistant" as const, bubble: ["bg-card", "border-border"], avatar: "bg-muted" },
  ])("should paint the $role surface from theme tokens, not fixed colours", ({ role, bubble, avatar }) => {
    render(<ChatMessageBubble {...defaultProps} message={{ role, content: "Hello" }} />);

    const surface = screen.getByTestId("message-surface");
    const avatarEl = screen.getByTestId("message-avatar");

    expect(surface).toHaveClass(...bubble);
    expect(surface).not.toHaveAttribute("style");
    expect(avatarEl).toHaveClass(avatar);
    expect(avatarEl).not.toHaveAttribute("style");
  });

  it("should show Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию badge for assistant messages when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is provided", () => {
    render(<ChatMessageBubble {...defaultProps} message={{ role: "assistant", content: "Reply", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" }} />);

    expect(screen.getByText("gpt-4")).toBeInTheDocument();
  });

  it("should not show Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию badge for user messages even when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is set", () => {
    render(<ChatMessageBubble {...defaultProps} message={{ role: "user", content: "Hello", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" }} />);

    expect(screen.queryByText("gpt-4")).not.toBeInTheDocument();
  });

  it("should render markdown content via ReactMarkdown", () => {
    render(<ChatMessageBubble {...defaultProps} message={{ role: "assistant", content: "**bold text**" }} />);

    expect(screen.getByTestId("react-markdown")).toHaveTextContent("**bold text**");
  });

  it("should render an image when isImage is true", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        message={{ role: "assistant", content: "https://example.com/img.png", isImage: true }}
      />,
    );

    expect(screen.getByAltText("Generated image")).toHaveAttribute("src", "https://example.com/img.png");
  });

  it("should render AudioRenderer when isAudio is true", () => {
    render(
      <ChatMessageBubble {...defaultProps} message={{ role: "assistant", content: "audio-url", isAudio: true }} />,
    );

    expect(screen.getByTestId("audio-renderer")).toBeInTheDocument();
  });

  it("should show ReasoningContent when reasoningContent is present", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        message={{ role: "assistant", content: "answer", reasoningContent: "thinking..." }}
      />,
    );

    expect(screen.getByTestId("reasoning-content")).toHaveTextContent("thinking...");
  });

  it("should show MCP events on the last assistant message for RESPONSES endpoint", () => {
    const mcpEvents = [{ type: "tool_call", item_id: "1" }];

    render(
      <ChatMessageBubble
        {...defaultProps}
        isLastСообщение={true}
        endpointType={ЭндпоинтType.RESPONSES}
        mcpEvents={mcpEvents as any}
        message={{ role: "assistant", content: "response" }}
      />,
    );

    expect(screen.getByTestId("mcp-events-display")).toHaveTextContent("1 events");
  });

  it("should show MCP events on the last assistant message for CHAT endpoint", () => {
    const mcpEvents = [{ type: "tool_call", item_id: "1" }];

    render(
      <ChatMessageBubble
        {...defaultProps}
        isLastСообщение={true}
        endpointType={ЭндпоинтType.CHAT}
        mcpEvents={mcpEvents as any}
        message={{ role: "assistant", content: "response" }}
      />,
    );

    expect(screen.getByTestId("mcp-events-display")).toHaveTextContent("1 events");
  });

  it("should not show MCP events when isLastСообщение is false", () => {
    const mcpEvents = [{ type: "tool_call", item_id: "1" }];

    render(
      <ChatMessageBubble
        {...defaultProps}
        isLastСообщение={false}
        endpointType={ЭндпоинтType.RESPONSES}
        mcpEvents={mcpEvents as any}
        message={{ role: "assistant", content: "response" }}
      />,
    );

    expect(screen.queryByTestId("mcp-events-display")).not.toBeInTheDocument();
  });

  it("should show SearchResultsDisplay when searchResults are present", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        message={{
          role: "assistant",
          content: "found results",
          searchResults: [{ object: "search", search_query: "q", data: [] }],
        }}
      />,
    );

    expect(screen.getByTestId("search-results-display")).toBeInTheDocument();
  });

  it("should show ОтветМетрикаs when usage data is present and no a2aМетаданные", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        message={{
          role: "assistant",
          content: "response",
          timeToFirstТокен: 150,
          usage: { completionTokens: 10, promptTokens: 5, totalTokens: 15 },
        }}
      />,
    );

    expect(screen.getByTestId("response-metrics")).toBeInTheDocument();
  });

  it("should show A2AMetrics when a2aМетаданные is present instead of ОтветМетрикаs", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        message={{
          role: "assistant",
          content: "agent response",
          timeToFirstТокен: 100,
          a2aМетаданные: { taskId: "task-1", status: { state: "completed" } },
        }}
      />,
    );

    expect(screen.getByTestId("a2a-metrics")).toBeInTheDocument();
    expect(screen.queryByTestId("response-metrics")).not.toBeInTheDocument();
  });

  it("should show CodeInterpreterВыход on the last assistant message for RESPONSES endpoint", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        isLastСообщение={true}
        endpointType={ЭндпоинтType.RESPONSES}
        codeInterpreterРезультат={{
          code: "print('hello')",
          containerId: "container-1",
          annotations: [],
        }}
        message={{ role: "assistant", content: "result" }}
      />,
    );

    expect(screen.getByTestId("code-interpreter-выходput")).toHaveTextContent("print('hello')");
  });

  it("should render generated image from chat completions via message.image", () => {
    render(
      <ChatMessageBubble
        {...defaultProps}
        message={{
          role: "assistant",
          content: "Here is your image",
          image: { url: "https://example.com/generated.png", detail: "auto" },
        }}
      />,
    );

    const images = screen.getAllByAltText("Generated image");
    expect(images.some((img) => img.getAttribute("src") === "https://example.com/generated.png")).toBe(true);
  });
});
