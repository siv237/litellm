import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, testQueryClient } from "../../../tests/test-utils";
import MCPToolPermissions from "./MCPToolPermissions";
import * as networking from "../networking";
import { NO_MCP_SERVERS_SENTINEL } from "../mcp_tools/constants";
import type { MCPToolset } from "../mcp_tools/types";

vi.mock("../networking");

describe("MCPToolPermissions", () => {
  const mockAccessToken = "test-Токен";
  const mockServerId = "server-123";
  const mockServerName = "Test MCP Server";

  beforeEach(() => {
    vi.clearAllMocks();
    testQueryClient.clear();
    vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
    vi.mocked(networking.fetchMCPAccessGroups).mockResolvedValue([]);
  });

  it("should update tool permissions when Пользователь selects a tool", async () => {
    /**
     * Tests that clicking a tool checkbox calls onChange with updated permissions.
     * Pre-populates toolPermissions so the auto-populate logic on fetch is skipped,
     * and switches to flat view for predictable checkbox ordering.
     */
    const mockOnChange = vi.fn();
    const mockTools = [
      { name: "read_wiki_structure", description: "Get Документация topics" },
      { name: "read_wiki_contents", description: "Открыть документацию" },
      { name: "ask_question", description: "Ask questions" },
    ];

    // Mock fetchMCPServers to return server details
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([
      {
        server_id: mockServerId,
        server_name: mockServerName,
        alias: mockServerName,
      },
    ]);

    // Mock listMCPTools to return tools for the server
    vi.mocked(networking.listMCPTools).mockResolvedValue({
      tools: mockTools,
      error: false,
    });

    // Pre-populate with all tools selected so auto-populate doesn't fire
    renderWithProviders(
      <MCPToolPermissions
        accessToken={mockAccessToken}
        selectedServers={[mockServerId]}
        toolPermissions={{ [mockServerId]: ["read_wiki_structure", "read_wiki_contents", "ask_question"] }}
        onChange={mockOnChange}
      />,
    );

    // Wait for server and tools to load
    await waitFor(() => {
      expect(screen.getByText(mockServerName)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("read_wiki_structure")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Плоский список"));
    expect(screen.getByRole("radio", { name: "Плоский список" })).toBeChecked();
    expect(await screen.findByText("- Get Документация topics")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "read_wiki_structure" }));

    // Verify onChange was called with read_wiki_structure removed
    const expectedToolPermissions = {
      [mockServerId]: ["read_wiki_contents", "ask_question"],
    };
    expect(mockOnChange).toHaveBeenCalledWith(expectedToolPermissions);

    // Verify API calls
    // Note: useMCPServers uses useAuthorized() internally, which returns "123" from global mock
    expect(networking.fetchMCPServers).toHaveBeenCalledWith("123", undefined);
    // listMCPTools uses the accessToken prop directly
    expect(networking.listMCPTools).toHaveBeenCalledWith(mockAccessToken, mockServerId);
  });

  it("should Выбрать всё Инструменты when Выбрать всё button is clicked", async () => {
    const mockOnChange = vi.fn();
    const mockTools = [
      { name: "read_wiki_structure", description: "Get Документация topics" },
      { name: "read_wiki_contents", description: "Открыть документацию" },
      { name: "ask_question", description: "Ask questions" },
    ];

    // Mock fetchMCPServers to return server details
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([
      {
        server_id: mockServerId,
        server_name: mockServerName,
        alias: mockServerName,
      },
    ]);

    // Mock listMCPTools to return tools for the server
    vi.mocked(networking.listMCPTools).mockResolvedValue({
      tools: mockTools,
      error: false,
    });

    renderWithProviders(
      <MCPToolPermissions
        accessToken={mockAccessToken}
        selectedServers={[mockServerId]}
        toolPermissions={{}}
        onChange={mockOnChange}
      />,
    );

    // Wait for server and tools to load
    await waitFor(() => {
      expect(screen.getByText(mockServerName)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("read_wiki_structure")).toBeInTheDocument();
    });

    // Click the Select All button
    const selectAllButton = screen.getByRole("button", { name: "Выбрать всё" });
    await userEvent.click(selectAllButton);

    // Verify onChange was called with all tools selected
    expect(mockOnChange).toHaveBeenCalledWith({
      [mockServerId]: ["read_wiki_structure", "read_wiki_contents", "ask_question"],
    });
  });

  it("should Снять выделение Инструменты when Снять выделение button is clicked", async () => {
    const mockOnChange = vi.fn();
    const mockTools = [
      { name: "read_wiki_structure", description: "Get Документация topics" },
      { name: "read_wiki_contents", description: "Открыть документацию" },
      { name: "ask_question", description: "Ask questions" },
    ];

    // Mock fetchMCPServers to return server details
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([
      {
        server_id: mockServerId,
        server_name: mockServerName,
        alias: mockServerName,
      },
    ]);

    // Mock listMCPTools to return tools for the server
    vi.mocked(networking.listMCPTools).mockResolvedValue({
      tools: mockTools,
      error: false,
    });

    renderWithProviders(
      <MCPToolPermissions
        accessToken={mockAccessToken}
        selectedServers={[mockServerId]}
        toolPermissions={{ [mockServerId]: ["read_wiki_structure", "read_wiki_contents"] }}
        onChange={mockOnChange}
      />,
    );

    // Wait for server and tools to load
    await waitFor(() => {
      expect(screen.getByText(mockServerName)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("read_wiki_structure")).toBeInTheDocument();
    });

    // Click the Deselect All button
    const deselectAllButton = screen.getByRole("button", { name: "Снять выделение" });
    await userEvent.click(deselectAllButton);

    // Verify onChange was called with no tools selected
    expect(mockOnChange).toHaveBeenCalledWith({
      [mockServerId]: [],
    });
  });

  describe("servers reached indirectly", () => {
    const groupServer = {
      server_id: "srv-group-1",
      server_name: "Group Server",
      alias: "Group Server",
      mcp_access_groups: ["Продакшен-group"],
    };
    const groupTools = [
      { name: "list_issues", description: "List issues" },
      { name: "delete_issue", description: "Удалить an issue" },
    ];

    it("renders the tool matrix for a server granted only through an access group", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("Group Server")).toBeInTheDocument();
      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      expect(screen.getByText("delete_issue")).toBeInTheDocument();
      expect(networking.listMCPTools).toHaveBeenCalledWith(mockAccessToken, groupServer.server_id);
    });

    it("shows every tool selected in flat Просмотр для an unrestricted access-group server", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      await screen.findByText("Group Server");
      await userEvent.click(screen.getByText("Плоский список"));

      const [listIssues, deleteIssue] = screen.getAllByRole("checkbox");
      expect(listIssues).toBeChecked();
      expect(deleteIssue).toBeChecked();

      await userEvent.click(listIssues);
      expect(mockOnChange).toHaveBeenCalledWith({ [groupServer.server_id]: ["delete_issue"] });
    });

    it("marks an access-group server as inherited and leaves a directly selected one unmarked", async () => {
      const directServer = { server_id: "srv-direct-1", server_name: "Direct Server", alias: "Direct Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([directServer, groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[directServer.server_id]}
          selectedAccessGroups={["Продакшен-group"]}
          toolPermissions={{ [directServer.server_id]: ["list_issues"], [groupServer.server_id]: ["list_issues"] }}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("Direct Server")).toBeInTheDocument();
      expect(await screen.findByText("Group Server")).toBeInTheDocument();
      expect(screen.getByText("Via access group: Продакшен-group")).toBeInTheDocument();
      expect(screen.queryAllByText(/^Via /)).toHaveLength(1);
    });

    it("renders a toolset server as inherited from that toolset", async () => {
      const toolsetServer = { server_id: "srv-toolset-1", server_name: "Инструментыet Server", alias: "Инструментыet Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([toolsetServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: toolsetServer.server_id, tool_name: "list_issues" }],
        },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("Инструментыet Server")).toBeInTheDocument();
      expect(screen.getByText("Via toolset: Support Инструментыet")).toBeInTheDocument();
    });

    // The backend adds a toolset's tools to whatever mcp_tool_permissions holds, so showing the
    // server as unrestricted would invite a deselection that grants every other tool on it.
    it("shows a toolset's own Инструменты as the allowed set and locks them", async () => {
      const toolsetServer = { server_id: "srv-toolset-1", server_name: "Инструментыet Server", alias: "Инструментыet Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([toolsetServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: toolsetServer.server_id, tool_name: "list_issues" }],
        },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      expect(
        screen.getByText(
          "list_issues is granted by a selected toolset, so it stays allowed here; Изменить the toolset to Отозвать it",
        ),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByText("Плоский список"));
      const [listIssues, deleteIssue] = screen.getAllByRole("checkbox");
      expect(listIssues).toBeChecked();
      expect(listIssues).toBeDisabled();
      expect(deleteIssue).not.toBeChecked();

      await userEvent.click(listIssues);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("ignores a Нажмите on a locked tool in the risk-group view", async () => {
      const toolsetServer = { server_id: "srv-toolset-1", server_name: "Инструментыet Server", alias: "Инструментыet Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([toolsetServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: toolsetServer.server_id, tool_name: "list_issues" }],
        },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      await userEvent.click(await screen.findByText("list_issues"));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    // Turning a risk group off must not drop a tool the entry grants in its own right, which the
    // toolset happens to grant too: that tool outlives the toolset and the admin did not clear it.
    it("keeps a locked tool the entry also grants when its risk group is turned off", async () => {
      const toolsetServer = { server_id: "srv-toolset-1", server_name: "Инструментыet Server", alias: "Инструментыet Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([toolsetServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: toolsetServer.server_id, tool_name: "list_issues" }],
        },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{ [toolsetServer.server_id]: ["list_issues"] }}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      // First checkbox is the header toggle of the group holding list_issues.
      await userEvent.click(screen.getAllByRole("checkbox")[0]);

      expect(mockOnChange).toHaveBeenCalledWith({ [toolsetServer.server_id]: ["list_issues"] });
    });

    // Copying the toolset's tools into the entry would outlive the toolset, so a write keeps only
    // what this level grants on its own.
    it("leaves a toolset's Инструменты out of the entry a Выбрать всё writes", async () => {
      const toolsetServer = { server_id: "srv-toolset-1", server_name: "Инструментыet Server", alias: "Инструментыet Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([toolsetServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: toolsetServer.server_id, tool_name: "list_issues" }],
        },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      await userEvent.click(screen.getByText("Выбрать всё"));

      expect(mockOnChange).toHaveBeenCalledWith({ [toolsetServer.server_id]: ["delete_issue"] });
    });

    // The default narrows an unrestricted server; against a toolset-restricted one it would widen
    // the grant to every non-delete tool the server exposes.
    it("does not write the Удалить-blocked default for a directly selected server a toolset restricts", async () => {
      const directServer = { server_id: "srv-direct-1", server_name: "Direct Server", alias: "Direct Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([directServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: directServer.server_id, tool_name: "list_issues" }],
        },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[directServer.server_id]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("waits for toolsets before writing the Удалить-blocked default", async () => {
      const directServer = { server_id: "srv-direct-1", server_name: "Direct Server", alias: "Direct Server" };
      let resolveToolsets: (toolsets: MCPToolset[]) => void = () => {};
      const pendingToolsets = new Promise<MCPToolset[]>((resolve) => {
        resolveToolsets = resolve;
      });
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([directServer]);
      vi.mocked(networking.fetchMCPToolsets).mockReturnValue(pendingToolsets);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[directServer.server_id]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      await screen.findByText("Direct Server");
      expect(mockOnChange).not.toHaveBeenCalled();

      resolveToolsets([
        {
          toolset_id: "ts-1",
          toolset_name: "Support Инструментыet",
          tools: [{ server_id: directServer.server_id, tool_name: "list_issues" }],
        },
      ]);

      await screen.findByText("list_issues");
      expect(screen.getByRole("checkbox", { name: "list_issues" })).toHaveAttribute("aria-Выключено", "Истина");
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    // The backend resolves a selection that is a registry id to that server alone. Rendering the
    // server merely named after it would fire the default write against a server nobody granted,
    // and a tool-permission entry is itself a grant.
    it.each([
      { label: "id owner first", idOwnerFirst: true },
      { label: "Название twin first", idOwnerFirst: false },
    ])("does not offer a server merely named after a selected id ($label)", async ({ idOwnerFirst }) => {
      const idOwner = { server_id: "srv-collide", server_name: "Payments", alias: "Payments" };
      const nameTwin = { server_id: "srv-twin", server_name: "srv-collide", alias: "srv-collide" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue(idOwnerFirst ? [idOwner, nameTwin] : [nameTwin, idOwner]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={["srv-collide"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("Payments")).toBeInTheDocument();
      expect(screen.queryByText("srv-collide")).not.toBeInTheDocument();
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({ "srv-collide": ["list_issues"] });
      });
      expect(mockOnChange.mock.calls.every(([written]) => !Object.hasOwn(written, "srv-twin"))).toBe(true);
      expect(networking.listMCPTools).not.toHaveBeenCalledWith(mockAccessToken, "srv-twin");
    });

    it("does not write a default allowlist for an inherited server", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group"]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("keeps blocking Удалить Инструменты by default for a directly selected server", async () => {
      const directServer = { server_id: "srv-direct-1", server_name: "Direct Server", alias: "Direct Server" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([directServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[directServer.server_id]}
          toolPermissions={{}}
          onChange={mockOnChange}
        />,
      );

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({ [directServer.server_id]: ["list_issues"] });
      });
    });

    it("shows a server that only a stale tool-permission entry still entitles", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={[]}
          toolPermissions={{ [groupServer.server_id]: ["list_issues"] }}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("Group Server")).toBeInTheDocument();
      expect(screen.getByText("Через права инструментов")).toBeInTheDocument();
    });

    it("shows nothing for a principal blocked from every MCP server", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      const { container } = renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[NO_MCP_SERVERS_SENTINEL]}
          toolPermissions={{ [groupServer.server_id]: ["list_issues"] }}
          onChange={vi.fn()}
        />,
      );

      expect(container).toBeEmptyDOMElement();
      expect(networking.listMCPTools).not.toHaveBeenCalled();
    });

    it("warns instead of showing Нет inherited servers when the server list cannot be loaded", async () => {
      vi.mocked(networking.fetchMCPServers).mockRejectedValue(new Error("boom"));
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group"]}
          toolPermissions={{}}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("Не удалось загрузить MCP-серверы")).toBeInTheDocument();
      expect(screen.queryByText(/has 0 servers/)).not.toBeInTheDocument();
    });

    it("tells the admin when a loaded access group has Нет member servers", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([groupServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: groupTools, error: false });

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group", "ops_readonly"]}
          toolPermissions={{}}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText('Access group "ops_readonly" has 0 servers')).toBeInTheDocument();
      expect(screen.getByText("Group Server")).toBeInTheDocument();
      expect(screen.queryByText('Access group "Продакшен-group" has 0 servers')).not.toBeInTheDocument();
    });

    it("does not call a group empty when its servers are only hidden from the caller's catalog", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
      vi.mocked(networking.fetchMCPAccessGroups).mockResolvedValue(["Продакшен-group"]);

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group", "ops_readonly"]}
          toolPermissions={{}}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText('Access group "ops_readonly" has 0 servers')).toBeInTheDocument();
      expect(screen.queryByText('Access group "Продакшен-group" has 0 servers')).not.toBeInTheDocument();
    });

    it("warns when the selected toolsets cannot be resolved to servers", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
      vi.mocked(networking.fetchMCPToolsets).mockRejectedValue(new Error("boom"));

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedToolsets={["ts-1"]}
          toolPermissions={{}}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("Не удалось загрузить наборы инструментов")).toBeInTheDocument();
    });
  });

  describe("grants keyed by Название сервера", () => {
    const namedServer = {
      server_id: "1f4bd6c1-0000-4000-8000-000000000001",
      server_name: "github_mcp",
      alias: "GitHub",
    };
    const namedTools = [
      { name: "list_issues", description: "List issues" },
      { name: "delete_issue", description: "Удалить an issue" },
    ];

    it("renders the tool matrix for a grant that names the server instead of its id", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([namedServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: namedTools, error: false });

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={["github_mcp"]}
          toolPermissions={{ github_mcp: ["list_issues"] }}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("github_mcp")).toBeInTheDocument();
      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      expect(screen.getByText("delete_issue")).toBeInTheDocument();
      expect(networking.listMCPTools).toHaveBeenCalledWith(mockAccessToken, namedServer.server_id);
    });

    it("writes an Изменить Назад to the Название Ключ instead of adding a second id-keyed entry", async () => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([namedServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: namedTools, error: false });

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={["github_mcp"]}
          toolPermissions={{ github_mcp: ["list_issues"] }}
          onChange={mockOnChange}
        />,
      );

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Снять выделение" }));

      expect(mockOnChange).toHaveBeenCalledWith({ github_mcp: [] });
    });
  });

  describe("a server named by several equivalent Ключи", () => {
    const namedServer = {
      server_id: "1f4bd6c1-0000-4000-8000-000000000001",
      server_name: "github_mcp",
      alias: "GitHub",
      mcp_access_groups: ["Продакшен-group"],
    };
    const namedTools = [
      { name: "list_issues", description: "List issues" },
      { name: "create_issue", description: "Open an issue" },
      { name: "delete_issue", description: "Удалить an issue" },
    ];

    const renderWithBothKeys = (onChange: () => void) =>
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[namedServer.server_id]}
          toolPermissions={{ [namedServer.server_id]: ["list_issues"], github_mcp: ["create_issue"] }}
          onChange={onChange}
        />,
      );

    beforeEach(() => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([namedServer]);
      vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: namedTools, error: false });
    });

    it("renders one card showing the union both Ключи grant", async () => {
      renderWithBothKeys(vi.fn());

      expect(await screen.findByText("github_mcp")).toBeInTheDocument();
      expect(screen.getAllByText("github_mcp")).toHaveLength(1);
      expect(await screen.findByText("list_issues")).toBeInTheDocument();

      // Flat view keeps checkbox order identical to the fetched tool order.
      await userEvent.click(screen.getByText("Плоский список"));
      const [listIssues, createIssue, deleteIssue] = screen.getAllByRole("checkbox");
      expect(listIssues).toBeChecked();
      expect(createIssue).toBeChecked();
      expect(deleteIssue).not.toBeChecked();
    });

    it("removes a deselected tool from every equivalent Ключ, leaving one entry for the server", async () => {
      const mockOnChange = vi.fn();
      renderWithBothKeys(mockOnChange);

      expect(await screen.findByText("list_issues")).toBeInTheDocument();
      await userEvent.click(screen.getByText("Плоский список"));
      await userEvent.click(screen.getAllByRole("checkbox")[0]);

      const written = mockOnChange.mock.calls.at(-1)?.[0] as Record<string, string[]>;
      expect(Object.keys(written)).toEqual([namedServer.server_id]);
      expect(written[namedServer.server_id]).not.toContain("list_issues");
      expect(written[namedServer.server_id]).toContain("create_issue");
    });

    // Both catalog orders, because a name resolves to two servers here and a first-match
    // implementation is only wrong in one of them.
    it.each([
      { label: "edited server first", editedFirst: true },
      { label: "twin first", editedFirst: false },
    ])(
      "says on the card when a Ключ names another server too, since its Инструменты cannot be revoked here ($label)",
      async ({ editedFirst }) => {
        const twin = { server_id: "1f4bd6c1-0000-4000-8000-000000000002", server_name: "github_mcp", alias: "Twin" };
        vi.mocked(networking.fetchMCPServers).mockResolvedValue(
          editedFirst ? [namedServer, twin] : [twin, namedServer],
        );

        renderWithProviders(
          <MCPToolPermissions
            accessToken={mockAccessToken}
            selectedServers={[namedServer.server_id]}
            toolPermissions={{ [namedServer.server_id]: ["list_issues"], github_mcp: ["create_issue"] }}
            onChange={vi.fn()}
          />,
        );

        // Both cards say it: the shared key grants on either server and neither card can revoke it,
        // so an admin looking at either one has to be told the same thing.
        expect(
          await screen.findAllByText(
            'Also granted by "github_mcp", which names another server too. Those tools stay allowed here until the servers no longer share that name',
          ),
        ).toHaveLength(2);
      },
    );

    // The shared key is the twin's only entry, so it would otherwise be the key an edit writes,
    // and writing it would move the allowlist of the server the admin is not looking at.
    it.each([
      { label: "edited server first", editedFirst: true },
      { label: "twin first", editedFirst: false },
    ])("edits the twin through its own id rather than the shared Ключ ($label)", async ({ editedFirst }) => {
      const twin = { server_id: "1f4bd6c1-0000-4000-8000-000000000002", server_name: "github_mcp", alias: "Twin" };
      vi.mocked(networking.fetchMCPServers).mockResolvedValue(editedFirst ? [namedServer, twin] : [twin, namedServer]);

      const mockOnChange = vi.fn();
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[twin.server_id]}
          toolPermissions={{ github_mcp: ["list_issues"] }}
          onChange={mockOnChange}
        />,
      );

      // The directly selected twin is the first card; both share the display name "github_mcp".
      expect(await screen.findAllByText("list_issues")).toHaveLength(2);
      await userEvent.click(screen.getAllByText("Выбрать всё")[0]);

      const written = mockOnChange.mock.calls.at(-1)?.[0] as Record<string, string[]>;
      expect(written["github_mcp"]).toEqual(["list_issues"]);
      expect(written[twin.server_id]).toEqual(["list_issues", "create_issue", "delete_issue"]);
    });

    it("says nothing about shared names when every Ключ names one server", async () => {
      renderWithBothKeys(vi.fn());

      expect(await screen.findByText("github_mcp")).toBeInTheDocument();
      expect(screen.queryByText(/names another server too/)).not.toBeInTheDocument();
    });

    it("badges the server once, by its strongest grant, when a Ключ and a group both Название it", async () => {
      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[]}
          selectedAccessGroups={["Продакшен-group"]}
          toolPermissions={{ github_mcp: ["list_issues"] }}
          onChange={vi.fn()}
        />,
      );

      expect(await screen.findByText("github_mcp")).toBeInTheDocument();
      expect(screen.getByText("Via access group: Продакшен-group")).toBeInTheDocument();
      expect(screen.queryByText("Через права инструментов")).not.toBeInTheDocument();
      expect(screen.queryAllByText(/^Via /)).toHaveLength(1);
    });
  });

  describe("risk-group (CRUD) view", () => {
    const crudTools = [
      { name: "list_documents", description: "List every document" },
      { name: "get_document", description: "Fetch one document" },
      { name: "delete_document", description: "Destroy a document" },
    ];
    const allCrudToolNames = crudTools.map((t) => t.name);

    const renderCrudView = (toolPermissions: Record<string, string[]>, onChange: () => void) => {
      vi.mocked(networking.fetchMCPServers).mockResolvedValue([
        { server_id: mockServerId, server_name: mockServerName, alias: mockServerName },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: crudTools, error: false });

      renderWithProviders(
        <MCPToolPermissions
          accessToken={mockAccessToken}
          selectedServers={[mockServerId]}
          toolPermissions={toolPermissions}
          onChange={onChange}
        />,
      );
    };

    it("removes a whole risk group from the saved payload when its group toggle is cleared", async () => {
      const mockOnChange = vi.fn();
      renderCrudView({ [mockServerId]: allCrudToolNames }, mockOnChange);

      const readGroupToggle = await screen.findByRole("checkbox", { name: "Всеow Все Read Инструменты" });
      expect(readGroupToggle).toBeChecked();

      await userEvent.click(readGroupToggle);

      expect(mockOnChange).toHaveBeenCalledWith({ [mockServerId]: ["delete_document"] });
    });

    it("adds the rest of a partially-allowed risk group when its mixed toggle is clicked", async () => {
      const mockOnChange = vi.fn();
      renderCrudView({ [mockServerId]: ["list_documents"] }, mockOnChange);

      const readGroupToggle = await screen.findByRole("checkbox", { name: "Всеow Все Read Инструменты" });
      expect(readGroupToggle).toBePartiallyChecked();

      await userEvent.click(readGroupToggle);

      expect(mockOnChange).toHaveBeenCalledWith({ [mockServerId]: ["list_documents", "get_document"] });
    });

    it("toggles a single tool exactly once when its checkbox is clicked inside the clickable row", async () => {
      const mockOnChange = vi.fn();
      renderCrudView({ [mockServerId]: allCrudToolNames }, mockOnChange);

      await userEvent.click(await screen.findByRole("checkbox", { name: "delete_document" }));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({ [mockServerId]: ["list_documents", "get_document"] });
    });

    it("toggles a single tool when the row around its checkbox is clicked", async () => {
      const mockOnChange = vi.fn();
      renderCrudView({ [mockServerId]: allCrudToolNames }, mockOnChange);

      await userEvent.click(await screen.findByText("Destroy a document"));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith({ [mockServerId]: ["list_documents", "get_document"] });
    });

    it("re-renders each checkbox from the permissions it emitted", async () => {
      const Harness = () => {
        const [permissions, setPermissions] = useState<Record<string, string[]>>({
          [mockServerId]: allCrudToolNames,
        });
        return (
          <>
            <MCPToolPermissions
              accessToken={mockAccessToken}
              selectedServers={[mockServerId]}
              toolPermissions={permissions}
              onChange={setPermissions}
            />
            <output>{(permissions[mockServerId] ?? []).join(",")}</output>
          </>
        );
      };

      vi.mocked(networking.fetchMCPServers).mockResolvedValue([
        { server_id: mockServerId, server_name: mockServerName, alias: mockServerName },
      ]);
      vi.mocked(networking.listMCPTools).mockResolvedValue({ tools: crudTools, error: false });
      renderWithProviders(<Harness />);

      const deleteTool = await screen.findByRole("checkbox", { name: "delete_document" });
      const readGroupToggle = screen.getByRole("checkbox", { name: "Всеow Все Read Инструменты" });
      expect(deleteTool).toBeChecked();
      expect(readGroupToggle).toBeChecked();

      await userEvent.click(deleteTool);
      expect(deleteTool).not.toBeChecked();
      expect(screen.getByRole("Статус")).toHaveTextContent("list_documents,get_document");

      await userEvent.click(screen.getByRole("checkbox", { name: "get_document" }));
      expect(readGroupToggle).toBePartiallyChecked();
      expect(screen.getByRole("Статус")).toHaveTextContent("list_documents");

      await userEvent.click(readGroupToggle);
      expect(readGroupToggle).toBeChecked();
      expect(screen.getByRole("Статус")).toHaveTextContent("list_documents,get_document");
      expect(screen.getByRole("checkbox", { name: "delete_document" })).not.toBeChecked();
    });
  });
});
