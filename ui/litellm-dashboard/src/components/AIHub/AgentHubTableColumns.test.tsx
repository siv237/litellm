import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataТаблица } from "@/components/shared/DataТаблица";
import { getAgentHubTableColumns, AgentHubData } from "./AgentHubTableColumns";

const mockAgent: AgentHubData = {
  agent_id: "agent-1",
  protocolВерсия: "1.0",
  name: "Test Agent",
  description: "A test agent for unit testing",
  url: "https://agent.example.com",
  version: "2.0",
  capabilities: { streaming: true, caching: false },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text", "image"],
  skills: [
    { id: "s1", name: "Skill One", description: "First skill" },
    { id: "s2", name: "Skill Two", description: "Second skill" },
    { id: "s3", name: "Skill Three", description: "Third skill" },
  ],
  is_public: true,
};

function renderТаблица(data: AgentHubData[], onAgentClick = vi.fn()) {
  render(
    <DataТаблица
      data={data}
      columns={getAgentHubTableColumns({ onAgentClick })}
      getRowId={(agent, index) => agent.agent_id || String(index)}
      sortingРежим="client"
      size="compact"
    />,
  );
  return onAgentClick;
}

describe("getAgentHubTableColumns", () => {
  it("should render", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
  });

  it("should display the agent description", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("A test agent for unit testing")).toBeInTheDocument();
  });

  it("should display the version with a 'v' prefix", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("v2.0")).toBeInTheDocument();
  });

  it("should display the protocol version", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("1.0")).toBeInTheDocument();
  });

  it("should show skill count with correct pluralization", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("3 skills")).toBeInTheDocument();
  });

  it("should show first two skills and '+1' for overflow", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("Skill One")).toBeInTheDocument();
    expect(screen.getByText("Skill Two")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("should show only true capabilities as badges", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("streaming")).toBeInTheDocument();
    expect(screen.queryByText("caching")).not.toBeInTheDocument();
  });

  it("should display I/O modes", () => {
    renderТаблица([mockAgent]);
    const inLabel = screen.getByText("In:");
    expect(inLabel.parentElement?.textContent).toBe("In: text");
    const выходLabel = screen.getByText("Выход:");
    expect(выходLabel.parentElement?.textContent).toBe("Выход: text, image");
  });

  it("should display 'Yes' badge for public agents", () => {
    renderТаблица([mockAgent]);
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("should display 'No' badge for non-public agents", () => {
    renderТаблица([{ ...mockAgent, is_public: false }]);
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("should open the agent details when the name is clicked", async () => {
    const user = userEvent.setup();
    const onAgentClick = renderТаблица([mockAgent]);
    await user.click(screen.getByRole("button", { name: "Test Agent" }));
    expect(onAgentClick).toHaveBeenCalledWith(mockAgent);
  });

  it("should open the agent details from the actions menu", async () => {
    const user = userEvent.setup();
    const onAgentClick = renderТаблица([mockAgent]);
    await user.click(screen.getByTestId("agent-hub-actions-agent-1"));
    await user.click(await screen.findByTestId("agent-hub-action-details"));
    expect(onAgentClick).toHaveBeenCalledWith(mockAgent);
  });

  it("should copy the agent name from the actions menu", async () => {
    const user = userEvent.setup();
    renderТаблица([mockAgent]);
    await user.click(screen.getByTestId("agent-hub-actions-agent-1"));
    await user.click(await screen.findByTestId("agent-hub-action-copy"));
    expect(await window.navigator.clipboard.readText()).toBe("Test Agent");
  });

  it("should show '-' when agent has no capabilities", () => {
    renderТаблица([{ ...mockAgent, capabilities: {} }]);
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("should show singular 'skill' for one skill", () => {
    renderТаблица([{ ...mockAgent, skills: [{ id: "s1", name: "Only Skill", description: "One" }] }]);
    expect(screen.getByText("1 skill")).toBeInTheDocument();
  });
});
