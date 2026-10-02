import * as useAuthorizedModule from "@/app/(dashboard)/hooks/useАвторизовано";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ВсеРежимlsTab from "./ВсеРежимlsTab";
import { STATUS_COLUMN_ID, toServerSortПоле } from "./РежимlsTableColumns";

const mockModelDeleteCall = vi.fn().mockResolvedЗначение({});
const mockModelPatchUpdateCall = vi.fn().mockResolvedЗначение({});
vi.mock("@/components/networking", () => ({
  serverRootПуть: "/",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall: (...args: unknown[]) => mockModelDeleteCall(...args),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall: (...args: unknown[]) => mockModelPatchUpdateCall(...args),
}));

vi.mock("@/components/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_dashboard/РежимlSettingsModal/РежимlSettingsModal", () => ({
  default: function РежимlSettingsModalMock({ isVisible }: { isVisible: boolean }) {
    return isVisible ? <div data-testid="Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-settings-modal" /> : null;
  },
}));

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useRequestClient: () => ({ invalidateQueries: mockInvalidateQueries }) };
});

interface РежимlsInfoArgs {
  page?: number;
  size?: number;
  search?: string;
  teamId?: string;
  sortBy?: string;
  sortOrder?: string;
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName?: string;
  accessGroup?: string;
  wildcardOnly?: boolean;
}

const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls: РежимlsInfoArgs[] = [];
const mockRefetch = vi.fn();
let Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoРезультат: Record<string, unknown> = {};

type UseModelsInfoArgs = [
  page?: number,
  size?: number,
  search?: string,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId?: string,
  teamId?: string,
  sortBy?: string,
  sortOrder?: string,
  excludeAutoRouters?: boolean,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName?: string,
  accessGroup?: string,
  wildcardOnly?: boolean,
];

vi.mock("../../hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useModels", () => ({
  useModelsInfo: (...args: UseModelsInfoArgs) => {
    const [page, size, search, , teamId, sortBy, sortOrder, , Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName, accessGroup, wildcardOnly] = args;
    const call: РежимlsInfoArgs = {
      page,
      size,
      search,
      teamId,
      sortBy,
      sortOrder,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюName,
      accessGroup,
      wildcardOnly,
    };
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls.push(call);
    return { ...modelsInfoРезультат, refetch: mockRefetch };
  },
}));

vi.mock("../../hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useModelCostMap", () => ({
  useModelCostMap: () => ({ data: { "gpt-4": { litellm_provider: "openai" } }, isLoading: false, error: null }),
}));

const mockКоманды = [{ team_id: "team-1", team_alias: "Engineering" }];
vi.mock("../../hooks/teams/useКоманды", () => ({
  useКоманды: () => ({ data: mockКоманды, isLoading: false, error: null, refetch: vi.fn() }),
}));

const BASE_MODEL_INFO = {
  id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1",
  db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true,
  created_by: "user-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  team_id: "team-1",
  access_groups: [],
};

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "gpt-4",
  litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4", custom_llm_provider: "openai" },
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { ...BASE_MODEL_INFO, ...((overrides.model_info as Record<string, unknown>) ?? {}) },
});

const setModelsInfo = (rows: Record<string, unknown>[], totalCount = rows.length, isLoading = false) => {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoРезультат = {
    data: { data: rows, total_count: totalCount, current_page: 1, total_pages: 1, size: 50 },
    isLoading,
    isFetching: false,
    error: null,
  };
};

const lastModelsInfoCall = (): РежимlsInfoArgs => Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls[Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls.length - 1];

const SEARCH_SETTLE_MS = 400;

const MOCK_AUTHORIZED = {
  isLoading: false,
  isАвторизовано: true,
  token: "mock-token",
  accessТокен: "mock-access-token",
  userId: "user-123",
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
  selectedModelGroup: "all",
  setSelectedModelGroup: mockSetSelectedModelGroup,
  availableModelGroups: ["gpt-4", "gpt-3.5-turbo"],
  availableModelAccessGroups: ["sales-team"],
  setSelectedModelId: mockSetSelectedModelId,
  setSelectedTeamId: mockSetSelectedTeamId,
};

