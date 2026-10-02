import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithПровайдерs, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import ContentФильтрКонфигурацияuration from "./ContentФильтрКонфигурацияuration";

vi.mock("@/components/networking", () => ({
  validateBlockedWordsFile: vi.fn(),
  getКатегорияYaml: vi.fn(),
}));

const PREBUILT = [
  { name: "us_ssn", display_name: "US Social Безопасность Number", category: "PII Паттернs", description: "d" },
];

describe("ContentФильтрКонфигурацияuration", () => {
  const handlers = {
    onПаттернAdd: vi.fn(),
    onПаттернRemove: vi.fn(),
    onПаттернДействиеChange: vi.fn(),
    onBlockedWordAdd: vi.fn(),
    onBlockedWordRemove: vi.fn(),
    onBlockedWordUpdate: vi.fn(),
  };

  const renderКонфигурация = (overrides = {}) =>
    renderWithПровайдерs(
      <ContentФильтрКонфигурацияuration
        prebuiltПаттернs={PREBUILT}
        categories={["PII Паттернs"]}
        selectedПаттернs={[]}
        blockedWords={[]}
        accessТокен="test-token"
        {...handlers}
        {...overrides}
      />,
    );

  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should render the pattern and keyword sections", () => {
    renderКонфигурация();

    expect(screen.getByText("Паттерн Detection")).toBeInTheDocument();
    expect(
      screen.getByText("Добавить готовый паттерн"),
    ).toBeInTheDocument();
    expect(screen.getByText("Blocked Ключевые слова")).toBeInTheDocument();
    expect(screen.getByText("Добавить ключевое слово")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add prebuilt pattern/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add custom regex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add keyword/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload yaml file/i })).toBeInTheDocument();
  });

  it("should show the empty states for patterns and keywords", () => {
    renderКонфигурация();

    expect(screen.getByText("No patterns added.")).toBeInTheDocument();
    expect(screen.getByText("No keywords added.")).toBeInTheDocument();
  });

  it("should open the prebuilt pattern modal", async () => {
    const user = userEvent.setup();
    renderКонфигурация();

    expect(screen.queryByText("Паттерн type")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add prebuilt pattern/i }));

    expect(await screen.findByText("Паттерн type")).toBeInTheDocument();
  });

  it("should open the custom regex modal", async () => {
    const user = userEvent.setup();
    renderКонфигурация();

    expect(screen.queryByText("<CardTitle>Блокируемые ключевые слова</CardTitle> pattern")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add custom regex/i }));

    expect(await screen.findByText("<CardTitle>Блокируемые ключевые слова</CardTitle> pattern")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., ID-[0-9]{6}")).toBeInTheDocument();
  });

  it("should open the keyword modal", async () => {
    const user = userEvent.setup();
    renderКонфигурация();

    expect(screen.queryByText("Add blocked keyword")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add keyword/i }));

    expect(await screen.findByText("Add blocked keyword")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Введите sensitive keyword or phrase")).toBeInTheDocument();
  });

  it("should list already selected patterns and keywords", () => {
    renderКонфигурация({
      selectedПаттернs: [
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
    expect(screen.queryByText("No patterns added.")).not.toBeInTheDocument();
    expect(screen.queryByText("No keywords added.")).not.toBeInTheDocument();
  });

  it("should show only the keyword section when the keywords step is requested", () => {
    renderКонфигурация({ showStep: "keywords" });

    expect(screen.getByText("Blocked Ключевые слова")).toBeInTheDocument();
    expect(screen.queryByText("Паттерн Detection")).not.toBeInTheDocument();
  });

  it("should show only the pattern section when the patterns step is requested", () => {
    renderКонфигурация({ showStep: "patterns" });

    expect(screen.getByText("Паттерн Detection")).toBeInTheDocument();
    expect(screen.queryByText("Blocked Ключевые слова")).not.toBeInTheDocument();
  });
});
