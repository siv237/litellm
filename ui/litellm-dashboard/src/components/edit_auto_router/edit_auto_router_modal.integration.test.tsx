import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, renderWithПровайдерs, screen, waitFor, within } from "@/../tests/test-utils";

import { toast } from "@/lib/toast";
import EditAutoRвыходerModal from "./edit_auto_rвыходer_modal";
vi.mock(
  "@/app/(dashboard)/hooks/autoRвыходer/use— сложностьОценкаrDefaults",
  async () => await import("../../../tests/mocks/complexityОценкаrDefaults"),
);

const {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall,
  getAutoRвыходerClassifierDefaultPromptCall,
  getAutoRвыходerAssembledPromptCall,
  validateAutoRвыходerКонфигурация,
} = vi.hoisted(() => ({
  validateAutoRвыходerКонфигурация: vi.fn().mockResolvedЗначение({ valid: true }),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall: vi.fn().mockResolvedЗначение({}),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall: vi.fn().mockResolvedЗначение({ data: [] }),
  getAutoRвыходerClassifierDefaultPromptCall: vi.fn().mockResolvedЗначение("Classify the request into exactly one tier."),
  getAutoRвыходerAssembledPromptCall: vi.fn().mockResolvedЗначение("Classify the request into exactly one tier."),
}));

vi.mock("../networking", () => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall,
  getAutoRвыходerClassifierDefaultPromptCall,
  getAutoRвыходerAssembledPromptCall,
  validateAutoRвыходerКонфигурация,
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({ default: () => ({ accessТокен: "sk-test" }) }));

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: vi.fn().mockResolvedЗначение([{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4o-mini" }]),
}));

const STORED_CONFIG = {
  tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o-mini"], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
  classifier_type: "heuristic",
  keyword_tier_rules: [{ keywords: ["invoice", "refund"], tier: "MEDIUM" }],
  escalation_keywords: ["urgent", "выходage"],
  semantic_keyword_matching: true,
  embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "voyage-4-large",
  match_threshold: 0.72,
};

const MODEL_DATA = {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "tri-tier-rвыходer",
  litellm_params: {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/complexity_rвыходer",
    complexity_rвыходer_config: STORED_CONFIG,
  },
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "auto-1", access_groups: [] },
};

const renderModal = () =>
  renderWithПровайдерs(
    <EditAutoRвыходerModal
      isVisible
      onCancel={vi.fn()}
      onSuccess={vi.fn()}
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={MODEL_DATA}
      accessТокен="token"
      userRole="Admin"
    />,
  );

const savedКонфигурация = () => {
  const [, payload] = Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mock.calls.at(-1) ?? [];
  return payload?.litellm_params?.complexity_rвыходer_config;
};

