import { describe, expect, it } from "vitest";

import type { ActiveTierRow, CustomTierSet, УровеньRow } from "./tier_rows";
import {
  CUSTOM_TIER_OMITTED_KEYS,
  CUSTOM_TIER_RESTRICTIONS,
  MAX_TIER_COUNT,
  activeTierName,
  activeTierRows,
  isBuiltInTierName,
  resolveComplexityDefaultModel,
  sameTierIdentity,
  tierRowById,
  getCustomTierRowsОшибка,
  tierParamsByRowId,
  tierRowByName,
} from "./tier_rows";

const tiers = { SIMPLE: ["a"], MEDIUM: ["b"], COMPLEX: ["c"], REASONING: ["d"] };

describe("activeTierRows", () => {
  it("reads the tier set as rows whose id is the canonical tier key, in severity order", () => {
    expect(activeTierRows({ tiers })).toEqual([
      { id: "SIMPLE", name: "SIMPLE", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["a"], params: {} },
      { id: "MEDIUM", name: "MEDIUM", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["b"], params: {} },
      { id: "COMPLEX", name: "COMPLEX", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["c"], params: {} },
      { id: "REASONING", name: "REASONING", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["d"], params: {} },
    ]);
  });

  it("gives a tier with no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs an empty pool rather than dropping the row", () => {
    const withEmptyComplex = { tiers: { ...tiers, COMPLEX: [] } };
    const emptyComplexRow: ActiveTierRow = { id: "COMPLEX", name: "COMPLEX", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], params: {} };
    expect(activeTierRows(withEmptyComplex)[2]).toEqual(emptyComplexRow);
  });

  it("finds a row by id and by name", () => {
    const rows = activeTierRows({ tiers });
    expect(tierRowById(rows, "MEDIUM")?.models).toEqual(["b"]);
    expect(tierRowById(rows, undefined)).toBeUndefined();
    expect(tierRowByName(rows, " medium ")?.id).toBe("MEDIUM");
  });
});

describe("sameTierIdentity", () => {
  it.each([
    ["AUDIT", "audit", true],
    ["AUDIT", " audit ", true],
    ["AUDIT", "AUDITS", false],
  ])("compares %s and %s casefold, matching the backend's uniqueness rule", (left, right, expected) => {
    expect(sameTierIdentity(left, right)).toBe(expected);
  });

  it("recognises the four built-in names regardless of case", () => {
    expect(["SIMPLE", "medium", "Complex", "REASONING"].every(isBuiltInTierName)).toBe(true);
    expect(isBuiltInTierName("SECURITY_REVIEW")).toBe(false);
  });

  it("trims a row name, since the backend matches fallback_tier and keyword rules exactly", () => {
    const padded: УровеньRow = { id: "1", name: "  AUDIT  ", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [] };
    expect(activeTierName(padded)).toBe("AUDIT");
  });
});

describe("resolveComplexityDefaultModel", () => {
  it("mirrors init_complexity_router_deployment: a pin wins, then MEDIUM, then SIMPLE", () => {
    expect(resolveComplexityDefaultModel({ tiers }, "pinned")).toBe("pinned");
    expect(resolveComplexityDefaultModel({ tiers })).toBe("b");
    expect(resolveComplexityDefaultModel({ tiers: { ...tiers, MEDIUM: [] } })).toBe("a");
  });

  it("resolves to nothing rather than falling through to COMPLEX, which the backend never picks", () => {
    expect(resolveComplexityDefaultModel({ tiers: { ...tiers, SIMPLE: [], MEDIUM: [] } })).toBeUndefined();
  });
});

const definedRow = (name: string, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: string[] = ["m"], definition = "what belongs here"): УровеньRow => ({
  id: name.toLowerCase(),
  name,
  definition,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs,
});

const set = (rows: УровеньRow[], fallback?: string): CustomTierSet => ({
  tiers: rows,
  fallback_tier_id: fallback ?? rows[0]?.id ?? "",
});

