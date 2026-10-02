import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/гардрейловs/useГардрейлыИспользование";
import { GuardrailDetail } from "./GuardrailDetail";

const mockUseGuardrailsUsageDetail = vi.fn();
vi.mock("@/app/(dashboard)/hooks/гардрейловs/useГардрейлыИспользование", () => ({
  useGuardrailsUsageDetail: (...args: unknown[]) => mockUseGuardrailsUsageDetail(...args),
}));

const mockGetГардрейлыИспользованиеЖурналы = vi.fn();
vi.mock("@/components/networking", () => ({
  getГардрейлыИспользованиеЖурналы: (...args: unknown[]) => mockGetГардрейлыИспользованиеЖурналы(...args),
}));

vi.mock("@/components/ГардрейлыMonitor/LogViewer", () => ({
  LogViewer: ({ гардрейловName }: { гардрейловName: string }) => <div data-testid="log-viewer">{гардрейловName}</div>,
}));

vi.mock("./EvaluationSettingsModal", () => ({
  EvaluationSettingsModal: ({ open }: { open: boolean }) => (open ? <div data-testid="evaluation-modal" /> : null),
}));

const detail: GuardrailUsageDetail = {
  гардрейлов_id: "pii-detector",
  гардрейлов_name: "pii-detector",
  description: "Blocks personally identifiable information",
  status: "warning",
  provider: "presidio",
  type: "pii",
  requestsEvaluated: 12345,
  failRate: 20,
  avgОценка: 0.4,
  avgLatency: 180,
  trend: "stable",
  time_series: [],
  usage_units: { sensitiveInformationPolicyUnits: 4 },
  usage_units_daily: [],
  usage_units_by_team: { "": { sensitiveInformationPolicyUnits: 4 } },
  usage_units_by_key: { "hash-1": { sensitiveInformationPolicyUnits: 4 } },
  cost: 0.0004,
  cost_by_unit: { sensitiveInformationPolicyUnits: 0.0004 },
  cost_by_team: { "": 0.0004 },
  cost_by_key: { "hash-1": 0.0004 },
  untracked_usage_units: {},
  untracked_usage_units_by_team: {},
  untracked_usage_units_by_key: {},
};

const loaded = (data: GuardrailUsageDetail | undefined) => ({ data, isLoading: false, error: null });

const defaultProps = {
  гардрейловId: "pii-detector",
  onBack: vi.fn(),
  accessТокен: "test-token" as string | null,
  startDate: "2026-07-01",
  endDate: "2026-07-24",
};

function renderDetail(props: Partial<typeof defaultProps> = {}) {
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false } } });
  return render(<GuardrailDetail {...defaultProps} {...props} />, {
    wrapper: ({ children }) => <ЗапросClientПровайдер client={queryClient}>{children}</ЗапросClientПровайдер>,
  });
}

describe("GuardrailDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGuardrailsUsageDetail.mockReturnЗначение(loaded(detail));
    mockGetГардрейлыИспользованиеЖурналы.mockResolvedЗначение({ logs: [], total: 0 });
  });

  it("should show a busy indicator while the detail request is in flight", () => {
    mockUseGuardrailsUsageDetail.mockReturnЗначение({ data: undefined, isLoading: true, error: null });
    renderDetail();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText("pii-detector")).not.toBeInTheDocument();
  });

  it("should show an error message and a way back when the detail request fails", async () => {
    mockUseGuardrailsUsageDetail.mockReturnЗначение({ data: undefined, isLoading: false, error: new Ошибка("boom") });
    renderDetail();
    expect(await screen.findByText("Не удалось загрузить детали гардрейла.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to overview/i })).toBeInTheDocument();
  });

  it("should request the detail and the logs for the гардрейлов and date range", async () => {
    renderDetail();
    expect(mockUseGuardrailsUsageDetail).toHaveBeenCalledWith("pii-detector", {
      accessТокен: "test-token",
      startDate: "2026-07-01",
      endDate: "2026-07-24",
    });
    await waitFor(() => expect(mockGetГардрейлыИспользованиеЖурналы).toHaveBeenCalled());
    expect(mockGetГардрейлыИспользованиеЖурналы).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({ гардрейловId: "pii-detector", startDate: "2026-07-01", endDate: "2026-07-24" }),
    );
  });

  it("should show the гардрейлов name, description, provider and capitalised status", async () => {
    renderDetail();
    expect(await screen.findByRole("heading", { name: "pii-detector" })).toBeInTheDocument();
    expect(screen.getByText("Blocks personally identifiable information")).toBeInTheDocument();
    expect(screen.getByText("presidio")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("should show the usage metrics with the blocked count derived from the fail rate", async () => {
    renderDetail();
    expect(await screen.findByText("12,345")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("2,469 blocked")).toBeInTheDocument();
    expect(screen.getByText("180ms")).toBeInTheDocument();
  });

  it("should show a placeholder when no latency has been recorded", async () => {
    mockUseGuardrailsUsageDetail.mockReturnЗначение(loaded({ ...detail, avgLatency: null }));
    renderDetail();
    expect(await screen.findByText("No data")).toBeInTheDocument();
  });

  it("should show the usage and cost breakdown for the гардрейлов on the overview tab", async () => {
    renderDetail();
    const section = await screen.findByRole("region", { name: "Использование and cost" });
    expect(section).toHaveTextContent("$0.0004");
    expect(section).toHaveTextContent("Sensitive Информация Политика");
  });

  it("should call onBack when 'Назад к обзору' is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderDetail({ onBack });
    await user.click(await screen.findByRole("button", { name: /back to overview/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("should offer an Обзор tab and a Журналы tab, with Обзор selected first", async () => {
    renderDetail();
    expect(await screen.findByRole("tab", { name: "Обзор" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Журналы" })).toHaveAttribute("aria-selected", "false");
  });

  it("should select the Журналы tab when it is clicked", async () => {
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByRole("tab", { name: "Журналы" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Журналы" })).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByTestId("log-viewer")).toHaveTextContent("pii-detector");
  });

  it("should keep the evaluation settings modal closed until its button is clicked", async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "pii-detector" });
    expect(screen.queryByTestId("evaluation-modal")).not.toBeInTheDocument();

    await user.click(screen.getByTitle("Настройки оценки"));
    expect(screen.getByTestId("evaluation-modal")).toBeInTheDocument();
  });

  it("should not request anything withвыход an access token", () => {
    mockUseGuardrailsUsageDetail.mockReturnЗначение(loaded(undefined));
    renderDetail({ accessТокен: null });
    expect(mockUseGuardrailsUsageDetail).toHaveBeenCalledWith(
      "pii-detector",
      expect.objectContaining({ accessТокен: null }),
    );
    expect(mockGetГардрейлыИспользованиеЖурналы).not.toHaveBeenCalled();
  });
});
