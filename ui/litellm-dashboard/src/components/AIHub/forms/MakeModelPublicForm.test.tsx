import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MakeModelPublicForm from "./MakeModelPublicForm";

interface РежимlGroupInfo {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: string;
  providers: string[];
  max_input_tokens?: number;
  max_output_tokens?: number;
  input_cost_per_token?: number;
  выходput_cost_per_token?: number;
  mode?: string;
  tpm?: number;
  rpm?: number;
  supports_parallel_function_calling: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  supported_openai_params?: string[];
  is_public_model_group: boolean;
  [key: string]: any;
}

// Mock the networking function
vi.mock("../../networking", () => ({
  makeModelGroupПубличный: vi.fn(),
}));

// Import the mocked function
import { makeModelGroupПубличный } from "../../networking";
const mockMakeModelGroupПубличный = vi.mocked(makeModelGroupПубличный);

const expectDisabledControl = (element: HTMLElement) =>
  expect(element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true").toBe(true);

// Mock РежимlФильтры component
vi.mock("../../Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_filters", () => ({
  default: ({ onFilteredDataChange, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubData }: any) => (
    <div data-testid="Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-filters">
      <button data-testid="trigger-filter-change" onClick={() => onFilteredDataChange(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubData)}>
        Приложениеly Фильтры
      </button>
    </div>
  ),
}));

describe("MakeModelPublicForm", () => {
  const mockProps = {
    visible: true,
    onClose: vi.fn(),
    accessТокен: "test-token",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubData: [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4",
        providers: ["openai"],
        max_input_tokens: 8192,
        max_output_tokens: 4096,
        input_cost_per_token: 0.03,
        выходput_cost_per_token: 0.06,
        mode: "chat",
        tpm: 10000,
        rpm: 200,
        supports_parallel_function_calling: true,
        supports_vision: false,
        supports_function_calling: true,
        supported_openai_params: ["temperature", "max_tokens"],
        is_public_model_group: false,
      },
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo",
        providers: ["openai"],
        max_input_tokens: 4096,
        max_output_tokens: 2048,
        input_cost_per_token: 0.0015,
        выходput_cost_per_token: 0.002,
        mode: "chat",
        tpm: 60000,
        rpm: 3500,
        supports_parallel_function_calling: false,
        supports_vision: false,
        supports_function_calling: true,
        supported_openai_params: ["temperature", "max_tokens"],
        is_public_model_group: true,
      },
    ] as РежимlGroupInfo[],
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should render the component", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    expect(screen.getByText("Make Режимls Публичный")).toBeInTheDocument();
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();
  });

  it("should initialize with correct state", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Check that the component renders with the correct title and content
    expect(screen.getByText("Make Режимls Публичный")).toBeInTheDocument();
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();

    // Check that all Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию checkboxes are present
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Выбрать all + 2 Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs

    // Check that the Next button is enabled (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs are preselected)
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeEnabled();
  });

  it("should handle Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selection and navigation", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Initially on step 1
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();

    // Выбрать all Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs using the select all checkbox
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Снять выделение (2)" });
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // Verify Next button is enabled
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeEnabled();

    // Click Next
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Should move to step 2
    await waitFor(() => {
      expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();
    });
  });

  it("should submit selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs successfully", async () => {
    mockMakeModelGroupПубличный.mockResolvedValueOnce({});

    render(<MakeModelPublicForm {...mockProps} />);

    // Выбрать all Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Снять выделение (2)" });
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMakeModelGroupПубличный).toHaveBeenCalledWith("test-token", ["gpt-4", "gpt-3.5-turbo"]);
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("should handle select all functionality", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];

    // Выбрать all
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // Все checkboxes should be checked
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // Deselect all
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // Все checkboxes should be unchecked except the indeterminate state
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("should show error when no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs selected", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Deselect all Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs first
    const checkboxes = screen.getAllByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkboxes[0]); // Click select all to select all
    });
    await act(async () => {
      fireEvent.click(checkboxes[0]); // Click select all again to deselect all
    });

    // Try to go to next step
    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Should stay on same step
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();
  });

  it("should display empty state when no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs are available", () => {
    const emptyProps = {
      ...mockProps,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubData: [] as РежимlGroupInfo[],
    };

    render(<MakeModelPublicForm {...emptyProps} />);

    expect(screen.getByText("No Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs match the current filters.")).toBeInTheDocument();

    // Снять выделение checkbox should be disabled
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Снять выделение" });
    expectDisabledControl(selectAllCheckbox);

    // Next button should be disabled
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
  });

  it("should handle Cancel button functionality", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Click Cancel button
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Should call onClose
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("should handle Предыдущее button functionality", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Navigate to step 1
    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Verify we're on step 1
    await waitFor(() => {
      expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();
    });

    // Click Предыдущее button
    const previousButton = screen.getByRole("button", { name: "Предыдущее" });
    await act(async () => {
      fireEvent.click(previousButton);
    });

    // Should go back to step 0
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();
  });

  it("should handle individual Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selection", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Get all checkboxes (select all + individual Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Выбрать all + 2 Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs

    // Initially, gpt-3.5-turbo should be selected (it's already public)
    const gpt4Checkbox = checkboxes[1]; // First Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию checkbox
    const gpt35Checkbox = checkboxes[2]; // Second Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию checkbox

    expect(gpt35Checkbox).toBeChecked(); // gpt-3.5-turbo is already public

    // Выбрать gpt-4
    await act(async () => {
      fireEvent.click(gpt4Checkbox);
    });

    expect(gpt4Checkbox).toBeChecked();
    expect(gpt35Checkbox).toBeChecked();

    // Deselect gpt-3.5-turbo
    await act(async () => {
      fireEvent.click(gpt35Checkbox);
    });

    expect(gpt4Checkbox).toBeChecked();
    expect(gpt35Checkbox).not.toBeChecked();

    // Выбрать all should be indeterminate now
    const selectAllCheckbox = checkboxes[0];
    expect(selectAllCheckbox).toBePartiallyChecked();
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию badges and information", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Should show Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию names
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();

    // Should show mode badges
    expect(screen.getAllByText("chat")).toHaveLength(2);

    // Should show provider badges
    expect(screen.getAllByText("openai")).toHaveLength(2);
  });

  it("should handle submit error properly", async () => {
    const errorСообщение = "Network error";
    mockMakeModelGroupПубличный.mockRejectedValueOnce(new Ошибка(errorСообщение));

    render(<MakeModelPublicForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should handle error and show error notification
    await waitFor(() => {
      expect(mockMakeModelGroupПубличный).toHaveBeenCalledWith("test-token", ["gpt-3.5-turbo"]);
    });

    // Should not call onSuccess or onClose on error
    expect(mockProps.onSuccess).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it("should not complete the flow until the submit request resolves", async () => {
    let resolvePromise: (value: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockMakeModelGroupPublic.mockReturnValueOnce(pendingPromise);

    render(<MakeModelPublicForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expectDisabledControl(submitButton);
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(mockMakeModelGroupПубличный).toHaveBeenCalledTimes(1);
    expect(mockProps.onSuccess).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();

    resolvePromise({});
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("should not render modal when visible is false", () => {
    const invisibleProps = {
      ...mockProps,
      visible: false,
    };

    render(<MakeModelPublicForm {...invisibleProps} />);

    // Modal should not be rendered
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Make Режимls Публичный")).not.toBeInTheDocument();
  });

  it("should preselect already public Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs when modal opens", () => {
    // Test data where one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is public and one is not
    const mixedPublicProps = {
      ...mockProps,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubData: [
        {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "private-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
          providers: ["openai"],
          is_public_model_group: false,
          mode: "chat",
        },
        {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "public-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
          providers: ["anthropic"],
          is_public_model_group: true,
          mode: "completion",
        },
        {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "another-public-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
          providers: ["cohere"],
          is_public_model_group: true,
          mode: "chat",
        },
      ] as РежимlGroupInfo[],
    };

    render(<MakeModelPublicForm {...mixedPublicProps} />);

    // Check that the correct checkboxes are selected
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4); // Выбрать all + 3 Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs

    // private-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию should not be checked, public Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs should be checked
    const privateModelCheckbox = checkboxes[1];
    const publicModelCheckbox = checkboxes[2];
    const anotherPublicModelCheckbox = checkboxes[3];

    expect(privateModelCheckbox).not.toBeChecked(); // private-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is not public
    expect(publicModelCheckbox).toBeChecked(); // public-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is public
    expect(anotherPublicModelCheckbox).toBeChecked(); // another-public-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is public

    // Выбрать all should be indeterminate
    const selectAllCheckbox = checkboxes[0];
    expect(selectAllCheckbox).toBePartiallyChecked();
  });

  it("should show selected count", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Should show that 1 Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is selected (gpt-3.5-turbo is preselected)
    expect(screen.getByText("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selected")).toHaveTextContent("1 Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selected");
  });

  it("should show confirmation step with selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Confirm Making Режимls Публичный")).toBeInTheDocument();
    });

    // Should show the selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию
    expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();

    // Should show the warning message
    expect(screen.getByText(/Warning:/)).toBeInTheDocument();
    expect(screen.getByText(/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_hub_table/)).toBeInTheDocument();

    // Should show total count (already verified by checking the presence of the confirmation step)
  });
});
