import { describe, expect, it } from "vitest";
import { serializeRouterConfig } from "./RouterConfigBuilder";

describe("serializeRouterКонфигурация", () => {
  it("rejects a cleared route Модель and preserves selected route settings", () => {
    expect(() => serializeRouterConfig({ routes: [{ name: null }] })).toThrow("Please Выберите модель for every route");
    const config = { routes: [{ name: "Модель-silver", utterances: [], description: "", score_threshold: 0 }] };
    expect(JSON.parse(serializeRouterConfig(config))).toEqual(config);
  });
});
