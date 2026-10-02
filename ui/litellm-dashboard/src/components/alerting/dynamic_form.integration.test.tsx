import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import DynamicForm from "./dynamic_form";

interface Setting {
  field_name: string;
  field_description: string;
  field_type: string;
  field_value: unknown;
  stored_in_db: boolean | null;
  premium_field: boolean;
}

const SETTINGS: Setting[] = [
  {
    field_name: "daily_report_frequency",
    field_description: "How often the report runs",
    field_type: "Integer",
    field_value: 12,
    stored_in_db: true,
    premium_field: false,
  },
  {
    field_name: "region_name",
    field_description: "Region to watch",
    field_type: "String",
    field_value: "us-east",
    stored_in_db: false,
    premium_field: false,
  },
  {
    field_name: "slack_alerting",
    field_description: "Send to slack",
    field_type: "Boolean",
    field_value: false,
    stored_in_db: null,
    premium_field: false,
  },
  {
    field_name: "daily_spend_per_user_threshold",
    field_description: "Каждый день spend threshold per user",
    field_type: "Float",
    field_value: 5.5,
    stored_in_db: true,
    premium_field: false,
  },
];

const renderForm = (
  overrides: {
    settings?: Setting[];
    premiumUser?: boolean;
    handleSubmit?: (values: Record<string, unknown>) => void;
    handleInChange?: (fieldName: string, newЗначение: unknown) => void;
    handleResetПоле?: (fieldName: string, index: number) => void;
  } = {},
) => {
  const handleSubmit = overrides.handleSubmit ?? vi.fn();
  const handleInChange = overrides.handleInChange ?? vi.fn();
  const handleResetПоле = overrides.handleResetПоле ?? vi.fn();
  render(
    <table>
      <tbody>
        <DynamicForm
          alertingSettings={overrides.settings ?? SETTINGS}
          handleInChange={handleInChange}
          handleResetПоле={handleResetПоле}
          handleSubmit={handleSubmit}
          premiumUser={overrides.premiumUser ?? false}
        />
      </tbody>
    </table>,
  );
  return { handleSubmit, handleInChange, handleResetПоле };
};

const submit = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Update Settings" }));

describe("DynamicForm submit payload", () => {
  it("submits nothing when no field has been changed", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm();

    await submit(user);

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits only the fields the user actually changed", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm();

    await user.type(screen.getByDisplayЗначение("us-east"), "Z");
    await submit(user);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({ region_name: "us-eastZ" });
  });

  it("submits an Integer field as a string, not a number", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm();

    await user.type(screen.getByDisplayЗначение("12"), "7");
    await submit(user);

    expect(handleSubmit).toHaveBeenCalledWith({ daily_report_frequency: "127" });
  });

  it("submits a Boolean field as a boolean", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm();

    await user.click(screen.getByRole("switch"));
    await submit(user);

    expect(handleSubmit).toHaveBeenCalledWith({ slack_alerting: true });
  });

  it("submits every changed field together", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm();

    await user.type(screen.getByDisplayЗначение("us-east"), "Z");
    await user.click(screen.getByRole("switch"));
    await user.type(screen.getByDisplayЗначение("12"), "9");
    await submit(user);

    expect(handleSubmit).toHaveBeenCalledWith({
      daily_report_frequency: "129",
      region_name: "us-eastZ",
      slack_alerting: true,
    });
  });

  it("submits nothing when the only change cleared a field to an empty string", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm();

    await user.clear(screen.getByDisplayЗначение("us-east"));
    await submit(user);

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("still submits a false Boolean, which is never treated as empty", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm({
      settings: [{ ...SETTINGS[2], field_value: true }],
    });

    await user.click(screen.getByRole("switch"));
    await submit(user);

    expect(handleSubmit).toHaveBeenCalledWith({ slack_alerting: false });
  });
});

describe("DynamicForm change notifications", () => {
  it("reports a Boolean change to the parent as a boolean", async () => {
    const user = userEvent.setup();
    const { handleInChange } = renderForm();

    await user.click(screen.getByRole("switch"));

    expect(handleInChange).toHaveBeenCalledWith("slack_alerting", true);
  });

  it("reports an Integer change to the parent as a number", async () => {
    const user = userEvent.setup();
    const { handleInChange } = renderForm();

    await user.type(screen.getByDisplayЗначение("12"), "8");

    expect(handleInChange).toHaveBeenCalledWith("daily_report_frequency", 128);
  });

  it("renders a Float field as a decimal-friendly number input and reports changes as numbers", async () => {
    const user = userEvent.setup();
    const { handleInChange } = renderForm();

    const input = screen.getByDisplayЗначение("5.5");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("step", "any");

    await user.type(input, "1");

    expect(handleInChange).toHaveBeenCalledWith("daily_spend_per_user_threshold", 5.51);
  });

  it("reports a reset with the field name and its row index", async () => {
    const user = userEvent.setup();
    const { handleResetПоле } = renderForm();

    await user.click(screen.getByRole("button", { name: "Reset region_name" }));

    expect(handleResetПоле).toHaveBeenCalledWith("region_name", 1);
  });
});

describe("DynamicForm premium gating", () => {
  it("hides the control behind an upsell and registers no value when the user is not premium", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm({
      settings: [{ ...SETTINGS[1], premium_field: true }],
      premiumUser: false,
    });

    expect(screen.getByText(/Введитеprise Feature/)).toBeInTheDocument();
    expect(screen.queryByDisplayЗначение("us-east")).not.toBeInTheDocument();

    await submit(user);

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("renders the real control for a premium user on a premium field", async () => {
    const user = userEvent.setup();
    const { handleSubmit } = renderForm({
      settings: [{ ...SETTINGS[1], premium_field: true }],
      premiumUser: true,
    });

    await user.type(screen.getByDisplayЗначение("us-east"), "Q");
    await submit(user);

    expect(handleSubmit).toHaveBeenCalledWith({ region_name: "us-eastQ" });
  });
});

describe("DynamicForm presentation", () => {
  it("shows each field name, description and storage origin", () => {
    renderForm();

    expect(screen.getByText("daily_report_frequency")).toBeInTheDocument();
    expect(screen.getByText("How often the report runs")).toBeInTheDocument();
    expect(screen.getAllByText("In DB")).toHaveLength(2);
    expect(screen.getByText("In Конфигурация")).toBeInTheDocument();
    expect(screen.getByText("Not Set")).toBeInTheDocument();
  });
});
