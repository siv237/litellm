import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "../../../../../tests/test-utils";
import AddПровайдерForm from "./add_provider_form";
import { DiscountКонфигурация } from "./types";
import { Провайдерs, providerLogoMap } from "@/components/provider_info_helpers";

const DEFAULT_PROPS = {
  discountКонфигурация: {} as DiscountКонфигурация,
  selectedПровайдер: undefined,
  newDiscount: "",
  onПровайдерChange: vi.fn(),
  onDiscountChange: vi.fn(),
  onAddПровайдер: vi.fn(),
};

describe("AddПровайдерForm", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should render", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: /add provider discount/i })).toBeInTheDocument();
  });

  it("should render the discount percentage input field", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} />);
    expect(screen.getByPlaceholderText("5")).toBeInTheDocument();
  });

  it("should disable the submit button when no provider is selected and no discount is entered", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} />);
    expect(screen.getByRole("button", { name: /add provider discount/i })).toBeDisabled();
  });

  it("should disable the submit button when a provider is selected but no discount is entered", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} selectedПровайдер="OpenAI" newDiscount="" />);
    expect(screen.getByRole("button", { name: /add provider discount/i })).toBeDisabled();
  });

  it("should disable the submit button when a discount is entered but no provider is selected", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} selectedПровайдер={undefined} newDiscount="5" />);
    expect(screen.getByRole("button", { name: /add provider discount/i })).toBeDisabled();
  });

  it("should enable the submit button when both a provider and a discount value are provided", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} selectedПровайдер="OpenAI" newDiscount="5" />);
    expect(screen.getByRole("button", { name: /add provider discount/i })).toBeEnabled();
  });

  it("should call onAddПровайдер when the enabled submit button is clicked", async () => {
    const onAddПровайдер = vi.fn();
    const user = userEvent.setup();
    renderWithПровайдерs(
      <AddПровайдерForm {...DEFAULT_PROPS} selectedПровайдер="OpenAI" newDiscount="5" onAddПровайдер={onAddПровайдер} />,
    );

    await user.click(screen.getByRole("button", { name: /add provider discount/i }));
    expect(onAddПровайдер).toHaveBeenCalledВремяs(1);
  });

  it("should report the edited discount as the user types", async () => {
    const onDiscountChange = vi.fn();
    const user = userEvent.setup();
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} newDiscount="1" onDiscountChange={onDiscountChange} />);

    await user.type(screen.getByPlaceholderText("5"), "5");
    expect(onDiscountChange).toHaveBeenCalledWith("15");
  });

  it("should show the percent sign next to the discount input", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} />);
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("renders the selected provider's bundled logo via the shared Logo component", async () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} selectedПровайдер="OpenAI" />);

    const logo = await screen.findByRole("img", { name: `${Провайдерs.OpenAI} logo` });
    expect(logo).toHaveAttribute("src", providerLogoMap[Провайдерs.OpenAI]);
  });

  it("falls back to a letter avatar for a selected provider that has no bundled logo", () => {
    renderWithПровайдерs(<AddПровайдерForm {...DEFAULT_PROPS} selectedПровайдер="PG_VECTOR" />);

    expect(screen.queryByRole("img", { name: `${Провайдерs.PG_VECTOR} logo` })).not.toBeInTheDocument();
    expect(screen.getByText(Провайдерs.PG_VECTOR.charAt(0))).toBeInTheDocument();
  });
});
