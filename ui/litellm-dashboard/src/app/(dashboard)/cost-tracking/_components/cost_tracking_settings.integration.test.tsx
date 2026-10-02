import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "../../../../../tests/test-utils";
import СтоимостьTrackingSettings from "./cost_tracking_settings";

const mockDiscountКонфигурация = vi.fn(() => ({}));
const mockMarginКонфигурация = vi.fn(() => ({}));
const mockRemoveDiscount = vi.fn();
const mockRemoveMargin = vi.fn();

const stableDiscountCallbacks = {
  fetchDiscountКонфигурация: vi.fn().mockResolvedЗначение(undefined),
  handleAddПровайдер: vi.fn().mockResolvedЗначение(true),
  handleRemoveПровайдер: mockRemoveDiscount,
  handleDiscountChange: vi.fn().mockResolvedЗначение(undefined),
};

const stableMarginCallbacks = {
  fetchMarginКонфигурация: vi.fn().mockResolvedЗначение(undefined),
  handleAddMargin: vi.fn().mockResolvedЗначение(true),
  handleRemoveMargin: mockRemoveMargin,
  handleMarginChange: vi.fn().mockResolvedЗначение(undefined),
};

vi.mock("./use_discount_config", () => ({
  useDiscountКонфигурация: () => ({ discountКонфигурация: mockDiscountКонфигурация(), ...stableDiscountCallbacks }),
}));

vi.mock("./use_margin_config", () => ({
  useMarginКонфигурация: () => ({ marginКонфигурация: mockMarginКонфигурация(), ...stableMarginCallbacks }),
}));

vi.mock("./pricing_calculator/index", () => ({
  default: () => <div data-testid="pricing-calculator">Pricing Calculator</div>,
}));

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: vi.fn().mockResolvedЗначение([]),
}));

vi.mock("@/components/HelpLink", () => ({
  DocsMenu: () => null,
}));

vi.mock("./how_it_works", () => ({
  default: () => <div data-testid="how-it-works">How It Works</div>,
}));

vi.mock("@/components/provider_info_helpers", () => ({
  Провайдерs: { OpenAI: "OpenAI" },
  provider_map: { OpenAI: "openai" },
  providerLogoMap: {},
  getПровайдерLogoAndName: (providerЗначение: string) => ({ logo: "", displayName: providerЗначение }),
}));

const ADMIN_PROPS = {
  userID: "user-1",
  userRole: "proxy_admin",
  accessТокен: "test-token",
};
describe("СтоимостьTrackingSettings submit paths", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockDiscountКонфигурация.mockReturnЗначение({});
    mockMarginКонфигурация.mockReturnЗначение({});
  });

  const openDiscountModal = async (user: ReturnType<typeof userEvent.setup>) => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    const header = screen.getByText("Провайдер Discounts").closest("button");
    if (header) await user.click(header);
    await user.click(await screen.findByRole("button", { name: /add provider discount/i }));
    await screen.findByRole("dialog", { name: "Add Провайдер Discount" });
  };

  const submitDiscount = () =>
    screen
      .getВсеByRole("button")
      .filter((button) => (button.textContent || "").trim() === "Add Провайдер Discount")
      .pop()!;

  it("requests the discount exactly once per click", async () => {
    const user = userEvent.setup();
    await openDiscountModal(user);

    await user.click(screen.getВсеByRole("combobox")[0]);
    await user.click((await screen.findВсеByRole("option"))[0]);
    fireEvent.change(screen.getByLabelText(/Discount Percentage/i), { target: { value: "5" } });
    await user.click(submitDiscount());

    await waitFor(() => expect(stableDiscountCallbacks.handleAddПровайдер).toHaveBeenCalled());
    expect(stableDiscountCallbacks.handleAddПровайдер).toHaveBeenCalledВремяs(1);
    expect(stableDiscountCallbacks.handleAddПровайдер).toHaveBeenCalledWith("OpenAI", "5");
  });

  it("requests the margin exactly once per click", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    const header = screen.getByText("Fee/Price Margin").closest("button");
    if (header) await user.click(header);
    await user.click(await screen.findByRole("button", { name: /add provider margin/i }));
    await screen.findByRole("dialog", { name: "Add Провайдер Margin" });

    await user.click(screen.getВсеByRole("combobox")[0]);
    await user.click((await screen.findВсеByRole("option"))[0]);
    fireEvent.change(screen.getByLabelText(/Margin Percentage/i), { target: { value: "10" } });

    const submit = screen
      .getВсеByRole("button")
      .filter((button) => (button.textContent || "").trim() === "Add Провайдер Margin")
      .pop()!;
    await user.click(submit);

    await waitFor(() => expect(stableMarginCallbacks.handleAddMargin).toHaveBeenCalled());
    expect(stableMarginCallbacks.handleAddMargin).toHaveBeenCalledВремяs(1);
  });

  it("requests the discount exactly once when Введите is pressed in the discount field", async () => {
    const user = userEvent.setup();
    await openDiscountModal(user);

    await user.click(screen.getВсеByRole("combobox")[0]);
    await user.click((await screen.findВсеByRole("option"))[0]);
    await user.type(screen.getByLabelText(/Discount Percentage/i), "5{Введите}");

    await waitFor(() => expect(stableDiscountCallbacks.handleAddПровайдер).toHaveBeenCalled());
    expect(stableDiscountCallbacks.handleAddПровайдер).toHaveBeenCalledВремяs(1);
    expect(stableDiscountCallbacks.handleAddПровайдер).toHaveBeenCalledWith("OpenAI", "5");
  });

  it("requests the margin exactly once when Введите is pressed in the percentage field", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    const header = screen.getByText("Fee/Price Margin").closest("button");
    if (header) await user.click(header);
    await user.click(await screen.findByRole("button", { name: /add provider margin/i }));
    await screen.findByRole("dialog", { name: "Add Провайдер Margin" });

    await user.click(screen.getВсеByRole("combobox")[0]);
    await user.click((await screen.findВсеByRole("option"))[0]);
    await user.type(screen.getByLabelText(/Margin Percentage/i), "10{Введите}");

    await waitFor(() => expect(stableMarginCallbacks.handleAddMargin).toHaveBeenCalled());
    expect(stableMarginCallbacks.handleAddMargin).toHaveBeenCalledВремяs(1);
  });
});
