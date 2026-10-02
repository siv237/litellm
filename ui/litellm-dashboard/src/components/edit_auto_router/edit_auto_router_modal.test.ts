import { buildОбновлён— сложностьRouterКонфигурация, hydrateComplexityRouterКонфигурация } from "./edit_auto_router_modal";

const storedКонфигурацияЗначение = {
  tiers: {
    SIMPLE: "old-simple",
    MEDIUM: "old-medium",
    COMPLEX: "old-complex",
    REASONING: "old-reasoning",
  },
  classifier_type: "llm",
  classifier_llm_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "old-classifier", timeout_ms: 1200 },
  custom_technical_keywords: ["kafka", "terraform"],
  keyword_tier_rules: [{ keywords: ["invoice", "refund"], tier: "MEDIUM" }],
  semantic_keyword_matching: true,
  embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "voyage-4-large",
  match_threshold: 0.65,
  adaptive: true,
  adaptive_weights: { quality: 0.3, cost: 0.7 },
  tier_distance_penalty: 0.8,
  adaptive_eligible: "all",
  return_raw_model_name: true,
};

const storedКонфигурация = JSON.stringify(storedКонфигурацияЗначение);

const tiers = {
  SIMPLE: ["gpt-4o-mini"],
  MEDIUM: ["gpt-4o-mini"],
  COMPLEX: ["anthropic-sonnet-4-5"],
  REASONING: ["anthropic-sonnet-4-5"],
};

const classifiedУровеньЗначение = {
  tiers,
  classifier_type: "heuristic" as const,
  adaptive: true,
  adaptive_weights: { quality: 0.4, cost: 0.6 },
  tier_distance_penalty: 0.8,
  adaptive_eligible: "classified_tier" as const,
};

const expectedClassifiedУровеньКонфигурация = {
  tiers,
  classifier_type: "heuristic",
  custom_technical_keywords: ["kafka", "terraform"],
  keyword_tier_rules: [{ keywords: ["invoice", "refund"], tier: "MEDIUM" }],
  semantic_keyword_matching: true,
  embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "voyage-4-large",
  match_threshold: 0.65,
  classification_mode: "every_request",
  session_affinity: false,
  deployment_affinity: true,
  modality_routing: false,
  modality_pin_override: false,
  adaptive: true,
  adaptive_weights: { quality: 0.4, cost: 0.6 },
  adaptive_eligible: "classified_tier",
};

const adaptiveDisabledЗначение = {
  tiers,
  classifier_type: "heuristic" as const,
  adaptive: false,
};

const expectedAdaptiveDisabledКонфигурация = {
  tiers,
  classifier_type: "heuristic",
  custom_technical_keywords: ["kafka", "terraform"],
  keyword_tier_rules: [{ keywords: ["invoice", "refund"], tier: "MEDIUM" }],
  semantic_keyword_matching: true,
  embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "voyage-4-large",
  match_threshold: 0.65,
  classification_mode: "every_request",
  session_affinity: false,
  deployment_affinity: true,
  modality_routing: false,
  modality_pin_override: false,
};

describe("buildОбновлён— сложностьRouterКонфигурация", () => {
  it("preserves unrelated options and omits the penalty for classified-tier routing", () => {
    const updatedКонфигурация = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, classifiedУровеньЗначение);

    expect(updatedКонфигурация).toEqual(expectedClassifiedУровеньКонфигурация);
  });

  it("removes managed adaptive and classifier fields when they are disabled", () => {
    const updatedКонфигурация = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, adaptiveDisabledЗначение);

    expect(updatedКонфигурация).toEqual(expectedAdaptiveDisabledКонфигурация);
  });

  it("hydrates a stored modality_routing into form state and defaults absent to off", () => {
    expect(hydrateComplexityRouterКонфигурация({ ...storedКонфигурация, modality_routing: true }, null).modality_routing).toBe(
      true,
    );
    expect(hydrateComplexityRouterКонфигурация(storedКонфигурация, null).modality_routing).toBe(false);
  });

  it("round-trips modality_routing explicitly in both directions", () => {
    const enabled = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, {
      ...classifiedУровеньЗначение,
      modality_routing: true,
    });
    expect(enabled.modality_routing).toBe(true);
    const disabled = buildОбновлён— сложностьRouterКонфигурация(
      { ...storedКонфигурация, modality_routing: true },
      { ...classifiedУровеньЗначение, modality_routing: false },
    );
    expect(disabled.modality_routing).toBe(false);
  });

  it("hydrates a stored modality_pin_override into form state and defaults absent to off", () => {
    expect(
      hydrateComplexityRouterКонфигурация({ ...storedКонфигурация, modality_pin_override: true }, null).modality_pin_override,
    ).toBe(true);
    expect(hydrateComplexityRouterКонфигурация(storedКонфигурация, null).modality_pin_override).toBe(false);
  });

  it("round-trips modality_pin_override explicitly in both directions", () => {
    const enabled = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, {
      ...classifiedУровеньЗначение,
      modality_pin_override: true,
    });
    expect(enabled.modality_pin_override).toBe(true);
    const disabled = buildОбновлён— сложностьRouterКонфигурация(
      { ...storedКонфигурация, modality_pin_override: true },
      { ...classifiedУровеньЗначение, modality_pin_override: false },
    );
    expect(disabled.modality_pin_override).toBe(false);
  });

  it("includes return_raw_model_name only when enabled", () => {
    const updatedКонфигурация = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, {
      ...classifiedУровеньЗначение,
      return_raw_model_name: true,
    });

    expect(updatedConfig.return_raw_model_name).toBe(true);
  });

  it("updates custom technical keywords when they are edited", () => {
    const updatedКонфигурация = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, classifiedУровеньЗначение, ["postgres"]);

    expect(updatedКонфигурация.custom_technical_keywords).toEqual(["postgres"]);
  });

  it("removes custom technical keywords when they are cleared", () => {
    const updatedКонфигурация = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, classifiedУровеньЗначение, []);

    expect(updatedКонфигурация.custom_technical_keywords).toBeUndefined();
  });

  it("preserves a tier configured with more than one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as a pool", () => {
    const multiModelЗначение = {
      ...classifiedУровеньЗначение,
      tiers: { ...tiers, SIMPLE: ["gpt-4o-mini", "claude-haiku-4-5"] },
    };
    const updatedКонфигурация = buildОбновлён— сложностьRouterКонфигурация(storedКонфигурация, multiModelЗначение);

    expect(updatedКонфигурация.tiers).toMatchObject({ SIMPLE: ["gpt-4o-mini", "claude-haiku-4-5"] });
  });
});