describe("EditAutoRвыходerModal keyword matching", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  it("renders the advanced sections the create form offers", async () => {
    renderModal();

    expect(await screen.findByText(/Escalation Ключевые слова/i)).toBeInTheDocument();
    expect(await screen.findByText(/Ключевое слово\/Semantic Matching/i)).toBeInTheDocument();
  });

  // These keys are rewritten from form state on save, so if the modal renders the controls
  // withвыход hydrating them, an untouched save silently wipes the stored configuration. This
  // drives the real component; a test of the payload builder alone cannot see that bug.
  it("preserves stored keyword matching through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderModal();

    await screen.findByText(/Escalation Ключевые слова/i);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());

    const config = savedКонфигурация();
    expect(config.keyword_tier_rules).toEqual([{ keywords: ["invoice", "refund"], tier: "MEDIUM" }]);
    expect(config.escalation_keywords).toEqual(["urgent", "выходage"]);
    expect(config.semantic_keyword_matching).toBe(true);
    expect(config.embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toBe("voyage-4-large");
    expect(config.match_threshold).toBe(0.72);
  });

  // Same gate as the create form: the dry-run's verdict has to stop the PATCH, or an operator sees
  // a raw 400 instead of the inline message the dry-run was added to give them.
  it("does not PATCH when the backend's dry-run rejects the config", async () => {
    const user = userEvent.setup();
    validateAutoRвыходerКонфигурация.mockResolvedЗначениеOnce({
      valid: false,
      error: "tier_labels cannot be combined with tier_definitions",
    });

    renderModal();
    await screen.findByText(/Escalation Ключевые слова/i);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(validateAutoRвыходerКонфигурация).toHaveBeenCalled());
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).not.toHaveBeenCalled();
  });

  // The create form blocks this; the edit modal renders the same controls, so it must block it
  // too. The backend raises on semantic_keyword_matching withвыход an embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию or keyword
  // rules, so skipping the guard turns a friendly inline message into a raw 400.
  it("blocks a save that enables semantic matching with no embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: {
              ...STORED_CONFIG,
              semantic_keyword_matching: true,
              embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: undefined,
              keyword_tier_rules: [{ keywords: ["invoice"], tier: "MEDIUM" }],
            },
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

    await screen.findByText(/Escalation Ключевые слова/i);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(toast.fromОшибка).toHaveBeenCalled());
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).not.toHaveBeenCalled();
  });

  // LIT-5133, edit side. Semantic matching is off here on purpose: it used to be the only thing
  // that checked a rule for keywords, so with it on this save was already blocked and the test
  // would pass withвыход the fix. Off, the unfilled row was dropped and the save reported success.
  it("blocks a save that adds a keyword rule and leaves it empty", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: {
              ...STORED_CONFIG,
              semantic_keyword_matching: false,
              embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: undefined,
            },
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

    await screen.findByText(/Escalation Ключевые слова/i);
    fireEvent.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));

    // The modal renders the same controls as the create form, so it owes the same treatment:
    // the row says what is missing and the save is not offered while it is.
    expect(await screen.findByText("Требуется хотя бы одно ключевое слово")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).not.toHaveBeenCalled();
  });

  it("gives the save back once the added keyword rule is filled", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: {
              ...STORED_CONFIG,
              semantic_keyword_matching: false,
              embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: undefined,
            },
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

    await screen.findByText(/Escalation Ключевые слова/i);
    fireEvent.click(screen.getByText("Advanced: Ключевое слово/Semantic Matching"));
    await user.click(screen.getByRole("button", { name: /add keyword rule/i }));
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();

    await user.type(
      within(screen.getByText("Ключевые слова 2").closest("div") as HTMLElement).getByRole("combobox"),
      "chargeback",
    );
    await user.click(await screen.findByText('Create "chargeback"'));

    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
    expect(screen.queryByText("Требуется хотя бы одно ключевое слово")).not.toBeInTheDocument();
  });
});

describe("EditAutoRвыходerModal classifier context window", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const STORED_LLM_CONFIG = {
    tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o-mini"], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
    classifier_type: "llm",
    classifier_llm_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini", timeвыход_ms: 3000 },
    classifier_context_window_size: 5,
    classifier_context_per_turn_chars: 300,
  };

  const renderLlmModal = () =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config: STORED_LLM_CONFIG },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  // Hydration bugs are invisible to the payload-builder unit tests, which only exercise
  // buildОбновлён— сложностьRвыходerКонфигурация with a form value the caller already assembled by hand.
  // Only driving the real component through open, then save with nothing touched, catches a
  // missing initializeForm hydration line.
  it("shows the stored classifier context values and preserves them through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderLlmModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await screen.findByText("Context Window Size");
    expect(screen.getByDisplayЗначение("5")).toBeInTheDocument();
    expect(screen.queryByText("Context Per-Turn Character Limit")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    const config = savedКонфигурация();
    expect(config.classifier_context_window_size).toBe(5);
    expect(config.classifier_context_per_turn_chars).toBe(300);
  });

  // The prompt editor is a base-ui Dialog at z-index 50. Housing this form in an antd Modal put a
  // z-index 1000 overlay between the operator and it, so the editor opened underneath and could
  // not be read or typed into. jsdom does not paint, so the assertion is the invariant behind the
  // stacking: both overlays come from the one Dialog primitive the create form already uses.
  it("opens the classifier prompt editor in the same overlay layer as the form", async () => {
    const user = userEvent.setup();
    const { baseElement } = renderLlmModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("button", { name: /prompt/i }));

    expect(await screen.findByLabelText("Инструкции классификации")).toBeInTheDocument();
    expect(baseElement.queryВыбратьorВсе('[data-slot="dialog-content"]')).toHaveLength(2);
  });

  it("persists an edited classifier context window size", async () => {
    const user = userEvent.setup();
    renderLlmModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    const input = await screen.findByLabelText("Context Window Size");
    fireEvent.change(input, { target: { value: "8" } });

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_context_window_size).toBe(8);
  });
});

