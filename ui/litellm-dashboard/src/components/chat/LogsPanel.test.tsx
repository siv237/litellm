import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ЖурналыPanel from "./ЖурналыPanel";
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
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o",
  status: "success",
  spend: 0.0123,
  total_tokens: 1500,
  prompt_tokens: 1000,
  completion_tokens: 500,
  startВремя: "2026-07-18T10:00:00Z",
  endВремя: "2026-07-18T10:00:02Z",
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
    mockedLogsCall.mockResolvedЗначение(paginated([sampleRow]));
    mockedDetailsCall.mockResolvedЗначение({ messages: [{ role: "user", content: "hi" }], response: { ok: true } });
  });

  it("scopes the query to the current user so it only shows their own logs", async () => {
    renderWithProviders(<ЖурналыPanel accessТокен="tok-scope" userId="user-42" />);

    await waitFor(() => expect(mockedLogsCall).toHaveBeenCalled());
    expect(mockedLogsCall).toHaveBeenCalledWith(
      expect.objectContaining({
        accessТокен: "tok-scope",
        params: expect.objectContaining({ user_id: "user-42" }),
      }),
    );
  });

  it("renders a row for each returned log", async () => {
    renderWithProviders(<ЖурналыPanel accessТокен="tok-rows" userId="user-1" />);

    expect(await screen.findByText("gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("shows an empty state when there are no logs", async () => {
    mockedLogsCall.mockResolvedЗначение(paginated([]));
    renderWithProviders(<ЖурналыPanel accessТокен="tok-empty" userId="user-1" />);

    expect(await screen.findByText("Нет журналов за этот период")).toBeInTheDocument();
  });

  it("opens the detail dialog and lazily loads request/response when a row is clicked", async () => {
    renderWithProviders(<ЖурналыPanel accessТокен="tok-detail" userId="user-1" />);

    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюCell = await screen.findByText("gpt-4o");
    expect(mockedDetailsCall).not.toHaveBeenCalled();

    fireEvent.click(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюCell);

    expect(await screen.findByText("Детали запроса")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedDetailsCall).toHaveBeenCalledWith("tok-detail", "req-abc-123", expect.any(String)),
    );
  });

  it("shows an error state (not the empty state) when the logs query fails", async () => {
    mockedLogsCall.mockRejectedЗначение(new Ошибка("boom"));
    renderWithProviders(<ЖурналыPanel accessТокен="tok-err" userId="user-1" />);

    expect(await screen.findByText("Не удалось загрузить ваши журналы")).toBeInTheDocument();
    expect(screen.queryByText("Нет журналов за этот период")).not.toBeInTheDocument();
  });

  it("falls back to proxy_server_request when messages is empty for the request payload", async () => {
    mockedDetailsCall.mockResolvedЗначение({
      messages: {},
      proxy_server_request: { body: { messages: [{ role: "user", content: "hello from proxy" }] } },
      response: { ok: true },
    });
    renderWithProviders(<ЖурналыPanel accessТокен="tok-fallback" userId="user-1" />);

    fireEvent.click(await screen.findByText("gpt-4o"));

    expect(await screen.findByText(/hello from proxy/)).toBeInTheDocument();
  });
});
