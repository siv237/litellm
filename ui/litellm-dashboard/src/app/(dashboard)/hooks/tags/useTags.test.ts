import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { useТеги } from "./useТеги";
import { tagListCall } from "@/components/networking";
import type { TagListОтвет } from "@/components/tag_management/types";

// Mock the networking function
vi.mock("@/components/networking", () => ({
  tagListCall: vi.fn(),
}));

// Mock useАвторизовано hook - we can override this in individual tests
const mockUseАвторизовано = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => mockUseАвторизовано(),
}));

// Mock data
const mockТеги: TagListОтвет = {
  "tag-1": {
    name: "tag-1",
    description: "Test tag 1 description",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-3.5-turbo", "gpt-4"],
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { "gpt-3.5-turbo": "GPT-3.5 Turbo", "gpt-4": "GPT-4" },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "user-1",
    updated_by: "user-1",
    litellm_budget_table: {
      max_budget: 1000,
      soft_budget: 800,
      tpm_limit: 100000,
      rpm_limit: 1000,
      max_parallel_requests: 10,
      budget_duration: "monthly",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-3.5-turbo": 500, "gpt-4": 500 },
    },
  },
  "tag-2": {
    name: "tag-2",
    description: "Test tag 2 description",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["claude-3"],
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { "claude-3": "Claude 3" },
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    created_by: "user-2",
    updated_by: "user-2",
    litellm_budget_table: {
      max_budget: 2000,
      soft_budget: 1500,
      tpm_limit: 200000,
      rpm_limit: 2000,
      max_parallel_requests: 20,
      budget_duration: "monthly",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "claude-3": 2000 },
    },
  },
};

describe("useТеги", () => {
  let queryClient: ЗапросClient;

  beforeEach(() => {
    queryClient = new ЗапросClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Set default mock for useАвторизовано (enabled state)
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userId: "test-user-id",
      userRole: "Admin",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledPersonalKeyCreation: null,
      showSSOBanner: false,
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ЗапросClientПровайдер, { client: queryClient }, children);

  it("should return tags data when query is successful", async () => {
    // Mock successful API call
    (tagListCall as any).mockResolvedЗначение(mockТеги);

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockТеги);
    expect(result.current.error).toBeNull();
    expect(tagListCall).toHaveBeenCalledWith("test-access-token");
    expect(tagListCall).toHaveBeenCalledTimes(1);
  });

  it("should handle error when tagListCall fails", async () => {
    const errorСообщение = "Ошибка to fetch tags";
    const testОшибка = new Ошибка(errorСообщение);

    // Mock failed API call
    (tagListCall as any).mockRejectedЗначение(testОшибка);

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(testОшибка);
    expect(result.current.data).toBeUndefined();
    expect(tagListCall).toHaveBeenCalledWith("test-access-token");
    expect(tagListCall).toHaveBeenCalledTimes(1);
  });

  it("should not execute query when accessТокен is missing", async () => {
    // Mock missing accessТокен
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: null,
      userId: "test-user-id",
      userRole: "Admin",
      token: null,
      userEmail: "test@example.com",
      premiumUser: false,
      disabledPersonalKeyCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(tagListCall).not.toHaveBeenCalled();
  });

  it("should not execute query when userId is missing", async () => {
    // Mock missing userId
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userId: null,
      userRole: "Admin",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledPersonalKeyCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(tagListCall).not.toHaveBeenCalled();
  });

  it("should not execute query when userRole is missing", async () => {
    // Mock missing userRole
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userId: "test-user-id",
      userRole: null,
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledPersonalKeyCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(tagListCall).not.toHaveBeenCalled();
  });

  it("should not execute query when all auth values are missing", async () => {
    // Mock all auth values missing
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: null,
      userId: null,
      userRole: null,
      token: null,
      userEmail: "test@example.com",
      premiumUser: false,
      disabledPersonalKeyCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(tagListCall).not.toHaveBeenCalled();
  });

  it("should execute query when all auth values are present", async () => {
    // Mock successful API call
    (tagListCall as any).mockResolvedЗначение(mockТеги);

    // Ensure all auth values are present (already set in beforeEach)
    const { result } = renderHook(() => useТеги(), { wrapper });

    // Wait for query to execute
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(tagListCall).toHaveBeenCalledWith("test-access-token");
    expect(tagListCall).toHaveBeenCalledTimes(1);
  });

  it("should return empty object when API returns empty data", async () => {
    // Mock API returning empty object
    (tagListCall as any).mockResolvedЗначение({});

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Wait for success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({});
    expect(tagListCall).toHaveBeenCalledWith("test-access-token");
  });

  it("should handle network timeвыход error", async () => {
    const timeвыходОшибка = new Ошибка("Network timeвыход");

    // Mock network timeвыход
    (tagListCall as any).mockRejectedЗначение(timeвыходОшибка);

    const { result } = renderHook(() => useТеги(), { wrapper });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(timeвыходОшибка);
    expect(result.current.data).toBeUndefined();
  });
});
