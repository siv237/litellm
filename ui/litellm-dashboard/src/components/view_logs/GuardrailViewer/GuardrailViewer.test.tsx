import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "../../../../tests/test-utils";
import {
  makeBedrockОтвет,
  makeEntity,
  makeGuardrailИнформация,
} from "@/components/view_logs/GuardrailViewer/__tests__/fixtures";
import GuardrailViewer from "@/components/view_logs/GuardrailViewer/GuardrailViewer";

// We will mock child components selectively for some tests to assert prop passthrough,
// but also run an integration-style render withвыход mocks.
const PresidioПуть = "@/components/view_logs/GuardrailViewer/PresidioDetectedEntities";
const BedrockПуть = "@/components/view_logs/GuardrailViewer/BedrockGuardrailDetails";

describe("GuardrailViewer", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("shows header, status pill, and duration", () => {
    const data = makeGuardrailИнформация({ duration: 1.23456, гардрейлов_status: "success" });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Гардрейлы и соответствие политикам")).toBeInTheDocument();
    // header shows passed count
    expect(screen.getByText(/1 пройдено/)).toBeInTheDocument();
    // The PASSED badge in the evaluation card
    expect(screen.getByText("ПРОЙДЕНО")).toBeInTheDocument();

    // duration displays in ms format: Math.round(1.23456 * 1000) = 1235
    expect(screen.getByText("1235ms")).toBeInTheDocument();
  });

  it("renders гардрейлов_flagged as FLAGGED (warning), not FAILED", () => {
    const data = makeGuardrailИнформация({
      гардрейлов_name: "cc-flag",
      гардрейлов_status: "гардрейлов_flagged",
      гардрейлов_provider: "custom_code",
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText(/0 пройдено/)).toBeInTheDocument();
    expect(screen.getByText(/1 с флагом/)).toBeInTheDocument();
    const badges = screen.getAllByText("ФЛАГ");
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveClass("text-warning");
    expect(screen.queryByText("СБОЙ")).not.toBeInTheDocument();
  });

  it("calculates and displays masked entity totals", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailИнформация({
      masked_entity_count: { EMAIL_ADDRESS: 2, PHONE_NUMBER: 1 },
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    // In collapsed state, the match count badge is visible
    expect(screen.getByText("3 matched")).toBeInTheDocument();

    // Expand the evaluation card to see entity details
    await user.click(screen.getByText("pii-rail"));
    // summary chips for each entry inside expanded card
    expect(screen.getByText("EMAIL_ADDRESS: 2")).toBeInTheDocument();
    expect(screen.getByText("PHONE_NUMBER: 1")).toBeInTheDocument();
  });

  it("hides matched badge when count is zero/empty", () => {
    const data = makeGuardrailИнформация({ masked_entity_count: {} });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.queryByText(/matched/)).not.toBeInTheDocument();
  });

  it("toggles evaluation card open/closed on click", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailИнформация({
      masked_entity_count: { EMAIL_ADDRESS: 2 },
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    // Initially collapsed — masked entity details not visible
    expect(screen.queryByText("EMAIL_ADDRESS: 2")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByText("EMAIL_ADDRESS: 2")).toBeInTheDocument();

    // Click again to collapse
    await user.click(screen.getByText("pii-rail"));
    await waitFor(() => {
      expect(screen.queryByText("EMAIL_ADDRESS: 2")).not.toBeInTheDocument();
    });
  });

  it("defaults to presidio provider when гардрейлов_provider is undefined", async () => {
    vi.doMock(PresidioПуть, () => ({
      __esModule: true,
      default: ({ entities }: any) => <div data-testid="presidio-mock">presidio {entities?.length}</div>,
    }));
    const { default: Component } = await import("@/components/view_logs/GuardrailViewer/GuardrailViewer");

    const data = makeGuardrailИнформация({
      гардрейлов_provider: undefined,
      гардрейлов_response: [makeEntity(), makeEntity()],
    });
    renderWithProviders(<Component data={data} />);

    // Expand the card to see provider-specific content
    const user = userEvent.setup();
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByTestId("presidio-mock")).toHaveTextContent("presidio 2");
  });

  it('renders PresidioDetectedEntities when provider="presidio" and response has entities', async () => {
    vi.doMock(PresidioПуть, () => ({
      __esModule: true,
      default: ({ entities }: any) => <div data-testid="presidio-mock">count:{entities?.length}</div>,
    }));
    const { default: Component } = await import("@/components/view_logs/GuardrailViewer/GuardrailViewer");

    const data = makeGuardrailИнформация({
      гардрейлов_provider: "presidio",
      гардрейлов_response: [makeEntity()],
    });
    renderWithProviders(<Component data={data} />);

    // Expand the card to see provider-specific content
    const user = userEvent.setup();
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByTestId("presidio-mock")).toHaveTextContent("count:1");
  });

  it('renders BedrockGuardrailDetails when provider="bedrock"', async () => {
    vi.doMock(BedrockПуть, () => ({
      __esModule: true,
      default: ({ response }: any) => <div data-testid="bedrock-mock">{response?.action ?? "no-action"}</div>,
    }));
    const { default: Component } = await import("@/components/view_logs/GuardrailViewer/GuardrailViewer");

    const data = makeGuardrailИнформация({
      гардрейлов_provider: "bedrock",
      гардрейлов_response: makeBedrockОтвет({ action: "GUARDRAIL_INTERVENED" }),
    });
    renderWithProviders(<Component data={data} />);

    // Expand the card to see provider-specific content
    const user = userEvent.setup();
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByTestId("bedrock-mock")).toHaveTextContent("GUARDRAIL_INTERVENED");
  });

  it("unknown provider renders neither Presidio nor Bedrock details", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailИнформация({
      гардрейлов_provider: "unknown",
    });
    renderWithProviders(<GuardrailViewer data={data} />);
    // Header still present
    expect(screen.getByText("Гардрейлы и соответствие политикам")).toBeInTheDocument();

    // Expand the card
    await user.click(screen.getByText("pii-rail"));
    // No Presidio or Bedrock sections
    expect(screen.queryByText(/Обнаруженные сущности/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Raw Bedrock Guardrail Ответ/)).not.toBeInTheDocument();
  });

  it("renders without crashing when guardrail_mode is null", () => {
    const data = makeGuardrailИнформация({ гардрейлов_mode: null });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Гардрейлы и соответствие политикам")).toBeInTheDocument();
    // Null mode should display as dash
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders without crashing when guardrail_mode is an object", () => {
    const data = makeGuardrailИнформация({
      гардрейлов_mode: { default: "pre_call", tags: {} },
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Гардрейлы и соответствие политикам")).toBeInTheDocument();
    expect(screen.getByText("PRE-CALL")).toBeInTheDocument();
  });

  it("renders without crashing when guardrail_mode is an array and shows in both timeline buckets", () => {
    const data = makeGuardrailИнформация({
      гардрейлов_mode: ["pre_call", "post_call"],
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Гардрейлы и соответствие политикам")).toBeInTheDocument();
    // Режим badge shows first element formatted
    expect(screen.getByText("PRE-CALL")).toBeInTheDocument();
    // Entry should appear in both pre-call and post-call timeline sections
    expect(screen.getByText(/Гардрейл до вызова:/)).toBeInTheDocument();
    expect(screen.getByText(/Гардрейл после вызова:/)).toBeInTheDocument();
  });

  it("integration: renders with real Bedrock details withвыход mocks", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailИнформация({
      гардрейлов_provider: "bedrock",
      гардрейлов_response: makeBedrockОтвет({
        action: "NONE",
        выходputs: [{ text: "ok" }],
      }),
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    // Expand the card to reveal Bedrock details
    await user.click(screen.getByText("pii-rail"));

    // Bedrock summary bits
    expect(screen.getByText("Результаты")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
