import React from "react";
import { describe, it, expect } from "vitest";
import BedrockGuardrailDetails, {
  BedrockGuardrailОтвет,
} from "@/components/view_logs/GuardrailViewer/BedrockGuardrailDetails";
import { renderWithProviders, screen } from "../../../../tests/test-utils";
import {
  makeAssessment,
  makeBedrockCoverage,
  makeBedrockОтвет,
  makeBedrockИспользование,
} from "@/components/view_logs/GuardrailViewer/__tests__/fixtures";

describe("BedrockGuardrailDetails", () => {
  it("returns null when response is falsy", () => {
    // @ts-expect-error testing nullish handling
    const { container } = renderWithProviders(<BedrockGuardrailDetails response={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders top summary: action chip, reason, blocked response", () => {
    const resp: BedrockGuardrailОтвет = makeBedrockОтвет({
      action: "GUARDRAIL_INTERVENED",
      actionReason: "Политика violation",
      blockedОтвет: "[blocked]",
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);

    expect(screen.getByText("Действие:")).toBeInTheDocument();
    expect(screen.getByText("Политика violation")).toBeInTheDocument();
    expect(screen.getByText("[blocked]")).toBeInTheDocument();
  });

  it("renders coverage and usage pills", () => {
    const resp = makeBedrockОтвет({
      гардрейловCoverage: makeBedrockCoverage(),
      usage: makeBedrockИспользование({ contentPolicyUnits: 7, wordPolicyUnits: 1 }),
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);

    expect(screen.getByText(/text guarded 27\/100/)).toBeInTheDocument();
    expect(screen.getByText(/images guarded 1\/3/)).toBeInTheDocument();
    expect(screen.getByText(/contentPolicyUnits: 7/)).toBeInTheDocument();
    expect(screen.getByText(/wordPolicyUnits: 1/)).toBeInTheDocument();
  });

  it("renders выходputs when present (prefers `выходputs`, falls back to `выходput`)", () => {
    // Использование выходputs
    let resp = makeBedrockОтвет({ выходputs: [{ text: "hello" }] });
    const { rerender } = renderWithProviders(<BedrockGuardrailDetails response={resp} />);
    expect(screen.getByText("Результаты")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();

    // Использование выходput
    resp = makeBedrockОтвет({ выходputs: undefined, выходput: [{ text: "world" }] });
    rerender(<BedrockGuardrailDetails response={resp} />);
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("renders assessments with all policy sections and metrics", () => {
    const resp = makeBedrockОтвет({
      assessments: [makeAssessment()],
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);

    // Assessment section present
    expect(screen.getByText("Assessment #1")).toBeInTheDocument();

    // Word policy sections
    expect(screen.getByText("Словарная политика")).toBeInTheDocument();
    expect(screen.getByText("Пользовательские слова")).toBeInTheDocument();
    expect(screen.getByText("Управляемые списки слов")).toBeInTheDocument();

    // Contextual grounding table headers
    expect(screen.getByText("Контекстная обоснованность")).toBeInTheDocument();
    expect(screen.getAllByText("Оценка").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Порог").length).toBeGreaterThan(0);

    // Sensitive Info sections
    expect(screen.getByText("Конфиденциальная информация")).toBeInTheDocument();
    expect(screen.getByText("Персональные данные (PII)")).toBeInTheDocument();
    expect(screen.getByText("Пользовательские регулярные выражения")).toBeInTheDocument();

    // Topic Политика
    expect(screen.getByText("Тематическая политика")).toBeInTheDocument();
    expect(screen.getByText("weapons")).toBeInTheDocument();

    // Invocation Метрикаs
    expect(screen.getByText("Метрики вызова")).toBeInTheDocument();

    // Raw JSON section exists (closed by default)
    expect(screen.getByText("Исходный ответ AWS Bedrock Гардрейлы")).toBeInTheDocument();
  });

  it("handles non-text выходputs gracefully", () => {
    const resp = makeBedrockОтвет({ выходputs: [{}, { text: "texty" }] });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);
    expect(screen.getByText("(не текстовый вывод)")).toBeInTheDocument();
    expect(screen.getByText("texty")).toBeInTheDocument();
  });

  it("gracefully handles missing необязательно sections", () => {
    const resp = makeBedrockОтвет({
      assessments: [
        {
          // only include minimal fields; others omitted
          invocationMetrics: { гардрейловProcessingLatency: 5 },
        } as any,
      ],
      usage: undefined,
      гардрейловCoverage: undefined,
      выходputs: [],
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);
    // No crash, minimal render: Assessment + Invocation Метрикаs present, but no usage/coverage chips at top
    expect(screen.getByText("Assessment #1")).toBeInTheDocument();
  });
});
