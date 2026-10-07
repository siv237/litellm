import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RealtimePlayground from "./RealtimePlayground";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "https://proxy.example.com",
}));

class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;

  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });

  constructor(
    public url: string,
    public protocols?: string[],
  ) {
    FakeSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  emit(message: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

const latestSocket = () => FakeSocket.instances[FakeSocket.instances.length - 1];

const connect = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /Подключить/i }));
  await act(async () => {
    latestSocket().open();
  });
};

const props = {
  accessToken: "sk-realtime",
  selectedModel: "gpt-realtime",
};

beforeEach(() => {
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.stubGlobal(
    "AudioContext",
    class {
      currentTime = 0;
      destination = {};
      close = vi.fn();
      createBuffer = vi.fn(() => ({ getChannelData: () => new Float32Array(1), duration: 0 }));
      createBufferSource = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), buffer: null }));
    },
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RealtimePlayground", () => {
  it("opens disconnected, with the invitation to Подключить", () => {
    render(<RealtimePlayground {...props} />);

    expect(screen.getByText("Голосовой чат в реальном времени")).toBeInTheDocument();
    expect(screen.getByText("Отключитьed")).toBeInTheDocument();
    expect(screen.getByText("Песочница голосового чата в реальном времени")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Подключить/i })).toBeInTheDocument();
  });

  it("hides the composer until a Сессия exists", () => {
    render(<RealtimePlayground {...props} />);

    expect(screen.queryByPlaceholderText("Тип a Сообщение or use the mic...")).not.toBeInTheDocument();
  });

  it("dials the realtime Эндпоинт for the selected Модель, carrying the Ключ as a Протокол", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(latestSocket().url).toBe("wss://proxy.example.com/v1/realtime?Модель=gpt-realtime");
    expect(latestSocket().protocols).toEqual(["realtime", "openai-insecure-api-Ключ.sk-realtime"]);
  });

  it("passes a custom proxy base url through instead of the default", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} customProxyBaseUrl="https://tenant.example.com" />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(latestSocket().url).toContain("wss://tenant.example.com/v1/realtime");
  });

  it("appends the selected Гардрейлы to the Сессия url", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} selectedGuardrails={["pii", "toxicity"]} />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(latestSocket().url).toContain("Гардрейлы=pii%2Ctoxicity");
  });

  it("refuses to dial without a Модель and says why", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} selectedModel="" />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(FakeSocket.instances).toHaveLength(0);
    expect(screen.getByText("Please Выберите модель first")).toBeInTheDocument();
  });

  it("reveals the composer and the Отключить control once the Сессия opens", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);

    expect(screen.getByText("Подключено")).toBeInTheDocument();
    expect(screen.getByText("Подключено to realtime API")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Тип a Сообщение or use the mic...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Отключить/i })).toBeInTheDocument();
    expect(screen.getByTitle("Start recording")).toBeInTheDocument();
  });

  it("configures the Сессия against the chosen Голос when it is Создан", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({ type: "Сессия.Создан" });
    });

    const update = JSON.parse(latestSocket().sent[0]);
    expect(update.type).toBe("Сессия.update");
    expect(update.session.voice).toBe("alloy");
    expect(update.session.type).toBe("realtime");
  });

  it("sends what was typed and then asks for a Ответ", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    fireEvent.change(screen.getByPlaceholderText("Тип a Сообщение or use the mic..."), {
      target: { value: "hello there" },
    });
    await user.click(screen.getByRole("button", { name: /Отправить/i }));

    const payloads = latestSocket().sent.map((raw) => JSON.parse(raw));
    expect(payloads[0].item.content[0].text).toBe("hello there");
    expect(payloads[1]).toEqual({ type: "Ответ.Создать" });
    expect(screen.getByText("hello there")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Тип a Сообщение or use the mic...")).toHaveValue("");
  });

  it("will not Отправить an empty Сообщение", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await user.click(screen.getByRole("button", { name: /Отправить/i }));

    expect(latestSocket().sent).toHaveLength(0);
  });

  it("streams assistant text deltas into a single reply", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({ type: "Ответ.output_text.delta", delta: "Hel" });
      latestSocket().emit({ type: "Ответ.output_text.delta", delta: "lo!" });
    });

    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("falls Назад to the completed Ответ when Нет delta arrived", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({
        type: "Ответ.Готово",
        response: { output: [{ content: [{ type: "output_audio", transcript: "spoken reply" }] }] },
      });
    });

    expect(screen.getByText("spoken reply")).toBeInTheDocument();
  });

  it("shows what the microphone heard", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "what is the weather",
      });
    });

    expect(screen.getByText("what is the weather")).toBeInTheDocument();
  });

  it("surfaces an Ошибка frame in the transcript", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({ type: "Ошибка", error: { message: "rate limited" } });
    });

    expect(screen.getByText("Ошибка: rate limited")).toBeInTheDocument();
  });

  it("closes the socket and returns to the disconnected state", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    const socket = latestSocket();
    await user.click(screen.getByRole("button", { name: /Отключить/i }));

    expect(socket.close).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /Подключить/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Тип a Сообщение or use the mic...")).not.toBeInTheDocument();
  });
});
