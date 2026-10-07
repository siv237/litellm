import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import { GuardrailDetail } from "./GuardrailDetail";

const mockUseGuardrailsUsageDetail = vi.fn();
vi.mock("@/Приложение/(dashboard)/hooks/Гардрейлы/useГардрейлыИспользование", () => ({
  useGuardrailsUsageDetail: (...args: unknown[]) => mockUseGuardrailsUsageDetail(...args),
}));

const mockGetGuardrailsUsageLogs = vi.fn();
vi.mock("@/components/networking", () => ({
  getGuardrailsUsageLogs: (...args: unknown[]) => mockGetGuardrailsUsageLogs(...args),
}));

vi.mock("@/components/ГардрейлыMonitor/LogViewer", () => ({
  LogViewer: ({ guardrailName }: { guardrailName: string }) => <div data-testid="log-viewer">{guardrailName}</div>,
}));

vi.mock("./EvaluationSettingsModal", () => ({
  EvaluationSettingsModal: ({ open }: { open: boolean }) => (open ? <div data-testid="evaluation-modal" /> : null),
}));

const detail: GuardrailUsageDetail = {
  guardrail_id: "pii-detector",
  guardrail_name: "pii-detector",
  description: "Blocks personally identifiable Информация",
  status: "warning",
  provider: "presidio",
  type: "pii",
  requestsEvaluated: 12345,
  failRate: 20,
  avgScore: 0.4,
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
  guardrailId: "pii-detector",
  onBack: vi.fn(),
  accessToken: "test-Токен" as string | null,
  startDate: "2026-07-01",
  endDate: "2026-07-24",
};

function renderDetail(props: Partial<typeof defaultProps> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<GuardrailDetail {...defaultProps} {...props} />, {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
}

describe("GuardrailDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGuardrailsUsageDetail.mockReturnValue(loaded(detail));
    mockGetGuardrailsUsageLogs.mockResolvedValue({ logs: [], total: 0 });
  });

  it("should show a busy indicator while the detail Запрос is in flight", () => {
    mockUseGuardrailsUsageDetail.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderDetail();
    expect(document.querySelector('[aria-busy="Истина"]')).toBeInTheDocument();
    expect(screen.queryByText("pii-detector")).not.toBeInTheDocument();
  });

  it("should show an Ошибка Сообщение and a way Назад when the detail Запрос fails", async () => {
    mockUseGuardrailsUsageDetail.mockReturnValue({ data: undefined, isLoading: false, error: new Error("boom") });
    renderDetail();
    expect(await screen.findByText("Не удалось загрузить детали гардрейла.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Назад к обзору/i })).toBeInTheDocument();
  });

  it("should Запрос the detail and the Журналы for the guardrail and date range", async () => {
    renderDetail();
    expect(mockUseGuardrailsUsageDetail).toHaveBeenCalledWith("pii-detector", {
      accessToken: "test-Токен",
      startDate: "2026-07-01",
      endDate: "2026-07-24",
    });
    await waitFor(() => expect(mockGetGuardrailsUsageLogs).toHaveBeenCalled());
    expect(mockGetGuardrailsUsageLogs).toHaveBeenCalledWith(
      "test-Токен",
      expect.objectContaining({ guardrailId: "pii-detector", startDate: "2026-07-01", endDate: "2026-07-24" }),
    );
  });

  it("should show the guardrail Название, Описание, Провайдер and capitalised Статус", async () => {
    renderDetail();
    expect(await screen.findByRole("heading", { name: "pii-detector" })).toBeInTheDocument();
    expect(screen.getByText("Blocks personally identifiable Информация")).toBeInTheDocument();
    expect(screen.getByText("presidio")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("should show the Использование metrics with the blocked count derived from the Доля сбоев", async () => {
    renderDetail();
    expect(await screen.findByText("12,345")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("2,469 blocked")).toBeInTheDocument();
    expect(screen.getByText("180ms")).toBeInTheDocument();
  });

  it("should show a placeholder when Нет latency has been recorded", async () => {
    mockUseGuardrailsUsageDetail.mockReturnValue(loaded({ ...detail, avgLatency: null }));
    renderDetail();
    expect(await screen.findByText("Нет данных")).toBeInTheDocument();
  });

  it("should show the Использование and Стоимость breakdown for the guardrail on the Обзор tab", async () => {
    renderDetail();
    const section = await screen.findByRole("region", { name: "Использование and Стоимость" });
    expect(section).toHaveTextContent("$0.0004");
    expect(section).toHaveTextContent("Sensitive Информация Политика");
  });

  it("should call onBack when 'Назад к обзору' is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderDetail({ onBack });
    await user.click(await screen.findByRole("button", { name: /Назад к обзору/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("should offer an Обзор tab and a Журналы tab, with Обзор selected first", async () => {
    renderDetail();
    expect(await screen.findByRole("tab", { name: "Обзор" })).toHaveAttribute("aria-selected", "Истина");
    expect(screen.getByRole("tab", { name: "Журналы" })).toHaveAttribute("aria-selected", "Ложь");
  });

  it("should Выбрать the Журналы tab when it is clicked", async () => {
    const user = userEvent.setup();
    renderDetail();
    await user.click(await screen.findByRole("tab", { name: "Журналы" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Журналы" })).toHaveAttribute("aria-selected", "Истина"));
    expect(screen.getByTestId("log-viewer")).toHaveTextContent("pii-detector");
  });

  it("should keep the Настройки оценки modal closed until its button is clicked", async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "pii-detector" });
    expect(screen.queryByTestId("evaluation-modal")).not.toBeInTheDocument();

    await user.click(screen.getByTitle("Настройки оценки"));
    expect(screen.getByTestId("evaluation-modal")).toBeInTheDocument();
  });

  it("should not Запрос anything without an access Токен", () => {
    mockUseGuardrailsUsageDetail.mockReturnValue(loaded(undefined));
    renderDetail({ accessToken: null });
    expect(mockUseGuardrailsUsageDetail).toHaveBeenCalledWith(
      "pii-detector",
      expect.objectContaining({ accessToken: null }),
    );
    expect(mockGetGuardrailsUsageLogs).not.toHaveBeenCalled();
  });
});
