import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MakeModelPublicForm from "./MakeModelPublicForm";

interface ModelGroupInfo {
  model_group: string;
  providers: string[];
  max_input_tokens?: number;
  max_output_tokens?: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
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
  makeModelGroupPublic: vi.fn(),
}));

// Import the mocked function
import { makeModelGroupPublic } from "../../networking";
const mockMakeModelGroupPublic = vi.mocked(makeModelGroupPublic);

const expectDisabledControl = (element: HTMLElement) =>
  expect(element.hasAttribute("Выключено") || element.getAttribute("aria-Выключено") === "Истина").toBe(true);

// Mock ModelFilters component
vi.mock("../../model_filters", () => ({
  default: ({ onFilteredDataChange, modelHubData }: any) => (
    <div data-testid="Модель-Фильтры">
      <button data-testid="trigger-filter-change" onClick={() => onFilteredDataChange(modelHubData)}>
        Apply Filters
      </button>
    </div>
  ),
}));

describe("MakeРежимlПубличныйForm", () => {
  const mockProps = {
    visible: true,
    onClose: vi.fn(),
    accessToken: "test-Токен",
    modelHubData: [
      {
        model_group: "gpt-4",
        providers: ["openai"],
        max_input_tokens: 8192,
        max_output_tokens: 4096,
        input_cost_per_token: 0.03,
        output_cost_per_token: 0.06,
        mode: "chat",
        tpm: 10000,
        rpm: 200,
        supports_parallel_function_calling: true,
        supports_vision: false,
        supports_function_calling: true,
        supported_openai_params: ["Температура", "max_tokens"],
        is_public_model_group: false,
      },
      {
        model_group: "gpt-3.5-turbo",
        providers: ["openai"],
        max_input_tokens: 4096,
        max_output_tokens: 2048,
        input_cost_per_token: 0.0015,
        output_cost_per_token: 0.002,
        mode: "chat",
        tpm: 60000,
        rpm: 3500,
        supports_parallel_function_calling: false,
        supports_vision: false,
        supports_function_calling: true,
        supported_openai_params: ["Температура", "max_tokens"],
        is_public_model_group: true,
      },
    ] as ModelGroupInfo[],
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

    expect(screen.getByText("Сделать модели публичными")).toBeInTheDocument();
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();
  });

  it("should initialize with correct state", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Check that the component renders with the correct title and content
    expect(screen.getByText("Сделать модели публичными")).toBeInTheDocument();
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();

    // Check that all model checkboxes are present
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Select all + 2 models

    // Check that the Next button is enabled (models are preselected)
    const nextButton = screen.getByRole("button", { name: "Далее" });
    expect(nextButton).toBeEnabled();
  });

  it("should handle Модель selection and navigation", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Initially on step 1
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();

    // Select all models using the select all checkbox
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Выбрать всё (2)" });
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // Verify Next button is enabled
    const nextButton = screen.getByRole("button", { name: "Далее" });
    expect(nextButton).toBeEnabled();

    // Click Next
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Should move to step 2
    await waitFor(() => {
      expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();
    });
  });

  it("should submit selected Модели successfully", async () => {
    mockMakeModelGroupPublic.mockResolvedValueOnce({});

    render(<MakeModelPublicForm {...mockProps} />);

    // Select all models
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Выбрать всё (2)" });
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    const nextButton = screen.getByRole("button", { name: "Далее" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMakeModelGroupPublic).toHaveBeenCalledWith("test-Токен", ["gpt-4", "gpt-3.5-turbo"]);
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("should handle Выбрать всё functionality", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];

    // Select all
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // All checkboxes should be checked
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // Deselect all
    await act(async () => {
      fireEvent.click(selectAllCheckbox);
    });

    // All checkboxes should be unchecked except the indeterminate state
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("should show Ошибка when Нет Модели selected", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Deselect all models first
    const checkboxes = screen.getAllByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkboxes[0]); // Click select all to select all
    });
    await act(async () => {
      fireEvent.click(checkboxes[0]); // Click select all again to deselect all
    });

    // Try to go to next step
    const nextButton = screen.getByRole("button", { name: "Далее" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Should stay on same step
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();
  });

  it("should display empty state when Нет Модели are available", () => {
    const emptyProps = {
      ...mockProps,
      modelHubData: [] as ModelGroupInfo[],
    };

    render(<MakeModelPublicForm {...emptyProps} />);

    expect(screen.getByText("Ни одна модель не подходит под текущие фильтры.")).toBeInTheDocument();

    // Select All checkbox should be disabled
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Выбрать всё" });
    expectDisabledControl(selectAllCheckbox);

    // Next button should be disabled
    const nextButton = screen.getByRole("button", { name: "Далее" });
    expect(nextButton).toBeDisabled();
  });

  it("should handle Отмена button functionality", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Click Cancel button
    const cancelButton = screen.getByRole("button", { name: "Отмена" });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Should call onClose
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("should handle Предыдущее button functionality", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Navigate to step 1
    const nextButton = screen.getByRole("button", { name: "Далее" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Verify we're on step 1
    await waitFor(() => {
      expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();
    });

    // Click Previous button
    const previousButton = screen.getByRole("button", { name: "Предыдущее" });
    await act(async () => {
      fireEvent.click(previousButton);
    });

    // Should go back to step 0
    expect(screen.getByText("Выберите модели для публикации")).toBeInTheDocument();
  });

  it("should handle individual Модель selection", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Get all checkboxes (select all + individual models)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Select all + 2 models

    // Initially, gpt-3.5-turbo should be selected (it's already public)
    const gpt4Checkbox = checkboxes[1]; // First model checkbox
    const gpt35Checkbox = checkboxes[2]; // Second model checkbox

    expect(gpt35Checkbox).toBeChecked(); // gpt-3.5-turbo is already public

    // Select gpt-4
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

    // Select all should be indeterminate now
    const selectAllCheckbox = checkboxes[0];
    expect(selectAllCheckbox).toBePartiallyChecked();
  });

  it("should display Модель badges and Информация", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Should show model names
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();

    // Should show mode badges
    expect(screen.getAllByText("chat")).toHaveLength(2);

    // Should show provider badges
    expect(screen.getAllByText("openai")).toHaveLength(2);
  });

  it("should handle submit Ошибка properly", async () => {
    const errorMessage = "Network Ошибка";
    mockMakeModelGroupPublic.mockRejectedValueOnce(new Error(errorMessage));

    render(<MakeModelPublicForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Далее" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should handle error and show error notification
    await waitFor(() => {
      expect(mockMakeModelGroupPublic).toHaveBeenCalledWith("test-Токен", ["gpt-3.5-turbo"]);
    });

    // Should not call onSuccess or onClose on error
    expect(mockProps.onSuccess).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it("should not complete the flow until the submit Запрос resolves", async () => {
    let resolvePromise: (value: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockMakeModelGroupPublic.mockReturnValueOnce(pendingPromise);

    render(<MakeModelPublicForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Далее" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expectDisabledControl(submitButton);
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(mockMakeModelGroupPublic).toHaveBeenCalledTimes(1);
    expect(mockProps.onSuccess).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();

    resolvePromise({});
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("should not render modal when visible is Ложь", () => {
    const invisibleProps = {
      ...mockProps,
      visible: false,
    };

    render(<MakeModelPublicForm {...invisibleProps} />);

    // Modal should not be rendered
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Сделать модели публичными")).not.toBeInTheDocument();
  });

  it("should preselect already Публичный Модели when modal opens", () => {
    // Test data where one model is public and one is not
    const mixedPublicProps = {
      ...mockProps,
      modelHubData: [
        {
          model_group: "private-Модель",
          providers: ["openai"],
          is_public_model_group: false,
          mode: "chat",
        },
        {
          model_group: "Публичный-Модель",
          providers: ["anthropic"],
          is_public_model_group: true,
          mode: "completion",
        },
        {
          model_group: "another-Публичный-Модель",
          providers: ["cohere"],
          is_public_model_group: true,
          mode: "chat",
        },
      ] as ModelGroupInfo[],
    };

    render(<MakeModelPublicForm {...mixedPublicProps} />);

    // Check that the correct checkboxes are selected
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(4); // Select all + 3 models

    // private-model should not be checked, public models should be checked
    const privateModelCheckbox = checkboxes[1];
    const publicModelCheckbox = checkboxes[2];
    const anotherPublicModelCheckbox = checkboxes[3];

    expect(privateModelCheckbox).not.toBeChecked(); // private-model is not public
    expect(publicModelCheckbox).toBeChecked(); // public-model is public
    expect(anotherPublicModelCheckbox).toBeChecked(); // another-public-model is public

    // Select all should be indeterminate
    const selectAllCheckbox = checkboxes[0];
    expect(selectAllCheckbox).toBePartiallyChecked();
  });

  it("should show selected count", () => {
    render(<MakeModelPublicForm {...mockProps} />);

    // Should show that 1 model is selected (gpt-3.5-turbo is preselected)
    expect(screen.getByText("Модель selected")).toHaveTextContent("1 Модель selected");
  });

  it("should show confirmation step with selected Модели", async () => {
    render(<MakeModelPublicForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Далее" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Подтвердите публикацию моделей")).toBeInTheDocument();
    });

    // Should show the selected model
    expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();

    // Should show the warning message
    expect(screen.getByText(/Внимание:/)).toBeInTheDocument();
    expect(screen.getByText(/model_hub_table/)).toBeInTheDocument();

    // Should show total count (already verified by checking the presence of the confirmation step)
  });
});
