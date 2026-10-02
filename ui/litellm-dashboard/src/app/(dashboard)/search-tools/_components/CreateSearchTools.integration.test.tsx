import { fireEvent, renderWithПровайдерs, screen, testЗапросClient, waitFor } from "../../../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import CreateSearchTool from "./CreateSearchИнструменты";

vi.mock("@/components/networking", () => ({
  createSearchTool: vi.fn(),
  fetchAvailableSearchПровайдерs: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./SearchПодключениеTest", () => ({
  default: () => <div data-testid="search-connection-test" />,
}));

const providers = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
  { provider_name: "tavily", ui_friendly_name: "Tavily Search" },
];

const renderModal = () =>
  renderWithПровайдерs(
    <CreateSearchTool
      userRole="Admin"
      accessТокен="test-token"
      onCreateSuccess={vi.fn()}
      isModalVisible
      setModalVisible={vi.fn()}
    />,
  );

const pickПровайдер = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getВсеByRole("combobox")[0]);
  await user.click(await screen.findByText(label));
};

describe("CreateSearchИнструменты submit payload", () => {
  beforeEach(() => {
    testЗапросClient.clear();
    vi.clearВсеMocks();
    vi.mocked(networking.fetchAvailableSearchПровайдерs).mockResolvedЗначение({ providers });
    vi.mocked(networking.createSearchTool).mockResolvedЗначение({ search_tool_id: "st-1" });
  });

  it("sends every filled field under litellm_params and search_tool_info", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Search Tool Name/);

    fireEvent.change(screen.getByLabelText(/Search Tool Name/), { target: { value: "my-search" } });
    await pickПровайдер(user, "Perplexity AI");
    fireEvent.change(screen.getByLabelText(/API Ключ/), { target: { value: "sk-secret" } });
    fireEvent.change(screen.getByLabelText(/Описание/), { target: { value: "finds things" } });
    await user.click(screen.getByRole("button", { name: "Add Search Tool" }));

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledВремяs(1));
    const [token, payload] = vi.mocked(networking.createSearchTool).mock.calls[0];
    expect(token).toBe("test-token");
    expect(payload).toStrictEqual({
      search_tool_name: "my-search",
      litellm_params: {
        search_provider: "perplexity",
        api_key: "sk-secret",
      },
      search_tool_info: { description: "finds things" },
    });
    expect(JSON.stringify(payload)).toBe(
      '{"search_tool_name":"my-search","litellm_params":{"search_provider":"perplexity","api_key":"sk-secret"},"search_tool_info":{"description":"finds things"}}',
    );
  });

  it("omits untouched необязательно fields from the wire body instead of sending empty strings", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Search Tool Name/);

    fireEvent.change(screen.getByLabelText(/Search Tool Name/), { target: { value: "minimal" } });
    await pickПровайдер(user, "Tavily Search");
    await user.click(screen.getByRole("button", { name: "Add Search Tool" }));

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledВремяs(1));
    const payload = vi.mocked(networking.createSearchTool).mock.calls[0][1];
    expect(JSON.stringify(payload)).toBe(
      '{"search_tool_name":"minimal","litellm_params":{"search_provider":"tavily"}}',
    );
  });

  it("submits on Введите from the search tool name field", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Search Tool Name/);

    await pickПровайдер(user, "Perplexity AI");
    await user.type(screen.getByLabelText(/Search Tool Name/), "enter-tool{Введите}");

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledВремяs(1));
    expect(vi.mocked(networking.createSearchTool).mock.calls[0][1]).toMatchObject({ search_tool_name: "enter-tool" });
  });

  it("still creates the tool when Test Подключение is clicked, as the untyped Tremor button did", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Search Tool Name/);

    fireEvent.change(screen.getByLabelText(/Search Tool Name/), { target: { value: "probe-tool" } });
    await pickПровайдер(user, "Perplexity AI");
    fireEvent.change(screen.getByLabelText(/API Ключ/), { target: { value: "sk-secret" } });
    await user.click(screen.getByRole("button", { name: "Test Подключение" }));

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledВремяs(1));
    expect(vi.mocked(networking.createSearchTool).mock.calls[0][1]).toMatchObject({ search_tool_name: "probe-tool" });
  });

  it("blocks submit and keeps the antd validation messages when required fields are empty", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Search Tool Name/);

    await user.click(screen.getByRole("button", { name: "Add Search Tool" }));

    expect(await screen.findByText("Please enter a search tool name")).toBeInTheDocument();
    expect(screen.getByText("Please select a search provider")).toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
  });

  it("rejects a name with characters выходside the allowed pattern", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Search Tool Name/);

    fireEvent.change(screen.getByLabelText(/Search Tool Name/), { target: { value: "bad name!" } });
    await pickПровайдер(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "Add Search Tool" }));

    expect(
      await screen.findByText("Name can only contain letters, numbers, hyphens, and underscores"),
    ).toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
  });

  it("should block creation after clearing the required provider and accept a restored choice", async () => {
    const user = userEvent.setup();
    renderModal();
    fireEvent.change(await screen.findByLabelText(/Search Tool Name/), { target: { value: "synthetic-search" } });
    await pickПровайдер(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(networking.fetchAvailableSearchПровайдерs).toHaveBeenCalledВремяs(1);
    await user.click(screen.getByRole("button", { name: "Add Search Tool" }));
    expect(await screen.findByText("Please select a search provider")).toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
    await pickПровайдер(user, "Tavily Search");
    await user.click(screen.getByRole("button", { name: "Add Search Tool" }));
    await waitFor(() =>
      expect(networking.createSearchTool).toHaveBeenCalledWith("test-token", {
        search_tool_name: "synthetic-search",
        litellm_params: { search_provider: "tavily" },
      }),
    );
  });
});
