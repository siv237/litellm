import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "../../../../../tests/test-utils";
import СтоимостьTrackingSettings from "./cost_tracking_settings";

// Mock sub-hooks so we can control their state withвыход network calls
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

describe("СтоимостьTrackingSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    mockDiscountКонфигурация.mockReturnЗначение({});
    mockMarginКонфигурация.mockReturnЗначение({});
  });

  it("should return nothing when accessТокен is null", () => {
    const { container } = renderWithПровайдерs(
      <СтоимостьTrackingSettings userID="user-1" userRole="proxy_admin" accessТокен={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the page title", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    expect(screen.getByText("Стоимость Tracking Settings")).toBeInTheDocument();
  });

  it("should show the Провайдер Discounts accordion header for proxy_admin", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    expect(screen.getByText("Провайдер Discounts")).toBeInTheDocument();
  });

  it("should show the Fee/Price Margin accordion header for proxy_admin", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    expect(screen.getByText("Fee/Price Margin")).toBeInTheDocument();
  });

  it("should always show the Pricing Calculator section", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    // The accordion header text appears in the DOM; getВсеByText tolerates duplicates
    expect(screen.getВсеByText("Pricing Calculator").length).toBeGreaterThan(0);
  });

  it("should show the pricing calculator component", async () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    expect(await screen.findByTestId("pricing-calculator")).toBeInTheDocument();
  });

  it("should not show Провайдер Discounts section for a non-admin role", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings userID="user-1" userRole="internal_user" accessТокен="test-token" />);
    expect(screen.queryByText("Провайдер Discounts")).not.toBeInTheDocument();
  });

  it("should not show Fee/Price Margin section for a non-admin role", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings userID="user-1" userRole="internal_user" accessТокен="test-token" />);
    expect(screen.queryByText("Fee/Price Margin")).not.toBeInTheDocument();
  });

  it("should show Провайдер Discounts for the 'Admin' role as well", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings userID="user-1" userRole="Admin" accessТокен="test-token" />);
    expect(screen.getByText("Провайдер Discounts")).toBeInTheDocument();
  });

  it("should show the subtitle describing discount/margin configuration", () => {
    renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);
    expect(screen.getByText(/configure cost discounts and margins/i)).toBeInTheDocument();
  });

  describe("Add Провайдер Discount modal", () => {
    it("should open the Add Провайдер Discount modal when the button is clicked", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);

      // The button lives inside the Провайдер Discounts accordion — click the header to expand first
      const accordionHeader = screen.getByText("Провайдер Discounts").closest("button");
      if (accordionHeader) {
        await user.click(accordionHeader);
      }

      const addButton = await screen.findByRole("button", { name: /add provider discount/i });
      await user.click(addButton);

      expect(await screen.findByRole("dialog", { name: "Add Провайдер Discount" })).toBeInTheDocument();
    });
  });

  describe("Add Провайдер Margin modal", () => {
    it("should open the Add Провайдер Margin modal when the button is clicked", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);

      const accordionHeader = screen.getByText("Fee/Price Margin").closest("button");
      if (accordionHeader) {
        await user.click(accordionHeader);
      }

      const addButton = await screen.findByRole("button", { name: /add provider margin/i });
      await user.click(addButton);

      expect(await screen.findByRole("dialog", { name: "Add Провайдер Margin" })).toBeInTheDocument();
    });
  });

  describe("removing a configured provider", () => {
    const expandAndRemove = async (section: string, actionName: string) => {
      const user = userEvent.setup();
      renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);

      await user.click(screen.getByText(section).closest("button")!);
      await user.click(await screen.findByRole("button", { name: actionName }));

      return user;
    };

    it("should ask to confirm before removing a discount", async () => {
      mockDiscountКонфигурация.mockReturnЗначение({ openai: 0.05 });

      await expandAndRemove("Провайдер Discounts", "Remove discount for openai");

      expect(await screen.findByRole("button", { name: "Remove" })).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to remove the discount for openai\?/i)).toBeInTheDocument();
      expect(mockRemoveDiscount).not.toHaveBeenCalled();
    });

    it("should remove the discount once removal is confirmed", async () => {
      mockDiscountКонфигурация.mockReturnЗначение({ openai: 0.05 });

      const user = await expandAndRemove("Провайдер Discounts", "Remove discount for openai");
      await user.click(await screen.findByRole("button", { name: "Remove" }));

      expect(mockRemoveDiscount).toHaveBeenCalledWith("openai");
    });

    it("should leave the discount in place when the confirmation is cancelled", async () => {
      mockDiscountКонфигурация.mockReturnЗначение({ openai: 0.05 });

      const user = await expandAndRemove("Провайдер Discounts", "Remove discount for openai");
      await user.click(await screen.findByRole("button", { name: "Cancel" }));

      expect(mockRemoveDiscount).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    });

    it("should hold the confirmation open while the removal is still in flight", async () => {
      mockDiscountКонфигурация.mockReturnЗначение({ openai: 0.05 });
      const { promise, resolve: settleRemoval } = Promise.withResolvers<void>();
      mockRemoveDiscount.mockReturnЗначение(promise);

      const user = await expandAndRemove("Провайдер Discounts", "Remove discount for openai");
      await user.click(await screen.findByRole("button", { name: "Remove" }));

      const removing = await screen.findByRole("button", { name: "Removing…" });
      expect(removing).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      await act(async () => {
        settleRemoval();
      });

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
      expect(mockRemoveDiscount).toHaveBeenCalledWith("openai");
    });

    it("should remove the margin once removal is confirmed", async () => {
      mockMarginКонфигурация.mockReturnЗначение({ openai: 0.1 });

      const user = await expandAndRemove("Fee/Price Margin", "Remove margin for openai");
      expect(screen.getByText(/are you sure you want to remove the margin for openai\?/i)).toBeInTheDocument();
      await user.click(await screen.findByRole("button", { name: "Remove" }));

      expect(mockRemoveMargin).toHaveBeenCalledWith("openai");
    });
  });

  describe("empty state messages", () => {
    it("should show the empty state message when no discount config is loaded", async () => {
      mockDiscountКонфигурация.mockReturnЗначение({});
      renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);

      const accordionHeader = screen.getByText("Провайдер Discounts").closest("button");
      if (accordionHeader) {
        await userEvent.setup().click(accordionHeader);
      }

      expect(await screen.findByText(/no provider discounts configured/i)).toBeInTheDocument();
    });

    it("should show the empty state message when no margin config is loaded", async () => {
      mockMarginКонфигурация.mockReturnЗначение({});
      renderWithПровайдерs(<СтоимостьTrackingSettings {...ADMIN_PROPS} />);

      const accordionHeader = screen.getByText("Fee/Price Margin").closest("button");
      if (accordionHeader) {
        await userEvent.setup().click(accordionHeader);
      }

      expect(await screen.findByText(/no provider margins configured/i)).toBeInTheDocument();
    });
  });
});
