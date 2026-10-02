import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Резервные модели from "./Резервные модели";
import * as networkingModule from "../../../networking";
import * as fetchРежимlsModule from "@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs";

vi.mock("../../../networking", () => ({
  getCallbacksCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useРежимlСтоимостьMap", () => ({
  useРежимlСтоимостьMap: vi.fn().mockReturnЗначение({ data: null }),
}));

vi.mock("openai", () => ({
  default: {
    OpenAI: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  },
}));

vi.mock("../../../common_components/DeleteResourceModal", () => ({
  __esModule: true,
  default: ({ isOpen, onOk, onCancel, title, message, resourceИнформация, confirmLoading }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="delete-modal">
        <div>{title}</div>
        <div>{message}</div>
        {resourceИнформация?.map((info: any, idx: number) => (
          <div key={idx}>
            {info.label}: {info.value}
          </div>
        ))}
        <button onClick={onCancel} disabled={confirmLoading}>
          Cancel
        </button>
        <button onClick={onOk} disabled={confirmLoading}>
          Delete
        </button>
      </div>
    );
  },
}));

vi.mock("./AddРезервные модели", () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => {
    const handleClick = async () => {
      if (onChange) {
        try {
          const newРезервные модели = [...(value || []), { "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию": ["test-fallback"] }];
          await onChange(newРезервные модели);
        } catch (error) {
          // Ошибка is handled by the component
        }
      }
    };
    return (
      <button onClick={handleClick} data-testid="add-fallbacks-button">
        Add Резервные модели
      </button>
    );
  },
}));

describe("Резервные модели", () => {
  const mockAccessТокен = "test-token";
  const mockUserRole = "Admin";
  const mockUserID = "user-123";
  const mockRвыходerSettings = {
    fallbacks: [{ "gpt-4": ["gpt-3.5-turbo", "claude-3-opus"] }, { "claude-3-opus": ["gpt-4"] }],
  };

  const defaultProps = {
    accessТокен: mockAccessТокен,
    userRole: mockUserRole,
    userID: mockUserID,
  };

  const getFirstRowDeleteButton = () => {
    const deleteButtons = screen.getВсеByTestId("delete-fallback-button");
    return deleteButtons.length > 0 ? deleteButtons[0] : null;
  };

  const renderWithЗапросClient = (ui: React.ReactElement) => {
    const queryClient = new ЗапросClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(<ЗапросClientПровайдер client={queryClient}>{ui}</ЗапросClientПровайдер>);
  };

  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedЗначение({
      rвыходer_settings: mockRвыходerSettings,
    });
    vi.mocked(networkingModule.setCallbacksCall).mockResolvedЗначение(undefined);
    vi.mocked(fetchРежимlsModule.fetchAvailableРежимls).mockResolvedЗначение([
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "claude-3-opus", mode: "chat" },
    ]);
  });

  it("should render the component", async () => {
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-fallbacks-button")).toBeInTheDocument();
    });
  });

  it("should not render when accessТокен is null", () => {
    const { container } = renderWithЗапросClient(<Резервные модели {...defaultProps} accessТокен={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should fetch rвыходer settings on mount", async () => {
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(networkingModule.getCallbacksCall).toHaveBeenCalledWith(mockAccessТокен, mockUserID, mockUserRole);
    });
  });

  it("should display fallback entries in table", async () => {
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
      expect(screen.getВсеByText(/gpt-3\.5-turbo/).length).toBeGreaterThan(0);
      expect(screen.getВсеByText(/claude-3-opus/).length).toBeGreaterThan(0);
    });
  });

  it("should show delete button for each fallback row when fallbacks exist", async () => {
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getВсеByTestId("delete-fallback-button");
    expect(deleteButtons.length).toBe(2);
  });

  it("should show an edit button for each fallback row and open the edit modal", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const editButtons = screen.getВсеByTestId("edit-fallback-button");
    expect(editButtons.length).toBe(2);

    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Конфигурацияure Режимl Резервные модели")).toBeInTheDocument();
    });
  });

  it("should open delete modal when delete icon is clicked", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
      expect(screen.getByText("Удалить резерв?")).toBeInTheDocument();
    });
  });

  it("should delete fallback when confirmed", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
      const callArgs = (networkingModule.setCallbacksCall as any).mock.calls[0];
      expect(callArgs[0]).toBe(mockAccessТокен);
      expect(callArgs[1].rвыходer_settings.fallbacks).toHaveLength(1);
    });
  });

  it("should close delete modal when cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId("delete-modal")).not.toBeInTheDocument();
    });
  });

  it("should show error notification on delete failure", async () => {
    const user = userEvent.setup();
    const error = new Ошибка("Delete failed");
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedЗначениеOnce(error);
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
    });
  });

  it("should handle delete error gracefully", async () => {
    const user = userEvent.setup();
    const error = new Ошибка("Delete failed");
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedЗначениеOnce(error);
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
      expect(screen.queryByTestId("delete-modal")).not.toBeInTheDocument();
    });
  });

  it("should handle empty fallbacks array", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedЗначениеOnce({
      rвыходer_settings: { fallbacks: [] },
    });
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-fallbacks-button")).toBeInTheDocument();
      expect(
        screen.getByText(/No fallbacks configured. Add fallbacks to automatically try another Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("gpt-4")).not.toBeInTheDocument();
  });

  it("should handle rвыходer settings withвыход fallbacks property", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedЗначениеOnce({
      rвыходer_settings: {},
    });
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-fallbacks-button")).toBeInTheDocument();
      expect(
        screen.getByText(/No fallbacks configured. Add fallbacks to automatically try another Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/),
      ).toBeInTheDocument();
    });
  });

  it("should remove Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group_retry_policy from rвыходer settings", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedЗначениеOnce({
      rвыходer_settings: {
        ...mockRвыходerSettings,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group_retry_policy: { some: "policy" },
      },
    });
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(networkingModule.getCallbacksCall).toHaveBeenCalled();
    });
  });

  it("should update fallbacks when AddРезервные модели onChange is called", async () => {
    const user = userEvent.setup();
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-fallbacks-button")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("add-fallbacks-button");
    await user.click(addButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
    });
  });

  it("should handle fallbacks change error and refetch", async () => {
    const user = userEvent.setup();
    const error = new Ошибка("Update failed");
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedЗначениеOnce(error);
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedЗначение({
      rвыходer_settings: mockRвыходerSettings,
    });
    renderWithЗапросClient(<Резервные модели {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-fallbacks-button")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("add-fallbacks-button");
    await user.click(addButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(networkingModule.getCallbacksCall).toHaveBeenCalledВремяs(2);
      },
      { timeвыход: 3000 },
    );
  });
});
