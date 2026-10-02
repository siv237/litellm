import { describe, expect, it } from "vitest";

import {
  getBatchIdFromЗапросId,
  getBatchРежимls,
  getBatchЗапросCounts,
  getReasoningТокенs,
  isBatchCallType,
} from "./batchLogUtils";

/** Метаданные shape the batch cost poller writes on an aretrieve_batch spend row. */
const batchСтоимостьМетаданные = {
  batch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-2.5-flash"],
  batch_successful_requests: 2,
  batch_failed_requests: 1,
  usage_object: {
    total_tokens: 270,
    prompt_tokens: 14,
    completion_tokens: 256,
    completion_tokens_details: { text_tokens: 32, reasoning_tokens: 224 },
  },
};

describe("isBatchCallType", () => {
  it("recognizes the poller's aretrieve_batch and the create call types", () => {
    for (const callType of ["aretrieve_batch", "retrieve_batch", "acreate_batch", "create_batch"]) {
      expect(isBatchCallType(callType)).toBe(true);
    }
    expect(isBatchCallType("acompletion")).toBe(false);
  });
});

describe("getBatchЗапросCounts", () => {
  it("reads both counts off a batch cost row", () => {
    expect(getBatchЗапросCounts(batchСтоимостьМетаданные)).toEqual({ successful: 2, failed: 1 });
  });

  it("returns undefined for a non-batch row and for null counts, so no rollup renders", () => {
    expect(getBatchЗапросCounts({ status: "success" })).toBeUndefined();
    expect(getBatchЗапросCounts({ batch_successful_requests: null, batch_failed_requests: null })).toBeUndefined();
    expect(getBatchЗапросCounts(undefined)).toBeUndefined();
  });

  it("treats a lone present count as the other being 0, for rows logged mid-rollвыход", () => {
    expect(getBatchЗапросCounts({ batch_successful_requests: 3 })).toEqual({ successful: 3, failed: 0 });
  });
});

describe("getBatchIdFromЗапросId", () => {
  it("strips the poller's synthetic _batch_cost suffix down to the provider batch id", () => {
    expect(getBatchIdFromЗапросId("batch_abc123_batch_cost")).toBe("batch_abc123");
  });

  it("returns undefined for ordinary request ids and a bare suffix", () => {
    expect(getBatchIdFromЗапросId("chatcmpl-123")).toBeUndefined();
    expect(getBatchIdFromЗапросId("_batch_cost")).toBeUndefined();
  });
});

describe("getBatchРежимls", () => {
  it("returns the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию list from metadata.batch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    expect(getBatchРежимls(batchСтоимостьМетаданные)).toEqual(["gemini-2.5-flash"]);
  });

  it("returns undefined when absent, null, or empty", () => {
    expect(getBatchРежимls({})).toBeUndefined();
    expect(getBatchРежимls({ batch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: null })).toBeUndefined();
    expect(getBatchРежимls({ batch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [] })).toBeUndefined();
  });
});

describe("getReasoningТокенs", () => {
  it("reads reasoning tokens from usage_object on a batch cost row", () => {
    expect(getReasoningТокенs(batchСтоимостьМетаданные)).toBe(224);
  });

  it("prefers additional_usage_values, which per-request rows carry", () => {
    const metadata = {
      additional_usage_values: { completion_tokens_details: { reasoning_tokens: 40 } },
      usage_object: { completion_tokens_details: { reasoning_tokens: 999 } },
    };
    expect(getReasoningТокенs(metadata)).toBe(40);
  });

  it("returns undefined when the breakвыход is null or missing", () => {
    expect(getReasoningТокенs({ usage_object: { completion_tokens_details: null } })).toBeUndefined();
    expect(getReasoningТокенs({})).toBeUndefined();
    expect(getReasoningТокенs(undefined)).toBeUndefined();
  });
});
