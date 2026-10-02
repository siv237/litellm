import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeOpenAIОтветsЗапрос } from "./responses_api";
import { СообщениеType } from "../chat_ui/types";
import type { ТокенИспользование } from "../chat_ui/ОтветМетрикаs";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "https://example.com"),
}));

const mockОтветsCreate = vi.fn();
const mockClient = {
  responses: {
    create: mockОтветsCreate,
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
      { type: "response.выходput_text.delta", delta: "Hi" },
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

    mockОтветsCreate.mockResolvedЗначение(mockStream());
  });

  afterEach(() => {
    vi.clearВсеMocks();
  });

  it("should send a basic responses request", async () => {
    await makeOpenAIОтветsЗапрос(messages, mockUpdateTextUI, "gpt-4", "test-token");

    expect(mockОтветsCreate).toHaveBeenCalledВремяs(1);
    expect(mockОтветsCreate).toHaveBeenCalledWith(
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
    mockОтветsCreate.mockReturnЗначениеOnce(
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
    const onИспользованиеData = vi.fn();
    const onОтветId = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      onTimingData,
      onИспользованиеData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousОтветId
      onОтветId,
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpСерверToolRestrictions
      undefined, // mcpИнструментыets
      false, // streamingEnabled
    );

    expect(mockОтветsCreate).toHaveBeenCalledВремяs(1);
    expect(mockОтветsCreate.mock.calls[0][0].stream).toBe(false);

    expect(mockUpdateTextUI).toHaveBeenCalledВремяs(1);
    expect(mockUpdateTextUI).toHaveBeenCalledWith("assistant", "Full answer", "gpt-4");

    expect(onИспользованиеData).toHaveBeenCalledWith({ completionТокенs: 3, promptТокенs: 4, totalТокенs: 7 }, "");
    expect(onОтветId).toHaveBeenCalledWith("resp_456");
    expect(onTimingData).not.toHaveBeenCalled();
  });

  it("should report total latency in both streaming and non-streaming modes", async () => {
    const onTotalLatency = vi.fn();
    const callWithStreaming = (streamingEnabled: boolean) =>
      makeOpenAIОтветsЗапрос(
        messages,
        mockUpdateTextUI,
        "gpt-4",
        "test-token",
        undefined, // tags
        undefined, // signal
        undefined, // onReasoningContent
        undefined, // onTimingData
        undefined, // onИспользованиеData
        undefined, // traceId
        undefined, // vector_store_ids
        undefined, // гардрейловs
        undefined, // policies
        undefined, // selectedMCP-серверы
        undefined, // previousОтветId
        undefined, // onОтветId
        undefined, // onMCPEvent
        undefined, // codeInterpreterEnabled
        undefined, // onCodeInterpreterРезультат
        undefined, // customBaseUrl
        undefined, // mcp-серверы
        undefined, // mcpСерверToolRestrictions
        undefined, // mcpИнструментыets
        streamingEnabled,
        onTotalLatency,
      );

    await callWithStreaming(true);
    expect(onTotalLatency).toHaveBeenCalledВремяs(1);
    expect(onTotalLatency).toHaveBeenLastCalledWith(expect.any(Number));

    mockОтветsCreate.mockReturnЗначениеOnce(
      nonStreamingОтвет({
        id: "resp_latency",
        выходput: [{ type: "message", content: [{ type: "выходput_text", text: "Answer" }] }],
      }),
    );

    await callWithStreaming(false);
    expect(onTotalLatency).toHaveBeenCalledВремяs(2);
    expect(onTotalLatency).toHaveBeenLastCalledWith(expect.any(Number));
  });

  it("should forward the cost the proxy reports on the streamed usage object", async () => {
    async function* streamWithСтоимость() {
      yield { type: "response.выходput_text.delta", delta: "Hi" };
      yield {
        type: "response.completed",
        response: {
          id: "resp_cost",
          usage: { выходput_tokens: 12, input_tokens: 12, total_tokens: 24, cost: 0.000063 },
        },
      };
    }
    mockОтветsCreate.mockResolvedЗначениеOnce(streamWithСтоимость());

    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onИспользованиеData,
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(
      { completionТокенs: 12, promptТокенs: 12, totalТокенs: 24, cost: 0.000063 },
      "",
    );
  });

  it("should omit cost when the proxy reports none", async () => {
    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onИспользованиеData,
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(expect.not.objectContaining({ cost: expect.anything() }), "");
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
    mockОтветsCreate.mockResolvedЗначениеOnce(streamWithNonNumericСтоимость());

    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onИспользованиеData,
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(expect.not.objectContaining({ cost: expect.anything() }), "");
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
    mockОтветsCreate.mockResolvedЗначениеOnce(streamWithBlankСтоимость());

    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onИспользованиеData,
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(expect.not.objectContaining({ cost: expect.anything() }), "");
  });

  it("should replay MCP выходput items as events for a non-streaming response", async () => {
    mockОтветsCreate.mockReturnЗначениеOnce(
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
    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      onИспользованиеData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousОтветId
      undefined, // onОтветId
      onMCPEvent,
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpСерверToolRestrictions
      undefined, // mcpИнструментыets
      false, // streamingEnabled
    );

    expect(onMCPEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "response.выходput_item.done",
        item_id: "mcp_1",
        item: expect.objectContaining({ type: "mcp_call", name: "search_docs", выходput: "found it" }),
      }),
    );
    expect(onИспользованиеData).toHaveBeenCalledWith(expect.anything(), "search_docs");
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
    const mcpСерверToolRestrictions: Record<string, string[]> = {
      "server-1": ["toolA"],
      "server-2": ["toolB", "toolC"],
    };

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      undefined, // onИспользованиеData
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      selectedMCP-серверы,
      undefined, // previousОтветId
      undefined, // onОтветId
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      mcp-серверы,
      mcpСерверToolRestrictions,
    );

    const callArgs = mockОтветsCreate.mock.calls[0][0];
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
    mockОтветsCreate.mockResolvedЗначение(mockStream());

    const onИспользованиеData = vi.fn();
    await makeOpenAIОтветsЗапрос(
      [{ role: "user", content: "Hello" }],
      vi.fn(),
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onИспользованиеData,
    );

    expect(onИспользованиеData).toHaveBeenCalledВремяs(1);
    return onИспользованиеData.mock.calls[0][0] as ТокенИспользование;
  };

  afterEach(() => {
    vi.clearВсеMocks();
  });

  it("surfaces read tokens from Ответs-shape input_tokens_details", async () => {
    await expect(
      captureИспользование({ input_tokens_details: { cached_tokens: 4695, cache_write_tokens: 0 } }),
    ).resolves.toMatchObject({ cacheReadТокенs: 4695, promptТокенs: 5000 });
  });

  it("surfaces creation tokens from Ответs-shape cache writes", async () => {
    await expect(
      captureИспользование({ input_tokens_details: { cached_tokens: 0, cache_write_tokens: 4695 } }),
    ).resolves.toMatchObject({ cacheCreationТокенs: 4695 });
  });

  it("omits cache fields entirely for a provider that reports none", async () => {
    const usageData = await captureИспользование({});

    expect(usageData).not.toHaveСвойство("cacheReadТокенs");
    expect(usageData).not.toHaveСвойство("cacheCreationТокенs");
    expect(usageData.promptТокенs).toBe(5000);
  });

  it("surfaces reasoning tokens from Ответs-shape выходput_tokens_details", async () => {
    await expect(captureИспользование({ выходput_tokens_details: { reasoning_tokens: 42 } })).resolves.toMatchObject({
      reasoningТокенs: 42,
    });
  });

  it("falls back to completion_tokens_details reasoning tokens when выходput_tokens_details is absent", async () => {
    await expect(captureИспользование({ completion_tokens_details: { reasoning_tokens: 17 } })).resolves.toMatchObject({
      reasoningТокенs: 17,
    });
  });
});

