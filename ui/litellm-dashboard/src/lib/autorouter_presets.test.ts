import { describe, it, expect } from "vitest";
import { BUNDLED_PRESETS_RESPONSE } from "../../tests/mocks/autoRouterPresets";
import {
  hydratePresets,
  AutoRouterPreset,
  getRequiredModelsInPreset,
  getMissingModelsInPreset,
  getRequiredModels,
  getMissingModels,
  getReferencedModelsОшибка,
  buildEmptyPrefill,
  buildPresetPrefill,
  buildModelAvailability,
  deploymentRefsFromModelInfo,
  normalizeModelName,
  resolveAvailableModels,
} from "./autorouter_presets";
import { DEFAULT_MATCH_THRESHOLD } from "@/components/add_model/SemanticKeywordMatching";
import { DEFAULT_ESCALATION_KEYWORDS } from "@/components/add_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/EscalationКлючевые слова";

const groupsOnly = (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: Iterable<string>) => buildModelAvailability(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs, []);

// Hydrated from the real bundled catalog so a catalog edit flows into these expectations.
const PRESETS = hydratePresets(BUNDLED_PRESETS_RESPONSE);
const getAllPresets = (): AutoRouterPreset[] => PRESETS;
const getPresetByКлюч = (key: string): AutoRouterPreset | undefined => PRESETS.find((p) => p.key === key);

