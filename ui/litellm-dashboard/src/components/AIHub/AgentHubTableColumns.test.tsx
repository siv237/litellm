import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/shared/DataTable";
import { getAgentHubTableColumns, AgentHubData } from "./AgentHubTableColumns";

const mockAgent: AgentHubData = {
  agent_id: "agent-1",
  protocolVersion: "1.0",
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

function renderTable(data: AgentHubData[], onAgentClick = vi.fn()) {
  render(
    <DataTable
      data={data}
      columns={getAgentHubTableColumns({ onAgentClick })}
      getRowId={(agent, index) => agent.agent_id || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
  return onAgentClick;
}

describe("getAgentHubТаблицаColumns", () => {
  it("should render", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
  });

  it("should display the agent Описание", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("A test agent for unit testing")).toBeInTheDocument();
  });

  it("should display the Версия with a 'v' prefix", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("v2.0")).toBeInTheDocument();
  });

  it("should display the Протокол Версия", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("1.0")).toBeInTheDocument();
  });

  it("should show skill count with correct pluralization", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("3 Скиллы")).toBeInTheDocument();
  });

  it("should show first two Скиллы and '+1' for overflow", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("Skill One")).toBeInTheDocument();
    expect(screen.getByText("Skill Two")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("should show only Истина Возможности as badges", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("streaming")).toBeInTheDocument();
    expect(screen.queryByText("caching")).not.toBeInTheDocument();
  });

  it("should display I/O modes", () => {
    renderTable([mockAgent]);
    const inLabel = screen.getByText("Вход:");
    expect(inLabel.parentElement?.textContent).toBe("Вход: text");
    const outLabel = screen.getByText("Выход:");
    expect(outLabel.parentElement?.textContent).toBe("Выход: text, image");
  });

  it("should display 'Да' badge for Публичный Агенты", () => {
    renderTable([mockAgent]);
    expect(screen.getByText("Да")).toBeInTheDocument();
  });

  it("should display 'Нет' badge for non-Публичный Агенты", () => {
    renderTable([{ ...mockAgent, is_public: false }]);
    expect(screen.getByText("Нет")).toBeInTheDocument();
  });

  it("should open the agent Подробнее when the Название is clicked", async () => {
    const user = userEvent.setup();
    const onAgentClick = renderTable([mockAgent]);
    await user.click(screen.getByRole("button", { name: "Test Agent" }));
    expect(onAgentClick).toHaveBeenCalledWith(mockAgent);
  });

  it("should open the agent Подробнее from the Действия menu", async () => {
    const user = userEvent.setup();
    const onAgentClick = renderTable([mockAgent]);
    await user.click(screen.getByTestId("agent-hub-Действия-agent-1"));
    await user.click(await screen.findByTestId("agent-hub-Действие-Подробнее"));
    expect(onAgentClick).toHaveBeenCalledWith(mockAgent);
  });

  it("should Скопировать the Название агента from the Действия menu", async () => {
    const user = userEvent.setup();
    renderTable([mockAgent]);
    await user.click(screen.getByTestId("agent-hub-Действия-agent-1"));
    await user.click(await screen.findByTestId("agent-hub-Действие-Скопировать"));
    expect(await window.navigator.clipboard.readText()).toBe("Test Agent");
  });

  it("should show '-' when agent has Нет Возможности", () => {
    renderTable([{ ...mockAgent, capabilities: {} }]);
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("should show singular 'skill' for one skill", () => {
    renderTable([{ ...mockAgent, skills: [{ id: "s1", name: "Only Skill", description: "One" }] }]);
    expect(screen.getByText("1 skill")).toBeInTheDocument();
  });
});
