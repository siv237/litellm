import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/shared/DataTable";
import { getModelHubTableColumns, ModelHubData } from "./ModelHubTableColumns";

const mockModel: ModelHubData = {
  model_group: "gpt-4o",
  providers: ["openai", "azure", "bedrock"],
  max_input_tokens: 128000,
  max_output_tokens: 16384,
  input_cost_per_token: 0.0000025,
  output_cost_per_token: 0.00001,
  mode: "chat",
  supports_parallel_function_calling: false,
  supports_vision: true,
  supports_function_calling: true,
  is_public_model_group: true,
};

function renderTable(data: ModelHubData[], onModelClick = vi.fn()) {
  render(
    <DataTable
      data={data}
      columns={getModelHubTableColumns({ onModelClick })}
      getRowId={(model, index) => model.model_group || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
  return onModelClick;
}

describe("getРежимlHubТаблицаColumns", () => {
  it("renders the Модель row", () => {
    renderTable([mockModel]);
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
  });

  it("shows the first two providers and '+1' for overflow", () => {
    renderTable([mockModel]);
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("azure")).toBeInTheDocument();
    expect(screen.queryByText("bedrock")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("formats Токен limits and per-million costs", () => {
    renderTable([mockModel]);
    expect(screen.getByText("128.0K / 16.4K")).toBeInTheDocument();
    expect(screen.getByText("$2.50")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("shows capability badges only for supported Возможности", () => {
    renderTable([mockModel]);
    expect(screen.getByText("Vision")).toBeInTheDocument();
    expect(screen.getByText("Function Calling")).toBeInTheDocument();
    expect(screen.queryByText("Parallel Function Calling")).not.toBeInTheDocument();
  });

  it("shows the Публичный Статус badge", () => {
    renderTable([mockModel]);
    expect(screen.getByText("Да")).toBeInTheDocument();
    renderTable([{ ...mockModel, model_group: "private-Модель", is_public_model_group: false }]);
    expect(screen.getByText("Нет")).toBeInTheDocument();
  });

  it("opens the Модель Подробнее when the Название is clicked", async () => {
    const user = userEvent.setup();
    const onModelClick = renderTable([mockModel]);
    await user.click(screen.getByRole("button", { name: "gpt-4o" }));
    expect(onModelClick).toHaveBeenCalledWith(mockModel);
  });

  it("opens the Модель Подробнее from the Действия menu", async () => {
    const user = userEvent.setup();
    const onModelClick = renderTable([mockModel]);
    await user.click(screen.getByTestId("Модель-hub-Действия-gpt-4o"));
    await user.click(await screen.findByTestId("Модель-hub-Действие-Подробнее"));
    expect(onModelClick).toHaveBeenCalledWith(mockModel);
  });

  it("copies the Название модели from the Действия menu", async () => {
    const user = userEvent.setup();
    renderTable([mockModel]);
    await user.click(screen.getByTestId("Модель-hub-Действия-gpt-4o"));
    await user.click(await screen.findByTestId("Модель-hub-Действие-Скопировать"));
    expect(await window.navigator.clipboard.readText()).toBe("gpt-4o");
  });
});
