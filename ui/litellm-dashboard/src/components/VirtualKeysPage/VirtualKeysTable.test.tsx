import { screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { vi, it, expect, beforeEach, describe, Mock, MockedFunction } from "vitest";
import { chooseВыбратьOption, renderWithПровайдерs } from "../../../tests/test-utils";
import { VirtualКлючиТаблица } from "./VirtualКлючиТаблица";
import { KEY_TABLE_SORT_FIELDS } from "./keyТаблицаColumns";
import { КлючОтвет, Team } from "../key_team_helpers/key_list";
import { useКлючInfo } from "@/app/(dashboard)/hooks/keys/useКлючInfo";
import { КлючиОтвет, useКлючи } from "@/app/(dashboard)/hooks/keys/useКлючи";
import useКоманды from "@/app/(dashboard)/hooks/useКоманды";
import { regenerateКлючCall } from "../networking";

// Resolve debounced values synchronously so an applied filter lands in the useКлючи query within the test tick.
vi.mock("@tanstack/react-pacer/debouncer", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    useDebouncedЗначение: (value: unknown) => [value, { cancel: vi.fn(), flush: vi.fn() }],
    useDebouncedState: (initial: unknown) => {
      const [value, setЗначение] = React.useState(initial);
      return [value, setЗначение, { cancel: vi.fn(), flush: vi.fn() }];
    },
    useDebouncedCallback: (fn: (...args: unknown[]) => void) => fn,
    useDebouncer: (fn: (...args: unknown[]) => void) => ({ maybeExecute: fn, cancel: vi.fn(), flush: vi.fn() }),
  };
});

vi.mock("next/navigation", () => ({ useRвыходer: () => ({ push: vi.fn() }) }));

vi.mock("../networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../networking")>()),
  regenerateКлючCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: vi.fn(() => ({
    accessТокен: "test-token",
    userId: "test-user",
    userRole: "Admin",
    premiumUser: true,
    token: "test-token",
  })),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useКоманды", () => ({
  useВсеКоманды: vi.fn(() => ({
    data: [{ team_id: "team-1", team_alias: "Test Team" }],
    isLoading: false,
  })),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useКлючи", () => ({
  useКлючи: vi.fn(),
  keyКлючи: { lists: () => ["keys", "list"] },
}));

