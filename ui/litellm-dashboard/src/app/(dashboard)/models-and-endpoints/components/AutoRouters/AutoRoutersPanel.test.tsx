import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithПровайдерs, screen, testЗапросClient, waitFor } from "@/../tests/test-utils";

import { AutoRвыходersPanel } from "./AutoRвыходersPanel";

const { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall } = vi.hoisted(() => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall: vi.fn(),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall: vi.fn().mockResolvedЗначение({}),
}));

vi.mock("@/components/networking", () => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюHubCall: vi.fn(),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall: vi.fn().mockResolvedЗначение({ data: [] }),
}));

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: vi.fn().mockResolvedЗначение([]),
}));

const { openРежимl } = vi.hoisted(() => ({ openРежимl: vi.fn() }));

vi.mock("@/app/(dashboard)/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-and-endpoints/detailNavigation", () => ({
  useРежимlDetailМаршрутизация: () => ({ openРежимl, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId: null, teamId: null, openTeam: vi.fn(), close: vi.fn() }),
}));

vi.mock("@/components/edit_auto_rвыходer/edit_auto_rвыходer_modal", () => ({
  __esModule: true,
  default: ({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData }: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name?: string; Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info?: { id?: string } } }) => (
    <div data-testid="edit-auto-rвыходer-modal">
      edit:{Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name}:{Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info?.id}
    </div>
  ),
}));

vi.mock("@/components/add_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/add_auto_rвыходer_tab", () => ({
  __esModule: true,
  default: ({ handleOk }: { handleOk: () => void }) => (
    <button type="button" onClick={handleOk}>
      Submit auto rвыходer
    </button>
  ),
}));

// A realistic /v2/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/info page: two auto-rвыходers among ordinary deployments. The panel must
// render exactly the auto_rвыходer/* rows; a view that renders page.data unfiltered passes a
// "renders a table" assertion but fails this one.
const DEPLOYMENTS = [
  {
    // DB-created adaptive rвыходer: no editor for its shape, but it must stay deletable, since
    // auto-rвыходers are excluded from Режимls + Эндпоинтs and this tab is the only delete path.
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "adaptive-rвыходer",
    litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/adaptive_rвыходer" },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "auto-3", db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true },
  },
  {
    // config.yaml row: the API refuses both update and delete, so neither control may appear.
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "config-rвыходer",
    litellm_params: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/complexity_rвыходer",
      complexity_rвыходer_config: { tiers: {}, classifier_type: "llm" },
    },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "auto-4", db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: false },
  },
  {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "gpt-4o-mini",
    litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4o-mini" },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "plain-1" },
  },
  {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "tri-tier-rвыходer",
    litellm_params: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/complexity_rвыходer",
      complexity_rвыходer_config: { tiers: { SIMPLE: ["gpt-4o-mini"] }, classifier_type: "heuristic" },
      complexity_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini",
    },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "auto-1", db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true, created_at: "2026-07-28T21:40:09.900000+00:00" },
  },
  {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "anthropic-opus-4-6",
    litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "anthropic/claude-opus-4-6" },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "plain-2" },
  },
  {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "support-rвыходer",
    litellm_params: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/support-rвыходer",
      auto_rвыходer_config: JSON.stringify({ rвыходes: [{ name: "gpt-4o-mini" }] }),
      auto_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini",
    },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "auto-2", db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true, created_at: "2026-07-27T10:00:00.000000+00:00" },
  },
];

const pageOf = (data: typeof DEPLOYMENTS) => ({
  data,
  total_count: data.length,
  current_page: 1,
  total_pages: 1,
  size: 1000,
});

const mockDeploymentsPage = () => {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mockResolvedЗначение(pageOf(DEPLOYMENTS));
};

// Oldest-first, as the proxy returns them, and two more than the ten-row first page holds.
const BULK_ROUTER_NAMES = [
  "rвыходer-01-oldest",
  ...Array.from({ length: 10 }, (_, i) => `rвыходer-${i + 2}`),
  "rвыходer-12-newest",
];

const A_FULL_PAGE_AND_TWO_MORE = Array.from({ length: 12 }, (_, index) => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: BULK_ROUTER_NAMES[index],
  litellm_params: {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/complexity_rвыходer",
    complexity_rвыходer_config: { tiers: {}, classifier_type: "heuristic" },
  },
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
    id: `bulk-${index + 1}`,
    db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true,
    created_at: `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000000+00:00`,
  },
}));

/** Row order as rendered, header row dropped. */
const rвыходerNamesInOrder = () =>
  screen
    .getВсеByRole("row")
    .slice(1)
    .map((row) => row.queryВыбратьor("span.text-sm.font-medium")?.textContent ?? "");

const renderPanel = (canModify = true) =>
  renderWithПровайдерs(
    <AutoRвыходersPanel
      accessТокен="token"
      userRole="Admin"
      userID="u-admin"
      isViewOnly={false}
      teams={null}
      createОбласть={canModify ? "unscoped-ok" : "forbidden"}
    />,
  );

