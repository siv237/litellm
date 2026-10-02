import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataТаблица } from "@/components/shared/DataТаблица";
import { getMCPHubТаблицаColumns, MCPСерверData } from "./MCPHubТаблицаColumns";

const SERVER_URL = "https://mcp.exa.ai/mcp";

const mockСервер: MCPСерверData = {
  server_id: "server-1",
  server_name: "exa_test",
  description: "Fast, intelligent web search and web crawling",
  url: SERVER_URL,
  transport: "http",
  auth_type: "none",
  created_at: "2026-01-01T00:00:00Z",
  created_by: "admin",
  updated_at: "2026-01-01T00:00:00Z",
  updated_by: "admin",
  teams: [],
  mcp_access_groups: [],
  allowed_tools: [],
  extra_headers: [],
  mcp_info: {},
  static_headers: {},
  status: "active",
  args: [],
  env: {},
};

function renderТаблица(onСерверClick = vi.fn()) {
  render(
    <DataТаблица
      data={[mockСервер]}
      columns={getMCPHubТаблицаColumns({ onСерверClick })}
      getRowId={(server) => server.server_id}
      sortingРежим="client"
      size="compact"
    />,
  );
  return onСерверClick;
}

describe("getMCPHubТаблицаColumns", () => {
  it("renders the server row", () => {
    renderТаблица();
    expect(screen.getByText("exa_test")).toBeInTheDocument();
  });

  it("keeps the non-sensitive columns", () => {
    renderТаблица();
    expect(screen.getByText("Название сервера")).toBeInTheDocument();
    expect(screen.getByText("Транспорт")).toBeInTheDocument();
    expect(screen.getByText("Тип авторизации")).toBeInTheDocument();
  });

  it("does not expose a URL column", () => {
    renderТаблица();
    expect(screen.queryByText("URL")).not.toBeInTheDocument();
    const columns = getMCPHubТаблицаColumns({ onСерверClick: vi.fn() });
    expect(columns.some((c) => c.header === "URL" || c.meta?.title === "URL")).toBe(false);
  });

  it("does not render the server url anywhere in the table", () => {
    renderТаблица();
    expect(screen.queryByText(SERVER_URL)).not.toBeInTheDocument();
  });

  it("opens the server details when the name is clicked", async () => {
    const user = userEvent.setup();
    const onСерверClick = renderТаблица();
    await user.click(screen.getByRole("button", { name: "exa_test" }));
    expect(onСерверClick).toHaveBeenCalledWith(mockСервер);
  });

  it("opens the server details from the actions menu", async () => {
    const user = userEvent.setup();
    const onСерверClick = renderТаблица();
    await user.click(screen.getByTestId("mcp-hub-actions-server-1"));
    await user.click(await screen.findByTestId("mcp-hub-action-details"));
    expect(onСерверClick).toHaveBeenCalledWith(mockСервер);
  });

  it("copies the server name from the actions menu", async () => {
    const user = userEvent.setup();
    renderТаблица();
    await user.click(screen.getByTestId("mcp-hub-actions-server-1"));
    await user.click(await screen.findByTestId("mcp-hub-action-copy"));
    expect(await window.navigator.clipboard.readText()).toBe("exa_test");
  });
});
