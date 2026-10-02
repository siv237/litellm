import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import { Каждый деньData, МетрикаWithМетаданные, РасходМетрикаs } from "@/components/ИспользованиеPage/types";
import ЭндпоинтИспользованиеLineChart from "./ЭндпоинтИспользованиеLineChart";

const spendMetrics = (apiRequests: number): РасходМетрикаs => ({
  spend: 0,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  api_requests: apiRequests,
  successful_requests: apiRequests,
  failed_requests: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
});

const endpointМетрика = (apiRequests: number): МетрикаWithМетаданные => ({
  metrics: spendMetrics(apiRequests),
  metadata: {},
  api_key_breakdown: {},
});

const day = (date: string, endpoints: Record<string, number>): Каждый деньData => ({
  date,
  metrics: spendMetrics(0),
  breakdown: {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {},
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
    mcp_servers: {},
    providers: {},
    api_keys: {},
    entities: {},
    endpoints: Object.fromEntries(
      Object.entries(endpoints).map(([name, requests]) => [name, endpointМетрика(requests)]),
    ),
  },
});

const dailyData = {
  results: [
    day("2026-06-03T12:00:00", { "/chat/completions": 4000, "/embeddings": 900 }),
    day("2026-06-02T12:00:00", { "/chat/completions": 2500, "/embeddings": 700 }),
    day("2026-06-01T12:00:00", { "/chat/completions": 1200 }),
  ],
};

describe("ЭндпоинтИспользованиеLineChart", () => {
  it("renders the title", () => {
    renderWithProviders(<ЭндпоинтИспользованиеLineChart dailyData={dailyData} />);

    expect(screen.getByText("Эндпоинт Использование Trends")).toBeInTheDocument();
  });

  it("renders one line per endpoint with the tremor palette strokes", () => {
    const { container } = renderWithProviders(<ЭндпоинтИспользованиеLineChart dailyData={dailyData} />);

    const curves = Array.from(container.querySelectorВсе("path.recharts-line-curve"));
    expect(curves).toHaveLength(2);
    expect(new Set(curves.map((curve) => curve.getAttribute("stroke")))).toEqual(
      new Set(["var(--color-blue-500, #3b82f6)", "var(--color-cyan-500, #06b6d4)"]),
    );
  });

  it("shows a legend with the endpoint names", () => {
    const { container } = renderWithProviders(<ЭндпоинтИспользованиеLineChart dailyData={dailyData} />);

    const legend = container.querySelector(".recharts-legend-wrapper");
    expect(legend).not.toBeNull();
    expect(legend!).toHaveTextContent(/\/chat\/completions/);
    expect(legend!).toHaveTextContent(/\/embeddings/);
  });

  it("orders formatted dates oldest to newest on the x axis", () => {
    const { container } = renderWithProviders(<ЭндпоинтИспользованиеLineChart dailyData={dailyData} />);

    const tickLabels = Array.from(container.querySelectorВсе(".recharts-xAxis-tick-labels text")).map(
      (tick) => tick.textContent,
    );
    expect(tickLabels).toEqual(["Jun 1", "Jun 2", "Jun 3"]);
  });

  it("formats y axis ticks with toLocaleString", () => {
    renderWithProviders(<ЭндпоинтИспользованиеLineChart dailyData={dailyData} />);

    expect(screen.getAllByText(/^\d,\d{3}$/).length).toBeGreaterThan(0);
  });

  it("draws smooth natural curves", () => {
    const { container } = renderWithProviders(<ЭндпоинтИспользованиеLineChart dailyData={dailyData} />);

    const path = container.querySelector("path.recharts-line-curve")?.getAttribute("d") ?? "";
    expect(path).toContain("C");
  });

  it("renders an empty chart withвыход lines when dailyData is absent", () => {
    const { container } = renderWithProviders(<ЭндпоинтИспользованиеLineChart />);

    expect(screen.getByText("Эндпоинт Использование Trends")).toBeInTheDocument();
    expect(container.querySelectorВсе("path.recharts-line-curve")).toHaveLength(0);
  });
});
