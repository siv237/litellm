import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudZeroIntegrationSettings } from "./CloudZeroIntegrationSettings";
import { CloudZeroSettings } from "./types";

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  __esModule: true,
  default: () => ({
    accessТокен: "test-token",
  }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroDryRun", () => ({
  useCloudZeroDryRun: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: null,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroExport", () => ({
  useCloudZeroExport: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("CloudZeroIntegrationSettings", () => {
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
        <CloudZeroIntegrationSettings settings={mockSettings} onSettingsОбновлён={vi.fn()} />
      </ЗапросClientПровайдер>,
    );

    expect(screen.getByText("CloudZero Конфигурацияuration")).toBeInTheDocument();
    expect(screen.getByText("API Ключ (Redacted)")).toBeInTheDocument();
    expect(screen.getByText("Подключение ID")).toBeInTheDocument();
    expect(screen.getByText("Времяzone")).toBeInTheDocument();
  });

  it("should display the correct values from settings", () => {
    render(
      <ЗапросClientПровайдер client={queryClient}>
        <CloudZeroIntegrationSettings settings={mockSettings} onSettingsОбновлён={vi.fn()} />
      </ЗапросClientПровайдер>,
    );

    expect(screen.getByText(mockSettings.api_key_masked)).toBeInTheDocument();
    expect(screen.getByText(mockSettings.connection_id)).toBeInTheDocument();
  });
});
