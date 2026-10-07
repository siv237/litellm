import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import PolicyTemplates from "./policy_templates";

vi.mock("@/components/networking");

vi.mock("@heroicons/react/outline", () => ({
  ShieldCheckIcon: function ShieldCheckIcon() {
    return null;
  },
  ShieldExclamationIcon: function ShieldExclamationIcon() {
    return null;
  },
  BeakerIcon: function BeakerIcon() {
    return null;
  },
  CurrencyDollarIcon: function CurrencyDollarIcon() {
    return null;
  },
  CheckCircleIcon: function CheckCircleIcon() {
    return null;
  },
}));

const makeTemplate = (overrides: any = {}) => ({
  id: "tpl-1",
  title: "Test Template",
  description: "A test template",
  icon: "ShieldCheckIcon",
  iconColor: "text-success",
  iconBg: "bg-success/10",
  guardrails: ["guardrail-a"],
  tags: [],
  complexity: "Low" as const,
  ...overrides,
});

const defaultProps = {
  onUseTemplate: vi.fn(),
  onOpenAiSuggestion: vi.fn(),
  accessToken: "test-Токен",
};

describe("ПолитикаTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the section header after Загрузка", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([]);
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    expect(await screen.findByText("Шаблоны политик")).toBeInTheDocument();
  });

  it("should not show the template grid while fetching", () => {
    vi.mocked(networking.getPolicyTemplates).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    expect(screen.queryByText("Шаблоны политик")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Найти шаблоны с помощью ИИ/i })).not.toBeInTheDocument();
  });

  it("should render a card for each fetched template", async () => {
    const templates = [
      makeTemplate({ title: "Template Alpha" }),
      makeTemplate({ id: "tpl-2", title: "Template Бета" }),
    ];
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue(templates);
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    expect(await screen.findByText("Template Alpha")).toBeInTheDocument();
    expect(screen.getByText("Template Бета")).toBeInTheDocument();
  });

  it("should call onTemplatesLoaded with the fetched templates after Загрузка", async () => {
    const templates = [makeTemplate()];
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue(templates);
    const onTemplatesLoaded = vi.fn();
    renderWithProviders(<PolicyTemplates {...defaultProps} onTemplatesLoaded={onTemplatesLoaded} />);
    await waitFor(() => {
      expect(onTemplatesLoaded).toHaveBeenCalledWith(templates);
    });
  });

  it("should call onOpenAiSuggestion when the AI suggestion button is clicked", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    await screen.findByText("Шаблоны политик");
    await user.click(screen.getByRole("button", { name: /Найти шаблоны с помощью ИИ/i }));
    expect(defaultProps.onOpenAiSuggestion).toHaveBeenCalled();
  });

  it("should render tag filter checkboxes for unique Теги across Все templates", async () => {
    const templates = [
      makeTemplate({ tags: ["compliance"] }),
      makeTemplate({ id: "tpl-2", tags: ["compliance", "Безопасность"] }),
    ];
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue(templates);
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    expect(await screen.findByRole("checkbox", { name: /compliance/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Безопасность/i })).toBeInTheDocument();
  });

  it("should filter to only matching templates when a tag is selected", async () => {
    const templates = [
      makeTemplate({ id: "tpl-1", title: "Compliance Template", tags: ["compliance"] }),
      makeTemplate({ id: "tpl-2", title: "Безопасность Template", tags: ["Безопасность"] }),
    ];
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue(templates);
    const user = userEvent.setup();
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    await screen.findByText("Compliance Template");
    await user.click(screen.getByRole("checkbox", { name: /compliance/i }));
    expect(screen.getByText("Compliance Template")).toBeInTheDocument();
    expect(screen.queryByText("Безопасность Template")).not.toBeInTheDocument();
  });

  it("should show 'Нет templates match' when selected Теги exclude Все templates", async () => {
    const templates = [
      makeTemplate({ id: "tpl-1", title: "Alpha Template", tags: ["alpha"] }),
      makeTemplate({ id: "tpl-2", title: "Бета Template", tags: ["Бета"] }),
    ];
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue(templates);
    const user = userEvent.setup();
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    await screen.findByText("Alpha Template");
    await user.click(screen.getByRole("checkbox", { name: /alpha/i }));
    await user.click(screen.getByRole("checkbox", { name: /Бета/i }));
    expect(screen.getByText(/Нет templates match the selected Фильтры/i)).toBeInTheDocument();
  });

  it("should restore Все templates when 'Очистить всё' is clicked", async () => {
    const templates = [
      makeTemplate({ id: "tpl-1", title: "Alpha Template", tags: ["alpha"] }),
      makeTemplate({ id: "tpl-2", title: "Бета Template", tags: ["Бета"] }),
    ];
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue(templates);
    const user = userEvent.setup();
    renderWithProviders(<PolicyTemplates {...defaultProps} />);
    await screen.findByText("Alpha Template");
    await user.click(screen.getByRole("checkbox", { name: /alpha/i }));
    expect(screen.queryByText("Бета Template")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Очистить всё/i }));
    expect(screen.getByText("Бета Template")).toBeInTheDocument();
  });

  it("should not fetch templates when accessToken is null", () => {
    renderWithProviders(<PolicyTemplates {...defaultProps} accessToken={null} />);
    expect(networking.getPolicyTemplates).not.toHaveBeenCalled();
  });
});
