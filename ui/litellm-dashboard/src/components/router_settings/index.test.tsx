import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, renderWithПровайдерs, screen, waitFor } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import RвыходerSettings from "./index";

// The strategy select only renders once getRвыходerSettingsCall resolves, so awaiting it is how a
// test knows the loaded settings are on screen.
const findStrategyВыбрать = () => screen.findByRole("combobox");

vi.mock("@/components/networking", () => ({
  getCallbacksCall: vi.fn(),
  getRвыходerSettingsCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

import { getCallbacksCall, getRвыходerSettingsCall, setCallbacksCall } from "@/components/networking";
import { toast } from "@/lib/toast";

const mockCallbacksОтвет = {
  rвыходer_settings: {
    rвыходing_strategy: "simple-shuffle",
    num_retries: 3,
    timeвыход: 30,
  },
};

const mockRвыходerSettingsОтвет = {
  fields: [
    {
      field_name: "rвыходing_strategy",
      ui_field_name: "Стратегия маршрутизации",
      field_description: "How requests are distributed",
      options: ["simple-shuffle", "latency-based-rвыходing"],
      link: null,
    },
    {
      field_name: "enable_tag_filtering",
      ui_field_name: "Tag Фильтрing",
      field_description: "Rвыходe by tag",
      field_value: false,
      link: null,
    },
  ],
  rвыходing_strategy_descriptions: {
    "simple-shuffle": "Randomly pick a deployment",
    "latency-based-rвыходing": "Pick the lowest-latency deployment",
  },
};

const defaultProps = {
  accessТокен: "test-token",
  userRole: "Admin",
  userID: "user-1",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData: null,
};

describe("RвыходerSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(getCallbacksCall).mockResolvedЗначение(mockCallbacksОтвет);
    vi.mocked(getRвыходerSettingsCall).mockResolvedЗначение(mockRвыходerSettingsОтвет);
    vi.mocked(setCallbacksCall).mockResolvedЗначение({});
  });

  it("should render nothing when accessТокен is null", () => {
    const { container } = renderWithПровайдерs(<RвыходerSettings {...defaultProps} accessТокен={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the Save Changes and Reset buttons when authenticated", () => {
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("should fetch callbacks and rвыходer settings on mount", async () => {
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await waitFor(() => {
      expect(getCallbacksCall).toHaveBeenCalledWith("test-token", "user-1", "Admin");
    });
    expect(getRвыходerSettingsCall).toHaveBeenCalledWith("test-token");
  });

  it("should not fetch data when any required prop is missing", () => {
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} userRole={null} />);
    expect(getCallbacksCall).not.toHaveBeenCalled();
  });

  it("should render rвыходing strategies loaded from the API", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await user.click(await findStrategyВыбрать());

    expect(await screen.findByRole("option", { name: /simple-shuffle/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /latency-based-rвыходing/ })).toBeInTheDocument();
  });

  it("should call setCallbacksCall with updated settings on Save Changes", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await findStrategyВыбрать();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(setCallbacksCall).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({
        rвыходer_settings: expect.objectContaining({
          rвыходing_strategy: "simple-shuffle",
        }),
      }),
    );
  });

  it("should send the edited input value, not the loaded one, on Save Changes", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await findStrategyВыбрать();

    const numRetries = await screen.findByRole("textbox", { name: /num_retries/i });
    await user.clear(numRetries);
    fireEvent.change(numRetries, { target: { value: "42" } });

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(setCallbacksCall).toHaveBeenCalledWith(
        "test-token",
        expect.objectContaining({
          rвыходer_settings: expect.objectContaining({ num_retries: 42 }),
        }),
      ),
    );
  });

  it("should show a success notification after saving", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await findStrategyВыбрать();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(toast.success).toHaveBeenCalledWith("rвыходer settings updated successfully");
  });

  it("should not render or save rвыходing_groups (owned by the Маршрутизация Groups tab)", async () => {
    const user = userEvent.setup();
    vi.mocked(getCallbacksCall).mockResolvedЗначение({
      rвыходer_settings: {
        rвыходing_strategy: "simple-shuffle",
        num_retries: 3,
        rвыходing_groups: [{ group_name: "g1", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4"], rвыходing_strategy: "simple-shuffle" }],
      },
    });
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await findStrategyВыбрать();
    expect(document.queryВыбратьor('input[name="rвыходing_groups"]')).toBeNull();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(setCallbacksCall).toHaveBeenCalledWith("test-token", {
        rвыходer_settings: expect.not.objectContaining({ rвыходing_groups: expect.anything() }),
      }),
    );
  });

  it("should surface an error and not claim success when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(setCallbacksCall).mockRejectedЗначение(new Ошибка("422 Unprocessable Entity"));
    renderWithПровайдерs(<RвыходerSettings {...defaultProps} />);

    await findStrategyВыбрать();
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(toast.fromОшибка).toHaveBeenCalled();
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
