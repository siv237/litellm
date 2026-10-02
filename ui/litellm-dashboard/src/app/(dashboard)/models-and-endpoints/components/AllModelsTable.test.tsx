import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { РежимlData } from "@/components/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_dashboard/types";

import { ВсеРежимlsТаблица } from "./ВсеРежимlsТаблица";

const makeРежимl = (overrides: Partial<РежимlData> = {}): РежимlData =>
  ({
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "gpt-4-public",
    litellm_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "openai/gpt-4",
    provider: "openai",
    input_cost: 30 as unknown as number,
    выходput_cost: 60 as unknown as number,
    max_tokens: 8192,
    max_input_tokens: 8192,
    litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4" },
    cleanedLitellmParams: {},
    ...overrides,
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
      id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-03-04T00:00:00Z",
      created_by: "alice",
      team_id: "team-1",
      db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true,
      access_groups: null,
      ...(overrides.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info ?? {}),
    },
  }) as РежимlData;

const baseProps = {
  data: [makeРежимl()],
  rowCount: 1,
  isLoading: false,
  isRefreshing: false,
  onRefresh: vi.fn(),
  sorting: [],
  onSortingChange: vi.fn(),
  pagination: { pageIndex: 0, pageSize: 50 },
  onPaginationChange: vi.fn(),
  columnФильтры: [],
  onColumnФильтрыChange: vi.fn(),
  onResetФильтры: vi.fn(),
  searchЗначение: "",
  onSearchChange: vi.fn(),
  teamOptions: [
    { value: "personal", label: "Личная" },
    { value: "team-1", label: "Engineering" },
  ],
  selectedTeamЗначение: "personal",
  onTeamChange: vi.fn(),
  isLoadingКоманды: false,
  viewРежим: "current_team" as const,
  onViewРежимChange: vi.fn(),
  onOpenРежимlSettings: vi.fn(),
  availableРежимlGroups: ["gpt-4", "gpt-3.5-turbo"],
  availableРежимlAccessGroups: ["sales-team"],
  userRole: "Admin",
  userID: "alice",
  onРежимlIdClick: vi.fn(),
  onTeamIdClick: vi.fn(),
  onDeleteClick: vi.fn(),
  onTogglePauseClick: vi.fn(),
  pausingРежимlId: null,
};

const row = (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId: string): HTMLElement => {
  const element = document.queryВыбратьor(`[data-row-id="${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId}"]`);
  if (!(element instanceof HTMLElement)) {
    throw new Ошибка(`row ${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId} not rendered`);
  }
  return element;
};

