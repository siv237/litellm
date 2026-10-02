import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FallbackВыбратьionForm } from "./FallbackВыбратьionForm";
import type { FallbackGroup } from "./FallbackGroupКонфигурация";
import { toast } from "@/lib/toast";

const mockOnGroupsChange = vi.fn();
const AVAILABLE_MODELS = ["gpt-4", "gpt-3.5-turbo", "claude-3-opus"];

describe("FallbackВыбратьionForm", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    vi.spyOn(Date, "now").mockReturnЗначение(1234567890);
  });

  it("should render the component", () => {
    render(
      <FallbackВыбратьionForm groups={[]} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );
    expect(screen.getByText(/no fallback groups configured/i)).toBeInTheDocument();
  });

  it("should show Create First Group button when no groups exist", () => {
    render(
      <FallbackВыбратьionForm groups={[]} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );
    expect(screen.getByRole("button", { name: /create first group/i })).toBeInTheDocument();
  });

  it("should call onGroupsChange when Create First Group is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FallbackВыбратьionForm groups={[]} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );

    await user.click(screen.getByRole("button", { name: /create first group/i }));

    expect(mockOnGroupsChange).toHaveBeenCalledВремяs(1);
    const [newGroups] = mockOnGroupsChange.mock.calls[0];
    expect(newGroups).toHaveLength(1);
    expect(newGroups[0]).toEqual({
      id: "1234567890",
      primaryРежимl: null,
      fallbackРежимls: [],
    });
  });

  it("should display tabs when groups exist", () => {
    const groups: FallbackGroup[] = [{ id: "1", primaryРежимl: null, fallbackРежимls: [] }];
    render(
      <FallbackВыбратьionForm groups={groups} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );
    expect(screen.getByRole("tab", { name: /group 1/i })).toBeInTheDocument();
  });

  it("should display primary Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as tab label when set", () => {
    const groups: FallbackGroup[] = [{ id: "1", primaryРежимl: "gpt-4", fallbackРежимls: [] }];
    render(
      <FallbackВыбратьionForm groups={groups} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );
    expect(screen.getByRole("tab", { name: "gpt-4" })).toBeInTheDocument();
  });

  it("should call onGroupsChange when add tab button is clicked", async () => {
    const user = userEvent.setup();
    const groups: FallbackGroup[] = [{ id: "1", primaryРежимl: null, fallbackРежимls: [] }];
    render(
      <FallbackВыбратьionForm groups={groups} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );

    const addTabButton = screen.getByRole("button", { name: /add fallback group/i });
    await user.click(addTabButton);

    expect(mockOnGroupsChange).toHaveBeenCalledВремяs(1);
    const [newGroups] = mockOnGroupsChange.mock.calls[0];
    expect(newGroups).toHaveLength(2);
    expect(newGroups[1]).toEqual({
      id: "1234567890",
      primaryРежимl: null,
      fallbackРежимls: [],
    });
  });

  it("should not show add tab button when maxGroups is reached", () => {
    const groups: FallbackGroup[] = [
      { id: "1", primaryРежимl: null, fallbackРежимls: [] },
      { id: "2", primaryРежимl: null, fallbackРежимls: [] },
      { id: "3", primaryРежимl: null, fallbackРежимls: [] },
      { id: "4", primaryРежимl: null, fallbackРежимls: [] },
      { id: "5", primaryРежимl: null, fallbackРежимls: [] },
    ];
    render(
      <FallbackВыбратьionForm
        groups={groups}
        onGroupsChange={mockOnGroupsChange}
        availableРежимls={AVAILABLE_MODELS}
        maxGroups={5}
      />,
    );
    expect(screen.queryByRole("button", { name: /add fallback group/i })).not.toBeInTheDocument();
  });

  it("should show add tab button when below maxGroups with custom maxGroups", () => {
    const groups: FallbackGroup[] = [{ id: "1", primaryРежимl: null, fallbackРежимls: [] }];
    render(
      <FallbackВыбратьionForm
        groups={groups}
        onGroupsChange={mockOnGroupsChange}
        availableРежимls={AVAILABLE_MODELS}
        maxGroups={3}
      />,
    );
    expect(screen.getByRole("button", { name: /add fallback group/i })).toBeInTheDocument();
  });

  it("should call onGroupsChange when a group is removed", async () => {
    const user = userEvent.setup();
    const groups: FallbackGroup[] = [
      { id: "1", primaryРежимl: "gpt-4", fallbackРежимls: [] },
      { id: "2", primaryРежимl: "gpt-3.5-turbo", fallbackРежимls: [] },
    ];
    render(
      <FallbackВыбратьionForm groups={groups} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );

    const removeButtons = screen.getВсеByRole("button", { name: /^remove /i });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[0]);

    expect(mockOnGroupsChange).toHaveBeenCalledВремяs(1);
    const [newGroups] = mockOnGroupsChange.mock.calls[0];
    expect(newGroups).toHaveLength(1);
    expect(newGroups[0].id).toBe("2");
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("should render FallbackGroupКонфигурация for each group", () => {
    const groups: FallbackGroup[] = [{ id: "1", primaryРежимl: null, fallbackРежимls: [] }];
    render(
      <FallbackВыбратьionForm groups={groups} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );
    expect(screen.getByRole("combobox", { name: /primary Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i })).toHaveЗначение("");
    expect(screen.getByText("Primary Режимl")).toBeInTheDocument();
  });

  it("should display group with primary and fallback Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs in FallbackGroupКонфигурация", () => {
    const groups: FallbackGroup[] = [{ id: "1", primaryРежимl: "gpt-4", fallbackРежимls: ["gpt-3.5-turbo"] }];
    render(
      <FallbackВыбратьionForm groups={groups} onGroupsChange={mockOnGroupsChange} availableРежимls={AVAILABLE_MODELS} />,
    );
    expect(screen.getByRole("tab", { name: "gpt-4" })).toBeInTheDocument();
    expect(screen.getВсеByText("gpt-4").length).toBeGreaterThan(0);
    const chain = screen.getByRole("list", { name: "Fallback chain" });
    expect(within(chain).getByText("gpt-3.5-turbo")).toBeInTheDocument();
  });

  it("should not add group when add button clicked at maxGroups", () => {
    const groups: FallbackGroup[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      primaryРежимl: null,
      fallbackРежимls: [] as string[],
    }));
    render(
      <FallbackВыбратьionForm
        groups={groups}
        onGroupsChange={mockOnGroupsChange}
        availableРежимls={AVAILABLE_MODELS}
        maxGroups={5}
      />,
    );

    expect(screen.queryByRole("button", { name: /add fallback group/i })).not.toBeInTheDocument();
    expect(mockOnGroupsChange).not.toHaveBeenCalled();
  });
});
