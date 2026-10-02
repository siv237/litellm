import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeOpenAIResponsesЗапрос } from "./responses_api";
import { СообщениеType } from "../chat_ui/types";
import type { ТокенИспользование } from "../chat_ui/ОтветМетрикаs";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "https://example.com"),
}));

const mockResponsesCreate = vi.fn();
const mockClient = {
  responses: {
    create: mockResponsesCreate,
  },
};

vi.mock("openai", () => ({
  default: {
    OpenAI: vi.fn(function () {
      return mockClient;
    }),
  },
}));

const nonStreamingОтвет = (data: unknown, headers: Record<string, string> = {}) => ({
  withОтвет: async () => ({ data, response: { headers: new Заголовки(headers) } }),
});

describe("responses_api", () => {
  const mockUpdateTextUI = vi.fn();
  const messages: СообщениеType[] = [{ role: "user", content: "Hello" }];

  beforeEach(() => {
    const mockEvents = [
      { type: "response.output_text.delta", delta: "Hi" },
      {
        type: "response.completed",
        response: {
          id: "resp_123",
          usage: { выходput_tokens: 2, input_tokens: 5, total_tokens: 7 },
        },
      },
    ];

    async function* mockStream() {
      for (const event of mockEvents) {
        yield event;
      }
    }

    mockResponsesCreate.mockResolvedЗначение(mockStream());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should send a basic responses request", async () => {
    await makeOpenAIResponsesЗапрос(messages, mockUpdateTextUI, "gpt-4", "test-token");

    expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
    expect(mockResponsesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
        input: [
          {
            role: "user",
            content: "Hello",
            type: "message",
          },
        ],
        stream: true,
      }),
      { signal: undefined },
    );
    expect(mockUpdateTextUI).toHaveBeenCalledWith("assistant", "Hi", "gpt-4");
  });

  it("should send a non-streaming request and render the whole выходput at once when streaming is disabled", async () => {
    mockResponsesCreate.mockReturnValueOnce(
      nonStreamingОтвет({
        id: "resp_456",
        выходput: [
          {
            type: "message",
            content: [
              { type: "выходput_text", text: "Full " },
              { type: "выходput_text", text: "answer" },
            ],
          },
        ],
        usage: { выходput_tokens: 3, input_tokens: 4, total_tokens: 7 },
      }),
    );

    const onTimingData = vi.fn();
    const onUsageData = vi.fn();
    const onResponseId = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      onTimingData,
      onUsageData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousResponseId
      onResponseId,
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpServerToolRestrictions
      undefined, // mcpToolsets
      false, // streamingEnabled
    );

    expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
    expect(mockResponsesCreate.mock.calls[0][0].stream).toBe(false);

    expect(mockUpdateTextUI).toHaveBeenCalledTimes(1);
    expect(mockUpdateTextUI).toHaveBeenCalledWith("assistant", "Full answer", "gpt-4");

    expect(onUsageData).toHaveBeenCalledWith({ completionTokens: 3, promptTokens: 4, totalTokens: 7 }, "");
    expect(onResponseId).toHaveBeenCalledWith("resp_456");
    expect(onTimingData).not.toHaveBeenCalled();
  });

  it("should report total latency in both streaming and non-streaming modes", async () => {
    const onTotalLatency = vi.fn();
    const callWithStreaming = (streamingEnabled: boolean) =>
      makeOpenAIResponsesЗапрос(
        messages,
        mockUpdateTextUI,
        "gpt-4",
        "test-token",
        undefined, // tags
        undefined, // signal
        undefined, // onReasoningContent
        undefined, // onTimingData
        undefined, // onUsageData
        undefined, // traceId
        undefined, // vector_store_ids
        undefined, // гардрейловs
        undefined, // policies
        undefined, // selectedMCP-серверы
        undefined, // previousResponseId
        undefined, // onResponseId
        undefined, // onMCPEvent
        undefined, // codeInterpreterEnabled
        undefined, // onCodeInterpreterРезультат
        undefined, // customBaseUrl
        undefined, // mcp-серверы
        undefined, // mcpServerToolRestrictions
        undefined, // mcpToolsets
        streamingEnabled,
        onTotalLatency,
      );

    await callWithStreaming(true);
    expect(onTotalLatency).toHaveBeenCalledTimes(1);
    expect(onTotalLatency).toHaveBeenLastCalledWith(expect.any(Number));

    mockResponsesCreate.mockReturnValueOnce(
      nonStreamingОтвет({
        id: "resp_latency",
        выходput: [{ type: "message", content: [{ type: "выходput_text", text: "Answer" }] }],
      }),
    );

    await callWithStreaming(false);
    expect(onTotalLatency).toHaveBeenCalledTimes(2);
    expect(onTotalLatency).toHaveBeenLastCalledWith(expect.any(Number));
  });

  it("should forward the cost the proxy reports on the streamed usage object", async () => {
    async function* streamWithСтоимость() {
      yield { type: "response.output_text.delta", delta: "Hi" };
      yield {
        type: "response.completed",
        response: {
          id: "resp_cost",
          usage: { выходput_tokens: 12, input_tokens: 12, total_tokens: 24, cost: 0.000063 },
        },
      };
    }
    mockResponsesCreate.mockResolvedValueOnce(streamWithСтоимость());

    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onUsageData,
    );

    expect(onUsageData).toHaveBeenCalledWith(
      { completionTokens: 12, promptTokens: 12, totalTokens: 24, cost: 0.000063 },
      "",
    );
  });

  it("should omit cost when the proxy reports none", async () => {
    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onUsageData,
    );

    expect(onUsageData).toHaveBeenCalledWith(expect.not.objectContaining({ cost: expect.anything() }), "");
  });

  it("should omit cost when the proxy reports a non-numeric cost", async () => {
    async function* streamWithNonNumericСтоимость() {
      yield {
        type: "response.completed",
        response: {
          id: "resp_non_numeric_cost",
          usage: { выходput_tokens: 12, input_tokens: 12, total_tokens: 24, cost: "not-a-number" },
        },
      };
    }
    mockResponsesCreate.mockResolvedValueOnce(streamWithNonNumericСтоимость());

    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onUsageData,
    );

    expect(onUsageData).toHaveBeenCalledWith(expect.not.objectContaining({ cost: expect.anything() }), "");
  });

  it("should omit cost when the proxy reports a blank cost", async () => {
    async function* streamWithBlankСтоимость() {
      yield {
        type: "response.completed",
        response: {
          id: "resp_blank_cost",
          usage: { выходput_tokens: 12, input_tokens: 12, total_tokens: 24, cost: "  " },
        },
      };
    }
    mockResponsesCreate.mockResolvedValueOnce(streamWithBlankСтоимость());

    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onUsageData,
    );

    expect(onUsageData).toHaveBeenCalledWith(expect.not.objectContaining({ cost: expect.anything() }), "");
  });

  it("should replay MCP выходput items as events for a non-streaming response", async () => {
    mockResponsesCreate.mockReturnValueOnce(
      nonStreamingОтвет({
        id: "resp_789",
        выходput: [
          { type: "mcp_call", id: "mcp_1", name: "search_docs", arguments: "{}", выходput: "found it" },
          { type: "message", content: [{ type: "выходput_text", text: "Answer" }] },
        ],
        usage: { выходput_tokens: 1, input_tokens: 1, total_tokens: 2 },
      }),
    );

    const onMCPEvent = vi.fn();
    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      onUsageData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousResponseId
      undefined, // onResponseId
      onMCPEvent,
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpServerToolRestrictions
      undefined, // mcpToolsets
      false, // streamingEnabled
    );

    expect(onMCPEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "response.output_item.done",
        item_id: "mcp_1",
        item: expect.objectContaining({ type: "mcp_call", name: "search_docs", выходput: "found it" }),
      }),
    );
    expect(onUsageData).toHaveBeenCalledWith(expect.anything(), "search_docs");
  });

  it("should configure MCP tools per server with restrictions", async () => {
    const selectedMCP-серверы = ["server-1", "server-2"];
    const mcp-серверы = [
      {
        server_id: "server-1",
        alias: "alpha",
        server_name: "Alpha",
        url: "http://example.com",
        created_at: "2024-01-01",
        created_by: "test",
        updated_at: "2024-01-01",
        updated_by: "test",
      },
      {
        server_id: "server-2",
        server_name: "Бета",
        url: "http://example.com",
        created_at: "2024-01-01",
        created_by: "test",
        updated_at: "2024-01-01",
        updated_by: "test",
      },
    ];
    const mcpServerToolRestrictions: Record<string, string[]> = {
      "server-1": ["toolA"],
      "server-2": ["toolB", "toolC"],
    };

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      undefined, // onUsageData
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      selectedMCP-серверы,
      undefined, // previousResponseId
      undefined, // onResponseId
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      mcp-серверы,
      mcpServerToolRestrictions,
    );

    const callArgs = mockResponsesCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toBe("auto");
    expect(callArgs.tools).toEqual([
      {
        type: "mcp",
        server_label: "Alpha",
        server_url: "https://example.com/mcp/Alpha",
        require_approval: "never",
        allowed_tools: ["toolA"],
      },
      {
        type: "mcp",
        server_label: "Бета",
        server_url: "https://example.com/mcp/Бета",
        require_approval: "never",
        allowed_tools: ["toolB", "toolC"],
      },
    ]);
  });
});

