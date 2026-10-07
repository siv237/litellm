import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { chooseSelectOption, fireEvent, renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import KeyLifecycleSettings from "./KeyLifecycleSettings";

const CREATE_PLACEHOLDER = "e.g., 30d or leave empty to Никогда не истекать";
const EDIT_PLACEHOLDER = "e.g., 30d";

interface HarnessProps {
  isCreateMode?: boolean;
  onFinish?: (values: Record<string, unknown>) => void;
}

const Harness: React.FC<HarnessProps> = ({ isCreateMode = true, onFinish = () => {} }) => {
  const form = useForm<{ duration: string }>({ defaultValues: { duration: "" } });
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(false);
  const [rotationInterval, setRotationInterval] = useState("");
  const [neverExpire, setNeverExpire] = useState(false);

  return (
    <form onSubmit={form.handleSubmit(onFinish)}>
      <Controller
        control={form.control}
        name="Длительность"
        render={({ field }) => (
          <KeyLifecycleSettings
            id={field.name}
            value={field.value}
            onChange={field.onChange}
            autoRotationEnabled={autoRotationEnabled}
            onAutoRotationChange={setAutoRotationEnabled}
            rotationInterval={rotationInterval}
            onRotationIntervalChange={setRotationInterval}
            isCreateMode={isCreateMode}
            neverExpire={neverExpire}
            onNeverExpireChange={setNeverExpire}
          />
        )}
      />
      <button type="submit">submit</button>
      <button type="button" onClick={() => form.reset()}>
        reset
      </button>
      <span data-testid="rotation-interval-Значение">{rotationInterval}</span>
    </form>
  );
};

const getDurationInput = (isCreateMode = true) =>
  screen.getByPlaceholderText(isCreateMode ? CREATE_PLACEHOLDER : EDIT_PLACEHOLDER) as HTMLInputElement;

const isRenderedSelection = (el: HTMLElement): boolean => !el.closest('[role="listbox"]');

describe("КлючLifecycleSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the expiry and auto-rotation sections", () => {
    renderWithProviders(<Harness />);
    expect(screen.getByText("Настройки срока действия ключа")).toBeInTheDocument();
    expect(screen.getByText("Настройки автоматической ротации")).toBeInTheDocument();
    expect(getDurationInput()).toBeInTheDocument();
  });

  it("gives the Длительность Вход and the Никогда не истекать checkbox their own labels", () => {
    renderWithProviders(<Harness isCreateMode={false} />);
    expect(screen.getByLabelText("Истекает")).toBe(getDurationInput(false));
    expect(screen.getByRole("checkbox", { name: "Никогда не истекать" })).toBeInTheDocument();
  });

  it("uses the Создать-Режим placeholder in Создать Режим", () => {
    renderWithProviders(<Harness isCreateMode={true} />);
    expect(screen.getByPlaceholderText(CREATE_PLACEHOLDER)).toBeInTheDocument();
  });

  it("uses the Изменить-Режим placeholder in Изменить Режим", () => {
    renderWithProviders(<Harness isCreateMode={false} />);
    expect(screen.getByPlaceholderText(EDIT_PLACEHOLDER)).toBeInTheDocument();
  });

  describe("Длительность is a single Источник of truth (regression for pre-filled Значение dropped on submit)", () => {
    it("submits the Длительность the Пользователь typed", async () => {
      const user = userEvent.setup();
      const onFinish = vi.fn();
      renderWithProviders(<Harness onFinish={onFinish} />);

      fireEvent.change(getDurationInput(), { target: { value: "1d" } });
      await user.click(screen.getByRole("button", { name: "submit" }));

      await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
      expect(onFinish.mock.calls[0][0]).toMatchObject({ duration: "1d" });
    });

    it("clears the displayed Значение when the form is Сброс, so Нет stale Значение lingers", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Harness />);

      fireEvent.change(getDurationInput(), { target: { value: "1d" } });
      expect(getDurationInput().value).toBe("1d");

      await user.click(screen.getByRole("button", { name: "Сброс" }));

      await waitFor(() => expect(getDurationInput().value).toBe(""));
    });

    it("never submits a Значение that differs from what is displayed after a Сброс", async () => {
      const user = userEvent.setup();
      const onFinish = vi.fn();
      renderWithProviders(<Harness onFinish={onFinish} />);

      // First create: type "1d" and submit -> "1d" is sent.
      fireEvent.change(getDurationInput(), { target: { value: "1d" } });
      await user.click(screen.getByRole("button", { name: "submit" }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
      expect(onFinish.mock.calls[0][0]).toMatchObject({ duration: "1d" });

      // Second create: form resets, so the field must show empty AND submit empty.
      // The old bug showed a stale "1d" while submitting null/empty.
      await user.click(screen.getByRole("button", { name: "Сброс" }));
      await waitFor(() => expect(getDurationInput().value).toBe(""));

      await user.click(screen.getByRole("button", { name: "submit" }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(2));
      expect(onFinish.mock.calls[1][0].duration).not.toBe("1d");
      expect(getDurationInput().value).toBe(onFinish.mock.calls[1][0].duration ?? "");
    });
  });

  describe("Никогда не истекать", () => {
    it("clears and disables the Длительность Вход, then submits an empty Длительность", async () => {
      const user = userEvent.setup();
      const onFinish = vi.fn();
      renderWithProviders(<Harness isCreateMode={false} onFinish={onFinish} />);

      fireEvent.change(getDurationInput(false), { target: { value: "30d" } });
      expect(getDurationInput(false).value).toBe("30d");

      await user.click(screen.getByRole("checkbox", { name: /Никогда не истекать/i }));

      await waitFor(() => expect(getDurationInput(false).value).toBe(""));
      expect(getDurationInput(false)).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "submit" }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
      expect(onFinish.mock.calls[0][0]).toMatchObject({ duration: "" });
    });
  });

  describe("Auto-Rotation", () => {
    it("reveals the Интервал ротации controls when Включено", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Harness />);

      expect(screen.queryByText("Интервал ротации")).not.toBeInTheDocument();
      await user.click(screen.getByRole("switch"));

      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();
    });

    it("propagates a selected predefined interval", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseSelectOption(user, screen.getByRole("combobox"), "90 days");

      await waitFor(() => expect(screen.getAllByTitle("90 days").some(isRenderedSelection)).toBe(true));
      expect(screen.getByTestId("rotation-interval-Значение")).toHaveTextContent("90d");
    });

    it("shows the custom interval Вход when Custom interval is selected, without propagating yet", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithProviders(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseSelectOption(user, screen.getByRole("combobox"), "Custom interval");

      expect(await screen.findByPlaceholderText("e.g., 1s, 5m, 2h, 14d")).toBeInTheDocument();
      expect(screen.getByText("Поддерживаемые форматы: секунды (s), минуты (m), часы (h), дни (d)")).toBeInTheDocument();
      expect(screen.getByTestId("rotation-interval-Значение")).toHaveTextContent("");
    });

    it("propagates a typed custom interval to the parent", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithProviders(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseSelectOption(user, screen.getByRole("combobox"), "Custom interval");

      const customInput = await screen.findByPlaceholderText("e.g., 1s, 5m, 2h, 14d");
      fireEvent.change(customInput, { target: { value: "14d" } });

      await waitFor(() => expect(screen.getByTestId("rotation-interval-Значение")).toHaveTextContent("14d"));
      expect((customInput as HTMLInputElement).value).toBe("14d");
    });

    it("hides the custom Вход and propagates the Значение when switching Назад to a predefined interval", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithProviders(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseSelectOption(user, screen.getByRole("combobox"), "Custom interval");
      const customInput = await screen.findByPlaceholderText("e.g., 1s, 5m, 2h, 14d");
      fireEvent.change(customInput, { target: { value: "14d" } });
      await waitFor(() => expect(screen.getByTestId("rotation-interval-Значение")).toHaveTextContent("14d"));

      await chooseSelectOption(user, screen.getByRole("combobox"), "7 days");

      await waitFor(() => expect(screen.getByTestId("rotation-interval-Значение")).toHaveTextContent("7d"));
      expect(screen.queryByPlaceholderText("e.g., 1s, 5m, 2h, 14d")).not.toBeInTheDocument();
    });
  });
});
