import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithПровайдерs } from "../../../../../tests/test-utils";
import AddПровайдерForm from "./add_provider_form";
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
    <AddПровайдерForm
      discountКонфигурация={{} as DiscountКонфигурация}
      selectedПровайдер="OpenAI"
      newDiscount="5"
      onПровайдерChange={vi.fn()}
      onDiscountChange={vi.fn()}
      onAddПровайдер={onAddПровайдер}
    />
  </form>
);

describe("AddПровайдерForm inside the form its parent owns", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("drives both the onAddПровайдер prop and the parent form submit from one click", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<ParentOwnedForm />);

    await user.click(screen.getByRole("button", { name: /add provider discount/i }));

    expect(onAddПровайдер).toHaveBeenCalledВремяs(1);
    expect(onParentFinish).toHaveBeenCalledВремяs(1);
  });

  it("treats Введите in the discount field exactly like a click on the add button", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<ParentOwnedForm />);

    await user.type(screen.getByPlaceholderText("5"), "{Введите}");

    await vi.waitFor(() => expect(onParentFinish).toHaveBeenCalledВремяs(1));
    expect(onAddПровайдер).toHaveBeenCalledВремяs(1);
  });
});
