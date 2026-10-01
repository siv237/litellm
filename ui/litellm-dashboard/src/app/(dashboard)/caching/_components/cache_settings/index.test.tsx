import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CacheSettings from "./index";

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

const renderSettings = () => render(<CacheSettings accessToken="sk-test" userRole="Admin" userID="u1" />);

describe("CacheSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCacheSettingsCall.mockResolvedValue({ current_values: {} });
    updateCacheSettingsCall.mockResolvedValue({ status: "success" });
    testCacheConnectionCall.mockResolvedValue({ status: "success" });
  });

  it("should render the connection fields once current values load", async () => {
    renderSettings();
    expect(await screen.findByText("Настройки соединения")).toBeInTheDocument();
  });

  describe("when the redis type is node", () => {
    it("should show the connection fields and hide cluster/sentinel/semantic fields", async () => {
      renderSettings();

      expect(await screen.findByText("Redis URL")).toBeInTheDocument();
      expect(screen.getByText("Индекс базы данных")).toBeInTheDocument();
      expect(screen.queryByText("Startup-узлы")).not.toBeInTheDocument();
      expect(screen.queryByText("Узлы Sentinel")).not.toBeInTheDocument();
      expect(screen.queryByText("Модель эмбеддингов")).not.toBeInTheDocument();
    });
  });

  describe("when the redis type is cluster", () => {
    it("should reveal the cluster startup nodes field", async () => {
      getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "cluster" } });
      renderSettings();
      expect(await screen.findByText("Startup-узлы")).toBeInTheDocument();
    });
  });

  describe("when the redis type is sentinel", () => {
    it("should reveal the sentinel fields", async () => {
      getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "sentinel" } });
      renderSettings();
      expect(await screen.findByText("Узлы Sentinel")).toBeInTheDocument();
      expect(screen.getByText("Имя сервиса")).toBeInTheDocument();
    });
  });

  describe("when the redis type is semantic", () => {
    it("should reveal the semantic fields", async () => {
      getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "semantic" } });
      renderSettings();
      expect(await screen.findByText("Порог схожести")).toBeInTheDocument();
      expect(screen.getByText("Модель эмбеддингов")).toBeInTheDocument();
    });
  });

  describe("when a field fails inline validation", () => {
    it("should block save and surface the validation message", async () => {
      const user = userEvent.setup();
      renderSettings();

      const port = await screen.findByLabelText("Порт");
      await user.clear(port);
      fireEvent.change(port, { target: { value: "99999" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      expect(await screen.findByText(/Порт — целое число от 1 до 65535/i)).toBeInTheDocument();
      expect(updateCacheSettingsCall).not.toHaveBeenCalled();
    });

    it("should block save when a list field holds malformed JSON instead of silently dropping it", async () => {
      const user = userEvent.setup();
      getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "cluster" } });
      renderSettings();

      const startupNodes = await screen.findByLabelText("Startup-узлы");
      fireEvent.change(startupNodes, { target: { value: "not json" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      expect(await screen.findByText(/корректный JSON-массив/i)).toBeInTheDocument();
      expect(updateCacheSettingsCall).not.toHaveBeenCalled();
    });

    it("should block save with an error when a non-numeric value is entered into a numeric field", async () => {
      const user = userEvent.setup();
      renderSettings();

      const db = await screen.findByLabelText("Индекс базы данных");
      fireEvent.change(db, { target: { value: "redis://host:6379/1" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      expect(await screen.findByText(/Должно быть целым неотрицательным числом/i)).toBeInTheDocument();
      expect(updateCacheSettingsCall).not.toHaveBeenCalled();
    });
  });

  describe("when saving a valid node configuration", () => {
    it("should send the backend payload shape with type redis and no UI-only fields", async () => {
      const user = userEvent.setup();
      renderSettings();

      const host = await screen.findByLabelText("Хост");
      fireEvent.change(host, { target: { value: "localhost" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() =>
        expect(updateCacheSettingsCall).toHaveBeenCalledWith("sk-test", {
          type: "redis",
          host: "localhost",
          port: "6379",
          ssl: false,
          ssl_check_hostname: false,
        }),
      );
    });

    it("should include a numeric field like Индекс базы данных in the save payload", async () => {
      const user = userEvent.setup();
      renderSettings();

      fireEvent.change(await screen.findByLabelText("Redis URL"), { target: { value: "redis://host:6379/1" } });
      fireEvent.change(await screen.findByLabelText("Индекс базы данных"), { target: { value: "2" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() => expect(updateCacheSettingsCall).toHaveBeenCalled());
      expect(updateCacheSettingsCall.mock.calls[0][1]).toMatchObject({ db: 2, url: "redis://host:6379/1" });
    });
  });
});
