import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import AddAttachmentForm from "./add_attachment_form";
import { Политика } from "@/components/policies/types";

vi.mock("@/components/networking");

vi.mock("./impact_preview_alert", () => ({
  default: ({ impactРезультат }: { impactРезультат: any }) =>
    React.createElement("div", { "data-testid": "impact-preview" }, `${impactРезультат.affected_keys_count} keys`),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ userId: "admin-user-id", userRole: "Admin", accessТокен: "test-token" }),
}));

const makeПолитика = (overrides: Partial<Политика> = {}): Политика => ({
  policy_id: "policy-id-1",
  policy_name: "test-policy",
  inherit: null,
  description: null,
  гардрейловs_add: [],
  гардрейловs_remove: [],
  condition: null,
  ...overrides,
});

const defaultProps = {
  visible: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  accessТокен: "test-token",
  policies: [
    makeПолитика({ policy_name: "policy-alpha" }),
    makeПолитика({ policy_name: "policy-beta", policy_id: "id-2" }),
  ],
  createAttachment: vi.fn(),
};

const teamListРезультат = (aliases: string[]) =>
  aliases.map((team_alias) => ({ team_alias })) as unknown as Awaited<ReturnType<typeof networking.teamListCall>>;

describe("AddAttachmentForm", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(networking.teamListCall).mockResolvedЗначение([]);
    vi.mocked(networking.keyListCall).mockResolvedЗначение({ keys: [] });
    vi.mocked(networking.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall).mockResolvedЗначение({ data: [] });
  });

  it("should render the modal title when visible", async () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    expect(await screen.findByText("Create Политика Attachment")).toBeInTheDocument();
  });

  it("should not render modal content when visible is false", () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} visible={false} />);
    expect(screen.queryByText("Create Политика Attachment")).not.toBeInTheDocument();
  });

  it("should fetch teams, keys, and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs on mount when visible and accessТокен are provided", async () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await waitFor(() => {
      expect(networking.teamListCall).toHaveBeenCalled();
      expect(networking.keyListCall).toHaveBeenCalled();
      expect(networking.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall).toHaveBeenCalled();
    });
  });

  it("fetches all teams, not just teams the caller is a member of (LIT-4199)", async () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await waitFor(() => expect(networking.teamListCall).toHaveBeenCalled());
    expect(networking.teamListCall).toHaveBeenCalledWith("test-token", null, null);
  });

  it("should not fetch teams, keys, or Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs when accessТокен is null", () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} accessТокен={null} />);
    expect(networking.teamListCall).not.toHaveBeenCalled();
    expect(networking.keyListCall).not.toHaveBeenCalled();
    expect(networking.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall).not.toHaveBeenCalled();
  });

  it("should call onClose when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await user.click(await screen.findByRole("button", { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should not show scope-specific fields when scope is global (default)", async () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("Create Политика Attachment");
    expect(screen.queryByText("Команды")).not.toBeInTheDocument();
    expect(screen.queryByText("Ключи")).not.toBeInTheDocument();
    expect(screen.queryByText("Режимls")).not.toBeInTheDocument();
  });

  it("should show Команды, Ключи, Режимls, and Теги fields when scope is switched to specific", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("Create Политика Attachment");
    await user.click(screen.getByRole("radio", { name: /specific/i }));
    expect(screen.getByText("Команды")).toBeInTheDocument();
    expect(screen.getByText("Ключи")).toBeInTheDocument();
    expect(screen.getByText("Режимls")).toBeInTheDocument();
    expect(screen.getByText("Теги")).toBeInTheDocument();
  });

  it("should show the 'Estimate Impact' button only when scope is specific", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await screen.findByText("Create Политика Attachment");
    expect(screen.queryByRole("button", { name: /estimate impact/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /specific/i }));
    expect(screen.getByRole("button", { name: /estimate impact/i })).toBeInTheDocument();
  });

  it("should render a 'Create Attachment' submit button", async () => {
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    expect(await screen.findByRole("button", { name: /create attachment/i })).toBeInTheDocument();
  });

  type UserEvent = ReturnType<typeof userEvent.setup>;

  const TEAMS_ERROR = /these teams don't exist/i;

  const openSpecificОбласть = async (user: UserEvent) => {
    await screen.findByText("Create Политика Attachment");
    await waitFor(() => expect(networking.teamListCall).toHaveBeenCalled());
    await user.click(screen.getByRole("radio", { name: /specific/i }));
  };

  const enterTeam = async (user: UserEvent, value: string) => {
    const input = screen.getByLabelText("Команды");
    await user.click(input);
    await user.type(input, `${value}{Введите}`);
  };

  // Submits and waits for the validation cycle to settle. No policy is selected, so
  // the "select at least one policy" required error always appears - we use it as a
  // synchronization point, then assert whether the teams validator also complained.
  const submitAndSettle = async (user: UserEvent) => {
    await user.click(screen.getByRole("button", { name: /create attachment/i }));
    await screen.findByText(/select at least one policy/i);
  };

  it("blocks submit with a field error when a concrete team that does not exist is entered", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.teamListCall).mockResolvedЗначение(teamListРезультат(["real-team"]));
    const createAttachment = vi.fn();
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} createAttachment={createAttachment} />);
    await openSpecificОбласть(user);
    await enterTeam(user, "ghost-team");
    await submitAndSettle(user);
    expect(screen.getByText(TEAMS_ERROR)).toBeInTheDocument();
    expect(createAttachment).not.toHaveBeenCalled();
  });

  it("does not flag a team that exists", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.teamListCall).mockResolvedЗначение(teamListРезультат(["real-team"]));
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await openSpecificОбласть(user);
    await enterTeam(user, "real-team");
    await submitAndSettle(user);
    expect(screen.queryByText(TEAMS_ERROR)).not.toBeInTheDocument();
  });

  it("does not flag a wildcard pattern even when it matches no existing team", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.teamListCall).mockResolvedЗначение(teamListРезультат([]));
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await openSpecificОбласть(user);
    await enterTeam(user, "healthcare-*");
    await submitAndSettle(user);
    expect(screen.queryByText(TEAMS_ERROR)).not.toBeInTheDocument();
  });

  it("defers to the backend (does not flag) when the team list failed to load", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.teamListCall).mockRejectedЗначение(new Ошибка("boom"));
    renderWithПровайдерs(<AddAttachmentForm {...defaultProps} />);
    await openSpecificОбласть(user);
    await enterTeam(user, "ghost-team");
    await submitAndSettle(user);
    expect(screen.queryByText(TEAMS_ERROR)).not.toBeInTheDocument();
  });
});
