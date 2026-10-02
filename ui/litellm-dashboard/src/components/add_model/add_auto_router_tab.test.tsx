import {
  renderWithПровайдерs,
  screen,
  waitFor,
  within,
  fireEvent,
  testЗапросClient,
  chooseВыбратьOption,
} from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddAutoRвыходerTab from "./add_auto_rвыходer_tab";
import { toast } from "@/lib/toast";
import { handleAddAutoRвыходerSubmit } from "./handle_add_auto_rвыходer_submit";
import { getMissingУровеньsОшибка } from "./build_complexity_rвыходer_config";
import { getSubmitBlockedReason } from "./add_auto_rвыходer_tab";
import { buildРежимlAvailability } from "@/lib/autorвыходer_presets";
import { testAutoRвыходerМаршрутизация } from "../networking";
import { РежимlGroup } from "@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs";
import { AutoRвыходerPreset, getОбязательноРежимlsInPreset } from "@/lib/autorвыходer_presets";
import { BUNDLED_PRESETS, LOADED_PRESETS_QUERY, useAutoRвыходerPresets } from "../../../tests/mocks/autoRвыходerPresets";
vi.mock(
  "@/app/(dashboard)/hooks/autoRвыходer/use— сложностьОценкаrDefaults",
  async () => await import("../../../tests/mocks/complexityОценкаrDefaults"),
);
vi.mock(
  "@/app/(dashboard)/hooks/autoRвыходer/useAutoRвыходerPresets",
  async () => await import("../../../tests/mocks/autoRвыходerPresets"),
);
const getВсеPresets = (): AutoRвыходerPreset[] => BUNDLED_PRESETS;
const getPresetByКлюч = (key: string): AutoRвыходerPreset | undefined => BUNDLED_PRESETS.find((p) => p.key === key);

const ANTHROPIC_PRESET = getPresetByКлюч("anthropic_family")!;
const ANTHROPIC_TIERS = ANTHROPIC_PRESET.complexity_rвыходer_config.tiers;

// Every Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию referenced by the bundled family presets, derived from the presets themselves so
// that renaming a preset's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs in autorвыходer_presets.json does not red these tests. A caller
// holding all of these can select either preset; dropping any one greys выход the preset that
// names it.
const ALL_FAMILY_MODELS: РежимlGroup[] = [
  ...new Set(getВсеPresets().flatMap((preset) => [...getОбязательноРежимlsInPreset(preset)])),
].map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group) => ({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group, mode: "chat" }));

const ANTHROPIC_ONLY_MODEL = ANTHROPIC_TIERS.COMPLEX[0];

const openTemplateDropdown = (): void => {
  fireEvent.click(screen.getByTestId("template-selector"));
};

// Detailed Конфигурацияuration is collapsed by default, so any test reaching into it (a tier select, an
// "Advanced: ..." sub-section) has to open it first.
const expandDetailedКонфигурацияuration = (): void => {
  fireEvent.click(screen.getByTestId("detailed-configuration-toggle"));
};

const visibleOptions = (): HTMLElement[] => screen.queryВсеByRole("option");

const optionByLabel = (label: string): HTMLElement | undefined =>
  visibleOptions().find((el) => el.textContent?.startsWith(label));

const isOptionDisabled = (option: HTMLElement): boolean => option.getAttribute("aria-disabled") === "true";

const tierChips = (tier: string): HTMLElement => {
  const placeholder = `Выберите модель(s) for ${tier.toLowerCase()} queries`;
  const chips = screen
    .getВсеByRole("toolbar")
    .find((candidate) => within(candidate).queryByLabelText(placeholder) !== null);
  if (!chips) throw new Ошибка(`No tier row found for "${tier}"`);
  return chips;
};

const expectУровеньРежимl = (tier: string, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: string): void => {
  const chips = within(tierChips(tier)).getВсеByLabelText(/.+/, { selector: '[data-slot="combobox-chip"]' });
  expect(chips.map((chip) => chip.getAttribute("aria-label"))).toEqual([Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию]);
};

const selectTemplate = async (label: string): Promise<void> => {
  await userEvent.click(optionByLabel(label)!);
};

// Opens the dropdown only when it is closed, since openTemplateDropdown toggles: waiting on a
// second preset in the same test would otherwise close the list выход from under the poll.
const waitForPresetEnabled = async (label: string) => {
  if (visibleOptions().length === 0) openTemplateDropdown();
  await waitFor(() => {
    expect(isOptionDisabled(optionByLabel(label)!)).toBe(false);
  });
};

// The keyword field is a combobox that offers whatever is typed as a "Create ..." entry, so a
// keyword only lands on the rule once that entry is picked.
const addКлючевое слово = async (user: ReturnType<typeof userEvent.setup>, field: HTMLElement, keyword: string) => {
  await user.type(within(field).getByRole("combobox"), keyword);
  await user.click(await screen.findByText(`Create "${keyword}"`));
};

const { mockFetchAvailableРежимls, mockFetchВсеРежимlDeployments } = vi.hoisted(() => ({
  mockFetchAvailableРежимls: vi.fn(),
  mockFetchВсеРежимlDeployments: vi.fn(),
}));

const { validateAutoRвыходerКонфигурация } = vi.hoisted(() => ({
  validateAutoRвыходerКонфигурация: vi.fn().mockResolvedЗначение({ valid: true }),
}));

vi.mock("../networking", () => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall: vi.fn().mockResolvedЗначение({ data: [] }),
  testAutoRвыходerМаршрутизация: vi.fn(),
  validateAutoRвыходerКонфигурация,
}));

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: mockFetchAvailableРежимls,
}));

vi.mock("@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useРежимls", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useРежимls")>();
  return { ...actual, fetchВсеРежимlDeployments: mockFetchВсеРежимlDeployments };
});

vi.mock("./handle_add_auto_rвыходer_submit", () => ({
  handleAddAutoRвыходerSubmit: vi.fn(),
}));

// Kept real by default so the "mandatory field" test still sees genuine tier validation; one
// test overrides it to reach the submit path withвыход driving four tier selects.
vi.mock("./build_complexity_rвыходer_config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./build_complexity_rвыходer_config")>();
  return { ...actual, getMissingУровеньsОшибка: vi.fn(actual.getMissingУровеньsОшибка) };
});

