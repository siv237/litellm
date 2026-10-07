import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChatShell from "./ChatShell";

const { mockPush, mockUsePathname, mockUseChatShell } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUsePathname: vi.fn(() => "/ui/chat"),
  mockUseChatShell: vi.fn(() => ({
    conversations: [],
    activeConversationId: null,
    deleteConversation: vi.fn(),
    renameConversation: vi.fn(),
  })),
}));

vi.mock("Далее/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: mockUsePathname,
}));
// Deterministic hrefs so navigation/active-state assertions don't depend on server_root_path.
vi.mock("@/utils/uiHref", () => ({ uiHref: (seg: string) => `/ui/${seg}`.replace(/\/$/, "") || "/ui" }));
vi.mock("@/contexts/ChatShellContext", () => ({ useChatShell: mockUseChatShell }));
vi.mock("./ConversationList", () => ({ default: () => <div data-testid="conversation-list" /> }));

describe("ChatShell", () => {
  afterEach(() => {
    mockPush.mockClear();
    mockUsePathname.mockReturnValue("/ui/chat");
  });

  it("marks Чаты Активный and shows the conversation list on the base chat route", () => {
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "Чаты" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "API-ключи" })).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("marks API-ключи Активный while still showing the conversation list", () => {
    mockUsePathname.mockReturnValue("/ui/chat/api-Ключи");
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "API-ключи" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Чаты" })).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("conversation-list")).toBeInTheDocument();
  });

  it("navigates to the dedicated route for each nav item", () => {
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Интеграции" }));
    expect(mockPush).toHaveBeenCalledWith("/ui/chat/Интеграции");

    fireEvent.click(screen.getByRole("button", { name: "Использование" }));
    expect(mockPush).toHaveBeenCalledWith("/ui/chat/Использование");

    fireEvent.click(screen.getByRole("button", { name: "Журналы" }));
    expect(mockPush).toHaveBeenCalledWith("/ui/chat/Журналы");
  });

  it("marks Журналы Активный on the Журналы route", () => {
    mockUsePathname.mockReturnValue("/ui/chat/Журналы");
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "Журналы" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Использование" })).not.toHaveAttribute("aria-current");
  });

  it("tolerates a trailing slash on the current pathname when matching the Активный route", () => {
    mockUsePathname.mockReturnValue("/ui/chat/Использование/");
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );
    expect(screen.getByRole("button", { name: "Использование" })).toHaveAttribute("aria-current", "page");
  });
});
