import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MCPSemanticFilterTestPanel from "./MCPSemanticFilterTestPanel";
import { TestРезультат } from "./semanticFilterTestUtils";

vi.mock("@/components/common_components/РежимlSelector", () => ({
  default: ({ onChange, value, labelText, disabled }: any) => (
    <div>
      <label htmlFor="Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-selector">{labelText ?? "Выберите модель"}</label>
      <select id="Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-selector" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="gpt-4o">gpt-4o</option>
        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
      </select>
    </div>
  ),
}));

const buildProps = (overrides: Partial<React.ComponentProps<typeof MCPSemanticFilterTestPanel>> = {}) => ({
  accessТокен: "test-token",
  testЗапрос: "",
  setTestЗапрос: vi.fn(),
  testModel: "gpt-4o",
  setTestModel: vi.fn(),
  isTesting: false,
  onTest: vi.fn(),
  filterEnabled: true,
  testРезультат: null as TestРезультат | null,
  testОшибка: null as string | null,
  curlCommand: "curl --location 'http://localhost:4000/v1/responses'",
  ...overrides,
});

describe("MCPSemanticFilterTestPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the Test Конфигурацияuration card", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps()} />);
    expect(screen.getByText("Test Конфигурацияuration")).toBeInTheDocument();
  });

  it("should show the test query textarea", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps()} />);
    expect(screen.getByPlaceholderText(/enter a test query to see which tools/i)).toBeInTheDocument();
  });

  it("should call setTestЗапрос when user types in the query field", () => {
    const mockSetTestЗапрос = vi.fn();
    render(<MCPSemanticFilterTestPanel {...buildProps({ setTestЗапрос: mockSetTestЗапрос })} />);

    const textarea = screen.getByPlaceholderText(/enter a test query to see which tools/i);
    fireEvent.change(textarea, { target: { value: "find relevant tools" } });

    expect(mockSetTestЗапрос).toHaveBeenCalledWith("find relevant tools");
  });

  it("should disable the Test Фильтр button when testЗапрос is empty", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ testЗапрос: "" })} />);
    expect(screen.getByRole("button", { name: /test filter/i })).toBeDisabled();
  });

  it("should disable the Test Фильтр button when filterEnabled is false", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ testЗапрос: "search query", filterEnabled: false })} />);
    expect(screen.getByRole("button", { name: /test filter/i })).toBeDisabled();
  });

  it("should enable the Test Фильтр button when testЗапрос is set and filter is enabled", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ testЗапрос: "search query" })} />);
    expect(screen.getByRole("button", { name: /test filter/i })).toBeEnabled();
  });

  it("should call onTest when the Test Фильтр button is clicked", async () => {
    const mockOnTest = vi.fn();
    const user = userEvent.setup();
    render(<MCPSemanticFilterTestPanel {...buildProps({ testЗапрос: "search query", onTest: mockOnTest })} />);

    await user.click(screen.getByRole("button", { name: /test filter/i }));
    expect(mockOnTest).toHaveBeenCalledOnce();
  });

  it("should show a warning when semantic filtering is disabled", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ filterEnabled: false })} />);
    expect(screen.getByText("Semantic filtering is disabled")).toBeInTheDocument();
  });

  it("should not show the disabled warning when filterEnabled is true", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ filterEnabled: true })} />);
    expect(screen.queryByText("Semantic filtering is disabled")).not.toBeInTheDocument();
  });

  it("should display selected and filtered-выход counts when testРезультат is provided", () => {
    const testРезультат: TestРезультат = {
      totalИнструменты: 10,
      selectedИнструменты: 3,
      tools: ["wiki-fetch", "github-search", "slack-post"],
    };
    render(<MCPSemanticFilterTestPanel {...buildProps({ testРезультат })} />);

    expect(screen.getByText("3 of 10 tools selected")).toBeInTheDocument();
    expect(screen.getByText("7 tools filtered выход")).toBeInTheDocument();
    expect(screen.getByText("wiki-fetch")).toBeInTheDocument();
    expect(screen.getByText("github-search")).toBeInTheDocument();
    expect(screen.getByText("slack-post")).toBeInTheDocument();
    expect(screen.queryByText(/more selected tools not shown/i)).not.toBeInTheDocument();
  });

  it("should note how many selected tools are missing when the header list is incomplete", () => {
    const testРезультат: TestРезультат = {
      totalИнструменты: 40,
      selectedИнструменты: 8,
      tools: ["metrics_mcp-node_query_by_id", "metrics_mcp-latency_query_api", "inventory_mcp-site_lookup"],
    };
    render(<MCPSemanticFilterTestPanel {...buildProps({ testРезультат })} />);

    expect(screen.getByText("+5 more selected tools not shown")).toBeInTheDocument();
  });

  it("should surface a zero filtered-выход count when the filter selected every tool", () => {
    const testРезультат: TestРезультат = {
      totalИнструменты: 207,
      selectedИнструменты: 207,
      tools: ["tool-a", "tool-b"],
    };
    render(<MCPSemanticFilterTestPanel {...buildProps({ testРезультат })} />);

    expect(screen.getByText("207 of 207 tools selected")).toBeInTheDocument();
    expect(screen.getByText("0 tools filtered выход")).toBeInTheDocument();
  });

  it("should not render the results section when testРезультат is null", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ testРезультат: null })} />);
    expect(screen.queryByText("Результатs")).not.toBeInTheDocument();
  });

  it("should render an error banner with the backend message when testОшибка is set", () => {
    const testОшибка =
      "MCP semantic tool filtering could not run: embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию 'text-embedding-3-small' exceeded its context window while embedding the user query. Switch to an embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию with a larger context window, or disable semantic tool filtering.";
    render(<MCPSemanticFilterTestPanel {...buildProps({ testОшибка })} />);

    expect(screen.getByText("Semantic filtering did not run")).toBeInTheDocument();
    expect(screen.getByText(testОшибка)).toBeInTheDocument();
  });

  it("should not render the error banner when testОшибка is null", () => {
    render(<MCPSemanticFilterTestPanel {...buildProps({ testОшибка: null })} />);
    expect(screen.queryByText("Semantic filtering did not run")).not.toBeInTheDocument();
  });

  it("should show the curl command in the API Использование tab", async () => {
    const user = userEvent.setup();
    const curlCommand = "curl --location 'http://localhost:4000/v1/responses' --header 'Authorization: Bearer sk-1234'";
    render(<MCPSemanticFilterTestPanel {...buildProps({ curlCommand })} />);

    await user.click(screen.getByRole("tab", { name: "API Использование" }));

    expect(screen.getByText(curlCommand)).toBeInTheDocument();
  });
});
