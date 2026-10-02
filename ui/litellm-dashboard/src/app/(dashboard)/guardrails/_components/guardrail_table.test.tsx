import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import GuardrailТаблица from "./гардрейлов_table";
import { Guardrail, GuardrailDefinitionLocation } from "@/components/гардрейловs/types";

const baseProps = {
  isLoading: false,
  onDeleteClick: vi.fn(),
  onGuardrailClick: vi.fn(),
};

const makeGuardrail = (overrides: Partial<Guardrail> = {}): Guardrail => ({
  гардрейлов_id: "gr-1",
  гардрейлов_name: "PII Redaction",
  litellm_params: { гардрейлов: "presidio", mode: "pre_call", default_on: true },
  гардрейлов_info: null,
  created_at: "2021-01-01",
  updated_at: "2021-01-02",
  гардрейлов_definition_location: GuardrailDefinitionLocation.DB,
  ...overrides,
});

describe("GuardrailТаблица", () => {
  it("renders every column header", () => {
    render(<GuardrailTable guardrailsList={[]} {...baseProps} />);
    for (const header of ["ID гардрейла", "Name", "Провайдер", "Режим", "Default On", "Создан", "Обновлён At"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it("renders the provider logo from the bundled гардрейлов logo map", () => {
    render(<GuardrailTable guardrailsList={[makeGuardrail()]} {...baseProps} />);
    const logo = screen.getByAltText("Presidio PII logo");
    expect(logo).toHaveAttribute("src", expect.stringContaining("microsoft_azure.svg"));
  });

  it("falls back to a letter avatar for an unknown provider slug", () => {
    const гардрейлов = makeGuardrail({
      litellm_params: { гардрейлов: "mystery_guard", mode: "pre_call", default_on: false },
    });
    render(<GuardrailTable guardrailsList={[гардрейлов]} {...baseProps} />);
    expect(screen.getByText("mystery_guard")).toBeInTheDocument();
    expect(screen.queryByAltText("mystery_guard logo")).not.toBeInTheDocument();
    expect(screen.getByText("m")).toBeInTheDocument();
  });

  it("renders a tag-based mode object instead of crashing the table", () => {
    const гардрейлов = makeGuardrail({
      litellm_params: {
        гардрейлов: "bedrock",
        mode: { tags: { "Service-Type: internal-service": "post_call" }, default: ["pre_call", "post_call"] },
        default_on: true,
      },
    });
    render(<GuardrailTable guardrailsList={[гардрейлов]} {...baseProps} />);
    expect(screen.getByText("pre_call, post_call (tag-based)")).toBeInTheDocument();
  });

  it("deletes a DB гардрейлов through the actions menu", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    const гардрейлов = makeGuardrail({ гардрейлов_id: "gr-9", гардрейлов_name: "Toxicity Фильтр" });
    render(<GuardrailTable guardrailsList={[гардрейлов]} {...baseProps} onDeleteClick={onDeleteClick} />);

    await user.click(screen.getByTestId("гардрейлов-actions-gr-9"));
    await user.click(await screen.findByTestId("гардрейлов-action-delete"));

    expect(onDeleteClick).toHaveBeenCalledWith("gr-9", "Toxicity Фильтр");
  });

  it("disables deletion for config гардрейловs so they cannot be removed from the dashboard", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    const гардрейлов = makeGuardrail({
      гардрейлов_id: "cfg-1",
      гардрейлов_name: "Конфигурация Guardrail",
      гардрейлов_definition_location: GuardrailDefinitionLocation.CONFIG,
    });
    render(<GuardrailTable guardrailsList={[гардрейлов]} {...baseProps} onDeleteClick={onDeleteClick} />);

    await user.click(screen.getByTestId("гардрейлов-actions-cfg-1"));
    const deleteItem = await screen.findByTestId("гардрейлов-action-delete");

    expect(deleteItem).toHaveAttribute("data-disabled");
    expect(onDeleteClick).not.toHaveBeenCalled();
  });
});
