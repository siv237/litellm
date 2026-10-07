import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchToolTester } from "./SearchToolTester";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  searchToolQueryCall: vi.fn(),
}));

const mockSearchResults = {
  results: [
    {
      title: "Test Результат 1",
      url: "https://example.com/result1",
      snippet: "This is a short snippet for the first Результат.",
    },
    {
      title: "Test Результат 2",
      url: "https://example.com/result2",
      snippet:
        "This is a longer snippet that exceeds two hundred characters and should be truncated when displayed in the results. It contains more detailed Информация about the Поиск Результат that would normally be shown in a Поиск engine Результат page.",
    },
  ],
};

const defaultProps = {
  searchToolName: "test-Поиск-tool",
  accessToken: "test-Токен",
};

describe("SearchToolTester", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networking.searchToolQueryCall).mockResolvedValue(mockSearchResults);
    vi.spyOn(Date, "now").mockReturnValue(1000000000000);
  });

  it("should render", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByText("Тест инструмента поиска")).toBeInTheDocument();
  });

  it("should display empty state when Нет Поиск has been performed", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByText("Проверьте ваш инструмент поиска")).toBeInTheDocument();
    expect(screen.getByText("Введите запрос выше, чтобы увидеть результаты поиска")).toBeInTheDocument();
  });

  it("should display Поиск Вход with placeholder", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByPlaceholderText("Enter your Поисковый запрос...")).toBeInTheDocument();
  });

  it("should display Поиск button", () => {
    render(<SearchToolTester {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Поиск/i })).toBeInTheDocument();
  });

  it("should disable Поиск button when Вход is empty", () => {
    render(<SearchToolTester {...defaultProps} />);
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    expect(searchButton).toBeDisabled();
  });

  it("should enable Поиск button when Вход has text", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    expect(searchButton).toBeEnabled();
  });

  it("should call searchToolQueryCall when Поиск button is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    expect(networking.searchToolQueryCall).toHaveBeenCalledWith("test-Токен", "test-Поиск-tool", "test query");
  });

  it("should call searchToolQueryCall when Enter is pressed in Вход", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query{Enter}");
    expect(networking.searchToolQueryCall).toHaveBeenCalledWith("test-Токен", "test-Поиск-tool", "test query");
  });

  it("should not call searchToolQueryCall when Shift+Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(networking.searchToolQueryCall).not.toHaveBeenCalled();
  });

  it("should display Загрузка state while searching", async () => {
    vi.mocked(networking.searchToolQueryCall).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 100)),
    );
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    expect(screen.getByText("Searching...")).toBeInTheDocument();

    expect(await screen.findByText("Test Результат 1")).toBeInTheDocument();
  });

  it("should display Результаты поиска after successful Поиск", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Test Результат 1")).toBeInTheDocument();
    });
    expect(screen.getByText("Test Результат 2")).toBeInTheDocument();
  });

  it("should display Поисковый запрос in results header", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("test query")).toBeInTheDocument();
    });
  });

  it("should display Результат count in results header", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("2 results")).toBeInTheDocument();
    });
  });

  it("should display singular Результат count when only one Результат", async () => {
    const singleResult = {
      results: [
        {
          title: "Single Результат",
          url: "https://example.com/single",
          snippet: "Single Результат snippet",
        },
      ],
    };
    vi.mocked(networking.searchToolQueryCall).mockResolvedValue(singleResult);
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("1 Результат")).toBeInTheDocument();
    });
  });

  it("should display Результат URLs", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/result1")).toBeInTheDocument();
    });
    expect(screen.getByText("https://example.com/result2")).toBeInTheDocument();
  });

  it("should display Результат snippets", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("This is a short snippet for the first Результат.")).toBeInTheDocument();
    });
  });

  it("should truncate long snippets and show expand button", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText(/Show more/i)).toBeInTheDocument();
    });
  });

  it("should expand snippet when Show more is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
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
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
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

  it("should display Нет результатов Сообщение when Поиск returns empty results", async () => {
    vi.mocked(networking.searchToolQueryCall).mockResolvedValue({ results: [] });
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Результаты не найдены")).toBeInTheDocument();
    });
    expect(screen.getByText("Попробуйте другой поисковый запрос")).toBeInTheDocument();
  });

  it("should display Нет результатов Сообщение when Поиск returns null results", async () => {
    vi.mocked(networking.searchToolQueryCall).mockResolvedValue({ results: null });
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("Результаты не найдены")).toBeInTheDocument();
    });
  });

  it("should handle Поиск errors and show notification", async () => {
    const error = new Error("Поиск Ошибка");
    vi.mocked(networking.searchToolQueryCall).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "Ошибка").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("Не удалось выполнить запрос к инструменту поиска");
    });
    consoleSpy.mockRestore();
  });

  it("should maintain Поиск История", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "first query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
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

  it("should allow clicking Предыдущее Поиск to set query", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "first query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
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
    const historyItems = screen.getAllByText("first query");
    const historyItem = historyItems.find((item) => item.closest('[class*="cursor-pointer"]'));
    if (historyItem) {
      await user.click(historyItem);
      expect(input).toHaveValue("first query");
    }
  });

  it("should clear История when Очистить всё is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "first query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
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
    const clearButton = screen.getByRole("button", { name: /Очистить всё/i });
    await user.click(clearButton);
    expect(toast.success).toHaveBeenCalledWith("История поиска очищена");
    expect(screen.queryByText("Предыдущие запросы")).not.toBeInTheDocument();
  });

  it("should limit История display to 5 Предыдущие запросы", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    for (let i = 1; i <= 7; i++) {
      await user.clear(input);
      await user.type(input, `query ${i}`);
      const searchButton = screen.getByRole("button", { name: /Поиск/i });
      await user.click(searchButton);
      await waitFor(() => {
        expect(screen.getByText(`query ${i}`)).toBeInTheDocument();
      });
    }
    const historySection = screen.queryByText("Предыдущие запросы");
    if (historySection) {
      const historyItems = historySection.parentElement?.querySelectorAll('[class*="cursor-pointer"]');
      expect(historyItems?.length).toBeLessThanOrEqual(5);
    }
  });

  it("should preserve query text after Поиск", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    await waitFor(() => {
      expect(screen.getByText("test query")).toBeInTheDocument();
    });
    expect(input).toHaveValue("test query");
  });

  it("should disable Вход and button while Загрузка", async () => {
    vi.mocked(networking.searchToolQueryCall).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 100)),
    );
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    expect(input).toBeDisabled();
    expect(searchButton).toBeDisabled();

    await waitFor(() => expect(searchButton).toBeEnabled());
  });

  it("should display Результат links that open in new tab", async () => {
    const user = userEvent.setup();
    render(<SearchToolTester {...defaultProps} />);
    const input = screen.getByPlaceholderText("Enter your Поисковый запрос...");
    await user.type(input, "test query");
    const searchButton = screen.getByRole("button", { name: /Поиск/i });
    await user.click(searchButton);
    const link = await screen.findByRole("link", { name: "Test Результат 1" });
    expect(link).toHaveAttribute("href", "https://example.com/result1");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("Назначение", "_blank");
  });
});
