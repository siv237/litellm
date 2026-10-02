import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import CloudZeroUpdateModal from "./CloudZeroUpdateModal";
import { CloudZeroSettings } from "./types";

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  __esModule: true,
  default: () => ({
    accessТокен: "test-token",
  }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings", () => ({
  useCloudZeroUpdateSettings: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("CloudZeroUpdateModal", () => {
  let queryClient: ЗапросClient;
  const mockSettings: CloudZeroSettings = {
    connection_id: "test-connection-id",
    api_key_masked: "****",
    timezone: "UTC",
    status: "Active",
  };

  beforeEach(() => {
    queryClient = new ЗапросClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it("should render", () => {
    render(
      <ЗапросClientПровайдер client={queryClient}>
        <CloudZeroUpdateModal open={true} onOk={vi.fn()} onCancel={vi.fn()} settings={mockSettings} />
      </ЗапросClientПровайдер>,
    );

    expect(screen.getByText("Edit CloudZero Integration")).toBeInTheDocument();
    expect(screen.getByLabelText("CloudZero API Ключ")).toBeInTheDocument();
    expect(screen.getByLabelText("Подключение ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Времяzone")).toBeInTheDocument();
  });
});
