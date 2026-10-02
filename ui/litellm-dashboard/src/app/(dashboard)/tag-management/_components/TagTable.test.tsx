import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatCellDate } from "@/components/shared/table_cells";
import { Tag } from "@/components/tag_management/types";

import TagТаблица from "./TagТаблица";

describe("TagТаблица", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnSelectTag = vi.fn();

  const mockTag: Tag = {
    name: "test-tag",
    description: "Test description",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"],
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
      "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1": "GPT-4",
      "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2": "Claude-3",
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const mockDynamicSpendTag: Tag = {
    name: "dynamic-spend-tag",
    description:
      "This is just a spend tag that was passed dynamically in a request. It does not control any LLM Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs.",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const defaultProps = {
    data: [],
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onSelectTag: mockOnSelectTag,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render every column header", () => {
    render(<TagТаблица {...defaultProps} />);
    for (const header of ["Tag Name", "Описание", "Разрешённые модели", "Создан"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it("should display the empty state when data is empty", () => {
    render(<TagТаблица {...defaultProps} />);
    expect(screen.getByText("No tags yet")).toBeInTheDocument();
  });

  it("should display tag name and description", () => {
    render(<TagТаблица {...defaultProps} data={[mockTag]} />);
    expect(screen.getByText("test-tag")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию names from Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info", () => {
    render(<TagТаблица {...defaultProps} data={[mockTag]} />);
    expect(screen.getByText("GPT-4")).toBeInTheDocument();
    expect(screen.getByText("Claude-3")).toBeInTheDocument();
  });

  it("should display Все Режимls badge when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs array is empty", () => {
    const tagWithNoModels: Tag = {
      ...mockTag,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    };
    render(<TagТаблица {...defaultProps} data={[tagWithNoModels]} />);
    expect(screen.getByText("Все Режимls")).toBeInTheDocument();
  });

  it("should display formatted created date", () => {
    render(<TagТаблица {...defaultProps} data={[mockTag]} />);
    const formattedDate = formatCellDate(new Date(mockTag.created_at), "date");
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it("should sort by created date descending by default", () => {
    const olderTag: Tag = { ...mockTag, name: "older-tag", created_at: "2023-01-01T00:00:00Z" };
    const newerTag: Tag = { ...mockTag, name: "newer-tag", created_at: "2025-01-01T00:00:00Z" };
    render(<TagТаблица {...defaultProps} data={[olderTag, newerTag]} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("newer-tag")).toBeInTheDocument();
    expect(within(rows[1]).getByText("older-tag")).toBeInTheDocument();
  });

  it("should call onSelectTag when tag name is clicked", async () => {
    const user = userEvent.setup();
    render(<TagТаблица {...defaultProps} data={[mockTag]} />);
    await user.click(screen.getByRole("button", { name: "test-tag" }));
    expect(mockOnSelectTag).toHaveBeenCalledWith("test-tag");
  });

  it("should render tag name as non-clickable and muted for dynamic spend tags", () => {
    render(<TagТаблица {...defaultProps} data={[mockDynamicSpendTag]} />);
    expect(screen.queryByRole("button", { name: "dynamic-spend-tag" })).not.toBeInTheDocument();
    expect(screen.getByText("dynamic-spend-tag")).toHaveClass("text-muted-foreground");
    expect(mockOnSelectTag).not.toHaveBeenCalled();
  });

  it("should truncate long tag names and descriptions", () => {
    const longTag: Tag = {
      ...mockTag,
      name: "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15) Firefox/152.0",
      description: "A very long description that would otherwise stretch the column far beyond what users need to see",
    };
    render(<TagТаблица {...defaultProps} data={[longTag]} />);
    expect(screen.getByText(longTag.name)).toHaveClass("truncate", "text-primary");
    expect(screen.getByText(longTag.description as string)).toHaveClass("truncate", "max-w-72");
  });

  it("should edit a tag through the actions menu", async () => {
    const user = userEvent.setup();
    render(<TagТаблица {...defaultProps} data={[mockTag]} />);
    await user.click(screen.getByTestId("tag-actions-test-tag"));
    await user.click(await screen.findByTestId("tag-action-edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTag);
  });

  it("should delete a tag through the actions menu", async () => {
    const user = userEvent.setup();
    render(<TagТаблица {...defaultProps} data={[mockTag]} />);
    await user.click(screen.getByTestId("tag-actions-test-tag"));
    await user.click(await screen.findByTestId("tag-action-delete"));
    expect(mockOnDelete).toHaveBeenCalledWith("test-tag");
  });

  it("should disable edit and delete for dynamic spend tags", async () => {
    const user = userEvent.setup();
    render(<TagТаблица {...defaultProps} data={[mockDynamicSpendTag]} />);
    await user.click(screen.getByTestId("tag-actions-dynamic-spend-tag"));

    const editItem = await screen.findByTestId("tag-action-edit");
    const deleteItem = await screen.findByTestId("tag-action-delete");

    expect(editItem).toHaveAttribute("data-disabled");
    expect(deleteItem).toHaveAttribute("data-disabled");

    await user.click(editItem);
    await user.click(deleteItem);

    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});
