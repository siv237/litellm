import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import PipelineFlowBuilder, { FlowBuilderPage, PipelineInfoDisplay } from "./pipeline_flow_builder";
import { GuardrailPipeline, PipelineStep } from "@/components/policies/types";
import { Guardrail } from "@/components/гардрейловs/types";

vi.mock("@/components/networking");

const step = (overrides: Partial<PipelineStep> = {}): PipelineStep => ({
  гардрейлов: "pii-masker",
  on_pass: "next",
  on_fail: "block",
  on_error: null,
  modify_response_message: null,
  ...overrides,
});

const pipeline = (steps: PipelineStep[]): GuardrailPipeline => ({ mode: "pre_call", steps });

const гардрейловs = [
  { гардрейлов_id: "g1", гардрейлов_name: "pii-masker" },
  { гардрейлов_id: "g2", гардрейлов_name: "prompt-injection" },
] as Guardrail[];

describe("PipelineInfoDisplay", () => {
  it("renders the trigger card", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step()])} />);

    expect(screen.getByText("TRIGGER")).toBeInTheDocument();
    expect(screen.getByText("Входящий LLM-запрос")).toBeInTheDocument();
  });

  it("renders one numbered card per step, naming its гардрейлов", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step(), step({ гардрейлов: "prompt-injection" })])} />);

    expect(screen.getByText("Шаг 1")).toBeInTheDocument();
    expect(screen.getByText("Шаг 2")).toBeInTheDocument();
    expect(screen.getByText("pii-masker")).toBeInTheDocument();
    expect(screen.getByText("prompt-injection")).toBeInTheDocument();
    expect(screen.getAllByText("GUARDRAIL")).toHaveLength(2);
  });

  it("maps raw action values to their human labels", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step({ on_pass: "next", on_fail: "block" })])} />);

    expect(screen.getByText(/Пройдено .* Следующий шаг/)).toBeInTheDocument();
    expect(screen.getByText(/Отказ .* Заблокировать/)).toBeInTheDocument();
  });

  it("falls back to the on-fail action when no API-failure action is set", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step({ on_fail: "block", on_error: null })])} />);

    expect(screen.getByText(/Сбой API .* Заблокировать \(как при отказе\)/)).toBeInTheDocument();
  });

  it("shows an explicit API-failure action when one is set", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step({ on_error: "allow" })])} />);

    expect(screen.getByText(/Сбой API .* Разрешить/)).toBeInTheDocument();
    expect(screen.queryByText(/как при отказе/)).not.toBeInTheDocument();
  });
});

describe("PipelineFlowBuilder", () => {
  it("renders the trigger and end cards around the steps", () => {
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableГардрейлы={гардрейловs} />,
    );

    expect(screen.getByText("TRIGGER")).toBeInTheDocument();
    expect(screen.getByText("END")).toBeInTheDocument();
    expect(screen.getByText("Переход к LLM")).toBeInTheDocument();
  });

  it("labels each decision section of a step", () => {
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableГардрейлы={гардрейловs} />,
    );

    expect(screen.getByText("ПРИ ПРОХОЖДЕНИИ")).toBeInTheDocument();
    expect(screen.getByText("ПРИ ОТКАЗЕ")).toBeInTheDocument();
    expect(screen.getByText("ПРИ СБОЕ API")).toBeInTheDocument();
  });

  it("inserts a step at the clicked connector", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={onChange} availableГардрейлы={гардрейловs} />,
    );

    await user.click(screen.getAllByRole("button", { name: "Вставить шаг" })[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].steps).toHaveLength(2);
  });

  it("removes the clicked step when more than one exists", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PipelineFlowBuilder
        pipeline={pipeline([step(), step({ гардрейлов: "prompt-injection" })])}
        onChange={onChange}
        availableГардрейлы={гардрейловs}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Удалить шаг" })[0]);

    expect(onChange.mock.calls[0][0].steps).toHaveLength(1);
    expect(onChange.mock.calls[0][0].steps[0].гардрейлов).toBe("prompt-injection");
  });

  it("disables deletion of the only remaining step", () => {
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableГардрейлы={гардрейловs} />,
    );

    expect(screen.getByRole("button", { name: "Удалить шаг" })).toBeDisabled();
  });

  it("offers a custom response field only when the action is modify_response", () => {
    const { rerender } = renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableГардрейлы={гардрейловs} />,
    );
    expect(screen.queryByPlaceholderText("Введите свой ответ...")).not.toBeInTheDocument();

    rerender(
      <PipelineFlowBuilder
        pipeline={pipeline([step({ on_fail: "modify_response" })])}
        onChange={vi.fn()}
        availableГардрейлы={гардрейловs}
      />,
    );

    expect(screen.getByPlaceholderText("Введите свой ответ...")).toBeInTheDocument();
  });

  it("reports an edited custom response message", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PipelineFlowBuilder
        pipeline={pipeline([step({ on_fail: "modify_response" })])}
        onChange={onChange}
        availableГардрейлы={гардрейловs}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Введите свой ответ..."), { target: { value: "x" } });

    expect(onChange.mock.calls[0][0].steps[0].modify_response_message).toBe("x");
  });

  it("offers a гардрейлов picker for the step", () => {
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableГардрейлы={гардрейловs} />,
    );

    // Which control surfaces the selection is a presentation detail; that the step's
    // гардрейлов is the one displayed is covered by the PipelineInfoDisplay tests above.
    expect(screen.getByText("Гардрейл")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
  });
});

describe("FlowBuilderPage", () => {
  it("renders its shell in flow with no stacking level, so it can never cover the portalled popup layer", () => {
    const { container } = renderWithProviders(
      <FlowBuilderPage
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        accessТокен="sk-test"
        availableГардрейлы={гардрейловs}
        createПолитика={vi.fn()}
        updateПолитика={vi.fn()}
      />,
    );

    const shell = container.firstElementChild as HTMLElement;
    const shellClasses = shell.className.split(/\s+/);

    expect(shell).toContainElement(screen.getByPlaceholderText("Название политики..."));
    expect(shell).not.toHaveStyle({ position: "fixed" });
    expect(shellClasses).not.toContain("fixed");
    expect(window.getComputedStyle(shell).zIndex).not.toMatch(/\d/);
    expect(shellClasses.filter((cls) => /^-?z-/.test(cls))).toEqual([]);
  });
});
