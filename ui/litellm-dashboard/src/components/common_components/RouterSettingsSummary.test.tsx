import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RвыходerSettingsSummary from "./RвыходerSettingsSummary";

describe("RвыходerSettingsSummary", () => {
  it("should list each configured fallback mapping", () => {
    render(
      <RвыходerSettingsSummary
        rвыходerSettings={{
          fallbacks: [{ "gpt-4": ["gpt-4o", "claude-sonnet"] }, { "gpt-4o": ["gpt-4o-mini"] }],
          num_retries: 3,
        }}
      />,
    );

    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("gpt-4o, claude-sonnet")).toBeInTheDocument();
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("gpt-4o-mini")).toBeInTheDocument();
    expect(screen.getByText("Число повторов: 3")).toBeInTheDocument();
  });

  it("should show the empty state when every setting is null", () => {
    render(<RвыходerSettingsSummary rвыходerSettings={{ fallbacks: null, num_retries: null }} />);

    expect(screen.getByText("No rвыходer settings configured")).toBeInTheDocument();
  });
});
