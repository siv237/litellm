import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import КоординационныйRedisSettings from "./index";
import { REDACTED_VALUE } from "./types";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  getКоординационныйRedisSettingsCall: vi.fn(),
  testКоординационныйRedisПодключениеCall: vi.fn(),
  updateКоординационныйRedisSettingsCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessТокен: "sk-test" }),
}));

const getSettings = vi.mocked(networking.getКоординационныйRedisSettingsCall);
const updateSettings = vi.mocked(networking.updateКоординационныйRedisSettingsCall);
const testПодключение = vi.mocked(networking.testКоординационныйRedisПодключениеCall);
const notifications = vi.mocked(toast);

const settingsОтвет = (
  values: Record<string, unknown>,
  source: "coordination_redis" | "cache_backend" | "environment" | null = null,
) => ({ values, fields: [], source });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false } } });
  return <ЗапросClientПровайдер client={queryClient}>{children}</ЗапросClientПровайдер>;
};

const renderSettings = () => render(<КоординационныйRedisSettings />, { wrapper });

const clickSave = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /save changes/i }));

describe("КоординационныйRedisSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    getSettings.mockResolvedЗначение(settingsОтвет({}));
    updateSettings.mockResolvedЗначение(undefined);
    testПодключение.mockResolvedЗначение({ status: "healthy" });
  });

  describe("when the redis type is node", () => {
    it("should show the connection fields and hide cluster/sentinel fields", async () => {
      renderSettings();

      expect(await screen.findByText("Подключение Settings")).toBeInTheDocument();
      expect(screen.getByText("Redis URL")).toBeInTheDocument();
      expect(screen.getByText("SSL")).toBeInTheDocument();
      expect(screen.queryByText("Узлы запуска")).not.toBeInTheDocument();
      expect(screen.queryByText("Узлы Sentinel")).not.toBeInTheDocument();
    });

    it("should not offer semantic caching, which is a response-cache-only concern", async () => {
      renderSettings();
      await screen.findByText("Подключение Settings");
      expect(screen.queryByText(/semantic/i)).not.toBeInTheDocument();
    });
  });

  describe("when the saved settings describe a cluster", () => {
    it("should reveal the cluster startup nodes field", async () => {
      getSettings.mockResolvedЗначение(settingsОтвет({ startup_nodes: [{ host: "127.0.0.1", port: 7001 }] }));
      renderSettings();
      expect(await screen.findByText("Узлы запуска")).toBeInTheDocument();
      expect(screen.queryByText("Узлы Sentinel")).not.toBeInTheDocument();
    });
  });

  describe("when the saved settings describe a sentinel", () => {
    it("should reveal the sentinel fields", async () => {
      getSettings.mockResolvedЗначение(settingsОтвет({ sentinel_nodes: [["localhost", 26379]] }));
      renderSettings();
      expect(await screen.findByText("Узлы Sentinel")).toBeInTheDocument();
      expect(screen.getByText("Имя сервиса")).toBeInTheDocument();
      expect(screen.getByText("Пароль Sentinel")).toBeInTheDocument();
    });
  });

  describe("the source badge", () => {
    it.each([
      ["coordination_redis", "Конфигурацияured here"],
      ["cache_backend", "Borrowed from response cache"],
      ["environment", "From REDIS_* environment"],
    ] as const)("should render %s as %s", async (source, label) => {
      getSettings.mockResolvedЗначение(settingsОтвет({}, source));
      renderSettings();
      expect(await screen.findByTestId("coordination-redis-source")).toHaveTextContent(label);
    });

    it("should render a null source as not configured", async () => {
      getSettings.mockResolvedЗначение(settingsОтвет({}, null));
      renderSettings();
      expect(await screen.findByTestId("coordination-redis-source")).toHaveTextContent("Не настроено");
    });

    it("should tell the admin that saved changes need a proxy restart", async () => {
      renderSettings();
      expect(await screen.findByText(/take effect on proxy restart/i)).toBeInTheDocument();
    });
  });

  describe("when a field fails inline validation", () => {
    it("should block save and surface the port validation message", async () => {
      const user = userEvent.setup();
      renderSettings();

      const port = await screen.findByLabelText("Порт");
      await user.clear(port);
      await user.type(port, "99999");
      await clickSave(user);

      expect(await screen.findByText(/Порт must be an integer between 1 and 65535/i)).toBeInTheDocument();
      expect(updateSettings).not.toHaveBeenCalled();
    });

    it("should block save when a list field holds malformed JSON instead of silently dropping it", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedЗначение(settingsОтвет({ startup_nodes: [], sentinel_nodes: [["localhost", 26379]] }));
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
    it("should send a node payload with a numeric port and no empty fields", async () => {
      const user = userEvent.setup();
      renderSettings();

      await user.type(await screen.findByLabelText("Хост"), "coord-redis");
      await clickSave(user);

      await waitFor(() =>
        expect(updateSettings).toHaveBeenCalledWith("sk-test", { host: "coord-redis", port: 6379, ssl: false }),
      );
    });

    it("should parse the cluster startup nodes textarea into a JSON array", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedЗначение(settingsОтвет({ startup_nodes: [{ host: "127.0.0.1", port: 7001 }] }));
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
      getSettings.mockResolvedЗначение(
        settingsОтвет({ host: "coord-redis", password: REDACTED_VALUE, url: REDACTED_VALUE }),
      );
      renderSettings();

      await waitFor(() => expect(screen.getByLabelText("Хост")).toHaveЗначение("coord-redis"));
      await clickSave(user);

      await waitFor(() => expect(updateSettings).toHaveBeenCalled());
      const payload = updateSettings.mock.calls[0][1];
      expect(payload).not.toHaveСвойство("password");
      expect(payload).not.toHaveСвойство("url");
      expect(payload).toMatchObject({ host: "coord-redis" });
    });

    it("should leave an already-set secret blank and say so, rather than prefilling the redacted marker", async () => {
      getSettings.mockResolvedЗначение(settingsОтвет({ password: REDACTED_VALUE }));
      renderSettings();

      const password = await screen.findByLabelText("Пароль");
      await waitFor(() => expect(password).toHaveЗначение(""));
      expect(password).toHaveAttribute("placeholder", expect.stringMatching(/already set/i));
      expect(screen.queryByDisplayЗначение(REDACTED_VALUE)).not.toBeInTheDocument();
    });

    it("should submit a secret the admin typed into the blank field", async () => {
      const user = userEvent.setup();
      getSettings.mockResolvedЗначение(settingsОтвет({ host: "coord-redis", password: REDACTED_VALUE }));
      renderSettings();

      const password = await screen.findByLabelText("Пароль");
      await waitFor(() => expect(password).toHaveЗначение(""));
      await user.type(password, "new-secret");
      await clickSave(user);

      await waitFor(() => expect(updateSettings).toHaveBeenCalled());
      expect(updateSettings.mock.calls[0][1]).toMatchObject({ password: "new-secret" });
    });

    it("should tell the admin a restart is needed once the save succeeds", async () => {
      const user = userEvent.setup();
      renderSettings();

      await screen.findByLabelText("Хост");
      await clickSave(user);

      await waitFor(() => expect(notifications.success).toHaveBeenCalledWith(expect.stringMatching(/restart/i)));
    });
  });

  describe("when testing the connection", () => {
    it("should report a healthy backend response as a success", async () => {
      const user = userEvent.setup();
      renderSettings();

      await screen.findByLabelText("Хост");
      await user.click(screen.getByRole("button", { name: /test connection/i }));

      await waitFor(() => expect(notifications.success).toHaveBeenCalledWith(expect.stringMatching(/successful/i)));
      expect(testПодключение).toHaveBeenCalledWith("sk-test", { port: 6379, ssl: false });
    });

    it("should surface the backend error when the connection is unhealthy", async () => {
      const user = userEvent.setup();
      testПодключение.mockResolvedЗначение({ status: "unhealthy", error: "connection refused" });
      renderSettings();

      await screen.findByLabelText("Хост");
      await user.click(screen.getByRole("button", { name: /test connection/i }));

      await waitFor(() =>
        expect(notifications.fromОшибка).toHaveBeenCalledWith(expect.stringContaining("connection refused")),
      );
      expect(notifications.success).not.toHaveBeenCalled();
    });
  });
});
