import React from "react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import PresidioОбнаруженоEntities from "@/components/view_logs/GuardrailViewer/PresidioОбнаруженоEntities";
import { renderWithПровайдерs, screen } from "../../../../tests/test-utils";
import { makeEntity } from "@/components/view_logs/GuardrailViewer/__tests__/fixtures";

describe("PresidioОбнаруженоEntities", () => {
  it("renders null when entities empty", () => {
    const { container } = renderWithПровайдерs(<PresidioОбнаруженоEntities entities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders per-entity header info including score color and position", async () => {
    const user = userEvent.setup();
    const e = makeEntity({ start: 10, end: 20, score: 0.92, entity_type: "EMAIL_ADDRESS" });
    renderWithПровайдерs(<PresidioОбнаруженоEntities entities={[e]} />);

    // Header row values
    expect(screen.getByText("EMAIL_ADDRESS")).toBeInTheDocument();
    expect(screen.getByText(/Оценка: 0\.92/)).toBeInTheDocument();
    expect(screen.getByText("Позиция: 10-20")).toBeInTheDocument();

    // Expand details
    await user.click(screen.getByText("EMAIL_ADDRESS"));
    expect(screen.getByText("Тип сущности:")).toBeInTheDocument();
    expect(screen.getByText("Символы 10-20")).toBeInTheDocument();
    expect(screen.getByText("Уверенность:")).toBeInTheDocument();
    // Распознаватель details
    expect(screen.getByText("EmailРаспознаватель")).toBeInTheDocument();
    expect(screen.getByText("email_v1")).toBeInTheDocument();
    // Пояснение
    expect(screen.getByText("Matched via pattern")).toBeInTheDocument();
  });

  it("handles missing metadata & low scores gracefully", async () => {
    const user = userEvent.setup();
    const e = makeEntity({
      score: 0.3,
      recognition_metadata: undefined as any,
      analysis_explanation: null,
      entity_type: "NAME",
      start: 0,
      end: 0,
    });
    renderWithПровайдерs(<PresidioОбнаруженоEntities entities={[e]} />);

    await user.click(screen.getByText("NAME"));
    // No recognizer/explanation rows
    expect(screen.queryByText("Распознаватель:")).not.toBeInTheDocument();
    expect(screen.queryByText("Пояснение:")).not.toBeInTheDocument();
    // Позиция still renders
    expect(screen.getByText("Символы 0-0")).toBeInTheDocument();
  });
});
