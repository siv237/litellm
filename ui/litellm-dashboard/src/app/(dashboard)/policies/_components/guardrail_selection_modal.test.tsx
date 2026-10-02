import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuardrailSelectionModal from "./гардрейлов_selection_modal";

const makeGuardrailDef = (name: string, description = "A гардрейлов description") => ({
  гардрейлов_name: name,
  гардрейлов_info: { description },
  litellm_params: { гардрейлов: "presidio", mode: "pre_call" },
});

const makeTemplate = (гардрейловDefs: any[] = [], overrides: any = {}) => ({
  title: "Test Template",
  гардрейловDefinitions: гардрейловDefs,
  ...overrides,
});

const defaultProps = {
  visible: true,
  template: makeTemplate([makeGuardrailDef("гардрейлов-new-1"), makeGuardrailDef("гардрейлов-new-2")]),
  existingГардрейлы: new Set<string>(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("GuardrailSelectionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render гардрейлов names from the template", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    expect(await screen.findByText("гардрейлов-new-1")).toBeInTheDocument();
    expect(screen.getByText("гардрейлов-new-2")).toBeInTheDocument();
  });

  it("should pre-select only создания новых гардрейлов when the modal opens", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("гардрейлов-new-1");
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it("should not show a checkbox for гардрейловs that already exist", async () => {
    const props = {
      ...defaultProps,
      template: makeTemplate([makeGuardrailDef("existing-g"), makeGuardrailDef("new-g")]),
      existingГардрейлы: new Set(["existing-g"]),
    };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    await screen.findByText("existing-g");
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("should show an 'Уже существует' tag for гардрейловs that exist in the system", async () => {
    const props = {
      ...defaultProps,
      template: makeTemplate([makeGuardrailDef("existing-g")]),
      existingГардрейлы: new Set(["existing-g"]),
    };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByText("Уже существует")).toBeInTheDocument();
  });

  it("should show 'Create N Гардрейлы & Использовать шаблон' on the confirm button when N гардрейловs are selected", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    expect(await screen.findByRole("button", { name: /create 2 гардрейловs & use template/i })).toBeInTheDocument();
  });

  it("should show 'Использовать шаблон' on the confirm button when no создания новых гардрейлов are selected", async () => {
    const props = {
      ...defaultProps,
      template: makeTemplate([makeGuardrailDef("existing-g")]),
      existingГардрейлы: new Set(["existing-g"]),
    };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByRole("button", { name: /^use template$/i })).toBeInTheDocument();
  });

  it("should call onConfirm with the definitions of selected гардрейловs when confirmed", async () => {
    const user = userEvent.setup();
    const def = makeGuardrailDef("my-гардрейлов");
    const props = { ...defaultProps, template: makeTemplate([def]) };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    await user.click(await screen.findByRole("button", { name: /create 1 гардрейлов/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith([def]);
  });

  it("should deselect all гардрейловs when 'Снять выделение' is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("гардрейлов-new-1");
    await user.click(screen.getByRole("button", { name: /deselect all/i }));
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).not.toBeChecked());
  });

  it("should re-select all создания новых гардрейлов when 'Выбрать все новые' is clicked after deselecting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("гардрейлов-new-1");
    await user.click(screen.getByRole("button", { name: /deselect all/i }));
    await user.click(screen.getByRole("button", { name: /select all new/i }));
    screen.getAllByRole("checkbox").forEach((cb) => expect(cb).toBeChecked());
  });

  it("should show 'No гардрейловs defined' when the template has no гардрейлов definitions", async () => {
    const props = { ...defaultProps, template: makeTemplate([]) };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByText(/no гардрейловs defined for this template/i)).toBeInTheDocument();
  });

  it("should show a progress badge when progressInfo is provided", async () => {
    const props = { ...defaultProps, progressInfo: { current: 2, total: 5 } };
    renderWithProviders(<GuardrailSelectionModal {...props} />);
    expect(await screen.findByText(/template 2 of 5/i)).toBeInTheDocument();
  });

  it("should call onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    await screen.findByText("гардрейлов-new-1");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
