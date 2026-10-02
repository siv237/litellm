import { afterEach, describe, expect, it, vi } from "vitest";
import { buildКлючCreatePayload, type КлючCreateВход, type КлючPayloadРезультат } from "./createКлючPayload";

const baseВход: КлючCreateВход = {
  formЗначениеs: {},
  existingКлючи: null,
  keyOwner: "you",
  userID: "test-user",
  selectedAgentId: null,
  loggingSettings: [],
  disabledCallbacks: [],
  autoRotationEnabled: false,
  rotationInterval: "30d",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAliases: {},
  rвыходerSettings: null,
  budgetLimits: [],
  tagRateLimits: [],
  budgetРезервные модели: {},
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМакс.Бюджет: {},
};

const build = (formЗначениеs: Record<string, unknown>, overrides: Partial<КлючCreateВход> = {}): КлючPayloadРезультат =>
  buildКлючCreatePayload({ ...baseВход, ...overrides, formЗначениеs });

const payloadOf = (result: КлючPayloadРезультат): Record<string, unknown> => {
  expect(result.kind).toBe("ok");
  if (result.kind !== "ok") throw new Ошибка("unreachable");
  return result.payload;
};

const wireКлючи = (payload: Record<string, unknown>): string[] =>
  Object.keys(JSON.parse(JSON.stringify(payload)) as Record<string, unknown>);

const DROPPED_AT_SERIALISATION = [
  "access_group_ids",
  "allowed_passthrough_rвыходes",
  "allowed_vector_store_ids",
  "budget_duration",
  "enable_prompt_caching",
  "гардрейловs",
  "max_budget",
  "organization_id",
  "policies",
  "prompts",
  "rpm_limit",
  "tags",
  "throttle_on_budget_exceeded",
  "tpm_limit",
];

const CLOSED_SECTIONS_VALUES = {
  organization_id: undefined,
  team_id: null,
  key_alias: "my-key",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
  key_type: "llm_api",
};

const OPTIONAL_SETTINGS_VALUES = {
  ...CLOSED_SECTIONS_VALUES,
  max_budget: undefined,
  budget_duration: undefined,
  tpm_limit: undefined,
  tpm_limit_type: "key",
  rpm_limit: undefined,
  rpm_limit_type: "key",
  throttle_on_budget_exceeded: undefined,
  enable_prompt_caching: undefined,
  гардрейловs: undefined,
  disable_global_гардрейловs: undefined,
  policies: undefined,
  prompts: undefined,
  access_group_ids: undefined,
  allowed_passthrough_rвыходes: undefined,
  allowed_vector_store_ids: undefined,
  tags: undefined,
};

const aliasOnly = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  key_alias: "my-key",
  user_id: "test-user",
  duration: null,
  metadata: "{}",
  ...overrides,
});

afterEach(() => {
  vi.restoreВсеMocks();
});

describe("always-present keys", () => {
  it("emits the eight keys the closed form sends, and nothing else", () => {
    const closedFormЗначениеs = { ...CLOSED_SECTIONS_VALUES };
    const closedFormPayload = {
      ...closedFormЗначениеs,
      user_id: "test-user",
      duration: null,
      metadata: "{}",
    };
    expect(payloadOf(build(closedFormЗначениеs))).toStrictEqual(closedFormPayload);
  });

  it("injects user_id, duration and metadata even when the form reported none of them", () => {
    expect(payloadOf(build({ key_alias: "my-key" }))).toStrictEqual(aliasOnly());
  });

  it("keeps a mounted-but-untouched field as an undefined-valued key rather than dropping it", () => {
    expect(payloadOf(build({ key_alias: "my-key", гардрейловs: undefined, tags: undefined }))).toStrictEqual(
      aliasOnly({ гардрейловs: undefined, tags: undefined }),
    );
  });
});

describe("duration", () => {
  it("forwards a typed duration by value", () => {
    expect(payloadOf(build({ key_alias: "my-key", duration: "45d" }))).toStrictEqual(aliasOnly({ duration: "45d" }));
  });

  it.each([
    ["an empty string", ""],
    ["a whitespace-only string", "   "],
    ["undefined", undefined],
  ])("coalesces %s to null", (_label, duration) => {
    expect(payloadOf(build({ key_alias: "my-key", duration }))).toStrictEqual(aliasOnly({ duration: null }));
  });

  it("does not coerce a non-string duration", () => {
    expect(() => build({ key_alias: "my-key", duration: 30 })).toThrow(TypeОшибка);
  });
});

