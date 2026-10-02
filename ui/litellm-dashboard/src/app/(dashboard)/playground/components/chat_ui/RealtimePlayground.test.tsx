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
  accessТокен: "sk-realtime",
  selectedModel: "gpt-realtime",
};

beforeEach(() => {
  FakeSocket.instances = [];
  vi.stubГлобально("WebSocket", FakeSocket);
  vi.stubГлобально(
    "AudioContext",
    class {
      currentВремя = 0;
      destination = {};
      close = vi.fn();
      createBuffer = vi.fn(() => ({ getChannelData: () => new Float32Array(1), duration: 0 }));
      createBufferИсточник = vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), buffer: null }));
    },
  );
  Object.defineСвойство(window, "matchMedia", {
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
  it("opens disconnected, with the invitation to connect", () => {
    render(<RealtimePlayground {...props} />);

    expect(screen.getByText("Голосовой чат в реальном времени")).toBeInTheDocument();
    expect(screen.getByText("Отключитьed")).toBeInTheDocument();
    expect(screen.getByText("Песочница голосового чата в реальном времени")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Подключить/i })).toBeInTheDocument();
  });

  it("hides the composer until a session exists", () => {
    render(<RealtimePlayground {...props} />);

    expect(screen.queryByPlaceholderText("Type a message or use the mic...")).not.toBeInTheDocument();
  });

  it("dials the realtime endpoint for the selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, carrying the key as a protocol", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(latestSocket().url).toBe("wss://proxy.example.com/v1/realtime?Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию=gpt-realtime");
    expect(latestSocket().protocols).toEqual(["realtime", "openai-insecure-api-key.sk-realtime"]);
  });

  it("passes a custom proxy base url through instead of the default", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} customProxyBaseUrl="https://tenant.example.com" />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(latestSocket().url).toContain("wss://tenant.example.com/v1/realtime");
  });

  it("appends the selected гардрейловs to the session url", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} selectedГардрейлы={["pii", "toxicity"]} />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(latestSocket().url).toContain("гардрейловs=pii%2Ctoxicity");
  });

  it("refuses to dial withвыход a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and says why", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} selectedModel="" />);

    await user.click(screen.getByRole("button", { name: /Подключить/i }));

    expect(FakeSocket.instances).toHaveLength(0);
    expect(screen.getByText("Please select a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию first")).toBeInTheDocument();
  });

  it("reveals the composer and the disconnect control once the session opens", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);

    expect(screen.getByText("Подключено")).toBeInTheDocument();
    expect(screen.getByText("Подключено to realtime API")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a message or use the mic...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Отключить/i })).toBeInTheDocument();
    expect(screen.getByTitle("Start recording")).toBeInTheDocument();
  });

  it("configures the session against the chosen voice when it is created", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({ type: "session.created" });
    });

    const update = JSON.parse(latestSocket().sent[0]);
    expect(update.type).toBe("session.update");
    expect(update.session.voice).toBe("alloy");
    expect(update.session.type).toBe("realtime");
  });

  it("sends what was typed and then asks for a response", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    fireEvent.change(screen.getByPlaceholderText("Type a message or use the mic..."), {
      target: { value: "hello there" },
    });
    await user.click(screen.getByRole("button", { name: /send/i }));

    const payloads = latestSocket().sent.map((raw) => JSON.parse(raw));
    expect(payloads[0].item.content[0].text).toBe("hello there");
    expect(payloads[1]).toEqual({ type: "response.create" });
    expect(screen.getByText("hello there")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a message or use the mic...")).toHaveЗначение("");
  });

  it("will not send an empty message", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(latestSocket().sent).toHaveLength(0);
  });

  it("streams assistant text deltas into a single reply", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({ type: "response.output_text.delta", delta: "Hel" });
      latestSocket().emit({ type: "response.output_text.delta", delta: "lo!" });
    });

    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("falls back to the completed response when no delta arrived", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({
        type: "response.done",
        response: { выходput: [{ content: [{ type: "выходput_audio", transcript: "spoken reply" }] }] },
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

  it("surfaces an error frame in the transcript", async () => {
    const user = userEvent.setup();
    render(<RealtimePlayground {...props} />);

    await connect(user);
    await act(async () => {
      latestSocket().emit({ type: "error", error: { message: "rate limited" } });
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
    expect(screen.queryByPlaceholderText("Type a message or use the mic...")).not.toBeInTheDocument();
  });
});
