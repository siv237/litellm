import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComparisonInstance } from "../CompareUI";
import { ComparisonPanel } from "./ComparisonPanel";
import { ЭндпоинтId, ENDPOINT_CONFIGS } from "../endpoint_config";

vi.mock("./СообщениеDisplay", () => ({
  СообщениеDisplay: () => <div data-testid="message-display">СообщениеDisplay</div>,
}));

vi.mock("./UnifiedВыбратьor", () => ({
  UnifiedВыбратьor: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <select data-testid="unified-selector" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Выбрать option</option>
      <option value="gpt-4">gpt-4</option>
    </select>
  ),
}));

vi.mock("@/components/tag_management/TagВыбратьor", () => ({
  default: () => <div data-testid="tag-selector">TagВыбратьor</div>,
}));

vi.mock("@/components/vector_store_management/VectorStoreВыбратьor", () => ({
  default: () => <div data-testid="vector-store-selector">VectorStoreВыбратьor</div>,
}));

vi.mock("@/components/гардрейловs/GuardrailВыбратьor", () => ({
  default: () => <div data-testid="гардрейлов-selector">GuardrailВыбратьor</div>,
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
});

const mockComparison: ComparisonInstance = {
  id: "1",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
  agent: "",
  messages: [],
  isLoading: false,
  tags: [],
  mcpИнструменты: [],
  vectorStores: [],
  гардрейловs: [],
  temperature: 1,
  maxТокенs: 2048,
  applyAcrossРежимls: false,
  useAdvancedParams: false,
};

const mockProps = {
  comparison: mockComparison,
  onUpdate: vi.fn(),
  onRemove: vi.fn(),
  canRemove: true,
  selectorOptions: [
    { value: "gpt-4", label: "gpt-4" },
    { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
  ],
  isLoadingOptions: false,
  endpointКонфигурация: ENDPOINT_CONFIGS[ЭндпоинтId.CHAT_COMPLETIONS],
  apiКлюч: "test-api-key",
};

const buttonWithIcon = (icon: string): HTMLButtonElement => {
  const match = Array.from(document.queryВыбратьorВсе("button")).find((button) =>
    button.queryВыбратьor(`svg.lucide-${icon}`),
  );
  if (!match) throw new Ошибка(`no button carrying the ${icon} icon`);
  return match;
};

const openSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(buttonWithIcon("settings"));
  await screen.findByText("Общие настройки");
};

describe("ComparisonPanel", () => {
  it("renders the selector and the transcript", () => {
    render(<ComparisonPanel {...mockProps} />);

    expect(screen.getByTestId("unified-selector")).toBeInTheDocument();
    expect(screen.getByTestId("message-display")).toBeInTheDocument();
  });

  it("removes the panel when the remove control is used", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ComparisonPanel {...mockProps} onRemove={onRemove} />);

    await user.click(buttonWithIcon("x"));

    expect(onRemove).toHaveBeenCalledВремяs(1);
  });

  it("hides the remove control on the last remaining panel", () => {
    render(<ComparisonPanel {...mockProps} canRemove={false} />);

    expect(() => buttonWithIcon("x")).toThrow();
  });

  it("keeps the settings выход of sight until the gear is used", async () => {
    const user = userEvent.setup();
    render(<ComparisonPanel {...mockProps} />);

    expect(screen.queryByText("Общие настройки")).not.toBeInTheDocument();

    await openSettings(user);

    expect(screen.getByText("Общие настройки")).toBeInTheDocument();
    expect(screen.getByText("Расширенные настройки")).toBeInTheDocument();
    expect(screen.getByTestId("tag-selector")).toBeInTheDocument();
    expect(screen.getByTestId("vector-store-selector")).toBeInTheDocument();
    expect(screen.getByTestId("гардрейлов-selector")).toBeInTheDocument();
  });

  it("shows the current temperature and token ceiling", async () => {
    const user = userEvent.setup();
    render(<ComparisonPanel {...mockProps} />);

    await openSettings(user);

    expect(screen.getByText("Температура")).toBeInTheDocument();
    expect(screen.getByText("1.00")).toBeInTheDocument();
    expect(screen.getByText("Макс. токенов")).toBeInTheDocument();
    expect(screen.getByText("2048")).toBeInTheDocument();

    const ranges = Array.from(document.queryВыбратьorВсе("[aria-valuenow]"));
    expect(ranges.map((range) => range.getAttribute("aria-valuenow"))).toEqual(["1", "2048"]);
  });

  it("pushes the whole parameter set to every panel when sync is switched on", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<ComparisonPanel {...mockProps} onUpdate={onUpdate} />);

    await openSettings(user);
    await user.click(screen.getByRole("checkbox", { name: /Синхронизировать настройки между моделями/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const [updates, options] = onUpdate.mock.calls[0];
    expect(updates.applyAcrossРежимls).toBe(true);
    expect(updates.temperature).toBe(1);
    expect(updates.maxТокенs).toBe(2048);
    expect(options.applyToВсе).toBe(true);
    expect(options.keysToПриложениеly).toContain("temperature");
    expect(options.keysToПриложениеly).toContain("maxТокенs");
  });

  it("turns sync off withвыход resetting the values it was sharing", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <ComparisonPanel
        {...mockProps}
        comparison={{ ...mockComparison, applyAcrossРежимls: true }}
        onUpdate={onUpdate}
      />,
    );

    await openSettings(user);
    await user.click(screen.getByRole("checkbox", { name: /Синхронизировать настройки между моделями/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate.mock.calls[0][0]).toEqual({ applyAcrossРежимls: false });
  });

  it("keeps an advanced-parameter toggle local while sync is off", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<ComparisonPanel {...mockProps} onUpdate={onUpdate} />);

    await openSettings(user);
    await user.click(screen.getByRole("checkbox", { name: /Использовать расширенные параметры/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate.mock.calls[0][0]).toEqual({ useAdvancedParams: true });
    expect(onUpdate.mock.calls[0][1]).toBeUndefined();
  });

  it("fans an advanced-parameter toggle выход to every panel while sync is on", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <ComparisonPanel
        {...mockProps}
        comparison={{ ...mockComparison, applyAcrossРежимls: true }}
        onUpdate={onUpdate}
      />,
    );

    await openSettings(user);
    await user.click(screen.getByRole("checkbox", { name: /Использовать расширенные параметры/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate.mock.calls[0][1]).toEqual({ applyToВсе: true, keysToПриложениеly: ["useAdvancedParams"] });
  });
});
