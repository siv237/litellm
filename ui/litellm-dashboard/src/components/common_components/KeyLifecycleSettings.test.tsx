import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { chooseВыбратьOption, fireEvent, renderWithПровайдерs, screen, waitFor } from "../../../tests/test-utils";
import КлючLifecycleSettings from "./КлючLifecycleSettings";

const CREATE_PLACEHOLDER = "e.g., 30d or leave empty to never expire";
const EDIT_PLACEHOLDER = "e.g., 30d";

interface HarnessProps {
  isCreateРежим?: boolean;
  onFinish?: (values: Record<string, unknown>) => void;
}

const Harness: React.FC<HarnessProps> = ({ isCreateРежим = true, onFinish = () => {} }) => {
  const form = useForm<{ duration: string }>({ defaultЗначениеs: { duration: "" } });
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(false);
  const [rotationInterval, setRotationInterval] = useState("");
  const [neverExpire, setNeverExpire] = useState(false);

  return (
    <form onSubmit={form.handleSubmit(onFinish)}>
      <Controller
        control={form.control}
        name="duration"
        render={({ field }) => (
          <КлючLifecycleSettings
            id={field.name}
            value={field.value}
            onChange={field.onChange}
            autoRotationEnabled={autoRotationEnabled}
            onAutoRotationChange={setAutoRotationEnabled}
            rotationInterval={rotationInterval}
            onRotationIntervalChange={setRotationInterval}
            isCreateРежим={isCreateРежим}
            neverExpire={neverExpire}
            onNeverExpireChange={setNeverExpire}
          />
        )}
      />
      <button type="submit">submit</button>
      <button type="button" onClick={() => form.reset()}>
        reset
      </button>
      <span data-testid="rotation-interval-value">{rotationInterval}</span>
    </form>
  );
};

const getДлительностьВход = (isCreateРежим = true) =>
  screen.getByPlaceholderText(isCreateРежим ? CREATE_PLACEHOLDER : EDIT_PLACEHOLDER) as HTMLВходElement;

const isRenderedВыбратьion = (el: HTMLElement): boolean => !el.closest('[role="listbox"]');

