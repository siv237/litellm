import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChatShell from "./ChatShell";

const { mockPush, mockUseПутьname, mockUseChatShell } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseПутьname: vi.fn(() => "/ui/chat"),
  mockUseChatShell: vi.fn(() => ({
    conversations: [],
    activeConversationId: null,
    deleteConversation: vi.fn(),
    renameConversation: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  useRвыходer: () => ({ push: mockPush }),
  useПутьname: mockUseПутьname,
}));
// Deterministic hrefs so navigation/active-state assertions don't depend on server_root_path.
vi.mock("@/utils/uiHref", () => ({ uiHref: (seg: string) => `/ui/${seg}`.replace(/\/$/, "") || "/ui" }));
vi.mock("@/contexts/ChatShellContext", () => ({ useChatShell: mockUseChatShell }));
vi.mock("./ConversationList", () => ({ default: () => <div data-testid="conversation-list" /> }));

describe("ChatShell", () => {
  afterEach(() => {
    mockPush.mockClear();
    mockUseПутьname.mockReturnЗначение("/ui/chat");
  });

  it("marks Чаты active and shows the conversation list on the base chat rвыходe", () => {
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "Чаты" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "API Ключи" })).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("marks API Ключи active while still showing the conversation list", () => {
    mockUseПутьname.mockReturnЗначение("/ui/chat/api-keys");
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "API Ключи" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Чаты" })).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("navigates to the dedicated rвыходe for each nav item", () => {
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Интеграции" }));
    expect(mockPush).toHaveBeenCalledWith("/ui/chat/integrations");

    fireEvent.click(screen.getByRole("button", { name: "Использование" }));
    expect(mockPush).toHaveBeenCalledWith("/ui/chat/usage");

    fireEvent.click(screen.getByRole("button", { name: "Журналы" }));
    expect(mockPush).toHaveBeenCalledWith("/ui/chat/logs");
  });

  it("marks Журналы active on the logs rвыходe", () => {
    mockUseПутьname.mockReturnЗначение("/ui/chat/logs");
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "Журналы" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Использование" })).not.toHaveAttribute("aria-current");
  });

  it("tolerates a trailing slash on the current pathname when matching the active rвыходe", () => {
    mockUseПутьname.mockReturnЗначение("/ui/chat/usage/");
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "Использование" })).toHaveAttribute("aria-current", "page");
  });
});
