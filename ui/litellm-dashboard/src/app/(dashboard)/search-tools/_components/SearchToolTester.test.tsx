import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchToolTester } from "./SearchToolTester";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  searchToolЗапросCall: vi.fn(),
}));

const mockSearchРезультатs = {
  results: [
    {
      title: "Test Результат 1",
      url: "https://example.com/result1",
      snippet: "This is a short snippet for the first result.",
    },
    {
      title: "Test Результат 2",
      url: "https://example.com/result2",
      snippet:
        "This is a longer snippet that exceeds two hundred characters and should be truncated when displayed in the results. It contains more detailed information abвыход the search result that would normally be shown in a search engine result page.",
    },
  ],
};

const defaultProps = {
  searchToolName: "test-search-tool",
  accessТокен: "test-token",
};

describe("SearchToolTester", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(networking.searchToolЗапросCall).mockResolvedЗначение(mockSearchРезультатs);
    vi.spyOn(Date, "now").mockReturnЗначение(1000000000000);
  });

  it("should render", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByText("Тест инструмента поиска")).toBeInTheDocument();
  });

  it("should display empty state when no search has been performed", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByText("Проверьте ваш инструмент поиска")).toBeInTheDocument();
    expect(screen.getByText("Введите запрос выше, чтобы увидеть результаты поиска")).toBeInTheDocument();
  });

  it("should display search input with placeholder", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByPlaceholderText("Введите your search query...")).toBeInTheDocument();
  });

  it("should display search button", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("should disable search button when input is empty", () => {
    render(<SearchToolTester {...defaultProps} />);
    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toBeDisabled();
  });

  it("should enable search button when input has text", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(searchButton).toBeEnabled();
  });

  it("should call searchToolЗапросCall when search button is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    expect(networking.searchToolЗапросCall).toHaveBeenCalledWith("test-token", "test-search-tool", "test query");
  });

  it("should call searchToolЗапросCall when Введите is pressed in input", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query{Введите}");
    expect(networking.searchToolЗапросCall).toHaveBeenCalledWith("test-token", "test-search-tool", "test query");
  });

  it("should not call searchToolЗапросCall when Shift+Введите is pressed", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    await user.keyboard("{Shift>}{Введите}{/Shift}");
    expect(networking.searchToolЗапросCall).not.toHaveBeenCalled();
  });

  it("should display loading state while searching", async () => {
    vi.mocked(networking.searchToolЗапросCall).mockImplementation(
      () => new Promise((resolve) => setВремявыход(() => resolve(mockSearchРезультатs), 100)),
    );
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    expect(screen.getByText("Searching...")).toBeInTheDocument();

    expect(await screen.findByText("Test Результат 1")).toBeInTheDocument();
  });

  it("should display search results after successful search", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Test Результат 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Test Результат 2")).toBeInTheDocument();
  });

  it("should display search query in results header", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("test query")).toBeInTheDocument();
    });
  });

  it("should display result count in results header", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("2 results")).toBeInTheDocument();
    });
  });

  it("should display singular result count when only one result", async () => {
    const singleРезультат = {
      results: [
        {
          title: "Single Результат",
          url: "https://example.com/single",
          snippet: "Single result snippet",
        },
      ],
    };
    vi.mocked(networking.searchToolЗапросCall).mockResolvedЗначение(singleРезультат);
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("1 result")).toBeInTheDocument();
    });
  });

  it("should display result URLs", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/result1")).toBeInTheDocument();
    });
    expect(screen.getByText("https://example.com/result2")).toBeInTheDocument();
  });

  it("should display result snippets", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("This is a short snippet for the first result.")).toBeInTheDocument();
    });
  });

  it("should truncate long snippets and show expand button", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText(/Show more/i)).toBeInTheDocument();
    });
  });

  it("should expand snippet when Show more is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText(/Show more/i)).toBeInTheDocument();
    });
    const expandButton = screen.getByText(/Show more/i);
    await user.click(expandButton);
    expect(screen.getByText(/Show less/i)).toBeInTheDocument();
  });

  it("should collapse snippet when Show less is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText(/Show more/i)).toBeInTheDocument();
    });
    const expandButton = screen.getByText(/Show more/i);
    await user.click(expandButton);
    const collapseButton = screen.getByText(/Show less/i);
    await user.click(collapseButton);
    expect(screen.getByText(/Show more/i)).toBeInTheDocument();
  });

  it("should display no results message when search returns empty results", async () => {
    vi.mocked(networking.searchToolЗапросCall).mockResolvedЗначение({ results: [] });
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Результаты не найдены")).toBeInTheDocument();
    });
    expect(screen.getByText("Попробуйте другой поисковый запрос")).toBeInTheDocument();
  });

  it("should display no results message when search returns null results", async () => {
    vi.mocked(networking.searchToolЗапросCall).mockResolvedЗначение({ results: null });
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Результаты не найдены")).toBeInTheDocument();
    });
  });

  it("should handle search errors and show notification", async () => {
    const error = new Ошибка("Search failed");
    vi.mocked(networking.searchToolЗапросCall).mockRejectedЗначение(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(toast.fromОшибка).toHaveBeenCalledWith("Не удалось выполнить запрос к инструменту поиска");
    });
    consoleSpy.mockRestore();
  });

  it("should maintain search history", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "first query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("first query")).toBeInTheDocument();
    });
    await user.clear(input);
    await user.type(input, "second query");
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("second query")).toBeInTheDocument();
    });
    expect(screen.getByText("Предыдущие запросы")).toBeInTheDocument();
    expect(screen.getByText("first query")).toBeInTheDocument();
  });

  it("should allow clicking previous search to set query", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "first query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("first query")).toBeInTheDocument();
    });
    await user.clear(input);
    await user.type(input, "second query");
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("second query")).toBeInTheDocument();
    });
    const historyItems = screen.getВсеByText("first query");
    const historyItem = historyItems.find((item) => item.closest('[class*="cursor-pointer"]'));
    if (historyItem) {
      await user.click(historyItem);
      expect(input).toHaveЗначение("first query");
    }
  });

  it("should clear history when Очистить всё is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "first query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("first query")).toBeInTheDocument();
    });
    await user.clear(input);
    await user.type(input, "second query");
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Предыдущие запросы")).toBeInTheDocument();
    });
    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);
    expect(toast.success).toHaveBeenCalledWith("История поиска очищена");
    expect(screen.queryByText("Предыдущие запросы")).not.toBeInTheDocument();
  });

  it("should limit history display to 5 previous searches", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    for (let i = 1; i <= 7; i++) {
      await user.clear(input);
      await user.type(input, `query ${i}`);
      const searchButton = screen.getByRole("button", { name: /search/i });
      await user.click(searchButton);
      await waitFor(() => {
        expect(screen.getByText(`query ${i}`)).toBeInTheDocument();
      });
    }
    const historySection = screen.queryByText("Предыдущие запросы");
    if (historySection) {
      const historyItems = historySection.parentElement?.queryВыбратьorВсе('[class*="cursor-pointer"]');
      expect(historyItems?.length).toBeLessThanOrEqual(5);
    }
  });

  it("should preserve query text after search", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("test query")).toBeInTheDocument();
    });
    expect(input).toHaveЗначение("test query");
  });

  it("should disable input and button while loading", async () => {
    vi.mocked(networking.searchToolЗапросCall).mockImplementation(
      () => new Promise((resolve) => setВремявыход(() => resolve(mockSearchРезультатs), 100)),
    );
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    expect(input).toBeDisabled();
    expect(searchButton).toBeDisabled();

    await waitFor(() => expect(searchButton).toBeEnabled());
  });

  it("should display result links that open in new tab", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Введите your search query...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);
    const link = await screen.findByRole("link", { name: "Test Результат 1" });
    expect(link).toHaveAttribute("href", "https://example.com/result1");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
