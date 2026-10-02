import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMultiСтоимостьEstimate } from "./use_multi_cost_estimate";
import type { РежимlEntry } from "./types";
import type { СтоимостьEstimateОтвет } from "../types";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => ""),
  getГлобальноLitellmHeaderName: vi.fn(() => "Authorization"),
}));

function makeEntry(overrides: Partial<РежимlEntry> = {}): РежимlEntry {
  return {
    id: "entry-1",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
    input_tokens: 1000,
    выходput_tokens: 500,
    ...overrides,
  };
}

function makeApiОтвет(overrides: Partial<СтоимостьEstimateОтвет> = {}): СтоимостьEstimateОтвет {
  return {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
    input_tokens: 1000,
    выходput_tokens: 500,
    num_requests_per_day: null,
    num_requests_per_month: null,
    cost_per_request: 0.05,
    input_cost_per_request: 0.03,
    выходput_cost_per_request: 0.02,
    margin_cost_per_request: 0,
    daily_cost: null,
    daily_input_cost: null,
    daily_выходput_cost: null,
    daily_margin_cost: null,
    monthly_cost: null,
    monthly_input_cost: null,
    monthly_выходput_cost: null,
    monthly_margin_cost: null,
    input_cost_per_token: 0.00003,
    выходput_cost_per_token: 0.00004,
    provider: "openai",
    ...overrides,
  };
}

