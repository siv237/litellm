import * as roles from "@/utils/roles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import SearchTools from "./SearchTools";
import { AvailableSearchProvider, SearchTool } from "./types";

vi.mock("@/components/networking", () => ({
  fetchSearchTools: vi.fn(),
  updateSearchTool: vi.fn(),
  deleteSearchTool: vi.fn(),
  fetchAvailableSearchProviders: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({
  isAdminRole: vi.fn(),
}));

vi.mock("./SearchToolView", () => {
  const SearchToolView = ({ searchTool, onBack }: { searchTool: SearchTool; onBack: () => void }) => (
    <div data-testid="Поиск-tool-view">
      <div>Search Tool View: {searchTool.search_tool_name}</div>
      <button onClick={onBack}>Back</button>
    </div>
  );
  SearchToolView.displayName = "SearchToolView";
  return { SearchToolView };
});

vi.mock("./CreateSearchИнструменты", () => {
  const CreateSearchTools = ({
    isModalVisible,
    setModalVisible,
  }: {
    isModalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
  }) =>
    isModalVisible ? (
      <div data-testid="Создать-Поиск-tool-modal">
        <button onClick={() => setModalVisible(false)}>Close Create Modal</button>
      </div>
    ) : null;
  CreateSearchTools.displayName = "CreateSearchИнструменты";
  return { default: CreateSearchTools };
});

vi.mock("@/components/common_components/DeleteResourceModal", () => {
  const DeleteResourceModal = ({
    isOpen,
    onOk,
    onCancel,
  }: {
    isOpen: boolean;
    onOk: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div data-testid="Удалить-resource-modal">
        <button onClick={onOk}>Confirm Delete</button>
        <button onClick={onCancel}>Cancel Delete</button>
      </div>
    ) : null;
  DeleteResourceModal.displayName = "DeleteResourceModal";
  return { default: DeleteResourceModal };
});

const mockSearchTools: SearchTool[] = [
  {
    search_tool_id: "tool-1",
    search_tool_name: "Perplexity Поиск",
    litellm_params: {
      search_provider: "perplexity",
      api_key: "sk-test-Ключ",
    },
    search_tool_info: {
      description: "Test Описание",
    },
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    search_tool_id: "tool-2",
    search_tool_name: "Tavily Поиск",
    litellm_params: {
      search_provider: "tavily",
    },
    created_at: "2024-01-16T10:30:00Z",
  },
];

const mockAvailableProviders: AvailableSearchProvider[] = [
  {
    provider_name: "perplexity",
    ui_friendly_name: "Perplexity AI",
  },
  {
    provider_name: "tavily",
    ui_friendly_name: "Tavily Поиск",
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("ПоискИнструменты", () => {
  const defaultProps = {
    accessToken: "test-Токен",
    userRole: "Admin",
    userID: "Пользователь-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networking.fetchSearchTools).mockResolvedValue({ search_tools: mockSearchTools });
    vi.mocked(networking.fetchAvailableSearchProviders).mockResolvedValue({ providers: mockAvailableProviders });
    vi.mocked(roles.isAdminRole).mockReturnValue(true);
  });

  it("should render", async () => {
    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Поиск Инструменты")).toBeInTheDocument();
    });
  });

  it("should display missing Аутентификация parameters Сообщение when accessToken is missing", () => {
    render(<SearchTools {...defaultProps} accessToken={null} />, { wrapper: createWrapper() });
    expect(screen.getByText("Missing Обязательно Аутентификация parameters.")).toBeInTheDocument();
  });

  it("should display missing Аутентификация parameters Сообщение when userRole is missing", () => {
    render(<SearchTools {...defaultProps} userRole={null} />, { wrapper: createWrapper() });
    expect(screen.getByText("Missing Обязательно Аутентификация parameters.")).toBeInTheDocument();
  });

  it("should display missing Аутентификация parameters Сообщение when userID is missing", () => {
    render(<SearchTools {...defaultProps} userID={null} />, { wrapper: createWrapper() });
    expect(screen.getByText("Missing Обязательно Аутентификация parameters.")).toBeInTheDocument();
  });

  it("should display Поиск Инструменты Таблица with Инструменты", async () => {
    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Perplexity Поиск")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Tavily Поиск").length).toBeGreaterThan(0);
  });

  it("should display empty state when Нет Поиск Инструменты are available", async () => {
    vi.mocked(networking.fetchSearchTools).mockResolvedValue({ search_tools: [] });

    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Нет Поиск Инструменты configured")).toBeInTheDocument();
    });
  });

  it("should show Добавить новый инструмент поиска button when Пользователь is admin", async () => {
    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Добавить новый инструмент поиска/i })).toBeInTheDocument();
    });
  });

  it("should not show Добавить новый инструмент поиска button when Пользователь is not admin", async () => {
    vi.mocked(roles.isAdminRole).mockReturnValue(false);

    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Поиск Инструменты")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Добавить новый инструмент поиска/i })).not.toBeInTheDocument();
  });

  it("should open Создать modal when Добавить новый инструмент поиска button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Добавить новый инструмент поиска/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /Добавить новый инструмент поиска/i });
    await user.click(addButton);

    expect(screen.getByTestId("Создать-Поиск-tool-modal")).toBeInTheDocument();
  });

  it("should navigate to tool view when tool ID is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Perplexity Поиск")).toBeInTheDocument();
    });

    const toolIdButton = screen.getByRole("button", { name: /tool-1/i });
    await user.click(toolIdButton);

    await waitFor(() => {
      expect(screen.getByTestId("Поиск-tool-view")).toBeInTheDocument();
    });
    expect(screen.getByText(/Поиск Tool View: Perplexity Поиск/i)).toBeInTheDocument();
  });

  it("should navigate Назад from tool view to Таблица", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchTools {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Perplexity Поиск")).toBeInTheDocument();
    });

    const toolIdButton = screen.getByRole("button", { name: /tool-1/i });
    await user.click(toolIdButton);

    await waitFor(() => {
      expect(screen.getByTestId("Поиск-tool-view")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /Назад/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.queryByTestId("Поиск-tool-view")).not.toBeInTheDocument();
      expect(screen.getByText("Perplexity Поиск")).toBeInTheDocument();
    });
  });
});
