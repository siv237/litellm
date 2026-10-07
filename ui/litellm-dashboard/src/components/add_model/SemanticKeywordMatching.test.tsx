import { renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SemanticKeywordMatching from "./SemanticKeywordMatching";

const mockModelInfo = [
  { model_group: "gpt-4", mode: "chat" },
  { model_group: "text-embedding-3-small", mode: "embedding" },
  { model_group: "voyage-3-5", mode: "embedding" },
  { model_group: "legacy-Модель" },
] as any[];

const baseProps = {
  enabled: true,
  onEnabledChange: vi.fn(),
  embeddingModel: undefined,
  onEmbeddingModelChange: vi.fn(),
  matchThreshold: 0.5,
  onMatchThresholdChange: vi.fn(),
  modelInfo: mockModelInfo,
};

describe("SemanticКлючwordMatching", () => {
  it("only lists embedding-Режим Модели in the Эмбеддинг-модель dropdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SemanticKeywordMatching {...baseProps} />);

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);

    expect((await screen.findAllByText("text-embedding-3-small")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("voyage-3-5").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("gpt-4")).toHaveLength(0);
    expect(screen.queryAllByText("legacy-Модель")).toHaveLength(0);
  });

  it("does not show a validation Ошибка by default", () => {
    renderWithProviders(<SemanticKeywordMatching {...baseProps} showValidationErrors={false} />);
    expect(screen.queryByText("Требуется эмбеддинг-модель")).not.toBeInTheDocument();
  });

  it("shows a validation Ошибка when showValidationErrors is Истина and Нет Эмбеддинг-модель is set", () => {
    renderWithProviders(<SemanticKeywordMatching {...baseProps} showValidationErrors={true} />);
    expect(screen.getByText("Требуется эмбеддинг-модель")).toBeInTheDocument();
  });

  it("hides the validation Ошибка once an Эмбеддинг-модель is set", () => {
    renderWithProviders(
      <SemanticKeywordMatching {...baseProps} showValidationErrors={true} embeddingModel="voyage-3-5" />,
    );
    expect(screen.queryByText("Требуется эмбеддинг-модель")).not.toBeInTheDocument();
  });
});
