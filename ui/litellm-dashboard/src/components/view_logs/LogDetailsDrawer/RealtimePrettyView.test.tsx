import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RealtimePrettyView, isRealtimeResponse } from "./RealtimePrettyView";

const sampleRealtimeResponse = {
  usage: {
    total_tokens: 587,
    prompt_tokens: 294,
    completion_tokens: 293,
  },
  results: [
    {
      type: "Сессия.Создан",
      session: {
        id: "sess_DDNQlPKHjLsokSJPAOWY0",
        model: "gpt-4o-mini-realtime-Предпросмотр",
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
        output_audio_format: "pcm16",
        max_response_output_tokens: "inf",
      },
      event_id: "event_DDNQlB4VNUlpqTVIjBbm3",
    },
    {
      type: "Ответ.Готово",
      event_id: "event_DDNQnagYJCZyZATdJCn0L",
      response: {
        id: "resp_DDNQnlXGHZJB46D5JhJ95",
        usage: {
          input_tokens: 116,
          total_tokens: 162,
          output_tokens: 46,
          input_token_details: {
            text_tokens: 116,
            audio_tokens: 0,
          },
          output_token_details: {
            text_tokens: 16,
            audio_tokens: 30,
          },
        },
        voice: "alloy",
        object: "realtime.Ответ",
        output: [
          {
            id: "item_DDNQnz5uN1b8NEvPOPZOM",
            role: "assistant",
            type: "Сообщение",
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
        max_output_tokens: "inf",
      },
    },
    {
      type: "Ответ.Готово",
      event_id: "event_DDNR0VmrRTVU69RxGC29U",
      response: {
        id: "resp_DDNQy6S4PBZxW4qsKq6Ah",
        usage: {
          input_tokens: 178,
          total_tokens: 425,
          output_tokens: 247,
        },
        voice: "alloy",
        object: "realtime.Ответ",
        output: [
          {
            id: "item_DDNQywctWVnYmujg4FSTZ",
            role: "assistant",
            type: "Сообщение",
            status: "completed",
            content: [
              {
                type: "audio",
                transcript: "I'm here to help with Информация and general questions.",
              },
            ],
          },
        ],
        status: "completed",
        conversation_id: "conv_DDNQlpNllPYhCCfXCtT8X",
        max_output_tokens: "inf",
      },
    },
  ],
};

describe("isRealtimeОтвет", () => {
  it("should return Истина for a valid realtime Ответ with Сессия.Создан", () => {
    expect(isRealtimeResponse(sampleRealtimeResponse)).toBe(true);
  });

  it("should return Истина for Ответ with only Ответ.Готово events", () => {
    const resp = {
      results: [{ type: "Ответ.Готово", response: { id: "r1" } }],
    };
    expect(isRealtimeResponse(resp)).toBe(true);
  });

  it("should return Ложь for a standard chat completion Ответ", () => {
    const chatResponse = {
      choices: [{ message: { role: "assistant", content: "Hello" } }],
    };
    expect(isRealtimeResponse(chatResponse)).toBe(false);
  });

  it("should return Ложь for null/undefined", () => {
    expect(isRealtimeResponse(null)).toBe(false);
    expect(isRealtimeResponse(undefined)).toBe(false);
  });

  it("should return Ложь for empty results array", () => {
    expect(isRealtimeResponse({ results: [] })).toBe(false);
  });

  it("should return Ложь for results with unrecognized event types", () => {
    const resp = {
      results: [{ type: "some.unknown.event" }],
    };
    expect(isRealtimeResponse(resp)).toBe(false);
  });
});

describe("RealtimePrettyView", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it("should render the component successfully", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("Сессия")).toBeInTheDocument();
  });

  it("should display the Сессия Название модели", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    const modelElements = screen.getAllByText("gpt-4o-mini-realtime-Предпросмотр");
    expect(modelElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should display the Сессия Голос tag", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    const voiceElements = screen.getAllByText("alloy");
    expect(voiceElements.length).toBeGreaterThanOrEqual(1);
  });

  it("should display modality Теги", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("audio")).toBeInTheDocument();
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("should display the turn count in Сессия header", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("2 turns")).toBeInTheDocument();
  });

  it("should display singular 'turn' for a single Ответ event", () => {
    const singleTurnResponse = {
      results: [
        {
          type: "Сессия.Создан",
          session: {
            id: "sess_1",
            model: "gpt-4o-mini-realtime-Предпросмотр",
            voice: "alloy",
            modalities: ["audio"],
          },
        },
        {
          type: "Ответ.Готово",
          response: {
            id: "r1",
            status: "completed",
            output: [
              {
                id: "item1",
                role: "assistant",
                type: "Сообщение",
                content: [{ type: "audio", transcript: "Hi!" }],
              },
            ],
          },
        },
      ],
    };
    render(<RealtimePrettyView response={singleTurnResponse} />);
    expect(screen.getByText("1 turn")).toBeInTheDocument();
  });

  it("should display the turn count in the Выход section header", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("Turns: 2")).toBeInTheDocument();
  });

  it("should display the Выход section header", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("Выход")).toBeInTheDocument();
  });

  it("should display transcript text from Ответ turns", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("Hello! How's your day going?")).toBeInTheDocument();
    expect(screen.getByText("I'm here to help with Информация and general questions.")).toBeInTheDocument();
  });

  it("should display completed Статус Теги for Ответ turns", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    const completedTags = screen.getAllByText("completed");
    expect(completedTags.length).toBe(2);
  });

  it("should display Токен Использование per turn", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText("116 in / 46 out Токены")).toBeInTheDocument();
    expect(screen.getByText("178 in / 247 out Токены")).toBeInTheDocument();
  });

  it("should expand Сессия Подробнее when Сессия header is clicked", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);

    await user.click(screen.getByText("Сессия"));

    await waitFor(() => {
      expect(screen.getByText("Температура")).toBeInTheDocument();
    });
  });

  it("should display Сессия Инструкции when expanded", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);

    await user.click(screen.getByText("Сессия"));

    await waitFor(() => {
      expect(screen.getByText("Инструкции")).toBeInTheDocument();
      expect(screen.getByText("You are a helpful assistant.")).toBeInTheDocument();
    });
  });

  it("should display Сессия audio format when expanded", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);

    await user.click(screen.getByText("Сессия"));

    await waitFor(() => {
      expect(screen.getByText("Формат входного аудио")).toBeInTheDocument();
      expect(screen.getAllByText("pcm16").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should display ASSISTANT label for Выход messages", () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    const assistantLabels = screen.getAllByText("ASSISTANT");
    expect(assistantLabels.length).toBe(2);
  });

  it("should display fallback Сообщение when Нет recognized events exist", () => {
    const emptyResponse = {
      results: [{ type: "unknown.event" }],
    };
    render(<RealtimePrettyView response={emptyResponse} />);
    expect(screen.getByText("Распознанных событий реального времени не найдено")).toBeInTheDocument();
  });

  it("should handle Ответ with Нет Выход items gracefully", () => {
    const noOutputResponse = {
      results: [
        {
          type: "Ответ.Готово",
          response: {
            id: "r1",
            status: "completed",
            output: [],
          },
        },
      ],
    };
    render(<RealtimePrettyView response={noOutputResponse} />);
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("should display metrics Токены when provided", () => {
    render(
      <RealtimePrettyView response={sampleRealtimeResponse} metrics={{ completion_tokens: 500, output_cost: 0.005 }} />,
    );
    expect(screen.getByText(/Токены: 500/)).toBeInTheDocument();
    expect(screen.getByText(/Стоимость: \$0\.005000/)).toBeInTheDocument();
  });

  it("should toggle Выход section collapse when header is clicked", async () => {
    const user = userEvent.setup();
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);

    const transcript = screen.getByText("Hello! How's your day going?");
    expect(transcript).toBeVisible();

    const outputHeader = screen.getByText("Выход").closest("div");
    if (outputHeader) {
      await user.click(outputHeader);
      await waitFor(() => {
        expect(transcript).not.toBeVisible();
      });
    }
  });

  it("should display Разбивка по токенам Теги when input_token_details are present", async () => {
    render(<RealtimePrettyView response={sampleRealtimeResponse} />);
    expect(screen.getByText(/Text Токены: 116/)).toBeInTheDocument();
  });

  it("should handle text content Тип in addition to audio", () => {
    const textResponse = {
      results: [
        {
          type: "Ответ.Готово",
          response: {
            id: "r1",
            status: "completed",
            output: [
              {
                id: "item1",
                role: "assistant",
                type: "Сообщение",
                content: [
                  {
                    type: "text",
                    text: "This is a text Ответ",
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    render(<RealtimePrettyView response={textResponse} />);
    expect(screen.getByText("This is a text Ответ")).toBeInTheDocument();
  });
});
