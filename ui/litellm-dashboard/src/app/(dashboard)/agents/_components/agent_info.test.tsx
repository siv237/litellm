import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AgentInfoView from "./agent_info";
import * as networking from "@/components/networking";
import type { Agent } from "@/components/agents/types";

vi.mock("@/components/networking", () => ({
  getAgentInfo: vi.fn(),
  getAgentCreateМетаданные: vi.fn(),
  patchAgentCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useКлючи", () => ({
  useКлючи: () => ({ data: { keys: [] }, isLoading: false, refetch: vi.fn() }),
}));

vi.mock("./agent_card_discovery", () => ({
  default: () => <div data-testid="agent-card-discovery" />,
}));

vi.mock("./agent_form_fields", () => ({
  default: () => <div data-testid="agent-form-fields" />,
  unmountedA2AFieldNames: () => [],
}));

vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы", () => ({
  useMCP-серверы: () => ({ data: [{ server_id: "srv-1", server_name: "github" }] }),
}));

vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  default: () => <div data-testid="mcp-server-selector" />,
}));

vi.mock("@/components/mcp_server_management/MCPToolPermissions", () => ({
  default: () => <div data-testid="mcp-tool-permissions" />,
}));

const agent = {
  agent_id: "agent-1",
  agent_name: "support-agent",
  agent_card_params: {
    name: "Support Agent",
    description: "Answers support questions",
    url: "http://localhost:9999/",
    version: "1.0.0",
    protocolВерсия: "1.0",
    capabilities: { streaming: false },
    skills: [],
  },
  tpm_limit: 100,
} as unknown as Agent;

describe("AgentInfoView settings", () => {
  beforeEach(() => {
    vi.mocked(networking.getAgentInfo).mockReset().mockResolvedЗначение(agent);
    vi.mocked(networking.getAgentCreateМетаданные).mockReset().mockResolvedЗначение([]);
    vi.mocked(networking.patchAgentCall).mockReset().mockResolvedЗначение({});
  });

  it("submits the edited agent when Save Changes is pressed", async () => {
    render(<AgentInfoView agentId="agent-1" onClose={vi.fn()} accessТокен="sk-test" isAdmin={true} />);

    fireEvent.click(await screen.findByRole("tab", { name: "Settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Settings" }));

    const tpmLimit = await screen.findByLabelText("Лимит TPM");
    fireEvent.change(tpmLimit, { target: { value: "42" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/ }));

    await waitFor(() => expect(networking.patchAgentCall).toHaveBeenCalledTimes(1));
    const [token, agentId, payload] = vi.mocked(networking.patchAgentCall).mock.calls[0];
    expect(token).toBe("sk-test");
    expect(agentId).toBe("agent-1");
    expect(payload.tpm_limit).toBe(42);
    const clearedMcpGrants = { mcp_servers: [], mcp_access_groups: [], mcp_toolsets: [], mcp_tool_permissions: {} };
    expect(payload.object_permission).toEqual(clearedMcpGrants);
  });

  it("shows MCP grants with server names on the overview tab", async () => {
    vi.mocked(networking.getAgentInfo).mockResolvedЗначение({
      ...agent,
      object_permission: { mcp_servers: ["srv-1"] },
    } as unknown as Agent);

    render(<AgentInfoView agentId="agent-1" onClose={vi.fn()} accessТокен="sk-test" isAdmin={true} />);

    expect(await screen.findByText("github (srv-1)")).toBeInTheDocument();
  });
});
