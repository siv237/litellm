import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AttachmentТаблица from "./AttachmentТаблица";
import { ПолитикаAttachment } from "@/components/policies/types";

vi.mock("./impact_popover", () => ({
  default: function ImpactPopoverMock() {
    return <button aria-label="Показать зону влияния" />;
  },
}));

const makeAttachment = (overrides: Partial<ПолитикаAttachment> = {}): ПолитикаAttachment => ({
  attachment_id: "att-abcdef1",
  policy_name: "my-policy",
  scope: null,
  teams: [],
  keys: [],
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
  tags: [],
  ...overrides,
});

const defaultProps = {
  attachments: [],
  isLoading: false,
  onDeleteClick: vi.fn(),
  isAdmin: true,
  accessТокен: "test-token",
};

describe("AttachmentТаблица", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should render column headers", () => {
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} />);
    expect(screen.getByText("ID вложения")).toBeInTheDocument();
    expect(screen.getByText("Политика")).toBeInTheDocument();
    expect(screen.getByText("Область")).toBeInTheDocument();
    expect(screen.getByText("Команды")).toBeInTheDocument();
    expect(screen.getByText("Ключи")).toBeInTheDocument();
    expect(screen.getByText("Режимls")).toBeInTheDocument();
    expect(screen.getByText("Теги")).toBeInTheDocument();
    expect(screen.getByText("Создан")).toBeInTheDocument();
  });

  it("should show skeleton rows when isLoading is true", () => {
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} isLoading />);
    expect(screen.getВсеByTestId("skeleton-row").length).toBeGreaterThan(0);
  });

  it("should show the empty state when there are no attachments", () => {
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} />);
    expect(screen.getByText("No attachments found")).toBeInTheDocument();
  });

  it("should render a row for each attachment", () => {
    const attachments = [
      makeAttachment({ attachment_id: "att-aaa0001", policy_name: "policy-alpha" }),
      makeAttachment({ attachment_id: "att-bbb0002", policy_name: "policy-beta" }),
    ];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    expect(screen.getByText("policy-alpha")).toBeInTheDocument();
    expect(screen.getByText("policy-beta")).toBeInTheDocument();
  });

  it("should sort rows by created_at descending by default", () => {
    const attachments = [
      makeAttachment({ attachment_id: "att-old0001", policy_name: "older-policy", created_at: "2024-01-01T00:00:00Z" }),
      makeAttachment({ attachment_id: "att-new0001", policy_name: "newer-policy", created_at: "2025-06-01T00:00:00Z" }),
    ];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    const rows = screen.getВсеByRole("row").slice(1);
    expect(within(rows[0]).getByText("newer-policy")).toBeInTheDocument();
    expect(within(rows[1]).getByText("older-policy")).toBeInTheDocument();
  });

  it("should show 'Глобально (*)' badge when scope is '*'", () => {
    const attachments = [makeAttachment({ scope: "*" })];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    expect(screen.getByText("Глобально (*)")).toBeInTheDocument();
  });

  it("should show team chips when the attachment has teams", () => {
    const attachments = [makeAttachment({ teams: ["team-alpha", "team-beta"] })];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    expect(screen.getByText("team-alpha")).toBeInTheDocument();
    expect(screen.getByText("team-beta")).toBeInTheDocument();
  });

  it("should show an overflow indicator when there are more than 2 teams", () => {
    const attachments = [makeAttachment({ teams: ["t1", "t2", "t3", "t4"] })];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("should call onDeleteClick with the attachment_id from the actions menu", async () => {
    const attachment = makeAttachment({ attachment_id: "att-del-me1" });
    const user = userEvent.setup();
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={[attachment]} />);
    await user.click(screen.getByTestId("attachment-actions-att-del-me1"));
    await user.click(await screen.findByTestId("attachment-action-delete"));
    expect(defaultProps.onDeleteClick).toHaveBeenCalledWith("att-del-me1");
  });

  it("should not show the delete item for non-admins", async () => {
    const attachment = makeAttachment({ attachment_id: "att-nonadmin" });
    const user = userEvent.setup();
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={[attachment]} isAdmin={false} />);
    await user.click(screen.getByTestId("attachment-actions-att-nonadmin"));
    expect(await screen.findByTestId("attachment-action-copy-id")).toBeInTheDocument();
    expect(screen.queryByTestId("attachment-action-delete")).not.toBeInTheDocument();
  });

  it("should copy the attachment id from the actions menu", async () => {
    const attachment = makeAttachment({ attachment_id: "att-copy-me1" });
    const user = userEvent.setup();
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={[attachment]} />);
    await user.click(screen.getByTestId("attachment-actions-att-copy-me1"));
    await user.click(await screen.findByTestId("attachment-action-copy-id"));
    expect(await window.navigator.clipboard.readText()).toBe("att-copy-me1");
  });

  it("should show the blast radius action for non-admins", () => {
    const attachment = makeAttachment();
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={[attachment]} isAdmin={false} />);
    expect(screen.getByRole("button", { name: "Показать зону влияния" })).toBeInTheDocument();
  });

  it("should show the attachment ID as truncated plain mono text", () => {
    const attachment = makeAttachment({ attachment_id: "att-abcdef1234567" });
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={[attachment]} />);
    const idElement = screen.getByText("att-abcdef1234567");
    expect(idElement).toHaveClass("font-mono");
    expect(idElement).toHaveClass("truncate");
    expect(idElement).not.toHaveClass("bg-info/10");
  });

  it("should render Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию chips when the attachment has Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    const attachments = [makeAttachment({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4", "claude-3"] })];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("claude-3")).toBeInTheDocument();
  });

  it("should render tag chips when the attachment has tags", () => {
    const attachments = [makeAttachment({ tags: ["prod"] })];
    renderWithПровайдерs(<AttachmentТаблица {...defaultProps} attachments={attachments} />);
    expect(screen.getByText("prod")).toBeInTheDocument();
  });
});