describe("EditAutoRвыходerModal assistant turns", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const STORED_CONFIG = {
    tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o-mini"], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
    classifier_type: "llm",
    classifier_llm_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini", timeвыход_ms: 3000 },
    classifier_context_include_assistant_turns: true,
  };

  const renderModal = () =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config: STORED_CONFIG },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  // The create and edit stacks share the rendered control but duplicate the serializer, the
  // hydrator and the managed-key set, so a field wired into only one of them fails here and
  // nowhere else: the payload-builder unit tests are handed a form value assembled by hand.
  it("shows the stored value and preserves it through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await screen.findByText("Include Assistant Turns");
    expect(screen.getByRole("switch", { name: "Include Assistant Turns" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_context_include_assistant_turns).toBe(true);
  });

  it("persists turning assistant turns off", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await screen.findByText("Include Assistant Turns");
    await user.click(screen.getByRole("switch", { name: "Include Assistant Turns" }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_context_include_assistant_turns).toBe(false);
  });
});

describe("EditAutoRвыходerModal classification frequency", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const renderWithStoredКонфигурация = (complexity_rвыходer_config: Record<string, unknown>) =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{ ...MODEL_DATA, litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config } }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  // A stored config with neither key now runs with affinity OFF, because both backend fields
  // default that way. The picker has to render what the rвыходer actually does, and an untouched
  // save must not flip it.
  it("shows a stored config with neither key as every request", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    expect(await screen.findByRole("radio", { name: /Every request/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity).toBe(false);
  });

  it("shows a stored session_affinity=true as once per session and preserves it through an untouched save", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, session_affinity: true });

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    expect(await screen.findByRole("radio", { name: /Once per session/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity).toBe(true);
  });

  it("persists picking once per session", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Once per session/ }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity).toBe(true);
  });

  it("persists picking every request back over a stored session pin", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, session_affinity: true });

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Every request/ }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity).toBe(false);
  });

  it("clears a stored session pin when the operator moves to every new user message", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, session_affinity: true });

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Every new user message/ }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity).toBe(false);
    expect(savedКонфигурация().classification_mode).toBe("user_turn");
  });

  it("shows a stored user_turn as selected and preserves it through an untouched save", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, classification_mode: "user_turn" });

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    expect(await screen.findByRole("radio", { name: /Every new user message/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classification_mode).toBe("user_turn");
  });

  it("persists switching a stored config to every new user message", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Every new user message/ }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classification_mode).toBe("user_turn");
  });

  it("rewrites the stored mode to every_request when the operator picks it back", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, classification_mode: "user_turn" });

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Every request/ }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classification_mode).toBe("every_request");
  });
});

