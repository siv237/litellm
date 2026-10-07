import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuardrailSelectionModal from "./guardrail_selection_modal";

const makeGuardrailDef = (name: string, description = "A guardrail Описание") => ({
  guardrail_name: name,
  guardrail_info: { description },
  litellm_params: { guardrail: "presidio", mode: "pre_call" },
});

const makeTemplate = (guardrailDefs: any[] = [], overrides: any = {}) => ({
  title: "Test Template",
  guardrailDefinitions: guardrailDefs,
  ...overrides,
});

const defaultProps = {
  visible: true,
  template: makeTemplate([makeGuardrailDef("guardrail-new-1"), makeGuardrailDef("guardrail-new-2")]),
  existingGuardrails: new Set<string>(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("GuardrailВыбратьionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render guardrail names from the template", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    expect(await screen.findByText("guardrail-new-1")).toBeInTheDocument();
    expect(screen.getByText("guardrail-new-2")).toBeInTheDocument();
  });

  it("should pre-Выбрать only new Гардрейлы when the modal opens", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("guardrail-new-1");
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it("should not show a checkbox for Гардрейлы that already exist", async () => {
    const props = {
      ...defaultProps,
      template: makeTemplate([makeGuardrailDef("existing-g"), makeGuardrailDef("new-g")]),
      existingGuardrails: new Set(["existing-g"]),
    };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    await screen.findByText("existing-g");
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("should show an 'Уже существует' tag for Гардрейлы that exist in the system", async () => {
    const props = {
      ...defaultProps,
      template: makeTemplate([makeGuardrailDef("existing-g")]),
      existingGuardrails: new Set(["existing-g"]),
    };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByText("Уже существует")).toBeInTheDocument();
  });

  it("should show 'Создать N Гардрейлы & Использовать шаблон' on the Подтвердить button when N Гардрейлы are selected", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    expect(await screen.findByRole("button", { name: /Создать 2 Гардрейлы & Использовать шаблон/i })).toBeInTheDocument();
  });

  it("should show 'Использовать шаблон' on the Подтвердить button when Нет new Гардрейлы are selected", async () => {
    const props = {
      ...defaultProps,
      template: makeTemplate([makeGuardrailDef("existing-g")]),
      existingGuardrails: new Set(["existing-g"]),
    };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByRole("button", { name: /^Использовать шаблон$/i })).toBeInTheDocument();
  });

  it("should call onConfirm with the definitions of selected Гардрейлы when confirmed", async () => {
    const user = userEvent.setup();
    const def = makeGuardrailDef("my-guardrail");
    const props = { ...defaultProps, template: makeTemplate([def]) };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    await user.click(await screen.findByRole("button", { name: /Создать 1 guardrail/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith([def]);
  });

  it("should Снять выделение Гардрейлы when 'Снять выделение' is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("guardrail-new-1");
    await user.click(screen.getByRole("button", { name: /Снять выделение/i }));
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).not.toBeChecked());
  });

  it("should re-Выбрать все новые Гардрейлы when 'Выбрать все новые' is clicked after deselecting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("guardrail-new-1");
    await user.click(screen.getByRole("button", { name: /Снять выделение/i }));
    await user.click(screen.getByRole("button", { name: /Выбрать все новые/i }));
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).toBeChecked());
  });

  it("should show 'Нет Гардрейлы defined' when the template has Нет guardrail definitions", async () => {
    const props = { ...defaultProps, template: makeTemplate([]) };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByText(/Нет Гардрейлы defined for this template/i)).toBeInTheDocument();
  });

  it("should show a progress badge when progressInfo is provided", async () => {
    const props = { ...defaultProps, progressInfo: { current: 2, total: 5 } };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByText(/template 2 of 5/i)).toBeInTheDocument();
  });

  it("should call onCancel when the Отмена button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("guardrail-new-1");
    await user.click(screen.getByRole("button", { name: /^Отмена$/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