describe("key ownership", () => {
  it("overwrites user_id with the signed-in user when the key is owned by you", () => {
    expect(payloadOf(build({ key_alias: "my-key", user_id: "someone-else" }))).toStrictEqual(
      aliasOnly({ user_id: "test-user" }),
    );
  });

  it("leaves the form's user_id alone for another_user", () => {
    const expected = { key_alias: "my-key", user_id: "someone-else", duration: null, metadata: "{}" };
    expect(
      payloadOf(build({ key_alias: "my-key", user_id: "someone-else" }, { keyOwner: "another_user" })),
    ).toStrictEqual(expected);
  });

  it("adds the selected agent id for an agent-owned key", () => {
    const expected = { key_alias: "my-key", agent_id: "agent-1", duration: null, metadata: "{}" };
    expect(payloadOf(build({ key_alias: "my-key" }, { keyOwner: "agent", selectedAgentId: "agent-1" }))).toStrictEqual(
      expected,
    );
  });

  it("reports agent_not_selected instead of building a payload when no agent is selected", () => {
    expect(build({ key_alias: "my-key" }, { keyOwner: "agent", selectedAgentId: null })).toStrictEqual({
      kind: "agent_not_selected",
    });
  });

  it("stamps the alias into metadata as the service account id and sends no user_id", () => {
    expect(payloadOf(build({ key_alias: "svc-key" }, { keyOwner: "service_account" }))).toStrictEqual({
      key_alias: "svc-key",
      duration: null,
      metadata: '{"service_account_id":"svc-key"}',
    });
  });
});

describe("metadata", () => {
  it("re-serialises the parsed form value", () => {
    expect(payloadOf(build({ key_alias: "my-key", metadata: '{"team":"core"}' }))).toStrictEqual(
      aliasOnly({ metadata: '{"team":"core"}' }),
    );
  });

  it("falls back to an empty object and logs when the JSON is malformed", () => {
    const consoleОшибка = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(payloadOf(build({ key_alias: "my-key", metadata: "{not json" }))).toStrictEqual(aliasOnly());
    expect(consoleОшибка).toHaveBeenCalledWith("Ошибка parsing metadata:", expect.any(SyntaxОшибка));
  });

  it("merges logging configs, dropping rows with no callback selected", () => {
    expect(
      payloadOf(
        build(
          { key_alias: "my-key", metadata: '{"team":"core"}' },
          { loggingSettings: [{ callback_name: "langfuse" }, { callback_name: "" }] },
        ),
      ),
    ).toStrictEqual(aliasOnly({ metadata: '{"team":"core","logging":[{"callback_name":"langfuse"}]}' }));
  });

  it("maps disabled callbacks from display names to internal names", () => {
    expect(payloadOf(build({ key_alias: "my-key" }, { disabledCallbacks: ["Langfuse"] }))).toStrictEqual(
      aliasOnly({ metadata: '{"litellm_disabled_callbacks":["langfuse"]}' }),
    );
  });

  it("keeps an array metadata as an array when stamping the service account id", () => {
    expect(
      payloadOf(build({ key_alias: "svc-key", metadata: '["a"]' }, { keyOwner: "service_account" })),
    ).toStrictEqual({ key_alias: "svc-key", duration: null, metadata: '["a"]' });
  });

  it("rejects a service account whose metadata parses to a primitive", () => {
    expect(() => build({ key_alias: "svc-key", metadata: "5" }, { keyOwner: "service_account" })).toThrow(TypeОшибка);
  });

  it("keeps every metadata contributor in one object", () => {
    expect(
      payloadOf(
        build(
          { key_alias: "svc-key", metadata: '{"team":"core"}' },
          {
            keyOwner: "service_account",
            loggingSettings: [{ callback_name: "otel" }],
            disabledCallbacks: ["Datadog"],
          },
        ),
      ),
    ).toStrictEqual({
      key_alias: "svc-key",
      duration: null,
      metadata:
        '{"team":"core","service_account_id":"svc-key","logging":[{"callback_name":"otel"}],"litellm_disabled_callbacks":["datadog"]}',
    });
  });
});