describe("responses_api response cache", () => {
  const mockUpdateTextUI = vi.fn();
  const messages: СообщениеType[] = [{ role: "user", content: "Hello" }];

  afterEach(() => {
    vi.clearВсеMocks();
  });

  it("flags a non-streaming response-cache hit even though it replays provider prompt-cache usage", async () => {
    mockОтветsCreate.mockReturnЗначениеOnce(
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

    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      onИспользованиеData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousОтветId
      undefined, // onОтветId
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpСерверToolRestrictions
      undefined, // mcpИнструментыets
      false, // streamingEnabled
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(
      expect.objectContaining({ cacheReadТокенs: 4695, servedFromОтветCache: true }),
      "",
    );
  });

  it("does not flag a non-streaming response that missed the response cache", async () => {
    mockОтветsCreate.mockReturnЗначениеOnce(
      nonStreamingОтвет({
        id: "resp_fresh",
        выходput: [{ type: "message", content: [{ type: "выходput_text", text: "Full answer" }] }],
        usage: { выходput_tokens: 2, input_tokens: 5, total_tokens: 7 },
      }),
    );

    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined, // tags
      undefined, // signal
      undefined, // onReasoningContent
      undefined, // onTimingData
      onИспользованиеData,
      undefined, // traceId
      undefined, // vector_store_ids
      undefined, // гардрейловs
      undefined, // policies
      undefined, // selectedMCP-серверы
      undefined, // previousОтветId
      undefined, // onОтветId
      undefined, // onMCPEvent
      undefined, // codeInterpreterEnabled
      undefined, // onCodeInterpreterРезультат
      undefined, // customBaseUrl
      undefined, // mcp-серверы
      undefined, // mcpСерверToolRestrictions
      undefined, // mcpИнструментыets
      false, // streamingEnabled
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(expect.not.objectContaining({ servedFromОтветCache: true }), "");
  });

  it("never flags a streaming response, even when the proxy reports a cache key", async () => {
    async function* mockStream() {
      yield {
        type: "response.completed",
        response: { id: "resp_stream", usage: { выходput_tokens: 2, input_tokens: 5, total_tokens: 7 } },
      };
    }
    mockОтветsCreate.mockResolvedЗначениеOnce(mockStream());

    const onИспользованиеData = vi.fn();

    await makeOpenAIОтветsЗапрос(
      messages,
      mockUpdateTextUI,
      "gpt-4",
      "test-token",
      undefined,
      undefined,
      undefined,
      undefined,
      onИспользованиеData,
    );

    expect(onИспользованиеData).toHaveBeenCalledWith(expect.not.objectContaining({ servedFromОтветCache: true }), "");
  });
});
