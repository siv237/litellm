import { renderWithProviders, screen } from "../../tests/test-utils";
import { describe, expect, it } from "vitest";
import GuardrailSettingsView from "./GuardrailSettingsView";

describe("GuardrailSettingsView", () => {
  it("should render", () => {
    renderWithProviders(<GuardrailSettingsView globalGuardrailNames={new Set()} />);

    expect(screen.getByText("Настройки гардрейлов")).toBeInTheDocument();
  });

  it("should separate Активный Глобально and Для команды Гардрейлы", () => {
    renderWithProviders(
      <GuardrailSettingsView
        globalGuardrailNames={new Set(["Глобально-one", "Глобально-two"])}
        teamGuardrails={["Глобально-one", "Команда-one"]}
        optedOutGlobalGuardrails={["Глобально-two"]}
      />,
    );

    expect(screen.getByText("Глобально-one")).toBeInTheDocument();
    expect(screen.getByText("Команда-one")).toBeInTheDocument();
    expect(screen.queryByText("Глобально-two")).not.toBeInTheDocument();
  });

  it("should show when Глобально Гардрейлы are bypassed", () => {
    renderWithProviders(<GuardrailSettingsView globalGuardrailNames={new Set(["Глобально-one"])} killSwitchOn />);

    expect(screen.getByText("Обход для этой команды")).toBeInTheDocument();
  });
});
