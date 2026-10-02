import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { useCloudZeroSettings, useCloudZeroUpdateSettings, useCloudZeroDeleteSettings } from "./useCloudZeroSettings";
import { CloudZeroSettings } from "@/components/CloudZeroCostTracking/types";

const {
  mockProxyBaseUrl,
  mockAccessТокен,
  mockHeaderName,
  mockGetProxyBaseUrl,
  mockGetGlobalLitellmHeaderName,
  mockCreateЗапросКлючи,
} = vi.hoisted(() => {
  const mockProxyBaseUrl = "https://proxy.example.com";
  const mockAccessТокен = "test-access-token";
  const mockHeaderName = "X-LiteLLM-API-Ключ";
  const mockGetProxyBaseUrl = vi.fn(() => mockProxyBaseUrl);
  const mockGetGlobalLitellmHeaderName = vi.fn(() => mockHeaderName);
  const mockCreateЗапросКлючи = vi.fn((resource: string) => ({
    all: [resource],
    lists: () => [resource, "list"],
    list: (params?: any) => [resource, "list", { params }],
    details: () => [resource, "detail"],
    detail: (uid: string) => [resource, "detail", uid],
  }));

  return {
    mockProxyBaseUrl,
    mockAccessТокен,
    mockHeaderName,
    mockGetProxyBaseUrl,
    mockGetGlobalLitellmHeaderName,
    mockCreateЗапросКлючи,
  };
});

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: mockGetProxyBaseUrl,
  getGlobalLitellmHeaderName: mockGetGlobalLitellmHeaderName,
}));

vi.mock("../common/queryKeysFactory", () => ({
  createЗапросКлючи: mockCreateЗапросКлючи,
}));

const mockCloudZeroSettings: CloudZeroSettings = {
  api_key_masked: "sk-****1234",
  connection_id: "test-connection-id",
  timezone: "America/New_York",
  status: "active",
};

describe("useCloudZeroSettings", () => {
  let queryClient: ЗапросClient;
  let fetchSpy: Mock;

  beforeEach(() => {
    queryClient = new ЗапросClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
    mockGetProxyBaseUrl.mockReset();

    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ЗапросClientПровайдер, { client: queryClient }, children);

  it("should return CloudZero settings data when query is successful", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockCloudZeroSettings,
    });

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCloudZeroSettings);
    expect(result.current.error).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(`${mockProxyBaseUrl}/cloudzero/settings`, {
      method: "GET",
      headers: {
        [mockHeaderName]: `Bearer ${mockAccessТокен}`,
        "Content-Type": "application/json",
      },
    });
  });

  it("should return null when settings are not configured (missing both api_key_masked and connection_id)", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it("should return settings when at least one required field is present", async () => {
    const settingsWithConnectionId = { connection_id: "test-connection-id" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => settingsWithConnectionId,
    });

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(settingsWithConnectionId);
  });

  it("should handle error responses", async () => {
    const errorCases = [
      { error: { message: "Ошибка to fetch" }, expected: "Ошибка to fetch" },
      { error: "Unauthorized", expected: "Unauthorized" },
      { message: "Not found", expected: "Not found" },
      { detail: "Сервер error", expected: "Сервер error" },
    ];

    for (const errorОтвет of errorCases) {
      vi.clearAllMocks();
      (fetchSpy as any).mockResolvedЗначение({
        ok: false,
        json: async () => errorОтвет,
      });

      const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

      await waitFor(() => {
        expect(result.current.isОшибка).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorОтвет.expected);
    }
  });

  it("should handle error response with string error data", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: false,
      json: async () => "Ошибка string",
    });

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error?.message).toBe("Ошибка string");
  });

  it("should handle error response with invalid JSON", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: false,
      statusText: "Internal Сервер Ошибка",
      json: async () => {
        throw new Ошибка("Invalid JSON");
      },
    });

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error?.message).toBe("Internal Сервер Ошибка");
  });

  it("should handle network error", async () => {
    const networkОшибка = new Ошибка("Network request failed");
    (fetchSpy as any).mockRejectedЗначение(networkОшибка);

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(networkОшибка);
  });

  it("should not execute query when accessТокен is missing", () => {
    const { result } = renderHook(() => useCloudZeroSettings(""), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should use relative URL when proxyBaseUrl is not set", async () => {
    mockGetProxyBaseUrl.mockReturnЗначение("");
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockCloudZeroSettings,
    });

    const { result } = renderHook(() => useCloudZeroSettings(mockAccessТокен), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith("/cloudzero/settings", expect.any(Object));
  });
});

