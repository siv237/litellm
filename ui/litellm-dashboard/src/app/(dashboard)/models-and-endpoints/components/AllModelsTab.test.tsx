import * as useAuthorizedModule from "@/app/(dashboard)/hooks/useAuthorized";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AllModelsTab from "./AllModelsTab";
import { STATUS_COLUMN_ID, toServerSortField } from "./ModelsTableColumns";

const mockModelDeleteCall = vi.fn().mockResolvedValue({});
const mockModelPatchUpdateCall = vi.fn().mockResolvedValue({});
vi.mock("@/components/networking", () => ({
  serverRootPath: "/",
  modelDeleteCall: (...args: unknown[]) => mockModelDeleteCall(...args),
  modelPatchUpdateCall: (...args: unknown[]) => mockModelPatchUpdateCall(...args),
}));

vi.mock("@/components/model_dashboard/РежимlSettingsModal/РежимlSettingsModal", () => ({
  default: function ModelSettingsModalMock({ isVisible }: { isVisible: boolean }) {
    return isVisible ? <div data-testid="Модель-settings-modal" /> : null;
  },
}));

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }) };
});

interface ModelsInfoArgs {
  page?: number;
  size?: number;
  search?: string;
  teamId?: string;
  sortBy?: string;
  sortOrder?: string;
  modelName?: string;
  accessGroup?: string;
  wildcardOnly?: boolean;
}

const modelsInfoCalls: ModelsInfoArgs[] = [];
const mockRefetch = vi.fn();
let modelsInfoResult: Record<string, unknown> = {};

type UseModelsInfoArgs = [
  page?: number,
  size?: number,
  search?: string,
  modelId?: string,
  teamId?: string,
  sortBy?: string,
  sortOrder?: string,
  excludeAutoRouters?: boolean,
  modelName?: string,
  accessGroup?: string,
  wildcardOnly?: boolean,
];

vi.mock("../../hooks/Модели/useРежимls", () => ({
  useModelsInfo: (...args: UseModelsInfoArgs) => {
    const [page, size, search, , teamId, sortBy, sortOrder, , modelName, accessGroup, wildcardOnly] = args;
    const call: ModelsInfoArgs = {
      page,
      size,
      search,
      teamId,
      sortBy,
      sortOrder,
      modelName,
      accessGroup,
      wildcardOnly,
    };
    modelsInfoCalls.push(call);
    return { ...modelsInfoResult, refetch: mockRefetch };
  },
}));

vi.mock("../../hooks/Модели/useРежимlСтоимостьMap", () => ({
  useModelCostMap: () => ({ data: { "gpt-4": { litellm_provider: "openai" } }, isLoading: false, error: null }),
}));

const mockTeams = [{ team_id: "Команда-1", team_alias: "Engineering" }];
vi.mock("../../hooks/Команды/useКоманды", () => ({
  useTeams: () => ({ data: mockTeams, isLoading: false, error: null, refetch: vi.fn() }),
}));

const BASE_MODEL_INFO = {
  id: "Модель-1",
  db_model: true,
  created_by: "Пользователь-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  team_id: "Команда-1",
  access_groups: [],
};

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  model_name: "gpt-4",
  litellm_params: { model: "openai/gpt-4", custom_llm_provider: "openai" },
  model_info: { ...BASE_MODEL_INFO, ...((overrides.model_info as Record<string, unknown>) ?? {}) },
});

const setModelsInfo = (rows: Record<string, unknown>[], totalCount = rows.length, isLoading = false) => {
  modelsInfoResult = {
    data: { data: rows, total_count: totalCount, current_page: 1, total_pages: 1, size: 50 },
    isLoading,
    isFetching: false,
    error: null,
  };
};

const lastModelsInfoCall = (): ModelsInfoArgs => modelsInfoCalls[modelsInfoCalls.length - 1];

const SEARCH_SETTLE_MS = 400;

