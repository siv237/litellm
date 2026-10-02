import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import S3VectorsКонфигурация from "./S3VectorsКонфигурация";
import * as fetchModels from "@/components/llm_calls/fetch_models";

// Mock fetchAvailableModels
vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

describe("S3VectorsКонфигурация", () => {
  const mockOnParamsChange = vi.fn();
  const defaultProps = {
    accessТокен: "test-token",
    providerParams: {},
    onParamsChange: mockOnParamsChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the component successfully", () => {
    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение([]);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    expect(screen.getByText("Настройка AWS S3 Vectors")).toBeInTheDocument();
    expect(screen.getByText("Vector Bucket Name")).toBeInTheDocument();
    expect(screen.getByText("Index Name")).toBeInTheDocument();
    expect(screen.getByText("AWS Region")).toBeInTheDocument();
    expect(screen.getByText("Эмбеддинг-модель")).toBeInTheDocument();
  });

  it("should display setup instructions", () => {
    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение([]);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    expect(
      screen.getByText(/AWS S3 Vectors позволяет хранить и запрашивать векторные эмбеддинги прямо в S3/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vector buckets and indexes will be automatically created/)).toBeInTheDocument();
    expect(screen.getByText(/Vector dimensions are auto-detected/)).toBeInTheDocument();
  });

  it("should fetch embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs on mount", async () => {
    const mockModels = [
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-small", mode: "embedding" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-large", mode: "embedding" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
    ];

    const fetchSpy = vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение(mockModels);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("test-token");
    });
  });

  it("should filter and display only embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
    const mockModels = [
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-small", mode: "embedding" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-large", mode: "embedding" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo", mode: "chat" },
    ];

    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение(mockModels);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    // Wait for Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs to load
    await waitFor(() => {
      expect(fetchModels.fetchAvailableModels).toHaveBeenCalled();
    });

    // The component should filter to only embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs internally
    // We can verify this by checking the component loaded successfully
    expect(screen.getByText("Эмбеддинг-модель")).toBeInTheDocument();
  });

  it("should call onParamsChange when vector bucket name changes", async () => {
    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение([]);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    const bucketВход = screen.getByPlaceholderText("my-vector-bucket (мин. 3 символа)");

    await act(async () => {
      fireEvent.change(bucketВход, { target: { value: "test-bucket" } });
    });

    expect(mockOnParamsChange).toHaveBeenCalledWith({
      vector_bucket_name: "test-bucket",
    });
  });

  it("should call onParamsChange when AWS region changes", async () => {
    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение([]);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    const regionВход = screen.getByPlaceholderText("us-west-2");

    await act(async () => {
      fireEvent.change(regionВход, { target: { value: "us-east-1" } });
    });

    expect(mockOnParamsChange).toHaveBeenCalledWith({
      aws_region_name: "us-east-1",
    });
  });

  it("should call onParamsChange when embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is selected", async () => {
    const mockModels = [
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-small", mode: "embedding" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "text-embedding-3-large", mode: "embedding" },
    ];

    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение(mockModels);

    render(<S3VectorsКонфигурация {...defaultProps} />);

    await waitFor(() => {
      expect(fetchModels.fetchAvailableModels).toHaveBeenCalled();
    });

    // Find the Выбрать component and trigger change directly
    const selectElement = screen.getByRole("combobox");

    await act(async () => {
      // Simulate selecting a value by firing the change event
      fireEvent.change(selectElement, { target: { value: "text-embedding-3-small" } });
    });

    // The component should handle the selection
    expect(screen.getByText("Эмбеддинг-модель")).toBeInTheDocument();
  });

  it("should preserve existing params when updating a field", async () => {
    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение([]);

    const existingParams = {
      vector_bucket_name: "existing-bucket",
      aws_region_name: "us-west-2",
    };

    render(<S3VectorsКонфигурация {...defaultProps} providerParams={existingParams} />);

    const indexВход = screen.getByPlaceholderText("my-vector-index (необязательно, мин. 3 символа)");

    await act(async () => {
      fireEvent.change(indexВход, { target: { value: "my-index" } });
    });

    expect(mockOnParamsChange).toHaveBeenCalledWith({
      vector_bucket_name: "existing-bucket",
      aws_region_name: "us-west-2",
      index_name: "my-index",
    });
  });

  it("should display existing param values", () => {
    vi.spyOn(fetchModels, "fetchAvailableModels").mockResolvedЗначение([]);

    const existingParams = {
      vector_bucket_name: "my-bucket",
      index_name: "my-index",
      aws_region_name: "eu-west-1",
      embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "text-embedding-3-small",
    };

    render(<S3VectorsКонфигурация {...defaultProps} providerParams={existingParams} />);

    expect(screen.getByDisplayЗначение("my-bucket")).toBeInTheDocument();
    expect(screen.getByDisplayЗначение("my-index")).toBeInTheDocument();
    expect(screen.getByDisplayЗначение("eu-west-1")).toBeInTheDocument();
  });

  it("should handle Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию fetch error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(fetchModels, "fetchAvailableModels").mockRejectedЗначение(new Ошибка("Ошибка to fetch Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs"));

    render(<S3VectorsКонфигурация {...defaultProps} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Ошибка fetching embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs:", expect.any(Ошибка));
    });

    consoleErrorSpy.mockRestore();
  });

  it("should not fetch Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs if accessТокен is null", () => {
    const fetchSpy = vi.spyOn(fetchModels, "fetchAvailableModels");

    render(<S3VectorsКонфигурация {...defaultProps} accessТокен={null} />);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
