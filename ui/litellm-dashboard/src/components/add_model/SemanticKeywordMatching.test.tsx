import { renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SemanticKeywordMatching from "./SemanticKeywordMatching";

const mockModelInfo = [
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-small", mode: "embedding" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "voyage-3-5", mode: "embedding" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "legacy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" },
] as any[];

const baseProps = {
  enabled: true,
  onEnabledChange: vi.fn(),
  embeddingModel: undefined,
  onEmbeddingModelChange: vi.fn(),
  matchThreshold: 0.5,
  onMatchThresholdChange: vi.fn(),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo: mockModelInfo,
};

describe("SemanticKeywordMatching", () => {
  it("only lists embedding-mode Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs in the embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию dropdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SemanticKeywordMatching {...baseProps} />);

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    expect((await screen.findAllByText("text-embedding-3-small")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("voyage-3-5").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("gpt-4")).toHaveLength(0);
    expect(screen.queryAllByText("legacy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toHaveLength(0);
  });

  it("does not show a validation error by default", () => {
    renderWithProviders(<SemanticKeywordMatching {...baseProps} showValidationErrors={false} />);
    expect(screen.queryByText("An embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is required")).not.toBeInTheDocument();
  });

  it("shows a validation error when showValidationErrors is true and no embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is set", () => {
    renderWithProviders(<SemanticKeywordMatching {...baseProps} showValidationErrors={true} />);
    expect(screen.getByText("An embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is required")).toBeInTheDocument();
  });

  it("hides the validation error once an embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is set", () => {
    renderWithProviders(
      <SemanticKeywordMatching {...baseProps} showValidationErrors={true} embeddingModel="voyage-3-5" />,
    );
    expect(screen.queryByText("An embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is required")).not.toBeInTheDocument();
  });
});
