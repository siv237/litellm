import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchToolView } from "./SearchToolView";
import { AvailableSearchПровайдер, SearchTool } from "./types";

vi.mock("@/utils/dataUtils", () => ({
  copyToClipboard: vi.fn().mockResolvedЗначение(true),
}));

vi.mock("./SearchToolTester", () => ({
  SearchToolTester: ({ searchToolName, accessТокен }: { searchToolName: string; accessТокен: string }) => (
    <div data-testid="search-tool-tester">
      <span>Search Tool Tester for {searchToolName}</span>
      <span>Access Токен: {accessТокен}</span>
    </div>
  ),
}));

describe("SearchToolView", () => {
  const mockSearchTool: SearchTool = {
    search_tool_id: "test-tool-id-123",
    search_tool_name: "Тест инструмента поиска",
    litellm_params: {
      search_provider: "perplexity",
      api_key: "sk-test-key",
    },
    search_tool_info: {
      description: "Test description",
    },
    created_at: "2024-01-15T10:30:00Z",
  };

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

  const defaultProps = {
    searchTool: mockSearchTool,
    onBack: vi.fn(),
    isEditing: false,
    accessТокен: "test-token",
    availableProviders: mockAvailableProviders,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { copyToClipboard } = await import("@/utils/dataUtils");
    vi.mocked(copyToClipboard).mockResolvedЗначение(true);
  });

  it("should render", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("Тест инструмента поиска")).toBeInTheDocument();
  });

  it("should display search tool name", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("Тест инструмента поиска")).toBeInTheDocument();
  });

  it("should display search tool ID", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("test-tool-id-123")).toBeInTheDocument();
  });

  it("should display provider name using UI-friendly name when available", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("Perplexity AI")).toBeInTheDocument();
  });

  it("should display provider name using provider_name when UI-friendly name is not available", () => {
    const searchToolWithвыходПровайдер: SearchTool = {
      ...mockSearchTool,
      litellm_params: {
        search_provider: "unknown-provider",
      },
    };

    render(<SearchToolView {...defaultProps} searchTool={searchToolWithвыходПровайдер} />);
    expect(screen.getByText("unknown-provider")).toBeInTheDocument();
  });

  it("should display masked API key when API key is set", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("****")).toBeInTheDocument();
  });

  it("should display 'Не задано' when API key is not set", () => {
    const searchToolWithoutApiКлюч: SearchTool = {
      ...mockSearchTool,
      litellm_params: {
        search_provider: "perplexity",
      },
    };

    render(<SearchToolView {...defaultProps} searchTool={searchToolWithoutApiКлюч} />);
    expect(screen.getByText("Не задано")).toBeInTheDocument();
  });

  it("should display formatted created_at date", () => {
    render(<SearchToolView {...defaultProps} />);
    const dateText = screen.getByText(/2024-01-15/);
    expect(dateText).toBeInTheDocument();
  });

  it("should display 'Unknown' when created_at is not set", () => {
    const searchToolWithoutDate: SearchTool = {
      ...mockSearchTool,
      created_at: undefined,
    };

    render(<SearchToolView {...defaultProps} searchTool={searchToolWithoutDate} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("should display description when search_tool_info.description is provided", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should not display description card when search_tool_info.description is not provided", () => {
    const searchToolWithвыходОписание: SearchTool = {
      ...mockSearchTool,
      search_tool_info: {},
    };

    render(<SearchToolView {...defaultProps} searchTool={searchToolWithвыходОписание} />);
    expect(screen.queryByText("Описание")).not.toBeInTheDocument();
  });

  it("should call onBack when back button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const onBack = vi.fn();
    render(<SearchToolView {...defaultProps} onBack={onBack} />);

    const backButton = screen.getByRole("button", { name: /back to all search tools/i });
    await user.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("should copy search tool name to clipboard when copy button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const { copyToClipboard } = await import("@/utils/dataUtils");
    render(<SearchToolView {...defaultProps} />);

    const toolNameContainer = screen.getByText("Тест инструмента поиска").closest("div");
    expect(toolNameContainer).toBeInTheDocument();

    const nameCopyButton = within(toolNameContainer!).getByRole("button");
    await user.click(nameCopyButton);

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith("Тест инструмента поиска");
    });
  });

  it("should copy search tool ID to clipboard when copy button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const { copyToClipboard } = await import("@/utils/dataUtils");
    render(<SearchToolView {...defaultProps} />);

    const toolIdContainer = screen.getByText("test-tool-id-123").closest("div");
    expect(toolIdContainer).toBeInTheDocument();

    const idCopyButton = within(toolIdContainer!).getByRole("button");
    await user.click(idCopyButton);

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith("test-tool-id-123");
    });
  });

  it("should show check icon after copying search tool name", async () => {
    const user = userEvent.setup({ delay: null });
    const { copyToClipboard } = await import("@/utils/dataUtils");
    vi.mocked(copyToClipboard).mockResolvedЗначение(true);

    render(<SearchToolView {...defaultProps} />);

    const toolNameContainer = screen.getByText("Тест инструмента поиска").closest("div");
    const nameCopyButton = within(toolNameContainer!).getByRole("button");

    expect(nameCopyButton.querySelector(".lucide-copy")).toBeInTheDocument();

    await user.click(nameCopyButton);

    await waitFor(() => {
      expect(nameCopyButton.querySelector(".lucide-check")).toBeInTheDocument();
    });
  });

  it("should not show check icon when copy fails", async () => {
    const user = userEvent.setup({ delay: null });
    const { copyToClipboard } = await import("@/utils/dataUtils");
    vi.mocked(copyToClipboard).mockResolvedЗначение(false);

    render(<SearchToolView {...defaultProps} />);

    const toolNameContainer = screen.getByText("Тест инструмента поиска").closest("div");
    const nameCopyButton = within(toolNameContainer!).getByRole("button");

    await user.click(nameCopyButton);

    await waitFor(
      () => {
        expect(copyToClipboard).toHaveBeenCalledWith("Тест инструмента поиска");
      },
      { timeвыход: 3000 },
    );

    expect(nameCopyButton.querySelector(".lucide-check")).not.toBeInTheDocument();
  });

  it("should render SearchToolTester when accessТокен is provided", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByTestId("search-tool-tester")).toBeInTheDocument();
    expect(screen.getByText(/Search Tool Tester for Тест инструмента поиска/)).toBeInTheDocument();
  });

  it("should not render SearchToolTester when accessТокен is null", () => {
    render(<SearchToolView {...defaultProps} accessТокен={null} />);
    expect(screen.queryByTestId("search-tool-tester")).not.toBeInTheDocument();
  });

  it("should pass correct props to SearchToolTester", () => {
    render(<SearchToolView {...defaultProps} />);
    expect(screen.getByText("Access Токен: test-token")).toBeInTheDocument();
  });
});
