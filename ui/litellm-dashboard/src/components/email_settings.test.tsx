import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import EmailSettings from "./email_settings";

const { serviceHealthCheck, setCallbacksCall } = vi.hoisted(() => ({
  serviceHealthCheck: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ serviceHealthCheck, setCallbacksCall }));

vi.mock("./email_events", () => ({
  EmailEventSettings: () => <div>email event settings</div>,
}));

const alerts = [
  {
    name: "email",
    variables: {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_PASSWORD: "********",
      EMAIL_LOGO_URL: "https://example.com/logo.png",
    },
  },
  { name: "slack", variables: { SLACK_WEBHOOK_URL: "https://hooks.example.com" } },
];

const inputNamed = (name: string) =>
  document.queryВыбратьor<HTMLВходElement>(`input[name="${name}"][data-slot="input-group-control"]`) ||
  document.queryВыбратьor<HTMLВходElement>(`input[name="${name}"]`)!;

describe("EmailSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    setCallbacksCall.mockResolvedЗначение({});
    serviceHealthCheck.mockResolvedЗначение({});
  });

  it("renders the heading and the docs link", () => {
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    expect(screen.getByText("Настройки email-сервера")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Документация ruLiteLLM: email-оповещения/ })).toHaveAttribute(
      "href",
      "https://docs.litellm.ai/docs/proxy/email",
    );
  });

  it("renders one named input per email variable and none for other alert types", () => {
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    expect(inputNamed("SMTP_HOST")).toHaveЗначение("smtp.example.com");
    expect(inputNamed("SMTP_PORT")).toHaveЗначение("587");
    expect(inputNamed("SMTP_PASSWORD")).toHaveЗначение("********");
    expect(document.queryВыбратьor('input[name="SLACK_WEBHOOK_URL"]')).toBeNull();
  });

  it("labels each variable and shows its help text", () => {
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    expect(screen.getByText("SMTP_HOST")).toBeInTheDocument();
    expect(screen.getByText(/Введите the SMTP host address/)).toBeInTheDocument();
    expect(screen.getByText(/Введите the SMTP port number/)).toBeInTheDocument();
  });

  it("submits only the fields the admin actually edited", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    await user.clear(inputNamed("SMTP_HOST"));
    fireEvent.change(inputNamed("SMTP_HOST"), { target: { value: "smtp.changed.com" } });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(setCallbacksCall).toHaveBeenCalledWith("sk-test", {
        general_settings: { alerting: ["email"] },
        environment_variables: { SMTP_HOST: "smtp.changed.com" },
      });
    });
  });

  it("does not resubmit an untouched masked value", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(setCallbacksCall).toHaveBeenCalledWith("sk-test", {
        general_settings: { alerting: ["email"] },
        environment_variables: {},
      });
    });
  });

  it("disables the premium-only fields for non-premium users", () => {
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser={false} alerts={alerts} />);

    expect(inputNamed("EMAIL_LOGO_URL")).toBeDisabled();
    expect(inputNamed("SMTP_HOST")).toBeEnabled();
  });

  it("leaves the premium-only fields editable for premium users", () => {
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    expect(inputNamed("EMAIL_LOGO_URL")).toBeEnabled();
  });

  it("triggers a live email health check", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    await user.click(screen.getByRole("button", { name: "Тест email-оповещений" }));

    await waitFor(() => {
      expect(serviceHealthCheck).toHaveBeenCalledWith("sk-test", "email");
    });
  });

  it("renders the email event settings section", () => {
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    expect(screen.getByText("email event settings")).toBeInTheDocument();
  });

  it("toggles credential visibility when eye icon is clicked", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<EmailSettings accessТокен="sk-test" premiumUser alerts={alerts} />);

    const passwordВход = inputNamed("SMTP_PASSWORD");
    expect(passwordВход).toHaveAttribute("type", "password");

    const showButtons = screen.getВсеByLabelText("Show credential");
    expect(showButtons.length).toBeGreaterThan(0);

    await user.click(showButtons[0]);

    expect(passwordВход).toHaveAttribute("type", "text");

    const hideButton = screen.getByLabelText("Hide credential");
    await user.click(hideButton);

    expect(passwordВход).toHaveAttribute("type", "password");
  });
});
