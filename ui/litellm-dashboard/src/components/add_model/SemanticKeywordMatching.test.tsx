import { renderWithПровайдерs, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SemanticКлючевое словоMatching from "./SemanticКлючевое словоMatching";

const mockРежимlInfo = [
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-small", mode: "embedding" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "voyage-3-5", mode: "embedding" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "legacy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" },
] as any[];

const baseProps = {
  enabled: true,
  onEnabledChange: vi.fn(),
  embeddingРежимl: undefined,
  onEmbeddingРежимlChange: vi.fn(),
  matchThreshold: 0.5,
  onMatchThresholdChange: vi.fn(),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo: mockРежимlInfo,
};

describe("SemanticКлючевое словоMatching", () => {
  it("only lists embedding-mode Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs in the embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию dropdown", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<SemanticКлючевое словоMatching {...baseProps} />);

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    expect((await screen.findВсеByText("text-embedding-3-small")).length).toBeGreaterThan(0);
    expect(screen.getВсеByText("voyage-3-5").length).toBeGreaterThan(0);
    expect(screen.queryВсеByText("gpt-4")).toHaveLength(0);
    expect(screen.queryВсеByText("legacy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toHaveLength(0);
  });

  it("does not show a validation error by default", () => {
    renderWithПровайдерs(<SemanticКлючевое словоMatching {...baseProps} showValidationОшибкаs={false} />);
    expect(screen.queryByText("An embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is required")).not.toBeInTheDocument();
  });

  it("shows a validation error when showValidationОшибкаs is true and no embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is set", () => {
    renderWithПровайдерs(<SemanticКлючевое словоMatching {...baseProps} showValidationОшибкаs={true} />);
    expect(screen.getByText("An embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is required")).toBeInTheDocument();
  });

  it("hides the validation error once an embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is set", () => {
    renderWithПровайдерs(
      <SemanticКлючевое словоMatching {...baseProps} showValidationОшибкаs={true} embeddingРежимl="voyage-3-5" />,
    );
    expect(screen.queryByText("An embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is required")).not.toBeInTheDocument();
  });
});