describe("ВсеРежимlsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls.length = 0;
    setModelsInfo([makeRow()]);
    vi.spyOn(useAuthorizedModule, "default").mockReturnЗначение(MOCK_AUTHORIZED);
  });

  it("renders the fetched Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs and the server row count", async () => {
    setModelsInfo([makeRow()], 137);
    render(<ВсеРежимlsTab {...defaultProps} />);

    expect(await screen.findByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-50 из 137");
  });

  it("does not re-query after the mount-time debounced search settles unchanged", async () => {
    render(<ВсеРежимlsTab {...defaultProps} />);
    const callsAfterMount = Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls.length;

    await new Promise((resolve) => setВремявыход(resolve, SEARCH_SETTLE_MS));

    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsInfoCalls.length).toBe(callsAfterMount);
  });

  it("shows the empty state when the proxy returns no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    setModelsInfo([], 0);
    render(<ВсеРежимlsTab {...defaultProps} />);

    expect(screen.getByText("Модели не найдены")).toBeInTheDocument();
  });

  it("shows the loading skeleton while the first page is in flight", () => {
    setModelsInfo([], 0, true);
    render(<ВсеРежимlsTab {...defaultProps} />);

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
    expect(screen.queryByText("Модели не найдены")).not.toBeInTheDocument();
  });

  describe("server sort contract", () => {
    const sortHeader = (columnId: string): HTMLElement => screen.getByTestId(`sort-header-${columnId}`);

    const expectIndicator = async (columnId: string, state: "asc" | "desc" | "none") => {
      await waitFor(() => {
        expect(sortHeader(columnId).querySelector(`[data-sort-indicator="${state}"]`)).not.toBeNull();
      });
    };

    const cases: [string, string, string, "asc" | "desc"][] = [
      ["Режимl Информация", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name", "asc"],
      ["Автор", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_created_by", "created_at", "asc"],
      ["Обновлён At", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at", "updated_at", "asc"],
      ["Стоимостьs", "input_cost", "costs", "desc"],
    ];

    it.each(cases)("sorts %s using the server field %s", async (_label, columnId, serverПоле, firstDirection) => {
      const user = userEvent.setup();
      render(<ВсеРежимlsTab {...defaultProps} />);

      await user.click(sortHeader(columnId));
      await expectIndicator(columnId, firstDirection);

      expect(lastModelsInfoCall().sortBy).toBe(serverПоле);
      expect(lastModelsInfoCall().sortOrder).toBe(firstDirection);
    });

    it("maps the hidden Источник column to the server field status", () => {
      expect(toServerSortПоле(STATUS_COLUMN_ID)).toBe("status");
    });

    it("cycles a sorted column back to unsorted", async () => {
      const user = userEvent.setup();
      render(<ВсеРежимlsTab {...defaultProps} />);

      await user.click(sortHeader("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at"));
      await expectIndicator("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at", "asc");
      expect(lastModelsInfoCall().sortOrder).toBe("asc");

      await user.click(sortHeader("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at"));
      await expectIndicator("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at", "desc");
      expect(lastModelsInfoCall().sortOrder).toBe("desc");

      await user.click(sortHeader("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at"));
      await expectIndicator("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_updated_at", "none");
      expect(lastModelsInfoCall().sortBy).toBeUndefined();
    });
  });

  it("queries the selected team and resets to the first page", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    expect(lastModelsInfoCall().teamId).toBeUndefined();

    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select"));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));

    await waitFor(() => {
      expect(lastModelsInfoCall().teamId).toBe("team-1");
    });
    expect(lastModelsInfoCall().page).toBe(1);
  });

  it("debounces the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name search into the server query", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    fireEvent.change(screen.getByTestId("datatable-search"), { target: { value: "claude" } });

    await waitFor(() => {
      expect(lastModelsInfoCall().search).toBe("claude");
    });
  });

  it("applies a public Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name filter through the drawer", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    await user.click(await screen.findByPlaceholderText("Фильтр по названию модели"));
    await user.click(await screen.findByRole("option", { name: "gpt-3.5-turbo" }));
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => {
      expect(mockSetSelectedModelGroup).toHaveBeenCalledWith("gpt-3.5-turbo");
    });
  });

  it("renders every row the server returned for the selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group so rows match the footer total", () => {
    setModelsInfo([makeRow(), { ...makeRow({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2" } }), Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "claude-opus" }], 2);
    render(<ВсеРежимlsTab {...defaultProps} selectedModelGroup="claude-opus" />);

    const table = screen.getByRole("table");
    expect(within(table).getByText("claude-opus")).toBeInTheDocument();
    expect(within(table).getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-2 из 2");
  });

  it("asks the server for wildcard deployments instead of hiding rows client-side", () => {
    setModelsInfo([makeRow(), { ...makeRow({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2" } }), Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "openai/*" }], 2);
    render(<ВсеРежимlsTab {...defaultProps} selectedModelGroup="wildcard" />);

    expect(lastModelsInfoCall().wildcardOnly).toBe(true);
    expect(within(screen.getByRole("table")).getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-2 из 2");
  });

  it("asks the server for the selected access group instead of hiding rows client-side", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);
    expect(lastModelsInfoCall().wildcardOnly).toBe(false);

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    await user.click(await screen.findByPlaceholderText("Фильтр по группе доступа модели"));
    await user.click(await screen.findByRole("option", { name: "sales-team" }));
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => expect(lastModelsInfoCall().accessGroup).toBe("sales-team"));
    expect(within(screen.getByRole("table")).getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-1 из 1");
  });

  it("asks the server for the exact selected Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group so deployments beyond the first page are found", () => {
    render(<ВсеРежимlsTab {...defaultProps} selectedModelGroup="claude-opus" />);

    expect(lastModelsInfoCall().modelName).toBe("claude-opus");
    expect(lastModelsInfoCall().search).toBeUndefined();
  });

  it.each(["all", "wildcard"])("sends no exact Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name for the %s pseudo group", (group) => {
    render(<ВсеРежимlsTab {...defaultProps} selectedModelGroup={group} />);

    expect(lastModelsInfoCall().modelName).toBeUndefined();
  });

  it("keeps the exact Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group alongside a typed search", async () => {
    render(<ВсеРежимlsTab {...defaultProps} selectedModelGroup="claude-opus" />);

    fireEvent.change(screen.getByPlaceholderText("Search Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию names…"), { target: { value: "opus" } });

    await waitFor(() => expect(lastModelsInfoCall().search).toBe("opus"));
    expect(lastModelsInfoCall().modelName).toBe("claude-opus");
  });

  it("resets search, filters, team and sorting from the drawer reset button", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} selectedModelGroup="gpt-4" />);

    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select"));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));
    await waitFor(() => expect(lastModelsInfoCall().teamId).toBe("team-1"));

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    await user.click(await screen.findByTestId("filter-drawer-reset"));

    expect(mockSetSelectedModelGroup).toHaveBeenCalledWith("all");
    await waitFor(() => {
      expect(lastModelsInfoCall().teamId).toBeUndefined();
    });
  });

  it("opens the delete modal from the row and deletes the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));
    expect(await screen.findByText("Удалить модель")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockModelDeleteCall).toHaveBeenCalledWith("mock-access-token", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
    });
  });

  it("pauses a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию through the row toggle", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalledWith("mock-access-token", { blocked: true }, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
    });
  });

  it("opens the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию settings modal from the toolbar", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    expect(screen.queryByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-settings-modal")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-settings-trigger"));
    expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-settings-modal")).toBeInTheDocument();
  });

  it("opens the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию detail view from the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию ID cell", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-id-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));

    expect(mockSetSelectedModelId).toHaveBeenCalledWith("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
  });

  it("opens the team detail view from the team ID cell", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-team-id-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));

    expect(mockSetSelectedTeamId).toHaveBeenCalledWith("team-1");
  });

  describe("virtual key hint", () => {
    it("explains personal key creation while viewing current team Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
      render(<ВсеРежимlsTab {...defaultProps} />);

      expect(screen.getByText(/create a Виртуальный ключ withвыход selecting a team/i)).toBeInTheDocument();
    });

    it("links the Виртуальные ключи through the migrated /ui route", () => {
      render(<ВсеРежимlsTab {...defaultProps} />);

      expect(screen.getByRole("link", { name: "Виртуальные ключи" })).toHaveAttribute("href", "/ui/api-keys");
    });

    it("links the team hint's Виртуальные ключи through the migrated /ui route", async () => {
      const user = userEvent.setup();
      render(<ВсеРежимlsTab {...defaultProps} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select"));
      await user.click(await screen.findByRole("option", { name: "Engineering" }));

      await screen.findByText(/select Team as "Engineering"/i);
      expect(screen.getByRole("link", { name: "Виртуальные ключи" })).toHaveAttribute("href", "/ui/api-keys");
    });

    it("names the selected team in the hint", async () => {
      const user = userEvent.setup();
      render(<ВсеРежимlsTab {...defaultProps} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select"));
      await user.click(await screen.findByRole("option", { name: "Engineering" }));

      expect(await screen.findByText(/select Team as "Engineering"/i)).toBeInTheDocument();
    });

    it("hides the hint when viewing all available Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
      const user = userEvent.setup();
      render(<ВсеРежимlsTab {...defaultProps} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-view-select"));
      await user.click(await screen.findByRole("option", { name: "Все доступные модели" }));

      await waitFor(() => {
        expect(screen.queryByText(/create a Виртуальный ключ/i)).not.toBeInTheDocument();
      });
    });
  });
});
