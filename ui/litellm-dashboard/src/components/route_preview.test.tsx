import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Route-предпросмотр from "./route_preview";

vi.mock("./networking", () => ({ getProxyBaseUrl: () => "http://proxy.test" }));

describe("Route-предпросмотр", () => {
  it("stays hidden until both route values are provided", () => {
    render(<Route-предпросмотр pathЗначение="/images" targetЗначение="" includeSubpath={false} />);

    expect(screen.queryByText("Предпросмотр маршрутизации")).not.toBeInTheDocument();
  });

  it("shows the proxy route and forwarding target", () => {
    render(<Route-предпросмотр pathЗначение="/images" targetЗначение="https://upstream.test" includeSubpath={false} />);

    expect(screen.getByText("http://proxy.test/images")).toBeInTheDocument();
    expect(screen.getByText("https://upstream.test")).toBeInTheDocument();
    expect(screen.getByText(/Not seeing the routing you wanted/)).toBeInTheDocument();
  });

  it("previews appended subpaths when enabled", () => {
    render(<Route-предпросмотр pathЗначение="/images" targetЗначение="https://upstream.test" includeSubpath />);

    expect(screen.getByText("С подпутями:")).toBeInTheDocument();
    expect(screen.getAllByText("/v1/text-to-image/base/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toHaveLength(2);
    expect(screen.getByText(/Any path after \/images will be appended/)).toBeInTheDocument();
  });
});
