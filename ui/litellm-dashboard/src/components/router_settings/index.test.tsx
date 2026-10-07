import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import RouterSettings from "./index";

// The strategy select only renders once getRouterSettingsCall resolves, so awaiting it is how a
// test knows the loaded settings are on screen.
const findStrategySelect = () => screen.findByRole("combobox");

vi.mock("@/components/networking", () => ({
  getCallbacksCall: vi.fn(),
  getRouterSettingsCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

import { getCallbacksCall, getRouterSettingsCall, setCallbacksCall } from "@/components/networking";
import { toast } from "@/lib/toast";

const mockCallbacksResponse = {
  router_settings: {
    routing_strategy: "simple-shuffle",
    num_retries: 3,
    timeout: 30,
  },
};

const mockRouterSettingsResponse = {
  fields: [
    {
      field_name: "routing_strategy",
      ui_field_name: "Стратегия маршрутизации",
      field_description: "How requests are distributed",
      options: ["simple-shuffle", "latency-based-Маршрутизация"],
      link: null,
    },
    {
      field_name: "enable_tag_filtering",
      ui_field_name: "Tag Filtering",
      field_description: "Route by tag",
      field_value: false,
      link: null,
    },
  ],
  routing_strategy_descriptions: {
    "simple-shuffle": "Randomly pick a deployment",
    "latency-based-Маршрутизация": "Pick the lowest-latency deployment",
  },
};

const defaultProps = {
  accessToken: "test-Токен",
  userRole: "Admin",
  userID: "Пользователь-1",
  modelData: null,
};

describe("RouterSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCallbacksCall).mockResolvedValue(mockCallbacksResponse);
    vi.mocked(getRouterSettingsCall).mockResolvedValue(mockRouterSettingsResponse);
    vi.mocked(setCallbacksCall).mockResolvedValue({});
  });

  it("should render nothing when accessToken is null", () => {
    const { container } = renderWithProviders(<RouterSettings {...defaultProps} accessToken={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the Сохранить изменения and Сброс buttons when authenticated", () => {
    renderWithProviders(<RouterSettings {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Сохранить изменения/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Сброс/i })).toBeInTheDocument();
  });

  it("should fetch callbacks and router settings on mount", async () => {
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await waitFor(() => {
      expect(getCallbacksCall).toHaveBeenCalledWith("test-Токен", "Пользователь-1", "Admin");
    });
    expect(getRouterSettingsCall).toHaveBeenCalledWith("test-Токен");
  });

  it("should not fetch data when any Обязательно prop is missing", () => {
    renderWithProviders(<RouterSettings {...defaultProps} userRole={null} />);
    expect(getCallbacksCall).not.toHaveBeenCalled();
  });

  it("should render Маршрутизация strategies loaded from the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await user.click(await findStrategySelect());

    expect(await screen.findByRole("option", { name: /simple-shuffle/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /latency-based-Маршрутизация/ })).toBeInTheDocument();
  });

  it("should call setCallbacksCall with Обновлён settings on Сохранить изменения", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategySelect();

    await user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));

    expect(setCallbacksCall).toHaveBeenCalledWith(
      "test-Токен",
      expect.objectContaining({
        router_settings: expect.objectContaining({
          routing_strategy: "simple-shuffle",
        }),
      }),
    );
  });

  it("should Отправить the edited Вход Значение, not the loaded one, on Сохранить изменения", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategySelect();

    const numRetries = await screen.findByRole("textbox", { name: /num_retries/i });
    await user.clear(numRetries);
    fireEvent.change(numRetries, { target: { value: "42" } });

    await user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));

    await waitFor(() =>
      expect(setCallbacksCall).toHaveBeenCalledWith(
        "test-Токен",
        expect.objectContaining({
          router_settings: expect.objectContaining({ num_retries: 42 }),
        }),
      ),
    );
  });

  it("should show a success notification after saving", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategySelect();
    await user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));

    expect(toast.success).toHaveBeenCalledWith("Настройки маршрутизации обновлены");
  });

  it("should not render or Сохранить routing_groups (owned by the Маршрутизация Groups tab)", async () => {
    const user = userEvent.setup();
    vi.mocked(getCallbacksCall).mockResolvedValue({
      router_settings: {
        routing_strategy: "simple-shuffle",
        num_retries: 3,
        routing_groups: [{ group_name: "g1", models: ["gpt-4"], routing_strategy: "simple-shuffle" }],
      },
    });
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategySelect();
    expect(document.querySelector('input[name="routing_groups"]')).toBeNull();

    await user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));

    await waitFor(() =>
      expect(setCallbacksCall).toHaveBeenCalledWith("test-Токен", {
        router_settings: expect.not.objectContaining({ routing_groups: expect.anything() }),
      }),
    );
  });

  it("should surface an Ошибка and not claim success when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(setCallbacksCall).mockRejectedValue(new Error("422 Unprocessable Entity"));
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategySelect();
    await user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalled();
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
