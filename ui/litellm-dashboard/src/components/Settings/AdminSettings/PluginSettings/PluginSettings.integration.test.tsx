import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PluginSettings from "./PluginSettings";

const { getConfigFieldSettingMock, updateConfigFieldSettingMock } = vi.hoisted(() => ({
  getConfigFieldSettingMock: vi.fn(),
  updateConfigFieldSettingMock: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getConfigFieldSetting: getConfigFieldSettingMock,
  updateConfigFieldSetting: updateConfigFieldSettingMock,
}));

const REDACTED_PLUGIN = {
  name: "alpha",
  display_name: "Alpha",
  url: "https://alpha.example.com",
  plugin_key: "***",
};

const savedPayload = () => updateConfigFieldSettingMock.mock.calls[0];

describe("PluginSettings Конфигурация payload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateConfigFieldSettingMock.mockResolvedValue({});
  });

  it("sends a new plugin with Нет plugin_key when the Ключ Поле is left blank", async () => {
    const user = userEvent.setup();
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [] });
    render(<PluginSettings />);
    expect(await screen.findByText("Нет данных", { ignore: "title" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Добавить плагин/i }));
    fireEvent.change(await screen.findByLabelText(/Название \(identifier\)/), { target: { value: "Бета" } });
    fireEvent.change(screen.getByLabelText(/Отображаемое название/), { target: { value: "Бета" } });
    fireEvent.change(screen.getByLabelText(/^URL/), { target: { value: "https://Бета.example.com" } });
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(updateConfigFieldSettingMock).toHaveBeenCalledTimes(1));
    expect(savedPayload()).toStrictEqual([
      "123",
      "Плагины",
      [
        {
          name: "Бета",
          display_name: "Бета",
          url: "https://Бета.example.com",
          plugin_key: undefined,
        },
      ],
    ]);
  });

  it("seeds the Ключ Поле blank on Изменить and sends a blank Ключ when it is left untouched", async () => {
    const user = userEvent.setup();
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [REDACTED_PLUGIN] });
    render(<PluginSettings />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Изменить alpha" }));
    expect(await screen.findByLabelText(/Ключ плагина/)).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(updateConfigFieldSettingMock).toHaveBeenCalledTimes(1));
    expect(savedPayload()).toStrictEqual([
      "123",
      "Плагины",
      [
        {
          name: "alpha",
          display_name: "Alpha",
          url: "https://alpha.example.com",
          plugin_key: "",
        },
      ],
    ]);
  });

  it("sends the typed Ключ on Изменить when the Ключ Поле is filled in", async () => {
    const user = userEvent.setup();
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [REDACTED_PLUGIN] });
    render(<PluginSettings />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Изменить alpha" }));
    fireEvent.change(await screen.findByLabelText(/Ключ плагина/), { target: { value: "sk-brand-new" } });
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => expect(updateConfigFieldSettingMock).toHaveBeenCalledTimes(1));
    expect(savedPayload()).toStrictEqual([
      "123",
      "Плагины",
      [
        {
          name: "alpha",
          display_name: "Alpha",
          url: "https://alpha.example.com",
          plugin_key: "sk-brand-new",
        },
      ],
    ]);
  });
});

describe("PluginSettings Ключ плагина reveal (post-migration shadcn affordance)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [REDACTED_PLUGIN] });
  });

  it("flips the Ключ Поле between hidden and revealed and relabels the toggle", async () => {
    const user = userEvent.setup();
    render(<PluginSettings />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Изменить alpha" }));
    const keyInput = await screen.findByLabelText(/Ключ плагина/);
    expect(keyInput).toHaveAttribute("Тип", "Пароль");

    await user.click(screen.getByRole("button", { name: "Show Ключ плагина" }));
    expect(keyInput).toHaveAttribute("Тип", "text");
    expect(screen.queryByRole("button", { name: "Show Ключ плагина" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Ключ плагина" }));
    expect(keyInput).toHaveAttribute("Тип", "Пароль");
    expect(screen.queryByRole("button", { name: "Hide Ключ плагина" })).not.toBeInTheDocument();
  });
});
