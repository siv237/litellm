import { describe, expect, it } from "vitest";

import type { МаршрутизацияGroup } from "./types";
import {
  argsForStrategy,
  buildRoutingGroupPayload,
  toRoutingGroupFormValues,
  type МаршрутизацияGroupFormValues,
} from "./routingGroupPayload";

const values = (overrides: Partial<МаршрутизацияGroupFormValues> = {}): МаршрутизацияGroupFormValues => ({
  group_name: "fast-chat",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
  routing_strategy: "simple-shuffle",
  routing_strategy_args: "",
  ...overrides,
});

describe("buildRoutingGroupPayload", () => {
  it("sends a null args key for a strategy that takes no arguments", () => {
    expect(buildRoutingGroupPayload(values())).toStrictEqual({
      ok: true,
      group: {
        group_name: "fast-chat",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
        routing_strategy: "simple-shuffle",
        routing_strategy_args: null,
      },
    });
  });

  it("parses the arguments for latency based routing", () => {
    const result = buildRoutingGroupPayload(
      values({ routing_strategy: "latency-based-routing", routing_strategy_args: '{"ttl": 3600}' }),
    );

    expect(result).toStrictEqual({
      ok: true,
      group: {
        group_name: "fast-chat",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
        routing_strategy: "latency-based-routing",
        routing_strategy_args: { ttl: 3600 },
      },
    });
  });

  it("parses the arguments for usage based routing", () => {
    const result = buildRoutingGroupPayload(
      values({ routing_strategy: "usage-based-routing", routing_strategy_args: '{"ttl": 60}' }),
    );

    expect(result.ok && result.group.routing_strategy_args).toStrictEqual({ ttl: 60 });
  });

  it("drops arguments belonging to a strategy that does not take them", () => {
    const result = buildRoutingGroupPayload(
      values({ routing_strategy: "least-busy", routing_strategy_args: '{"ttl": 3600}' }),
    );

    expect(result.ok && result.group.routing_strategy_args).toBeNull();
  });

  it("treats whitespace-only arguments as absent", () => {
    const result = buildRoutingGroupPayload(
      values({ routing_strategy: "latency-based-routing", routing_strategy_args: "   \n  " }),
    );

    expect(result.ok && result.group.routing_strategy_args).toBeNull();
  });

  it("reports invalid JSON instead of a payload", () => {
    expect(
      buildRoutingGroupPayload(values({ routing_strategy: "latency-based-routing", routing_strategy_args: "{ttl:}" })),
    ).toStrictEqual({ ok: false, argsОшибка: "Must be valid JSON" });
  });

  it("trims the group name", () => {
    const result = buildRoutingGroupPayload(values({ group_name: "  fast-chat  " }));

    expect(result.ok && result.group.group_name).toBe("fast-chat");
  });

  it("passes the selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs through untouched", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs = ["gpt-4o", "claude-sonnet", "gemini-pro"];
    const result = buildRoutingGroupPayload(values({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs }));

    expect(result.ok && result.group.models).toStrictEqual(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs);
  });
});

describe("argsForStrategy", () => {
  it("keeps the arguments when the new strategy still takes them", () => {
    expect(argsForStrategy("usage-based-routing", '{"ttl": 60}')).toBe('{"ttl": 60}');
  });

  it("clears the arguments when the new strategy takes none", () => {
    expect(argsForStrategy("simple-shuffle", '{"ttl": 60}')).toBe("");
  });
});

describe("toRoutingGroupFormValues", () => {
  it("falls back to empty values and the first available strategy when creating", () => {
    const expected: МаршрутизацияGroupFormValues = {
      group_name: "",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      routing_strategy: "least-busy",
      routing_strategy_args: "",
    };

    expect(toRoutingGroupFormValues(null, ["least-busy", "simple-shuffle"])).toStrictEqual(expected);
  });

  it("falls back to simple-shuffle when no strategy is available", () => {
    expect(toRoutingGroupFormValues(null, []).routing_strategy).toBe("simple-shuffle");
  });

  it("pretty-prints the stored arguments", () => {
    const stored: МаршрутизацияGroup = {
      group_name: "latency-group",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
      routing_strategy: "latency-based-routing",
      routing_strategy_args: { ttl: 3600 },
    };
    const expected: МаршрутизацияGroupFormValues = {
      group_name: "latency-group",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
      routing_strategy: "latency-based-routing",
      routing_strategy_args: '{\n  "ttl": 3600\n}',
    };

    expect(toRoutingGroupFormValues(stored, [])).toStrictEqual(expected);
  });

  it("leaves the arguments blank when the stored group has none", () => {
    const stored: МаршрутизацияGroup = {
      group_name: "g",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
      routing_strategy: "simple-shuffle",
      routing_strategy_args: null,
    };

    expect(toRoutingGroupFormValues(stored, []).routing_strategy_args).toBe("");
  });

  it("carries only the four bound fields, never the rest of the record", () => {
    expect(
      Object.keys(
        toRoutingGroupFormValues({ group_name: "g", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [], routing_strategy: "simple-shuffle" }, []),
      ).sort(),
    ).toStrictEqual(["group_name", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", "routing_strategy", "routing_strategy_args"]);
  });
});
