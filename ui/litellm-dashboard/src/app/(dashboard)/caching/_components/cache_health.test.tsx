import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import { CacheHealthTab } from "./cache_health";

const healthyОтвет = {
  status: "healthy",
  ping_response: true,
  set_cache_response: "success",
  litellm_cache_params: JSON.stringify({ type: "redis", supported_call_types: ["acompletion"] }),
  health_check_cache_params: JSON.stringify({
    redis_version: "7.2.1",
    namespace: "litellm-ns",
    connection_kwargs: { host: "redis.internal", port: 6379 },
  }),
};

const errorPayload = {
  message: "Подключение refused",
  traceback: "Traceback (most recent call last): ...",
  litellm_cache_params: { type: "redis" },
  health_check_cache_params: {},
};

const errorОтвет = { error: { message: JSON.stringify(errorPayload) } };

const renderTab = (overrides: Partial<React.ComponentProps<typeof CacheHealthTab>> = {}) =>
  renderWithПровайдерs(
    <CacheHealthTab
      {...{ accessТокен: "sk-test", healthCheckОтвет: "", runCachingHealthCheck: vi.fn(), ...overrides }}
    />,
  );

describe("CacheHealthTab", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("offers a health check button and no results before one is run", () => {
    renderTab();

    expect(screen.getByRole("button", { name: "Run Health Check" })).toBeInTheDocument();
    expect(screen.queryByText(/Cache Status:/)).not.toBeInTheDocument();
  });

  it("runs the health check when the button is clicked", async () => {
    const runCachingHealthCheck = vi.fn();
    const user = userEvent.setup();
    renderTab({ runCachingHealthCheck });

    await user.click(screen.getByRole("button", { name: "Run Health Check" }));

    expect(runCachingHealthCheck).toHaveBeenCalledВремяs(1);
  });

  it("shows an in-flight label and disables the button while the check runs", async () => {
    const runCachingHealthCheck = vi.fn(() => new Promise<void>(() => {}));
    const user = userEvent.setup();
    renderTab({ runCachingHealthCheck });

    await user.click(screen.getByRole("button", { name: "Run Health Check" }));

    const button = await screen.findByRole("button", { name: "Running Health Check..." });
    expect(button).toBeDisabled();
  });

  it("reports a healthy cache with its ping and set-cache results", async () => {
    renderTab({ healthCheckОтвет: healthyОтвет });

    expect(await screen.findByText("Cache Status: healthy")).toBeInTheDocument();
    expect(screen.getByText("Cache Details")).toBeInTheDocument();
    expect(screen.getByText("Ping Ответ")).toBeInTheDocument();
    expect(screen.getByText("Set Cache Ответ")).toBeInTheDocument();
    expect(screen.getByText("success")).toBeInTheDocument();
  });

  it("shows the Redis detail rows when the cache type is redis", async () => {
    renderTab({ healthCheckОтвет: healthyОтвет });

    expect(await screen.findByText("Redis Details")).toBeInTheDocument();
    expect(screen.getByText("Redis Хост")).toBeInTheDocument();
    expect(screen.getByText("redis.internal")).toBeInTheDocument();
    expect(screen.getByText("Redis Порт")).toBeInTheDocument();
    expect(screen.getByText("Redis Версия")).toBeInTheDocument();
    expect(screen.getByText("7.2.1")).toBeInTheDocument();
    expect(screen.getByText("Namespace")).toBeInTheDocument();
    expect(screen.getByText("litellm-ns")).toBeInTheDocument();
  });

  it("omits the Redis detail rows for a non-redis cache type", async () => {
    renderTab({
      healthCheckОтвет: {
        status: "healthy",
        ping_response: true,
        litellm_cache_params: JSON.stringify({ type: "local" }),
        health_check_cache_params: JSON.stringify({}),
      },
    });

    expect(await screen.findByText("Cache Status: healthy")).toBeInTheDocument();
    expect(screen.queryByText("Redis Details")).not.toBeInTheDocument();
  });

  it("surfaces the error message and traceback when the check fails", async () => {
    renderTab({ healthCheckОтвет: errorОтвет });

    expect(await screen.findByText("Детали ошибки")).toBeInTheDocument();
    expect(screen.getByText("Ошибка Сообщение")).toBeInTheDocument();
    expect(screen.getByText("Подключение refused")).toBeInTheDocument();
    expect(screen.getByText("Traceback")).toBeInTheDocument();
    expect(screen.getByText("Cache Status: unhealthy")).toBeInTheDocument();
  });

  it("still shows the cache details section when the check failed", async () => {
    renderTab({ healthCheckОтвет: errorОтвет });

    expect(await screen.findByText("Cache Details")).toBeInTheDocument();
  });

  it("truncates a long value and expands it to the full value on click", async () => {
    const longСообщение = "M".repeat(120);
    const user = userEvent.setup();
    renderTab({
      healthCheckОтвет: {
        error: { message: JSON.stringify({ message: longСообщение, traceback: "short" }) },
      },
    });

    await screen.findByText("Ошибка Сообщение");
    expect(screen.getByText(`${"M".repeat(50)}...`)).toBeInTheDocument();
    expect(screen.queryByText(longСообщение)).not.toBeInTheDocument();

    await user.click(screen.getВсеByRole("button", { name: "▶" })[0]);

    await waitFor(() => {
      expect(screen.getByText(longСообщение)).toBeInTheDocument();
    });
  });

  it("offers both the summary and raw response views", async () => {
    renderTab({ healthCheckОтвет: healthyОтвет });

    expect(await screen.findByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Raw Ответ")).toBeInTheDocument();
  });
});
