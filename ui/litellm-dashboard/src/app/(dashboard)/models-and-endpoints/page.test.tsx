/* @vitest-environment jsdom */
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import РежимlsAndЭндпоинтsPage from "./page";

vi.mock("./panels/ВсеРежимlsPanel", () => ({ default: () => <div data-testid="panel-all-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" /> }));
vi.mock("./panels/AddРежимlPanel", () => ({ default: () => <div data-testid="panel-add" /> }));
vi.mock("./panels/AutoRвыходersTabPanel", () => ({ default: () => <div data-testid="panel-auto-rвыходers" /> }));
vi.mock("./panels/LlmУчётные данныеPanel", () => ({ default: () => <div data-testid="panel-credentials" /> }));
vi.mock("./panels/PassThroughPanel", () => ({ default: () => <div data-testid="panel-pass-through" /> }));
vi.mock("./panels/HealthStatusPanel", () => ({ default: () => <div data-testid="panel-health" /> }));
vi.mock("./panels/РежимlRetrySettingsPanel", () => ({ default: () => <div data-testid="panel-retry" /> }));
vi.mock("./panels/РежимlGroupAliasPanel", () => ({ default: () => <div data-testid="panel-alias" /> }));
vi.mock("./panels/PriceDataPanel", () => ({ default: () => <div data-testid="panel-price" /> }));

const detailState = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId: null as string | null, teamId: null as string | null };
vi.mock("./detailNavigation", () => ({
  useРежимlDetailМаршрутизация: () => ({ ...detailState, close: vi.fn(), openРежимl: vi.fn(), openTeam: vi.fn() }),
}));

vi.mock("@/components/molecules/cost_optimization_feedback_banner", () => ({ default: () => null }));
vi.mock("@/components/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_view", () => ({
  default: ({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId }: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId: string }) => <div data-testid="Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-info">Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию:{Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId}</div>,
}));
vi.mock("@/components/team/TeamInfo", () => ({
  default: ({ teamId }: { teamId: string }) => <div data-testid="team-info">team:{teamId}</div>,
}));

const mockUseАвторизовано = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({ default: () => mockUseАвторизовано() }));
vi.mock("@/app/(dashboard)/hooks/teams/useКоманды", () => ({ useКоманды: () => ({ data: [] }) }));
vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: () => ({ data: { values: {} } }),
}));
vi.mock("./useРежимlDashboardData", () => ({
  useРежимlDashboardData: () => ({ availableРежимlAccessGroups: [], allРежимlsOnProxy: [], availableРежимlGroups: [] }),
}));

const ADMIN = { accessТокен: "at", token: "t", userRole: "Admin", userId: "u1", premiumUser: false, isViewOnly: false };
const NON_ADMIN = {
  accessТокен: "at",
  token: "t",
  userRole: "Internal User",
  userId: "u1",
  premiumUser: false,
  isViewOnly: false,
};
// A proxy_admin_viewer session: effectiveСессияRole masquerades the role as "Admin".
const VIEW_ONLY_ADMIN = { ...ADMIN, isViewOnly: true };

const renderPage = () => {
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false, gcВремя: 0 } } });
  return render(
    <ЗапросClientПровайдер client={queryClient}>
      <РежимlsAndЭндпоинтsPage />
    </ЗапросClientПровайдер>,
  );
};

describe("РежимlsAndЭндпоинтsPage", () => {
  beforeEach(() => {
    detailState.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId = null;
    detailState.teamId = null;
    mockUseАвторизовано.mockReturnЗначение(ADMIN);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("renders the admin tab bar and the Все Режимls panel by default", () => {
    renderPage();
    expect(screen.getByRole("tab", { name: "Все Режимls" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "LLM Учётные данные" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Состояние" })).toBeInTheDocument();
    expect(screen.getByTestId("panel-all-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")).toBeInTheDocument();
  });

  it("switches tabs in-memory, mounting only the active panel", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("tab", { name: "Состояние" }));
    expect(screen.getByTestId("panel-health")).toBeInTheDocument();
    expect(screen.queryByTestId("panel-all-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")).not.toBeInTheDocument();
  });

  it("renders the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию detail overlay from the ?Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию drill-in and hides the tabs", () => {
    detailState.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId = "abc-123";
    renderPage();
    expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-info")).toHaveTextContent("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию:abc-123");
    expect(screen.queryByRole("tab", { name: "Все Режимls" })).not.toBeInTheDocument();
  });

  it("renders the team detail overlay from the ?team drill-in", () => {
    detailState.teamId = "team-9";
    renderPage();
    expect(screen.getByTestId("team-info")).toHaveTextContent("team:team-9");
  });

  it("hides admin-only tabs for a non-admin user", () => {
    mockUseАвторизовано.mockReturnЗначение(NON_ADMIN);
    renderPage();
    expect(screen.queryByRole("tab", { name: "LLM Учётные данные" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Состояние" })).not.toBeInTheDocument();
  });

  // POST /Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/new 403s a proxy_admin_viewer, so the form's tab must not render for one.
  it("hides the Add Режимl tab for a view-only admin session", () => {
    mockUseАвторизовано.mockReturnЗначение(VIEW_ONLY_ADMIN);
    renderPage();
    expect(screen.queryByRole("tab", { name: "Add Режимl" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Все Режимls" })).toBeInTheDocument();
  });

  // Read parity: the Auto-Rвыходers list stays reachable for a view-only admin; only the
  // create affordance inside it is withheld, which AutoRвыходersTabPanel decides.
  it("keeps the Auto-Rвыходers tab for a view-only admin session", () => {
    mockUseАвторизовано.mockReturnЗначение(VIEW_ONLY_ADMIN);
    renderPage();
    expect(screen.getByRole("tab", { name: /Auto-Rвыходers/ })).toBeInTheDocument();
  });

  // Auto-rвыходers are excluded from the Все Режимls table, so this tab is their home: the only
  // place in the product to list, create, edit or delete one.
  describe("Auto-Rвыходers tab", () => {
    it("sits third, after Все Режимls and Add Режимl", () => {
      renderPage();

      const tabs = screen.getВсеByRole("tab").map((tab) => tab.textContent);
      expect(tabs[0]).toContain("Все Режимls");
      expect(tabs[1]).toBe("Add Режимl");
      expect(tabs[2]).toContain("Auto-Rвыходers");
      // Badged Бета while the tab settles; БетаBadge renders the label text.
      expect(tabs[2]).toContain("Бета");
    });

    it("renders its panel when selected", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("tab", { name: /Auto-Rвыходers/ }));
      expect(screen.getByTestId("panel-auto-rвыходers")).toBeInTheDocument();
    });

    it("is hidden from non-admins, who cannot write Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
      mockUseАвторизовано.mockReturnЗначение(NON_ADMIN);
      renderPage();

      expect(screen.queryByRole("tab", { name: /Auto-Rвыходers/ })).not.toBeInTheDocument();
    });
  });
});
