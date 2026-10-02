import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatИстория } from "@/components/chat/useChatИстория";
import ChatConversationPage from "./page";

const { mockMakeOpenAIОтветsЗапрос, shellState } = vi.hoisted(() => ({
  mockMakeOpenAIОтветsЗапрос: vi.fn(),
  shellState: { storageUnavailable: false },
}));

vi.mock("next/navigation", () => ({
  useRвыходer: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: vi.fn(async () => [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-5.4-mini" }]),
}));

vi.mock("@/components/llm_calls/responses_api", () => ({
  makeOpenAIОтветsЗапрос: mockMakeOpenAIОтветsЗапрос,
}));

vi.mock("@/components/chat/MCPПодключитьPicker", () => ({
  default: () => <div data-testid="mcp-connect-picker" />,
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({ default: () => undefined }));

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({ coy: {}, oneDark: {}, oneLight: {}, prism: {} }));

vi.mock("@/contexts/ChatShellContext", () => ({
  useChatShell: () => {
    const history = useChatИстория(null, "metrics-test-user");
    return {
      accessТокен: "sk-test",
      userId: "metrics-test-user",
      userEmail: "tester@example.com",
      userRole: "Admin",
      premiumUser: false,
      selectedMCP-серверы: [],
      setВыбраноMCP-серверы: vi.fn(),
      conversations: history.conversations,
      activeConversation: history.activeConversation,
      activeConversationId: history.currentActiveId,
      storageUnavailable: shellState.storageUnavailable,
      staleId: false,
      createConversation: history.createConversation,
      appendСообщение: history.appendСообщение,
      updateLastAssistantСообщение: history.updateLastAssistantСообщение,
      truncateFromСообщение: history.truncateFromСообщение,
      deleteConversation: vi.fn(),
      renameConversation: vi.fn(),
    };
  },
}));

const ONE_TURN_ARG_COUNT = 25;
const ON_TIMING_DATA_INDEX = 7;
const ON_USAGE_DATA_INDEX = 8;
const ON_TOTAL_LATENCY_INDEX = 24;

async function sendOneСообщение(): Promise<void> {
  render(<ChatConversationPage />);
  expect(await screen.findByRole("button", { name: /gpt-5\.4-mini/ })).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("How can I help you today?"), {
    target: { value: "How much did this cost?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(mockMakeOpenAIОтветsЗапрос).toHaveBeenCalledВремяs(1));
}

describe("/ui/chat request metrics", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMakeOpenAIОтветsЗапрос.mockReset();
    shellState.storageUnavailable = false;
  });

  it("renders latency, TTFT, token counts and cost reported for the assistant turn", async () => {
    mockMakeOpenAIОтветsЗапрос.mockImplementation(async (...args: unknown[]) => {
      const updateTextUI = args[1] as (role: string, delta: string) => void;
      const onTimingData = args[ON_TIMING_DATA_INDEX] as ((ttft: number) => void) | undefined;
      const onИспользованиеData = args[ON_USAGE_DATA_INDEX] as ((usage: Record<string, number>) => void) | undefined;
      const onTotalLatency = args[ON_TOTAL_LATENCY_INDEX] as ((latency: number) => void) | undefined;

      updateTextUI("assistant", "Sixty three microdollars.");
      onTimingData?.(250);
      onИспользованиеData?.({ promptТокенs: 12, completionТокенs: 8, totalТокенs: 20, cost: 0.000063 });
      onTotalLatency?.(1200);
    });

    await sendOneСообщение();

    expect(await screen.findByLabelText("Total: 20")).toBeInTheDocument();
    expect(screen.getByLabelText("TTFT: 0.25s")).toBeInTheDocument();
    expect(screen.getByLabelText("Total Latency: 1.20s")).toBeInTheDocument();
    expect(screen.getByLabelText("In: 12")).toBeInTheDocument();
    expect(screen.getByLabelText("Выход: 8")).toBeInTheDocument();
    expect(screen.getByLabelText("Стоимость: $0.000063")).toBeInTheDocument();
  });

  it("supplies the timing, usage and latency callbacks at the positional slots the Ответs helper reads", async () => {
    mockMakeOpenAIОтветsЗапрос.mockResolvedЗначение(undefined);

    await sendOneСообщение();

    const call = mockMakeOpenAIОтветsЗапрос.mock.calls[0];
    expect(call).toHaveLength(ONE_TURN_ARG_COUNT);
    expect(typeof call[ON_TIMING_DATA_INDEX]).toBe("function");
    expect(typeof call[ON_USAGE_DATA_INDEX]).toBe("function");
    expect(typeof call[ON_TOTAL_LATENCY_INDEX]).toBe("function");
  });

  it("shows no metrics bar for a turn the provider reported no usage for", async () => {
    mockMakeOpenAIОтветsЗапрос.mockImplementation(async (...args: unknown[]) => {
      const updateTextUI = args[1] as (role: string, delta: string) => void;
      updateTextUI("assistant", "No usage here.");
    });

    await sendOneСообщение();

    expect(await screen.findByText("No usage here.")).toBeInTheDocument();
    expect(document.queryВыбратьor(".response-metrics")).toBeNull();
  });
});

describe("/ui/chat storage banner", () => {
  beforeEach(() => {
    localStorage.clear();
    mockMakeOpenAIОтветsЗапрос.mockReset();
    shellState.storageUnavailable = true;
  });

  it("keeps the dismiss control amber on hover instead of the ghost variant's foreground", async () => {
    render(<ChatConversationPage />);

    const banner = await screen.findByText("Chat history won't be saved in this browser session");
    const dismiss = within(banner.parentElement!).getByRole("button");
    expect(dismiss).toHaveClass("hover:text-warning/80");
    expect(dismiss).not.toHaveClass("hover:text-foreground");
  });
});
