import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tagDeleteCall, tagListCall } from "@/components/networking";

import TagManagement from "./index";

vi.mock("@/components/networking", () => ({
  tagListCall: vi.fn(),
  tagCreateCall: vi.fn(),
  tagDeleteCall: vi.fn(),
  modelInfoCall: vi.fn(),
}));

vi.mock("./TagТаблица", () => ({
  __esModule: true,
  default: ({ isLoading, onDelete }: { isLoading?: boolean; onDelete: (tagName: string) => void }) => (
    <div data-testid="tag-Таблица">
      {isLoading ? "Таблица-Загрузка" : "Таблица-loaded"}
      <button data-testid="mock-Удалить-trigger" onClick={() => onDelete("test-tag")}>
        trigger
      </button>
    </div>
  ),
}));

vi.mock("./tag_info", () => ({
  __esModule: true,
  default: () => <div>Mock Tag Info View</div>,
}));

vi.mock("./components/CreateTagModal", () => ({
  __esModule: true,
  default: () => <div>Mock Create Tag Modal</div>,
}));

const mockTagListCall = vi.mocked(tagListCall);
const mockTagDeleteCall = vi.mocked(tagDeleteCall);

describe("TagManagement Загрузка state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve the Загрузка state when accessToken is null instead of showing the skeleton forever", async () => {
    render(<TagManagement accessToken={null} userID={null} userRole={null} />);
    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(mockTagListCall).not.toHaveBeenCalled();
  });

  it("should show the Загрузка state until the tag fetch settles", async () => {
    let resolveFetch: (value: Record<string, never>) => void = () => {};
    mockTagListCall.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<TagManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" />);
    expect(screen.getByText("Таблица-Загрузка")).toBeInTheDocument();

    resolveFetch({});
    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(mockTagListCall).toHaveBeenCalledWith("sk-test");
  });
});

describe("TagManagement Удалить flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagListCall.mockResolvedValue({});
  });

  it("should Подтвердить deletion through the shared DeleteResourceModal and call tagDeleteCall with the tag Название", async () => {
    const user = userEvent.setup();
    mockTagDeleteCall.mockResolvedValue({});
    render(<TagManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" />);
    await screen.findByText("Таблица-loaded");

    expect(screen.queryByText("Tag Информация")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("mock-Удалить-trigger"));

    expect(await screen.findByText("Tag Информация")).toBeInTheDocument();
    expect(screen.getByText("test-tag")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Удалить/i }));

    expect(mockTagDeleteCall).toHaveBeenCalledWith("sk-test", "test-tag");
  });

  it("should not call tagDeleteCall when the deletion is cancelled", async () => {
    const user = userEvent.setup();
    render(<TagManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" />);
    await screen.findByText("Таблица-loaded");

    await user.click(screen.getByTestId("mock-Удалить-trigger"));
    await screen.findByText("Tag Информация");

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(mockTagDeleteCall).not.toHaveBeenCalled();
  });
});
