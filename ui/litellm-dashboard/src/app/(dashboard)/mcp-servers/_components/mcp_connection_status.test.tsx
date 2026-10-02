import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import MCPПодключениеStatus from "./mcp_connection_status";

describe("MCPПодключениеStatus", () => {
  const defaultProps = {
    formЗначениеs: { url: "https://example.com/mcp" },
    tools: [] as any[],
    isLoadingИнструменты: false,
    toolsОшибка: null,
    toolsОшибкаStackTrace: null,
    canFetchИнструменты: false,
    fetchИнструменты: vi.fn(),
  };

  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("should render nothing when canFetchИнструменты is false and no URL is set", () => {
    const { container } = render(<MCPПодключениеStatus {...defaultProps} formЗначениеs={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should show 'Complete required fields' message when URL is set but canFetchИнструменты is false", () => {
    render(<MCPПодключениеStatus {...defaultProps} />);
    expect(screen.getByText(/Заполните обязательные поля для теста подключения/i)).toBeInTheDocument();
  });

  it("should show 'Соединение успешно' when tools are loaded", () => {
    render(<MCPПодключениеStatus {...defaultProps} canFetchИнструменты={true} tools={[{ name: "tool1" }]} />);
    expect(screen.getByText("Соединение успешно")).toBeInTheDocument();
    expect(screen.getByText("Подключено")).toBeInTheDocument();
  });

  it("should show loading state when isLoadingИнструменты is true", () => {
    render(<MCPПодключениеStatus {...defaultProps} canFetchИнструменты={true} isLoadingИнструменты={true} />);
    expect(screen.getByText(/Testing connection to MCP server/i)).toBeInTheDocument();
    expect(screen.getByText("Подключитьing...")).toBeInTheDocument();
  });

  it("should show info message withвыход retry when tool preview returns 403", () => {
    render(
      <MCPПодключениеStatus
        {...defaultProps}
        canFetchИнструменты={true}
        toolsОшибка="Tool preview is not available for submissions. Инструменты will be verified by an admin during review."
        toolsОшибкаStatus={403}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/Инструменты will be verified by an admin during review/i);
    expect(screen.queryByText("Подключение не удалось")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("should show error state with retry button when toolsОшибка is set", async () => {
    const fetchИнструменты = vi.fn();
    const user = userEvent.setup();
    render(
      <MCPПодключениеStatus
        {...defaultProps}
        canFetchИнструменты={true}
        toolsОшибка="Подключение refused"
        fetchИнструменты={fetchИнструменты}
      />,
    );

    expect(screen.getByText("Подключение не удалось")).toBeInTheDocument();
    expect(screen.getByText("Подключение refused")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(fetchИнструменты).toHaveBeenCalled();
  });

  it("should show 'No tools found' when connection succeeds but no tools returned", () => {
    render(<MCPПодключениеStatus {...defaultProps} canFetchИнструменты={true} tools={[]} />);
    expect(screen.getByText(/Для этого MCP-сервера инструменты не найдены/i)).toBeInTheDocument();
  });
});