vi.mock("@/app/(dashboard)/hooks/keys/useКлючInfo", () => ({
  useКлючInfo: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useКоманды", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useОрганизацияs", () => ({
  useОрганизацияs: vi.fn().mockReturnЗначение({
    data: [
      {
        organization_id: "org-1",
        organization_alias: "Test Организация",
      },
    ],
  }),
}));

const mockКлюч: КлючОтвет = {
  token: "88a145505dd6e87e2ea166fcef1e4b53948dbdb32af6431dfd05ec06b571ee52",
  token_id: "key-1",
  key_name: "test-key",
  key_alias: "Test Псевдоним ключа",
  spend: 5.5,
  max_budget: 100,
  expires: "2999-12-31T23:59:59Z",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-3.5-turbo", "gpt-4"],
  aliases: {},
  config: {},
  user_id: "user-1",
  team_id: "team-1",
  project_id: null,
  max_parallel_requests: 10,
  metadata: {},
  tpm_limit: 1000,
  rpm_limit: 100,
  duration: "30d",
  budget_duration: "1m",
  budget_reset_at: "2024-12-01T00:00:00Z",
  allowed_cache_controls: [],
  allowed_rвыходes: [],
  permissions: {},
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_spend: { "gpt-3.5-turbo": 2.5, "gpt-4": 3.0 },
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_max_budget: { "gpt-3.5-turbo": 50, "gpt-4": 50 },
  soft_budget_cooldown: false,
  blocked: false,
  litellm_budget_table: {},
  organization_id: "org-1",
  created_at: "2024-11-01T10:00:00Z",
  created_by: "user-1",
  updated_at: "2024-11-15T10:00:00Z",
  last_active: "2024-11-20T14:30:00Z",
  team_spend: 5.5,
  team_alias: "Test Team",
  team_tpm_limit: 5000,
  team_rpm_limit: 500,
  team_max_budget: 500,
  team_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-3.5-turbo", "gpt-4"],
  team_blocked: false,
  soft_budget: 50,
  team_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_aliases: {},
  team_member_spend: 0,
  team_metadata: {},
  end_user_id: "end-user-1",
  end_user_tpm_limit: 100,
  end_user_rpm_limit: 10,
  end_user_max_budget: 10,
  last_refreshed_at: Date.now(),
  api_key: "88a145505dd6e87e2ea166fcef1e4b53948dbdb32af6431dfd05ec06b571ee52",
  user_role: "user",
  rpm_limit_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: {},
  tpm_limit_per_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: {},
  user_tpm_limit: 1000,
  user_rpm_limit: 100,
  user_email: "user@example.com",
  user: {
    user_email: "user@example.com",
    user_id: "user-1",
    user_alias: null,
  },
};

const mockTeam: Team = {
  team_id: "team-1",
  team_alias: "Test Team",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-3.5-turbo", "gpt-4"],
  max_budget: 500,
  budget_duration: "1m",
  tpm_limit: 5000,
  rpm_limit: 500,
  organization_id: "org-1",
  created_at: "2024-10-01T10:00:00Z",
  keys: [],
  members_with_roles: [],
  spend: 0,
};

const mockUseКлючи = useКлючи as MockedFunction<typeof useКлючи>;
const mockUseКоманды = useКоманды as MockedFunction<typeof useКоманды>;
const mockUseКлючInfo = useКлючInfo as MockedFunction<typeof useКлючInfo>;

const keyInfoРезультат = (data: КлючОтвет | undefined, isОшибка = false) =>
  ({ data, isОшибка }) as ReturnType<typeof useКлючInfo>;

const keysРезультат = (keys: КлючОтвет[], data: Partial<КлючиОтвет> = {}, extra: Record<string, unknown> = {}) =>
  ({
    data: {
      keys,
      total_count: keys.length,
      current_page: 1,
      total_pages: 1,
      ...data,
    } as КлючиОтвет,
    isPending: false,
    isFetching: false,
    isОшибка: false,
    refetch: vi.fn(),
    ...extra,
  }) as any;

const openФильтры = () => fireEvent.click(screen.getByRole("button", { name: "Фильтры" }));

const lastSearchParam = (onUrlUpdate: Mock<OnUrlUpdateFunction>, name: string) =>
  onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get(name);

const lastКлючParam = (onUrlUpdate: Mock<OnUrlUpdateFunction>) => lastSearchParam(onUrlUpdate, "key");

const lastИсторияРежим = (onUrlUpdate: Mock<OnUrlUpdateFunction>) => onUrlUpdate.mock.calls.at(-1)?.[0].options.history;

beforeEach(() => {
  vi.clearВсеMocks();

  mockUseКлючи.mockReturnЗначение(keysРезультат([mockКлюч]));
  mockUseКлючInfo.mockReturnЗначение(keyInfoРезультат(undefined));

  mockUseКоманды.mockReturnЗначение({
    teams: [mockTeam],
    setКоманды: vi.fn(),
  });
});

it("should render VirtualКлючиТаблица component", () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />);
  expect(screen.getByText("Test Псевдоним ключа")).toBeInTheDocument();
});

it("shows the Бюджет Reset column by default", async () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />);
  await waitFor(() => {
    expect(screen.getByText("Бюджет Reset")).toBeInTheDocument();
  });
});

