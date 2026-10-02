import { describe, expect, it } from "vitest";
import { serializeRвыходerКонфигурация } from "./RвыходerКонфигурацияBuilder";

describe("serializeRвыходerКонфигурация", () => {
  it("rejects a cleared rвыходe Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and preserves selected rвыходe settings", () => {
    expect(() => serializeRвыходerКонфигурация({ rвыходes: [{ name: null }] })).toThrow("Please select a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию for every rвыходe");
    const config = { rвыходes: [{ name: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-silver", utterances: [], description: "", score_threshold: 0 }] };
    expect(JSON.parse(serializeRвыходerКонфигурация(config))).toEqual(config);
  });
});
