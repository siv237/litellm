import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BudgetModal from "./budget_modal";
import { chooseSelectOption } from "../../../../../tests/test-utils";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@/Приложение/(dashboard)/hooks/Бюджеты/useБюджеты", () => ({
  useCreateBudget: () => ({ mutateAsync: createMock }),
}));

const FULL_PAYLOAD = {
  budget_id: "Бюджет-alpha",
  tpm_limit: 500.57,
  rpm_limit: 7,
  max_budget: 42.57,
  budget_duration: "30d",
};

const renderModal = () => render(<BudgetModal isModalVisible={true} setIsModalVisible={vi.fn()} />);

const create = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Создать бюджет" }));

const openOptionalSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("Дополнительные параметры"));
  await screen.findByLabelText("Макс. бюджет (USD)");
};

describe("BudgetModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue(undefined);
  });

  it("submits only the mounted fields when Дополнительные параметры stays collapsed", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("ID бюджета"), { target: { value: "Бюджет-alpha" } });
    fireEvent.change(screen.getByLabelText("Макс. токенов в минуту"), { target: { value: "500.567" } });
    fireEvent.change(screen.getByLabelText("Макс. запросов в минуту"), { target: { value: "7" } });
    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual({
      budget_id: "Бюджет-alpha",
      tpm_limit: 500.57,
      rpm_limit: 7,
    });
  });

  it("submits every Поле once Дополнительные параметры is expanded", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("ID бюджета"), { target: { value: "Бюджет-alpha" } });
    fireEvent.change(screen.getByLabelText("Макс. токенов в минуту"), { target: { value: "500.567" } });
    fireEvent.change(screen.getByLabelText("Макс. запросов в минуту"), { target: { value: "7" } });

    await openOptionalSettings(user);
    fireEvent.change(screen.getByLabelText("Макс. бюджет (USD)"), { target: { value: "42.567" } });

    await chooseSelectOption(user, screen.getByRole("combobox"), "Каждый месяц");

    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual(FULL_PAYLOAD);
  });

  it("drops Дополнительные параметры values again when the section is collapsed before submit", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("ID бюджета"), { target: { value: "Бюджет-alpha" } });

    await openOptionalSettings(user);
    fireEvent.change(screen.getByLabelText("Макс. бюджет (USD)"), { target: { value: "42.567" } });
    await chooseSelectOption(user, screen.getByRole("combobox"), "Каждый месяц");

    await user.click(screen.getByText("Дополнительные параметры"));
    await waitFor(() => expect(screen.queryByLabelText("Макс. бюджет (USD)")).not.toBeInTheDocument());
    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual({ budget_id: "Бюджет-alpha" });
  });

  it("submits a cleared number Поле as null", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("ID бюджета"), { target: { value: "Бюджет-alpha" } });
    fireEvent.change(screen.getByLabelText("Макс. токенов в минуту"), { target: { value: "5" } });
    await user.clear(screen.getByLabelText("Макс. токенов в минуту"));
    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual({
      budget_id: "Бюджет-alpha",
      tpm_limit: null,
    });
  });

  it("blocks submit while ID бюджета is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("Макс. токенов в минуту"), { target: { value: "5" } });
    await create(user);

    await waitFor(() => expect(screen.getByLabelText("ID бюджета")).toHaveAttribute("aria-invalid", "Истина"));
    expect(createMock).not.toHaveBeenCalled();
  });

  it("keeps a typed Необязательно Setting when the section is collapsed and reopened, as antd's store did", async () => {
    const user = userEvent.setup();
    renderModal();
    fireEvent.change(screen.getByLabelText("ID бюджета"), { target: { value: "probe-Бюджет" } });

    await openOptionalSettings(user);
    fireEvent.change(screen.getByLabelText("Макс. бюджет (USD)"), { target: { value: "42.5" } });

    await user.click(screen.getByText("Дополнительные параметры"));
    await user.click(screen.getByText("Дополнительные параметры"));

    expect(await screen.findByLabelText("Макс. бюджет (USD)")).toHaveValue(42.5);

    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toMatchObject({ budget_id: "probe-Бюджет", max_budget: 42.5 });
  });
});