it("left-anchors the create-key CTA below the title, between the header and the table toolbar", () => {
  renderWithПровайдерs(<VirtualКлючиТаблица headerДействия={<button>Create New Ключ</button>} />);

  const heading = screen.getByRole("heading", { name: "Виртуальный ключs" });
  expect(screen.getByText("Every key that authenticates requests to the gateway.")).toBeInTheDocument();
  expect(document.queryВыбратьor(".lucide-key-round")).not.toBeNull();
  const ctas = screen.getВсеByRole("button", { name: "Create New Ключ" });
  expect(ctas).toHaveLength(1);
  const cta = ctas[0];
  const search = screen.getByPlaceholderText(/Search by key alias/);

  // The CTA follows the title row...
  expect(heading.compareDocumentПозиция(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // ...and precedes the table's search toolbar, so it sits in its own row above the table.
  expect(cta.compareDocumentПозиция(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("should display key information correctly", async () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await waitFor(() => {
    expect(screen.getByText("Test Псевдоним ключа")).toBeInTheDocument();
    expect(screen.getByText("Test Team")).toBeInTheDocument();
    expect(screen.getByText("$5.5000")).toBeInTheDocument();
    expect(screen.getByText("of $100")).toBeInTheDocument();
  });
});

it("should display user email correctly", async () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await waitFor(() => {
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });
});

it("shows the user alias over the email in the visible cell when both exist", async () => {
  mockUseКлючи.mockReturnЗначение(
    keysРезультат([{ ...mockКлюч, user: { user_id: "user-1", user_email: "user@example.com", user_alias: "The User" } }]),
  );

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  const row = (await screen.findByText("Test Псевдоним ключа")).closest("tr") as HTMLElement;
  expect(within(row).getByText("The User")).toBeInTheDocument();
  expect(within(row).queryByText("user@example.com")).not.toBeInTheDocument();
});

it("shows created_by_user alias over email in the Автор column when it is enabled", async () => {
  mockUseКлючи.mockReturnЗначение(
    keysРезультат([
      {
        ...mockКлюч,
        created_by: "some-uuid",
        created_by_user: { user_id: "some-uuid", user_email: "creator@example.com", user_alias: "The Creator" },
      },
    ]),
  );
  const user = userEvent.setup();
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  // Автор is hidden by default; turn it on via the Columns menu.
  await user.click(screen.getByRole("button", { name: "Columns" }));
  await user.click(await screen.findByText("Автор"));
  await user.keyboard("{Escape}");

  const row = (await screen.findByText("Test Псевдоним ключа")).closest("tr") as HTMLElement;
  expect(within(row).getByText("The Creator")).toBeInTheDocument();
  expect(within(row).queryByText("creator@example.com")).not.toBeInTheDocument();
});

it("should show a loading state on the initial load and hide the data", () => {
  mockUseКлючи.mockReturnЗначение(keysРезультат([], {}, { data: null, isPending: true, isFetching: true }));

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  expect(screen.getByText("Loading keys...")).toBeInTheDocument();
  expect(screen.getВсеByTestId("skeleton-row").length).toBeGreaterThan(0);
  expect(screen.queryByText("Test Псевдоним ключа")).not.toBeInTheDocument();
});

it("replaces the previous rows with the loading state while a new search is pending", () => {
  mockUseКлючи.mockReturnЗначение(keysРезультат([mockКлюч], {}, { isPlaceholderData: true, isFetching: true }));

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  expect(screen.getByText("Loading keys...")).toBeInTheDocument();
  expect(screen.queryByText("Test Псевдоним ключа")).not.toBeInTheDocument();
});

it("should show 'No keys found' message when the key list is empty", () => {
  mockUseКлючи.mockReturnЗначение(keysРезультат([]));

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  expect(screen.getByText("No keys found")).toBeInTheDocument();
});

it("collapses Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs beyond the visible limit into a '+N more' badge", () => {
  mockUseКлючи.mockReturnЗначение(
    keysРезультат([{ ...mockКлюч, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "claude-3", "claude-3-5-sonnet"] }]),
  );

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  expect(screen.getByText("+2 more")).toBeInTheDocument();
});

it("should render the redesigned table headers", () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  expect(screen.getByText("Ключ")).toBeInTheDocument();
  expect(screen.getByText("Team")).toBeInTheDocument();
  expect(screen.getByText("Режимls")).toBeInTheDocument();
  expect(screen.getByText("Расход", { selector: "[data-sort-field='spend']" })).toBeInTheDocument();
  expect(screen.getByText("Бюджет", { selector: "[data-sort-field='max_budget']" })).toBeInTheDocument();
});

it("sorts by the backend key_alias field (not the column label) when the Ключ header is clicked", async () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  const keyHeader = screen.getByText("Ключ").closest("button") as HTMLElement;
  fireEvent.click(keyHeader);

  await waitFor(() => {
    expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ sortBy: "key_alias" }));
  });
});

