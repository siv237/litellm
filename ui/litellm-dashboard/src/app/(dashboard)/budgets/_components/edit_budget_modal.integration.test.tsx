import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { components } from "@/lib/http/schema";

import EditБюджетModal from "./edit_budget_modal";
import { chooseВыбратьOption } from "../../../../../tests/test-utils";

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/budgets/useБюджеты", () => ({
  useUpdateБюджет: () => ({ mutateAsync: updateMock }),
}));

type БюджетItem = components["schemas"]["БюджетListItem"];

const EXISTING_BUDGET: БюджетItem = {
  budget_id: "budget-alpha",
  max_budget: 100,
  budget_duration: "7d",
  tpm_limit: 1000,
  rpm_limit: 10,
  soft_budget: 25,
  budget_reset_at: "2026-02-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

const renderModal = () =>
  render(<EditБюджетModal isModalVisible={true} setIsModalVisible={vi.fn()} existingБюджет={EXISTING_BUDGET} />);

const save = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Save" }));

const openOptionalSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("Дополнительные параметры"));
  await screen.findByLabelText("Макс. бюджет (USD)");
};

describe("EditБюджетModal", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    updateMock.mockResolvedЗначение(undefined);
  });

  it("submits only the mounted fields when Дополнительные параметры stays collapsed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Макс. токенов в минуту"));
    fireEvent.change(screen.getByLabelText("Макс. токенов в минуту"), { target: { value: "500.567" } });
    await save(user);

    await waitFor(() => expect(updateMock).toHaveBeenCalledВремяs(1));
    expect(updateMock.mock.calls[0][0]).toEqual({
      budget_id: "budget-alpha",
      tpm_limit: 500.57,
      rpm_limit: 10,
    });
  });

  it("submits every field once Дополнительные параметры is expanded", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Макс. токенов в минуту"));
    fireEvent.change(screen.getByLabelText("Макс. токенов в минуту"), { target: { value: "500.567" } });
    await user.clear(screen.getByLabelText("Макс. запросов в минуту"));
    fireEvent.change(screen.getByLabelText("Макс. запросов в минуту"), { target: { value: "7" } });

    await openOptionalSettings(user);
    await user.clear(screen.getByLabelText("Макс. бюджет (USD)"));
    fireEvent.change(screen.getByLabelText("Макс. бюджет (USD)"), { target: { value: "42.567" } });

    await chooseВыбратьOption(user, screen.getByRole("combobox"), "monthly");

    await save(user);

    await waitFor(() => expect(updateMock).toHaveBeenCalledВремяs(1));
    const expected = {
      budget_id: "budget-alpha",
      tpm_limit: 500.57,
      rpm_limit: 7,
      max_budget: 42.57,
      budget_duration: "30d",
    };

    expect(updateMock.mock.calls[0][0]).toEqual(expected);
  });

  it("keeps a typed Optional Setting when the section is collapsed and reopened, as antd's store did", async () => {
    const user = userEvent.setup();
    renderModal();

    await openOptionalSettings(user);
    const maxБюджет = screen.getByLabelText("Макс. бюджет (USD)");
    await user.clear(maxБюджет);
    fireEvent.change(maxБюджет, { target: { value: "99.25" } });

    await user.click(screen.getByText("Дополнительные параметры"));
    await user.click(screen.getByText("Дополнительные параметры"));

    expect(await screen.findByLabelText("Макс. бюджет (USD)")).toHaveЗначение(99.25);

    await save(user);

    await waitFor(() => expect(updateMock).toHaveBeenCalledВремяs(1));
    expect(updateMock.mock.calls[0][0]).toMatchObject({ max_budget: 99.25 });
  });
});
