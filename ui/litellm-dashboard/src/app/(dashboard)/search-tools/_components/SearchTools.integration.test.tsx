import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import * as roles from "@/utils/roles";
import SearchTools from "./SearchTools";
import { SearchTool } from "./types";

vi.mock("@/components/networking", () => ({
  fetchSearchTools: vi.fn(),
  updateSearchTool: vi.fn(),
  deleteSearchTool: vi.fn(),
  fetchAvailableSearchProviders: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({ isAdminRole: vi.fn() }));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./SearchToolView", () => ({ SearchToolView: () => <div data-testid="Поиск-tool-view" /> }));
vi.mock("./CreateSearchИнструменты", () => ({ default: () => null }));
vi.mock("@/components/common_components/DeleteResourceModal", () => ({ default: () => null }));

const toolWithServerOnlyParams: SearchTool = {
  search_tool_id: "tool-1",
  search_tool_name: "Perplexity Поиск",
  litellm_params: {
    search_provider: "perplexity",
    api_key: "sk-test-Ключ",
    api_base: "https://api.example.com",
    timeout: 30,
    max_retries: 2,
  },
  search_tool_info: { description: "Test Описание" },
  created_at: "2024-01-15T10:30:00Z",
};

const toolWithNullServerFields: SearchTool = {
  search_tool_id: "tool-1",
  search_tool_name: "Perplexity Поиск",
  litellm_params: {
    search_provider: "perplexity",
    api_key: null,
  },
  search_tool_info: { description: null },
  created_at: "2024-01-15T10:30:00Z",
};

const providers = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
  { provider_name: "tavily", ui_friendly_name: "Tavily Поиск" },
];

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SearchTools accessToken="test-Токен" userRole="Admin" userID="Пользователь-1" />
    </QueryClientProvider>,
  );
};

const openEditModal = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText("Perplexity Поиск");
  await user.click(screen.getByTestId("Поиск-tool-Действия-tool-1"));
  await user.click(await screen.findByTestId("Поиск-tool-Действие-Изменить"));
  await waitFor(() => expect(screen.getByLabelText("Поиск Tool Название")).toHaveValue("Perplexity Поиск"));
};

describe("ПоискИнструменты Изменить payload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networking.fetchSearchTools).mockResolvedValue({ search_tools: [toolWithServerOnlyParams] });
    vi.mocked(networking.fetchAvailableSearchProviders).mockResolvedValue({ providers });
    vi.mocked(networking.updateSearchTool).mockResolvedValue({});
    vi.mocked(roles.isAdminRole).mockReturnValue(true);
  });

  it("submits the bound fields only and never forwards api_base, timeout or max_retries", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledTimes(1));
    const [token, toolId, payload] = vi.mocked(networking.updateSearchTool).mock.calls[0];
    expect(token).toBe("test-Токен");
    expect(toolId).toBe("tool-1");
    expect(payload).toStrictEqual({
      search_tool_name: "Perplexity Поиск",
      litellm_params: {
        search_provider: "perplexity",
        api_key: "sk-test-Ключ",
      },
      search_tool_info: { description: "Test Описание" },
    });
    expect(JSON.stringify(payload)).toBe(
      '{"search_tool_name":"Perplexity Поиск","litellm_params":{"search_provider":"perplexity","api_key":"sk-test-Ключ"},"search_tool_info":{"Описание":"Test Описание"}}',
    );
  });

  it("carries an edited Описание through to search_tool_info", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.clear(screen.getByLabelText("Описание"));
    fireEvent.change(screen.getByLabelText("Описание"), { target: { value: "Обновлён Скопировать" } });
    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledTimes(1));
    expect(vi.mocked(networking.updateSearchTool).mock.calls[0][2]).toMatchObject({
      search_tool_info: { description: "Обновлён Скопировать" },
    });
  });

  it("drops search_tool_info entirely when the Описание is cleared", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.clear(screen.getByLabelText("Описание"));
    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(networking.updateSearchTool).mock.calls[0][2];
    expect(payload).toStrictEqual({
      search_tool_name: "Perplexity Поиск",
      litellm_params: {
        search_provider: "perplexity",
        api_key: "sk-test-Ключ",
      },
      search_tool_info: undefined,
    });
  });

  it("does not submit when Enter is pressed inside a modal Поле", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.type(screen.getByLabelText("Поиск Tool Название"), "{Enter}");

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(networking.updateSearchTool).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the Обязательно Сообщение when the Название is cleared", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.clear(screen.getByLabelText("Поиск Tool Название"));
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(await screen.findByText("Please enter a Поиск tool Название")).toBeInTheDocument();
    expect(networking.updateSearchTool).not.toHaveBeenCalled();
  });
  it("still edits a tool whose api_key and search_tool_info came Назад null", async () => {
    vi.mocked(networking.fetchSearchTools).mockResolvedValue({ search_tools: [toolWithNullServerFields] });
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(networking.updateSearchTool).mock.calls[0][2];
    expect(payload).toStrictEqual({
      search_tool_name: "Perplexity Поиск",
      litellm_params: {
        search_provider: "perplexity",
        api_key: null,
      },
      search_tool_info: undefined,
    });
  });
});