it("sorts by the backend max_budget field when 'Бюджет descending' is chosen from the Расход / Бюджет menu", async () => {
  const user = userEvent.setup();
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-spend"), "Бюджет descending", "menuitem");

  await waitFor(() => {
    expect(mockUseКлючи).toHaveBeenLastCalledWith(
      1,
      50,
      expect.objectContaining({ sortBy: "max_budget", sortOrder: "desc" }),
    );
  });
});

it("emphasizes the active field in the Расход / Бюджет header so the sorted column reads withвыход opening the menu", async () => {
  const user = userEvent.setup();
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-spend"), "Бюджет descending", "menuitem");

  await waitFor(() => {
    expect(screen.getByText("Бюджет", { selector: "[data-sort-field='max_budget']" })).toHaveClass("font-semibold");
  });
  expect(screen.getByText("Расход", { selector: "[data-sort-field='spend']" })).toHaveClass("text-muted-foreground");
});

it("sorts by spend ascending when 'Расход ascending' is chosen from the Расход / Бюджет menu", async () => {
  const user = userEvent.setup();
  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-spend"), "Расход ascending", "menuitem");

  await waitFor(() => {
    expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ sortBy: "spend", sortOrder: "asc" }));
  });
});

it("clicking the key cell deep-links via ?key=", async () => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  renderWithПровайдерs(<VirtualКлючиТаблица />, { onUrlUpdate });

  await waitFor(() => {
    expect(screen.getByText("Test Псевдоним ключа")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Test Псевдоним ключа"));

  await waitFor(() => {
    expect(lastКлючParam(onUrlUpdate)).toBe(mockКлюч.token);
  });
  expect(lastИсторияРежим(onUrlUpdate)).toBe("push");
});

it("renders КлючInfoView when the URL has ?key= for a key on the current page, withвыход refetching it", async () => {
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { key: mockКлюч.token }, onUrlUpdate });

  await waitFor(() => {
    expect(screen.getByText("Back to Ключи")).toBeInTheDocument();
  });
  expect(screen.queryByTestId("pagination-range")).not.toBeInTheDocument();
  expect(mockUseКлючInfo).toHaveBeenLastCalledWith(mockКлюч.token, { enabled: false });

  fireEvent.click(screen.getByText("Back to Ключи"));

  await waitFor(() => {
    expect(lastКлючParam(onUrlUpdate)).toBeNull();
  });
  expect(screen.getByTestId("pagination-range")).toBeInTheDocument();
});

it("repoints ?key= to the rotated hash once the regenerate dialog is dismissed", async () => {
  const user = userEvent.setup();
  vi.mocked(regenerateКлючCall).mockResolvedЗначение({
    key: "sk-rotated-plaintext",
    token: null,
    token_id: "rotated-hash-456",
  });
  const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
  renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { key: mockКлюч.token }, onUrlUpdate });

  await user.click(await screen.findByRole("button", { name: /regenerate key/i }));
  await user.click(await screen.findByRole("button", { name: /^Перегенерировать$/ }));
  expect(await screen.findВсеByText("sk-rotated-plaintext")).not.toHaveLength(0);
  expect(lastКлючParam(onUrlUpdate)).toBeUndefined();

  await user.click(screen.getВсеByRole("button", { name: "Close" })[0]);

  await waitFor(() => {
    expect(lastКлючParam(onUrlUpdate)).toBe("rotated-hash-456");
  });
  expect(lastИсторияРежим(onUrlUpdate)).toBe("replace");
});

