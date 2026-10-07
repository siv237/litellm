import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../../../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import CacheSettings from "./index";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";

const { getCacheSettingsCall, testCacheConnectionCall, updateCacheSettingsCall } = vi.hoisted(() => ({
  getCacheSettingsCall: vi.fn(),
  testCacheConnectionCall: vi.fn(),
  updateCacheSettingsCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getCacheSettingsCall,
  testCacheConnectionCall,
  updateCacheSettingsCall,
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

const LOADED_WITH_ADVANCED = {
  current_values: {
    host: "redis.internal",
    namespace: "prod-ns",
    ttl: "300",
    max_connections: "50",
    ssl: true,
  },
};

const renderSettings = () => renderWithProviders(<CacheSettings accessToken="sk-test" userRole="Admin" userID="u1" />);

const save = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

describe("CacheSettings Расширенные настройки round-trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCacheSettingsCall.mockResolvedValue(LOADED_WITH_ADVANCED);
    updateCacheSettingsCall.mockResolvedValue({ status: "success" });
    testCacheConnectionCall.mockResolvedValue({ status: "success" });
  });

  it("keeps loaded advanced values in the payload when the section is never opened", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("Настройки подключения");

    expect(screen.queryByLabelText("Пространство имён")).not.toBeInTheDocument();
    await save(user);

    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(1));
    expect(updateCacheSettingsCall.mock.calls[0][1]).toEqual({
      type: "redis",
      host: "redis.internal",
      port: "6379",
      ssl: true,
      ssl_check_hostname: false,
      namespace: "prod-ns",
      ttl: 300,
      max_connections: 50,
    });
  });

  it("reveals the advanced Поле sections only after the Пользователь expands them", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("Настройки подключения");
    expect(screen.queryByText("Настройки SSL")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Расширенные настройки" }));

    expect(await screen.findByText("Настройки SSL")).toBeInTheDocument();
    expect(screen.getByText("Cache Management")).toBeInTheDocument();
    expect(screen.getByText("GCP Аутентификация")).toBeInTheDocument();
  });

  it("sends the same payload whether or not the advanced section was expanded", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("Настройки подключения");
    await save(user);
    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(1));
    const whileCollapsed = updateCacheSettingsCall.mock.calls[0][1];

    await user.click(screen.getByText("Расширенные настройки"));
    await screen.findByLabelText("Пространство имён");
    await save(user);

    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(2));
    expect(updateCacheSettingsCall.mock.calls[1][1]).toEqual(whileCollapsed);
  });

  it("preserves a Значение typed into the advanced section after it is collapsed again", async () => {
    getCacheSettingsCall.mockResolvedValue({ current_values: { host: "redis.internal" } });
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("Настройки подключения");

    await user.click(screen.getByText("Расширенные настройки"));
    fireEvent.change(await screen.findByLabelText("Пространство имён"), { target: { value: "typed-ns" } });
    await user.click(screen.getByText("Расширенные настройки"));
    await waitFor(() => expect(screen.queryByLabelText("Пространство имён")).not.toBeInTheDocument());

    await save(user);

    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(1));
    expect(updateCacheSettingsCall.mock.calls[0][1]).toMatchObject({ namespace: "typed-ns" });
  });

  it("restores a Значение typed into the advanced section when it is expanded again", async () => {
    getCacheSettingsCall.mockResolvedValue({ current_values: { host: "redis.internal" } });
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("Настройки подключения");

    await user.click(screen.getByText("Расширенные настройки"));
    fireEvent.change(await screen.findByLabelText("Пространство имён"), { target: { value: "typed-ns" } });
    await user.click(screen.getByText("Расширенные настройки"));
    await waitFor(() => expect(screen.queryByLabelText("Пространство имён")).not.toBeInTheDocument());
    await user.click(screen.getByText("Расширенные настройки"));

    expect(await screen.findByLabelText("Пространство имён")).toHaveValue("typed-ns");
  });

  it("keeps a hidden section's fields out of the payload when the redis Тип does not use them", async () => {
    getCacheSettingsCall.mockResolvedValue({
      current_values: { redis_type: "sentinel", service_name: "mymaster", host: "redis.internal" },
    });
    const user = userEvent.setup();
    renderSettings();
    await screen.findByLabelText("Имя сервиса");
    await save(user);

    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(1));
    expect(updateCacheSettingsCall.mock.calls[0][1]).toMatchObject({ service_name: "mymaster" });
    expect(updateCacheSettingsCall.mock.calls[0][1]).not.toHaveProperty("redis_startup_nodes");
  });

  it("saves the semantic cache Область picked from the Выбрать and shows the loaded Значение", async () => {
    getCacheSettingsCall.mockResolvedValue({
      current_values: { redis_type: "semantic", host: "redis.internal", semantic_cache_scope: "Ключ" },
    });
    const user = userEvent.setup();
    renderSettings();
    const trigger = await screen.findByLabelText("Область семантического кэша");
    expect(trigger).toHaveTextContent("Ключ (общий для всех конечных пользователей ключа/команды/организации)");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Конечный пользователь (изоляция по пользователю)" }));
    await save(user);

    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(1));
    expect(updateCacheSettingsCall.mock.calls[0][1]).toMatchObject({
      type: "redis-semantic",
      semantic_cache_scope: "end_user",
    });
  });

  it("does not block the Сохранить on a malformed Значение inside a collapsed advanced section", async () => {
    getCacheSettingsCall.mockResolvedValue({ current_values: { host: "redis.internal" } });
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("Настройки подключения");

    await user.click(screen.getByText("Расширенные настройки"));
    fireEvent.change(await screen.findByLabelText("TTL (секунды)"), { target: { value: "not-a-number" } });
    await user.click(screen.getByText("Расширенные настройки"));
    await waitFor(() => expect(screen.queryByLabelText("TTL (секунды)")).not.toBeInTheDocument());

    await save(user);

    await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalledTimes(1));
    expect(updateCacheSettingsCall.mock.calls[0][1]).not.toHaveProperty("ttl");
  });

  it("should omit a cleared cache Модель from Сохранить and test while retaining other settings", async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValue([
      { model_group: "synthetic-embedding", mode: "embedding" },
    ] as Awaited<ReturnType<typeof fetchAvailableModels>>);
    getCacheSettingsCall.mockResolvedValue({
      current_values: {
        redis_type: "semantic",
        host: "localhost",
        redis_semantic_cache_embedding_model: "synthetic-embedding",
        password: "***REDACTED***",
        ttl: 0,
        ssl: false,
        namespace: "synthetic-cache",
      },
    });
    const user = userEvent.setup();
    renderSettings();
    await screen.findByRole("combobox", { name: "Модель эмбеддингов" });
    await user.click(screen.getByRole("button", { name: "Clear" }));
    const expected = {
      type: "redis",
      host: "localhost",
      port: "6379",
      similarity_threshold: 0.8,
      semantic_cache_scope: "Ключ",
      ssl: false,
      ssl_check_hostname: false,
      ttl: 0,
      namespace: "synthetic-cache",
    };
    await user.click(screen.getByRole("button", { name: "Test Подключение" }));
    await waitFor(() => expect(testCacheConnectionCall).toHaveBeenCalledWith("sk-test", expected));
    await save(user);
    await waitFor(() =>
      expect(updateCacheSettingsCall).toHaveBeenCalledWith("sk-test", { ...expected, type: "redis-semantic" }),
    );
  });
});
