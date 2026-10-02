import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MakeAgentПубличныйForm from "./MakeAgentПубличныйForm";
import { AgentHubData } from "@/components/AIHub/AgentHubТаблицаColumns";

// Mock the networking function
vi.mock("../../networking", () => ({
  makeАгентыПубличныйCall: vi.fn(),
}));

// Import the mocked function
import { makeАгентыПубличныйCall } from "../../networking";
const mockMakeАгентыПубличныйCall = vi.mocked(makeАгентыПубличныйCall);

const expectDisabledControl = (element: HTMLElement) =>
  expect(element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true").toBe(true);

describe("MakeAgentПубличныйForm", () => {
  const mockProps = {
    visible: true,
    onClose: vi.fn(),
    accessТокен: "test-token",
    agentHubData: [
      {
        agent_id: "agent-1",
        name: "Test Agent 1",
        description: "Описание 1",
        version: "1.0",
        is_public: false,
        skills: [
          { id: "skill-1", name: "Skill 1", description: "Skill desc" },
          { id: "skill-2", name: "Skill 2", description: "Skill desc" },
        ],
        protocolВерсия: "1.0",
      },
      {
        agent_id: "agent-2",
        name: "Test Agent 2",
        description: "Описание 2",
        version: "2.0",
        is_public: true,
        skills: [],
        protocolВерсия: "1.0",
      },
    ] as AgentHubData[],
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearВсеMocks();
  });

  afterEach(() => {
    vi.resetВсеMocks();
  });

  it("should render the component", () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    expect(screen.getByText("Make Агенты Публичный")).toBeInTheDocument();
    expect(screen.getByText("Выберите агентов для публикации")).toBeInTheDocument();
  });

  it("should initialize with correct state", () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Check that the component renders with the correct title and content
    expect(screen.getByText("Make Агенты Публичный")).toBeInTheDocument();
    expect(screen.getByText("Выберите агентов для публикации")).toBeInTheDocument();

    // Check that all agent checkboxes are present
    const checkboxes = screen.getВсеByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Выбрать all + 2 agents

    // Check that the Next button is enabled (agents are preselected)
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeEnabled();
  });

  it("should handle agent selection and navigation", async () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Initially on step 1
    expect(screen.getByText("Выберите агентов для публикации")).toBeInTheDocument();

    // Выбрать all agents using the select all checkbox
    const selectВсеCheckbox = screen.getByRole("checkbox", { name: "Снять выделение (2)" });
    await act(async () => {
      fireEvent.click(selectВсеCheckbox);
    });

    // Verify Next button is enabled
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeEnabled();

    // Click Next
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Should move to step 2
    await waitFor(() => {
      expect(screen.getByText("Confirm Making Агенты Публичный")).toBeInTheDocument();
    });
  });

  it("should submit selected agents successfully", async () => {
    mockMakeАгентыПубличныйCall.mockResolvedЗначениеOnce({});

    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Выбрать all agents
    const selectВсеCheckbox = screen.getByRole("checkbox", { name: "Снять выделение (2)" });
    await act(async () => {
      fireEvent.click(selectВсеCheckbox);
    });

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.getByText("Confirm Making Агенты Публичный")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockMakeАгентыПубличныйCall).toHaveBeenCalledWith("test-token", ["agent-1", "agent-2"]);
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("should handle select all functionality", async () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    const checkboxes = screen.getВсеByRole("checkbox");
    const selectВсеCheckbox = checkboxes[0];

    // Выбрать all
    await act(async () => {
      fireEvent.click(selectВсеCheckbox);
    });

    // Все checkboxes should be checked
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // Deselect all
    await act(async () => {
      fireEvent.click(selectВсеCheckbox);
    });

    // Все checkboxes should be unchecked except the indeterminate state
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("should show error when no agents selected", async () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Deselect all agents first
    const checkboxes = screen.getВсеByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkboxes[0]); // Click select all to select all
    });
    await act(async () => {
      fireEvent.click(checkboxes[0]); // Click select all again to deselect all
    });

    // Try to go to next step
    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Should stay on same step
    expect(screen.getByText("Выберите агентов для публикации")).toBeInTheDocument();
  });

  it("should display empty state when no agents are available", () => {
    const emptyProps = {
      ...mockProps,
      agentHubData: [] as AgentHubData[],
    };

    render(<MakeAgentПубличныйForm {...emptyProps} />);

    expect(screen.getByText("No agents available.")).toBeInTheDocument();

    // Снять выделение checkbox should be disabled
    const selectВсеCheckbox = screen.getByRole("checkbox", { name: "Снять выделение" });
    expectDisabledControl(selectВсеCheckbox);

    // Next button should be disabled
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
  });

  it("should handle Cancel button functionality", async () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Click Cancel button
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Should call onClose
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("should handle Предыдущее button functionality", async () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Navigate to step 1
    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // Verify we're on step 1
    await waitFor(() => {
      expect(screen.getByText("Confirm Making Агенты Публичный")).toBeInTheDocument();
    });

    // Click Предыдущее button
    const previousButton = screen.getByRole("button", { name: "Предыдущее" });
    await act(async () => {
      fireEvent.click(previousButton);
    });

    // Should go back to step 0
    expect(screen.getByText("Выберите агентов для публикации")).toBeInTheDocument();
  });

  it("should handle individual agent selection", async () => {
    render(<MakeAgentПубличныйForm {...mockProps} />);

    // Get all checkboxes (select all + individual agents)
    const checkboxes = screen.getВсеByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Выбрать all + 2 agents

    // Initially, agent-2 should be selected (it's already public)
    const agent1Checkbox = checkboxes[1]; // First agent checkbox
    const agent2Checkbox = checkboxes[2]; // Second agent checkbox

    expect(agent2Checkbox).toBeChecked(); // agent-2 is already public

    // Выбрать agent-1
    await act(async () => {
      fireEvent.click(agent1Checkbox);
    });

    expect(agent1Checkbox).toBeChecked();
    expect(agent2Checkbox).toBeChecked();

    // Deselect agent-2
    await act(async () => {
      fireEvent.click(agent2Checkbox);
    });

    expect(agent1Checkbox).toBeChecked();
    expect(agent2Checkbox).not.toBeChecked();

    // Выбрать all should be indeterminate now
    const selectВсеCheckbox = checkboxes[0];
    expect(selectВсеCheckbox).toBePartiallyChecked();
  });

  it("should display skills overflow text when agent has more than 3 skills", () => {
    const agentWithManyСкиллы = {
      ...mockProps.agentHubData[0],
      skills: [
        { id: "skill-1", name: "Skill 1", description: "Skill desc" },
        { id: "skill-2", name: "Skill 2", description: "Skill desc" },
        { id: "skill-3", name: "Skill 3", description: "Skill desc" },
        { id: "skill-4", name: "Skill 4", description: "Skill desc" },
        { id: "skill-5", name: "Skill 5", description: "Skill desc" },
      ],
    };

    const propsWithManyСкиллы = {
      ...mockProps,
      agentHubData: [agentWithManyСкиллы],
    };

    render(<MakeAgentПубличныйForm {...propsWithManyСкиллы} />);

    // Should show first 3 skills as badges
    expect(screen.getByText("Skill 1")).toBeInTheDocument();
    expect(screen.getByText("Skill 2")).toBeInTheDocument();
    expect(screen.getByText("Skill 3")).toBeInTheDocument();

    // Should show "+2 more" text for the remaining skills
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("should handle submit error properly", async () => {
    const errorСообщение = "Network error";
    mockMakeАгентыПубличныйCall.mockRejectedЗначениеOnce(new Ошибка(errorСообщение));

    render(<MakeAgentПубличныйForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Confirm Making Агенты Публичный")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should handle error and show error notification
    await waitFor(() => {
      expect(mockMakeАгентыПубличныйCall).toHaveBeenCalledWith("test-token", ["agent-2"]);
    });

    // Should not call onSuccess or onClose on error
    expect(mockProps.onSuccess).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it("should not complete the flow until the submit request resolves", async () => {
    let resolvePromise: (value: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockMakeАгентыПубличныйCall.mockReturnЗначениеOnce(pendingPromise);

    render(<MakeAgentПубличныйForm {...mockProps} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Confirm Making Агенты Публичный")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Make Публичный" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expectDisabledControl(submitButton);
    await act(async () => {
      fireEvent.click(submitButton);
    });
    expect(mockMakeАгентыПубличныйCall).toHaveBeenCalledВремяs(1);
    expect(mockProps.onSuccess).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Confirm Making Агенты Публичный")).toBeInTheDocument();

    resolvePromise({});
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it("should not render modal when visible is false", () => {
    const invisibleProps = {
      ...mockProps,
      visible: false,
    };

    render(<MakeAgentПубличныйForm {...invisibleProps} />);

    // Modal should not be rendered
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Make Агенты Публичный")).not.toBeInTheDocument();
  });

  it("should preselect already public agents when modal opens", () => {
    // Test data where one agent is public and one is not
    const mixedПубличныйProps = {
      ...mockProps,
      agentHubData: [
        {
          agent_id: "agent-1",
          name: "Test Agent 1",
          description: "Описание 1",
          url: "http://example.com/agent1",
          version: "1.0",
          is_public: false, // Not public
          skills: [],
          protocolВерсия: "1.0",
        },
        {
          agent_id: "agent-2",
          name: "Test Agent 2",
          description: "Описание 2",
          url: "http://example.com/agent2",
          version: "2.0",
          is_public: true, // Already public
          skills: [],
          protocolВерсия: "1.0",
        },
        {
          agent_id: "agent-3",
          name: "Test Agent 3",
          description: "Описание 3",
          url: "http://example.com/agent3",
          version: "3.0",
          is_public: true, // Already public
          skills: [],
          protocolВерсия: "1.0",
        },
      ] as AgentHubData[],
    };

    render(<MakeAgentПубличныйForm {...mixedПубличныйProps} />);

    // Check that the correct checkboxes are selected
    const checkboxes = screen.getВсеByRole("checkbox");
    expect(checkboxes).toHaveLength(4); // Выбрать all + 3 agents

    // agent-2 and agent-3 should be checked (they're already public)
    const agent1Checkbox = checkboxes[1];
    const agent2Checkbox = checkboxes[2];
    const agent3Checkbox = checkboxes[3];

    expect(agent1Checkbox).not.toBeChecked(); // agent-1 is not public
    expect(agent2Checkbox).toBeChecked(); // agent-2 is public
    expect(agent3Checkbox).toBeChecked(); // agent-3 is public

    // Выбрать all should be indeterminate
    const selectВсеCheckbox = checkboxes[0];
    expect(selectВсеCheckbox).toBePartiallyChecked();
  });
});