describe("ВсеРежимlsТаблица", () => {
  it("renders the nine design columns and hides Источник behind the Columns menu", async () => {
    const user = userEvent.setup();
    render(<ВсеРежимlsТаблица {...baseProps} />);

    for (const header of [
      "ID модели",
      "Сведения о модели",
      "Учётные данные",
      "Создал",
      "Обновлено",
      "Стоимость",
      "ID команды",
      "Группа доступа модели",
      "Действия",
    ]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(header, "i") })).toBeInTheDocument();
    }

    expect(screen.queryByRole("columnheader", { name: /источник/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /^status$/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Модель из БД")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(screen.queryByRole("menuitemcheckbox", { name: /status/i })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /источник/i }));

    expect(await screen.findByRole("columnheader", { name: /источник/i })).toBeInTheDocument();
    expect(await screen.findByText("Модель из БД")).toBeInTheDocument();
  });

  it("opens the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию detail from the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию ID cell", async () => {
    const user = userEvent.setup();
    const onРежимlIdClick = vi.fn();
    render(<ВсеРежимlsТаблица {...baseProps} onРежимlIdClick={onРежимlIdClick} />);

    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-id-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));

    expect(onРежимlIdClick).toHaveBeenCalledWith("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
  });

  it("opens the team detail from the team ID cell", async () => {
    const user = userEvent.setup();
    const onTeamIdClick = vi.fn();
    render(<ВсеРежимlsТаблица {...baseProps} onTeamIdClick={onTeamIdClick} />);

    await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-team-id-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));

    expect(onTeamIdClick).toHaveBeenCalledWith("team-1");
  });

  it("shows a dash when the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию has no team", () => {
    render(
      <ВсеРежимlsТаблица {...baseProps} data={[makeРежимl({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { team_id: "" } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"] })]} />,
    );

    expect(within(row("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).getВсеByText("-").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-team-id-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).not.toBeInTheDocument();
  });

  it("renders the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name over the litellm Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name", () => {
    render(<ВсеРежимlsТаблица {...baseProps} />);

    const cell = screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-information-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
    expect(within(cell).getByText("gpt-4-public")).toBeInTheDocument();
    expect(within(cell).getByText("openai/gpt-4")).toBeInTheDocument();
  });

  it("renders a reusable credential by name and falls back to Manual", () => {
    const { rerender } = render(
      <ВсеРежимlsТаблица
        {...baseProps}
        data={[makeРежимl({ litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4", litellm_credential_name: "openai-prod" } })]}
      />,
    );
    expect(screen.getByText("openai-prod")).toBeInTheDocument();
    expect(screen.queryByText("Вручную")).not.toBeInTheDocument();

    rerender(<ВсеРежимlsТаблица {...baseProps} data={[makeРежимl()]} />);
    expect(screen.getByText("Вручную")).toBeInTheDocument();
  });

  it("shows 'Defined in config' for a config Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and the creator for a DB Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
    const { rerender } = render(<ВсеРежимlsТаблица {...baseProps} />);
    expect(screen.getByText("alice")).toBeInTheDocument();

    rerender(
      <ВсеРежимlsТаблица
        {...baseProps}
        data={[makeРежимl({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: false } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"] })]}
      />,
    );
    expect(screen.getByText("Задана в конфигурации")).toBeInTheDocument();
  });

  it("renders input and выходput costs and a dash when both are missing", () => {
    const { rerender } = render(<ВсеРежимlsТаблица {...baseProps} />);
    expect(screen.getByText("$30")).toBeInTheDocument();
    expect(screen.getByText("$60")).toBeInTheDocument();

    rerender(
      <ВсеРежимlsТаблица
        {...baseProps}
        data={[makeРежимl({ input_cost: null as unknown as number, выходput_cost: null as unknown as number })]}
      />,
    );
    expect(screen.queryByText(/^\$/)).not.toBeInTheDocument();
  });

  it("collapses extra access groups behind a +N more badge", () => {
    render(
      <ВсеРежимlsТаблица
        {...baseProps}
        data={[
          makeРежимl({
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { access_groups: ["sales-team", "eng-team", "growth"] } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"],
          }),
        ]}
      />,
    );

    expect(screen.getByText("sales-team")).toBeInTheDocument();
    expect(screen.getByText("+2 ещё")).toBeInTheDocument();
  });

  it("renders the toolbar divider centered rather than stretched to the top of the row", () => {
    const { container } = render(<ВсеРежимlsТаблица {...baseProps} />);

    const separators = container.queryВыбратьorВсе('[data-slot="separator"][data-orientation="vertical"]');
    expect(separators).toHaveLength(1);
    expect(separators[0].className).not.toMatch(/self-stretch/);
    expect(separators[0].className).toContain("data-vertical:self-center");
  });

  describe("pause / resume", () => {
    it("renders the toggle on for an active DB Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and off for a blocked one", () => {
      const { rerender } = render(<ВсеРежимlsТаблица {...baseProps} />);
      expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).toBeChecked();

      rerender(
        <ВсеРежимlsТаблица
          {...baseProps}
          data={[makeРежимl({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { blocked: true } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"] })]}
        />,
      );
      expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).not.toBeChecked();
    });

    it("pauses an active Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and resumes a blocked one", async () => {
      const user = userEvent.setup();
      const onTogglePauseClick = vi.fn();
      const { rerender } = render(<ВсеРежимlsТаблица {...baseProps} onTogglePauseClick={onTogglePauseClick} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));
      expect(onTogglePauseClick).toHaveBeenCalledWith("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", true);

      onTogglePauseClick.mockClear();
      rerender(
        <ВсеРежимlsТаблица
          {...baseProps}
          onTogglePauseClick={onTogglePauseClick}
          data={[makeРежимl({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { blocked: true } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"] })]}
        />,
      );

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));
      expect(onTogglePauseClick).toHaveBeenCalledWith("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", false);
    });

    it("does not let a non-admin toggle a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      const user = userEvent.setup();
      const onTogglePauseClick = vi.fn();
      render(<ВсеРежимlsТаблица {...baseProps} userRole="Internal User" onTogglePauseClick={onTogglePauseClick} />);

      const toggle = screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
      expect(toggle).toHaveAttribute("data-disabled");
      await user.click(toggle);
      expect(onTogglePauseClick).not.toHaveBeenCalled();
    });

    it("does not let anyone toggle a config Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      const user = userEvent.setup();
      const onTogglePauseClick = vi.fn();
      render(
        <ВсеРежимlsТаблица
          {...baseProps}
          onTogglePauseClick={onTogglePauseClick}
          data={[makeРежимl({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: false } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"] })]}
        />,
      );

      const toggle = screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
      expect(toggle).toHaveAttribute("data-disabled");
      await user.click(toggle);
      expect(onTogglePauseClick).not.toHaveBeenCalled();
    });

    it("replaces the toggle with a pending indicator while a PATCH is in flight", () => {
      render(<ВсеРежимlsТаблица {...baseProps} pausingРежимlId="Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1" />);

      expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-pending-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).toBeInTheDocument();
      expect(screen.queryByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-pause-toggle-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1")).not.toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("lets an admin delete a DB Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      const user = userEvent.setup();
      const onDeleteClick = vi.fn();
      render(<ВсеРежимlsТаблица {...baseProps} userID="someone-else" onDeleteClick={onDeleteClick} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));
      expect(onDeleteClick).toHaveBeenCalledWith("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
    });

    it("lets the creator delete their own DB Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      const user = userEvent.setup();
      const onDeleteClick = vi.fn();
      render(<ВсеРежимlsТаблица {...baseProps} userRole="Internal User" userID="alice" onDeleteClick={onDeleteClick} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1"));
      expect(onDeleteClick).toHaveBeenCalledWith("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
    });

    it("blocks deleting a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию the user did not create", async () => {
      const user = userEvent.setup();
      const onDeleteClick = vi.fn();
      render(<ВсеРежимlsТаблица {...baseProps} userRole="Internal User" userID="bob" onDeleteClick={onDeleteClick} />);

      const deleteButton = screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
      expect(deleteButton).toBeDisabled();
      await user.click(deleteButton);
      expect(onDeleteClick).not.toHaveBeenCalled();
    });

    it("blocks deleting a config Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      const user = userEvent.setup();
      const onDeleteClick = vi.fn();
      render(
        <ВсеРежимlsТаблица
          {...baseProps}
          onDeleteClick={onDeleteClick}
          data={[makeРежимl({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: false } as РежимlData["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info"] })]}
        />,
      );

      const deleteButton = screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1");
      expect(deleteButton).toBeDisabled();
      await user.click(deleteButton);
      expect(onDeleteClick).not.toHaveBeenCalled();
    });
  });

  describe("toolbar", () => {
    it("wires search, refresh, team, view and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию settings", async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();
      const onRefresh = vi.fn();
      const onOpenРежимlSettings = vi.fn();
      render(
        <ВсеРежимlsТаблица
          {...baseProps}
          onSearchChange={onSearchChange}
          onRefresh={onRefresh}
          onOpenРежимlSettings={onOpenРежимlSettings}
        />,
      );

      fireEvent.change(screen.getByTestId("datatable-search"), { target: { value: "gpt" } });
      expect(onSearchChange).toHaveBeenCalled();

      await user.click(screen.getByTestId("datatable-refresh"));
      expect(onRefresh).toHaveBeenCalled();

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-settings-trigger"));
      expect(onOpenРежимlSettings).toHaveBeenCalled();

      expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select")).toHaveTextContent("Личная");
      expect(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-view-select")).toHaveTextContent("Модели текущей команды");
    });

    it("switches the current team", async () => {
      const user = userEvent.setup();
      const onTeamChange = vi.fn();
      render(<ВсеРежимlsТаблица {...baseProps} onTeamChange={onTeamChange} />);

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select"));
      await user.click(await screen.findByRole("option", { name: "Engineering" }));

      expect(onTeamChange).toHaveBeenCalledWith("team-1");
    });

    it("truncates long team options instead of clipping them at the popup edge", async () => {
      const user = userEvent.setup();
      const longLabel = "db29687d-0ca2-4bbe-a0f1-9c5f0f7c2a11";
      render(
        <ВсеРежимlsТаблица
          {...baseProps}
          teamOptions={[
            { value: "personal", label: "Личная" },
            { value: "team-long", label: longLabel },
          ]}
        />,
      );

      await user.click(screen.getByTestId("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-team-select"));

      const option = await screen.findByRole("option", { name: longLabel });
      const label = option.queryВыбратьor("[data-slot='select-item-label']");

      expect(label).not.toBeNull();
      expect(label).toHaveClass("truncate");
      expect(label).toHaveAttribute("title", longLabel);
      expect(option).toHaveClass("[&>div]:min-w-0");
    });

    it("runs the full reset from the filter drawer", async () => {
      const user = userEvent.setup();
      const onResetФильтры = vi.fn();
      render(<ВсеРежимlsТаблица {...baseProps} onResetФильтры={onResetФильтры} />);

      await user.click(screen.getByTestId("datatable-filters-trigger"));
      await user.click(await screen.findByTestId("filter-drawer-reset"));

      expect(onResetФильтры).toHaveBeenCalled();
    });

    it("renders active filters as removable chips", async () => {
      const user = userEvent.setup();
      const onColumnФильтрыChange = vi.fn();
      render(
        <ВсеРежимlsТаблица
          {...baseProps}
          columnФильтры={[{ id: "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name", value: "wildcard" }]}
          onColumnФильтрыChange={onColumnФильтрыChange}
        />,
      );

      const chip = screen.getByTestId("filter-chip-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name");
      expect(chip).toHaveTextContent("Публичное название модели");
      expect(chip).toHaveTextContent("Модели с маской (*)");

      await user.click(screen.getByTestId("filter-chip-remove-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name"));
      expect(onColumnФильтрыChange).toHaveBeenCalled();
    });
  });

  it("shows the server row count in the pagination footer", () => {
    render(<ВсеРежимlsТаблица {...baseProps} rowCount={137} />);

    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Показано 1-50 из 137");
  });

  it("shows the empty state when there are no Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    render(<ВсеРежимlsТаблица {...baseProps} data={[]} rowCount={0} />);

    expect(screen.getByText("Модели не найдены")).toBeInTheDocument();
  });
});