describe("autorouter_presets", () => {
  it("hydrates exactly the bundled presets", () => {
    const presets = getAllPresets();
    expect(presets.map((p) => p.label).sort()).toEqual([
      "1M Context",
      "Anthropic Family",
      "Gemini Family",
      "Lite",
      "OpenAI Family",
    ]);
    // Every preset carries all four fields the UI relies on; a JSON typo dropping one fails here.
    for (const p of presets) {
      expect(p).toMatchObject({ key: expect.any(String), label: expect.any(String), description: expect.any(String) });
      expect(p.complexity_router_config.tiers).toBeTruthy();
    }
  });

  // buildPresetPrefill resolves every Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию reference through normalizeModelName, so two spellings
  // of the same Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию in one tier (e.g. "claude-sonnet-4-5" and "claude-sonnet-4.5") collapse to one
  // key. For tier_model_configs that silently drops one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию's litellm_params; catch it in the
  // bundled data itself, since nothing else validates preset authoring.
  it("never spells the same Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию two ways within a single tier", () => {
    for (const preset of getAllPresets()) {
      const { tiers, tier_model_configs: configs } = preset.complexity_router_config;
      for (const tier of Object.keys(tiers) as (keyof typeof tiers)[]) {
        const fromTierList = tiers[tier] ?? [];
        const fromConfigs = (configs?.[tier] ?? []).map((entry) => entry.model_name);
        const names = new Set([...fromTierList, ...fromConfigs]);
        const byNormalized = new Map<string, string[]>();
        for (const name of names) {
          const key = normalizeModelName(name);
          byNormalized.set(key, [...(byNormalized.get(key) ?? []), name]);
        }
        for (const spellings of byNormalized.values()) {
          expect(new Set(spellings).size, `${preset.key}.${tier}: ${spellings.join(", ")}`).toBe(1);
        }
      }
    }
  });

  it("resolves a preset by its stable JSON key, not its display label", () => {
    expect(getPresetByКлюч("anthropic_family")?.label).toBe("Anthropic Family");
    expect(getPresetByКлюч("does_not_exist")).toBeUndefined();
  });

  it("keeps every preset free of adaptive/quality settings", () => {
    for (const { complexity_router_config: config } of getAllPresets()) {
      expect(config.adaptive).toBeUndefined();
      expect(config.adaptive_weights).toBeUndefined();
      expect(config.adaptive_eligible).toBeUndefined();
      expect(config.tier_distance_penalty).toBeUndefined();
    }
  });

  it("keeps every preset on the shipped scorer knobs, so a preset cannot pin one to today's numbers", () => {
    for (const { complexity_router_config: config } of getAllPresets()) {
      expect(config.tier_boundaries).toBeUndefined();
      expect(config.token_thresholds).toBeUndefined();
      expect(config.dimension_weights).toBeUndefined();
      expect(config.session_affinity_ttl_seconds).toBeUndefined();
    }
  });

  it("keeps every preset free of custom dimensions, so applying one never adds scoring rows", () => {
    for (const { complexity_router_config: config } of getAllPresets()) {
      expect(config.custom_dimensions).toBeUndefined();
    }
    const config = getPresetByКлюч("anthropic_family")!.complexity_router_config;
    expect(buildPresetPrefill(config, groupsOnly([])).complexityRouterКонфигурация.custom_dimensions).toBeUndefined();
  });

  it("resets both scoring overrides when the form falls back to an empty prefill", () => {
    expect(buildEmptyPrefill().complexityRouterКонфигурация.custom_dimensions).toBeUndefined();
    expect(buildEmptyPrefill().complexityRouterКонфигурация.dimension_weights).toBeUndefined();
  });

  it("carries a preset's session affinity idle window into the prefilled form state", () => {
    const config = getPresetByКлюч("anthropic_family")!.complexity_router_config;
    const prefill = buildPresetPrefill({ ...config, session_affinity_ttl_seconds: 300 }, groupsOnly([]));
    expect(prefill.complexityRouterКонфигурация.session_affinity_ttl_seconds).toBe(300);
    expect(
      buildPresetPrefill(config, groupsOnly([])).complexityRouterКонфигурация.session_affinity_ttl_seconds,
    ).toBeUndefined();
  });

  it("carries a preset's stored weights and custom dimensions into the prefill withвыход rebalancing them", () => {
    const config = getPresetByКлюч("anthropic_family")!.complexity_router_config;
    const weights = { codePresence: 0.4 };
    const dimension = { name: "domain", weight: 0.9, keywords: ["orbitmesh"] };
    const prefill = buildPresetPrefill(
      { ...config, dimension_weights: weights, custom_dimensions: [dimension] },
      groupsOnly([]),
    ).complexityRouterКонфигурация;
    expect(prefill.dimension_weights).toEqual(weights);
    expect(prefill.custom_dimensions).toEqual([{ ...dimension, id: "stored-0" }]);
    const plain = buildPresetPrefill(config, groupsOnly([])).complexityRouterКонфигурация;
    expect(plain.dimension_weights).toBeUndefined();
    expect(plain.custom_dimensions).toBeUndefined();
  });

  it("keeps the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-family presets on the heuristic classifier", () => {
    for (const key of ["anthropic_family", "gemini_family", "openai_family"]) {
      expect(getPresetByКлюч(key)!.complexity_router_config.classifier_type).toBe("heuristic");
    }
  });

  // The lite preset ships the LLM classifier with the bundled agentic rubric rather than an inline
  // system_prompt, so rubric tuning in the backend reaches it withвыход a JSON edit. Its classifier
  // Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию doubles as the SIMPLE tier Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, so availability gating stays at exactly four Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs.
  it("pins the lite preset's LLM classifier config and required Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    const lite = getPresetByКлюч("lite")!;
    const config = lite.complexity_router_config;
    expect(config.classifier_type).toBe("llm");
    expect(config.classifier_llm_config).toEqual({
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "deepseek-v4-flash",
      timeout_ms: 3000,
      classification_rubric: "agentic",
    });
    expect(config.classifier_context_window_size).toBe(0);
    expect(config.classifier_context_per_turn_chars).toBeUndefined();
    expect(getRequiredModelsInPreset(lite)).toEqual(
      new Set(["deepseek-v4-flash", "muse-spark-1.2", "kimi-k3", "claude-opus-5"]),
    );
  });

  it("pins the anthropic preset's reasoning tier to Fable 5.1 at high thinking", () => {
    const config = getPresetByКлюч("anthropic_family")!.complexity_router_config;
    expect(config.tiers.COMPLEX).toEqual(["claude-opus-5"]);
    expect(config.tiers.REASONING).toEqual(["claude-fable-5-1"]);
    expect(config.tier_model_configs).toEqual({
      REASONING: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "claude-fable-5-1", litellm_params: { reasoning_effort: "high" } }],
    });
  });

  // Kimi K3 at max needs the map to declare max for kimi-k3, which is the commit below this one.
  it("pins the lite preset's per-tier reasoning efforts", () => {
    expect(getPresetByКлюч("lite")!.complexity_router_config.tier_model_configs).toEqual({
      MEDIUM: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "muse-spark-1.2", litellm_params: { reasoning_effort: "xhigh" } }],
      COMPLEX: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "kimi-k3", litellm_params: { reasoning_effort: "max" } }],
    });
  });

  // serializeTierModelConfigs filters on the tier's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs, so a stray name drops silently.
  it("never names a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию in tier_model_configs that its own tier does not hold", () => {
    for (const preset of getAllPresets()) {
      const { tiers, tier_model_configs: configs } = preset.complexity_router_config;
      for (const [tier, entries] of Object.entries(configs ?? {})) {
        for (const entry of entries) {
          expect(tiers[tier as keyof typeof tiers] ?? [], `${preset.key}.${tier}`).toContain(entry.model_name);
        }
      }
    }
  });

  it("carries a preset's modality_routing into the prefilled form state", () => {
    const preset = getPresetByКлюч("anthropic_family")!;
    const withFlag = { ...preset.complexity_router_config, modality_routing: true };
    const prefill = buildPresetPrefill(withFlag, groupsOnly(getRequiredModelsInPreset(preset)));
    expect(prefill.complexityRouterConfig.modality_routing).toBe(true);
    const withoutFlag = buildPresetPrefill(
      preset.complexity_router_config,
      groupsOnly(getRequiredModelsInPreset(preset)),
    );
    expect(withoutFlag.complexityRouterConfig.modality_routing).toBe(false);
  });

  it("carries a preset's modality_pin_override into the prefilled form state", () => {
    const preset = getPresetByКлюч("anthropic_family")!;
    const withFlag = { ...preset.complexity_router_config, modality_routing: true, modality_pin_override: true };
    const prefill = buildPresetPrefill(withFlag, groupsOnly(getRequiredModelsInPreset(preset)));
    expect(prefill.complexityRouterКонфигурация.modality_pin_override).toBe(true);
    const withoutFlag = buildPresetPrefill(
      preset.complexity_router_config,
      groupsOnly(getRequiredModelsInPreset(preset)),
    );
    expect(withoutFlag.complexityRouterКонфигурация.modality_pin_override).toBe(false);
  });

  it("ships every bundled preset with both modality flags written выход, since the payload type requires them", () => {
    for (const preset of getAllPresets()) {
      expect(preset.complexity_router_config.modality_routing, preset.key).toBe(false);
      expect(preset.complexity_router_config.modality_pin_override, preset.key).toBe(false);
    }
  });

  it("prefills the anthropic preset's effort through to tier_model_params", () => {
    const preset = getPresetByКлюч("anthropic_family")!;
    const prefill = buildPresetPrefill(preset.complexity_router_config, groupsOnly(getRequiredModelsInPreset(preset)));
    expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
      REASONING: { "claude-fable-5-1": { reasoning_effort: "high" } },
    });
  });

  it("prefills the lite preset's efforts through to tier_model_params", () => {
    const lite = getPresetByКлюч("lite")!;
    const prefill = buildPresetPrefill(lite.complexity_router_config, groupsOnly(getRequiredModelsInPreset(lite)));
    expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
      MEDIUM: { "muse-spark-1.2": { reasoning_effort: "xhigh" } },
      COMPLEX: { "kimi-k3": { reasoning_effort: "max" } },
    });
  });

  it("pins the OpenAI preset to the Luna, Terra, Sol, and Astra progression", () => {
    const preset = getPresetByКлюч("openai_family")!;
    const expectedTiers = {
      SIMPLE: ["gpt-5.6-luna"],
      MEDIUM: ["gpt-5.6-terra"],
      COMPLEX: ["gpt-5.6-sol"],
      REASONING: ["gpt-6-astra"],
    };
    expect(preset.complexity_router_config.tiers).toEqual(expectedTiers);
    expect(preset.complexity_router_config.tier_model_configs).toEqual({
      REASONING: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "gpt-6-astra", litellm_params: { reasoning_effort: "xhigh" } }],
    });
    const prefill = buildPresetPrefill(preset.complexity_router_config, groupsOnly(getRequiredModelsInPreset(preset)));
    expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
      REASONING: { "gpt-6-astra": { reasoning_effort: "xhigh" } },
    });
  });

  it("pins the 1M context preset to Luna, Terra, Sol, and Opus at high thinking", () => {
    const preset = getPresetByКлюч("1m_context")!;
    const expectedTiers = {
      SIMPLE: ["gpt-5.6-luna"],
      MEDIUM: ["gpt-5.6-terra"],
      COMPLEX: ["gpt-5.6-sol"],
      REASONING: ["claude-opus-5"],
    };
    expect(preset.complexity_router_config.classifier_type).toBe("heuristic_v2");
    expect(preset.complexity_router_config.tiers).toEqual(expectedTiers);
    expect(preset.complexity_router_config.tier_model_configs).toEqual({
      REASONING: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "claude-opus-5", litellm_params: { reasoning_effort: "high" } }],
    });
    const prefill = buildPresetPrefill(preset.complexity_router_config, groupsOnly(getRequiredModelsInPreset(preset)));
    expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
      REASONING: { "claude-opus-5": { reasoning_effort: "high" } },
    });
  });

  it("pins the gemini preset to concrete Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию ids, never Google's hot-swapping -latest aliases", () => {
    const gemini = getPresetByКлюч("gemini_family")!;
    const config = gemini.complexity_router_config;
    expect(config.classifier_type).toBe("heuristic");
    expect(config.classifier_llm_config).toBeUndefined();
    const expectedTiers = {
      SIMPLE: ["gemini-2.5-flash-lite"],
      MEDIUM: ["gemini-3.1-flash-lite"],
      COMPLEX: ["gemini-3.7-flash"],
      REASONING: ["gemini-3.1-pro-preview"],
    };
    expect(config.tiers).toEqual(expectedTiers);
    const required = getRequiredModelsInPreset(gemini);
    for (const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию of required) expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).not.toMatch(/-latest$/);
    expect(required.size).toBe(4);
  });

  it("collects every tier Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as a required Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
    const preset = getPresetByКлюч("anthropic_family")!;
    const required = getRequiredModelsInPreset(preset);
    const tierModels = Object.values(preset.complexity_router_config.tiers).flat();
    expect(tierModels.length).toBeGreaterThan(0);
    for (const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию of tierModels) expect(required.has(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию)).toBe(true);
  });

  it("reports only the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs the caller is missing, and none when the family is fully available", () => {
    const preset = getPresetByКлюч("openai_family")!;
    const required = [...getRequiredModelsInPreset(preset)];
    const [held] = required;

    expect(getMissingModelsInPreset(preset, groupsOnly([held]))).toEqual(required.filter((m) => m !== held).sort());
    expect(getMissingModelsInPreset(preset, groupsOnly(required))).toEqual([]);
  });

  // Admins spell version numbers with either "-" or "." (claude-sonnet-4-5 vs claude-sonnet-4.5);
  // a caller who only registered one form still satisfies a preset that names the other. The
  // caller's spellings are derived from the preset itself so that renaming a preset's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs in
  // autorouter_presets.json can't quietly turn this into a no-op (the inequality below fails
  // instead, if no preset Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию carries a version number at all).
  it("treats a preset's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as available under either version-separator spelling", () => {
    const preset = getPresetByКлюч("anthropic_family")!;
    const required = [...getRequiredModelsInPreset(preset)];
    const dottedSpellings = required.map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию.replace(/(\d)-(\d)/g, "$1.$2"));

    expect(dottedSpellings).not.toEqual(required);
    expect(getMissingModelsInPreset(preset, groupsOnly(dottedSpellings))).toEqual([]);
  });

  // The two-arm mirror: a differently-punctuated preset Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию must not be reported missing.
  it("does not flag a differently-punctuated Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as missing via getMissingModels directly", () => {
    const missing = getMissingModels(
      { tiers: { SIMPLE: ["claude-sonnet-4-5"], MEDIUM: [], COMPLEX: [], REASONING: [] } },
      groupsOnly(["claude-sonnet-4.5"]),
    );
    expect(missing).toEqual([]);
  });

  // A classifier_llm_config placeholder is seeded with Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "" before a caller picks one; an
  // empty string is not a real Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию reference and must not be reported as an unavailable Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию.
  it("does not treat an empty-string classifier or embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as a required Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
    const required = getRequiredModels({
      tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] },
      classifier_llm_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "", timeout_ms: 5000 },
      embedding_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "",
    });
    expect(required).toEqual(new Set(["gpt-5-nano"]));
  });

  describe("deployment matching (underlying provider Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию IDs)", () => {
    const availabilityFor = (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: string, underlyingModel: string) =>
      buildModelAvailability([Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup], [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup, underlyingModels: [underlyingModel] }]);

    it.each([
      ["provider prefix", "my-claude-fast", "anthropic/claude-haiku-4-5", "claude-haiku-4-5"],
      ["bedrock region+namespace+revision", "bedrock-opus", "bedrock/us.anthropic.claude-opus-5-v1:0", "claude-opus-5"],
      ["bedrock date stamp", "bedrock-opus41", "bedrock/us.anthropic.claude-opus-4-1-20250805-v1:0", "claude-opus-4-1"],
      ["dotted version", "team-gpt", "openai/gpt-5.4", "gpt-5.4"],
      ["vertex @tag", "vertex-frontier", "vertex_ai/claude-fable-5@default", "claude-fable-5"],
      ["bedrock 1m context label", "opus-1m", "bedrock/us.anthropic.claude-opus-5-v1:0[1m]", "claude-opus-5"],
    ])("resolves a %s deployment and prefills the admin's group name", (_label, group, underlying, presetModel) => {
      const availability = availabilityFor(group, underlying);
      const config = {
        tiers: { SIMPLE: [presetModel], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      expect(getMissingModels(config, availability)).toEqual([]);
      expect(buildPresetPrefill(config, availability).complexityRouterКонфигурация.tiers.SIMPLE).toEqual([group]);
    });

    it.each([
      ["gpt-5.4", "openai/gpt-5.4-mini"],
      ["gpt-5.4-mini", "openai/gpt-5.4"],
      ["o3", "openai/o3-mini"],
      ["o3-mini", "openai/o3"],
      ["some-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", "prov/some-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-20991399"],
    ])("never lets %s be satisfied by a deployment of %s", (presetModel, underlying) => {
      const availability = availabilityFor("some-group", underlying);
      const config = { tiers: { SIMPLE: [presetModel], MEDIUM: [], COMPLEX: [], REASONING: [] } };
      expect(getMissingModels(config, availability)).toEqual([presetModel]);
    });

    it("never indexes a wildcard deployment", () => {
      const availability = availabilityFor("openai-wild", "openai/*");
      expect(availability.underlyingIndex.size).toBe(0);
    });

    it("ignores a deployment whose group is not itself an available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group", () => {
      const availability = buildModelAvailability(
        ["some-other-group"],
        [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "orphan-group", underlyingModels: ["anthropic/claude-opus-5"] }],
      );
      expect(availability.underlyingIndex.size).toBe(0);
    });

    it("returns every configured group serving the same underlying Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
      const availability = buildModelAvailability(
        ["z-group", "a-group"],
        [
          { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "z-group", underlyingModels: ["anthropic/claude-sonnet-5"] },
          { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "a-group", underlyingModels: ["bedrock/us.anthropic.claude-sonnet-5-v1:0"] },
        ],
      );

      expect(resolveAvailableModels("anthropic/claude-sonnet-5", availability)).toEqual(["a-group", "z-group"]);
    });

    it("breaks ties between groups serving the same Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию deterministically, alphabetically", () => {
      const availability = buildModelAvailability(
        ["z-group", "a-group"],
        [
          { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "z-group", underlyingModels: ["anthropic/claude-opus-5"] },
          { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "a-group", underlyingModels: ["bedrock/us.anthropic.claude-opus-5-v1:0"] },
        ],
      );
      const config = {
        tiers: { SIMPLE: ["claude-opus-5"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      expect(buildPresetPrefill(config, availability).complexityRouterКонфигурация.tiers.SIMPLE).toEqual(["a-group"]);
    });

    it("prefers an exact group-name match over the deployment index", () => {
      const availability = buildModelAvailability(
        ["claude-opus-5", "renamed-opus"],
        [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "renamed-opus", underlyingModels: ["anthropic/claude-opus-5"] }],
      );
      const config = {
        tiers: { SIMPLE: ["claude-opus-5"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      expect(buildPresetPrefill(config, availability).complexityRouterКонфигурация.tiers.SIMPLE).toEqual(["claude-opus-5"]);
    });

    it.each(getAllPresets().map((preset) => [preset.key, preset] as const))(
      "fully resolves the %s preset through renamed deployments only",
      (_key, preset) => {
        const required = [...getRequiredModelsInPreset(preset)];
        const groups = required.map((_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, index) => `renamed-${index}`);
        const availability = buildModelAvailability(
          groups,
          required.map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, index) => ({
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: `renamed-${index}`,
            underlyingModels: [`someprovider/${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию}`],
          })),
        );
        expect(getMissingModelsInPreset(preset, availability)).toEqual([]);
        const prefilled = buildPresetPrefill(preset.complexity_router_config, availability);
        const prefilledModels = Object.values(prefilled.complexityRouterКонфигурация.tiers).flat();
        expect(prefilledModels.length).toBeGreaterThan(0);
        for (const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию of prefilledModels) expect(groups).toContain(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию);
      },
    );
  });

  describe("wildcard deployment matching (expanded Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию groups)", () => {
    const wildcardDeployment = (pattern: string) => ({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: pattern, underlyingModels: [pattern] });

    const simpleУровеньКонфигурация = (presetModel: string) => ({
      tiers: { SIMPLE: [presetModel], MEDIUM: [], COMPLEX: [], REASONING: [] },
      classifier_type: "heuristic" as const,
      classification_mode: "every_request" as const,
      session_affinity: false,
      deployment_affinity: true,
    });

    it("resolves a preset Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию to a group expanded from a wildcard deployment", () => {
      const availability = buildModelAvailability(
        ["anthropic/*", "anthropic/claude-opus-5", "bedrock/anthropic.claude-opus-5"],
        [wildcardDeployment("anthropic/*")],
      );
      const config = simpleУровеньКонфигурация("claude-opus-5");
      expect(getMissingModels(config, availability)).toEqual([]);
      expect(buildPresetPrefill(config, availability).complexityRouterКонфигурация.tiers.SIMPLE).toEqual([
        "anthropic/claude-opus-5",
      ]);
    });

    it("normalizes an expanded group's namespaced own name the same way as a deployment's", () => {
      const availability = buildModelAvailability(
        ["bedrock/*", "bedrock/us.anthropic.claude-sonnet-5"],
        [wildcardDeployment("bedrock/*")],
      );
      expect(getMissingModels(simpleУровеньКонфигурация("claude-sonnet-5"), availability)).toEqual([]);
    });

    it("anchors a partial wildcard pattern and treats its dots literally", () => {
      const availability = buildModelAvailability(
        ["bedrock/us.anthropic.claude-opus-5", "bedrock/usXanthropic.claude-fable-5"],
        [wildcardDeployment("bedrock/us.*")],
      );
      expect(getMissingModels(simpleУровеньКонфигурация("claude-opus-5"), availability)).toEqual([]);
      expect(getMissingModels(simpleУровеньКонфигурация("claude-fable-5"), availability)).toEqual(["claude-fable-5"]);
    });

    it.each([
      ["gpt-5.4", "openai/gpt-5.4-mini"],
      ["gpt-5.4-mini", "openai/gpt-5.4"],
      ["o3", "openai/o3-mini"],
    ])("never lets %s be satisfied by the expanded group %s", (presetModel, expandedGroup) => {
      const availability = buildModelAvailability(["openai/*", expandedGroup], [wildcardDeployment("openai/*")]);
      expect(getMissingModels(simpleУровеньКонфигурация(presetModel), availability)).toEqual([presetModel]);
    });

    it("anchors the pattern's suffix and keeps middle segments in order", () => {
      const availability = buildModelAvailability(
        ["bedrock/us.anthropic.claude-opus-5", "bedrock/anthropic.us.claude-sonnet-5"],
        [wildcardDeployment("bedrock/*.anthropic.*")],
      );
      expect(getMissingModels(simpleУровеньКонфигурация("claude-opus-5"), availability)).toEqual([]);
      expect(getMissingModels(simpleУровеньКонфигурация("claude-sonnet-5"), availability)).toEqual(["claude-sonnet-5"]);
    });

    it("matches a pathological many-star pattern in linear time instead of backtracking", () => {
      const hostile = `prov/a*${"a*".repeat(30)}b`;
      const nonMatching = `prov/${"a".repeat(120)}`;
      const availability = buildModelAvailability([nonMatching], [wildcardDeployment(hostile)]);
      expect(availability.underlyingIndex.size).toBe(0);
    });

    it("expands a bare-star Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name through its underlying wildcard, not as match-all", () => {
      const availability = buildModelAvailability(
        ["openai/gpt-5.4", "team-a/claude-opus-5"],
        [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "*", underlyingModels: ["openai/*"] }],
      );
      expect(getMissingModels(simpleУровеньКонфигурация("gpt-5.4"), availability)).toEqual([]);
      expect(getMissingModels(simpleУровеньКонфигурация("claude-opus-5"), availability)).toEqual(["claude-opus-5"]);
    });

    it.each([
      ["a bare-star underlying", "*"],
      ["a non-wildcard underlying", "openai/gpt-4o"],
      ["a slashless wildcard underlying", "gpt*"],
    ])("derives no pattern from a bare-star Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name with %s", (_label, underlying) => {
      const availability = buildModelAvailability(
        ["openai/gpt-5.4"],
        [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "*", underlyingModels: [underlying] }],
      );
      expect(availability.underlyingIndex.size).toBe(0);
    });

    it("derives no pattern from a slashless wildcard Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name", () => {
      const availability = buildModelAvailability(["gpt-5.4"], [wildcardDeployment("gpt*")]);
      expect(availability.underlyingIndex.size).toBe(0);
    });

    it("does not trust a group's name when no wildcard deployment covers it", () => {
      const availability = buildModelAvailability(
        ["team-a/claude-opus-5", "openai/*"],
        [wildcardDeployment("openai/*")],
      );
      expect(getMissingModels(simpleУровеньКонфигурация("claude-opus-5"), availability)).toEqual(["claude-opus-5"]);
    });

    it("never resolves to the wildcard group itself when the hub lists no expansions", () => {
      const availability = buildModelAvailability(["openai/*"], [wildcardDeployment("openai/*")]);
      expect(getMissingModels(simpleУровеньКонфигурация("gpt-5.4"), availability)).toEqual(["gpt-5.4"]);
      expect(availability.underlyingIndex.size).toBe(0);
    });

    it("applies a wildcard deployment's pattern even when the wildcard group is not itself listed", () => {
      const availability = buildModelAvailability(["anthropic/claude-opus-5"], [wildcardDeployment("anthropic/*")]);
      expect(getMissingModels(simpleУровеньКонфигурация("claude-opus-5"), availability)).toEqual([]);
    });

    it("keeps the groups-only availability strict even when expanded groups are listed", () => {
      const availability = groupsOnly(["anthropic/*", "anthropic/claude-opus-5"]);
      expect(getMissingModels(simpleУровеньКонфигурация("claude-opus-5"), availability)).toEqual(["claude-opus-5"]);
    });

    it("prefers the alphabetically first covered group when several expansions serve the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
      const availability = buildModelAvailability(
        ["bedrock/us.anthropic.claude-opus-5", "anthropic/claude-opus-5", "bedrock/anthropic.claude-opus-5"],
        [wildcardDeployment("anthropic/*"), wildcardDeployment("bedrock/*")],
      );
      const config = simpleУровеньКонфигурация("claude-opus-5");
      expect(buildPresetPrefill(config, availability).complexityRouterКонфигурация.tiers.SIMPLE).toEqual([
        "anthropic/claude-opus-5",
      ]);
    });

    it.each(getAllPresets().map((preset) => [preset.key, preset] as const))(
      "fully resolves the %s preset through wildcard-expanded groups only",
      (_key, preset) => {
        const required = [...getRequiredModelsInPreset(preset)];
        const expandedGroups = required.map((Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => `someprovider/${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию}`);
        const availability = buildModelAvailability(
          ["someprovider/*", ...expandedGroups],
          [wildcardDeployment("someprovider/*")],
        );
        expect(getMissingModelsInPreset(preset, availability)).toEqual([]);
        const prefilled = buildPresetPrefill(preset.complexity_router_config, availability);
        const prefilledModels = Object.values(prefilled.complexityRouterКонфигурация.tiers).flat();
        expect(prefilledModels.length).toBeGreaterThan(0);
        for (const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию of prefilledModels) expect(expandedGroups).toContain(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию);
      },
    );
  });

  describe("deploymentRefsFromModelInfo", () => {
    it("keeps litellm_params.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info.base_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, drops rows with neither or no name", () => {
      const refs = deploymentRefsFromModelInfo([
        {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "azure-prod",
          litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/my-deployment" },
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { base_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/gpt-5.4" },
        },
        { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "no-underlying", litellm_params: {}, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {} },
        { litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-5.4" } },
      ]);
      expect(refs).toEqual([{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюGroup: "azure-prod", underlyingModels: ["azure/my-deployment", "azure/gpt-5.4"] }]);
    });

    it("lets an azure deployment resolve through base_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию declared under litellm_params", () => {
      const availability = buildModelAvailability(
        ["azure-lp"],
        deploymentRefsFromModelInfo([
          {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "azure-lp",
            litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/opaque-deployment-name", base_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/gpt-5.4" },
          },
        ]),
      );
      const config = { tiers: { SIMPLE: ["gpt-5.4"], MEDIUM: [], COMPLEX: [], REASONING: [] } };
      expect(getMissingModels(config, availability)).toEqual([]);
    });

    it("lets an azure deployment resolve through its admin-declared base_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
      const availability = buildModelAvailability(
        ["azure-prod"],
        deploymentRefsFromModelInfo([
          {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "azure-prod",
            litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/opaque-deployment-name" },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { base_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/gpt-5.4" },
          },
        ]),
      );
      const config = { tiers: { SIMPLE: ["gpt-5.4"], MEDIUM: [], COMPLEX: [], REASONING: [] } };
      expect(getMissingModels(config, availability)).toEqual([]);
    });
  });

  describe("getReferencedModelsОшибка", () => {
    const tiers = { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] };
    const available = groupsOnly(["gpt-5-nano"]);
    // Both fields are always populated with a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию missing from `available`; only the
    // enabled/disabled toggles below decide whether that missing Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию gets reported.
    const params = {
      classifierLlmКонфигурация: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "missing-classifier", timeout_ms: 5000 },
      embeddingModel: "missing-embed",
    };

    // Bugbot-found bug class from #35199's history: a classifier/embedding Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию left selected
    // from a prior toggle must not block submit once that toggle is off again, since
    // buildComplexityRouterКонфигурация never emits the field in that state - only a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию whose toggle
    // is on should ever be reported.
    it.each([
      ["both toggles off", "heuristic", false, null],
      ["classifier type llm, semantic matching off", "llm", false, "missing-classifier"],
      ["classifier type heuristic, semantic matching on", "heuristic", true, "missing-embed"],
      ["both toggles on", "llm", true, "missing-classifier, missing-embed"],
    ] as const)("%s", (_label, classifierType, semanticMatchingEnabled, missingModels) => {
      const config = { tiers, classifierType, semanticMatchingEnabled, ...params };
      const error = getReferencedModelsОшибка(config, available);
      expect(error).toBe(missingModels ? `Режимl(s) no longer available: ${missingModels}` : null);
    });
  });

  describe("buildEmptyPrefill", () => {
    it("resets every field to its default, empty state", () => {
      const expected = {
        complexityRouterКонфигурация: {
          tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: [] },
          classifier_type: "heuristic",
        },
        customTechnicalКлючевые слова: [],
        keywordTierRules: [],
        semanticMatchingEnabled: false,
        embeddingModel: undefined,
        matchThreshold: DEFAULT_MATCH_THRESHOLD,
        escalationКлючевые слова: DEFAULT_ESCALATION_KEYWORDS,
      };
      expect(buildEmptyPrefill()).toEqual(expected);
    });
  });

  describe("buildPresetPrefill", () => {
    it("preserves JEV settings and drops inactive classifier settings when prefilling", () => {
      const config = {
        tiers: { SIMPLE: ["fast"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "jev" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
        modality_routing: false,
        modality_pin_override: false,
        jev_classifier_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "jev-test", timeout_ms: 4000, circuit_breaker_enabled: false },
        classifier_llm_config: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "stale-judge", timeout_ms: 6000 },
        classifier_context_window_size: 6,
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["fast"]));
      const expectedJevКонфигурация = {
        classifier_type: "jev",
        jev_classifier_config: config.jev_classifier_config,
        classifier_context_window_size: 6,
        classifier_llm_config: undefined,
      };
      expect(prefill.complexityRouterКонфигурация).toMatchObject(expectedJevКонфигурация);
      const llmКонфигурация = { ...config, classifier_type: "llm" as const };
      const llmPrefill = buildPresetPrefill(llmКонфигурация, groupsOnly(["fast"]));
      expect(llmPrefill.complexityRouterКонфигурация.jev_classifier_config).toBeUndefined();
      expect(llmPrefill.complexityRouterКонфигурация.classifier_llm_config).toEqual(config.classifier_llm_config);
    });

    it("prefills a real bundled preset's tiers into the config", () => {
      const preset = getPresetByКлюч("anthropic_family")!;
      const prefill = buildPresetPrefill(
        preset.complexity_router_config,
        groupsOnly(getRequiredModelsInPreset(preset)),
      );
      expect(prefill.complexityRouterКонфигурация.tiers).toEqual(preset.complexity_router_config.tiers);
    });

    // `??`, not `||`: match_threshold: 0 and an empty escalation_keywords array are deliberate,
    // falsy preset values. A prefill that used `||` would silently replace both with the default,
    // which is exactly the kind of bug this test would have caught before either bundled preset
    // happened to avoid the case.
    it("keeps a preset's falsy match_threshold and escalation_keywords instead of defaulting them", () => {
      const config = {
        tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
        match_threshold: 0,
        escalation_keywords: [],
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["gpt-5-nano"]));
      expect(prefill.matchThreshold).toBe(0);
      expect(prefill.escalationКлючевые слова).toEqual([]);
    });

    it("carries a preset's context-window escalation opt-выход and buffer through the prefill", () => {
      const prefill = buildPresetPrefill(
        {
          tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] },
          classifier_type: "heuristic",
          classification_mode: "every_request",
          session_affinity: false,
          deployment_affinity: true,
          enable_context_window_escalation: false,
          context_window_escalation_buffer: 0.9,
        },
        groupsOnly(["gpt-5-nano"]),
      );
      expect(prefill.complexityRouterКонфигурация.enable_context_window_escalation).toBe(false);
      expect(prefill.complexityRouterКонфигурация.context_window_escalation_buffer).toBe(0.9);
    });

    it("carries a preset's classification_mode and defaults it when the preset omits one", () => {
      const tiers = { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] };
      const base = {
        tiers,
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const availability = groupsOnly(["gpt-5-nano"]);
      expect(
        buildPresetPrefill({ ...base, classification_mode: "user_turn" }, availability).complexityRouterКонфигурация
          .classification_mode,
      ).toBe("user_turn");
      expect(buildPresetPrefill(base, availability).complexityRouterКонфигурация.classification_mode).toBe("every_request");
    });

    it("falls back to the defaults when a preset omits match_threshold and escalation_keywords", () => {
      const prefill = buildPresetPrefill(
        {
          tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] },
          classifier_type: "heuristic",
          classification_mode: "every_request" as const,
          session_affinity: false,
          deployment_affinity: true,
        },
        groupsOnly(["gpt-5-nano"]),
      );
      expect(prefill.matchThreshold).toBe(DEFAULT_MATCH_THRESHOLD);
      expect(prefill.escalationКлючевые слова).toEqual(DEFAULT_ESCALATION_KEYWORDS);
    });

    // The whole point of the separator normalization: a caller whose proxy only registered the
    // dotted form of a version number still gets that Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию written into the tier, not the
    // preset's own hyphenated spelling (which the caller never actually registered).
    it("prefills a preset's tier_labels and leaves them undefined when the preset has none", () => {
      const base = {
        tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const labeled = buildPresetPrefill(
        { ...base, tier_labels: { SIMPLE: "Cheap", REASONING: "Deep" } },
        groupsOnly(["gpt-5-nano"]),
      );
      expect(labeled.complexityRouterКонфигурация.tier_labels).toEqual({ SIMPLE: "Cheap", REASONING: "Deep" });
      expect(buildPresetPrefill(base, groupsOnly(["gpt-5-nano"])).complexityRouterКонфигурация.tier_labels).toBeUndefined();
    });

    it("rewrites a preset's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name to the caller's differently-punctuated registered spelling", () => {
      const config = {
        tiers: { SIMPLE: ["claude-sonnet-4-5"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["claude-sonnet-4.5"]));
      expect(prefill.complexityRouterКонфигурация.tiers.SIMPLE).toEqual(["claude-sonnet-4.5"]);
    });

    it("prefills the per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию litellm_params a preset carries in tier_model_configs", () => {
      const config = {
        tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: ["o3"] },
        tier_model_configs: {
          REASONING: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "o3", litellm_params: { reasoning_effort: "high" } }],
        },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["gpt-5-nano", "o3"]));
      expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
        REASONING: { o3: { reasoning_effort: "high" } },
      });
    });

    // The params key on the preset's own spelling while the tier entry gets rewritten to the
    // caller's. Leaving the key alone names a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию the tier no longer holds, and
    // serializeTierModelConfigs then drops the params on submit withвыход saying so.
    it("rewrites a param key to the same registered spelling its tier entry was rewritten to", () => {
      const config = {
        tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: ["claude-sonnet-4-5"] },
        tier_model_configs: {
          REASONING: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "claude-sonnet-4-5", litellm_params: { reasoning_effort: "high" } }],
        },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["claude-sonnet-4.5"]));
      expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
        REASONING: { "claude-sonnet-4.5": { reasoning_effort: "high" } },
      });
    });

    // Two spellings of one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию in a tier collapse to a single registered key, and one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию can
    // only hold one param set downstream. Merging keeps whatever only one spelling set instead of
    // dropping that spelling's params wholesale.
    it("merges rather than drops params when two spellings resolve to the same registered Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
      const config = {
        tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: ["claude-sonnet-4-5", "claude-sonnet-4.5"] },
        tier_model_configs: {
          REASONING: [
            { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "claude-sonnet-4-5", litellm_params: { reasoning_effort: "high", temperature: 0.2 } },
            { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "claude-sonnet-4.5", litellm_params: { reasoning_effort: "low" } },
          ],
        },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["claude-sonnet-4.5"]));
      // temperature survives from the spelling that would otherwise have been overwritten;
      // reasoning_effort, set by both, resolves last-wins.
      expect(prefill.complexityRouterКонфигурация.tier_model_params).toEqual({
        REASONING: { "claude-sonnet-4.5": { reasoning_effort: "low", temperature: 0.2 } },
      });
    });

    it("leaves tier_model_params undefined for a preset that carries no per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию params", () => {
      const config = {
        tiers: { SIMPLE: ["gpt-5-nano"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        classifier_type: "heuristic" as const,
        classification_mode: "every_request" as const,
        session_affinity: false,
        deployment_affinity: true,
      };
      const prefill = buildPresetPrefill(config, groupsOnly(["gpt-5-nano"]));
      expect(prefill.complexityRouterКонфигурация.tier_model_params).toBeUndefined();
    });
  });
});