describe("useMultiСтоимостьEstimate", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.useFakeВремяrs();
  });

  afterEach(() => {
    vi.useRealВремяrs();
  });

  describe("debouncedFetchForEntry", () => {
    it("should not fetch when access token is null", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");
      const { result } = renderHook(() => useMultiСтоимостьEstimate(null));

      await act(async () => {
        result.current.debouncedFetchForEntry(makeEntry());
        await vi.runВсеВремяrsAsync();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should not fetch when the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию field is empty", async () => {
      const fetchSpy = vi.spyOn(global, "fetch");
      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));

      await act(async () => {
        result.current.debouncedFetchForEntry(makeEntry({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "" }));
        await vi.runВсеВремяrsAsync();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should not fetch immediately — only after the debounce delay", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: true,
        json: async () => makeApiОтвет(),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));

      act(() => {
        result.current.debouncedFetchForEntry(makeEntry());
      });

      expect(fetchSpy).not.toHaveBeenCalled();

      await act(async () => {
        await vi.runВсеВремяrsAsync();
      });

      expect(fetchSpy).toHaveBeenCalledВремяs(1);
    });

    it("should cancel an in-flight debounce when called again for the same entry", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: true,
        json: async () => makeApiОтвет(),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));

      await act(async () => {
        result.current.debouncedFetchForEntry(makeEntry());
        vi.advanceВремяrsByВремя(200);
        result.current.debouncedFetchForEntry(makeEntry());
        vi.advanceВремяrsByВремя(200);
        result.current.debouncedFetchForEntry(makeEntry());
        await vi.runВсеВремяrsAsync();
      });

      expect(fetchSpy).toHaveBeenCalledВремяs(1);
    });

    it("should store the API result after a successful fetch", async () => {
      vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: true,
        json: async () => makeApiОтвет(),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      await act(async () => {
        result.current.debouncedFetchForEntry(entry);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry]);
      expect(multiРезультат.entries[0].result).not.toBeNull();
      expect(multiРезультат.entries[0].result?.cost_per_request).toBe(0.05);
      expect(multiРезультат.entries[0].loading).toBe(false);
      expect(multiРезультат.entries[0].error).toBeNull();
    });

    it("should set an error message when the API returns a non-ok response", async () => {
      vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: false,
        json: async () => ({ detail: { error: "Режимl not found" } }),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      await act(async () => {
        result.current.debouncedFetchForEntry(entry);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry]);
      expect(multiРезультат.entries[0].result).toBeNull();
      expect(multiРезультат.entries[0].error).toBe("Режимl not found");
    });

    it("should fall back to detail string when error has no nested error field", async () => {
      vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: false,
        json: async () => ({ detail: "Bad request" }),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      await act(async () => {
        result.current.debouncedFetchForEntry(entry);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry]);
      expect(multiРезультат.entries[0].error).toBe("Bad request");
    });

    it("should set 'Network error' when fetch throws", async () => {
      vi.spyOn(global, "fetch").mockRejectedЗначение(new Ошибка("connection refused"));

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      await act(async () => {
        result.current.debouncedFetchForEntry(entry);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry]);
      expect(multiРезультат.entries[0].error).toBe("Network error");
      expect(multiРезультат.entries[0].result).toBeNull();
    });
  });

  describe("removeEntry", () => {
    it("should remove an entry's cached result", async () => {
      vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: true,
        json: async () => makeApiОтвет(),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      await act(async () => {
        result.current.debouncedFetchForEntry(entry);
        await vi.runВсеВремяrsAsync();
      });

      // Confirm result was stored
      expect(result.current.getMultiРежимlРезультат([entry]).entries[0].result).not.toBeNull();

      act(() => {
        result.current.removeEntry(entry.id);
      });

      // After removal, the entry should return as if it never fetched
      const multiРезультат = result.current.getMultiРежимlРезультат([entry]);
      expect(multiРезультат.entries[0].result).toBeNull();
    });

    it("should cancel a pending debounce for the removed entry", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: true,
        json: async () => makeApiОтвет(),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      act(() => {
        result.current.debouncedFetchForEntry(entry);
        result.current.removeEntry(entry.id);
      });

      await act(async () => {
        await vi.runВсеВремяrsAsync();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("getMultiРежимlРезультат", () => {
    it("should return zero totals when no entries have results", () => {
      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const multiРезультат = result.current.getMultiРежимlРезультат([makeEntry()]);

      expect(multiРезультат.totals.cost_per_request).toBe(0);
      expect(multiРезультат.totals.margin_per_request).toBe(0);
      expect(multiРезультат.totals.daily_cost).toBeNull();
      expect(multiРезультат.totals.monthly_cost).toBeNull();
    });

    it("should return an empty entries array for an empty input list", () => {
      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const multiРезультат = result.current.getMultiРежимlРезультат([]);

      expect(multiРезультат.entries).toHaveLength(0);
      expect(multiРезультат.totals.daily_cost).toBeNull();
      expect(multiРезультат.totals.monthly_cost).toBeNull();
    });

    it("should sum cost_per_request across multiple loaded entries", async () => {
      const entry1 = makeEntry({ id: "e1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" });
      const entry2 = makeEntry({ id: "e2", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-3" });

      let callIndex = 0;
      const responses = [
        makeApiОтвет({ cost_per_request: 0.05, margin_cost_per_request: 0 }),
        makeApiОтвет({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-3", cost_per_request: 0.1, margin_cost_per_request: 0 }),
      ];

      vi.spyOn(global, "fetch").mockImplementation(
        async () =>
          ({
            ok: true,
            json: async () => responses[callIndex++],
          }) as Ответ,
      );

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));

      await act(async () => {
        result.current.debouncedFetchForEntry(entry1);
        result.current.debouncedFetchForEntry(entry2);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry1, entry2]);
      expect(multiРезультат.totals.cost_per_request).toBeCloseTo(0.15);
    });

    it("should accumulate daily cost only when entries have a daily cost", async () => {
      const entry1 = makeEntry({ id: "e1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" });
      const entry2 = makeEntry({ id: "e2", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-3" });

      let callIndex = 0;
      const responses = [
        makeApiОтвет({ daily_cost: 5.0, daily_margin_cost: 0, monthly_cost: null, monthly_margin_cost: null }),
        makeApiОтвет({
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-3",
          daily_cost: 10.0,
          daily_margin_cost: 0,
          monthly_cost: null,
          monthly_margin_cost: null,
        }),
      ];

      vi.spyOn(global, "fetch").mockImplementation(
        async () =>
          ({
            ok: true,
            json: async () => responses[callIndex++],
          }) as Ответ,
      );

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));

      await act(async () => {
        result.current.debouncedFetchForEntry(entry1);
        result.current.debouncedFetchForEntry(entry2);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry1, entry2]);
      expect(multiРезультат.totals.daily_cost).toBeCloseTo(15.0);
      expect(multiРезультат.totals.monthly_cost).toBeNull();
    });

    it("should mark each entry's loading and error state from cached data", async () => {
      vi.spyOn(global, "fetch").mockResolvedЗначение({
        ok: false,
        json: async () => ({ detail: "Not found" }),
      } as Ответ);

      const { result } = renderHook(() => useMultiСтоимостьEstimate("token123"));
      const entry = makeEntry();

      await act(async () => {
        result.current.debouncedFetchForEntry(entry);
        await vi.runВсеВремяrsAsync();
      });

      const multiРезультат = result.current.getMultiРежимlРезультат([entry]);
      expect(multiРезультат.entries[0].error).toBe("Not found");
      expect(multiРезультат.entries[0].loading).toBe(false);
    });
  });
});