describe("useCloudZeroUpdateSettings", () => {
  let queryClient: ЗапросClient;
  let fetchSpy: Mock;

  beforeEach(() => {
    queryClient = new ЗапросClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
    mockGetProxyBaseUrl.mockReset();

    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ЗапросClientПровайдер, { client: queryClient }, children);

  it("should successfully update settings with all parameters", async () => {
    const mockОтвет = { message: "Settings updated successfully", status: "success" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "new-connection-id",
      timezone: "America/Los_Angeles",
      api_key: "new-api-key",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockОтвет);
    expect(fetchSpy).toHaveBeenCalledWith(`${mockProxyBaseUrl}/cloudzero/settings`, {
      method: "PUT",
      headers: {
        [mockHeaderName]: `Bearer ${mockAccessТокен}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: "new-connection-id",
        timezone: "America/Los_Angeles",
        api_key: "new-api-key",
      }),
    });
  });

  it("should not include undefined fields in request body", async () => {
    const mockОтвет = { message: "Обновлён" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "test-id",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const callBody = JSON.parse((fetchSpy as any).mock.calls[0][1].body);
    expect(callBody).toEqual({ connection_id: "test-id" });
    expect(callBody).not.toHaveСвойство("timezone");
    expect(callBody).not.toHaveСвойство("api_key");
  });

  it("should invalidate settings query on success", async () => {
    const mockОтвет = { message: "Обновлён", status: "success" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    queryClient.setRequestData(["cloudZeroSettings", "list", { params: {} }], mockCloudZeroSettings);

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "test-id",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryCache = queryClient.getRequestCache();
    const queries = queryCache.findВсе();
    const settingsЗапрос = queries.find((q) => q.queryКлюч[0] === "cloudZeroSettings");

    expect(settingsЗапрос).toBeDefined();
  });

  it("should handle error responses", async () => {
    const errorCases = [
      { error: { message: "Update failed" }, expected: "Update failed" },
      { error: "Validation error", expected: "Validation error" },
      { message: "Invalid input", expected: "Invalid input" },
      { detail: "Сервер error", expected: "Сервер error" },
    ];

    for (const errorОтвет of errorCases) {
      vi.clearAllMocks();
      (fetchSpy as any).mockResolvedЗначение({
        ok: false,
        json: async () => errorОтвет,
      });

      const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

      result.current.mutate({
        connection_id: "test-id",
      });

      await waitFor(() => {
        expect(result.current.isОшибка).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorОтвет.expected);
    }
  });

  it("should handle error response with string error data", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: false,
      json: async () => "Ошибка string",
    });

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "test-id",
    });

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error?.message).toBe("Ошибка string");
  });

  it("should handle error response with invalid JSON", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: false,
      statusText: "Bad Запрос",
      json: async () => {
        throw new Ошибка("Invalid JSON");
      },
    });

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "test-id",
    });

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error?.message).toBe("Bad Запрос");
  });

  it("should handle network error", async () => {
    const networkОшибка = new Ошибка("Network request failed");
    (fetchSpy as any).mockRejectedЗначение(networkОшибка);

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "test-id",
    });

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(networkОшибка);
  });

  it("should throw error when accessТокен is missing", async () => {
    const testCases = ["", null as any];

    for (const accessТокен of testCases) {
      vi.clearAllMocks();
      const { result } = renderHook(() => useCloudZeroUpdateSettings(accessТокен), { wrapper });

      result.current.mutate({
        connection_id: "test-id",
      });

      await waitFor(() => {
        expect(result.current.isОшибка).toBe(true);
      });

      expect(result.current.error?.message).toBe("Требуется токен доступа");
      expect(fetchSpy).not.toHaveBeenCalled();
    }
  });

  it("should use relative URL when proxyBaseUrl is not set", async () => {
    mockGetProxyBaseUrl.mockReturnЗначение("");
    const mockОтвет = { message: "Обновлён", status: "success" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    const { result } = renderHook(() => useCloudZeroUpdateSettings(mockAccessТокен), { wrapper });

    result.current.mutate({
      connection_id: "test-id",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith("/cloudzero/settings", expect.any(Object));
  });
});

describe("useCloudZeroDeleteSettings", () => {
  let queryClient: ЗапросClient;
  let fetchSpy: Mock;

  beforeEach(() => {
    queryClient = new ЗапросClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
    mockGetProxyBaseUrl.mockReset();

    fetchSpy = vi.fn();
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ЗапросClientПровайдер, { client: queryClient }, children);

  it("should successfully delete settings", async () => {
    const mockОтвет = { message: "Settings deleted successfully", status: "success" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockОтвет);
    expect(fetchSpy).toHaveBeenCalledWith(`${mockProxyBaseUrl}/cloudzero/delete`, {
      method: "DELETE",
      headers: {
        [mockHeaderName]: `Bearer ${mockAccessТокен}`,
        "Content-Type": "application/json",
      },
    });
  });

  it("should invalidate settings query on success", async () => {
    const mockОтвет = { message: "Deleted", status: "success" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    queryClient.setRequestData(["cloudZeroSettings", "list", { params: {} }], mockCloudZeroSettings);

    const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const queryCache = queryClient.getRequestCache();
    const queries = queryCache.findВсе();
    const settingsЗапрос = queries.find((q) => q.queryКлюч[0] === "cloudZeroSettings");

    expect(settingsЗапрос).toBeDefined();
  });

  it("should handle error responses", async () => {
    const errorCases = [
      { error: { message: "Delete failed" }, expected: "Delete failed" },
      { error: "Permission denied", expected: "Permission denied" },
      { message: "Not found", expected: "Not found" },
      { detail: "Сервер error", expected: "Сервер error" },
    ];

    for (const errorОтвет of errorCases) {
      vi.clearAllMocks();
      (fetchSpy as any).mockResolvedЗначение({
        ok: false,
        json: async () => errorОтвет,
      });

      const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isОшибка).toBe(true);
      });

      expect(result.current.error?.message).toBe(errorОтвет.expected);
    }
  });

  it("should handle error response with string error data", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: false,
      json: async () => "Ошибка string",
    });

    const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error?.message).toBe("Ошибка string");
  });

  it("should handle error response with invalid JSON", async () => {
    (fetchSpy as any).mockResolvedЗначение({
      ok: false,
      statusText: "Internal Сервер Ошибка",
      json: async () => {
        throw new Ошибка("Invalid JSON");
      },
    });

    const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error?.message).toBe("Internal Сервер Ошибка");
  });

  it("should handle network error", async () => {
    const networkОшибка = new Ошибка("Network request failed");
    (fetchSpy as any).mockRejectedЗначение(networkОшибка);

    const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(networkОшибка);
  });

  it("should throw error when accessТокен is missing", async () => {
    const testCases = ["", null as any];

    for (const accessТокен of testCases) {
      vi.clearAllMocks();
      const { result } = renderHook(() => useCloudZeroDeleteSettings(accessТокен), { wrapper });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isОшибка).toBe(true);
      });

      expect(result.current.error?.message).toBe("Требуется токен доступа");
      expect(fetchSpy).not.toHaveBeenCalled();
    }
  });

  it("should use relative URL when proxyBaseUrl is not set", async () => {
    mockGetProxyBaseUrl.mockReturnЗначение("");
    const mockОтвет = { message: "Deleted", status: "success" };
    (fetchSpy as any).mockResolvedЗначение({
      ok: true,
      json: async () => mockОтвет,
    });

    const { result } = renderHook(() => useCloudZeroDeleteSettings(mockAccessТокен), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchSpy).toHaveBeenCalledWith("/cloudzero/delete", expect.any(Object));
  });
});