it("fetches the key by id when the URL has ?key= for a key not in the loaded page", async () => {
  mockUseКлючInfo.mockReturnЗначение(
    keyInfoРезультат({ ...mockКлюч, token: "other-key-hash", key_alias: "Fetched Псевдоним ключа" }),
  );

  renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { key: "other-key-hash" } });

  await waitFor(() => {
    expect(screen.getByText("Back to Ключи")).toBeInTheDocument();
  });
  expect(mockUseКлючInfo).toHaveBeenLastCalledWith("other-key-hash", { enabled: true });
  expect(screen.getВсеByText("Fetched Псевдоним ключа").length).toBeGreaterThan(0);
});

it("shows a loading state while a deep-linked key is being fetched", () => {
  renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { key: "other-key-hash" } });

  expect(screen.getByText("Loading key...")).toBeInTheDocument();
  expect(screen.queryByTestId("pagination-range")).not.toBeInTheDocument();
});

it("shows 'Ключ not found' when the deep-linked key fails to load", async () => {
  mockUseКлючInfo.mockReturnЗначение(keyInfoРезультат(undefined, true));

  renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { key: "missing-key-hash" } });

  await waitFor(() => {
    expect(screen.getByText("Ключ not found")).toBeInTheDocument();
  });
});

it("should display 'Default Proxy Admin' for user_id when value is 'default_user_id'", async () => {
  mockUseКлючи.mockReturnЗначение(
    keysРезультат([
      {
        ...mockКлюч,
        user_id: "default_user_id",
        user_email: "",
        user: { user_id: "default_user_id", user_email: "", user_alias: null },
      },
    ]),
  );

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await waitFor(() => {
    expect(screen.getByText("Default Proxy Admin")).toBeInTheDocument();
  });
});

describe("entity links выход of the key rows", () => {
  const keyRow = async () => (await screen.findByText("Test Псевдоним ключа")).closest("tr") as HTMLElement;

  const enableColumn = async (user: ReturnType<typeof userEvent.setup>, title: string) => {
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await user.click(await screen.findByText(title));
    await user.keyboard("{Escape}");
  };

  const enableСозданByColumn = (user: ReturnType<typeof userEvent.setup>) => enableColumn(user, "Автор");

  it("points the User and Team cells at their detail pages", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />);

    const row = await keyRow();
    expect(within(row).getByRole("link", { name: "user@example.com" })).toHaveAttribute(
      "href",
      "/ui/users?user=user-1",
    );
    expect(within(row).getByRole("link", { name: "Test Team" })).toHaveAttribute("href", "/ui/teams?team=team-1");
  });

  it("points the Организация cell at the org's detail page", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, org_id: "org-1" }]));
    const user = userEvent.setup();
    renderWithПровайдерs(<VirtualКлючиТаблица />);
    await enableColumn(user, "Организация");

    const row = await keyRow();
    expect(within(row).getByRole("link", { name: "Test Организация" })).toHaveAttribute(
      "href",
      "/ui/organizations?org=org-1",
    );
  });

  it("points the Автор cell at the creator's detail page", async () => {
    mockUseКлючи.mockReturnЗначение(
      keysРезультат([
        {
          ...mockКлюч,
          created_by: "creator-1",
          created_by_user: { user_id: "creator-1", user_email: "creator@example.com", user_alias: "The Creator" },
        },
      ]),
    );
    const user = userEvent.setup();
    renderWithПровайдерs(<VirtualКлючиТаблица />);
    await enableСозданByColumn(user);

    const row = await keyRow();
    expect(within(row).getByRole("link", { name: "The Creator" })).toHaveAttribute("href", "/ui/users?user=creator-1");
  });

  it("leaves the default_user_id placeholder unlinked even once it resolves to a named user", async () => {
    const placeholder = { user_id: "default_user_id", user_email: "admin@example.com", user_alias: "Proxy Admin" };
    mockUseКлючи.mockReturnЗначение(
      keysРезультат([
        {
          ...mockКлюч,
          user_id: placeholder.user_id,
          user_email: placeholder.user_email,
          user: placeholder,
          created_by: placeholder.user_id,
          created_by_user: placeholder,
        },
      ]),
    );
    const user = userEvent.setup();
    renderWithПровайдерs(<VirtualКлючиТаблица />);
    await enableСозданByColumn(user);

    const row = await keyRow();
    expect(within(row).getВсеByText("Proxy Admin")).toHaveLength(2);
    expect(within(row).queryByRole("link", { name: "Proxy Admin" })).not.toBeInTheDocument();
  });

  it("leaves the litellm-dashboard session team unlinked", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, team_id: "litellm-dashboard" }]));
    renderWithПровайдерs(<VirtualКлючиТаблица />);

    const row = await keyRow();
    expect(within(row).getByText("litellm-dashboard")).toBeInTheDocument();
    expect(within(row).queryByRole("link", { name: "litellm-dashboard" })).not.toBeInTheDocument();
  });
});

