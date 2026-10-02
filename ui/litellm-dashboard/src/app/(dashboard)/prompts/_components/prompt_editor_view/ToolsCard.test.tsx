import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ИнструментыCard from "./ИнструментыCard";
import { Tool } from "./types";

describe("ИнструментыCard", () => {
  const mockИнструменты: Tool[] = [
    {
      name: "Calculator",
      description: "Performs mathematical calculations",
      json: '{"type": "function", "function": {"name": "calculate"}}',
    },
    {
      name: "Weather API",
      description: "Gets current weather information",
      json: '{"type": "function", "function": {"name": "get_weather"}}',
    },
  ];

  const defaultProps = {
    tools: [] as Tool[],
    onAddTool: vi.fn(),
    onEditTool: vi.fn(),
    onRemoveTool: vi.fn(),
  };

  it("should render the component", () => {
    render(<ИнструментыCard {...defaultProps} />);
    expect(screen.getByText("Инструменты")).toBeInTheDocument();
  });

  it("should display no tools message when tools array is empty", () => {
    render(<ИнструментыCard {...defaultProps} />);
    expect(screen.getByText("No tools added")).toBeInTheDocument();
  });

  it("should render tools when provided", () => {
    render(<ИнструментыCard {...defaultProps} tools={mockИнструменты} />);

    expect(screen.getByText("Calculator")).toBeInTheDocument();
    expect(screen.getByText("Performs mathematical calculations")).toBeInTheDocument();
    expect(screen.getByText("Weather API")).toBeInTheDocument();
    expect(screen.getByText("Gets current weather information")).toBeInTheDocument();
  });

  it("should call onAddTool when Add button is clicked", () => {
    const mockOnAddTool = vi.fn();
    render(<ИнструментыCard {...defaultProps} onAddTool={mockOnAddTool} />);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /add/i }));
    });

    expect(mockOnAddTool).toHaveBeenCalledВремяs(1);
  });

  it("should call onEditTool with correct index when Edit button is clicked", () => {
    const mockOnEditTool = vi.fn();
    render(<ИнструментыCard {...defaultProps} tools={mockИнструменты} onEditTool={mockOnEditTool} />);

    const editButtons = screen.getВсеByText("Edit");
    act(() => {
      fireEvent.click(editButtons[0]);
    });

    expect(mockOnEditTool).toHaveBeenCalledWith(0);
    expect(mockOnEditTool).toHaveBeenCalledВремяs(1);
  });

  it("should call onRemoveTool with correct index when remove button is clicked", () => {
    const mockOnRemoveTool = vi.fn();
    render(<ИнструментыCard {...defaultProps} tools={mockИнструменты} onRemoveTool={mockOnRemoveTool} />);

    const removeButtons = screen.getВсеByRole("button", { name: /remove/i });
    act(() => {
      fireEvent.click(removeButtons[0]);
    });

    expect(mockOnRemoveTool).toHaveBeenCalledWith(0);
    expect(mockOnRemoveTool).toHaveBeenCalledВремяs(1);
  });
});