describe("object_permission", () => {
  it("is absent when nothing contributes to it", () => {
    expect(payloadOf(build({ key_alias: "my-key", allowed_vector_store_ids: [] }))).toStrictEqual(
      aliasOnly({ allowed_vector_store_ids: [] }),
    );
  });

  it("moves selected vector stores off the top level", () => {
    expect(payloadOf(build({ key_alias: "my-key", allowed_vector_store_ids: ["vs-1"] }))).toStrictEqual(
      aliasOnly({ object_permission: { vector_stores: ["vs-1"] } }),
    );
  });

  it("splits an MCP selection into servers, access groups and toolsets", () => {
    expect(
      payloadOf(
        build({
          key_alias: "my-key",
          allowed_mcp_servers_and_groups: { servers: ["s-1"], accessGroups: ["g-1"], toolsets: ["t-1"] },
        }),
      ),
    ).toStrictEqual(
      aliasOnly({
        object_permission: { mcp_servers: ["s-1"], mcp_access_groups: ["g-1"], mcp_toolsets: ["t-1"] },
      }),
    );
  });

  it("omits the empty halves of an MCP selection", () => {
    expect(
      payloadOf(
        build({
          key_alias: "my-key",
          allowed_mcp_servers_and_groups: { servers: ["s-1"], accessGroups: [], toolsets: [] },
        }),
      ),
    ).toStrictEqual(aliasOnly({ object_permission: { mcp_servers: ["s-1"] } }));
  });

  it("leaves an all-empty MCP selection on the top level", () => {
    expect(
      payloadOf(
        build({ key_alias: "my-key", allowed_mcp_servers_and_groups: { servers: [], accessGroups: [], toolsets: [] } }),
      ),
    ).toStrictEqual(aliasOnly({ allowed_mcp_servers_and_groups: { servers: [], accessGroups: [], toolsets: [] } }));
  });

  it("nests configured MCP tool permissions", () => {
    expect(payloadOf(build({ key_alias: "my-key", mcp_tool_permissions: { "s-1": ["read"] } }))).toStrictEqual(
      aliasOnly({ object_permission: { mcp_tool_permissions: { "s-1": ["read"] } } }),
    );
  });

  it("always strips mcp_tool_permissions from the top level, even when empty", () => {
    expect(payloadOf(build({ key_alias: "my-key", mcp_tool_permissions: {} }))).toStrictEqual(aliasOnly());
  });

  it("lets a standalone access group list win over the one from the MCP selection", () => {
    expect(
      payloadOf(
        build({
          key_alias: "my-key",
          allowed_mcp_servers_and_groups: { servers: ["s-1"], accessGroups: ["from-selector"] },
          allowed_mcp_access_groups: ["standalone"],
        }),
      ),
    ).toStrictEqual(aliasOnly({ object_permission: { mcp_servers: ["s-1"], mcp_access_groups: ["standalone"] } }));
  });

  it("splits an agent selection into agents and agent access groups", () => {
    expect(
      payloadOf(build({ key_alias: "my-key", allowed_agents_and_groups: { agents: ["a-1"], accessGroups: ["ag-1"] } })),
    ).toStrictEqual(aliasOnly({ object_permission: { agents: ["a-1"], agent_access_groups: ["ag-1"] } }));
  });

  it("moves the selected skills under object_permission and off the top level", () => {
    expect(payloadOf(build({ key_alias: "my-key", allowed_skills: ["private-skill"] }))).toStrictEqual(
      aliasOnly({ object_permission: { skills: ["private-skill"] } }),
    );
  });

  it("sends no object_permission for an empty skill selection", () => {
    expect(payloadOf(build({ key_alias: "my-key", allowed_skills: [] }))).toStrictEqual(aliasOnly());
  });

  it("merges every source into a single object_permission", () => {
    const everyИсточник = {
      key_alias: "my-key",
      allowed_vector_store_ids: ["vs-1"],
      allowed_mcp_servers_and_groups: { servers: ["s-1"], accessGroups: ["g-1"], toolsets: ["t-1"] },
      mcp_tool_permissions: { "s-1": ["read"] },
      allowed_agents_and_groups: { agents: ["a-1"], accessGroups: ["ag-1"] },
      allowed_skills: ["private-skill"],
    };
    expect(payloadOf(build(everyИсточник))).toStrictEqual(
      aliasOnly({
        object_permission: {
          vector_stores: ["vs-1"],
          mcp_servers: ["s-1"],
          mcp_access_groups: ["g-1"],
          mcp_toolsets: ["t-1"],
          mcp_tool_permissions: { "s-1": ["read"] },
          agents: ["a-1"],
          agent_access_groups: ["ag-1"],
          skills: ["private-skill"],
        },
      }),
    );
  });
});

