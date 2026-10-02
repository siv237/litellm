import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddРезервные моделиModal } from "./AddРезервные моделиModal";

describe("AddРезервные моделиModal", () => {
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should render the modal when open is true", () => {
    render(
      <AddРезервные моделиModal open={true} onCancel={mockOnCancel}>
        <div>Test Content</div>
      </AddРезервные моделиModal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Конфигурацияure Режимl Резервные модели")).toBeInTheDocument();
    expect(
      screen.getByText("Manage multiple fallback chains for different Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs (up to 5 groups at a time)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should not render the modal when open is false", () => {
    render(
      <AddРезервные моделиModal open={false} onCancel={mockOnCancel}>
        <div>Test Content</div>
      </AddРезервные моделиModal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render children content when modal is open", () => {
    render(
      <AddРезервные моделиModal open={true} onCancel={mockOnCancel}>
        <div data-testid="child-content">Child Component</div>
      </AddРезервные моделиModal>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Child Component")).toBeInTheDocument();
  });

  it("should display the correct title and description", () => {
    render(
      <AddРезервные моделиModal open={true} onCancel={mockOnCancel}>
        <div>Content</div>
      </AddРезервные моделиModal>,
    );

    expect(screen.getByText("Конфигурацияure Режимl Резервные модели")).toBeInTheDocument();
    expect(screen.getByText(/Manage multiple fallback chains/i)).toBeInTheDocument();
  });
});
