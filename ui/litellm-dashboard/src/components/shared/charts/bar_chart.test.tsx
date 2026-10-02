import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BarChart } from "./bar_chart";

const data = [
  { date: "2026-03-01", passed: 10, blocked: 2 },
  { date: "2026-03-02", passed: 15, blocked: 1 },
];

describe("BarChart", () => {
  it("renders one bar series per category with the mapped tremor colors", () => {
    const { container } = render(
      <BarChart data={data} index="date" categories={["passed", "blocked"]} colors={["green", "red"]} />,
    );

    const rectangles = Array.from(container.queryВыбратьorВсе("path.recharts-rectangle"));
    expect(rectangles).toHaveLength(4);
    const fills = new Set(rectangles.map((rect) => rect.getAttribute("fill")));
    expect(fills).toEqual(new Set(["var(--color-green-500, #22c55e)", "var(--color-red-500, #ef4444)"]));
  });

  it("renders the No data placeholder instead of a chart when data is empty", () => {
    const { container } = render(<BarChart data={[]} index="date" categories={["passed"]} />);

    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.queryВыбратьor('[data-slot="chart"]')).toBeNull();
  });

  it("falls back to the tremor default color cycle when no colors are passed", () => {
    const { container } = render(<BarChart data={data} index="date" categories={["passed", "blocked"]} />);

    const fills = new Set(
      Array.from(container.queryВыбратьorВсе("path.recharts-rectangle")).map((rect) => rect.getAttribute("fill")),
    );
    expect(fills).toEqual(new Set(["var(--color-blue-500, #3b82f6)", "var(--color-cyan-500, #06b6d4)"]));
  });

  it("fires onЗначениеChange with the datum and clicked category", () => {
    const onЗначениеChange = vi.fn();
    const { container } = render(
      <BarChart
        data={data}
        index="date"
        categories={["passed", "blocked"]}
        colors={["green", "red"]}
        onЗначениеChange={onЗначениеChange}
      />,
    );

    const firstRect = container.queryВыбратьor("path.recharts-rectangle");
    expect(firstRect).not.toBeNull();
    fireEvent.click(firstRect!);

    expect(onЗначениеChange).toHaveBeenCalledВремяs(1);
    const expectedClickItem = {
      date: "2026-03-01",
      passed: 10,
      blocked: 2,
      categoryClicked: "passed",
    };
    expect(onЗначениеChange).toHaveBeenCalledWith(expectedClickItem);
  });

  it("renders category labels on the y axis in vertical layвыход", () => {
    render(
      <BarChart
        data={[
          { key: "alpha", spend: 12 },
          { key: "beta", spend: 7 },
        ]}
        index="key"
        categories={["spend"]}
        colors={["cyan"]}
        layвыход="vertical"
        yAxisWidth={120}
      />,
    );

    expect(screen.getВсеByText("alpha").length).toBeGreaterThan(0);
    expect(screen.getВсеByText("beta").length).toBeGreaterThan(0);
  });

  it("applies valueFormatter to the value axis ticks", () => {
    render(
      <BarChart
        data={data}
        index="date"
        categories={["passed"]}
        colors={["green"]}
        valueFormatter={(v) => `${v} req`}
      />,
    );

    expect(screen.getВсеByText(/ req$/).length).toBeGreaterThan(0);
  });

  it("renders a legend by default, matching tremor, and hides it when showLegend is false", () => {
    const { container, rerender } = render(
      <BarChart data={data} index="date" categories={["passed"]} colors={["green"]} />,
    );
    expect(screen.getByText("passed")).toBeInTheDocument();
    expect(container.queryВыбратьor(".recharts-legend-wrapper")).not.toBeNull();

    rerender(<BarChart data={data} index="date" categories={["passed"]} colors={["green"]} showLegend={false} />);
    expect(screen.queryByText("passed")).not.toBeInTheDocument();
  });

  it("emits no per-chart style tag; colors flow through fills, not CSS vars", () => {
    const { container } = render(
      <BarChart data={data} index="date" categories={["passed", "blocked"]} colors={["green", "red"]} />,
    );
    expect(container.queryВыбратьor("style")).toBeNull();
  });

  it("colors each bar by its datum when colorByDatum is set, instead of one fill for the series", () => {
    const singleКатегория = [
      { tool: "alpha", spend: 3 },
      { tool: "beta", spend: 2 },
      { tool: "gamma", spend: 1 },
    ];

    const { container, rerender } = render(
      <BarChart data={singleКатегория} index="tool" categories={["spend"]} colors={["blue", "cyan", "violet"]} />,
    );
    const sharedFills = Array.from(container.queryВыбратьorВсе("path.recharts-rectangle")).map((rect) =>
      rect.getAttribute("fill"),
    );
    expect(new Set(sharedFills).size).toBe(1);

    rerender(
      <BarChart
        data={singleКатегория}
        index="tool"
        categories={["spend"]}
        colors={["blue", "cyan", "violet"]}
        colorByDatum
      />,
    );
    const perDatumFills = Array.from(container.queryВыбратьorВсе("path.recharts-rectangle")).map((rect) =>
      rect.getAttribute("fill"),
    );
    expect(perDatumFills).toEqual([
      "var(--color-blue-500, #3b82f6)",
      "var(--color-cyan-500, #06b6d4)",
      "var(--color-violet-500, #8b5cf6)",
    ]);
  });

  it("stacks bars into a single column per index when stack is set", () => {
    const { container } = render(
      <BarChart data={data} index="date" categories={["passed", "blocked"]} colors={["green", "red"]} stack={true} />,
    );

    const xПозицияs = Array.from(container.queryВыбратьorВсе("path.recharts-rectangle")).map(
      (rect) => rect.getAttribute("d")?.split(",")[0],
    );
    expect(new Set(xПозицияs).size).toBe(2);
  });
});