describe("premium and rotation flags", () => {
  it("drops disable_global_гардрейловs when it is off", () => {
    expect(payloadOf(build({ key_alias: "my-key", disable_global_гардрейловs: false }))).toStrictEqual(aliasOnly());
  });

  it("keeps disable_global_гардрейловs when it is on", () => {
    expect(payloadOf(build({ key_alias: "my-key", disable_global_гардрейловs: true }))).toStrictEqual(
      aliasOnly({ disable_global_гардрейловs: true }),
    );
  });

  it("adds the rotation fields only when auto rotation is enabled", () => {
    expect(
      payloadOf(build({ key_alias: "my-key" }, { autoRotationEnabled: true, rotationInterval: "7d" })),
    ).toStrictEqual(aliasOnly({ auto_rotate: true, rotation_interval: "7d" }));
  });

  it("sends no rotation fields when auto rotation is off", () => {
    expect(payloadOf(build({ key_alias: "my-key" }, { rotationInterval: "7d" }))).toStrictEqual(aliasOnly());
  });
});

describe("keys sourced from component state", () => {
  it("serialises Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию aliases", () => {
    expect(payloadOf(build({ key_alias: "my-key" }, { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAliases: { fast: "gpt-4o-mini" } }))).toStrictEqual(
      aliasOnly({ aliases: '{"fast":"gpt-4o-mini"}' }),
    );
  });

  it("sends rвыходer settings that hold at least one value", () => {
    expect(
      payloadOf(build({ key_alias: "my-key" }, { rвыходerSettings: { rвыходer_settings: { num_retries: 3 } } })),
    ).toStrictEqual(aliasOnly({ rвыходer_settings: { num_retries: 3 } }));
  });

  it("skips rвыходer settings whose every field is blank", () => {
    expect(
      payloadOf(
        build(
          { key_alias: "my-key" },
          { rвыходerSettings: { rвыходer_settings: { num_retries: null, timeвыход: undefined, rвыходing_strategy: "" } } },
        ),
      ),
    ).toStrictEqual(aliasOnly());
  });

  it("keeps only budget windows that carry both a duration and a limit", () => {
    expect(
      payloadOf(
        build(
          { key_alias: "my-key" },
          {
            budgetLimits: [
              { budget_duration: "1h", max_budget: 5 },
              { budget_duration: "", max_budget: 3 },
              { budget_duration: "7d", max_budget: null },
            ],
          },
        ),
      ),
    ).toStrictEqual(aliasOnly({ budget_limits: [{ budget_duration: "1h", max_budget: 5 }] }));
  });

  it("keeps a zero budget window rather than treating it as unset", () => {
    expect(
      payloadOf(build({ key_alias: "my-key" }, { budgetLimits: [{ budget_duration: "1h", max_budget: 0 }] })),
    ).toStrictEqual(aliasOnly({ budget_limits: [{ budget_duration: "1h", max_budget: 0 }] }));
  });

  it("omits budget_limits when no window is complete", () => {
    expect(
      payloadOf(build({ key_alias: "my-key" }, { budgetLimits: [{ budget_duration: "7d", max_budget: null }] })),
    ).toStrictEqual(aliasOnly());
  });

  it("reduces tag rows into a tag_rpm_limit map", () => {
    expect(
      payloadOf(
        build(
          { key_alias: "my-key" },
          {
            tagRateLimits: [
              { id: "r-1", tag: "prod", rpm_limit: 10 },
              { id: "r-2", tag: "  ", rpm_limit: 5 },
              { id: "r-3", tag: "dev", rpm_limit: null },
            ],
          },
        ),
      ),
    ).toStrictEqual(aliasOnly({ tag_rpm_limit: { prod: 10 } }));
  });

  it("omits tag_rpm_limit when no row is complete", () => {
    expect(
      payloadOf(build({ key_alias: "my-key" }, { tagRateLimits: [{ id: "r-1", tag: "", rpm_limit: 10 }] })),
    ).toStrictEqual(aliasOnly());
  });

  it("sends configured budget fallbacks", () => {
    expect(payloadOf(build({ key_alias: "my-key" }, { budgetРезервные модели: { "gpt-4": ["gpt-4o"] } }))).toStrictEqual(
      aliasOnly({ budget_fallbacks: { "gpt-4": ["gpt-4o"] } }),
    );
  });
});

describe("budget duration", () => {
  it("turns the never-resets sentinel into null", () => {
    expect(payloadOf(build({ key_alias: "my-key", budget_duration: "none" }))).toStrictEqual(
      aliasOnly({ budget_duration: null }),
    );
  });

  it("forwards a real budget duration untouched", () => {
    expect(payloadOf(build({ key_alias: "my-key", budget_duration: "30d" }))).toStrictEqual(
      aliasOnly({ budget_duration: "30d" }),
    );
  });
});

