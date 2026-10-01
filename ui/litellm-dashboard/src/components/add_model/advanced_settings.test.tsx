import { act, fireEvent, render, waitFor, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MountedFormHost } from "../../../tests/mounted-form-host";
import AdvancedSettings from "./advanced_settings";

const mockUsePtuCostAttributionEnabled = vi.fn();

vi.mock("@/app/(dashboard)/hooks/uiSettings/usePtuCostAttributionEnabled", () => ({
  usePtuCostAttributionEnabled: () => mockUsePtuCostAttributionEnabled(),
}));

const PTU_LABELS = ["Количество PTU", "Расчётная стоимость PTU / час (USD)", "PTU действует с (UTC)"];

const renderAdvancedSettings = () =>
  render(
    <MountedFormHost>
      <AdvancedSettings
        showAdvancedSettings={true}
        setShowAdvancedSettings={() => {}}
        guardrailsList={[]}
        tagsList={{}}
        accessToken="test-token"
      />
    </MountedFormHost>,
  );

describe("AdvancedSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePtuCostAttributionEnabled.mockReturnValue(false);
  });

  it("should render", () => {
    renderAdvancedSettings();
  });

  it("should render tags list", async () => {
    renderAdvancedSettings();
    fireEvent.click(screen.getByText("Дополнительные настройки"));
    await waitFor(() => {
      expect(screen.getByText("Теги")).toBeInTheDocument();
    });
  });

  it("should render the litellm params", async () => {
    renderAdvancedSettings();
    act(() => {
      fireEvent.click(screen.getByText("Дополнительные настройки"));
    });
    await waitFor(() => {
      expect(screen.getByText("Параметры LiteLLM")).toBeInTheDocument();
    });
  });

  it("hides every PTU field when PTU cost attribution is disabled", async () => {
    renderAdvancedSettings();
    act(() => {
      fireEvent.click(screen.getByText("Дополнительные настройки"));
    });
    await waitFor(() => {
      expect(screen.getByText("Теги")).toBeInTheDocument();
    });

    for (const label of PTU_LABELS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.queryByText("PTU действует по (UTC)")).not.toBeInTheDocument();
  });

  it("shows every PTU field when PTU cost attribution is enabled", async () => {
    mockUsePtuCostAttributionEnabled.mockReturnValue(true);
    renderAdvancedSettings();
    act(() => {
      fireEvent.click(screen.getByText("Дополнительные настройки"));
    });

    await waitFor(() => {
      expect(screen.getByText("Количество PTU")).toBeInTheDocument();
    });
    for (const label of PTU_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("PTU действует по (UTC)")).toBeInTheDocument();
  });
});