it("should render table withвыход crashing when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs is null", async () => {
  mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: null as unknown as string[] }]));

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await waitFor(() => {
    expect(screen.getByText("Test Псевдоним ключа")).toBeInTheDocument();
    expect(screen.getByText("Все Proxy Режимls")).toBeInTheDocument();
  });
});

it("should display 'Unknown' for last_active when value is null", async () => {
  mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, last_active: null }]));

  renderWithПровайдерs(<VirtualКлючиТаблица />);

  await waitFor(() => {
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});

describe("server-side filtering – the LIT-4080 regression guard", () => {
  it("threads an applied ID пользователя filter into the useКлючи query so any refetch keeps it", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />);

    openФильтры();

    const userIdВход = await screen.findByPlaceholderText(/Введите ID пользователя/);
    fireEvent.change(userIdВход, { target: { value: "user-42" } });
    fireEvent.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ userID: "user-42" }));
    });
  });

  it("does not send filter params to useКлючи when no filter is active", () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />);

    const lastCall = mockUseКлючи.mock.calls[mockUseКлючи.mock.calls.length - 1];
    expect(lastCall[2] ?? {}).toMatchObject({ userID: undefined, teamID: undefined, keyHash: undefined });
  });

  it("drops the filter from the useКлючи query when it is cleared", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { onUrlUpdate });

    openФильтры();
    const userIdВход = await screen.findByPlaceholderText(/Введите ID пользователя/);
    fireEvent.change(userIdВход, { target: { value: "user-42" } });
    fireEvent.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ userID: "user-42" }));
    });
    // Let the filter reach the URL before clearing it: NuqsTestingAdapter runs
    // resetUrlUpdateQueueOnMount on every render, so a still-queued write can be
    // aborted by the re-render its own predecessor triggers.
    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "filter_user")).toBe("user-42");
    });

    fireEvent.click(screen.getByTestId("datatable-clear-filters"));

    await waitFor(() => {
      const lastCall = mockUseКлючи.mock.calls[mockUseКлючи.mock.calls.length - 1];
      expect((lastCall[2] ?? {}).userID).toBeUndefined();
    });
  });

  it("sends the search box as the combined alias-or-ID search rather than the key-alias filter", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />);

    fireEvent.change(screen.getByPlaceholderText(/Search by key alias or ID/), { target: { value: mockКлюч.token } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ search: mockКлюч.token }));
    });
    const lastOptions = mockUseКлючи.mock.calls.at(-1)?.[2];
    expect(lastOptions?.selectedКлючAlias).toBeUndefined();
    expect(lastOptions?.keyHash).toBeUndefined();
  });
});

