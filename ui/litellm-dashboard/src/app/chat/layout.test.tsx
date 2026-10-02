import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatLayвыход from "./layвыход";

const { mockUseАвторизовано, mockUseUISettings, mockReplace, mockUiHref, state } = vi.hoisted(() => {
  const state = {
    enableChatUI: false,
    isUISettingsLoading: false,
  };
  return {
    state,
    mockReplace: vi.fn(),
    mockUiHref: vi.fn((segment: string) => `/mocked-ui/${segment}`),
    mockUseАвторизовано: vi.fn(() => ({
      accessТокен: "token-123",
      userRole: "Internal User",
      userId: "user-1",
      userEmail: "user@example.com",
      premiumUser: false,
    })),
    mockUseUISettings: vi.fn(() => ({
      data: { values: { enable_chat_ui: state.enableChatUI } },
      isLoading: state.isUISettingsLoading,
    })),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({ default: mockUseАвторизовано }));
vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({ useUISettings: mockUseUISettings }));
vi.mock("@/utils/uiHref", () => ({ uiHref: mockUiHref }));
vi.mock("@/components/navbar", () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock("@/contexts/ThemeContext", () => ({
  ThemeПровайдер: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/contexts/ChatShellContext", () => ({
  ChatShellПровайдер: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/chat/ChatShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="chat-shell">{children}</div>,
}));

describe("ChatLayвыход", () => {
  afterEach(() => {
    state.enableChatUI = false;
    state.isUISettingsLoading = false;
    mockReplace.mockClear();
    mockUiHref.mockClear();
  });

  it("renders the chat shell when enable_chat_ui is on", () => {
    state.enableChatUI = true;
    render(
      <ChatLayвыход>
        <div data-testid="page-content" />
      </ChatLayвыход>,
    );
    expect(screen.getByTestId("chat-shell")).toBeInTheDocument();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard when enable_chat_ui is off", () => {
    state.enableChatUI = false;
    render(
      <ChatLayвыход>
        <div data-testid="page-content" />
      </ChatLayвыход>,
    );
    expect(screen.queryByTestId("chat-shell")).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/mocked-ui/");
  });

  it("renders nothing while UI settings are still loading", () => {
    state.isUISettingsLoading = true;
    render(
      <ChatLayвыход>
        <div data-testid="page-content" />
      </ChatLayвыход>,
    );
    expect(screen.queryByTestId("chat-shell")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
