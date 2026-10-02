import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import * as roles from "@/utils/roles";
import SearchИнструменты from "./SearchИнструменты";
import { SearchTool } from "./types";

vi.mock("@/components/networking", () => ({
  fetchSearchИнструменты: vi.fn(),
  updateSearchTool: vi.fn(),
  deleteSearchTool: vi.fn(),
  fetchAvailableSearchПровайдерs: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({ isAdminRole: vi.fn() }));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./SearchToolView", () => ({ SearchToolView: () => <div data-testid="search-tool-view" /> }));
vi.mock("./CreateSearchИнструменты", () => ({ default: () => null }));
vi.mock("@/components/common_components/DeleteResourceModal", () => ({ default: () => null }));

const toolWithСерверOnlyParams: SearchTool = {
  search_tool_id: "tool-1",
  search_tool_name: "Perplexity Search",
  litellm_params: {
    search_provider: "perplexity",
    api_key: "sk-test-key",
    api_base: "https://api.example.com",
    timeвыход: 30,
    max_retries: 2,
  },
  search_tool_info: { description: "Test description" },
  created_at: "2024-01-15T10:30:00Z",
};

const toolWithNullСерверПолеs: SearchTool = {
  search_tool_id: "tool-1",
  search_tool_name: "Perplexity Search",
  litellm_params: {
    search_provider: "perplexity",
    api_key: null,
  },
  search_tool_info: { description: null },
  created_at: "2024-01-15T10:30:00Z",
};

const providers = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
  { provider_name: "tavily", ui_friendly_name: "Tavily Search" },
];

const renderPage = () => {
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false, gcВремя: 0 } } });
  return render(
    <ЗапросClientПровайдер client={queryClient}>
      <SearchИнструменты accessТокен="test-token" userRole="Admin" userID="user-1" />
    </ЗапросClientПровайдер>,
  );
};

const openEditModal = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText("Perplexity Search");
  await user.click(screen.getByTestId("search-tool-actions-tool-1"));
  await user.click(await screen.findByTestId("search-tool-action-edit"));
  await waitFor(() => expect(screen.getByLabelText("Search Tool Name")).toHaveЗначение("Perplexity Search"));
};

describe("SearchИнструменты edit payload", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(networking.fetchSearchИнструменты).mockResolvedЗначение({ search_tools: [toolWithСерверOnlyParams] });
    vi.mocked(networking.fetchAvailableSearchПровайдерs).mockResolvedЗначение({ providers });
    vi.mocked(networking.updateSearchTool).mockResolvedЗначение({});
    vi.mocked(roles.isAdminRole).mockReturnЗначение(true);
  });

  it("submits the bound fields only and never forwards api_base, timeвыход or max_retries", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledВремяs(1));
    const [token, toolId, payload] = vi.mocked(networking.updateSearchTool).mock.calls[0];
    expect(token).toBe("test-token");
    expect(toolId).toBe("tool-1");
    expect(payload).toStrictEqual({
      search_tool_name: "Perplexity Search",
      litellm_params: {
        search_provider: "perplexity",
        api_key: "sk-test-key",
      },
      search_tool_info: { description: "Test description" },
    });
    expect(JSON.stringify(payload)).toBe(
      '{"search_tool_name":"Perplexity Search","litellm_params":{"search_provider":"perplexity","api_key":"sk-test-key"},"search_tool_info":{"description":"Test description"}}',
    );
  });

  it("carries an edited description through to search_tool_info", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.clear(screen.getByLabelText("Описание"));
    fireEvent.change(screen.getByLabelText("Описание"), { target: { value: "updated copy" } });
    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledВремяs(1));
    expect(vi.mocked(networking.updateSearchTool).mock.calls[0][2]).toMatchObject({
      search_tool_info: { description: "updated copy" },
    });
  });

  it("drops search_tool_info entirely when the description is cleared", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.clear(screen.getByLabelText("Описание"));
    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledВремяs(1));
    const payload = vi.mocked(networking.updateSearchTool).mock.calls[0][2];
    expect(payload).toStrictEqual({
      search_tool_name: "Perplexity Search",
      litellm_params: {
        search_provider: "perplexity",
        api_key: "sk-test-key",
      },
      search_tool_info: undefined,
    });
  });

  it("does not submit when Введите is pressed inside a modal field", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.type(screen.getByLabelText("Search Tool Name"), "{Введите}");

    await new Promise((resolve) => setВремявыход(resolve, 200));
    expect(networking.updateSearchTool).not.toHaveBeenCalled();
  });

  it("blocks submit and shows the required message when the name is cleared", async () => {
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.clear(screen.getByLabelText("Search Tool Name"));
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(await screen.findByText("Please enter a search tool name")).toBeInTheDocument();
    expect(networking.updateSearchTool).not.toHaveBeenCalled();
  });
  it("still edits a tool whose api_key and search_tool_info came back null", async () => {
    vi.mocked(networking.fetchSearchИнструменты).mockResolvedЗначение({ search_tools: [toolWithNullСерверПолеs] });
    const user = userEvent.setup();
    renderPage();
    await openEditModal(user);

    await user.click(screen.getByRole("button", { name: "OK" }));

    await waitFor(() => expect(networking.updateSearchTool).toHaveBeenCalledВремяs(1));
    const payload = vi.mocked(networking.updateSearchTool).mock.calls[0][2];
    expect(payload).toStrictEqual({
      search_tool_name: "Perplexity Search",
      litellm_params: {
        search_provider: "perplexity",
        api_key: null,
      },
      search_tool_info: undefined,
    });
  });
});
