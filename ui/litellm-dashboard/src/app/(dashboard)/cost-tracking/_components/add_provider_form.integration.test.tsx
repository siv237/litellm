import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../tests/test-utils";
import AddProviderForm from "./add_provider_form";
import { DiscountКонфигурация } from "./types";

const onAddПровайдер = vi.fn();
const onParentFinish = vi.fn();

const ParentOwnedForm = () => (
  <form
    onSubmit={(event) => {
      event.preventDefault();
      onParentFinish();
    }}
    className="space-y-6"
  >
    <AddProviderForm
      discountКонфигурация={{} as DiscountКонфигурация}
      selectedПровайдер="OpenAI"
      newDiscount="5"
      onProviderChange={vi.fn()}
      onDiscountChange={vi.fn()}
      onAddПровайдер={onAddПровайдер}
    />
  </form>
);

describe("AddProviderForm inside the form its parent owns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("drives both the onAddПровайдер prop and the parent form submit from one click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ParentOwnedForm />);

    await user.click(screen.getByRole("button", { name: /add provider discount/i }));

    expect(onAddПровайдер).toHaveBeenCalledTimes(1);
    expect(onParentFinish).toHaveBeenCalledTimes(1);
  });

  it("treats Введите in the discount field exactly like a click on the add button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ParentOwnedForm />);

    await user.type(screen.getByPlaceholderText("5"), "{Введите}");

    await vi.waitFor(() => expect(onParentFinish).toHaveBeenCalledTimes(1));
    expect(onAddПровайдер).toHaveBeenCalledTimes(1);
  });
});
