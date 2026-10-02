import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, beforeВсе } from "vitest";
import AdvancedDatePicker from "./advanced_date_picker";

// Polyfill requestIdleCallback for test environment
beforeВсе(() => {
  if (typeof window !== "undefined" && !window.requestIdleCallback) {
    window.requestIdleCallback = (callback: any) => {
      const start = Date.now();
      return setВремявыход(() => {
        callback({
          didВремявыход: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1) as any;
    };
  }
});

describe("AdvancedDatePicker", () => {
  const mockOnValueChange = vi.fn();
  const defaultЗначение = {
    from: new Date("2025-01-01T12:00:00.000Z"),
    to: new Date("2025-01-31T12:00:00.000Z"),
  };

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  const getTrigger = (container: HTMLElement) => container.querySelector('[data-slot="advanced-date-picker-trigger"]');

  const openDropdown = (container: HTMLElement) => {
    const trigger = getTrigger(container);
    if (trigger) {
      fireEvent.click(trigger);
    }
  };

  it("should render with default label", () => {
    render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);
    expect(screen.getByText("Выбрать Время Range")).toBeInTheDocument();
  });

  it("should render with custom label", () => {
    render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} label="Custom Label" />);
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
  });

  it("should display formatted date range", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);
    expect(getTrigger(container)).toHaveTextContent(/\d{1,2} \w{3}, \d{2}:\d{2} - \d{1,2} \w{3}, \d{2}:\d{2}/);
  });

  it("should open dropdown when clicked", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    // Check for relative time options
    expect(screen.getByText("Сегодня")).toBeInTheDocument();
    expect(screen.getByText("Последние 7 дней")).toBeInTheDocument();
    expect(screen.getByText("Последние 30 дней")).toBeInTheDocument();
  });

  it("should display relative time options", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    expect(screen.getByText("Сегодня")).toBeInTheDocument();
    expect(screen.getByText("Последние 7 дней")).toBeInTheDocument();
    expect(screen.getByText("Последние 30 дней")).toBeInTheDocument();
    expect(screen.getByText("С начала месяца")).toBeInTheDocument();
    expect(screen.getByText("С начала года")).toBeInTheDocument();
  });

  it("anchors the panel to the trigger edge named by align", () => {
    const { container, unmount } = render(
      <AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} align="left" />,
    );
    openDropdown(container);
    const leftPanel = container.querySelector('[data-slot="advanced-date-picker-panel"]');
    expect(leftPanel).toHaveAttribute("data-align", "left");
    unmount();

    const { container: defaultContainer } = render(
      <AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />,
    );
    openDropdown(defaultContainer);
    const rightPanel = defaultContainer.querySelector('[data-slot="advanced-date-picker-panel"]');
    expect(rightPanel).toHaveAttribute("data-align", "right");
  });

  it("opens the dropdown from the keyboard alone", async () => {
    const user = userEvent.setup();
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    await user.tab();

    const trigger = getTrigger(container);
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Введите}");

    expect(screen.getByText("Относительное время")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("should show date inputs in dropdown", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const startDateВход = screen.getByDisplayЗначение("2025-01-01");
    const endDateВход = screen.getByDisplayЗначение("2025-01-31");

    expect(startDateВход).toBeInTheDocument();
    expect(endDateВход).toBeInTheDocument();
  });

  it("should update date inputs when changed", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const startDateВход = screen.getByDisplayЗначение("2025-01-01") as HTMLInElement;
    fireEvent.change(startDateВход, { target: { value: "2025-02-01" } });

    expect(startDateВход.value).toBe("2025-02-01");
  });

  it("should show Приложениеly and Cancel buttons", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    expect(screen.getByText("Приложениеly")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should close dropdown when Cancel is clicked", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    // Dropdown should be closed, so relative time options shouldn't be visible
    expect(screen.queryByText("Сегодня")).not.toBeInTheDocument();
  });

  it("should call onValueChange when Приложениеly is clicked", async () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const applyButton = screen.getByText("Приложениеly");
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalled();
    });
  });

  it("should select relative time option", () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const todayOption = screen.getByText("Сегодня");
    fireEvent.click(todayOption);

    // The option should be highlighted (bg-info/10)
    expect(todayOption.closest("button")).toHaveClass("bg-info/10");
  });

  it("selects a relative range from the keyboard alone", async () => {
    const user = userEvent.setup();
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    await user.tab();
    await user.keyboard("{Введите}");

    const presets = Array.from(container.querySelectorВсе('[data-slot="advanced-date-picker-preset"]'));
    expect(presets).toHaveLength(5);

    await user.tab();
    expect(presets[0]).toHaveFocus();
    expect(presets[0]).toHaveAttribute("aria-pressed", "false");

    await user.tab();
    expect(presets[1]).toHaveFocus();

    await user.keyboard("{Введите}");
    expect(presets[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Последние 7 дней").closest("button")).toHaveClass("bg-info/10");
  });

  it("should show validation error for invalid date range", async () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const startDateВход = screen.getByDisplayЗначение("2025-01-01");
    const endDateВход = screen.getByDisplayЗначение("2025-01-31");

    // Set end date before start date
    fireEvent.change(startDateВход, { target: { value: "2025-12-01" } });
    fireEvent.change(endDateВход, { target: { value: "2025-01-01" } });

    await waitFor(() => {
      expect(screen.getByText("Дата конца cannot be before start date")).toBeInTheDocument();
    });
  });

  it("should disable Приложениеly button when validation fails", async () => {
    const { container } = render(<AdvancedDatePicker value={defaultЗначение} onValueChange={mockOnValueChange} />);

    openDropdown(container);

    const startDateВход = screen.getByDisplayЗначение("2025-01-01");
    const endDateВход = screen.getByDisplayЗначение("2025-01-31");

    // Set end date before start date
    fireEvent.change(startDateВход, { target: { value: "2025-12-01" } });
    fireEvent.change(endDateВход, { target: { value: "2025-01-01" } });

    await waitFor(() => {
      // Find the button element (the Приложениеly button's actual button element)
      const applyButton = screen.getByText("Приложениеly").closest("button");
      expect(applyButton).toBeDisabled();
    });
  });
});