describe("EditAutoRвыходerModal deployment affinity", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const renderWithStoredКонфигурация = (complexity_rвыходer_config: Record<string, unknown>) =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{ ...MODEL_DATA, litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config } }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  it("shows a stored config with no deployment_affinity key as on, matching the backend default", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Affinity"));
    expect(
      await screen.findByRole("switch", { name: "Pin a session to one deployment per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group" }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().deployment_affinity).toBe(true);
  });

  it("shows a stored deployment_affinity=false as off and preserves it through an untouched save", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, deployment_affinity: false });

    await user.click(await screen.findByText("Advanced: Affinity"));
    expect(
      await screen.findByRole("switch", { name: "Pin a session to one deployment per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group" }),
    ).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().deployment_affinity).toBe(false);
  });

  it("persists turning deployment affinity off", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Affinity"));
    await user.click(await screen.findByRole("switch", { name: "Pin a session to one deployment per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group" }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().deployment_affinity).toBe(false);
  });

  it("preserves an idle TTL through an untouched save", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, session_affinity_ttl_seconds: 300 });

    await user.click(await screen.findByText("Advanced: Affinity"));
    expect(await screen.findByLabelText("How long a pin survives idle (seconds)")).toHaveЗначение("300");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity_ttl_seconds).toBe(300);
  });

  it("persists an edited idle TTL", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Affinity"));
    const ttl = await screen.findByLabelText("How long a pin survives idle (seconds)");
    fireEvent.change(ttl, { target: { value: "300" } });
    fireEvent.blur(ttl);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().session_affinity_ttl_seconds).toBe(300);
  });

  it("removes the idle TTL when cleared", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, session_affinity_ttl_seconds: 300 });

    await user.click(await screen.findByText("Advanced: Affinity"));
    const ttl = await screen.findByLabelText("How long a pin survives idle (seconds)");
    fireEvent.change(ttl, { target: { value: "" } });
    fireEvent.blur(ttl);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).not.toHaveСвойство("session_affinity_ttl_seconds");
  });

  // modality_pin_override is a managed key, so the modal rewrites it from form state on save. A
  // hydration gap would silently turn a stored override off on the next untouched save.
  it("shows a stored modality_pin_override=true as on and preserves it through an untouched save", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, modality_rвыходing: true, modality_pin_override: true });

    await user.click(await screen.findByText("Advanced: Modality Маршрутизация"));
    expect(await screen.findByRole("switch", { name: "Override session pin for image requests" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().modality_pin_override).toBe(true);
  });

  it("persists turning the modality pin override on", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация({ ...STORED_CONFIG, modality_rвыходing: true });

    await user.click(await screen.findByText("Advanced: Modality Маршрутизация"));
    await user.click(await screen.findByRole("switch", { name: "Override session pin for image requests" }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().modality_pin_override).toBe(true);
  });

  it("writes modality_pin_override=false for a stored config that never carried the key", async () => {
    const user = userEvent.setup();
    renderWithStoredКонфигурация(STORED_CONFIG);

    await user.click(await screen.findByText("Advanced: Modality Маршрутизация"));
    expect(await screen.findByRole("switch", { name: "Override session pin for image requests" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().modality_pin_override).toBe(false);
  });
});

describe("EditAutoRвыходerModal custom classifier prompt and fallback", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const STORED_CUSTOM_CONFIG = {
    tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o-mini"], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
    classifier_type: "llm",
    classifier_llm_config: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini",
      timeвыход_ms: 3000,
      system_prompt: "Grade data sensitivity, not difficulty.",
    },
    classifier_fallback: "default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
  };

  const renderCustomModal = () =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config: STORED_CUSTOM_CONFIG },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  // Both keys are rewritten from form state on save, so a missing hydration line would silently
  // wipe an operator's custom prompt the first time they opened this modal for anything else.
  it("preserves a stored custom prompt and fallback through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderCustomModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    expect(await screen.findByRole("button", { name: "Edit custom prompt" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Rвыходe to the default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    const config = savedКонфигурация();
    expect(config.classifier_llm_config.system_prompt).toBe("Grade data sensitivity, not difficulty.");
    expect(config.classifier_fallback).toBe("default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
  });

  it("persists a switch back to the heuristic fallback", async () => {
    const user = userEvent.setup();
    renderCustomModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("radio", { name: /Оценка with the heuristic/ }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_fallback).toBe("heuristic");
  });

  it("drops the override when the prompt is reset to the default", async () => {
    const user = userEvent.setup();
    renderCustomModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(await screen.findByRole("button", { name: "Сбросить к значению по умолчанию" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_llm_config).not.toHaveСвойство("system_prompt");
  });
});

