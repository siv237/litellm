import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddРезервные модели, { Резервные модели } from "./AddРезервные модели";
import * as fetchModelsModule from "@/components/llm_calls/fetch_models";
import { toast } from "@/lib/toast";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

vi.mock("./FallbackSelectionForm", () => ({
  FallbackSelectionForm: ({ groups, onGroupsChange }: any) => {
    const handleUpdateGroup = () => {
      if (groups.length > 0) {
        const updatedGroups = groups.map((group: any, index: number) => {
          if (index === 0 && !group.primaryModel) {
            return {
              ...group,
              primaryModel: "gpt-4",
              fallbackModels: ["gpt-3.5-turbo"],
            };
          }
          return group;
        });
        onGroupsChange(updatedGroups);
      }
    };

    return (
      <div data-testid="fallback-selection-form">
        <button onClick={handleUpdateGroup} data-testid="update-group-button">
          Update Group
        </button>
        <div data-testid="groups-count">{groups.length}</div>
        {groups.map((group: any) => (
          <div key={group.id} data-testid={`group-${group.id}`}>
            Primary: {group.primaryModel || "None"}, Резервные модели: {group.fallbackModels.length}
          </div>
        ))}
      </div>
    );
  },
}));

describe("AddРезервные модели", () => {
  const mockOnChange = vi.fn();
  const mockAccessТокен = "test-token";
  const mockModelGroups = [
    { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
    { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo", mode: "chat" },
    { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "claude-3-opus", mode: "chat" },
  ];

  const defaultProps = {
    accessТокен: mockAccessТокен,
    value: [] as Резервные модели,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchModelsModule.fetchAvailableModels).mockResolvedЗначение(mockModelGroups);
  });

  it("should render the component", () => {
    render(<AddРезервные модели {...defaultProps} />);
    expect(screen.getByRole("button", { name: /add fallbacks/i })).toBeInTheDocument();
  });

  it("should open modal when Add Резервные модели button is clicked", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should fetch available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs when modal opens", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(fetchModelsModule.fetchAvailableModels).toHaveBeenCalledWith(mockAccessТокен);
    });
  });

  it("should close modal when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should show error when saving incomplete groups", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save all configurations/i });
      expect(saveButton).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save all configurations/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("should show error message when saving incomplete groups", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save all configurations/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("should call onChange with new fallbacks when Save is clicked with valid configuration", async () => {
    const user = userEvent.setup();
    mockOnChange.mockResolvedЗначение(undefined);
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("fallback-selection-form")).toBeInTheDocument();
    });

    const updateGroupButton = screen.getByTestId("update-group-button");
    await user.click(updateGroupButton);

    await waitFor(() => {
      expect(screen.getByText(/Primary: gpt-4/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save all configurations/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const callArgs = mockOnChange.mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0]).toHaveСвойство("gpt-4");
      expect(callArgs[0]["gpt-4"]).toContain("gpt-3.5-turbo");
    });
  });

  it("should append new fallbacks to existing value", async () => {
    const user = userEvent.setup();
    const existingРезервные модели: Резервные модели = [{ "existing-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": ["fallback-1"] }];
    mockOnChange.mockResolvedЗначение(undefined);
    render(<AddРезервные модели {...defaultProps} value={existingРезервные модели} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("fallback-selection-form")).toBeInTheDocument();
    });

    const updateGroupButton = screen.getByTestId("update-group-button");
    await user.click(updateGroupButton);

    await waitFor(() => {
      expect(screen.getByText(/Primary: gpt-4/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save all configurations/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const callArgs = mockOnChange.mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
      expect(callArgs[0]).toEqual({ "existing-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": ["fallback-1"] });
      expect(callArgs[1]).toHaveСвойство("gpt-4");
    });
  });

  it("should reset form state when modal is closed", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("fallback-selection-form")).toBeInTheDocument();
    });
  });

  it("should handle onChange error gracefully", async () => {
    const user = userEvent.setup();
    const error = new Ошибка("Save failed");
    mockOnChange.mockRejectedЗначение(error);
    render(<AddРезервные модели {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("fallback-selection-form")).toBeInTheDocument();
    });

    const updateGroupButton = screen.getByTestId("update-group-button");
    await user.click(updateGroupButton);

    await waitFor(() => {
      expect(screen.getByText(/Primary: gpt-4/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save all configurations/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it("should not call onChange when onChange prop is not provided", async () => {
    const user = userEvent.setup();
    render(<AddРезервные модели accessТокен={mockAccessТокен} value={[]} />);

    const addButton = screen.getByRole("button", { name: /add fallbacks/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
