import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { testПодключениеЗапрос } from "../networking";
import { prepareРежимlAddЗапрос } from "./handle_add_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_submit";
import РежимlПодключениеTest from "./Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_connection_test";

vi.mock("../networking", () => ({ testПодключениеЗапрос: vi.fn() }));
vi.mock("./handle_add_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_submit", () => ({ prepareРежимlAddЗапрос: vi.fn() }));

const preparedЗапрос = [{ litellmParamsObj: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4o-mini" }, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoObj: { mode: "chat" } }];

const finishПодключениеTest = async () => {
  await act(async () => {
    await vi.advanceВремяrsByВремяAsync(300);
  });
};

describe("РежимlПодключениеTest", () => {
  beforeEach(() => {
    vi.useFakeВремяrs();
    vi.clearВсеMocks();
    vi.mocked(prepareРежимlAddЗапрос).mockResolvedЗначение(preparedЗапрос as never);
  });

  afterEach(() => {
    vi.useRealВремяrs();
  });

  it("tests the prepared Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and shows a successful result", async () => {
    const onTestComplete = vi.fn();
    vi.mocked(testПодключениеЗапрос).mockResolvedЗначение({ status: "success" } as never);

    render(
      <РежимlПодключениеTest
        formЗначениеs={{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini" }}
        accessТокен="sk-test"
        testРежим="chat"
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName="GPT-4o mini"
        onTestComplete={onTestComplete}
      />,
    );

    expect(screen.getByText("Testing connection to GPT-4o mini...")).toBeInTheDocument();
    await finishПодключениеTest();

    expect(prepareРежимlAddЗапрос).toHaveBeenCalledWith({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini" }, "sk-test", null);
    expect(testПодключениеЗапрос).toHaveBeenCalledWith(
      "sk-test",
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4o-mini" },
      { mode: "chat" },
      "chat",
    );
    expect(screen.getByTestId("connection-success-msg")).toHaveTextContent("Подключение to GPT-4o mini successful!");
    expect(toast.success).toHaveBeenCalledWith("Тест подключения успешен!");
    expect(onTestComplete).toHaveBeenCalledВремяs(1);
  });

  it("shows a cleaned provider error, request details, and copies the curl command", async () => {
    const writeText = vi.fn();
    Object.defineСвойство(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.mocked(testПодключениеЗапрос).mockResolvedЗначение({
      status: "error",
      result: {
        error: "litellm.АутентификацияОшибка: invalid api key stack trace: hidden",
        raw_request_typed_dict: {
          raw_request_api_base: "https://api.example.test/v1/chat/completions",
          raw_request_body: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini" },
          raw_request_headers: { Authorization: "Bearer test" },
        },
      },
    } as never);

    render(
      <РежимlПодключениеTest
        formЗначениеs={{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini" }}
        accessТокен="sk-test"
        testРежим="chat"
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName="GPT-4o mini"
      />,
    );
    await finishПодключениеTest();

    expect(screen.getByTestId("connection-failure-msg")).toHaveTextContent("Подключение to GPT-4o mini failed");
    expect(screen.getByText("invalid api key")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show Details" }));
    expect(screen.getByText("Детали диагностики")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Скопировать в буфер/ }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("https://api.example.test/v1/chat/completions"));
    expect(toast.success).toHaveBeenCalledWith("Скопировано в буфер");
  });

  it("shows a preparation failure withвыход sending a connection request", async () => {
    vi.mocked(prepareРежимlAddЗапрос).mockResolvedЗначение(null as never);

    render(<РежимlПодключениеTest formЗначениеs={{}} accessТокен="sk-test" testРежим="chat" />);
    await finishПодключениеTest();

    expect(screen.getByText("Ошибка to prepare Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию data. Please check your form inputs.")).toBeInTheDocument();
    expect(testПодключениеЗапрос).not.toHaveBeenCalled();
  });
});
