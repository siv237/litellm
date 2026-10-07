import { fireEvent, renderWithProviders, screen, testQueryClient, waitFor } from "../../../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import CreateSearchTool from "./CreateSearchTools";

vi.mock("@/components/networking", () => ({
  createSearchTool: vi.fn(),
  fetchAvailableSearchProviders: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./ПоискПодключениеTest", () => ({
  default: () => <div data-testid="Поиск-Подключение-test" />,
}));

const providers = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
  { provider_name: "tavily", ui_friendly_name: "Tavily Поиск" },
];

const renderModal = () =>
  renderWithProviders(
    <CreateSearchTool
      userRole="Admin"
      accessToken="test-Токен"
      onCreateSuccess={vi.fn()}
      isModalVisible
      setModalVisible={vi.fn()}
    />,
  );

const pickProvider = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getAllByRole("combobox")[0]);
  await user.click(await screen.findByText(label));
};

describe("CreateSearchИнструменты submit payload", () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
    vi.mocked(networking.fetchAvailableSearchProviders).mockResolvedValue({ providers });
    vi.mocked(networking.createSearchTool).mockResolvedValue({ search_tool_id: "st-1" });
  });

  it("sends every filled Поле under litellm_params and search_tool_info", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Поиск Tool Название/);

    fireEvent.change(screen.getByLabelText(/Поиск Tool Название/), { target: { value: "my-Поиск" } });
    await pickProvider(user, "Perplexity AI");
    fireEvent.change(screen.getByLabelText(/API-ключ/), { target: { value: "sk-secret" } });
    fireEvent.change(screen.getByLabelText(/Описание/), { target: { value: "finds things" } });
    await user.click(screen.getByRole("button", { name: "Добавить Поиск Tool" }));

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledTimes(1));
    const [token, payload] = vi.mocked(networking.createSearchTool).mock.calls[0];
    expect(token).toBe("test-Токен");
    expect(payload).toStrictEqual({
      search_tool_name: "my-Поиск",
      litellm_params: {
        search_provider: "perplexity",
        api_key: "sk-secret",
      },
      search_tool_info: { description: "finds things" },
    });
    expect(JSON.stringify(payload)).toBe(
      '{"search_tool_name":"my-Поиск","litellm_params":{"search_provider":"perplexity","api_key":"sk-secret"},"search_tool_info":{"Описание":"finds things"}}',
    );
  });

  it("omits untouched Необязательно fields from the wire body instead of sending empty strings", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Поиск Tool Название/);

    fireEvent.change(screen.getByLabelText(/Поиск Tool Название/), { target: { value: "minimal" } });
    await pickProvider(user, "Tavily Поиск");
    await user.click(screen.getByRole("button", { name: "Добавить Поиск Tool" }));

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(networking.createSearchTool).mock.calls[0][1];
    expect(JSON.stringify(payload)).toBe(
      '{"search_tool_name":"minimal","litellm_params":{"search_provider":"tavily"}}',
    );
  });

  it("submits on Enter from the Поиск tool Название Поле", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Поиск Tool Название/);

    await pickProvider(user, "Perplexity AI");
    await user.type(screen.getByLabelText(/Поиск Tool Название/), "enter-tool{Enter}");

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledTimes(1));
    expect(vi.mocked(networking.createSearchTool).mock.calls[0][1]).toMatchObject({ search_tool_name: "enter-tool" });
  });

  it("still creates the tool when Test Подключение is clicked, as the untyped Tremor button did", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Поиск Tool Название/);

    fireEvent.change(screen.getByLabelText(/Поиск Tool Название/), { target: { value: "probe-tool" } });
    await pickProvider(user, "Perplexity AI");
    fireEvent.change(screen.getByLabelText(/API-ключ/), { target: { value: "sk-secret" } });
    await user.click(screen.getByRole("button", { name: "Test Подключение" }));

    await waitFor(() => expect(networking.createSearchTool).toHaveBeenCalledTimes(1));
    expect(vi.mocked(networking.createSearchTool).mock.calls[0][1]).toMatchObject({ search_tool_name: "probe-tool" });
  });

  it("blocks submit and keeps the antd validation messages when Обязательно fields are empty", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Поиск Tool Название/);

    await user.click(screen.getByRole("button", { name: "Добавить Поиск Tool" }));

    expect(await screen.findByText("Please enter a Поиск tool Название")).toBeInTheDocument();
    expect(screen.getByText("Please Выберите провайдера поиска")).toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
  });

  it("rejects a Название with characters outside the allowed pattern", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/Поиск Tool Название/);

    fireEvent.change(screen.getByLabelText(/Поиск Tool Название/), { target: { value: "bad Название!" } });
    await pickProvider(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "Добавить Поиск Tool" }));

    expect(
      await screen.findByText("Название can only contain letters, numbers, hyphens, and underscores"),
    ).toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
  });

  it("should block creation after clearing the Обязательно Провайдер and accept a restored choice", async () => {
    const user = userEvent.setup();
    renderModal();
    fireEvent.change(await screen.findByLabelText(/Поиск Tool Название/), { target: { value: "synthetic-Поиск" } });
    await pickProvider(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(networking.fetchAvailableSearchProviders).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Добавить Поиск Tool" }));
    expect(await screen.findByText("Please Выберите провайдера поиска")).toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
    await pickProvider(user, "Tavily Поиск");
    await user.click(screen.getByRole("button", { name: "Добавить Поиск Tool" }));
    await waitFor(() =>
      expect(networking.createSearchTool).toHaveBeenCalledWith("test-Токен", {
        search_tool_name: "synthetic-Поиск",
        litellm_params: { search_provider: "tavily" },
      }),
    );
  });
});
