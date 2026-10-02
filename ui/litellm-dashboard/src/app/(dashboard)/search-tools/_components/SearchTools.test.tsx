import * as roles from "@/utils/roles";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import SearchИнструменты from "./SearchИнструменты";
import { AvailableSearchПровайдер, SearchTool } from "./types";

vi.mock("@/components/networking", () => ({
  fetchSearchИнструменты: vi.fn(),
  updateSearchTool: vi.fn(),
  deleteSearchTool: vi.fn(),
  fetchAvailableSearchProviders: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({
  isAdminRole: vi.fn(),
}));

vi.mock("./SearchToolView", () => {
  const SearchToolView = ({ searchTool, onBack }: { searchTool: SearchTool; onBack: () => void }) => (
    <div data-testid="search-tool-view">
      <div>Search Tool View: {searchTool.search_tool_name}</div>
      <button onClick={onBack}>Back</button>
    </div>
  );
  SearchToolView.displayName = "SearchToolView";
  return { SearchToolView };
});

vi.mock("./CreateSearchИнструменты", () => {
  const CreateSearchИнструменты = ({
    isModalVisible,
    setModalVisible,
  }: {
    isModalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
  }) =>
    isModalVisible ? (
      <div data-testid="create-search-tool-modal">
        <button onClick={() => setModalVisible(false)}>Close Create Modal</button>
      </div>
    ) : null;
  CreateSearchИнструменты.displayName = "CreateSearchИнструменты";
  return { default: CreateSearchИнструменты };
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
      <div data-testid="delete-resource-modal">
        <button onClick={onOk}>Confirm Delete</button>
        <button onClick={onCancel}>Cancel Delete</button>
      </div>
    ) : null;
  DeleteResourceModal.displayName = "DeleteResourceModal";
  return { default: DeleteResourceModal };
});

const mockSearchИнструменты: SearchTool[] = [
  {
    search_tool_id: "tool-1",
    search_tool_name: "Perplexity Search",
    litellm_params: {
      search_provider: "perplexity",
      api_key: "sk-test-key",
    },
    search_tool_info: {
      description: "Test description",
    },
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    search_tool_id: "tool-2",
    search_tool_name: "Tavily Search",
    litellm_params: {
      search_provider: "tavily",
    },
    created_at: "2024-01-16T10:30:00Z",
  },
];

const mockAvailableProviders: AvailableSearchПровайдер[] = [
  {
    provider_name: "perplexity",
    ui_friendly_name: "Perplexity AI",
  },
  {
    provider_name: "tavily",
    ui_friendly_name: "Tavily Search",
  },
];

const createWrapper = () => {
  const queryClient = new ЗапросClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ЗапросClientПровайдер client={queryClient}>{children}</ЗапросClientПровайдер>
  );
  Wrapper.displayName = "TestWrapper";
  return Wrapper;
};

describe("SearchИнструменты", () => {
  const defaultProps = {
    accessТокен: "test-token",
    userRole: "Admin",
    userID: "user-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networking.fetchSearchИнструменты).mockResolvedЗначение({ search_tools: mockSearchИнструменты });
    vi.mocked(networking.fetchAvailableSearchProviders).mockResolvedЗначение({ providers: mockAvailableProviders });
    vi.mocked(roles.isAdminRole).mockReturnЗначение(true);
  });

  it("should render", async () => {
    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Search Инструменты")).toBeInTheDocument();
    });
  });

  it("should display missing authentication parameters message when accessТокен is missing", () => {
    render(<SearchИнструменты {...defaultProps} accessТокен={null} />, { wrapper: createWrapper() });
    expect(screen.getByText("Missing required authentication parameters.")).toBeInTheDocument();
  });

  it("should display missing authentication parameters message when userRole is missing", () => {
    render(<SearchИнструменты {...defaultProps} userRole={null} />, { wrapper: createWrapper() });
    expect(screen.getByText("Missing required authentication parameters.")).toBeInTheDocument();
  });

  it("should display missing authentication parameters message when userID is missing", () => {
    render(<SearchИнструменты {...defaultProps} userID={null} />, { wrapper: createWrapper() });
    expect(screen.getByText("Missing required authentication parameters.")).toBeInTheDocument();
  });

  it("should display search tools table with tools", async () => {
    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Perplexity Search")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Tavily Search").length).toBeGreaterThan(0);
  });

  it("should display empty state when no search tools are available", async () => {
    vi.mocked(networking.fetchSearchИнструменты).mockResolvedЗначение({ search_tools: [] });

    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("No search tools configured")).toBeInTheDocument();
    });
  });

  it("should show Добавить новый инструмент поиска button when user is admin", async () => {
    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add new search tool/i })).toBeInTheDocument();
    });
  });

  it("should not show Добавить новый инструмент поиска button when user is not admin", async () => {
    vi.mocked(roles.isAdminRole).mockReturnЗначение(false);

    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText("Search Инструменты")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /add new search tool/i })).not.toBeInTheDocument();
  });

  it("should open create modal when Добавить новый инструмент поиска button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add new search tool/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /add new search tool/i });
    await user.click(addButton);

    expect(screen.getByTestId("create-search-tool-modal")).toBeInTheDocument();
  });

  it("should navigate to tool view when tool ID is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Perplexity Search")).toBeInTheDocument();
    });

    const toolIdButton = screen.getByRole("button", { name: /tool-1/i });
    await user.click(toolIdButton);

    await waitFor(() => {
      expect(screen.getByTestId("search-tool-view")).toBeInTheDocument();
    });
    expect(screen.getByText(/Search Tool View: Perplexity Search/i)).toBeInTheDocument();
  });

  it("should navigate back from tool view to table", async () => {
    const user = userEvent.setup({ delay: null });
    render(<SearchИнструменты {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Perplexity Search")).toBeInTheDocument();
    });

    const toolIdButton = screen.getByRole("button", { name: /tool-1/i });
    await user.click(toolIdButton);

    await waitFor(() => {
      expect(screen.getByTestId("search-tool-view")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.queryByTestId("search-tool-view")).not.toBeInTheDocument();
      expect(screen.getByText("Perplexity Search")).toBeInTheDocument();
    });
  });
});