describe("purity", () => {
  it("leaves the submitted form values untouched", () => {
    const values = {
      key_alias: "my-key",
      mcp_tool_permissions: { "s-1": ["read"] },
      allowed_vector_store_ids: ["vs-1"],
      disable_global_гардрейловs: false,
      duration: "",
    };
    const before = structuredClone(values);
    build(values);
    expect(values).toStrictEqual(before);
  });
});

describe("serialised wire shape", () => {
  it("keeps an untouched closed form at eight object keys and seven wire keys", () => {
    const payload = payloadOf(build(CLOSED_SECTIONS_VALUES));
    expect(Object.keys(payload)).toHaveLength(8);
    expect(wireКлючи(payload)).toStrictEqual([
      "team_id",
      "key_alias",
      "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
      "key_type",
      "user_id",
      "duration",
      "metadata",
    ]);
    expect(payload.duration).toBeNull();
  });

  it("drops the undefined picker and keeps the null one, which is what the two Form.Items differ on", () => {
    const payload = payloadOf(build(CLOSED_SECTIONS_VALUES));
    expect(payload.organization_id).toBeUndefined();
    expect(payload.team_id).toBeNull();
    expect(wireКлючи(payload)).not.toContain("organization_id");
    expect(wireКлючи(payload)).toContain("team_id");
  });

  it("forwards a selected team by value", () => {
    expect(payloadOf(build({ ...CLOSED_SECTIONS_VALUES, team_id: "team-1" })).team_id).toBe("team-1");
  });

  it("adds fifteen keys to the object and only the two limit types to the wire when Дополнительные параметры opens", () => {
    const payload = payloadOf(build(OPTIONAL_SETTINGS_VALUES));
    expect(Object.keys(payload)).toHaveLength(23);
    expect(wireКлючи(payload)).toStrictEqual([
      "team_id",
      "key_alias",
      "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
      "key_type",
      "tpm_limit_type",
      "rpm_limit_type",
      "user_id",
      "duration",
      "metadata",
    ]);
  });

  it("never turns an undefined-valued key into null or an empty string", () => {
    const payload = payloadOf(build(OPTIONAL_SETTINGS_VALUES));
    DROPPED_AT_SERIALISATION.forEach((key) => {
      expect(payload[key]).toBeUndefined();
    });
    expect(wireКлючи(payload)).toEqual(expect.not.arrayContaining(DROPPED_AT_SERIALISATION));
  });
});

describe("duplicate alias", () => {
  it("reports the clash instead of building a payload", () => {
    expect(
      build({ key_alias: "taken", team_id: "team-1" }, { existingКлючи: [{ team_id: "team-1", key_alias: "taken" }] }),
    ).toStrictEqual({ kind: "duplicate_alias", alias: "taken", teamId: "team-1" });
  });

  it("scopes the clash to the same team", () => {
    expect(
      payloadOf(
        build({ key_alias: "taken", team_id: "team-2" }, { existingКлючи: [{ team_id: "team-1", key_alias: "taken" }] }),
      ).key_alias,
    ).toBe("taken");
  });

  it("treats a keyless form and a teamless key as the same bucket", () => {
    expect(build({}, { existingКлючи: [{ team_id: null, key_alias: "" }] })).toStrictEqual({
      kind: "duplicate_alias",
      alias: "",
      teamId: null,
    });
  });

  it("checks the alias before the agent selection", () => {
    expect(
      build(
        { key_alias: "taken" },
        { existingКлючи: [{ team_id: null, key_alias: "taken" }], keyOwner: "agent", selectedAgentId: null },
      ).kind,
    ).toBe("duplicate_alias");
  });
});

describe("endpoint", () => {
  it.each([
    ["you", "стандарт"],
    ["another_user", "стандарт"],
    ["service_account", "service_account"],
  ])("rвыходes a %s key to the %s endpoint", (keyOwner, endpoint) => {
    const result = build({ key_alias: "my-key" }, { keyOwner });
    expect(result.kind === "ok" && result.endpoint).toBe(endpoint);
  });
});

describe("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget", () => {
  it("sends the per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию budgets in the shape the API stores", () => {
    const payload = payloadOf(
      build(
        {},
        {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМакс.Бюджет: {
            "claude-opus-4-8": { budget_limit: 200, time_period: "1mo" },
            "gpt-4o": { budget_limit: 0.5, time_period: "30d" },
          },
        },
      ),
    );
    expect(payload.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget).toEqual({
      "claude-opus-4-8": { budget_limit: 200, time_period: "1mo" },
      "gpt-4o": { budget_limit: 0.5, time_period: "30d" },
    });
  });

  it("omits Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget entirely when no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию budget is set", () => {
    expect(payloadOf(build({}))).not.toHaveСвойство("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget");
  });
});