describe("EditAutoRвыходerModal default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const savedDefaultРежимl = () => {
    const [, payload] = Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mock.calls.at(-1) ?? [];
    return payload?.litellm_params?.complexity_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию;
  };

  const renderWithStoredPin = (default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию?: string) =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: { ...STORED_CONFIG, ...(default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию && { default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию }) },
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  // No config blob marker — only litellm_params.complexity_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, as an untouched
  // rвыходer looked before this PR's marker existed, or one an external API call wrote directly to.
  const renderWithLitellmParamsDefaultOnly = (complexityRвыходerDefaultРежимl: string) =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: STORED_CONFIG,
            complexity_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: complexityRвыходerDefaultРежимl,
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  it("preserves a stored pin through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderWithStoredPin("выход-of-band-default");

    await user.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedDefaultРежимl()).toBe("выход-of-band-default");
    expect(savedКонфигурация()).toMatchObject({ default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "выход-of-band-default" });
  });

  it("shows a stored pin as the selection, so the saved value is not a hidden one", async () => {
    renderWithStoredPin("выход-of-band-default");

    const select = await screen.findByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
    expect(select).toHaveЗначение("выход-of-band-default");
  });

  // The pin is recorded in the config rather than inferred by comparing the stored default to a
  // re-derivation, so pinning the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию the tiers already imply still reads back as a pin.
  it("keeps a pin that matches what the tiers derive", async () => {
    const user = userEvent.setup();
    renderWithStoredPin(STORED_CONFIG.tiers.MEDIUM[0]);

    const select = await screen.findByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
    expect(select).toHaveЗначение(STORED_CONFIG.tiers.MEDIUM[0]);

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).toMatchObject({ default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: STORED_CONFIG.tiers.MEDIUM[0] });
  });

  // Greptile P1 on #36615: with no config blob marker, a litellm_params default that merely
  // matches what the tiers derive is indistinguishable from the pre-PR auto-derive-and-write
  // behavior (main always wrote a tier-derived value there on every save). Treating it as a pin
  // would freeze every pre-existing rвыходer's default away from its tiers, so it stays unpinned.
  it("treats a litellm_params default matching tier-derivation as unpinned, not a frozen-in pin", async () => {
    const user = userEvent.setup();
    renderWithLitellmParamsDefaultOnly(STORED_CONFIG.tiers.MEDIUM[0]);

    const select = await screen.findByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
    expect(select).toHaveЗначение("");

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).not.toHaveСвойство("default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
    expect(savedDefaultРежимl()).toBe(STORED_CONFIG.tiers.MEDIUM[0]);
  });

  // Greptile P1 on #36615: a litellm_params default that diverges from tier-derivation could only
  // have gotten there via an explicit override — set by the API directly, since this UI's own
  // save path keeps it in sync with tiers whenever there's no pin. That divergence must survive
  // the next save instead of being silently recomputed away.
  it("treats a diverging litellm_params default as an external pin and preserves it", async () => {
    const user = userEvent.setup();
    renderWithLitellmParamsDefaultOnly("claude-sonnet-4");

    const select = await screen.findByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
    expect(select).toHaveЗначение("claude-sonnet-4");

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).toMatchObject({ default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-sonnet-4" });
    expect(savedDefaultРежимl()).toBe("claude-sonnet-4");
  });

  // The config blob marker is this UI's own authoritative record of intent (see
  // hydratePinnedDefaultРежимl), so it wins even over a litellm_params value that disagrees —
  // e.g. a stale value from before the operator most recently changed the pin.
  it("prefers the config blob marker over a diverging litellm_params value", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: { ...STORED_CONFIG, default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "blob-pin" },
            complexity_rвыходer_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "stale-litellm-params-value",
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

    const select = await screen.findByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
    expect(select).toHaveЗначение("blob-pin");

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).toMatchObject({ default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "blob-pin" });
  });

  // This modal only requires one non-empty tier, so a COMPLEX-only rвыходer is reachable here even
  // though the backend raises on it. The block keeps that failure at save time instead of init.
  it("blocks a save when neither the tiers nor a pin give the backend a default", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: {
              ...STORED_CONFIG,
              tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: ["complex-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию"], REASONING: [] },
            },
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

    await user.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(toast.fromОшибка).toHaveBeenCalledWith(expect.stringContaining("Simple or Medium tier")));
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).not.toHaveBeenCalled();
  });

  it("leaves a rвыходer with no stored pin tracking its tiers", async () => {
    const user = userEvent.setup();
    renderWithStoredPin();

    const select = await screen.findByRole("combobox", { name: "Default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });
    expect(select).toHaveЗначение("");

    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedDefaultРежимl()).toBe(STORED_CONFIG.tiers.MEDIUM[0]);
    expect(savedКонфигурация()).not.toHaveСвойство("default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
  });
});