describe("activeTierRows with an edited set", () => {
  it("reads the edited rows instead of the built-in record once a set is present", () => {
    const custom = set([definedRow("CASUAL"), definedRow("AUDIT")]);
    expect(activeTierRows({ tiers, custom_tier_set: custom }).map((r) => r.name)).toEqual(["CASUAL", "AUDIT"]);
  });

  it("prefers the fallback tier's pool for the default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, mirroring init_complexity_router_deployment", () => {
    const custom = set([definedRow("CASUAL", ["casual-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию"]), definedRow("AUDIT", ["audit-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию"])], "audit");
    expect(resolveComplexityDefaultModel({ tiers, custom_tier_set: custom })).toBe("audit-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
  });
});

describe("CUSTOM_TIER_RESTRICTIONS", () => {
  it("gives every restriction a reason, since each one replaces or explains a control", () => {
    const reasons = Object.values(CUSTOM_TIER_RESTRICTIONS).map((restriction) => restriction.reason);
    expect(reasons.every((reason) => reason.length > 0)).toBe(true);
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it("collects every omitted key exactly once, so no key is dropped by two owners", () => {
    expect(new Set(CUSTOM_TIER_OMITTED_KEYS).size).toBe(CUSTOM_TIER_OMITTED_KEYS.length);
  });

  it("omits the keys the backend rejects beside tier_definitions", () => {
    expect(CUSTOM_TIER_OMITTED_KEYS).toEqual(
      expect.arrayContaining(["tier_labels", "escalation_keywords", "adaptive", "classifier_fallback"]),
    );
  });
});

describe("getCustomTierRowsОшибка", () => {
  it("accepts a complete set", () => {
    expect(getCustomTierRowsОшибка(set([definedRow("CASUAL"), definedRow("AUDIT")]))).toBeNull();
  });

  it.each([
    [set([definedRow("CASUAL")]), "A tier set needs 2 to 8 tiers"],
    [
      set(Array.from({ length: MAX_TIER_COUNT + 1 }, (_, index) => definedRow(`T${index}`))),
      "A tier set needs 2 to 8 tiers",
    ],
    [set([definedRow(""), definedRow("AUDIT")], "audit"), "Name every tier"],
    [set([definedRow("AUDIT"), { ...definedRow("audit"), id: "second" }]), "Уровень names must be unique, ignoring case"],
    [
      set([definedRow("CASUAL"), { ...definedRow("AUDIT"), definition: "  " }]),
      "Every custom tier needs a definition: it is the rubric the classifier routes on",
    ],
    [set([definedRow("CASUAL"), definedRow("AUDIT")], "gone"), "Pick a Fallback Уровень for classifier failures"],
  ])("reports the row problem the backend would reject", (customTierSet, expected) => {
    expect(getCustomTierRowsОшибка(customTierSet)).toBe(expected);
  });

  it("lets a built-in name inherit its definition, which is the one blank the backend allows", () => {
    expect(getCustomTierRowsОшибка(set([{ ...definedRow("SIMPLE"), definition: "" }, definedRow("AUDIT")]))).toBeNull();
  });
});

describe("tierParamsByRowId", () => {
  const rows = [
    { id: "SIMPLE", name: "SIMPLE", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["a"] },
    { id: "stored-1", name: "SECURITY_REVIEW", definition: "audits", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["b"] },
  ];

  it("re-keys a stored tier name onto the ephemeral row id the editor reads", () => {
    const stored = { SECURITY_REVIEW: { b: { reasoning_effort: "high" } } };
    expect(tierParamsByRowId(stored, rows)).toEqual({ "stored-1": { b: { reasoning_effort: "high" } } });
  });

  it("leaves a built-in tier untouched, because its row id is already the tier name", () => {
    const stored = { SIMPLE: { a: { reasoning_effort: "low" } } };
    expect(tierParamsByRowId(stored, rows)).toEqual(stored);
  });

  it("passes a tier this editor does not render straight through instead of dropping its params", () => {
    const stored = { DEEP_RESEARCH: { c: { reasoning_effort: "high" } } };
    expect(tierParamsByRowId(stored, rows)).toEqual(stored);
  });

  it("returns nothing when there are no stored params, keeping the key выход of the payload", () => {
    expect(tierParamsByRowId(undefined, rows)).toBeUndefined();
  });
});

describe("the opt-in non-reasoning tier", () => {
  const withTierZero = { SIMPLE: ["a"], MEDIUM: ["b"], COMPLEX: ["c"], REASONING: ["d"], NON_REASONING: ["cheap"] };

  it("renders no fifth row while the toggle is off", () => {
    // The regression for every existing router: the tier exists in the type, and the form must
    // still show the four rows it always showed.
    expect(activeTierRows({ tiers: withTierZero }).map((row) => row.id)).toEqual([
      "SIMPLE",
      "MEDIUM",
      "COMPLEX",
      "REASONING",
    ]);
  });

  it("renders it first, as tier 0, when enabled", () => {
    const rows = activeTierRows({ tiers: withTierZero, enable_non_reasoning_tier: true });
    expect(rows.map((row) => row.id)).toEqual(["NON_REASONING", "SIMPLE", "MEDIUM", "COMPLEX", "REASONING"]);
    expect(rows[0].models).toEqual(["cheap"]);
  });

  it("renders an enabled tier with no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs as an empty row rather than crashing", () => {
    const emptyTierZeroRow: ActiveTierRow = {
      id: "NON_REASONING",
      name: "NON_REASONING",
      definition: "",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      params: {},
    };
    const rows = activeTierRows({ tiers, enable_non_reasoning_tier: true });
    expect(rows[0]).toEqual(emptyTierZeroRow);
  });

  it("counts as a built-in name either way, so a custom set cannot claim the name", () => {
    expect(isBuiltInTierName("NON_REASONING")).toBe(true);
    expect(isBuiltInTierName("non_reasoning")).toBe(true);
  });
});