const MOCK_AUTHORIZED = {
  isLoading: false,
  isAuthorized: true,
  token: "mock-Токен",
  accessToken: "mock-access-Токен",
  userId: "Пользователь-123",
  userEmail: "test@example.com",
  userRole: "Admin",
  premiumUser: true,
  disabledPersonalKeyCreation: false,
  showSSOBanner: false,
};

const mockSetSelectedModelGroup = vi.fn();
const mockSetSelectedModelId = vi.fn();
const mockSetSelectedTeamId = vi.fn();

const defaultProps = {
  selectedModelGroup: "Все",
  setSelectedModelGroup: mockSetSelectedModelGroup,
  availableModelGroups: ["gpt-4", "gpt-3.5-turbo"],
  availableModelAccessGroups: ["sales-Команда"],
  setSelectedModelId: mockSetSelectedModelId,
  setSelectedTeamId: mockSetSelectedTeamId,
};

describe("ВсеРежимlsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modelsInfoCalls.length = 0;
    setModelsInfo([makeRow()]);
    vi.spyOn(useAuthorizedModule, "default").mockReturnValue(MOCK_AUTHORIZED);
  });

  it("renders the fetched Модели and the server row count", async () => {
    setModelsInfo([makeRow()], 137);
    render(<AllModelsTab {...defaultProps} />);

    expect(await screen.findByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-50 из 137");
  });

  it("does not re-query after the mount-Время debounced Поиск settles unchanged", async () => {
    render(<AllModelsTab {...defaultProps} />);
    const callsAfterMount = modelsInfoCalls.length;

    await new Promise((resolve) => setTimeout(resolve, SEARCH_SETTLE_MS));

    expect(modelsInfoCalls.length).toBe(callsAfterMount);
  });

  it("shows the empty state when the proxy returns Нет Модели", () => {
    setModelsInfo([], 0);
    render(<AllModelsTab {...defaultProps} />);

    expect(screen.getByText("Модели не найдены")).toBeInTheDocument();
  });

  it("shows the Загрузка skeleton while the first page is in flight", () => {
    setModelsInfo([], 0, true);
    render(<AllModelsTab {...defaultProps} />);

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
    expect(screen.queryByText("Модели не найдены")).not.toBeInTheDocument();
  });

  describe("server sort contract", () => {
    const sortHeader = (columnId: string): HTMLElement => screen.getByTestId(`sort-header-${columnId}`);

    const expectIndicator = async (columnId: string, state: "asc" | "desc" | "Нет") => {
      await waitFor(() => {
        expect(sortHeader(columnId).querySelector(`[data-sort-indicator="${state}"]`)).not.toBeNull();
      });
    };

    const cases: [string, string, string, "asc" | "desc"][] = [
      ["Режимl Информация", "model_name", "model_name", "asc"],
      ["Автор", "model_info_created_by", "created_at", "asc"],
      ["Обновлён At", "model_info_updated_at", "updated_at", "asc"],
      ["Стоимостьs", "input_cost", "costs", "desc"],
    ];

    it.each(cases)("sorts %s using the server Поле %s", async (_label, columnId, serverField, firstDirection) => {
      const user = userEvent.setup();
      render(<AllModelsTab {...defaultProps} />);

      await user.click(sortHeader(columnId));
      await expectIndicator(columnId, firstDirection);

      expect(lastModelsInfoCall().sortBy).toBe(serverField);
      expect(lastModelsInfoCall().sortOrder).toBe(firstDirection);
    });

    it("maps the hidden Источник column to the server Поле Статус", () => {
      expect(toServerSortField(STATUS_COLUMN_ID)).toBe("Статус");
    });

    it("cycles a sorted column Назад to unsorted", async () => {
      const user = userEvent.setup();
      render(<AllModelsTab {...defaultProps} />);

      await user.click(sortHeader("model_info_updated_at"));
      await expectIndicator("model_info_updated_at", "asc");
      expect(lastModelsInfoCall().sortOrder).toBe("asc");

      await user.click(sortHeader("model_info_updated_at"));
      await expectIndicator("model_info_updated_at", "desc");
      expect(lastModelsInfoCall().sortOrder).toBe("desc");

      await user.click(sortHeader("model_info_updated_at"));
      await expectIndicator("model_info_updated_at", "Нет");
      expect(lastModelsInfoCall().sortBy).toBeUndefined();
    });
  });

  it("queries the selected Команда and resets to the first page", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    expect(lastModelsInfoCall().teamId).toBeUndefined();

    await user.click(screen.getByTestId("Модели-Команда-Выбрать"));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));

    await waitFor(() => {
      expect(lastModelsInfoCall().teamId).toBe("Команда-1");
    });
    expect(lastModelsInfoCall().page).toBe(1);
  });

  it("debounces the Название модели Поиск into the server query", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    fireEvent.change(screen.getByTestId("datatable-Поиск"), { target: { value: "claude" } });

    await waitFor(() => {
      expect(lastModelsInfoCall().search).toBe("claude");
    });
  });

  it("applies a Публичное название модели filter through the drawer", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(screen.getByTestId("datatable-Фильтры-trigger"));
    await user.click(await screen.findByPlaceholderText("Фильтр по названию модели"));
    await user.click(await screen.findByRole("option", { name: "gpt-3.5-turbo" }));
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() => {
      expect(mockSetSelectedModelGroup).toHaveBeenCalledWith("gpt-3.5-turbo");
    });
  });

  it("renders every row the server returned for the selected Модель group so rows match the footer Всего", () => {
    setModelsInfo([makeRow(), { ...makeRow({ model_info: { id: "Модель-2" } }), model_name: "claude-opus" }], 2);
    render(<AllModelsTab {...defaultProps} selectedModelGroup="claude-opus" />);

    const table = screen.getByRole("Таблица");
    expect(within(table).getByText("claude-opus")).toBeInTheDocument();
    expect(within(table).getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-2 из 2");
  });

  it("asks the server for wildcard deployments instead of hiding rows client-side", () => {
    setModelsInfo([makeRow(), { ...makeRow({ model_info: { id: "Модель-2" } }), model_name: "openai/*" }], 2);
    render(<AllModelsTab {...defaultProps} selectedModelGroup="wildcard" />);

    expect(lastModelsInfoCall().wildcardOnly).toBe(true);
    expect(within(screen.getByRole("Таблица")).getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-2 из 2");
  });

  it("asks the server for the selected access group instead of hiding rows client-side", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);
    expect(lastModelsInfoCall().wildcardOnly).toBe(false);

    await user.click(screen.getByTestId("datatable-Фильтры-trigger"));
    await user.click(await screen.findByPlaceholderText("Фильтр по группе доступа модели"));
    await user.click(await screen.findByRole("option", { name: "sales-Команда" }));
    await user.click(screen.getByTestId("filter-drawer-Применить"));

    await waitFor(() => expect(lastModelsInfoCall().accessGroup).toBe("sales-Команда"));
    expect(within(screen.getByRole("Таблица")).getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-1 из 1");
  });

  it("asks the server for the exact selected Модель group so deployments beyond the first page are found", () => {
    render(<AllModelsTab {...defaultProps} selectedModelGroup="claude-opus" />);

    expect(lastModelsInfoCall().modelName).toBe("claude-opus");
    expect(lastModelsInfoCall().search).toBeUndefined();
  });

  it.each(["Все", "wildcard"])("sends Нет exact Название модели for the %s pseudo group", (group) => {
    render(<AllModelsTab {...defaultProps} selectedModelGroup={group} />);

    expect(lastModelsInfoCall().modelName).toBeUndefined();
  });

  it("keeps the exact Модель group alongside a typed Поиск", async () => {
    render(<AllModelsTab {...defaultProps} selectedModelGroup="claude-opus" />);

    fireEvent.change(screen.getByPlaceholderText("Поиск Модель names…"), { target: { value: "opus" } });

    await waitFor(() => expect(lastModelsInfoCall().search).toBe("opus"));
    expect(lastModelsInfoCall().modelName).toBe("claude-opus");
  });

  it("resets Поиск, Фильтры, Команда and sorting from the drawer Сброс button", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} selectedModelGroup="gpt-4" />);

    await user.click(screen.getByTestId("Модели-Команда-Выбрать"));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));
    await waitFor(() => expect(lastModelsInfoCall().teamId).toBe("Команда-1"));

    await user.click(screen.getByTestId("datatable-Фильтры-trigger"));
    await user.click(await screen.findByTestId("filter-drawer-Сброс"));

    expect(mockSetSelectedModelGroup).toHaveBeenCalledWith("Все");
    await waitFor(() => {
      expect(lastModelsInfoCall().teamId).toBeUndefined();
    });
  });

  it("opens the Удалить modal from the row and deletes the Модель", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Модель-Удалить-Модель-1"));
    expect(await screen.findByText("Удалить модель")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Удалить$/i }));

    await waitFor(() => {
      expect(mockModelDeleteCall).toHaveBeenCalledWith("mock-access-Токен", "Модель-1");
    });
  });

  it("pauses a Модель through the row toggle", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Модель-pause-toggle-Модель-1"));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalledWith("mock-access-Токен", { blocked: true }, "Модель-1");
    });
  });

  it("opens the Модель settings modal from the toolbar", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    expect(screen.queryByTestId("Модель-settings-modal")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("Модели-settings-trigger"));
    expect(screen.getByTestId("Модель-settings-modal")).toBeInTheDocument();
  });

  it("opens the Модель detail view from the ID модели cell", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Модель-id-Модель-1"));

    expect(mockSetSelectedModelId).toHaveBeenCalledWith("Модель-1");
  });

  it("opens the Команда detail view from the ID команды cell", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Модель-Команда-id-Модель-1"));

    expect(mockSetSelectedTeamId).toHaveBeenCalledWith("Команда-1");
  });

  describe("Виртуальный ключ hint", () => {
    it("explains Личная Ключ creation while viewing current Команда Модели", () => {
      render(<AllModelsTab {...defaultProps} />);

      expect(screen.getByText(/Создать a Виртуальный ключ without selecting a Команда/i)).toBeInTheDocument();
    });

    it("links the Виртуальные ключи through the migrated /ui route", () => {
      render(<AllModelsTab {...defaultProps} />);

      expect(screen.getByRole("link", { name: "Виртуальные ключи" })).toHaveAttribute("href", "/ui/api-Ключи");
    });

    it("links the Команда hint's Виртуальные ключи through the migrated /ui route", async () => {
      const user = userEvent.setup();
      render(<AllModelsTab {...defaultProps} />);

      await user.click(screen.getByTestId("Модели-Команда-Выбрать"));
      await user.click(await screen.findByRole("option", { name: "Engineering" }));

      await screen.findByText(/Выбрать Команда as "Engineering"/i);
      expect(screen.getByRole("link", { name: "Виртуальные ключи" })).toHaveAttribute("href", "/ui/api-Ключи");
    });

    it("names the selected Команда in the hint", async () => {
      const user = userEvent.setup();
      render(<AllModelsTab {...defaultProps} />);

      await user.click(screen.getByTestId("Модели-Команда-Выбрать"));
      await user.click(await screen.findByRole("option", { name: "Engineering" }));

      expect(await screen.findByText(/Выбрать Команда as "Engineering"/i)).toBeInTheDocument();
    });

    it("hides the hint when viewing Все available Модели", async () => {
      const user = userEvent.setup();
      render(<AllModelsTab {...defaultProps} />);

      await user.click(screen.getByTestId("Модели-view-Выбрать"));
      await user.click(await screen.findByRole("option", { name: "Все доступные модели" }));

      await waitFor(() => {
        expect(screen.queryByText(/Создать a Виртуальный ключ/i)).not.toBeInTheDocument();
      });
    });
  });
});
