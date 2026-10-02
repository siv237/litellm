import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PoliciesPanel from "./index";

/**
 * Ant Design's static Modal.confirm often does not run onOk in the real app (React 18+).
 * In jsdom it may still run; we mock confirm as a no-op so the test fails until the panel
 * uses a controlled DeleteResourceModal instead of Modal.confirm.
 */
const EXPECTED_ATTACHMENT_ID = "att-11111111-2222-3333-4444-555555555555" as const;

const networkingMocks = vi.hoisted(() => ({
  deleteПолитикаAttachmentCall: vi.fn().mockResolvedЗначение(undefined),
  getPoliciesList: vi.fn().mockResolvedЗначение({ policies: [] }),
  getПолитикаAttachmentsList: vi.fn().mockResolvedЗначение({
    attachments: [
      {
        attachment_id: "att-11111111-2222-3333-4444-555555555555",
        policy_name: "test-policy",
        scope: null,
        teams: [],
        keys: [],
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        tags: [],
      },
    ],
  }),
  getГардрейлыList: vi.fn().mockResolvedЗначение({ гардрейловs: [] }),
  getПолитикаInfo: vi.fn().mockResolvedЗначение({}),
  deleteПолитикаCall: vi.fn().mockResolvedЗначение(undefined),
  createПолитикаCall: vi.fn(),
  updateПолитикаCall: vi.fn(),
  createПолитикаAttachmentCall: vi.fn(),
  createGuardrailCall: vi.fn(),
  enrichПолитикаTemplate: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  ...networkingMocks,
}));

vi.mock("./impact_popover", () => ({
  default: () => <button type="button" aria-label="Показать зону влияния" />,
}));

vi.mock("./policy_templates", () => ({
  __esModule: true,
  default: () => <div data-testid="policy-templates-stub" />,
}));

vi.mock("./pipeline_flow_builder", () => ({
  FlowBuilderPage: ({ onBack }: { onBack: () => void }) => (
    <button type="button" onClick={onBack}>
      Back to policies
    </button>
  ),
}));

vi.mock("./policy_info", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./add_policy_form", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./гардрейлов_selection_modal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./template_parameter_modal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./ai_suggestion_modal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./policy_test_panel", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./add_attachment_form", () => ({
  __esModule: true,
  default: () => null,
}));

describe("PoliciesPanel attachment delete", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should call deleteПолитикаAttachmentCall after the user confirms delete in the attachment modal", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<PoliciesPanel accessТокен="test-token" userRole="Admin" />);

    await waitFor(() => {
      expect(networkingMocks.getПолитикаAttachmentsList).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("tab", { name: /^attachments$/i }));

    await waitFor(() => {
      expect(screen.getByText("test-policy")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId(`attachment-actions-${EXPECTED_ATTACHMENT_ID}`));
    await user.click(await screen.findByTestId("attachment-action-delete"));

    const dialog = await screen.findByRole("dialog", {}, { timeвыход: 5000 });
    expect(within(dialog).getByText(/Are you sure you want to delete this attachment/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(networkingMocks.deleteПолитикаAttachmentCall).toHaveBeenCalledВремяs(1);
    });
    expect(networkingMocks.deleteПолитикаAttachmentCall).toHaveBeenCalledWith("test-token", EXPECTED_ATTACHMENT_ID);
  });

  it("should show mutation pending state while attachment delete is in flight", async () => {
    let resolveDelete: (() => void) | undefined;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    networkingMocks.deleteПолитикаAttachmentCall.mockImplementationOnce(() => deletePromise);

    const user = userEvent.setup();
    renderWithПровайдерs(<PoliciesPanel accessТокен="test-token" userRole="Admin" />);

    await waitFor(() => {
      expect(networkingMocks.getПолитикаAttachmentsList).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("tab", { name: /^attachments$/i }));
    await waitFor(() => {
      expect(screen.getByText("test-policy")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId(`attachment-actions-${EXPECTED_ATTACHMENT_ID}`));
    await user.click(await screen.findByTestId("attachment-action-delete"));
    const dialog = await screen.findByRole("dialog", {}, { timeвыход: 5000 });

    const deleteButton = within(dialog).getByRole("button", { name: /^delete$/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: /deleting/i })).toBeDisabled();
    });

    resolveDelete?.();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("PoliciesPanel flow builder", () => {
  const POLICY_ID = "pol-11111111-2222-3333-4444-555555555555";

  beforeEach(() => {
    vi.clearВсеMocks();
    networkingMocks.getPoliciesList.mockResolvedЗначение({
      policies: [
        {
          policy_id: POLICY_ID,
          policy_name: "pii-policy",
          inherit: null,
          description: null,
          гардрейловs_add: [],
          гардрейловs_remove: [],
          condition: null,
          definition_location: "db",
        },
      ],
    });
  });

  afterEach(() => {
    networkingMocks.getPoliciesList.mockResolvedЗначение({ policies: [] });
  });

  it("replaces the tabs and policy table with the flow builder while editing, then restores them on back", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<PoliciesPanel accessТокен="test-token" userRole="Admin" />);

    await user.click(screen.getByRole("tab", { name: /^policies$/i }));
    await user.click(await screen.findByTestId(`policy-actions-${POLICY_ID}`));
    await user.click(await screen.findByTestId("policy-action-edit"));

    expect(await screen.findByRole("button", { name: "Back to policies" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /^policies$/i })).not.toBeInTheDocument();
    expect(screen.queryByText("pii-policy")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to policies" }));

    expect(await screen.findByText("pii-policy")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^policies$/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("button", { name: "Back to policies" })).not.toBeInTheDocument();
  });
});