describe("pagination display – total count comes from useКлючи", () => {
  it("shows total_count and page count from the useКлючи response", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([mockКлюч], { total_count: 509, total_pages: 11 }));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-50 of 509");
      expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 1 of 11");
    });
  });

  it("reflects a narrowed total when a filtered fetch returns fewer results", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([mockКлюч], { total_count: 1, total_pages: 1 }));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-1 of 1");
      expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 1 of 1");
    });
  });
});

describe("refresh button", () => {
  it("renders an enabled refresh control in the normal state", () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />);

    const refresh = screen.getByTestId("datatable-refresh");
    expect(refresh).toBeInTheDocument();
    expect(refresh).toBeEnabled();
  });

  it("disables the refresh control while a fetch is in flight but keeps data visible", () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([mockКлюч], {}, { isFetching: true }));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    expect(screen.getByTestId("datatable-refresh")).toBeDisabled();
    expect(screen.getByText("Test Псевдоним ключа")).toBeInTheDocument();
  });

  it("calls refetch when the refresh control is clicked", () => {
    const mockRefetch = vi.fn();
    mockUseКлючи.mockReturnЗначение(keysРезультат([mockКлюч], {}, { refetch: mockRefetch }));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    fireEvent.click(screen.getByTestId("datatable-refresh"));

    expect(mockRefetch).toHaveBeenCalledВремяs(1);
  });
});

describe("Status column reflects blocked / expiry / scim metadata", () => {
  it("renders Active for a non-blocked, unexpired key", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, blocked: false, metadata: {} }]));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    const tag = await screen.findByTestId(`key-status-${mockКлюч.token_id}`);
    expect(tag).toHaveTextContent("Active");

    const user = userEvent.setup();
    await user.hover(tag);
    await waitFor(() => {
      expect(screen.getByText(/not blocked and has not expired/i)).toBeInTheDocument();
    });
  });

  it("renders Expired when the expiry date has passed", async () => {
    mockUseКлючи.mockReturnЗначение(
      keysРезультат([{ ...mockКлюч, blocked: false, metadata: {}, expires: "2020-01-01T00:00:00Z" }]),
    );

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    await waitFor(() => {
      expect(screen.getByTestId(`key-status-${mockКлюч.token_id}`)).toHaveTextContent("Expired");
    });
  });

  it("renders Blocked when key.blocked is true", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, blocked: true, metadata: {} }]));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    await waitFor(() => {
      expect(screen.getByTestId(`key-status-${mockКлюч.token_id}`)).toHaveTextContent("Blocked");
    });
    expect(screen.queryByText(/Blocked by SCIM/i)).not.toBeInTheDocument();
  });

  it("marks a SCIM-blocked key with the SCIM tooltip reason", async () => {
    mockUseКлючи.mockReturnЗначение(keysРезультат([{ ...mockКлюч, blocked: true, metadata: { scim_blocked: true } }]));

    renderWithПровайдерs(<VirtualКлючиТаблица />);

    const tag = await screen.findByTestId(`key-status-${mockКлюч.token_id}`);
    expect(tag).toHaveTextContent("Blocked");

    const user = userEvent.setup();
    await user.hover(tag);
    await waitFor(() => {
      expect(screen.getByText(/Blocked by SCIM/i)).toBeInTheDocument();
    });
  });
});