describe("КлючLifecycleSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("renders the expiry and auto-rotation sections", () => {
    renderWithПровайдерs(<Harness />);
    expect(screen.getByText("Настройки срока действия ключа")).toBeInTheDocument();
    expect(screen.getByText("Настройки автоматической ротации")).toBeInTheDocument();
    expect(getДлительностьВход()).toBeInTheDocument();
  });

  it("gives the duration input and the Никогда не истекать checkbox their own labels", () => {
    renderWithПровайдерs(<Harness isCreateРежим={false} />);
    expect(screen.getByLabelText("Истекает")).toBe(getДлительностьВход(false));
    expect(screen.getByRole("checkbox", { name: "Никогда не истекать" })).toBeInTheDocument();
  });

  it("uses the create-mode placeholder in create mode", () => {
    renderWithПровайдерs(<Harness isCreateРежим={true} />);
    expect(screen.getByPlaceholderText(CREATE_PLACEHOLDER)).toBeInTheDocument();
  });

  it("uses the edit-mode placeholder in edit mode", () => {
    renderWithПровайдерs(<Harness isCreateРежим={false} />);
    expect(screen.getByPlaceholderText(EDIT_PLACEHOLDER)).toBeInTheDocument();
  });

  describe("duration is a single source of truth (regression for pre-filled value dropped on submit)", () => {
    it("submits the duration the user typed", async () => {
      const user = userEvent.setup();
      const onFinish = vi.fn();
      renderWithПровайдерs(<Harness onFinish={onFinish} />);

      fireEvent.change(getДлительностьВход(), { target: { value: "1d" } });
      await user.click(screen.getByRole("button", { name: "submit" }));

      await waitFor(() => expect(onFinish).toHaveBeenCalledВремяs(1));
      expect(onFinish.mock.calls[0][0]).toMatchObject({ duration: "1d" });
    });

    it("clears the displayed value when the form is reset, so no stale value lingers", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<Harness />);

      fireEvent.change(getДлительностьВход(), { target: { value: "1d" } });
      expect(getДлительностьВход().value).toBe("1d");

      await user.click(screen.getByRole("button", { name: "reset" }));

      await waitFor(() => expect(getДлительностьВход().value).toBe(""));
    });

    it("never submits a value that differs from what is displayed after a reset", async () => {
      const user = userEvent.setup();
      const onFinish = vi.fn();
      renderWithПровайдерs(<Harness onFinish={onFinish} />);

      // First create: type "1d" and submit -> "1d" is sent.
      fireEvent.change(getДлительностьВход(), { target: { value: "1d" } });
      await user.click(screen.getByRole("button", { name: "submit" }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledВремяs(1));
      expect(onFinish.mock.calls[0][0]).toMatchObject({ duration: "1d" });

      // Second create: form resets, so the field must show empty AND submit empty.
      // The old bug showed a stale "1d" while submitting null/empty.
      await user.click(screen.getByRole("button", { name: "reset" }));
      await waitFor(() => expect(getДлительностьВход().value).toBe(""));

      await user.click(screen.getByRole("button", { name: "submit" }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledВремяs(2));
      expect(onFinish.mock.calls[1][0].duration).not.toBe("1d");
      expect(getДлительностьВход().value).toBe(onFinish.mock.calls[1][0].duration ?? "");
    });
  });

  describe("Никогда не истекать", () => {
    it("clears and disables the duration input, then submits an empty duration", async () => {
      const user = userEvent.setup();
      const onFinish = vi.fn();
      renderWithПровайдерs(<Harness isCreateРежим={false} onFinish={onFinish} />);

      fireEvent.change(getДлительностьВход(false), { target: { value: "30d" } });
      expect(getДлительностьВход(false).value).toBe("30d");

      await user.click(screen.getByRole("checkbox", { name: /never expire/i }));

      await waitFor(() => expect(getДлительностьВход(false).value).toBe(""));
      expect(getДлительностьВход(false)).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "submit" }));
      await waitFor(() => expect(onFinish).toHaveBeenCalledВремяs(1));
      expect(onFinish.mock.calls[0][0]).toMatchObject({ duration: "" });
    });
  });

  describe("Auto-Rotation", () => {
    it("reveals the rotation interval controls when enabled", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<Harness />);

      expect(screen.queryByText("Интервал ротации")).not.toBeInTheDocument();
      await user.click(screen.getByRole("switch"));

      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();
    });

    it("propagates a selected predefined interval", async () => {
      const user = userEvent.setup();
      renderWithПровайдерs(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseВыбратьOption(user, screen.getByRole("combobox"), "90 days");

      await waitFor(() => expect(screen.getВсеByTitle("90 days").some(isRenderedВыбратьion)).toBe(true));
      expect(screen.getByTestId("rotation-interval-value")).toHaveTextContent("90d");
    });

    it("shows the custom interval input when Custom interval is selected, withвыход propagating yet", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithПровайдерs(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseВыбратьOption(user, screen.getByRole("combobox"), "Custom interval");

      expect(await screen.findByPlaceholderText("e.g., 1s, 5m, 2h, 14d")).toBeInTheDocument();
      expect(screen.getByText("Поддерживаемые форматы: секунды (s), минуты (m), часы (h), дни (d)")).toBeInTheDocument();
      expect(screen.getByTestId("rotation-interval-value")).toHaveTextContent("");
    });

    it("propagates a typed custom interval to the parent", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithПровайдерs(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseВыбратьOption(user, screen.getByRole("combobox"), "Custom interval");

      const customВход = await screen.findByPlaceholderText("e.g., 1s, 5m, 2h, 14d");
      fireEvent.change(customВход, { target: { value: "14d" } });

      await waitFor(() => expect(screen.getByTestId("rotation-interval-value")).toHaveTextContent("14d"));
      expect((customВход as HTMLВходElement).value).toBe("14d");
    });

    it("hides the custom input and propagates the value when switching back to a predefined interval", async () => {
      const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
      renderWithПровайдерs(<Harness />);

      await user.click(screen.getByRole("switch"));
      expect(await screen.findByText("Интервал ротации")).toBeInTheDocument();

      await chooseВыбратьOption(user, screen.getByRole("combobox"), "Custom interval");
      const customВход = await screen.findByPlaceholderText("e.g., 1s, 5m, 2h, 14d");
      fireEvent.change(customВход, { target: { value: "14d" } });
      await waitFor(() => expect(screen.getByTestId("rotation-interval-value")).toHaveTextContent("14d"));

      await chooseВыбратьOption(user, screen.getByRole("combobox"), "7 days");

      await waitFor(() => expect(screen.getByTestId("rotation-interval-value")).toHaveTextContent("7d"));
      expect(screen.queryByPlaceholderText("e.g., 1s, 5m, 2h, 14d")).not.toBeInTheDocument();
    });
  });
});
