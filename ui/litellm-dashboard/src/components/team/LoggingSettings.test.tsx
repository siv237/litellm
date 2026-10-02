import { readFileSync } from "fs";
import { resolve } from "path";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs, screen, fireEvent } from "../../../tests/test-utils";
import LoggingSettings from "./LoggingSettings";

const SOURCE_PATH = resolve(process.cwd(), "src/components/team/LoggingSettings.tsx");

const HARDCODED_PALETTE =
  /\b(?:text|bg|border|hover:bg|hover:text|hover:border|dark:bg|dark:text|dark:border|ring|divide|fill|stroke)-(?:gray|slate|zinc|neutral|stone|red|blue|green|yellow|amber|orange|indigo|purple|pink|rose|teal|cyan|sky|violet|fuchsia|lime|emerald)-\d+(?:\/\d+)?\b/g;

const SEMANTIC_TOKEN =
  /\b(?:text|bg|border|hover:bg|hover:text|ring|divide|fill|stroke)-(?:foreground|muted-foreground|muted|background|card|popover|primary|secondary|destructive|border|input|accent|ring)(?:-foreground)?(?:\/\d+)?\b/g;

describe("LoggingSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("passes a number to updateCallbackVar when user inputs a number in NumericalВход", async () => {
    const mockOnChange = vi.fn();

    // Create initial config with a callback that has number parameters (LangSmith has langsmith_sampling_rate)
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={mockOnChange} />);

    // Find the numerical input for langsmith_sampling_rate
    const numericalВход = screen.getByPlaceholderText("os.environ/LANGSMITH_SAMPLING_RATE");
    expect(numericalВход).toBeInTheDocument();

    // Use fireEvent.change to directly set the value (more reliable for number inputs)
    fireEvent.change(numericalВход, { target: { value: "0.75" } });

    // Verify that onChange was called
    expect(mockOnChange).toHaveBeenCalled();

    // Get the last call to onChange
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    const updatedКонфигурация = lastCall[0];

    // Verify the structure and that the value is stored as a string (as expected by the component)
    expect(updatedКонфигурация).toHaveLength(1);
    expect(updatedКонфигурация[0].callback_vars.langsmith_sampling_rate).toBe("0.75");
  });

  it("displays number type indicator and validation hint for number parameters", () => {
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={vi.fn()} />);

    // Check for the "Number" badge
    expect(screen.getByText("Number")).toBeInTheDocument();

    // Check for the validation hint
    expect(screen.getByText("Значение must be between 0 and 1")).toBeInTheDocument();

    // Check that the input has the correct step attribute
    const numericalВход = screen.getByPlaceholderText("os.environ/LANGSMITH_SAMPLING_RATE");
    expect(numericalВход).toHaveAttribute("step", "0.01");
  });

  it("handles number input and text input independently", async () => {
    const mockOnChange = vi.fn();

    // Start with some existing values to simulate a more realistic scenario
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {
          langsmith_sampling_rate: "0.3",
          langsmith_api_key: "initial-key",
        },
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={mockOnChange} />);

    // Find both number and text inputs
    const numericalВход = screen.getByPlaceholderText("os.environ/LANGSMITH_SAMPLING_RATE");
    const textВход = screen.getByPlaceholderText("os.environ/LANGSMITH_API_KEY");

    // Verify initial values are displayed
    expect(numericalВход).toHaveЗначение(0.3); // NumberВход shows numeric value
    expect(textВход).toHaveЗначение("initial-key");

    // Change the numerical input
    fireEvent.change(numericalВход, { target: { value: "0.5" } });

    // Verify numerical input change was recorded and preserves other values
    expect(mockOnChange).toHaveBeenCalled();
    let lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    let updatedКонфигурация = lastCall[0];
    expect(updatedКонфигурация[0].callback_vars.langsmith_sampling_rate).toBe("0.5");
    expect(updatedКонфигурация[0].callback_vars.langsmith_api_key).toBe("initial-key"); // Should preserve existing value

    // Change the text input (this tests that text inputs work independently)
    fireEvent.change(textВход, { target: { value: "test-api-key" } });

    // Verify text input change was also recorded
    lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    updatedКонфигурация = lastCall[0];
    expect(updatedКонфигурация[0].callback_vars.langsmith_api_key).toBe("test-api-key");
    // The component preserves the original initial value since we're starting from initial state each time
    expect(updatedКонфигурация[0].callback_vars.langsmith_sampling_rate).toBe("0.3"); // Preserves initial value
  });

  it("masks a sensitive parameter until the reveal toggle is used", async () => {
    const user = userEvent.setup({ delay: null });
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: { langsmith_api_key: "sk-secret-value" },
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={vi.fn()} />);

    const apiКлючВход = screen.getByPlaceholderText("os.environ/LANGSMITH_API_KEY");
    expect(apiКлючВход).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(apiКлючВход).toHaveAttribute("type", "text");
    expect(apiКлючВход).toHaveЗначение("sk-secret-value");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(apiКлючВход).toHaveAttribute("type", "password");
  });

  it("shows the bundled logo in the integration card header", () => {
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={vi.fn()} />);

    expect(screen.getByAltText("LangSmith logo")).toHaveAttribute("src", "/_next/static/media/langsmith.png");
  });

  it("shows a letter avatar in the card header for a callback withвыход a bundled logo", () => {
    const initialЗначение = [
      {
        callback_name: "custom_callback_api",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={vi.fn()} />);

    expect(screen.getByText("Custom Callback API Конфигурацияuration")).toBeInTheDocument();
    expect(screen.queryByAltText("Custom Callback API logo")).not.toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("styles itself from semantic tokens instead of hardcoded palette classes", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");

    expect(source).toContain("const LoggingSettings");
    expect(source.match(SEMANTIC_TOKEN) ?? []).not.toHaveLength(0);
    expect(source.match(HARDCODED_PALETTE) ?? []).toHaveLength(0);
  });

  it("keeps the remove button destructive on hover instead of the ghost variant's foreground", () => {
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={vi.fn()} />);

    const remove = screen.getByRole("button", { name: "Remove" });
    expect(remove).toHaveClass("hover:text-destructive/80");
    expect(remove).not.toHaveClass("hover:text-foreground");
  });

  it("reports the chosen event type when a different option is picked", async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnChange = vi.fn();
    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={mockOnChange} />);

    await user.click(screen.getByRole("combobox", { name: "Event Type" }));
    await user.click(await screen.findByRole("option", { name: "Failure Only" }));

    expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ callback_type: "failure" })]);
  });

  it("correctly handles numerical input with decimal values", () => {
    const mockOnChange = vi.fn();

    const initialЗначение = [
      {
        callback_name: "langsmith",
        callback_type: "success",
        callback_vars: {},
      },
    ];

    renderWithПровайдерs(<LoggingSettings value={initialЗначение} onChange={mockOnChange} />);

    const numericalВход = screen.getByPlaceholderText("os.environ/LANGSMITH_SAMPLING_RATE");

    // Test various decimal values
    const testЗначениеs = ["0.1", "0.25", "0.5", "0.75", "1.0"];

    testЗначениеs.forEach((value) => {
      fireEvent.change(numericalВход, { target: { value } });

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      const updatedКонфигурация = lastCall[0];
      expect(updatedКонфигурация[0].callback_vars.langsmith_sampling_rate).toBe(value);
    });
  });
});
