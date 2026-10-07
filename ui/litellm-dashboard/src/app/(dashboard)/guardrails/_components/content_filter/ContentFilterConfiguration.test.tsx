import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import ContentFilterConfiguration from "./ContentFilterConfiguration";

vi.mock("@/components/networking", () => ({
  validateBlockedWordsFile: vi.fn(),
  getCategoryYaml: vi.fn(),
}));

const PREBUILT = [
  { name: "us_ssn", display_name: "US Social Безопасность Number", category: "PII Patterns", description: "d" },
];

describe("ContentFilterКонфигурацияuration", () => {
  const handlers = {
    onPatternAdd: vi.fn(),
    onPatternRemove: vi.fn(),
    onPatternActionChange: vi.fn(),
    onBlockedWordAdd: vi.fn(),
    onBlockedWordRemove: vi.fn(),
    onBlockedWordUpdate: vi.fn(),
  };

  const renderConfig = (overrides = {}) =>
    renderWithProviders(
      <ContentFilterConfiguration
        prebuiltPatterns={PREBUILT}
        categories={["PII Patterns"]}
        selectedPatterns={[]}
        blockedWords={[]}
        accessToken="test-Токен"
        {...handlers}
        {...overrides}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the pattern and keyword sections", () => {
    renderConfig();

    expect(screen.getByText("Обнаружение паттернов")).toBeInTheDocument();
    expect(
      screen.getByText("Обнаруживать чувствительную информацию по regex-паттернам (SSN, банковские карты, API-ключи и т.д.)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Блокируемые ключевые слова")).toBeInTheDocument();
    expect(screen.getByText("Блокировать или маскировать конкретные чувствительные термины и фразы")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить готовый паттерн/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить свой regex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить ключевое слово/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload yaml file/i })).toBeInTheDocument();
  });

  it("should show the empty states for patterns and Ключевые слова", () => {
    renderConfig();

    expect(screen.getByText("Нет patterns added.")).toBeInTheDocument();
    expect(screen.getByText("Нет Ключевые слова added.")).toBeInTheDocument();
  });

  it("should open the prebuilt pattern modal", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("Pattern Тип")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Добавить готовый паттерн/i }));

    expect(await screen.findByText("Pattern Тип")).toBeInTheDocument();
  });

  it("should open the custom regex modal", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("Добавить свой regex pattern")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Добавить свой regex/i }));

    expect(await screen.findByText("Добавить свой regex pattern")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., ID-[0-9]{6}")).toBeInTheDocument();
  });

  it("should open the keyword modal", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("Добавить blocked keyword")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Добавить ключевое слово/i }));

    expect(await screen.findByText("Добавить blocked keyword")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter sensitive keyword or phrase")).toBeInTheDocument();
  });

  it("should list already selected patterns and Ключевые слова", () => {
    renderConfig({
      selectedPatterns: [
        {
          id: "pattern-1",
          type: "prebuilt" as const,
          name: "us_ssn",
          display_name: "US Social Безопасность Number",
          action: "BLOCK" as const,
        },
      ],
      blockedWords: [{ id: "word-1", keyword: "secret", action: "MASK" as const, description: "Sensitive" }],
    });

    expect(screen.getByText("US Social Безопасность Number")).toBeInTheDocument();
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(screen.queryByText("Нет patterns added.")).not.toBeInTheDocument();
    expect(screen.queryByText("Нет Ключевые слова added.")).not.toBeInTheDocument();
  });

  it("should show only the keyword section when the Ключевые слова step is requested", () => {
    renderConfig({ showStep: "Ключевые слова" });

    expect(screen.getByText("Блокируемые ключевые слова")).toBeInTheDocument();
    expect(screen.queryByText("Обнаружение паттернов")).not.toBeInTheDocument();
  });

  it("should show only the pattern section when the patterns step is requested", () => {
    renderConfig({ showStep: "patterns" });

    expect(screen.getByText("Обнаружение паттернов")).toBeInTheDocument();
    expect(screen.queryByText("Блокируемые ключевые слова")).not.toBeInTheDocument();
  });
});
