import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import RouterSettings from "./index";

// The strategy select only renders once getRouterSettingsCall resolves, so awaiting it is how a
// test knows the loaded settings are on screen.
const findStrategyВыбрать = () => screen.findByRole("combobox");

vi.mock("@/components/networking", () => ({
  getCallbacksCall: vi.fn(),
  getRouterSettingsCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

import { getCallbacksCall, getRouterSettingsCall, setCallbacksCall } from "@/components/networking";
import { toast } from "@/lib/toast";

const mockCallbacksОтвет = {
  router_settings: {
    routing_strategy: "simple-shuffle",
    num_retries: 3,
    timeвыход: 30,
  },
};

const mockRouterSettingsОтвет = {
  fields: [
    {
      field_name: "routing_strategy",
      ui_field_name: "Стратегия маршрутизации",
      field_description: "How requests are distributed",
      options: ["simple-shuffle", "latency-based-routing"],
      link: null,
    },
    {
      field_name: "enable_tag_filtering",
      ui_field_name: "Tag Фильтрing",
      field_description: "Route by tag",
      field_value: false,
      link: null,
    },
  ],
  routing_strategy_descriptions: {
    "simple-shuffle": "Randomly pick a deployment",
    "latency-based-routing": "Pick the lowest-latency deployment",
  },
};

const defaultProps = {
  accessТокен: "test-token",
  userRole: "Admin",
  userID: "user-1",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData: null,
};

describe("RouterSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCallbacksCall).mockResolvedЗначение(mockCallbacksОтвет);
    vi.mocked(getRouterSettingsCall).mockResolvedЗначение(mockRouterSettingsОтвет);
    vi.mocked(setCallbacksCall).mockResolvedЗначение({});
  });

  it("should render nothing when accessТокен is null", () => {
    const { container } = renderWithProviders(<RouterSettings {...defaultProps} accessТокен={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the Save Changes and Reset buttons when authenticated", () => {
    renderWithProviders(<RouterSettings {...defaultProps} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("should fetch callbacks and router settings on mount", async () => {
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await waitFor(() => {
      expect(getCallbacksCall).toHaveBeenCalledWith("test-token", "user-1", "Admin");
    });
    expect(getRouterSettingsCall).toHaveBeenCalledWith("test-token");
  });

  it("should not fetch data when any required prop is missing", () => {
    renderWithProviders(<RouterSettings {...defaultProps} userRole={null} />);
    expect(getCallbacksCall).not.toHaveBeenCalled();
  });

  it("should render routing strategies loaded from the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await user.click(await findStrategyВыбрать());

    expect(await screen.findByRole("option", { name: /simple-shuffle/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /latency-based-routing/ })).toBeInTheDocument();
  });

  it("should call setCallbacksCall with updated settings on Save Changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategyВыбрать();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(setCallbacksCall).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({
        router_settings: expect.objectContaining({
          routing_strategy: "simple-shuffle",
        }),
      }),
    );
  });

  it("should send the edited input value, not the loaded one, on Save Changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategyВыбрать();

    const numRetries = await screen.findByRole("textbox", { name: /num_retries/i });
    await user.clear(numRetries);
    fireEvent.change(numRetries, { target: { value: "42" } });

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(setCallbacksCall).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          router_settings: expect.objectContaining({ num_retries: 42 }),
        }),
      ),
    );
  });

  it("should show a success notification after saving", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategyВыбрать();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(toast.success).toHaveBeenCalledWith("router settings updated successfully");
  });

  it("should not render or save routing_groups (owned by the Маршрутизация Groups tab)", async () => {
    const user = userEvent.setup();
    vi.mocked(getCallbacksCall).mockResolvedЗначение({
      router_settings: {
        routing_strategy: "simple-shuffle",
        num_retries: 3,
        routing_groups: [{ group_name: "g1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], routing_strategy: "simple-shuffle" }],
      },
    });
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategyВыбрать();
    expect(document.querySelector('input[name="routing_groups"]')).toBeNull();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(setCallbacksCall).toHaveBeenCalledWith("test-token", {
        router_settings: expect.not.objectContaining({ routing_groups: expect.anything() }),
      }),
    );
  });

  it("should surface an error and not claim success when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(setCallbacksCall).mockRejectedЗначение(new Ошибка("422 Unprocessable Entity"));
    renderWithProviders(<RouterSettings {...defaultProps} />);

    await findStrategyВыбрать();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.fromОшибка).toHaveBeenCalled();
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
