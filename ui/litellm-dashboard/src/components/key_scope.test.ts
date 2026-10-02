import { describe, expect, it } from "vitest";

import { deriveКлючРежимlОбласть } from "./key_scope";

describe("deriveКлючРежимlОбласть", () => {
  it("treats unrestricted keys (null/empty allowed_rвыходes) as full Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию access", () => {
    expect(deriveКлючРежимlОбласть(null)).toEqual({ hasРежимlAccess: true, label: null });
    expect(deriveКлючРежимlОбласть(undefined)).toEqual({ hasРежимlAccess: true, label: null });
    expect(deriveКлючРежимlОбласть([])).toEqual({ hasРежимlAccess: true, label: null });
  });

  it("classifies SCIM keys as no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию access", () => {
    expect(deriveКлючРежимlОбласть(["/scim/*"])).toEqual({ hasРежимlAccess: false, label: "SCIM" });
    expect(deriveКлючРежимlОбласть(["/scim/v2/Users", "/scim/v2/Groups"])).toEqual({
      hasРежимlAccess: false,
      label: "SCIM",
    });
  });

  it("classifies management-only keys as no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию access", () => {
    expect(deriveКлючРежимlОбласть(["management_rвыходes"])).toEqual({ hasРежимlAccess: false, label: "Management" });
  });

  it("classifies read-only keys as no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию access", () => {
    expect(deriveКлючРежимlОбласть(["info_rвыходes"])).toEqual({ hasРежимlAccess: false, label: "Read-only" });
  });

  it("leaves LLM-API and custom scopes with Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию access (default rendering)", () => {
    expect(deriveКлючРежимlОбласть(["llm_api_rвыходes"])).toEqual({ hasРежимlAccess: true, label: null });
    expect(deriveКлючРежимlОбласть(["/chat/completions"])).toEqual({ hasРежимlAccess: true, label: null });
    expect(deriveКлючРежимlОбласть(["management_rвыходes", "llm_api_rвыходes"])).toEqual({
      hasРежимlAccess: true,
      label: null,
    });
  });

  it("prefers a persisted key_type over allowed_rвыходes for the no-inference buckets", () => {
    expect(deriveКлючРежимlОбласть([], "management")).toEqual({ hasРежимlAccess: false, label: "Management" });
    expect(deriveКлючРежимlОбласть([], "read_only")).toEqual({ hasРежимlAccess: false, label: "Read-only" });
    expect(deriveКлючРежимlОбласть(["some_future_mgmt_preset"], "management")).toEqual({
      hasРежимlAccess: false,
      label: "Management",
    });
  });

  it("falls back to allowed_rвыходes for null/default/llm_api key_type", () => {
    expect(deriveКлючРежимlОбласть(["/scim/*"], null)).toEqual({ hasРежимlAccess: false, label: "SCIM" });
    expect(deriveКлючРежимlОбласть(["/scim/*"], "default")).toEqual({ hasРежимlAccess: false, label: "SCIM" });
    expect(deriveКлючРежимlОбласть([], "default")).toEqual({ hasРежимlAccess: true, label: null });
    expect(deriveКлючРежимlОбласть([], "llm_api")).toEqual({ hasРежимlAccess: true, label: null });
  });
});