// A real TeamDropdown fetches teams and renders an antd Выбрать; the wiring under test is
// whether team_id is registered, validated and forwarded, so a plain control stands in. The
// clear button mirrors the real dropdown's x, which emits null rather than a string.
vi.mock("../common_components/team_dropdown", () => ({
  default: ({ value, onChange }: { value?: string; onChange?: (next: string | null) => void }) => (
    <>
      <select
        data-testid="team-dropdown"
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label="Выбрать Team"
      >
        <option value="">none</option>
        <option value="team-1">team-1</option>
      </select>
      <button type="button" data-testid="team-dropdown-clear" onClick={() => onChange?.(null)}>
        clear team
      </button>
    </>
  ),
}));

const Harness = () => <AddAutoRвыходerTab handleOk={vi.fn()} accessТокен="token" userRole="Admin" />;

describe("AddAutoRвыходerTab", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    // testЗапросClient is a shared singleton with staleВремя: Infinity, so cached Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию lists would
    // otherwise bleed across tests (a later test reusing accessТокен="token" would read an earlier
    // test's data instead of its own mock).
    testЗапросClient.clear();
    mockFetchAvailableРежимls.mockResolvedЗначение([]);
    mockFetchВсеРежимlDeployments.mockResolvedЗначение([]);
  });

  // Detailed Конфигурацияuration starts collapsed so the modal opens onto just Name + Template; a caller
  // opts into the full tier/classifier form rather than always seeing it up front.
  it("keeps Detailed Конфигурацияuration collapsed until a caller opens it", () => {
    renderWithПровайдерs(<Harness />);

    expect(screen.queryByText("— сложность Уровень Конфигурацияuration")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("detailed-configuration-toggle"));

    expect(screen.getByText("— сложность Уровень Конфигурацияuration")).toBeInTheDocument();
  });

  it("hides automatic setup when no available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is recommended", async () => {
    mockFetchAvailableРежимls.mockResolvedЗначение([
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "unknown-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-a", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "unknown-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-b", mode: "chat" },
    ]);
    renderWithПровайдерs(<Harness />);

    openTemplateDropdown();
    await waitFor(() => expect(optionByLabel("Anthropic Family")).toHaveTextContent("Missing:"));
    expect(screen.queryByTestId("configure-automatically-button")).not.toBeInTheDocument();
  });

  it("mixes preferred tier Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs even when one complete preset is available", async () => {
    const anthropicPreset = getPresetByКлюч("anthropic_family")!;
    mockFetchAvailableРежимls.mockResolvedЗначение(
      [...getОбязательноРежимlsInPreset(anthropicPreset), "gpt-5.6-luna"].map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group) => ({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group,
        mode: "chat",
      })),
    );
    mockFetchВсеРежимlDeployments.mockResolvedЗначение([]);
    renderWithПровайдерs(<Harness />);

    const button = await screen.findByTestId("configure-automatically-button");
    await userEvent.click(button);

    expectУровеньРежимl("Simple", "gpt-5.6-luna");
    expectУровеньРежимl("Medium", "claude-sonnet-5");
    expectУровеньРежимl("Complex", "claude-opus-5");
    expectУровеньРежимl("Reasoning", "claude-opus-5");
    expect(toast.success).not.toHaveBeenCalledWith(expect.stringContaining("Конфигурацияured with"));
  });

  it("mixes available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs from the preferred tier catalog when no complete template fits", async () => {
    mockFetchAvailableРежимls.mockResolvedЗначение(
      ["gpt-5.6-luna", "claude-sonnet-5", "gpt-5.6-sol"].map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group) => ({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group,
        mode: "chat",
      })),
    );
    mockFetchВсеРежимlDeployments.mockResolvedЗначение([]);
    renderWithПровайдерs(<Harness />);

    const button = await screen.findByTestId("configure-automatically-button");
    await userEvent.click(button);

    expectУровеньРежимl("Simple", "gpt-5.6-luna");
    expectУровеньРежимl("Medium", "claude-sonnet-5");
    expectУровеньРежимl("Complex", "gpt-5.6-sol");
    expectУровеньРежимl("Reasoning", "gpt-5.6-sol");
  });

  it("opens Detailed Конфигурацияuration on the tiers automatic setup just filled in", async () => {
    const simpleРежимl = "gpt-5.6-luna";
    mockFetchAvailableРежимls.mockResolvedЗначение([...ALL_FAMILY_MODELS, { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: simpleРежимl, mode: "chat" }]);
    renderWithПровайдерs(<Harness />);

    expect(screen.queryByText("— сложность Уровень Конфигурацияuration")).not.toBeInTheDocument();

    await userEvent.click(await screen.findByTestId("configure-automatically-button"));

    expect(screen.getByText("— сложность Уровень Конфигурацияuration")).toBeInTheDocument();
    expectУровеньРежимl("Simple", simpleРежимl);
  });

  // Nothing is filled in, so there is nothing to submit. The button reports that itself instead of
  // accepting a click and answering with a toast.
  it("offers no submit at all until every tier has a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    renderWithПровайдерs(<Harness />);

    expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled();
  });

  it("still flags the rвыходer name once the config no longer blocks the submit", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);
    renderWithПровайдерs(<Harness />);

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    expect(await screen.findByText("Auto rвыходer name is required")).toBeInTheDocument();
    expect(toast.fromОшибка).toHaveBeenCalledWith("Please enter an Имя авто-роутера");
  });

  it("offers no team selector to a proxy admin, who may create an unscoped rвыходer", () => {
    renderWithПровайдерs(<Harness />);

    expect(screen.queryByTestId("team-dropdown")).not.toBeInTheDocument();
  });

  it("requires a team admin to pick a team", async () => {
    renderWithПровайдерs(
      <AddAutoRвыходerTab handleOk={vi.fn()} accessТокен="token" userRole="Internal User" createОбласть="team-required" />,
    );

    expect(screen.getByTestId("team-dropdown")).toBeInTheDocument();
    expect(screen.getByText("Выбрать Team")).toBeInTheDocument();
  });

  // POST /Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/new 403s an unscoped create from a non-proxy-admin, so a selected team that
  // never reaches the payload is indistinguishable from having no selector at all. The value
  // has to survive form.validateПолеs, which only returns the fields it is asked for.
  it("carries the selected team through to the create payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(
      <AddAutoRвыходerTab handleOk={vi.fn()} accessТокен="token" userRole="Internal User" createОбласть="team-required" />,
    );

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "team-scoped-rвыходer");
    await user.selectOptions(screen.getByTestId("team-dropdown"), "team-1");
    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0]).toMatchObject({ team_id: "team-1" });
  });

  it("does not submit when the backend's dry-run rejects the config", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);
    validateAutoRвыходerКонфигурация.mockResolvedЗначениеOnce({
      valid: false,
      error: "session_affinity cannot be combined with tier_definitions",
    });

    renderWithПровайдерs(<Harness />);
    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "rejected-rвыходer");
    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(validateAutoRвыходerКонфигурация).toHaveBeenCalled());
    expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
  });

  it("creates the rвыходer once when the form is submitted again mid dry-run", async () => {
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);
    let resolveVerdict: (verdict: { valid: boolean }) => void = () => {};
    validateAutoRвыходerКонфигурация.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveVerdict = resolve;
        }),
    );

    const { container } = renderWithПровайдерs(<Harness />);
    fireEvent.change(screen.getByPlaceholderText(/smart_rвыходer/i), { target: { value: "double-submit-rвыходer" } });

    fireEvent.submit(container.queryВыбратьor("form")!);
    await waitFor(() => expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled());
    fireEvent.submit(container.queryВыбратьor("form")!);

    resolveVerdict({ valid: true });
    await waitFor(() => expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeEnabled());
    expect(validateAutoRвыходerКонфигурация).toHaveBeenCalledВремяs(1);
    expect(handleAddAutoRвыходerSubmit).toHaveBeenCalledВремяs(1);
  });

  it("submits when the dry-run passes, so the gate is not simply blocking everything", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);
    validateAutoRвыходerКонфигурация.mockResolvedЗначениеOnce({ valid: true });

    renderWithПровайдерs(<Harness />);
    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "accepted-rвыходer");
    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
  });

  // LIT-5133: "Добавить правило ключевых слов" seeds a row with no keywords, and the semantic toggle that used
  // to be the only thing checking them is off by default. The row was dropped on the way to the
  // payload, so the create succeeded and the caller's rule was gone with nothing said abвыход it.
  it("takes the submit away while a keyword rule is left empty", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "keyword-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));

    expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled();
    // The row says so on its own; there is no failed submit left to surface it.
    expect(await screen.findByText("Требуется хотя бы одно ключевое слово")).toBeInTheDocument();
    expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
  });

  it("gives the submit back once that keyword rule is filled", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "keyword-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));
    expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled();

    await addКлючевое слово(user, screen.getByText("Ключевые слова 1").closest("div") as HTMLElement, "invoice");

    expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeEnabled();
    expect(screen.queryByText("Требуется хотя бы одно ключевое слово")).not.toBeInTheDocument();
  });

  it("shows the orphaned-rule reason in the tier editor when a rule's tier is removed", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "orphan-rule-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));
    await addКлючевое слово(user, screen.getByText("Ключевые слова 1").closest("div") as HTMLElement, "invoice");

    await user.click(screen.getByRole("button", { name: "Edit tiers" }));
    await user.click(screen.getByRole("button", { name: "Remove the COMPLEX tier" }));

    expect(await screen.findByText(/rвыходe to a tier this rвыходer no longer has/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled();
  });

  it("marks only the offending keyword row, leaving a filled one alone", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "keyword-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));
    await addКлючевое слово(user, screen.getByText("Ключевые слова 1").closest("div") as HTMLElement, "invoice");
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));

    expect(await screen.findВсеByText("Требуется хотя бы одно ключевое слово")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled();
  });

  it("creates the rвыходer once that keyword rule is filled in", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "keyword-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));
    const keywordsПоле = screen.getByText("Ключевые слова 1").closest("div") as HTMLElement;
    await addКлючевое слово(user, keywordsПоле, "invoice");
    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0]).toMatchObject({
      complexity_rвыходer_config: { keyword_tier_rules: [{ keywords: ["invoice"], tier: "COMPLEX" }] },
    });
  });

  it("blocks the submit when a team admin has not picked a team", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(
      <AddAutoRвыходerTab handleOk={vi.fn()} accessТокен="token" userRole="Internal User" createОбласть="team-required" />,
    );

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "team-scoped-rвыходer");
    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    expect(await screen.findByText("Please select a team to continue")).toBeInTheDocument();
    expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
  });

  // The shared dropdown emits null on clear while this form's schema wants a string, so the
  // form maps null back to "": the user sees the pick-a-team message, not a zod type error.
  it("treats a team picked and then cleared like no team at all", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(
      <AddAutoRвыходerTab handleOk={vi.fn()} accessТокен="token" userRole="Internal User" createОбласть="team-required" />,
    );

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "team-scoped-rвыходer");
    await user.selectOptions(screen.getByTestId("team-dropdown"), "team-1");
    await user.click(screen.getByTestId("team-dropdown-clear"));
    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    expect(await screen.findByText("Please select a team to continue")).toBeInTheDocument();
    expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
  });

  it("defaults a new rвыходer to session affinity off, matching the backend field default", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "affinity-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Classification Метод"));
    expect(await screen.findByRole("radio", { name: /Once per session/ })).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      session_affinity: false,
    });
  });

  it("carries a context-window escalation opt-выход through to the create payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "ctx-window-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Context Window Escalation"));
    const toggle = await screen.findByRole("switch", { name: "Escalate oversized prompts to a tier that fits" });
    expect(toggle).toBeChecked();
    await user.click(toggle);

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      enable_context_window_escalation: false,
    });
  });

  it("clamps the context-window buffer to 1 and keeps an untouched buffer выход of the payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "ctx-buffer-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Context Window Escalation"));
    const buffer = await screen.findByLabelText("Window fit buffer");
    fireEvent.change(buffer, { target: { value: "1.5" } });
    fireEvent.blur(buffer, { target: { value: "1.5" } });

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    const config = vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config;
    expect(config).toMatchObject({ context_window_escalation_buffer: 1 });
    expect(config).not.toHaveСвойство("enable_context_window_escalation");
  });

  it("clearing the buffer removes it from the payload so the rвыходer tracks the backend default", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "ctx-clear-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Context Window Escalation"));
    const buffer = await screen.findByLabelText("Window fit buffer");
    fireEvent.change(buffer, { target: { value: "0.8" } });
    fireEvent.blur(buffer, { target: { value: "0.8" } });
    fireEvent.change(buffer, { target: { value: "" } });
    fireEvent.blur(buffer, { target: { value: "" } });

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).not.toHaveСвойство(
      "context_window_escalation_buffer",
    );
  });

  describe("prompt compression", () => {
    it("leaves both compression keys выход of the create payload when the section is untouched", async () => {
      const user = userEvent.setup();
      vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

      renderWithПровайдерs(<Harness />);

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "no-compression-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      const submitted = vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0];
      expect(submitted).not.toHaveСвойство("auto_rвыходer_rвыходing_compression");
      expect(submitted).not.toHaveСвойство("auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression");
    });

    it("mirrors an explicit no-compression rвыходing choice onto the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию call by default", async () => {
      const user = userEvent.setup();
      vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

      renderWithПровайдерs(<Harness />);

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "no-compression-explicit-rвыходer");
      expandDetailedКонфигурацияuration();
      await user.click(screen.getByText("Advanced: Compression"));
      await chooseВыбратьOption(
        user,
        screen.getByRole("combobox", { name: "Сжатие решения маршрутизации" }),
        "Нет (без сжатия)",
      );

      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      const submitted = vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0];
      expect(submitted?.auto_rвыходer_rвыходing_compression).toBe("none");
      expect(submitted?.auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression).toBe("none");
    });

    it("defaults the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию call to none when different is chosen but nothing is picked there", async () => {
      const user = userEvent.setup();
      vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

      renderWithПровайдерs(<Harness />);

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "different-compression-rвыходer");
      expandDetailedКонфигурацияuration();
      await user.click(screen.getByText("Advanced: Compression"));
      await chooseВыбратьOption(
        user,
        screen.getByRole("combobox", { name: "Сжатие решения маршрутизации" }),
        "Нет (без сжатия)",
      );
      await user.click(screen.getByText("Использовать другое сжатие"));
      expect(screen.getByRole("combobox", { name: "Сжатие вызова модели" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      const submitted = vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0];
      expect(submitted?.auto_rвыходer_rвыходing_compression).toBe("none");
      expect(submitted?.auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression).toBe("none");
    });
  });

  // The scalar floor is the one scorer knob with no group dict behind it, so its wiring into the create
  // payload is only proven end to end. 0 is the case a truthy check would silently drop.
  it("carries a reasoning override floor of 0 through to the create payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "override-floor-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Classification Метод"));
    await user.click(await screen.findByText("Расширенное оценивание"));
    fireEvent.change(await screen.findByLabelText("Мин.imum score"), { target: { value: "0" } });

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      reasoning_override_min_score: 0,
    });
  });

  it("carries session affinity turned on and its idle window through to the create payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "affinity-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Once per session/ }));
    await user.click(screen.getByText("Advanced: Affinity"));
    const ttl = await screen.findByLabelText("How long a pin survives idle (seconds)");
    fireEvent.change(ttl, { target: { value: "300" } });
    fireEvent.blur(ttl);

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      session_affinity: true,
      session_affinity_ttl_seconds: 300,
    });
  });

  it("carries every new user message through to the create payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "user-turn-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Every new user message/ }));

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      classification_mode: "user_turn",
    });
  });

  it("writes every_request into the create payload when the default frequency stays selected", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "default-timing-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Classification Метод"));
    expect(await screen.findByRole("radio", { name: /Every request/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(
      vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config.classification_mode,
    ).toBe("every_request");
  });

  it("defaults a new rвыходer to deployment affinity on, matching the backend field default", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "affinity-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Affinity"));
    expect(
      await screen.findByRole("switch", { name: "Pin a session to one deployment per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group" }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      deployment_affinity: true,
    });
  });

  it("carries deployment affinity turned off through to the create payload", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "affinity-rвыходer");
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Affinity"));
    await user.click(await screen.findByRole("switch", { name: "Pin a session to one deployment per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group" }));

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      deployment_affinity: false,
    });
  });

  it("writes both modality flags as false into the create payload when the panel stays untouched", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    fireEvent.change(screen.getByPlaceholderText(/smart_rвыходer/i), { target: { value: "modality-rвыходer" } });

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      modality_rвыходing: false,
      modality_pin_override: false,
    });
  });

  it("carries the pin override through to the create payload once image rвыходing unlocks it", async () => {
    const user = userEvent.setup();
    vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);

    renderWithПровайдерs(<Harness />);

    fireEvent.change(screen.getByPlaceholderText(/smart_rвыходer/i), { target: { value: "modality-rвыходer" } });
    expandDetailedКонфигурацияuration();
    await user.click(screen.getByText("Advanced: Modality Маршрутизация"));
    await user.click(await screen.findByRole("switch", { name: "Rвыходe image requests to vision-capable Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" }));
    await user.click(await screen.findByRole("switch", { name: "Override session pin for image requests" }));

    await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
      modality_rвыходing: true,
      modality_pin_override: true,
    });
  });

  // Custom is the escape hatch, not the headline choice, so it's listed after every bundled preset
  // rather than first.
  it("lists Custom Конфигурацияuration after the bundled presets", () => {
    renderWithПровайдерs(<Harness />);
    openTemplateDropdown();

    const labels = visibleOptions().map((option) => option.queryВыбратьor(".font-medium")?.textContent);

    expect(labels).toEqual([
      "1M Context",
      "Anthropic Family",
      "Gemini Family",
      "Lite",
      "OpenAI Family",
      "Custom Конфигурацияuration",
    ]);
  });

  describe("rвыходing test", () => {
    it("offers no rвыходing test until the config is complete enough to rвыходe", async () => {
      const actual = await vi.importActual<typeof import("./build_complexity_rвыходer_config")>(
        "./build_complexity_rвыходer_config",
      );
      vi.mocked(getMissingУровеньsОшибка).mockImplementation(actual.getMissingУровеньsОшибка);

      renderWithПровайдерs(<Harness />);

      expect(screen.getByTestId("auto-rвыходer-test-rвыходing-btn")).toBeDisabled();
    });

    it("rвыходes a prompt through the config on screen withвыход creating the rвыходer", async () => {
      const user = userEvent.setup();
      vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);
      vi.mocked(testAutoRвыходerМаршрутизация).mockResolvedЗначение({
        status: "success",
        result: {
          rвыходed_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-opus-5",
          rвыходed_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configured: true,
          rвыходing_decision: { rвыходed_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-opus-5", tier: "COMPLEX", cause: "literal_keyword_match" },
        },
      });

      renderWithПровайдерs(<Harness />);
      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "keyword-rвыходer");
      expandDetailedКонфигурацияuration();
      await user.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
      await user.click(screen.getByRole("button", { name: /add keyword rule/i }));
      const keywordsПоле = screen.getByText("Ключевые слова 1").closest("div") as HTMLElement;
      await addКлючевое слово(user, keywordsПоле, "invoice");

      await user.click(screen.getByTestId("auto-rвыходer-test-rвыходing-btn"));
      await user.type(await screen.findByTestId("auto-rвыходer-rвыходing-test-prompt"), "reconcile this invoice");
      await user.click(screen.getByTestId("auto-rвыходer-rвыходing-test-send"));

      await waitFor(() => expect(testAutoRвыходerМаршрутизация).toHaveBeenCalled());
      const [accessТокен, request] = vi.mocked(testAutoRвыходerМаршрутизация).mock.calls.at(-1)!;
      expect(accessТокен).toBe("token");
      expect(request.prompt).toBe("reconcile this invoice");
      expect(request.rвыходer_name).toBe("keyword-rвыходer");
      expect(request.complexity_rвыходer_config).toMatchObject({
        keyword_tier_rules: [{ keywords: ["invoice"], tier: "COMPLEX" }],
      });
      expect(await screen.findByTestId("auto-rвыходer-rвыходing-test-rвыходed-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toHaveTextContent("claude-opus-5");
      expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
    });

    it("forgets the last prompt and result when the modal is reopened", async () => {
      const user = userEvent.setup();
      vi.mocked(getMissingУровеньsОшибка).mockReturnЗначение(null);
      vi.mocked(testAutoRвыходerМаршрутизация).mockResolvedЗначение({
        status: "success",
        result: {
          rвыходed_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-opus-5",
          rвыходed_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configured: true,
          rвыходing_decision: { rвыходed_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-opus-5", tier: "COMPLEX", cause: "heuristic_scorer" },
        },
      });

      renderWithПровайдерs(<Harness />);
      await user.click(screen.getByTestId("auto-rвыходer-test-rвыходing-btn"));
      await user.type(await screen.findByTestId("auto-rвыходer-rвыходing-test-prompt"), "reconcile this invoice");
      await user.click(screen.getByTestId("auto-rвыходer-rвыходing-test-send"));
      expect(await screen.findByTestId("auto-rвыходer-rвыходing-test-result")).toBeInTheDocument();

      await user.click(screen.getВсеByRole("button", { name: /^close$/i }).at(-1)!);
      await user.click(screen.getByTestId("auto-rвыходer-test-rвыходing-btn"));

      expect(await screen.findByTestId("auto-rвыходer-rвыходing-test-prompt")).toHaveЗначение("");
      expect(screen.queryByTestId("auto-rвыходer-rвыходing-test-result")).not.toBeInTheDocument();
    });
  });

  describe("template presets", () => {
    it("disables every preset while the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию list is loading", async () => {
      let resolveРежимls: (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: РежимlGroup[]) => void = () => {};
      mockFetchAvailableРежимls.mockImplementation(
        () =>
          new Promise<РежимlGroup[]>((resolve) => {
            resolveРежимls = resolve;
          }),
      );

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      const anthropicOption = optionByLabel("Anthropic Family")!;
      expect(isOptionDisabled(anthropicOption)).toBe(true);
      expect(anthropicOption).toHaveTextContent(/Checking Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию availability/);

      // The dropdown is already open from above; polling re-reads its options in place rather than
      // reopening (openTemplateDropdown toggles, so a second call here would close it instead).
      resolveРежимls(ALL_FAMILY_MODELS);
      await waitFor(() => {
        expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(false);
      });
    });

    it("disables every preset and offers a retry when the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию list fails to load", async () => {
      mockFetchAvailableРежимls.mockRejectedЗначение(new Ошибка("network error"));

      renderWithПровайдерs(<Harness />);

      expect(await screen.findByText("Could not load available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs.")).toBeInTheDocument();
      openTemplateDropdown();
      const anthropicOption = optionByLabel("Anthropic Family")!;
      expect(isOptionDisabled(anthropicOption)).toBe(true);
      expect(anthropicOption).toHaveTextContent(/Cannot verify these Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs are available/);
    });

    it("keeps group-name presets selectable when only the deployment fetch fails", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);
      mockFetchВсеРежимlDeployments.mockRejectedЗначение(new Ошибка("network error"));

      renderWithПровайдерs(<Harness />);

      await waitForPresetEnabled("Anthropic Family");
      await waitForPresetEnabled("OpenAI Family");
    });

    it("disables a preset missing one of its Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs, naming the missing Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(
        ALL_FAMILY_MODELS.filter((m) => m.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group !== ANTHROPIC_ONLY_MODEL),
      );

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      await waitFor(() => {
        expect(optionByLabel("Anthropic Family")!).toHaveTextContent(new RegExp(`Missing: ${ANTHROPIC_ONLY_MODEL}`));
      });
      expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(true);
    });

    it("enables a preset once every Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию it needs is available", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);

      renderWithПровайдерs(<Harness />);

      await waitForPresetEnabled("Anthropic Family");
      await waitForPresetEnabled("OpenAI Family");
    });

    it("collapses detailed configuration and shows a tier summary once a preset is applied", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);
      renderWithПровайдерs(<Harness />);
      await waitForPresetEnabled("Anthropic Family");

      await selectTemplate("Anthropic Family");

      expect(screen.queryByText("Advanced: Ключевое слово/Semantic Matching")).not.toBeInTheDocument();
      expect(
        screen.getByText(
          `Simple: ${ANTHROPIC_TIERS.SIMPLE.join(", ")} · Medium: ${ANTHROPIC_TIERS.MEDIUM.join(", ")} · ` +
            `Complex: ${ANTHROPIC_TIERS.COMPLEX.join(", ")} · Reasoning: ${ANTHROPIC_TIERS.REASONING.join(", ")}`,
        ),
      ).toBeInTheDocument();
    });

    it("expands detailed configuration when Custom Конфигурацияuration is chosen", async () => {
      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      await selectTemplate("Custom Конфигурацияuration");

      expect(screen.getByText("Advanced: Ключевое слово/Semantic Matching")).toBeInTheDocument();
    });

    it("lets a caller manually re-expand a detailed configuration a preset just collapsed", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);
      renderWithПровайдерs(<Harness />);
      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");
      expect(screen.queryByText("Advanced: Ключевое слово/Semantic Matching")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("detailed-configuration-toggle"));

      expect(screen.getByText("Advanced: Ключевое слово/Semantic Matching")).toBeInTheDocument();
    });

    // This is the regression test for the whole feature: if handlePresetChange stopped prefilling
    // complexityRвыходerКонфигурация, the real (unmocked here) getMissingУровеньsОшибка would block the submit
    // and handleAddAutoRвыходerSubmit would never be called.
    it("carries a selected preset's tiers through to the create payload", async () => {
      const user = userEvent.setup();
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);

      renderWithПровайдерs(<Harness />);
      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "anthropic-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0]).toMatchObject({
        auto_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: ANTHROPIC_TIERS.MEDIUM[0],
        complexity_rвыходer_config: { tiers: ANTHROPIC_TIERS },
      });
    });

    // Bugbot-found bug: submitBlockedReason disables the button for this, but Form's onFinish
    // (wired to the same handler as the button) fires whenever the form itself is submitted,
    // independent of the button's own disabled state. Withвыход submitрекомендуетсяRвыходer re-checking
    // it, a real form submission (e.g. Введите, in browsers where that's implicit for this form)
    // could still create a rвыходer referencing a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию no longer in availableРежимlSet.
    it("blocks a form submit when a referenced Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию disappears after the tiers are filled in", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);

      const { container } = renderWithПровайдерs(<Harness />);
      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");
      fireEvent.change(screen.getByPlaceholderText(/smart_rвыходer/i), { target: { value: "stale-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-rвыходer" } });
      expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeEnabled();

      // The Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию list changed after the tiers were filled in (e.g. a deployment removed
      // elsewhere) - update the query cache directly rather than a real refetch, since that's the
      // one thing under test, not how the data arrived. Waiting for the button to actually reflect
      // the disabled state confirms the re-render (and availableРежимlSet) has settled before the
      // form submits, the same way a real user's next interaction would only happen after that.
      testЗапросClient.setЗапросData(["availableРежимls", "autoRвыходer", "token"], []);
      await waitFor(() => expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled());

      fireEvent.submit(container.queryВыбратьor("form")!);

      await waitFor(() => expect(toast.fromОшибка).toHaveBeenCalledWith(expect.stringContaining("no longer available")));
      expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
    });

    it("carries a preset's per-tier reasoning effort through to the create payload", async () => {
      const user = userEvent.setup();
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);

      renderWithПровайдерs(<Harness />);
      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "anthropic-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0]).toMatchObject({
        complexity_rвыходer_config: {
          tier_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configs: ANTHROPIC_PRESET.complexity_rвыходer_config.tier_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configs,
        },
      });
    });
  });

  describe("default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию pin", () => {
    const PINNED_MODEL = "pinned-default-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию";

    const applyPresetAndPin = async (user: ReturnType<typeof userEvent.setup>) => {
      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");

      // Приложениеlying a preset collapses Detailed Конфигурацияuration, so the default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию row is behind it.
      expandDetailedКонфигурацияuration();
      const defaultРежимl = screen.getByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
      await user.click(defaultРежимl);
      await user.type(defaultРежимl, PINNED_MODEL);
      await user.click(await screen.findByRole("option", { name: PINNED_MODEL }));
    };

    beforeEach(() => {
      mockFetchAvailableРежимls.mockResolvedЗначение([...ALL_FAMILY_MODELS, { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: PINNED_MODEL, mode: "chat" }]);
    });

    it("submits the pinned Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию in place of the one the tiers derive", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<Harness />);

      await applyPresetAndPin(user);
      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "pinned-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      const submitted = vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0];
      // The pin rides on litellm_params for the backend and is recorded in the config so the edit
      // modal can read it back as a pin rather than guessing from the tiers.
      expect(submitted).toMatchObject({
        auto_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: PINNED_MODEL,
        complexity_rвыходer_config: { tiers: ANTHROPIC_TIERS, default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: PINNED_MODEL },
      });
      expect(PINNED_MODEL).not.toBe(ANTHROPIC_TIERS.MEDIUM[0]);
    });

    it("blocks a submit whose pinned Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is no longer available", async () => {
      const user = userEvent.setup();
      const { container } = renderWithПровайдерs(<Harness />);

      await applyPresetAndPin(user);
      fireEvent.change(screen.getByPlaceholderText(/smart_rвыходer/i), { target: { value: "stale-pin-rвыходer" } });
      expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeEnabled();

      // Only the pinned Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию disappears - the tier Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs all survive, so nothing but the pin can
      // be what blocks the submit.
      testЗапросClient.setЗапросData(["availableРежимls", "autoRвыходer", "token"], ALL_FAMILY_MODELS);
      await waitFor(() => expect(screen.getByRole("button", { name: /add auto rвыходer/i })).toBeDisabled());

      fireEvent.submit(container.queryВыбратьor("form")!);

      await waitFor(() => expect(toast.fromОшибка).toHaveBeenCalledWith(expect.stringContaining(PINNED_MODEL)));
      expect(handleAddAutoRвыходerSubmit).not.toHaveBeenCalled();
    });
  });

  describe("plan-mode override", () => {
    beforeEach(() => {
      mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);
    });

    it("omits plan_mode_min_tier from the payload when never touched", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<Harness />);

      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");
      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "no-plan-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).not.toHaveСвойство(
        "plan_mode_min_tier",
      );
    });

    it("carries the enabled override through to the create payload", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<Harness />);

      await waitForPresetEnabled("Anthropic Family");
      await selectTemplate("Anthropic Family");
      expandDetailedКонфигурацияuration();
      await user.click(screen.getByText("Advanced: Plan-Режим Override"));
      await user.click(await screen.findByRole("switch", { name: "Rвыходe plan-mode requests to a minimum tier" }));

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "plan-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0].complexity_rвыходer_config).toMatchObject({
        plan_mode_min_tier: "REASONING",
      });
    });
  });

  describe("deployment-matched presets", () => {
    const renamedDeploymentsFor = (presetКлюч: string) =>
      [...getОбязательноРежимlsInPreset(getPresetByКлюч(presetКлюч)!)].map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, index) => ({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: `renamed-${presetКлюч}-${index}`,
        litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: `someprovider/${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию}` },
      }));

    const groupsFor = (deployments: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: string }[]): РежимlGroup[] =>
      deployments.map((deployment) => ({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: deployment.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name, mode: "chat" }));

    const ALL_RENAMED_DEPLOYMENTS = getВсеPresets().flatMap((preset) => renamedDeploymentsFor(preset.key));

    const renamedGroupFor = (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: string): string =>
      ALL_RENAMED_DEPLOYMENTS.find((deployment) => deployment.litellm_params.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию === `someprovider/${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию}`)!
        .Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name;

    it("enables a preset whose Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs exist only under renamed deployments, labeling the match", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(groupsFor(ALL_RENAMED_DEPLOYMENTS));
      mockFetchВсеРежимlDeployments.mockResolvedЗначение(ALL_RENAMED_DEPLOYMENTS);

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      await waitFor(() => {
        expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(false);
      });
      expect(optionByLabel("Anthropic Family")!).toHaveTextContent(/Matches your deployments/);
    });

    it("keeps detailed configuration open and prefills the admin's group names on apply", async () => {
      const user = userEvent.setup();
      mockFetchAvailableРежимls.mockResolvedЗначение(groupsFor(ALL_RENAMED_DEPLOYMENTS));
      mockFetchВсеРежимlDeployments.mockResolvedЗначение(ALL_RENAMED_DEPLOYMENTS);

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();
      await waitFor(() => {
        expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(false);
      });
      await selectTemplate("Anthropic Family");

      expect(screen.getByText("Advanced: Ключевое слово/Semantic Matching")).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "renamed-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0]).toMatchObject({
        complexity_rвыходer_config: {
          tiers: {
            SIMPLE: ANTHROPIC_TIERS.SIMPLE.map(renamedGroupFor),
            MEDIUM: ANTHROPIC_TIERS.MEDIUM.map(renamedGroupFor),
            COMPLEX: ANTHROPIC_TIERS.COMPLEX.map(renamedGroupFor),
            REASONING: ANTHROPIC_TIERS.REASONING.map(renamedGroupFor),
          },
        },
      });
    });

    it("lists a deployment-matched preset ahead of one that stays unavailable", async () => {
      const anthropicOnly = renamedDeploymentsFor("anthropic_family");
      mockFetchAvailableРежимls.mockResolvedЗначение(groupsFor(anthropicOnly));
      mockFetchВсеРежимlDeployments.mockResolvedЗначение(anthropicOnly);

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      await waitFor(() => {
        expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(false);
      });
      const labels = visibleOptions().map((option) => option.queryВыбратьor(".font-medium")?.textContent);
      expect(labels).toEqual([
        "Anthropic Family",
        "1M Context",
        "Gemini Family",
        "Lite",
        "OpenAI Family",
        "Custom Конфигурацияuration",
      ]);
    });

    it.each([
      ["a wildcard group", "openai/*"],
      ["a plain group over a wildcard underlying Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", "openai-wild"],
    ])("never lets %s satisfy a preset when the hub lists no expansions", async (_label, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName) => {
      const wildcard = [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName, litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/*" } }];
      mockFetchAvailableРежимls.mockResolvedЗначение(groupsFor(wildcard));
      mockFetchВсеРежимlDeployments.mockResolvedЗначение(wildcard);

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      await waitFor(() => {
        expect(optionByLabel("OpenAI Family")!).toHaveTextContent(/Missing:/);
      });
      expect(isOptionDisabled(optionByLabel("OpenAI Family")!)).toBe(true);
    });
  });

  describe("wildcard-matched presets", () => {
    const WILDCARD_DEPLOYMENTS = [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "someprovider/*", litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "someprovider/*" } }];

    const expandedGroupFor = (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: string): string => `someprovider/${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию}`;

    const EXPANDED_HUB_GROUPS: РежимlGroup[] = [
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "someprovider/*", mode: "chat" },
      ...[...new Set(getВсеPresets().flatMap((preset) => [...getОбязательноРежимlsInPreset(preset)]))].map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => ({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: expandedGroupFor(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию),
        mode: "chat",
      })),
    ];

    it("enables a preset whose Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs exist only as wildcard-expanded groups, labeling the match", async () => {
      mockFetchAvailableРежимls.mockResolvedЗначение(EXPANDED_HUB_GROUPS);
      mockFetchВсеРежимlDeployments.mockResolvedЗначение(WILDCARD_DEPLOYMENTS);

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();

      await waitFor(() => {
        expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(false);
      });
      expect(optionByLabel("Anthropic Family")!).toHaveTextContent(/Matches your deployments/);
    });

    it("prefills the expanded group names and submits them", async () => {
      const user = userEvent.setup();
      mockFetchAvailableРежимls.mockResolvedЗначение(EXPANDED_HUB_GROUPS);
      mockFetchВсеРежимlDeployments.mockResolvedЗначение(WILDCARD_DEPLOYMENTS);

      renderWithПровайдерs(<Harness />);
      openTemplateDropdown();
      await waitFor(() => {
        expect(isOptionDisabled(optionByLabel("Anthropic Family")!)).toBe(false);
      });
      await selectTemplate("Anthropic Family");

      await user.type(screen.getByPlaceholderText(/smart_rвыходer/i), "wildcard-rвыходer");
      await user.click(screen.getByRole("button", { name: /add auto rвыходer/i }));

      await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalled());
      expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls.at(-1)?.[0]).toMatchObject({
        complexity_rвыходer_config: {
          tiers: {
            SIMPLE: ANTHROPIC_TIERS.SIMPLE.map(expandedGroupFor),
            MEDIUM: ANTHROPIC_TIERS.MEDIUM.map(expandedGroupFor),
            COMPLEX: ANTHROPIC_TIERS.COMPLEX.map(expandedGroupFor),
            REASONING: ANTHROPIC_TIERS.REASONING.map(expandedGroupFor),
          },
        },
      });
    });
  });
});

describe("getSubmitBlockedReason", () => {
  const tiers = {
    SIMPLE: ["gpt-4o-mini"],
    MEDIUM: ["gpt-4o-mini"],
    COMPLEX: ["gpt-4o-mini"],
    REASONING: ["gpt-4o-mini"],
  };
  const availability = buildРежимlAvailability(["gpt-4o-mini"], []);
  const referenced = {
    tiers,
    classifierType: "heuristic" as const,
    classifierLlmКонфигурация: undefined,
    semanticMatchingEnabled: false,
    embeddingРежимl: undefined,
    defaultРежимl: undefined,
  };

  it("lets a complete heuristic rвыходer through", () => {
    expect(getSubmitBlockedReason({ tiers, classifier_type: "heuristic" }, [], referenced, availability)).toBeNull();
  });

  it("blocks an LLM classifier with no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, which the button previously left enabled", () => {
    expect(getSubmitBlockedReason({ tiers, classifier_type: "llm" }, [], referenced, availability)).toContain(
      "Please select a classifier Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
    );
  });

  it("blocks an edited tier set with no classifier Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, since the set forces the LLM classifier", () => {
    const config = {
      tiers,
      classifier_type: "heuristic" as const,
      custom_tier_set: {
        tiers: [
          { id: "a", name: "CASUAL", definition: "d", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o-mini"] },
          { id: "b", name: "AUDIT", definition: "d", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o-mini"] },
        ],
        fallback_tier_id: "a",
      },
    };
    expect(getSubmitBlockedReason(config, [], referenced, availability)).toContain(
      "an edited tier set rвыходes with the LLM classifier",
    );
  });

  it("blocks a keyword rule aimed at a tier this rвыходer does not have", () => {
    const rules = [{ id: "r1", keywords: ["audit"], tier: "AUDIT" }];
    expect(getSubmitBlockedReason({ tiers, classifier_type: "heuristic" }, rules, referenced, availability)).toContain(
      "no longer has",
    );
  });
});

describe("preset catalog fetch states", () => {
  afterEach(() => vi.mocked(useAutoRвыходerPresets).mockReturnЗначение(LOADED_PRESETS_QUERY));

  it("preserves a JEV preset's per-turn bound in the create request", async () => {
    vi.clearВсеMocks();
    testЗапросClient.clear();
    vi.mocked(handleAddAutoRвыходerSubmit).mockReset();
    mockFetchAvailableРежимls.mockResolvedЗначение(ALL_FAMILY_MODELS);
    vi.mocked(useAutoRвыходerPresets).mockReturnЗначение({
      ...LOADED_PRESETS_QUERY,
      data: [
        {
          ...ANTHROPIC_PRESET,
          key: "bounded_jev",
          label: "Bounded JEV",
          complexity_rвыходer_config: {
            ...ANTHROPIC_PRESET.complexity_rвыходer_config,
            classifier_type: "jev",
            jev_classifier_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "jev-test", timeвыход_ms: 3000 },
            classifier_context_per_turn_chars: 450,
          },
        },
      ],
    });
    renderWithПровайдерs(<Harness />);
    await waitForPresetEnabled("Bounded JEV");
    await selectTemplate("Bounded JEV");
    fireEvent.change(screen.getByLabelText("Имя авто-роутера"), { target: { value: "bounded-rвыходer" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Auto Rвыходer" }));

    await waitFor(() => expect(handleAddAutoRвыходerSubmit).toHaveBeenCalledOnce());
    expect(vi.mocked(handleAddAutoRвыходerSubmit).mock.calls[0][0].complexity_rвыходer_config).toMatchObject({
      classifier_type: "jev",
      classifier_context_per_turn_chars: 450,
    });
  });

  it("keeps showing cached presets withвыход the error banner when only a refetch fails", () => {
    vi.mocked(useAutoRвыходerPresets).mockReturnЗначение({
      ...LOADED_PRESETS_QUERY,
      isОшибка: true,
    } as never);
    renderWithПровайдерs(<Harness />);

    expect(screen.queryByText(/Could not load templates/)).not.toBeInTheDocument();

    openTemplateDropdown();
    expect(screen.queryВсеByRole("option").length).toBeGreaterThan(1);
  });

  it("shows a loading hint while the catalog fetch is pending", () => {
    vi.mocked(useAutoRвыходerPresets).mockReturnЗначение({
      ...LOADED_PRESETS_QUERY,
      data: undefined,
      isPending: true,
    } as never);
    renderWithПровайдерs(<Harness />);

    expect(screen.getByText("Loading templates...")).toBeInTheDocument();
  });

  it("degrades to Custom Конфигурацияuration with a retry hint that refetches the catalog", async () => {
    const refetch = vi.fn();
    vi.mocked(useAutoRвыходerPresets).mockReturnЗначение({
      ...LOADED_PRESETS_QUERY,
      data: undefined,
      isОшибка: true,
      refetch,
    } as never);
    renderWithПровайдерs(<Harness />);

    expect(await screen.findByText(/Could not load templates/)).toBeInTheDocument();

    openTemplateDropdown();
    const options = screen.queryВсеByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Custom Конфигурацияuration");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalled();
  });
});
