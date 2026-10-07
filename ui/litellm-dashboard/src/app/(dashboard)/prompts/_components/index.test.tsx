import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deletePromptCall, getPromptsList } from "@/components/networking";

import PromptsPanel from "./index";
import { chooseSelectOption } from "../../../../../tests/test-utils";

vi.mock("@/components/networking", () => ({
  getPromptsList: vi.fn(),
  deletePromptCall: vi.fn(),
}));

vi.mock("./PromptТаблица", () => ({
  __esModule: true,
  default: ({
    isLoading,
    onPromptClick,
    onDeleteClick,
  }: {
    isLoading: boolean;
    onPromptClick: (id: string, environment: string) => void;
    onDeleteClick: (id: string, name: string, environment: string) => void;
  }) => (
    <div data-testid="prompt-Таблица">
      {isLoading ? "Таблица-Загрузка" : "Таблица-loaded"}
      <button type="button" onClick={() => onPromptClick("prompt-1", "Стейджинг")}>
        row-open
      </button>
      <button type="button" onClick={() => onDeleteClick("prompt-1", "my-prompt", "Стейджинг")}>
        row-delete
      </button>
    </div>
  ),
}));

vi.mock("./prompt_info", () => ({
  __esModule: true,
  default: ({ initialEnvironment }: { initialEnvironment?: string }) => (
    <div>prompt-info-view:{initialEnvironment ?? "Нет"}</div>
  ),
}));
vi.mock("./add_prompt_form", () => ({
  __esModule: true,
  default: ({ visible }: { visible: boolean }) => (visible ? <div>add-prompt-form</div> : null),
}));
vi.mock("./prompt_editor_view", () => ({ __esModule: true, default: () => <div>prompt-editor-view</div> }));

const mockGetPromptsList = vi.mocked(getPromptsList);
const mockDeletePromptCall = vi.mocked(deletePromptCall);

const renderPanel = (userRole?: string) =>
  render(<PromptsPanel accessToken="sk-test" userRole={userRole ?? "Admin"} />);

describe("PromptsPanel Загрузка state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPromptsList.mockResolvedValue({ prompts: [] } as never);
  });

  it("should resolve the Загрузка state when accessToken is null instead of showing the skeleton forever", async () => {
    render(<PromptsPanel accessToken={null} />);
    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(mockGetPromptsList).not.toHaveBeenCalled();
  });

  it("should show the Загрузка state until the prompt fetch settles", async () => {
    let resolveFetch: (value: { prompts: never[] }) => void = () => {};
    mockGetPromptsList.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as never,
    );
    render(<PromptsPanel accessToken="sk-test" userRole="Admin" />);
    expect(screen.getByText("Таблица-Загрузка")).toBeInTheDocument();

    resolveFetch({ prompts: [] });
    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(mockGetPromptsList).toHaveBeenCalledWith("sk-test", undefined);
  });
});

