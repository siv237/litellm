import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RealtimePrettyView, isRealtimeОтвет } from "./RealtimePrettyView";

const sampleRealtimeОтвет = {
  usage: {
    total_tokens: 587,
    prompt_tokens: 294,
    completion_tokens: 293,
  },
  results: [
    {
      type: "session.created",
      session: {
        id: "sess_DDNQlPKHjLsokSJPAOWY0",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini-realtime-preview",
        tools: [],
        voice: "alloy",
        modalities: ["audio", "text"],
        temperature: 0.8,
        tool_choice: "auto",
        instructions: "You are a helpful assistant.",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
        },
        input_audio_format: "pcm16",
        выходput_audio_format: "pcm16",
        max_response_выходput_tokens: "inf",
      },
      event_id: "event_DDNQlB4VNUlpqTVIjBbm3",
    },
    {
      type: "response.done",
      event_id: "event_DDNQnagYJCZyZATdJCn0L",
      response: {
        id: "resp_DDNQnlXGHZJB46D5JhJ95",
        usage: {
          input_tokens: 116,
          total_tokens: 162,
          выходput_tokens: 46,
          input_token_details: {
            text_tokens: 116,
            audio_tokens: 0,
          },
          выходput_token_details: {
            text_tokens: 16,
            audio_tokens: 30,
          },
        },
        voice: "alloy",
        object: "realtime.response",
        выходput: [
          {
            id: "item_DDNQnz5uN1b8NEvPOPZOM",
            role: "assistant",
            type: "message",
            status: "completed",
            content: [
              {
                type: "audio",
                transcript: "Hello! How's your day going?",
              },
            ],
          },
        ],
        status: "completed",
        conversation_id: "conv_DDNQlpNllPYhCCfXCtT8X",
        max_выходput_tokens: "inf",
      },
    },
    {
      type: "response.done",
      event_id: "event_DDNR0VmrRTVU69RxGC29U",
      response: {
        id: "resp_DDNQy6S4PBZxW4qsKq6Ah",
        usage: {
          input_tokens: 178,
          total_tokens: 425,
          выходput_tokens: 247,
        },
        voice: "alloy",
        object: "realtime.response",
        выходput: [
          {
            id: "item_DDNQywctWVnYmujg4FSTZ",
            role: "assistant",
            type: "message",
            status: "completed",
            content: [
              {
                type: "audio",
                transcript: "I'm here to help with information and general questions.",
              },
            ],
          },
        ],
        status: "completed",
        conversation_id: "conv_DDNQlpNllPYhCCfXCtT8X",
        max_выходput_tokens: "inf",
      },
    },
  ],
};

describe("isRealtimeОтвет", () => {
  it("should return true for a valid realtime response with session.created", () => {
    expect(isRealtimeОтвет(sampleRealtimeОтвет)).toBe(true);
  });

  it("should return true for response with only response.done events", () => {
    const resp = {
      results: [{ type: "response.done", response: { id: "r1" } }],
    };
    expect(isRealtimeОтвет(resp)).toBe(true);
  });

  it("should return false for a стандарт chat completion response", () => {
    const chatОтвет = {
      choices: [{ message: { role: "assistant", content: "Hello" } }],
    };
    expect(isRealtimeОтвет(chatОтвет)).toBe(false);
  });

  it("should return false for null/undefined", () => {
    expect(isRealtimeОтвет(null)).toBe(false);
    expect(isRealtimeОтвет(undefined)).toBe(false);
  });

  it("should return false for empty results array", () => {
    expect(isRealtimeОтвет({ results: [] })).toBe(false);
  });

  it("should return false for results with unrecognized event types", () => {
    const resp = {
      results: [{ type: "some.unknown.event" }],
    };
    expect(isRealtimeОтвет(resp)).toBe(false);
  });
});