describe("table state lives in the URL so it survives leaving and returning to the page", () => {
  it("restores the search term, sort and pagination from the URL on mount", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, {
      searchParams: { key_search: "prod", sort_by: "spend", sort_order: "asc", page: "3", page_size: "25" },
    });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(
        3,
        25,
        expect.objectContaining({ search: "prod", sortBy: "spend", sortOrder: "asc" }),
      );
    });
    expect(screen.getByPlaceholderText(/Search by key alias/)).toHaveЗначение("prod");
  });

  it("restores the drawer filters from the URL on mount", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { filter_team: "team-1", filter_user: "user-42" } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(
        1,
        50,
        expect.objectContaining({ teamID: "team-1", userID: "user-42" }),
      );
    });
    expect(screen.getByTestId("filter-chip-team_id")).toHaveTextContent("Test Team");
  });

  it("writes the search term to the URL", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { onUrlUpdate });

    fireEvent.change(screen.getByPlaceholderText(/Search by key alias/), { target: { value: "prod" } });

    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "key_search")).toBe("prod");
    });
  });

  it("writes the sort field and direction to the URL", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { onUrlUpdate });

    fireEvent.click(screen.getByRole("button", { name: "Ключ" }));

    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "sort_by")).toBe("key_alias");
    });
    expect(lastSearchParam(onUrlUpdate, "sort_order")).toBe("asc");
  });

  it("writes an applied drawer filter to the URL and clears it again", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { onUrlUpdate });

    openФильтры();
    fireEvent.change(await screen.findByPlaceholderText(/Введите ID пользователя/), { target: { value: "user-42" } });
    fireEvent.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "filter_user")).toBe("user-42");
    });

    fireEvent.click(screen.getByTestId("datatable-clear-filters"));

    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "filter_user")).toBeNull();
    });
    expect(screen.queryByTestId("filter-chip-user_id")).not.toBeInTheDocument();
  });

  it("returns to page 1 when the search term changes", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { page: "3" }, onUrlUpdate });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(3, 50, expect.anything());
    });

    fireEvent.change(screen.getByPlaceholderText(/Search by key alias/), { target: { value: "prod" } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ search: "prod" }));
    });
    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "page")).toBeNull();
    });
  });

  it("leaves the create-key deep link's team_id alone instead of filtering the list with it", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { create: "true", team_id: "team-1" } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ teamID: undefined }));
    });
    expect(screen.queryByTestId("filter-chip-team_id")).not.toBeInTheDocument();
  });

  it.each([
    ["0", 1],
    ["-3", 1],
  ])("clamps a hand-edited page of %s up to the first page", async (page, expected) => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { page } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(expected, 50, expect.anything());
    });
  });

  it.each([
    ["0", 1],
    ["1000", 100],
  ])("clamps a hand-edited page_size of %s into the range /key/list accepts", async (pageSize, expected) => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { page_size: pageSize } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, expected, expect.anything());
    });
  });

  it("trims whitespace off a filter that arrived from the URL", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { filter_user: "  user-42  " } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ userID: "user-42" }));
    });
  });

  it("falls back to the default sort when the URL names a column the table cannot sort by", async () => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { sort_by: "totally_unknown_field" } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(
        1,
        50,
        expect.objectContaining({ sortBy: "created_at", sortOrder: "desc" }),
      );
    });
    expect(screen.getByText("Test Псевдоним ключа")).toBeInTheDocument();
  });

  it.each(KEY_TABLE_SORT_FIELDS)("round-trips a %s sort from the URL", async (field) => {
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { sort_by: field, sort_order: "asc" } });

    await waitFor(() => {
      expect(mockUseКлючи).toHaveBeenLastCalledWith(1, 50, expect.objectContaining({ sortBy: field, sortOrder: "asc" }));
    });
  });

  it("clears sort_by from the URL when the Расход / Бюджет sort is reset", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { onUrlUpdate });

    await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-spend"), "Расход ascending", "menuitem");
    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "sort_by")).toBe("spend");
    });

    await chooseВыбратьOption(user, screen.getByTestId("sort-trigger-spend"), "Reset", "menuitem");

    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "sort_by")).toBeNull();
    });
    expect(lastSearchParam(onUrlUpdate, "sort_order")).toBeNull();
  });

  it("drops the search param back выход of the URL when the search box is cleared", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderWithПровайдерs(<VirtualКлючиТаблица />, { searchParams: { key_search: "prod" }, onUrlUpdate });

    fireEvent.change(screen.getByPlaceholderText(/Search by key alias/), { target: { value: "" } });

    await waitFor(() => {
      expect(lastSearchParam(onUrlUpdate, "key_search")).toBeNull();
    });
  });
});
