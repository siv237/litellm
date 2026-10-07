import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LogsPanel from "./LogsPanel";
import { renderWithProviders } from "../../../tests/test-utils";
import { uiSpendLogDetailsCall, uiSpendLogsCall } from "../networking";

vi.mock("../networking", () => ({
  uiSpendLogsCall: vi.fn(),
  uiSpendLogDetailsCall: vi.fn(),
}));

const mockedLogsCall = vi.mocked(uiSpendLogsCall);
const mockedDetailsCall = vi.mocked(uiSpendLogDetailsCall);

const sampleRow = {
  request_id: "req-abc-123",
  model: "gpt-4o",
  status: "success",
  spend: 0.0123,
  total_tokens: 1500,
  prompt_tokens: 1000,
  completion_tokens: 500,
  startTime: "2026-07-18T10:00:00Z",
  endTime: "2026-07-18T10:00:02Z",
  request_duration_ms: 2000,
};

const paginated = (rows: unknown[]) => ({
  data: rows,
  total: rows.length,
  page: 1,
  page_size: 50,
  total_pages: rows.length > 0 ? 1 : 0,
});

describe("ЖурналыPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLogsCall.mockResolvedValue(paginated([sampleRow]));
    mockedDetailsCall.mockResolvedValue({ messages: [{ role: "Пользователь", content: "hi" }], response: { ok: true } });
  });

  it("scopes the query to the current Пользователь so it only shows their own Журналы", async () => {
    renderWithProviders(<LogsPanel accessToken="tok-Область" userId="Пользователь-42" />);

    await waitFor(() => expect(mockedLogsCall).toHaveBeenCalled());
    expect(mockedLogsCall).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: "tok-Область",
        params: expect.objectContaining({ user_id: "Пользователь-42" }),
      }),
    );
  });

  it("renders a row for each returned log", async () => {
    renderWithProviders(<LogsPanel accessToken="tok-rows" userId="Пользователь-1" />);

    expect(await screen.findByText("gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("shows an empty state when there are Нет Журналы", async () => {
    mockedLogsCall.mockResolvedValue(paginated([]));
    renderWithProviders(<LogsPanel accessToken="tok-empty" userId="Пользователь-1" />);

    expect(await screen.findByText("Нет журналов за этот период")).toBeInTheDocument();
  });

  it("opens the detail dialog and lazily loads Запрос/Ответ when a row is clicked", async () => {
    renderWithProviders(<LogsPanel accessToken="tok-detail" userId="Пользователь-1" />);

    const modelCell = await screen.findByText("gpt-4o");
    expect(mockedDetailsCall).not.toHaveBeenCalled();

    fireEvent.click(modelCell);

    expect(await screen.findByText("Детали запроса")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedDetailsCall).toHaveBeenCalledWith("tok-detail", "req-abc-123", expect.any(String)),
    );
  });

  it("shows an Ошибка state (not the empty state) when the Журналы query fails", async () => {
    mockedLogsCall.mockRejectedValue(new Error("boom"));
    renderWithProviders(<LogsPanel accessToken="tok-err" userId="Пользователь-1" />);

    expect(await screen.findByText("Не удалось загрузить ваши журналы")).toBeInTheDocument();
    expect(screen.queryByText("Нет журналов за этот период")).not.toBeInTheDocument();
  });

  it("falls Назад to proxy_server_request when messages is empty for the Запрос payload", async () => {
    mockedDetailsCall.mockResolvedValue({
      messages: {},
      proxy_server_request: { body: { messages: [{ role: "Пользователь", content: "hello from proxy" }] } },
      response: { ok: true },
    });
    renderWithProviders(<LogsPanel accessToken="tok-fallback" userId="Пользователь-1" />);

    fireEvent.click(await screen.findByText("gpt-4o"));

    expect(await screen.findByText(/hello from proxy/)).toBeInTheDocument();
  });
});
