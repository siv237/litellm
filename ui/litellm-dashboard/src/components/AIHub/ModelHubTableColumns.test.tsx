import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataТаблица } from "@/components/shared/DataТаблица";
import { getРежимlHubТаблицаColumns, РежимlHubData } from "./РежимlHubТаблицаColumns";

const mockРежимl: РежимlHubData = {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4o",
  providers: ["openai", "azure", "bedrock"],
  max_input_tokens: 128000,
  max_выходput_tokens: 16384,
  input_cost_per_token: 0.0000025,
  выходput_cost_per_token: 0.00001,
  mode: "chat",
  supports_parallel_function_calling: false,
  supports_vision: true,
  supports_function_calling: true,
  is_public_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: true,
};

function renderТаблица(data: РежимlHubData[], onРежимlClick = vi.fn()) {
  render(
    <DataТаблица
      data={data}
      columns={getРежимlHubТаблицаColumns({ onРежимlClick })}
      getRowId={(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, index) => Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group || String(index)}
      sortingРежим="client"
      size="compact"
    />,
  );
  return onРежимlClick;
}

describe("getРежимlHubТаблицаColumns", () => {
  it("renders the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию row", () => {
    renderТаблица([mockРежимl]);
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
  });

  it("shows the first two providers and '+1' for overflow", () => {
    renderТаблица([mockРежимl]);
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("azure")).toBeInTheDocument();
    expect(screen.queryByText("bedrock")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("formats token limits and per-million costs", () => {
    renderТаблица([mockРежимl]);
    expect(screen.getByText("128.0K / 16.4K")).toBeInTheDocument();
    expect(screen.getByText("$2.50")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("shows capability badges only for supported features", () => {
    renderТаблица([mockРежимl]);
    expect(screen.getByText("Vision")).toBeInTheDocument();
    expect(screen.getByText("Function Calling")).toBeInTheDocument();
    expect(screen.queryByText("Parallel Function Calling")).not.toBeInTheDocument();
  });

  it("shows the public status badge", () => {
    renderТаблица([mockРежимl]);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    renderТаблица([{ ...mockРежимl, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "private-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", is_public_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: false }]);
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("opens the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию details when the name is clicked", async () => {
    const user = userEvent.setup();
    const onРежимlClick = renderТаблица([mockРежимl]);
    await user.click(screen.getByRole("button", { name: "gpt-4o" }));
    expect(onРежимlClick).toHaveBeenCalledWith(mockРежимl);
  });

  it("opens the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию details from the actions menu", async () => {
    const user = userEvent.setup();
    const onРежимlClick = renderТаблица([mockРежимl]);
    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-hub-actions-gpt-4o"));
    await user.click(await screen.findByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-hub-action-details"));
    expect(onРежимlClick).toHaveBeenCalledWith(mockРежимl);
  });

  it("copies the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name from the actions menu", async () => {
    const user = userEvent.setup();
    renderТаблица([mockРежимl]);
    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-hub-actions-gpt-4o"));
    await user.click(await screen.findByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-hub-action-copy"));
    expect(await window.navigator.clipboard.readText()).toBe("gpt-4o");
  });
});