describe("EditAutoRвыходerModal plan-mode minimum tier", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const renderWithStoredУровень = (plan_mode_min_tier?: string) =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: {
            ...MODEL_DATA.litellm_params,
            complexity_rвыходer_config: { ...STORED_CONFIG, ...(plan_mode_min_tier && { plan_mode_min_tier }) },
          },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  const openPlanРежимPanel = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByText("Advanced: Plan-Режим Override"));
  };

  it("shows a stored tier as an enabled override, so the saved value is not a hidden one", async () => {
    const user = userEvent.setup();
    renderWithStoredУровень("MEDIUM");
    await openPlanРежимPanel(user);
    expect(await screen.findByRole("switch", { name: "Rвыходe plan-mode requests to a minimum tier" })).toBeChecked();
  });

  it("preserves a stored tier through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderWithStoredУровень("MEDIUM");

    await user.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).toMatchObject({ plan_mode_min_tier: "MEDIUM" });
  });

  it("turning the override off removes the stored tier from the saved config", async () => {
    const user = userEvent.setup();
    renderWithStoredУровень("MEDIUM");
    await openPlanРежимPanel(user);
    await user.click(await screen.findByRole("switch", { name: "Rвыходe plan-mode requests to a minimum tier" }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация()).not.toHaveСвойство("plan_mode_min_tier");
  });
});

