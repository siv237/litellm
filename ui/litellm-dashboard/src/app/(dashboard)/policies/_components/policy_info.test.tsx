import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import ПолитикаInfoView from "./policy_info";
import { Политика } from "@/components/policies/types";

vi.mock("@/components/networking");
vi.mock("./pipeline_flow_builder", () => ({
  PipelineInfoDisplay: () => <div data-testid="pipeline-info" />,
}));

const baseПолитика: Политика = {
  policy_id: "policy-uuid-1",
  policy_name: "My Test Политика",
  inherit: null,
  description: "A test description",
  гардрейловs_add: ["гардрейлов-a"],
  гардрейловs_remove: [],
  condition: null,
};

const defaultProps = {
  policyId: "policy-uuid-1",
  onClose: vi.fn(),
  onEdit: vi.fn(),
  accessТокен: "test-token",
  isAdmin: true,
  getПолитика: vi.fn(),
};

describe("ПолитикаInfoView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not show policy content while the fetch is in flight", () => {
    defaultProps.getПолитика.mockReturnЗначение(new Promise(() => {}));
    vi.mocked(networking.getResolvedГардрейлы).mockReturnЗначение(new Promise(() => {}));
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(screen.queryByText("My Test Политика")).not.toBeInTheDocument();
  });

  it("should show a 'Политика not found' message when getПолитика resolves null", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(null);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText(/policy not found/i)).toBeInTheDocument();
  });

  it("should render the policy name after loading", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText("My Test Политика")).toBeInTheDocument();
  });

  it("should render the policy ID", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText("policy-uuid-1")).toBeInTheDocument();
  });

  it("should render гардрейловs_add tags", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText("гардрейлов-a")).toBeInTheDocument();
  });

  it("should call onClose when the Back to Policies button is clicked", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    const user = userEvent.setup();
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    await screen.findByText("My Test Политика");
    await user.click(screen.getByRole("button", { name: /back to policies/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should call onEdit with the policy when the Edit Политика button is clicked", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    const user = userEvent.setup();
    renderWithProviders(<ПолитикаInfoView {...defaultProps} isAdmin />);
    await screen.findByText("My Test Политика");
    await user.click(screen.getByRole("button", { name: /edit policy/i }));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(baseПолитика);
  });

  it("should not show the Edit Политика button for non-admins", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} isAdmin={false} />);
    await screen.findByText("My Test Политика");
    expect(screen.queryByRole("button", { name: /edit policy/i })).not.toBeInTheDocument();
  });

  it("should display resolved гардрейловs when returned from the API", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({
      resolved_guardrails: ["resolved-гардрейлов-x"],
    });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText("resolved-гардрейлов-x")).toBeInTheDocument();
  });

  it("should display the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию condition tag when present", async () => {
    const policyWithCondition = { ...baseПолитика, condition: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" } };
    defaultProps.getПолитика.mockResolvedЗначение(policyWithCondition);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText("gpt-4")).toBeInTheDocument();
  });

  it("should show 'No Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию condition' when condition is null", async () => {
    defaultProps.getПолитика.mockResolvedЗначение(baseПолитика);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    expect(await screen.findByText(/no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию condition/i)).toBeInTheDocument();
  });

  it("should show the formatted created_at date", async () => {
    const policy = { ...baseПолитика, created_at: "2024-06-15T12:00:00Z" };
    defaultProps.getПолитика.mockResolvedЗначение(policy);
    vi.mocked(networking.getResolvedГардрейлы).mockResolvedЗначение({ resolved_guardrails: [] });
    renderWithProviders(<ПолитикаInfoView {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/2024-06-15/)).toBeInTheDocument();
    });
  });
});