describe("RealtimePrettyView", () => {
  const mockWriteText = vi.fn().mockResolvedЗначение(undefined);

  beforeEach(() => {
    vi.clearВсеMocks();
    Object.defineСвойство(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it("should render the component successfully", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("Сессия")).toBeInTheDocument();
  });

  it("should display the session Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюElements = screen.getВсеByText("gpt-4o-mini-realtime-preview");
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should display the session voice tag", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    const voiceElements = screen.getВсеByText("alloy");
    expect(voiceElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should display modality tags", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("audio")).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("should display the turn count in session header", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("2 turns")).toBeInTheDocument();
  });

  it("should display singular 'turn' for a single response event", () => {
    const singleTurnОтвет = {
      results: [
        {
          type: "session.created",
          session: {
            id: "sess_1",
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini-realtime-preview",
            voice: "alloy",
            modalities: ["audio"],
          },
        },
        {
          type: "response.done",
          response: {
            id: "r1",
            status: "completed",
            выходput: [
              {
                id: "item1",
                role: "assistant",
                type: "message",
                content: [{ type: "audio", transcript: "Hi!" }],
              },
            ],
          },
        },
      ],
    };
    render(<RealtimePrettyView response={singleTurnОтвет} />);
    expect(screen.getByText("1 turn")).toBeInTheDocument();
  });

  it("should display the turn count in the выходput section header", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("Turns: 2")).toBeInTheDocument();
  });

  it("should display the Выход section header", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("Выход")).toBeInTheDocument();
  });

  it("should display transcript text from response turns", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("Hello! How's your day going?")).toBeInTheDocument();
    expect(screen.getByText("I'm here to help with information and general questions.")).toBeInTheDocument();
  });

  it("should display completed status tags for response turns", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    const completedТеги = screen.getВсеByText("completed");
    expect(completedТеги.length).toBe(2);
  });

  it("should display token usage per turn", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText("116 in / 46 выход tokens")).toBeInTheDocument();
    expect(screen.getByText("178 in / 247 выход tokens")).toBeInTheDocument();
  });

  it("should expand session details when session header is clicked", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);

    await user.click(screen.getByText("Сессия"));

    await waitFor(() => {
      expect(screen.getByText("Температура")).toBeInTheDocument();
    });
  });

  it("should display session instructions when expanded", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);

    await user.click(screen.getByText("Сессия"));

    await waitFor(() => {
      expect(screen.getByText("Инструкции")).toBeInTheDocument();
      expect(screen.getByText("You are a helpful assistant.")).toBeInTheDocument();
    });
  });

  it("should display session audio format when expanded", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);

    await user.click(screen.getByText("Сессия"));

    await waitFor(() => {
      expect(screen.getByText("Формат входного аудио")).toBeInTheDocument();
      expect(screen.getВсеByText("pcm16").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should display ASSISTANT label for выходput messages", () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    const assistantLabels = screen.getВсеByText("ASSISTANT");
    expect(assistantLabels.length).toBe(2);
  });

  it("should display fallback message when no recognized events exist", () => {
    const emptyОтвет = {
      results: [{ type: "unknown.event" }],
    };
    render(<RealtimePrettyView response={emptyОтвет} />);
    expect(screen.getByText("Распознанных событий реального времени не найдено")).toBeInTheDocument();
  });

  it("should handle response with no выходput items gracefully", () => {
    const noВыходОтвет = {
      results: [
        {
          type: "response.done",
          response: {
            id: "r1",
            status: "completed",
            выходput: [],
          },
        },
      ],
    };
    render(<RealtimePrettyView response={noВыходОтвет} />);
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("should display metrics tokens when provided", () => {
    render(
      <RealtimePrettyView response={sampleRealtimeОтвет} metrics={{ completion_tokens: 500, выходput_cost: 0.005 }} />,
    );
    expect(screen.getByText(/Токенs: 500/)).toBeInTheDocument();
    expect(screen.getByText(/Стоимость: \$0\.005000/)).toBeInTheDocument();
  });

  it("should toggle выходput section collapse when header is clicked", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);

    const transcript = screen.getByText("Hello! How's your day going?");
    expect(transcript).toBeVisible();

    const выходputHeader = screen.getByText("Выход").closest("div");
    if (выходputHeader) {
      await user.click(выходputHeader);
      await waitFor(() => {
        expect(transcript).not.toBeVisible();
      });
    }
  });

  it("should display token breakdown tags when input_token_details are present", async () => {
    render(<RealtimePrettyView response={sampleRealtimeОтвет} />);
    expect(screen.getByText(/Text Токенs: 116/)).toBeInTheDocument();
  });

  it("should handle text content type in addition to audio", () => {
    const textОтвет = {
      results: [
        {
          type: "response.done",
          response: {
            id: "r1",
            status: "completed",
            выходput: [
              {
                id: "item1",
                role: "assistant",
                type: "message",
                content: [
                  {
                    type: "text",
                    text: "This is a text response",
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    render(<RealtimePrettyView response={textОтвет} />);
    expect(screen.getByText("This is a text response")).toBeInTheDocument();
  });
});