describe("PromptsPanel toolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPromptsList.mockResolvedValue({ prompts: [] } as never);
  });

  it("should offer both Создать Действия to a proxy admin", async () => {
    renderPanel("Admin");

    expect(await screen.findByRole("button", { name: /Добавить новый промпт/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /upload \.Файл промпта/i })).toBeEnabled();
  });

  it("should hide both Создать Действия from a read-only viewer", async () => {
    renderPanel("Admin Viewer");

    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Добавить новый промпт/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload \.Файл промпта/i })).not.toBeInTheDocument();
  });

  it("should open the editor view when the Добавить Действие is used", async () => {
    const user = userEvent.setup();
    renderPanel("Admin");

    await user.click(await screen.findByRole("button", { name: /Добавить новый промпт/i }));

    expect(screen.getByText("prompt-editor-view")).toBeInTheDocument();
    expect(screen.queryByTestId("prompt-Таблица")).not.toBeInTheDocument();
  });

  it("should open the upload form when the upload Действие is used", async () => {
    const user = userEvent.setup();
    renderPanel("Admin");

    expect(screen.queryByText("Добавить-prompt-form")).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /upload \.Файл промпта/i }));

    expect(screen.getByText("Добавить-prompt-form")).toBeInTheDocument();
  });

  it("should refetch scoped to the Окружение picked in the filter", async () => {
    const user = userEvent.setup();
    renderPanel("Admin");
    await screen.findByText("Таблица-loaded");

    expect(screen.getByText("Все Окружениеs")).toBeInTheDocument();

    await chooseSelectOption(user, screen.getByRole("combobox"), "Продакшен");

    await waitFor(() => expect(mockGetPromptsList).toHaveBeenLastCalledWith("sk-test", "Продакшен"));
  });

  it("should show the picked Окружение by label and clear Назад to the unfiltered list", async () => {
    // Base UI's exit animation never completes in jsdom, so the closing popup keeps
    // pointer-events: none and blocks the second open. The clicks still dispatch.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderPanel("Admin");
    await screen.findByText("Таблица-loaded");

    await chooseSelectOption(user, screen.getByRole("combobox"), "Продакшен");
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveTextContent("Продакшен"));

    await chooseSelectOption(user, screen.getByRole("combobox"), "Все Окружениеs");

    await waitFor(() => expect(screen.getByRole("combobox")).toHaveTextContent("Все Окружениеs"));
    await waitFor(() => expect(mockGetPromptsList).toHaveBeenLastCalledWith("sk-test", undefined));
  });
});

describe("PromptsPanel row navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPromptsList.mockResolvedValue({ prompts: [] } as never);
  });

  it("should open the info view preselected to the clicked row's Окружение", async () => {
    const user = userEvent.setup();
    renderPanel("Admin");

    await user.click(await screen.findByRole("button", { name: "row-open" }));

    expect(screen.getByText("prompt-info-view:Стейджинг")).toBeInTheDocument();
  });
});

describe("PromptsPanel Удалить confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPromptsList.mockResolvedValue({ prompts: [] } as never);
    mockDeletePromptCall.mockResolvedValue(undefined as never);
  });

  it("should not Удалить until the confirmation is accepted", async () => {
    const user = userEvent.setup();
    renderPanel("Admin");

    await user.click(await screen.findByRole("button", { name: "row-Удалить" }));

    expect(await screen.findByText(/the Стейджинг Скопировать of prompt: my-prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(mockDeletePromptCall).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^Удалить$/i }));

    await waitFor(() => expect(mockDeletePromptCall).toHaveBeenCalledWith("sk-test", "prompt-1", "Стейджинг"));
  });

  it("should abandon the Удалить when the confirmation is dismissed", async () => {
    const user = userEvent.setup();
    renderPanel("Admin");

    await user.click(await screen.findByRole("button", { name: "row-Удалить" }));
    await screen.findByText(/the Стейджинг Скопировать of prompt: my-prompt/i);

    await user.click(screen.getByRole("button", { name: /Отмена/i }));

    await waitFor(() => expect(screen.queryByText(/the Стейджинг Скопировать of prompt: my-prompt/i)).not.toBeInTheDocument());
    expect(mockDeletePromptCall).not.toHaveBeenCalled();
  });

  it("should keep the confirmation up while the Удалить Запрос is still in flight", async () => {
    const user = userEvent.setup();
    let finishDelete: () => void = () => {};
    mockDeletePromptCall.mockReturnValue(
      new Promise<void>((resolve) => {
        finishDelete = () => resolve();
      }) as never,
    );
    renderPanel("Admin");

    await user.click(await screen.findByRole("button", { name: "row-Удалить" }));
    await screen.findByText(/the Стейджинг Скопировать of prompt: my-prompt/i);
    await user.click(screen.getByRole("button", { name: /^Удалить$/i }));
    await waitFor(() => expect(mockDeletePromptCall).toHaveBeenCalledWith("sk-test", "prompt-1", "Стейджинг"));

    await user.keyboard("{Escape}");
    expect(screen.getByText(/the Стейджинг Скопировать of prompt: my-prompt/i)).toBeInTheDocument();

    finishDelete();
    await waitFor(() => expect(screen.queryByText(/the Стейджинг Скопировать of prompt: my-prompt/i)).not.toBeInTheDocument());
  });
});
