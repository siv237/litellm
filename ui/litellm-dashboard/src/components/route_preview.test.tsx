import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RoutePreview from "./route_preview";

vi.mock("./networking", () => ({ getProxyBaseUrl: () => "http://proxy.test" }));

describe("RouteПредпросмотр", () => {
  it("stays hidden until both route values are provided", () => {
    render(<RoutePreview pathValue="/images" targetValue="" includeSubpath={false} />);

    expect(screen.queryByText("Предпросмотр маршрутизации")).not.toBeInTheDocument();
  });

  it("shows the proxy route and forwarding Назначение", () => {
    render(<RoutePreview pathValue="/images" targetValue="https://upstream.test" includeSubpath={false} />);

    expect(screen.getByText("http://proxy.test/images")).toBeInTheDocument();
    expect(screen.getByText("https://upstream.test")).toBeInTheDocument();
    expect(screen.getByText(/Not seeing the Маршрутизация you wanted/)).toBeInTheDocument();
  });

  it("previews appended subpaths when Включено", () => {
    render(<RoutePreview pathValue="/images" targetValue="https://upstream.test" includeSubpath />);

    expect(screen.getByText("С подпутями:")).toBeInTheDocument();
    expect(screen.getAllByText("/v1/text-to-image/base/Модель")).toHaveLength(2);
    expect(screen.getByText(/Any Путь after \/images will be appended/)).toBeInTheDocument();
  });
});
