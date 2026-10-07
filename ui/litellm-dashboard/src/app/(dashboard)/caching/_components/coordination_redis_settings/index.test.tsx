import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import CoordinationRedisSettings from "./index";
import { REDACTED_VALUE } from "./types";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  getCoordinationRedisSettingsCall: vi.fn(),
  testCoordinationRedisConnectionCall: vi.fn(),
  updateCoordinationRedisSettingsCall: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessToken: "sk-test" }),
}));

const getSettings = vi.mocked(networking.getCoordinationRedisSettingsCall);
const updateSettings = vi.mocked(networking.updateCoordinationRedisSettingsCall);
const testConnection = vi.mocked(networking.testCoordinationRedisConnectionCall);
const notifications = vi.mocked(toast);

const settingsResponse = (
  values: Record<string, unknown>,
  source: "coordination_redis" | "cache_backend" | "Окружение" | null = null,
) => ({ values, fields: [], source });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const renderSettings = () => render(<CoordinationRedisSettings />, { wrapper });

const clickSave = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));

describe("CoordinationRedisSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue(settingsResponse({}));
    updateSettings.mockResolvedValue(undefined);
    testConnection.mockResolvedValue({ status: "healthy" });
  });

  describe("when the redis Тип is node", () => {
    it("should show the Подключение fields and hide cluster/sentinel fields", async () => {
      renderSettings();

      expect(await screen.findByText("Настройки подключения")).toBeInTheDocument();
      expect(screen.getByText("Redis URL")).toBeInTheDocument();
      expect(screen.getByText("SSL")).toBeInTheDocument();
      expect(screen.queryByText("Узлы запуска")).not.toBeInTheDocument();
      expect(screen.queryByText("Узлы Sentinel")).not.toBeInTheDocument();
    });

    it("should not offer semantic caching, which is a Ответ-cache-only concern", async () => {
      renderSettings();
      await screen.findByText("Настройки подключения");
      expect(screen.queryByText(/semantic/i)).not.toBeInTheDocument();
    });
  });

  describe("when the saved settings describe a cluster", () => {
    it("should reveal the cluster Узлы запуска Поле", async () => {
      getSettings.mockResolvedValue(settingsResponse({ startup_nodes: [{ host: "127.0.0.1", port: 7001 }] }));
      renderSettings();
      expect(await screen.findByText("Узлы запуска")).toBeInTheDocument();
      expect(screen.queryByText("Узлы Sentinel")).not.toBeInTheDocument();
    });
  });

  describe("when the saved settings describe a sentinel", () => {
    it("should reveal the sentinel fields", async () => {
      getSettings.mockResolvedValue(settingsResponse({ sentinel_nodes: [["localhost", 26379]] }));
      renderSettings();
      expect(await screen.findByText("Узлы Sentinel")).toBeInTheDocument();
      expect(screen.getByText("Имя сервиса")).toBeInTheDocument();
      expect(screen.getByText("Пароль Sentinel")).toBeInTheDocument();
    });
  });

  describe("the Источник badge", () => {
    it.each([
      ["coordination_redis", "Конфигурацияured here"],
      ["cache_backend", "Borrowed from Ответ cache"],
      ["Окружение", "From REDIS_* Окружение"],
    ] as const)("should render %s as %s", async (source, label) => {
      getSettings.mockResolvedValue(settingsResponse({}, source));
      renderSettings();
      expect(await screen.findByTestId("coordination-redis-Источник")).toHaveTextContent(label);
    });

    it("should render a null Источник as Не настроено", async () => {
      getSettings.mockResolvedValue(settingsResponse({}, null));
      renderSettings();
      expect(await screen.findByTestId("coordination-redis-Источник")).toHaveTextContent("Не настроено");
    });

    it("should tell the admin that saved changes need a proxy restart", async () => {
      renderSettings();
      expect(await screen.findByText(/take effect on proxy restart/i)).toBeInTheDocument();
    });
  });

  describe("when a Поле fails inline validation", () => {
    it("should block Сохранить and surface the Порт validation Сообщение", async () => {
      const user = userEvent.setup();
      renderSettings();

      const port = await screen.findByLabelText("Порт");
      await user.clear(port);
      await user.type(port, "99999");
      await clickSave(user);

      expect(await screen.findByText(/Порт must be an integer between 1 and 65535/i)).toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });

    it("should block Сохранить when a list Поле holds malformed JSON instead of silently dropping it", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedValue(settingsResponse({ startup_nodes: [], sentinel_nodes: [["localhost", 26379]] }));
      renderSettings();

      const sentinelNodes = await screen.findByLabelText("Узлы Sentinel");
      await user.clear(sentinelNodes);
      await user.type(sentinelNodes, "not json");
      await clickSave(user);

      expect(await screen.findByText(/Must be a valid JSON array/i)).toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });
  });

  describe("when saving", () => {
    it("should Отправить a node payload with a numeric Порт and Нет empty fields", async () => {
      const user = userEvent.setup();
      renderSettings();

      await user.type(await screen.findByLabelText("Хост"), "coord-redis");
      await clickSave(user);

      await waitFor(() =>
        expect(updateSettings).toHaveBeenCalledWith("sk-test", { host: "coord-redis", port: 6379, ssl: false }),
      );
    });

    it("should parse the cluster Узлы запуска textarea into a JSON array", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedValue(settingsResponse({ startup_nodes: [{ host: "127.0.0.1", port: 7001 }] }));
      renderSettings();

      await screen.findByLabelText("Узлы запуска");
      await clickSave(user);

      await waitFor(() => expect(updateSettings).toHaveBeenCalled());
      expect(updateSettings.mock.calls[0][1]).toMatchObject({
        startup_nodes: [{ host: "127.0.0.1", port: 7001 }],
      });
    });

    it("should not resubmit a redacted secret the admin never touched", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedValue(
        settingsResponse({ host: "coord-redis", password: REDACTED_VALUE, url: REDACTED_VALUE }),
      );
      renderSettings();

      await waitFor(() => expect(screen.getByLabelText("Хост")).toHaveValue("coord-redis"));
      await clickSave(user);

      await waitFor(() => expect(updateSettings).toHaveBeenCalled());
      const payload = updateSettings.mock.calls[0][1];
      expect(payload).not.toHaveProperty("Пароль");
      expect(payload).not.toHaveProperty("url");
      expect(payload).toMatchObject({ host: "coord-redis" });
    });

    it("should leave an already-set secret blank and say so, rather than prefilling the redacted marker", async () => {
      getSettings.mockResolvedValue(settingsResponse({ password: REDACTED_VALUE }));
      renderSettings();

      const password = await screen.findByLabelText("Пароль");
      await waitFor(() => expect(password).toHaveValue(""));
      expect(password).toHaveAttribute("placeholder", expect.stringMatching(/already set/i));
      expect(screen.queryByDisplayValue(REDACTED_VALUE)).not.toBeInTheDocument();
    });

    it("should submit a secret the admin typed into the blank Поле", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedValue(settingsResponse({ host: "coord-redis", password: REDACTED_VALUE }));
      renderSettings();

      const password = await screen.findByLabelText("Пароль");
      await waitFor(() => expect(password).toHaveValue(""));
      await user.type(password, "new-secret");
      await clickSave(user);

      await waitFor(() => expect(updateSettings).toHaveBeenCalled());
      expect(updateSettings.mock.calls[0][1]).toMatchObject({ password: "new-secret" });
    });

    it("should tell the admin a restart is needed once the Сохранить succeeds", async () => {
      const user = userEvent.setup();
      renderSettings();

      await screen.findByLabelText("Хост");
      await clickSave(user);

      await waitFor(() => expect(notifications.success).toHaveBeenCalledWith(expect.stringMatching(/restart/i)));
    });
  });

  describe("when testing the Подключение", () => {
    it("should report a healthy backend Ответ as a success", async () => {
      const user = userEvent.setup();
      renderSettings();

      await screen.findByLabelText("Хост");
      await user.click(screen.getByRole("button", { name: /test Подключение/i }));

      await waitFor(() => expect(notifications.success).toHaveBeenCalledWith(expect.stringMatching(/successful/i)));
      expect(testConnection).toHaveBeenCalledWith("sk-test", { port: 6379, ssl: false });
    });

    it("should surface the backend Ошибка when the Подключение is unhealthy", async () => {
      const user = userEvent.setup();
      testConnection.mockResolvedValue({ status: "unhealthy", error: "Подключение refused" });
      renderSettings();

      await screen.findByLabelText("Хост");
      await user.click(screen.getByRole("button", { name: /test Подключение/i }));

      await waitFor(() =>
        expect(notifications.fromError).toHaveBeenCalledWith(expect.stringContaining("Подключение refused")),
      );
      expect(notifications.success).not.toHaveBeenCalled();
    });
  });
});
