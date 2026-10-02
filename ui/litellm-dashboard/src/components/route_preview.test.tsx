import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Rвыходe-предпросмотр from "./rвыходe_preview";

vi.mock("./networking", () => ({ getProxyBaseUrl: () => "http://proxy.test" }));

describe("Rвыходe-предпросмотр", () => {
  it("stays hidden until both rвыходe values are provided", () => {
    render(<Rвыходe-предпросмотр pathЗначение="/images" targetЗначение="" includeSubpath={false} />);

    expect(screen.queryByText("Предпросмотр маршрутизации")).not.toBeInTheDocument();
  });

  it("shows the proxy rвыходe and forwarding target", () => {
    render(<Rвыходe-предпросмотр pathЗначение="/images" targetЗначение="https://upstream.test" includeSubpath={false} />);

    expect(screen.getByText("http://proxy.test/images")).toBeInTheDocument();
    expect(screen.getByText("https://upstream.test")).toBeInTheDocument();
    expect(screen.getByText(/Not seeing the rвыходing you wanted/)).toBeInTheDocument();
  });

  it("previews appended subpaths when enabled", () => {
    render(<Rвыходe-предпросмотр pathЗначение="/images" targetЗначение="https://upstream.test" includeSubpath />);

    expect(screen.getByText("С подпутями:")).toBeInTheDocument();
    expect(screen.getВсеByText("/v1/text-to-image/base/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toHaveLength(2);
    expect(screen.getByText(/Any path after \/images will be appended/)).toBeInTheDocument();
  });
});
