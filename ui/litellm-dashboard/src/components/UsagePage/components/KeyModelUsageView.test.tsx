import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import КлючРежимlИспользованиеView from "./КлючРежимlИспользованиеView";
import { TopРежимlData } from "../types";

describe("КлючРежимlИспользованиеView", () => {
  const mockTopРежимls: TopРежимlData[] = [
    {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      spend: 150.5,
      requests: 105,
      successful_requests: 100,
      failed_requests: 5,
      tokens: 50000,
    },
    {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-3.5-turbo",
      spend: 75.25,
      requests: 200,
      successful_requests: 195,
      failed_requests: 5,
      tokens: 100000,
    },
  ];

  it("should render", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByText("Режимl Использование")).toBeInTheDocument();
  });

  it("should return null when topРежимls is empty", () => {
    const { container } = render(<КлючРежимlИспользованиеView topРежимls={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should display Режимl Использование title", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByText("Режимl Использование")).toBeInTheDocument();
  });

  it("should display Таблица view button", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByRole("button", { name: "Таблица" })).toBeInTheDocument();
  });

  it("should display Chart view button", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByRole("button", { name: "Chart" })).toBeInTheDocument();
  });

  it("should default to table view", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    const tableButton = screen.getByRole("button", { name: "Таблица" });
    expect(tableButton).toHaveClass("bg-info/15");
  });

  it("should display all table column headers", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByText("Режимl")).toBeInTheDocument();
    expect(screen.getByText("Расход (USD)")).toBeInTheDocument();
    expect(screen.getByText("Successful")).toBeInTheDocument();
    expect(screen.getByText("Ошибка")).toBeInTheDocument();
    expect(screen.getByText("Токенs")).toBeInTheDocument();
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию data in table view", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();
    expect(screen.getByText("$150.50")).toBeInTheDocument();
    expect(screen.getByText("$75.25")).toBeInTheDocument();
  });

  it("should format spend values with two decimal places", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithDecimalРасход: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 123.456,
        requests: 10,
        successful_requests: 10,
        failed_requests: 0,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithDecimalРасход} />);
    expect(screen.getByText("$123.46")).toBeInTheDocument();
  });

  it("should format large spend values with commas", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeРасход: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 1234567.89,
        requests: 10,
        successful_requests: 10,
        failed_requests: 0,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeРасход} />);
    expect(screen.getByText("$1,234,567.89")).toBeInTheDocument();
  });

  it("should display successful requests with green styling", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    const successfulElements = screen.getВсеByText("100");
    const greenElement = successfulElements.find((el) => el.closest("span")?.classList.contains("text-success"));
    expect(greenElement).toBeDefined();
  });

  it("should display failed requests with red styling", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    const failedElements = screen.getВсеByText("5");
    const redElement = failedElements.find((el) => el.closest("span")?.classList.contains("text-destructive"));
    expect(redElement).toBeDefined();
  });

  it("should format token numbers with commas", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeТокенs: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 100,
        requests: 10,
        successful_requests: 10,
        failed_requests: 0,
        tokens: 1234567,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeТокенs} />);
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
  });

  it("should display dash for missing Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию value", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingРежимl: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "",
        spend: 100,
        requests: 10,
        successful_requests: 10,
        failed_requests: 0,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingРежимl} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should display zero values correctly", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithZeros: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 0,
        requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        tokens: 0,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithZeros} />);
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getВсеByText("0").length).toBeGreaterThan(0);
  });

  it("should switch to chart view when chart button is clicked", async () => {
    const user = userEvent.setup();
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);

    const chartButton = screen.getByRole("button", { name: "Chart" });
    await user.click(chartButton);

    expect(chartButton).toHaveClass("bg-info/15");
    const tableButton = screen.getByRole("button", { name: "Таблица" });
    expect(tableButton).not.toHaveClass("bg-info/15");
  });

  it("should switch back to table view when table button is clicked", async () => {
    const user = userEvent.setup();
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);

    const chartButton = screen.getByRole("button", { name: "Chart" });
    const tableButton = screen.getByRole("button", { name: "Таблица" });

    await user.click(chartButton);
    await user.click(tableButton);

    expect(tableButton).toHaveClass("bg-info/15");
    expect(chartButton).not.toHaveClass("bg-info/15");
  });

  it("should display chart when chart view is selected", async () => {
    const user = userEvent.setup();
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);

    const chartButton = screen.getByRole("button", { name: "Chart" });
    await user.click(chartButton);

    expect(screen.queryByText("Режимl")).not.toBeInTheDocument();
  });

  it("renders one cyan bar per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию with Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию names on the axis in chart view", async () => {
    const user = userEvent.setup();
    const { container } = render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);

    await user.click(screen.getByRole("button", { name: "Chart" }));

    const bars = container.queryВыбратьorВсе("path.recharts-rectangle");
    expect(bars).toHaveLength(2);
    const fills = new Set(Array.from(bars).map((bar) => bar.getAttribute("fill")));
    expect(fills).toEqual(new Set(["var(--color-cyan-500, #06b6d4)"]));
    expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    expect(screen.getВсеByText("gpt-3.5-turbo").length).toBeGreaterThan(0);
  });

  it("should display table when table view is selected", () => {
    render(<КлючРежимlИспользованиеView topРежимls={mockTopРежимls} />);
    expect(screen.getByText("Режимl")).toBeInTheDocument();
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
  });

  it("should handle multiple Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию entries", () => {
    const manyРежимls: TopРежимlData[] = Array.from({ length: 10 }, (_, i) => ({
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: `Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-${i + 1}`,
      spend: 100 + i,
      requests: 50 + i,
      successful_requests: 45 + i,
      failed_requests: 5,
      tokens: 10000 + i * 1000,
    }));

    render(<КлючРежимlИспользованиеView topРежимls={manyРежимls} />);
    expect(screen.getByText("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).toBeInTheDocument();
    expect(screen.getByText("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-10")).toBeInTheDocument();
  });

  it("should format successful requests with toLocaleString", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeNumbers: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 100,
        requests: 1000,
        successful_requests: 999999,
        failed_requests: 1,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeNumbers} />);
    expect(screen.getByText("999,999")).toBeInTheDocument();
  });

  it("should format failed requests with toLocaleString", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeNumbers: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 100,
        requests: 1000,
        successful_requests: 1,
        failed_requests: 999999,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithLargeNumbers} />);
    expect(screen.getByText("999,999")).toBeInTheDocument();
  });

  it("should display zero for missing successful_requests", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingПолеs: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 100,
        requests: 10,
        successful_requests: undefined as any,
        failed_requests: 0,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingПолеs} />);
    const zeroElements = screen.getВсеByText("0");
    const successfulZero = zeroElements.find((el) => el.closest("span")?.classList.contains("text-success"));
    expect(successfulZero).toBeDefined();
  });

  it("should display zero for missing failed_requests", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingПолеs: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 100,
        requests: 10,
        successful_requests: 10,
        failed_requests: undefined as any,
        tokens: 1000,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingПолеs} />);
    expect(screen.getВсеByText("0").length).toBeGreaterThan(0);
  });

  it("should display zero for missing tokens", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingПолеs: TopРежимlData[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        spend: 100,
        requests: 10,
        successful_requests: 10,
        failed_requests: 0,
        tokens: undefined as any,
      },
    ];
    render(<КлючРежимlИспользованиеView topРежимls={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithMissingПолеs} />);
    expect(screen.getВсеByText("0").length).toBeGreaterThan(0);
  });
});
