import { describe, expect, it } from "vitest";
import { serializeRouterКонфигурация } from "./RouterConfigBuilder";

describe("serializeRouterКонфигурация", () => {
  it("rejects a cleared route Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and preserves selected route settings", () => {
    expect(() => serializeRouterКонфигурация({ routes: [{ name: null }] })).toThrow("Please select a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию for every route");
    const config = { routes: [{ name: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-silver", utterances: [], description: "", score_threshold: 0 }] };
    expect(JSON.parse(serializeRouterКонфигурация(config))).toEqual(config);
  });
});
