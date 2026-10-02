import { renderWithПровайдерs, screen } from "../../tests/test-utils";
import { describe, expect, it } from "vitest";
import GuardrailSettingsView from "./GuardrailSettingsView";

describe("GuardrailSettingsView", () => {
  it("should render", () => {
    renderWithПровайдерs(<GuardrailSettingsView globalGuardrailNames={new Set()} />);

    expect(screen.getByText("Настройки гардрейлов")).toBeInTheDocument();
  });

  it("should separate active global and team-specific гардрейловs", () => {
    renderWithПровайдерs(
      <GuardrailSettingsView
        globalGuardrailNames={new Set(["global-one", "global-two"])}
        teamГардрейлы={["global-one", "team-one"]}
        optedВыходГлобальноГардрейлы={["global-two"]}
      />,
    );

    expect(screen.getByText("global-one")).toBeInTheDocument();
    expect(screen.getByText("team-one")).toBeInTheDocument();
    expect(screen.queryByText("global-two")).not.toBeInTheDocument();
  });

  it("should show when global гардрейловs are bypassed", () => {
    renderWithПровайдерs(<GuardrailSettingsView globalGuardrailNames={new Set(["global-one"])} killSwitchOn />);

    expect(screen.getByText("Обход для этой команды")).toBeInTheDocument();
  });
});
