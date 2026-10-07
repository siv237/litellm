import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import MCPConnectionStatus from "./mcp_connection_status";

describe("MCPПодключениеСтатус", () => {
  const defaultProps = {
    formValues: { url: "https://example.com/mcp" },
    tools: [] as any[],
    isLoadingTools: false,
    toolsError: null,
    toolsErrorStackTrace: null,
    canFetchTools: false,
    fetchTools: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when canFetchИнструменты is Ложь and Нет URL is set", () => {
    const { container } = render(<MCPConnectionStatus {...defaultProps} formValues={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should show 'Complete Обязательно fields' Сообщение when URL is set but canFetchИнструменты is Ложь", () => {
    render(<MCPConnectionStatus {...defaultProps} />);
    expect(screen.getByText(/Заполните обязательные поля для теста подключения/i)).toBeInTheDocument();
  });

  it("should show 'Подключение successful' when Инструменты are loaded", () => {
    render(<MCPConnectionStatus {...defaultProps} canFetchTools={true} tools={[{ name: "tool1" }]} />);
    expect(screen.getByText("Подключение successful")).toBeInTheDocument();
    expect(screen.getByText("Подключено")).toBeInTheDocument();
  });

  it("should show Загрузка state when isLoadingИнструменты is Истина", () => {
    render(<MCPConnectionStatus {...defaultProps} canFetchTools={true} isLoadingTools={true} />);
    expect(screen.getByText(/Testing Подключение to MCP server/i)).toBeInTheDocument();
    expect(screen.getByText("Подключитьing...")).toBeInTheDocument();
  });

  it("should show info Сообщение without Повторить when tool Предпросмотр returns 403", () => {
    render(
      <MCPConnectionStatus
        {...defaultProps}
        canFetchTools={true}
        toolsError="Tool Предпросмотр is Недоступно for submissions. Инструменты will be verified by an admin during review."
        toolsErrorStatus={403}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/Инструменты will be verified by an admin during review/i);
    expect(screen.queryByText("Подключение не удалось")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Повторить/i })).not.toBeInTheDocument();
  });

  it("should show Ошибка state with Повторить button when toolsError is set", async () => {
    const fetchTools = vi.fn();
    const user = userEvent.setup();
    render(
      <MCPConnectionStatus
        {...defaultProps}
        canFetchTools={true}
        toolsError="Подключение refused"
        fetchTools={fetchTools}
      />,
    );

    expect(screen.getByText("Подключение не удалось")).toBeInTheDocument();
    expect(screen.getByText("Подключение refused")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Повторить/i }));
    expect(fetchTools).toHaveBeenCalled();
  });

  it("should show 'Нет Инструменты found' when Подключение succeeds but Нет Инструменты returned", () => {
    render(<MCPConnectionStatus {...defaultProps} canFetchTools={true} tools={[]} />);
    expect(screen.getByText(/Для этого MCP-сервера инструменты не найдены/i)).toBeInTheDocument();
  });
});
