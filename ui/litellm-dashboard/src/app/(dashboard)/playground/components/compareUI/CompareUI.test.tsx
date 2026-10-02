import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CompareUI from "./CompareUI";
import { makeOpenAIChatCompletionЗапрос } from "@/components/llm_calls/chat_completion";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedЗначение([{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4" }, { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo" }]),
}));

vi.mock("@/components/llm_calls/chat_completion", () => ({
  makeOpenAIChatCompletionЗапрос: vi.fn().mockResolvedЗначение(undefined),
}));

let capturedOnImageUpload: ((file: File) => false) | null = null;

vi.mock("../chat_ui/ChatImageUpload", () => ({
  default: ({ onImageUpload }: { onImageUpload: (file: File) => false }) => {
    capturedOnImageUpload = onImageUpload;
    return (
      <div data-testid="chat-image-upload">
        <button data-testid="trigger-upload">Upload</button>
      </div>
    );
  },
}));

vi.mock("../chat_ui/ChatImageUtils", () => ({
  createChatMultimodalСообщение: vi.fn().mockResolvedЗначение({
    role: "user",
    content: [
      { type: "text", text: "test message" },
      { type: "image_url", image_url: { url: "data:image/png;base64,test" } },
    ],
  }),
  createChatDisplayСообщение: vi.fn().mockReturnЗначение({
    role: "user",
    content: "test message [Image attached]",
    imagePreviewUrl: "blob:test-url",
  }),
}));

vi.mock("./components/ComparisonPanel", () => ({
  ComparisonPanel: ({ comparison, onRemove }: { comparison: any; onRemove: () => void }) => (
    <div data-testid={`comparison-panel-${comparison.id}`}>
      <button data-testid={`remove-${comparison.id}`} onClick={onRemove}>
        Remove
      </button>
    </div>
  ),
}));

vi.mock("./components/СообщениеВход", () => ({
  СообщениеВход: ({ value, onChange, onSend, disabled, hasAttachment, uploadComponent }: any) => (
    <div data-testid="message-input">
      {uploadComponent && <div data-testid="upload-component">{uploadComponent}</div>}
      <textarea
        data-testid="message-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button data-testid="send-button" onClick={onSend} disabled={disabled}>
        Send
      </button>
      {hasAttachment && <div data-testid="has-attachment">Attachment</div>}
    </div>
  ),
}));

beforeEach(() => {
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
  global.URL.createObjectURL = vi.fn().mockReturnЗначение("blob:test-url");
  global.URL.revokeObjectURL = vi.fn();
  capturedOnImageUpload = null;
  vi.clearAllMocks();
});

describe("CompareUI", () => {
  it("should render", () => {
    render(<CompareUI accessТокен="test-token" disabledPersonalKeyCreation={false} />);
    expect(screen.getByTestId("comparison-panel-1")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-panel-2")).toBeInTheDocument();
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
  });

  it("adds a comparison when Добавить сравнение button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<CompareUI accessТокен="test-token" disabledPersonalKeyCreation={false} />);

    // Verify initial state: 2 comparison panels
    expect(screen.getByTestId("comparison-panel-1")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-panel-2")).toBeInTheDocument();
    let comparisonPanels = container.querySelectorВсе('[data-testid^="comparison-panel-"]');
    expect(comparisonPanels).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /Добавить сравнение/i }));

    // Wait for the new comparison panel to be added (should have 3 total now)
    await waitFor(() => {
      comparisonPanels = container.querySelectorВсе('[data-testid^="comparison-panel-"]');
      expect(comparisonPanels).toHaveLength(3);
    });

    // Verify the original 2 panels are still there
    expect(screen.getByTestId("comparison-panel-1")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-panel-2")).toBeInTheDocument();
  });

  it("should handle image upload and send message with attachment", async () => {
    const user = userEvent.setup();
    render(<CompareUI accessТокен="test-token" disabledPersonalKeyCreation={false} />);

    const file = new File(["test content"], "test-image.png", { type: "image/png" });

    await waitFor(() => {
      expect(capturedOnImageUpload).not.toBeNull();
    });

    if (capturedOnImageUpload) {
      capturedOnImageUpload(file);
    }

    await waitFor(() => {
      expect(screen.getByTestId("has-attachment")).toBeInTheDocument();
    });

    const textarea = screen.getByTestId("message-textarea");
    fireEvent.change(textarea, { target: { value: "Describe this image" } });

    const sendButton = screen.getByTestId("send-button");
    expect(sendButton).toBeEnabled();
    await user.click(sendButton);

    await waitFor(() => {
      expect(makeOpenAIChatCompletionЗапрос).toHaveBeenCalled();
    });
  });
});
