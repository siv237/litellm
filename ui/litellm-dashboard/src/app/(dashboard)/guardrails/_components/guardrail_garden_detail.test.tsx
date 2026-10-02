import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GuardrailDetailView from "./гардрейлов_garden_detail";
import type { GuardrailCardInfo } from "./гардрейлов_garden_data";

vi.mock("./add_гардрейлов_form", () => ({ default: () => null }));

const makeCard = (overrides: Partial<GuardrailCardInfo> = {}): GuardrailCardInfo => ({
  id: "bedrock",
  name: "Bedrock Guardrail",
  description: "AWS Bedrock Гардрейлы for content filtering.",
  category: "partner",
  logo: "/_next/static/media/bedrock.svg",
  tags: ["AWS"],
  ...overrides,
});

const renderDetail = (card: GuardrailCardInfo) =>
  render(<GuardrailDetailView card={card} onBack={vi.fn()} accessТокен={null} onGuardrailСоздан={vi.fn()} />);

describe("GuardrailDetailView logo", () => {
  it("renders the card logo through the shared Logo component with the bundled src", () => {
    renderDetail(makeCard());
    expect(screen.getByAltText("Bedrock Guardrail logo")).toHaveAttribute("src", "/_next/static/media/bedrock.svg");
  });

  it("falls back to a letter avatar when the card has no logo", () => {
    renderDetail(makeCard({ logo: "" }));
    expect(screen.queryByAltText("Bedrock Guardrail logo")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
