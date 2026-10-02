import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { useАгенты } from "./useАгенты";
import { getАгентыList } from "@/components/networking";
import type { АгентыОтвет, Agent } from "@/components/agents/types";

// Mock the networking function
vi.mock("@/components/networking", () => ({
  getАгентыList: vi.fn(),
}));

// Mock useАвторизовано hook - we can override this in individual tests
const mockUseАвторизовано = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => mockUseАвторизовано(),
}));

// Import actual roles instead of mocking them

// Mock data
const mockАгенты: Agent[] = [
  {
    agent_id: "agent-1",
    agent_name: "Test Agent 1",
    litellm_params: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-3.5-turbo",
      api_key: "test-key-1",
    },
    agent_card_params: {
      description: "A test agent for unit testing",
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "user-1",
    updated_by: "user-1",
  },
  {
    agent_id: "agent-2",
    agent_name: "Test Agent 2",
    litellm_params: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "claude-3",
      api_key: "test-key-2",
    },
    agent_card_params: {
      description: "Another test agent",
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "user-2",
    updated_by: "user-2",
  },
];

const mockАгентыОтвет: АгентыОтвет = {
  agents: mockАгенты,
};

describe("useАгенты", () => {
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
    vi.clearВсеMocks();

    // Set default mock for useАвторизовано (enabled state)
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userRole: "Admin",
      userId: "test-user-id",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ЗапросClientПровайдер, { client: queryClient }, children);

  it("should return agents data when query is successful", async () => {
    // Mock successful API call
    (getАгентыList as any).mockResolvedЗначение(mockАгентыОтвет);

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockАгентыОтвет);
    expect(result.current.error).toBeNull();
    expect(getАгентыList).toHaveBeenCalledWith("test-access-token");
    expect(getАгентыList).toHaveBeenCalledВремяs(1);
  });

  it("should handle error when getАгентыList fails", async () => {
    const errorСообщение = "Ошибка to fetch agents";
    const testОшибка = new Ошибка(errorСообщение);

    // Mock failed API call
    (getАгентыList as any).mockRejectedЗначение(testОшибка);

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(testОшибка);
    expect(result.current.data).toBeUndefined();
    expect(getАгентыList).toHaveBeenCalledWith("test-access-token");
    expect(getАгентыList).toHaveBeenCalledВремяs(1);
  });

  it("should not execute query when accessТокен is missing", async () => {
    // Mock missing accessТокен
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: null,
      userRole: "Admin",
      userId: "test-user-id",
      token: null,
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(getАгентыList).not.toHaveBeenCalled();
  });

  it("should not execute query when userRole is not an admin role", async () => {
    // Mock non-admin userRole
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userRole: "member", // Not in all_admin_roles
      userId: "test-user-id",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(getАгентыList).not.toHaveBeenCalled();
  });

  it("should not execute query when userRole is null", async () => {
    // Mock null userRole
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userRole: null,
      userId: "test-user-id",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(getАгентыList).not.toHaveBeenCalled();
  });

  it("should not execute query when userRole is empty string", async () => {
    // Mock empty string userRole
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userRole: "",
      userId: "test-user-id",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(getАгентыList).not.toHaveBeenCalled();
  });

  it("should not execute query when both accessТокен and userRole are missing", async () => {
    // Mock both auth values missing
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: null,
      userRole: null,
      userId: "test-user-id",
      token: null,
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Запрос should not execute
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetched).toBe(false);

    // API should not be called
    expect(getАгентыList).not.toHaveBeenCalled();
  });

  it("should execute query when accessТокен is present and userRole is Admin", async () => {
    // Mock successful API call
    (getАгентыList as any).mockResolvedЗначение(mockАгентыОтвет);

    // Ensure auth values are set (already done in beforeEach)
    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Wait for query to execute
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getАгентыList).toHaveBeenCalledWith("test-access-token");
    expect(getАгентыList).toHaveBeenCalledВремяs(1);
  });

  it("should execute query when accessТокен is present and userRole is proxy_admin", async () => {
    // Mock successful API call
    (getАгентыList as any).mockResolvedЗначение(mockАгентыОтвет);

    // Mock proxy_admin role
    mockUseАвторизовано.mockReturnЗначение({
      accessТокен: "test-access-token",
      userRole: "proxy_admin",
      userId: "test-user-id",
      token: "test-token",
      userEmail: "test@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: null,
      showSSOBanner: false,
    });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Wait for query to execute
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getАгентыList).toHaveBeenCalledWith("test-access-token");
    expect(getАгентыList).toHaveBeenCalledВремяs(1);
  });

  it("should return empty agents array when API returns empty data", async () => {
    // Mock API returning empty agents array
    (getАгентыList as any).mockResolvedЗначение({ agents: [] });

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Wait for success
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ agents: [] });
    expect(getАгентыList).toHaveBeenCalledWith("test-access-token");
  });

  it("should handle network timeвыход error", async () => {
    const timeвыходОшибка = new Ошибка("Network timeвыход");

    // Mock network timeвыход
    (getАгентыList as any).mockRejectedЗначение(timeвыходОшибка);

    const { result } = renderHook(() => useАгенты(), { wrapper });

    // Wait for error
    await waitFor(() => {
      expect(result.current.isОшибка).toBe(true);
    });

    expect(result.current.error).toEqual(timeвыходОшибка);
    expect(result.current.data).toBeUndefined();
  });
});