describe("EditAutoRвыходerModal with a stored custom tier set", () => {
  const CUSTOM_STORED = {
    tiers: { CASUAL: ["gpt-4o-mini"], SECURITY_REVIEW: ["gpt-4o-mini"] },
    tier_definitions: [
      { name: "CASUAL", description: "small talk" },
      { name: "SECURITY_REVIEW", description: "audits and vulnerability review" },
    ],
    fallback_tier: "CASUAL",
    classifier_type: "llm",
    classifier_llm_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini", timeвыход_ms: 3000 },
    plan_mode_min_tier: "SECURITY_REVIEW",
    classification_prompt: "operator written preamble",
    tier_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configs: {
      SECURITY_REVIEW: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "gpt-4o-mini", litellm_params: { reasoning_effort: "high" } }],
    },
  };

  const renderCustomModal = () =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config: CUSTOM_STORED },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  it("shows the stored tier names rather than the built-in four", async () => {
    renderCustomModal();
    expect(await screen.findByText("SECURITY_REVIEW Уровень")).toBeInTheDocument();
    expect(screen.queryByText("Simple Уровень")).not.toBeInTheDocument();
  });

  it("saves an untouched custom-tier rвыходer back byte-identically, tier set and floor included", async () => {
    const user = userEvent.setup();
    renderCustomModal();

    await screen.findByText("SECURITY_REVIEW Уровень");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());

    const config = savedКонфигурация();
    expect(config.tier_definitions).toEqual(CUSTOM_STORED.tier_definitions);
    expect(config.tiers).toEqual(CUSTOM_STORED.tiers);
    expect(config.fallback_tier).toBe("CASUAL");
    expect(config.plan_mode_min_tier).toBe("SECURITY_REVIEW");
    expect(config.classification_prompt).toBe("operator written preamble");
    expect(config.classifier_type).toBe("llm");
  });

  it("keeps the stored per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию reasoning effort, which hydrates by tier name and saves by row id", async () => {
    const user = userEvent.setup();
    renderCustomModal();

    await screen.findByText("SECURITY_REVIEW Уровень");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());

    expect(savedКонфигурация().tier_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configs).toEqual(CUSTOM_STORED.tier_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_configs);
  });
});
describe("EditAutoRвыходerModal prompt compression", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const savedLitellmParams = () => {
    const [, payload] = Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mock.calls.at(-1) ?? [];
    return payload?.litellm_params;
  };

  const renderWithStoredCompression = (compression?: {
    auto_rвыходer_rвыходing_compression?: string;
    auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression?: string;
  }) =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: { ...MODEL_DATA.litellm_params, ...compression },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  it("should clear both saved compression overrides when inheritance is selected", async () => {
    const user = userEvent.setup();
    renderWithStoredCompression({
      auto_rвыходer_rвыходing_compression: "rвыходing-compressor",
      auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-compressor",
    });

    await user.click(await screen.findByText("Advanced: Compression"));
    await user.click(screen.getВсеByRole("button", { name: "Clear", exact: true })[0]);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalledWith(
        "token",
        expect.objectContaining({
          litellm_params: expect.objectContaining({
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_rвыходer/complexity_rвыходer",
            auto_rвыходer_rвыходing_compression: null,
            auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: null,
          }),
        }),
        "auto-1",
      ),
    );
  });

  it("should discard a cancelled clear and preserve compression when the saved choice is restored", async () => {
    const user = userEvent.setup();
    const stored = { auto_rвыходer_rвыходing_compression: "none", auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-compressor" };
    const view = renderWithStoredCompression(stored);

    await user.click(await screen.findByText("Advanced: Compression"));
    await user.click(screen.getВсеByRole("button", { name: "Clear", exact: true })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel", exact: true }));
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).not.toHaveBeenCalled();
    view.unmount();

    renderWithStoredCompression(stored);
    await user.click(await screen.findByText("Advanced: Compression"));
    expect(screen.getByRole("combobox", { name: "Сжатие решения маршрутизации" })).toHaveЗначение("Нет (без сжатия)");
    await user.click(screen.getВсеByRole("button", { name: "Clear", exact: true })[0]);
    await user.click(screen.getByRole("combobox", { name: "Сжатие решения маршрутизации" }));
    await user.click(screen.getByRole("option", { name: "Нет (без сжатия)" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedLitellmParams()).toMatchObject(stored);
  });

  it("leaves both compression keys выход of an untouched save when none were stored", async () => {
    const user = userEvent.setup();
    renderWithStoredCompression();

    await user.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedLitellmParams()).not.toHaveСвойство("auto_rвыходer_rвыходing_compression");
    expect(savedLitellmParams()).not.toHaveСвойство("auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression");
  });

  it.each([
    { auto_rвыходer_rвыходing_compression: "headroom-a", auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: "headroom-a" },
    { auto_rвыходer_rвыходing_compression: "rвыходing-compressor" },
    { auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-compressor" },
  ])("should preserve the exact stored compression fields through an untouched save: %j", async (stored) => {
    const user = userEvent.setup();
    renderWithStoredCompression(stored);

    await user.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(
      Object.fromEntries(
        Object.entries(savedLitellmParams()).filter(
          ([key]) => key === "auto_rвыходer_rвыходing_compression" || key === "auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression",
        ),
      ),
    ).toEqual(stored);
  });

  it("shows a stored different-compression choice as Использовать другое сжатие, not Same", async () => {
    const user = userEvent.setup();
    renderWithStoredCompression({
      auto_rвыходer_rвыходing_compression: "headroom-a",
      auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: "none",
    });

    await user.click(await screen.findByText("Advanced: Compression"));

    expect(await screen.findByRole("combobox", { name: "Сжатие решения маршрутизации" })).toHaveЗначение("headroom-a");
    expect(screen.getByRole("radio", { name: "Использовать другое сжатие" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Сжатие вызова модели" })).toHaveЗначение("Нет (без сжатия)");
  });

  it("preserves a stored different-compression choice through an untouched open-and-save", async () => {
    const user = userEvent.setup();
    renderWithStoredCompression({
      auto_rвыходer_rвыходing_compression: "headroom-a",
      auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression: "none",
    });

    await user.click(await screen.findByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedLitellmParams()?.auto_rвыходer_rвыходing_compression).toBe("headroom-a");
    expect(savedLitellmParams()?.auto_rвыходer_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_compression).toBe("none");
  });
});

describe("EditAutoRвыходerModal classifier vision", () => {
  beforeEach(() => {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall.mockClear();
  });

  const STORED_CONFIG = {
    tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o-mini"], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
    classifier_type: "llm",
    classifier_llm_config: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o-mini",
      timeвыход_ms: 3000,
      vision: { enabled: true, max_images: 2 },
    },
  };

  const renderModal = () =>
    renderWithПровайдерs(
      <EditAutoRвыходerModal
        isVisible
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData={{
          ...MODEL_DATA,
          litellm_params: { ...MODEL_DATA.litellm_params, complexity_rвыходer_config: STORED_CONFIG },
        }}
        accessТокен="token"
        userRole="Admin"
      />,
    );

  it("hydrates and keeps a stored vision setting through an untouched save", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    expect(screen.getByRole("switch", { name: "Use images for classification" })).toBeChecked();
    expect(screen.getByLabelText("Макс.imum images per request")).toHaveЗначение("2");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_llm_config).toMatchObject({ vision: { enabled: true, max_images: 2 } });
  });

  it("removes vision when the operator turns it off", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Advanced: Classification Метод"));
    await user.click(screen.getByRole("switch", { name: "Use images for classification" }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall).toHaveBeenCalled());
    expect(savedКонфигурация().classifier_llm_config).not.toHaveСвойство("vision");
  });
});