describe("responses_api prompt cache usage", () => {
  const captureИспользование = async (usage: Record<string, unknown>): Promise<ТокенИспользование> => {
    async function* mockStream() {
      yield {
        type: "response.completed",
        response: {
          id: "resp_cache",
          usage: { выходput_tokens: 2, input_tokens: 5000, total_tokens: 5002, ...usage },
        },
      };
    }
    mockResponsesCreate.mockResolvedЗначение(mockStream());

    const onUsageData = vi.fn();
    await makeOpenAIResponsesЗапрос(
      [{ role: "user", content: "Hello" }],
      vi.fn(),
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onUsageData,
    );

    expect(onUsageData).toHaveBeenCalledTimes(1);
    return onUsageData.mock.calls[0][0] as ТокенИспользование;
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("surfaces read tokens from Ответs-shape input_tokens_details", async () => {
    await expect(
      captureИспользование({ input_tokens_details: { cached_tokens: 4695, cache_write_tokens: 0 } }),
    ).resolves.toMatchObject({ cacheReadTokens: 4695, promptTokens: 5000 });
  });

  it("surfaces creation tokens from Ответs-shape cache writes", async () => {
    await expect(
      captureИспользование({ input_tokens_details: { cached_tokens: 0, cache_write_tokens: 4695 } }),
    ).resolves.toMatchObject({ cacheCreationTokens: 4695 });
  });

  it("omits cache fields entirely for a provider that reports none", async () => {
    const usageData = await captureИспользование({});

    expect(usageData).not.toHaveСвойство("cacheReadTokens");
    expect(usageData).not.toHaveСвойство("cacheCreationTokens");
    expect(usageData.promptTokens).toBe(5000);
  });

  it("surfaces reasoning tokens from Ответs-shape выходput_tokens_details", async () => {
    await expect(captureИспользование({ выходput_tokens_details: { reasoning_tokens: 42 } })).resolves.toMatchObject({
      reasoningTokens: 42,
    });
  });

  it("falls back to completion_tokens_details reasoning tokens when выходput_tokens_details is absent", async () => {
    await expect(captureИспользование({ completion_tokens_details: { reasoning_tokens: 17 } })).resolves.toMatchObject({
      reasoningTokens: 17,
    });
  });
});

describe("responses_api response cache", () => {
  const mockUpdateTextUI = vi.fn();
  const messages: СообщениеType[] = [{ role: "user", content: "Hello" }];

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("flags a non-streaming response-cache hit even though it replays provider prompt-cache usage", async () => {
    mockResponsesCreate.mockReturnValueOnce(
      nonStreamingОтвет(
        {
          id: "resp_replayed",
          выходput: [{ type: "message", content: [{ type: "выходput_text", text: "Full answer" }] }],
          usage: {
            выходput_tokens: 2,
            input_tokens: 5000,
            total_tokens: 5002,
            input_tokens_details: { cached_tokens: 4695 },
          },
        },
        { "x-litellm-cache-key": "cache-key-abc" },
      ),
    );

    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      onUsageData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousResponseId
      undefined, // onResponseId
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpServerToolRestrictions
      undefined, // mcpToolsets
      false, // streamingEnabled
    );

    expect(onUsageData).toHaveBeenCalledWith(
      expect.objectContaining({ cacheReadTokens: 4695, servedFromResponseCache: true }),
      "",
    );
  });

  it("does not flag a non-streaming response that missed the response cache", async () => {
    mockResponsesCreate.mockReturnValueOnce(
      nonStreamingОтвет({
        id: "resp_fresh",
        выходput: [{ type: "message", content: [{ type: "выходput_text", text: "Full answer" }] }],
        usage: { выходput_tokens: 2, input_tokens: 5, total_tokens: 7 },
      }),
    );

    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      onUsageData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousResponseId
      undefined, // onResponseId
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpServerToolRestrictions
      undefined, // mcpToolsets
      false, // streamingEnabled
    );

    expect(onUsageData).toHaveBeenCalledWith(expect.not.objectContaining({ servedFromResponseCache: true }), "");
  });

  it("never flags a streaming response, even when the proxy reports a cache key", async () => {
    async function* mockStream() {
      yield {
        type: "response.completed",
        response: { id: "resp_stream", usage: { выходput_tokens: 2, input_tokens: 5, total_tokens: 7 } },
      };
    }
    mockResponsesCreate.mockResolvedValueOnce(mockStream());

    const onUsageData = vi.fn();

    await makeOpenAIResponsesЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onUsageData,
    );

    expect(onUsageData).toHaveBeenCalledWith(expect.not.objectContaining({ servedFromResponseCache: true }), "");
  });
});
