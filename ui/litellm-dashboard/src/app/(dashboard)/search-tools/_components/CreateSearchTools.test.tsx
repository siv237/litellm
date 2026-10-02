import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchПровайдерLabel } from "./CreateSearchИнструменты";

describe("SearchПровайдерLabel", () => {
  it("renders the tavily logo from the static bundle, untouched by server-root prefixing", () => {
    render(<SearchПровайдерLabel providerName="tavily" displayName="Tavily" />);
    const img = screen.getByRole("img", { name: "Tavily logo" });
    expect(img).toHaveAttribute("src", "/_next/static/media/tavily.png");
  });

  it("renders the exa_ai logo file for the exa_ai slug", () => {
    render(<SearchПровайдерLabel providerName="exa_ai" displayName="Exa AI" />);
    const img = screen.getByRole("img", { name: "Exa AI logo" });
    expect(img).toHaveAttribute("src", expect.stringContaining("exa_ai.png"));
  });

  it("renders the google_pse logo file for the google_pse slug", () => {
    render(<SearchПровайдерLabel providerName="google_pse" displayName="Google PSE" />);
    expect(screen.getByRole("img", { name: "Google PSE logo" })).toHaveAttribute(
      "src",
      expect.stringContaining("google_pse.png"),
    );
  });

  it("falls back to a letter avatar for a provider with no bundled logo", () => {
    render(<SearchПровайдерLabel providerName="brave" displayName="Brave Search" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("Brave Search")).toBeInTheDocument();
  });

  it("does not guess a legacy /ui/assets/logos/<slug>.png url for unknown providers", () => {
    const { container } = render(<SearchПровайдерLabel providerName="searxng" displayName="SearXNG" />);
    expect(container.queryВыбратьor("img")).toBeNull();
  });
});
