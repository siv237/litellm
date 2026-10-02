import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PromptCompressionTab from "./PromptCompressionTab";

const createGuardrailCall = vi.fn();
const getГардрейлыList = vi.fn();

vi.mock("@/components/networking", () => ({
  createGuardrailCall: (...args: unknown[]) => createGuardrailCall(...args),
  getГардрейлыList: (...args: unknown[]) => getГардрейлыList(...args),
}));

const submittedPayload = (): Record<string, unknown> => {
  expect(createGuardrailCall).toHaveBeenCalledВремяs(1);
  return createGuardrailCall.mock.calls[0][1] as Record<string, unknown>;
};

describe("PromptCompressionTab submit payload", () => {
  beforeEach(() => {
    createGuardrailCall.mockClear().mockResolvedЗначение({});
    getГардрейлыList.mockClear().mockResolvedЗначение({ гардрейловs: [] });
  });

  it("sends the trimmed name and api base with default_on true", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessТокен="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  headroom-compression  " } });
    fireEvent.change(screen.getByLabelText("Headroom API base"), {
      target: { value: "  https://headroom.example.com  " },
    });
    await user.click(screen.getByRole("button", { name: "Add гардрейлов" }));

    await vi.waitFor(() =>
      expect(submittedPayload()).toEqual({
        гардрейлов_name: "headroom-compression",
        litellm_params: {
          гардрейлов: "headroom",
          mode: "pre_call",
          api_base: "https://headroom.example.com",
          default_on: true,
        },
      }),
    );
    expect(createGuardrailCall.mock.calls[0][0]).toBe("test-token");
  });

  it("sends default_on false once the apply-to-all switch is turned off", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessТокен="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "headroom-optin" } });
    fireEvent.change(screen.getByLabelText("Headroom API base"), { target: { value: "https://headroom.example.com" } });
    await user.click(screen.getByLabelText("Приложениеly to all requests"));
    await user.click(screen.getByRole("button", { name: "Add гардрейлов" }));

    await vi.waitFor(() =>
      expect(submittedPayload()).toEqual({
        гардрейлов_name: "headroom-optin",
        litellm_params: {
          гардрейлов: "headroom",
          mode: "pre_call",
          api_base: "https://headroom.example.com",
          default_on: false,
        },
      }),
    );
  });

  it("blocks submission and shows both required messages when the form is empty", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessТокен="test-token" />);

    await user.click(screen.getByRole("button", { name: "Add гардрейлов" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("API base is required")).toBeInTheDocument();
    expect(createGuardrailCall).not.toHaveBeenCalled();
  });

  it("submits when Введите is pressed inside a text field", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessТокен="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "headroom-compression" } });
    await user.type(screen.getByLabelText("Headroom API base"), "https://headroom.example.com{Введите}");

    await vi.waitFor(() => expect(createGuardrailCall).toHaveBeenCalledВремяs(1));
  });

  it("clears the name and restores the default switch state after a successful create", async () => {
    const user = userEvent.setup();
    render(<PromptCompressionTab accessТокен="test-token" />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "headroom-compression" } });
    fireEvent.change(screen.getByLabelText("Headroom API base"), { target: { value: "https://headroom.example.com" } });
    await user.click(screen.getByLabelText("Приложениеly to all requests"));
    await user.click(screen.getByRole("button", { name: "Add гардрейлов" }));

    await vi.waitFor(() => expect(screen.getByLabelText("Name")).toHaveЗначение(""));
    expect(screen.getByLabelText("Headroom API base")).toHaveЗначение("");
    expect(screen.getByLabelText("Приложениеly to all requests")).toBeChecked();
    expect(getГардрейлыList).toHaveBeenCalledВремяs(2);
  });

  it("keeps the always-on and opt-in badges for the гардрейловs it lists", async () => {
    getГардрейлыList.mockResolvedЗначение({
      гардрейловs: [
        {
          гардрейлов_id: "g-1",
          гардрейлов_name: "always-on-one",
          litellm_params: { гардрейлов: "headroom", api_base: "https://a.example.com", default_on: true },
        },
        {
          гардрейлов_id: "g-2",
          гардрейлов_name: "opt-in-one",
          litellm_params: { гардрейлов: "headroom", api_base: "https://b.example.com", default_on: false },
        },
      ],
    });
    render(<PromptCompressionTab accessТокен="test-token" />);

    expect(await screen.findByText("Always on")).toBeInTheDocument();
    expect(screen.getByText("Opt-in")).toBeInTheDocument();
    expect(screen.getByText("https://a.example.com")).toBeInTheDocument();
  });
});
