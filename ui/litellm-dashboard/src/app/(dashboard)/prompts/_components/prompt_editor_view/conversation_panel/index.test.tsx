import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConversationPanel from "./index";

vi.mock("./useConversation", () => ({
  useConversation: () => ({
    isLoading: false,
    messages: [],
    inputСообщение: "",
    variables: {},
    variablesFilled: true,
    extractedVariables: [],
    allVariablesFilled: true,
    messagesEndRef: { current: null },
    setВходСообщение: vi.fn(),
    handleSendСообщение: vi.fn(),
    handleCancelЗапрос: vi.fn(),
    handleClearConversation: vi.fn(),
    handleKeyDown: vi.fn(),
    handleVariableChange: vi.fn(),
  }),
}));

describe("ConversationPanel", () => {
  it("renders the empty conversation input", () => {
    render(<ConversationPanel prompt={{}} accessТокен="token" />);
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });
});
