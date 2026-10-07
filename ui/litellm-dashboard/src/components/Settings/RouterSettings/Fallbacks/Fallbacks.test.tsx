import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Fallbacks from "./Fallbacks";
import * as networkingModule from "../../../networking";
import * as fetchModelsModule from "@/components/llm_calls/fetch_models";

vi.mock("../../../networking", () => ({
  getCallbacksCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/Модели/useРежимlСтоимостьMap", () => ({
  useModelCostMap: vi.fn().mockReturnValue({ data: null }),
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
  default: ({ isOpen, onOk, onCancel, title, message, resourceInformation, confirmLoading }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="Удалить-modal">
        <div>{title}</div>
        <div>{message}</div>
        {resourceInformation?.map((info: any, idx: number) => (
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

vi.mock("./ДобавитьРезервные модели", () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => {
    const handleClick = async () => {
      if (onChange) {
        try {
          const newFallbacks = [...(value || []), { "test-Модель": ["test-fallback"] }];
          await onChange(newFallbacks);
        } catch (error) {
          // Error is handled by the component
        }
      }
    };
    return (
      <button onClick={handleClick} data-testid="Добавить-Резервные модели-button">
        Add Fallbacks
      </button>
    );
  },
}));

describe("Резервные модели", () => {
  const mockAccessToken = "test-Токен";
  const mockUserRole = "Admin";
  const mockUserID = "Пользователь-123";
  const mockRouterSettings = {
    fallbacks: [{ "gpt-4": ["gpt-3.5-turbo", "claude-3-opus"] }, { "claude-3-opus": ["gpt-4"] }],
  };

  const defaultProps = {
    accessToken: mockAccessToken,
    userRole: mockUserRole,
    userID: mockUserID,
  };

  const getFirstRowDeleteButton = () => {
    const deleteButtons = screen.getAllByTestId("Удалить-fallback-button");
    return deleteButtons.length > 0 ? deleteButtons[0] : null;
  };

  const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValue({
      router_settings: mockRouterSettings,
    });
    vi.mocked(networkingModule.setCallbacksCall).mockResolvedValue(undefined);
    vi.mocked(fetchModelsModule.fetchAvailableModels).mockResolvedValue([
      { model_group: "gpt-4", mode: "chat" },
      { model_group: "gpt-3.5-turbo", mode: "chat" },
      { model_group: "claude-3-opus", mode: "chat" },
    ]);
  });

  it("should render the component", async () => {
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("Добавить-Резервные модели-button")).toBeInTheDocument();
    });
  });

  it("should not render when accessToken is null", () => {
    const { container } = renderWithQueryClient(<Fallbacks {...defaultProps} accessToken={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should fetch router settings on mount", async () => {
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(networkingModule.getCallbacksCall).toHaveBeenCalledWith(mockAccessToken, mockUserID, mockUserRole);
    });
  });

  it("should display fallback entries in Таблица", async () => {
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/gpt-3\.5-turbo/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/claude-3-opus/).length).toBeGreaterThan(0);
    });
  });

  it("should show Удалить button for each fallback row when Резервные модели exist", async () => {
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByTestId("Удалить-fallback-button");
    expect(deleteButtons.length).toBe(2);
  });

  it("should show an Изменить button for each fallback row and open the Изменить modal", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const editButtons = screen.getAllByTestId("Изменить-fallback-button");
    expect(editButtons.length).toBe(2);

    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Конфигурацияure Режимl Резервные модели")).toBeInTheDocument();
    });
  });

  it("should open Удалить modal when Удалить icon is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("Удалить-modal")).toBeInTheDocument();
      expect(screen.getByText("Удалить резерв?")).toBeInTheDocument();
    });
  });

  it("should Удалить резерв when confirmed", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("Удалить-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /Удалить/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
      const callArgs = (networkingModule.setCallbacksCall as any).mock.calls[0];
      expect(callArgs[0]).toBe(mockAccessToken);
      expect(callArgs[1].router_settings.fallbacks).toHaveLength(1);
    });
  });

  it("should Закрыть Удалить modal when Отмена is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("Удалить-modal")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /Отмена/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId("Удалить-modal")).not.toBeInTheDocument();
    });
  });

  it("should show Ошибка notification on Удалить failure", async () => {
    const user = userEvent.setup();
    const error = new Error("Удалить Ошибка");
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedValueOnce(error);
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("Удалить-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /Удалить/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
    });
  });

  it("should handle Удалить Ошибка gracefully", async () => {
    const user = userEvent.setup();
    const error = new Error("Удалить Ошибка");
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedValueOnce(error);
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByText("gpt-4").length).toBeGreaterThan(0);
    });

    const deleteButton = getFirstRowDeleteButton();
    expect(deleteButton).not.toBeNull();

    await user.click(deleteButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByTestId("Удалить-modal")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /Удалить/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
      expect(screen.queryByTestId("Удалить-modal")).not.toBeInTheDocument();
    });
  });

  it("should handle empty Резервные модели array", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValueOnce({
      router_settings: { fallbacks: [] },
    });
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("Добавить-Резервные модели-button")).toBeInTheDocument();
      expect(
        screen.getByText(/Нет Резервные модели configured. Добавить Резервные модели to automatically try another Модель/),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("gpt-4")).not.toBeInTheDocument();
  });

  it("should handle router settings without Резервные модели Свойство", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValueOnce({
      router_settings: {},
    });
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("Добавить-Резервные модели-button")).toBeInTheDocument();
      expect(
        screen.getByText(/Нет Резервные модели configured. Добавить Резервные модели to automatically try another Модель/),
      ).toBeInTheDocument();
    });
  });

  it("should Убрать model_group_retry_policy from router settings", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValueOnce({
      router_settings: {
        ...mockRouterSettings,
        model_group_retry_policy: { some: "Политика" },
      },
    });
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(networkingModule.getCallbacksCall).toHaveBeenCalled();
    });
  });

  it("should update Резервные модели when ДобавитьРезервные модели onChange is called", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("Добавить-Резервные модели-button")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Добавить-Резервные модели-button");
    await user.click(addButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
    });
  });

  it("should handle Резервные модели change Ошибка and refetch", async () => {
    const user = userEvent.setup();
    const error = new Error("Update Ошибка");
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedValueOnce(error);
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValue({
      router_settings: mockRouterSettings,
    });
    renderWithQueryClient(<Fallbacks {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("Добавить-Резервные модели-button")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Добавить-Резервные модели-button");
    await user.click(addButton);

    await waitFor(() => {
      expect(networkingModule.setCallbacksCall).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(networkingModule.getCallbacksCall).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 },
    );
  });
});