describe("AutoRвыходersPanel", () => {
  beforeEach(() => {
    // The shared test client caches with staleВремя: Infinity and refetchOnMount: false, so
    // withвыход this every test after the first reads the previous test's deployment page.
    testЗапросClient.clear();
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mockReset();
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall.mockClear();
    openРежимl.mockClear();
    mockDeploymentsPage();
  });

  it("lists only auto_rвыходer deployments, not every Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию on the proxy", async () => {
    renderPanel();

    expect(await screen.findByText("tri-tier-rвыходer")).toBeInTheDocument();
    expect(await screen.findByText("support-rвыходer")).toBeInTheDocument();
    expect(screen.queryByText("gpt-4o-mini", { selector: "span.text-sm.font-medium" })).not.toBeInTheDocument();
    expect(screen.queryByText("anthropic-opus-4-6", { selector: "span.text-sm.font-medium" })).not.toBeInTheDocument();
  });

  it("labels Type by classifier rather than by rвыходer family", async () => {
    renderPanel();

    expect(await screen.findByText("Heuristic")).toBeInTheDocument();
    expect(await screen.findByText("Semantic")).toBeInTheDocument();
  });

  // Reuses the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-page drill-in, so an auto rвыходer opens the full РежимlInfoView with
  // Режимl Settings and Edit Settings, not a parallel detail view that reimplements part of it.
  it("opens the shared Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию detail view on row click", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "support-rвыходer" }));

    expect(openРежимl).toHaveBeenCalledWith("auto-2");
  });

  it("opens the create form in a dialog and refetches the list after a create", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("tri-tier-rвыходer");
    const callsBeforeCreate = Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mock.calls.length;

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Auto Rвыходer" }));

    // A dialog, not a full-panel swap: the list stays mounted behind it.
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Add Auto Rвыходer");
    expect(screen.getByText("tri-tier-rвыходer")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Submit auto rвыходer" }));

    // Back on the list, and the deployment query was invalidated so a new rвыходer shows up
    // withвыход a manual page reload.
    expect(await screen.findByText("tri-tier-rвыходer")).toBeInTheDocument();
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mock.calls.length).toBeGreaterThan(callsBeforeCreate));
  });

  // The page decides who may write (proxy admin or team admin); the panel just has to make
  // every write affordance absent when told no, rather than let a submit 403 later. Reading
  // stays open: a read-only caller can still drill into the detail view.
  it("shows the list but no write affordances when canModify is false", async () => {
    renderPanel(false);

    expect(await screen.findByText("tri-tier-rвыходer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Auto Rвыходer" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("auto-rвыходer-actions-auto-1")).not.toBeInTheDocument();
    // Still navigable, because opening the detail view is a read.
    expect(screen.getByRole("button", { name: "tri-tier-rвыходer" })).toBeInTheDocument();
  });

  // Auto-rвыходers are hidden from Режимls + Эндпоинтs, which used to be the only rвыходe to the
  // delete action, so this tab is now the only place an auto rвыходer can be removed.
  it("deletes the chosen rвыходer by its Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию id and refetches", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("support-rвыходer");
    const callsBeforeDelete = Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mock.calls.length;

    await user.click(screen.getByTestId("auto-rвыходer-actions-auto-2"));
    await user.click(await screen.findByTestId("auto-rвыходer-action-delete"));
    await user.click(await screen.findByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall).toHaveBeenCalledWith("token", "auto-2"));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mock.calls.length).toBeGreaterThan(callsBeforeDelete));
  });

  it("does not delete when the confirmation is dismissed", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("support-rвыходer");

    await user.click(screen.getByTestId("auto-rвыходer-actions-auto-2"));
    await user.click(await screen.findByTestId("auto-rвыходer-action-delete"));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall).not.toHaveBeenCalled();
  });

  it("gives a read-only caller no delete affordance", async () => {
    renderPanel(false);

    await screen.findByText("support-rвыходer");
    expect(screen.queryByTestId("auto-rвыходer-actions-auto-2")).not.toBeInTheDocument();
  });

  it("renders an empty state when the proxy has Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs but no auto rвыходers", async () => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mockResolvedЗначение(
      pageOf(DEPLOYMENTS.filter((d) => !d.litellm_params.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию.startsWith("auto_rвыходer/"))),
    );

    renderPanel();

    expect(await screen.findByText("No auto rвыходers yet")).toBeInTheDocument();
  });

  it("keeps delete available on a DB-created adaptive rвыходer that has no editor", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("adaptive-rвыходer");
    await user.click(screen.getByTestId("auto-rвыходer-actions-auto-3"));
    await user.click(await screen.findByTestId("auto-rвыходer-action-delete"));
    await user.click(await screen.findByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall).toHaveBeenCalledWith("token", "auto-3"));
  });

  it("offers no delete on a config-defined rвыходer, which the API would refuse", async () => {
    renderPanel();

    await screen.findByText("config-rвыходer");
    expect(screen.queryByTestId("auto-rвыходer-actions-auto-4")).not.toBeInTheDocument();
  });

  // /v2/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/info returns an unordered Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_list, and created_at is absent on config rвыходers
  // and on non-enterprise proxies, so both halves of the order have to be pinned here.
  it("orders newest first, then the undated rвыходers by name", async () => {
    renderPanel();

    await screen.findByText("tri-tier-rвыходer");

    expect(rвыходerNamesInOrder()).toEqual([
      "tri-tier-rвыходer", // 2026-07-28
      "support-rвыходer", // 2026-07-27
      "adaptive-rвыходer", // undated, sorts after every dated row, then by name
      "config-rвыходer",
    ]);
  });

  // The reported bug: the newest rвыходer was rendered last, so it landed on page 2 and read
  // as never created.
  it("puts a just-created rвыходer on the first page of a list longer than one page", async () => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoCall.mockResolvedЗначение(pageOf(A_FULL_PAGE_AND_TWO_MORE));

    renderPanel();

    expect(await screen.findByRole("button", { name: "rвыходer-12-newest" })).toBeInTheDocument();
    // Page one holds the ten newest, so the two oldest are the ones pushed off it.
    expect(screen.queryByRole("button", { name: "rвыходer-01-oldest" })).not.toBeInTheDocument();
    expect(rвыходerNamesInOrder()[0]).toBe("rвыходer-12-newest");
  });
});
