import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeВсе, describe, expect, it, vi } from "vitest";
import { ActivityМетрикаs, formatКлючLabel, processActivityData } from "./activity_metrics";
import { Team } from "./key_team_helpers/key_list";
import { Каждый деньData, КлючМетрикаWithМетаданные, РежимlActivityData } from "./ИспользованиеPage/types";

beforeВсе(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

// Panel order is a contract; which element the label lands in is not, so compare document order.
const precedes = (firstLabel: string, secondLabel: string): boolean => {
  const first = screen.getВсеByText(firstLabel)[0];
  const second = screen.getВсеByText(secondLabel)[0];
  return Boolean(first.compareDocumentПозиция(second) & Node.DOCUMENT_POSITION_FOLLOWING);
};

vi.mock("@/utils/dataUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/dataUtils")>();

  return {
    ...actual,
    formatNumberWithCommas: (value: number, decimals?: number) => value.toFixed(decimals || 0),
  };
});

vi.mock("@/utils/teamUtils", () => ({
  resolveTeamAliasFromTeamID: (teamID: string, teams: any[]) => {
    const team = teams.find((team) => team.team_id === teamID);
    return team ? team.team_alias : null;
  },
}));

const EMPTY_BREAKDOWN = {
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {},
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
  mcp_servers: {},
  providers: {},
  api_keys: {},
  entities: {},
};

const EMPTY_SPEND_METRICS = {
  spend: 0,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  api_requests: 0,
  successful_requests: 0,
  failed_requests: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

const MOCK_TEAMS: Team[] = [
  {
    team_id: "team1",
    team_alias: "Test Team 1",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    max_budget: null,
    budget_duration: null,
    tpm_limit: null,
    rpm_limit: null,
    organization_id: "org1",
    created_at: "2025-01-01",
    keys: [],
    members_with_roles: [],
    spend: 0,
  },
  {
    team_id: "team2",
    team_alias: "Test Team 2",
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
    max_budget: null,
    budget_duration: null,
    tpm_limit: null,
    rpm_limit: null,
    organization_id: "org2",
    created_at: "2025-01-01",
    keys: [],
    members_with_roles: [],
    spend: 0,
  },
];

const createMockКаждый деньData = (
  date: string,
  metrics: typeof EMPTY_SPEND_METRICS,
  breakdown: typeof EMPTY_BREAKDOWN,
): Каждый деньData => ({
  date,
  metrics,
  breakdown,
});

const createMockКлючМетрикаWithМетаданные = (
  metadata: { key_alias: string | null; team_id: string | null; user_email?: string | null },
  metrics: typeof EMPTY_SPEND_METRICS = EMPTY_SPEND_METRICS,
): КлючМетрикаWithМетаданные => ({
  metrics,
  metadata,
});

const createMockРежимlActivityData = (label: string, overrides: Partial<РежимlActivityData> = {}): РежимlActivityData => ({
  label,
  total_requests: 100,
  total_successful_requests: 95,
  total_failed_requests: 5,
  total_tokens: 50000,
  prompt_tokens: 30000,
  completion_tokens: 20000,
  total_spend: 100.5,
  total_cache_read_input_tokens: 1000,
  total_cache_creation_input_tokens: 500,
  top_api_keys: [],
  top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
  daily_data: [
    {
      date: "2025-01-01",
      metrics: {
        prompt_tokens: 30000,
        completion_tokens: 20000,
        total_tokens: 50000,
        api_requests: 100,
        spend: 100.5,
        successful_requests: 95,
        failed_requests: 5,
        cache_read_input_tokens: 1000,
        cache_creation_input_tokens: 500,
      },
    },
  ],
  ...overrides,
});

const GPT_35_MODEL_DATA: РежимlActivityData = {
  label: "GPT-3.5",
  total_requests: 50,
  total_successful_requests: 48,
  total_failed_requests: 2,
  total_tokens: 25000,
  prompt_tokens: 15000,
  completion_tokens: 10000,
  total_spend: 25.25,
  total_cache_read_input_tokens: 500,
  total_cache_creation_input_tokens: 250,
  top_api_keys: [],
  top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
  daily_data: [
    {
      date: "2025-01-01",
      metrics: {
        prompt_tokens: 15000,
        completion_tokens: 10000,
        total_tokens: 25000,
        api_requests: 50,
        spend: 25.25,
        successful_requests: 48,
        failed_requests: 2,
        cache_read_input_tokens: 500,
        cache_creation_input_tokens: 250,
      },
    },
  ],
};

describe("ActivityМетрикаs", () => {
  const mockРежимlМетрикаs: Record<string, РежимlActivityData> = {
    "gpt-4": createMockРежимlActivityData("GPT-4"),
  };

  it("should render", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.getByText("Overall Использование")).toBeInTheDocument();
  });

  it("should display prompt caching metrics when hidePromptCachingМетрикаs is false", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} hidePromptCachingМетрикаs={false} />);
    expect(screen.getByText("Prompt Caching Метрикаs")).toBeInTheDocument();
  });

  it("should hide prompt caching metrics when hidePromptCachingМетрикаs is true", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} hidePromptCachingМетрикаs={true} />);
    expect(screen.queryByText("Prompt Caching Метрикаs")).not.toBeInTheDocument();
  });

  it("should display overall usage summary metrics", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    const totalЗапросsElements = screen.getВсеByText("Всего запросов");
    expect(totalЗапросsElements.length).toBeGreaterThan(0);
    const totalSuccessfulElements = screen.getВсеByText("Total Успешных запросов");
    expect(totalSuccessfulElements.length).toBeGreaterThan(0);
    const totalТокенsElements = screen.getВсеByText("Всего токенов");
    expect(totalТокенsElements.length).toBeGreaterThan(0);
    const totalРасходElements = screen.getВсеByText("Общий расход");
    expect(totalРасходElements.length).toBeGreaterThan(0);
  });

  it("should display aggregated totals across all Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    const multipleРежимls: Record<string, РежимlActivityData> = {
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        total_requests: 100,
        total_spend: 100.5,
      },
      "gpt-3.5": GPT_35_MODEL_DATA,
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={multipleРежимls} />);
    const totalЗапросsElements = screen.getВсеByText("150");
    expect(totalЗапросsElements.length).toBeGreaterThan(0);
    const totalSuccessfulElements = screen.getВсеByText("143");
    expect(totalSuccessfulElements.length).toBeGreaterThan(0);
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию sections sorted by spend", () => {
    const multipleРежимls: Record<string, РежимlActivityData> = {
      "gpt-3.5": GPT_35_MODEL_DATA,
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        total_spend: 100.5,
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={multipleРежимls} />);
    expect(precedes("GPT-4", "GPT-3.5")).toBe(true);
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию summary cards with correct values", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    const requestElements = screen.getВсеByText("100");
    expect(requestElements.length).toBeGreaterThan(0);
    const successfulElements = screen.getВсеByText("95");
    expect(successfulElements.length).toBeGreaterThan(0);
    const tokenElements = screen.getВсеByText("50,000");
    expect(tokenElements.length).toBeGreaterThan(0);
  });

  it("should not display Top Виртуальный ключs section when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию has no top_api_keys", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.queryByText("Top Виртуальный ключs by Расход")).not.toBeInTheDocument();
  });

  it("should display top API keys section when present", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopКлючи: Record<string, РежимlActivityData> = {
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        top_api_keys: [
          {
            api_key: "key-123",
            key_alias: "Test Ключ",
            team_id: "team1",
            spend: 50.25,
            requests: 25,
            tokens: 12500,
          },
        ],
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopКлючи} />);
    expect(screen.getByText("Top Виртуальный ключs by Расход")).toBeInTheDocument();
    expect(screen.getByText("Test Ключ")).toBeInTheDocument();
  });

  it("should display API key hash when alias is missing", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopКлючи: Record<string, РежимlActivityData> = {
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        top_api_keys: [
          {
            api_key: "key-1234567890",
            key_alias: null,
            team_id: null,
            spend: 50.25,
            requests: 25,
            tokens: 12500,
          },
        ],
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopКлючи} />);
    expect(screen.getByText(/key-123456/)).toBeInTheDocument();
  });

  it("should display team information for top API keys", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopКлючи: Record<string, РежимlActivityData> = {
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        top_api_keys: [
          {
            api_key: "key-123",
            key_alias: "Test Ключ",
            team_id: "team1",
            spend: 50.25,
            requests: 25,
            tokens: 12500,
          },
        ],
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopКлючи} />);
    expect(screen.getByText(/Team: team1/)).toBeInTheDocument();
  });

  it("should display Режимl Использование when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию has top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopРежимls: Record<string, РежимlActivityData> = {
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [
          {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
            spend: 100.5,
            requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            tokens: 50000,
          },
        ],
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithTopРежимls} />);
    expect(screen.getByText("Режимl Использование").closest('[data-slot="card-title"]')).toBeInTheDocument();
  });

  it("should display Расход per day in Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию section", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.getByText("Расход per day")).toBeInTheDocument();
  });

  it("should display Запросs per day in Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию section", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.getByText("Запросs per day")).toBeInTheDocument();
  });

  it("should display Success vs Запросов с ошибкой in Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию section", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.getByText("Success vs Запросов с ошибкой")).toBeInTheDocument();
  });

  it("should sort empty string Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию key last in collapse order", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithEmptyКлюч: Record<string, РежимlActivityData> = {
      "gpt-4": { ...mockРежимlМетрикаs["gpt-4"] },
      "": {
        ...createMockРежимlActivityData(""),
        label: "Unknown",
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюsWithEmptyКлюч} />);
    expect(precedes("GPT-4", "Unknown")).toBe(true);
  });

  // A Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию section owns view-mode state, so collapsing one must not throw its subtree away.
  it("keeps a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию section mounted once it has been expanded", () => {
    const multipleРежимls: Record<string, РежимlActivityData> = {
      "gpt-3.5": GPT_35_MODEL_DATA,
      "gpt-4": { ...mockРежимlМетрикаs["gpt-4"], total_spend: 100.5 },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={multipleРежимls} />);

    // Only the highest-spend section is expanded initially, so only its body is mounted.
    const sectionsMounted = () => screen.getВсеByText("Расход per day").length;
    expect(sectionsMounted()).toBe(1);

    fireEvent.click(screen.getВсеByText("GPT-3.5")[0]);
    expect(sectionsMounted()).toBe(2);

    fireEvent.click(screen.getВсеByText("GPT-3.5")[0]);
    expect(sectionsMounted()).toBe(2);
  });

  it("should display average tokens per successful request", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    const avgТокенsElements = screen.getВсеByText(/avg per successful request/);
    expect(avgТокенsElements.length).toBeGreaterThan(0);
    expect(avgТокенsElements.some((el) => el.textContent?.includes("526"))).toBe(true);
  });

  it("should display average spend per successful request", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    const avgРасходElements = screen.getВсеByText(/per successful request/);
    expect(avgРасходElements.length).toBeGreaterThan(0);
    expect(avgРасходElements.some((el) => el.textContent?.includes("1.058"))).toBe(true);
  });

  it("should handle zero successful requests withвыход division error", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithZeroЗапросs: Record<string, РежимlActivityData> = {
      "gpt-4": {
        ...mockРежимlМетрикаs["gpt-4"],
        total_successful_requests: 0,
        total_tokens: 0,
        total_spend: 0,
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithZeroЗапросs} />);
    const zeroElements = screen.getВсеByText("0");
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it("should display prompt caching token counts when visible", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} hidePromptCachingМетрикаs={false} />);
    expect(screen.getByText(/Cache Read:.*tokens/)).toBeInTheDocument();
    expect(screen.getByText(/Cache Creation:.*tokens/)).toBeInTheDocument();
  });

  it("should display charts for tokens over time", () => {
    const { container } = render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.getByText("Всего токенов Over Время")).toBeInTheDocument();
    expect(container.queryВыбратьorВсе(".recharts-area").length).toBeGreaterThan(0);
  });

  it("should display charts for requests over time", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={mockРежимlМетрикаs} />);
    expect(screen.getByText("Всего запросов Over Время")).toBeInTheDocument();
  });

  it("should handle empty Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию metrics", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={{}} />);
    expect(screen.getByText("Overall Использование")).toBeInTheDocument();
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию label or fallback to Unknown Item", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithEmptyLabel: Record<string, РежимlActivityData> = {
      "": {
        ...mockРежимlМетрикаs["gpt-4"],
        label: "",
      },
    };

    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюWithEmptyLabel} />);
    expect(screen.getByText("Unknown Item")).toBeInTheDocument();
  });
});

describe("ActivityМетрикаs charts", () => {
  const twoDayРежимlМетрикаs: Record<string, РежимlActivityData> = {
    "gpt-4": createMockРежимlActivityData("GPT-4", {
      daily_data: [
        {
          date: "2025-01-01",
          metrics: {
            prompt_tokens: 30000,
            completion_tokens: 20000,
            total_tokens: 50000,
            api_requests: 100,
            spend: 100.5,
            successful_requests: 95,
            failed_requests: 5,
            cache_read_input_tokens: 1000,
            cache_creation_input_tokens: 500,
          },
        },
        {
          date: "2025-01-02",
          metrics: {
            prompt_tokens: 15000,
            completion_tokens: 10000,
            total_tokens: 25000,
            api_requests: 50,
            spend: 25.25,
            successful_requests: 48,
            failed_requests: 2,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 250,
          },
        },
      ],
    }),
  };

  const chartsOf = (container: HTMLElement) => Array.from(container.queryВыбратьorВсе('[data-slot="chart"]'));

  const areaStrokes = (chart: Element) =>
    Array.from(chart.queryВыбратьorВсе("path.recharts-area-curve")).map((path) => path.getAttribute("stroke"));

  const barFills = (chart: Element) =>
    Array.from(
      new Set(Array.from(chart.queryВыбратьorВсе("path.recharts-rectangle")).map((path) => path.getAttribute("fill"))),
    );

  const tickTexts = (chart: Element) =>
    Array.from(chart.queryВыбратьorВсе("text.recharts-cartesian-axis-tick-value")).map((tick) => tick.textContent ?? "");

  const chartTitled = (title: string): Element => {
    for (const titleElement of screen.getВсеByText(title)) {
      let node = titleElement.parentElement;
      while (node) {
        const charts = node.queryВыбратьorВсе('[data-slot="chart"]');
        if (charts.length === 1) return charts[0];
        if (charts.length > 1) break;
        node = node.parentElement;
      }
    }
    throw new Ошибка(`No chart card titled "${title}"`);
  };

  it("renders all seven chart sites as real recharts charts indexed by date", () => {
    const { container } = render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={twoDayРежимlМетрикаs} />);

    expect(chartsOf(container)).toHaveLength(7);
    expect(container.queryВыбратьorВсе(".recharts-bar")).toHaveLength(2);
    expect(container.queryВыбратьorВсе(".recharts-area")).toHaveLength(12);
    expect(screen.getВсеByText("2025-01-01").length).toBeGreaterThanOrEqual(7);
    expect(screen.getВсеByText("2025-01-02").length).toBeGreaterThanOrEqual(7);
  });

  it("shows the No data placeholder on both global charts when there is no usage data", () => {
    const { container } = render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={{}} />);

    expect(screen.getВсеByText("No data")).toHaveLength(2);
    expect(chartsOf(container)).toHaveLength(0);
  });

  it("drops only the prompt caching chart when hidePromptCachingМетрикаs is true", () => {
    const { container } = render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={twoDayРежимlМетрикаs} hidePromptCachingМетрикаs={true} />);

    expect(chartsOf(container)).toHaveLength(6);
    expect(container.queryВыбратьorВсе(".recharts-area")).toHaveLength(10);
  });

  it("maps the configured colors onto every series", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={twoDayРежимlМетрикаs} />);

    expect(areaStrokes(chartTitled("Всего токенов Over Время"))).toEqual([
      "var(--color-blue-500, #3b82f6)",
      "var(--color-cyan-500, #06b6d4)",
      "var(--color-indigo-500, #6366f1)",
    ]);
    expect(areaStrokes(chartTitled("Всего запросов Over Время"))).toEqual([
      "var(--color-emerald-500, #10b981)",
      "var(--color-red-500, #ef4444)",
    ]);
    expect(barFills(chartTitled("Расход per day"))).toEqual(["var(--color-green-500, #22c55e)"]);
    expect(areaStrokes(chartTitled("Всего токенов"))).toEqual([
      "var(--color-blue-500, #3b82f6)",
      "var(--color-cyan-500, #06b6d4)",
      "var(--color-indigo-500, #6366f1)",
    ]);
    expect(barFills(chartTitled("Запросs per day"))).toEqual(["var(--color-blue-500, #3b82f6)"]);
    expect(areaStrokes(chartTitled("Success vs Запросов с ошибкой"))).toEqual([
      "var(--color-green-500, #22c55e)",
      "var(--color-red-500, #ef4444)",
    ]);
    expect(areaStrokes(chartTitled("Prompt Caching Метрикаs"))).toEqual([
      "var(--color-cyan-500, #06b6d4)",
      "var(--color-purple-500, #a855f7)",
    ]);
  });

  it("shows the built-in chart legend only on the spend per day chart", () => {
    const { container } = render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={twoDayРежимlМетрикаs} />);

    expect(container.queryВыбратьorВсе(".recharts-legend-wrapper")).toHaveLength(1);
    expect(screen.getByText("metrics.spend")).toBeInTheDocument();
  });

  it("renders formatted header legends for each chart card", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={twoDayРежимlМетрикаs} />);

    expect(screen.getВсеByText("Расход").length).toBeGreaterThan(0);
    expect(screen.getВсеByText("Api Запросs").length).toBeGreaterThan(0);
    expect(screen.getВсеByText("Успешных запросов").length).toBeGreaterThan(0);
    expect(screen.getВсеByText("Cache Creation Вход Токенs").length).toBeGreaterThan(0);
  });

  it("formats axis ticks as currency on the spend chart and compact numbers on token charts", () => {
    render(<ActivityМетрикаs Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюМетрикаs={twoDayРежимlМетрикаs} />);

    const spendTicks = tickTexts(chartTitled("Расход per day"));
    expect(spendTicks.some((text) => text.startsWith("$"))).toBe(true);

    const tokenTicks = tickTexts(chartTitled("Всего токенов"));
    expect(tokenTicks.some((text) => text.endsWith("k"))).toBe(true);
    expect(tokenTicks.some((text) => text.startsWith("$"))).toBe(false);

    const requestTicks = tickTexts(chartTitled("Запросs per day"));
    expect(requestTicks.some((text) => text.startsWith("$"))).toBe(false);
  });
});

describe("processActivityData", () => {
  const mockКаждый деньActivity: { results: Каждый деньData[] } = {
    results: [
      createMockКаждый деньData(
        "2025-01-01",
        {
          spend: 100.5,
          prompt_tokens: 30000,
          completion_tokens: 20000,
          total_tokens: 50000,
          api_requests: 100,
          successful_requests: 95,
          failed_requests: 5,
          cache_read_input_tokens: 1000,
          cache_creation_input_tokens: 500,
        },
        {
          ...EMPTY_BREAKDOWN,
          api_keys: {
            key1: createMockКлючМетрикаWithМетаданные(
              {
                key_alias: "test-key-1",
                team_id: "team1",
              },
              {
                spend: 50.25,
                prompt_tokens: 15000,
                completion_tokens: 10000,
                total_tokens: 25000,
                api_requests: 50,
                successful_requests: 47,
                failed_requests: 3,
                cache_read_input_tokens: 500,
                cache_creation_input_tokens: 250,
              },
            ),
          },
        },
      ),
    ],
  };

  it("should process data for Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs key withвыход teams parameter", () => {
    const result = processActivityData(mockКаждый деньActivity, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result).toEqual({});
  });

  it("should process data for api_keys key with teams parameter", () => {
    const result = processActivityData(mockКаждый деньActivity, "api_keys", MOCK_TEAMS);

    expect(result).toHaveСвойство("key1");
    expect(result["key1"].label).toBe("test-key-1 (team: Test Team 1)");
    expect(result["key1"].total_requests).toBe(50);
    expect(result["key1"].total_spend).toBe(50.25);
  });

  it("should process data for api_keys key withвыход teams parameter", () => {
    const result = processActivityData(mockКаждый деньActivity, "api_keys");

    expect(result).toHaveСвойство("key1");
    expect(result["key1"].label).toBe("test-key-1 (team_id: team1)");
  });

  it("retains the api key metadata so key activity can be searched by user", () => {
    const metadata = { key_alias: "test-key-1", team_id: "team1", user_id: "user-1", user_email: "user1@example.com" };
    const withUser: { results: Каждый деньData[] } = {
      results: [
        createMockКаждый деньData("2025-01-01", mockКаждый деньActivity.results[0].metrics, {
          ...EMPTY_BREAKDOWN,
          api_keys: { key1: createMockКлючМетрикаWithМетаданные(metadata, mockКаждый деньActivity.results[0].metrics) },
        }),
      ],
    };

    const result = processActivityData(withUser, "api_keys", MOCK_TEAMS);

    expect(result["key1"].key_metadata).toEqual(metadata);
    expect(processActivityData(withUser, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs")["key1"]).toBeUndefined();
  });

  it("should process data for Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs key with data", () => {
    const dailyActivityWithРежимls: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 100.5,
            prompt_tokens: 30000,
            completion_tokens: 20000,
            total_tokens: 50000,
            api_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            cache_read_input_tokens: 1000,
            cache_creation_input_tokens: 500,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 100.5,
                  prompt_tokens: 30000,
                  completion_tokens: 20000,
                  total_tokens: 50000,
                  api_requests: 100,
                  successful_requests: 95,
                  failed_requests: 5,
                  cache_read_input_tokens: 1000,
                  cache_creation_input_tokens: 500,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithРежимls, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result).toHaveСвойство("gpt-4");
    expect(result["gpt-4"].label).toBe("gpt-4");
    expect(result["gpt-4"].total_requests).toBe(100);
    expect(result["gpt-4"].total_spend).toBe(100.5);
  });

  it("should process Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups data keyed by public Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name including fallback entries", () => {
    const upstreamРежимlМетрикаs = {
      ...EMPTY_SPEND_METRICS,
      spend: 10,
      api_requests: 10,
      successful_requests: 10,
    };
    const dailyActivityWithРежимlGroups: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: upstreamРежимlМетрикаs,
          breakdown: {
            ...EMPTY_BREAKDOWN,
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-5.2": {
                metrics: upstreamРежимlМетрикаs,
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {
              "gpt-5.2-eu": {
                metrics: { ...EMPTY_SPEND_METRICS, spend: 7, api_requests: 7, successful_requests: 7 },
                metadata: {},
                api_key_breakdown: {
                  "key-1": {
                    metrics: { ...EMPTY_SPEND_METRICS, spend: 7, api_requests: 7, total_tokens: 700 },
                    metadata: { key_alias: "eu-key", team_id: "team1" },
                  },
                },
              },
              "gpt-5.2": {
                metrics: { ...EMPTY_SPEND_METRICS, spend: 3, api_requests: 3, successful_requests: 3 },
                metadata: {},
                api_key_breakdown: {},
              },
            },
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithРежимlGroups, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups");

    expect(Object.keys(result).sort()).toEqual(["gpt-5.2", "gpt-5.2-eu"]);
    expect(result["gpt-5.2-eu"].label).toBe("gpt-5.2-eu");
    expect(result["gpt-5.2-eu"].total_spend).toBe(7);
    expect(result["gpt-5.2-eu"].top_api_keys).toHaveLength(1);
    expect(result["gpt-5.2-eu"].top_api_keys[0].key_alias).toBe("eu-key");
    expect(result["gpt-5.2"].total_spend).toBe(3);
    expect(result["gpt-5.2"].total_requests).toBe(3);
  });

  it("should process data for mcp_servers key", () => {
    const dailyActivityWithMCP: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 50.0,
            prompt_tokens: 15000,
            completion_tokens: 10000,
            total_tokens: 25000,
            api_requests: 50,
            successful_requests: 48,
            failed_requests: 2,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 250,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {},
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {
              "server-1": {
                metrics: {
                  spend: 50.0,
                  prompt_tokens: 15000,
                  completion_tokens: 10000,
                  total_tokens: 25000,
                  api_requests: 50,
                  successful_requests: 48,
                  failed_requests: 2,
                  cache_read_input_tokens: 500,
                  cache_creation_input_tokens: 250,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithMCP, "mcp_servers");

    expect(result).toHaveСвойство("server-1");
    expect(result["server-1"].label).toBe("server-1");
    expect(result["server-1"].total_requests).toBe(50);
  });

  it("should aggregate metrics across multiple days", () => {
    const multiDayActivity: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 50.0,
            prompt_tokens: 15000,
            completion_tokens: 10000,
            total_tokens: 25000,
            api_requests: 50,
            successful_requests: 48,
            failed_requests: 2,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 250,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 50.0,
                  prompt_tokens: 15000,
                  completion_tokens: 10000,
                  total_tokens: 25000,
                  api_requests: 50,
                  successful_requests: 48,
                  failed_requests: 2,
                  cache_read_input_tokens: 500,
                  cache_creation_input_tokens: 250,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
        {
          date: "2025-01-02",
          metrics: {
            spend: 50.5,
            prompt_tokens: 15000,
            completion_tokens: 10000,
            total_tokens: 25000,
            api_requests: 50,
            successful_requests: 47,
            failed_requests: 3,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 250,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 50.5,
                  prompt_tokens: 15000,
                  completion_tokens: 10000,
                  total_tokens: 25000,
                  api_requests: 50,
                  successful_requests: 47,
                  failed_requests: 3,
                  cache_read_input_tokens: 500,
                  cache_creation_input_tokens: 250,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(multiDayActivity, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result["gpt-4"].total_requests).toBe(100);
    expect(result["gpt-4"].total_spend).toBe(100.5);
    expect(result["gpt-4"].total_successful_requests).toBe(95);
    expect(result["gpt-4"].total_failed_requests).toBe(5);
    expect(result["gpt-4"].daily_data).toHaveLength(2);
  });

  it("should sort daily data by date", () => {
    const unsortedКаждый деньActivity: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-03",
          metrics: {
            spend: 50.0,
            prompt_tokens: 15000,
            completion_tokens: 10000,
            total_tokens: 25000,
            api_requests: 50,
            successful_requests: 48,
            failed_requests: 2,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 250,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 50.0,
                  prompt_tokens: 15000,
                  completion_tokens: 10000,
                  total_tokens: 25000,
                  api_requests: 50,
                  successful_requests: 48,
                  failed_requests: 2,
                  cache_read_input_tokens: 500,
                  cache_creation_input_tokens: 250,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
        {
          date: "2025-01-01",
          metrics: {
            spend: 50.0,
            prompt_tokens: 15000,
            completion_tokens: 10000,
            total_tokens: 25000,
            api_requests: 50,
            successful_requests: 48,
            failed_requests: 2,
            cache_read_input_tokens: 500,
            cache_creation_input_tokens: 250,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 50.0,
                  prompt_tokens: 15000,
                  completion_tokens: 10000,
                  total_tokens: 25000,
                  api_requests: 50,
                  successful_requests: 48,
                  failed_requests: 2,
                  cache_read_input_tokens: 500,
                  cache_creation_input_tokens: 250,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(unsortedКаждый деньActivity, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result["gpt-4"].daily_data[0].date).toBe("2025-01-01");
    expect(result["gpt-4"].daily_data[1].date).toBe("2025-01-03");
  });

  it("should process api_key_breakdown for Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => {
    const dailyActivityWithBreakdown: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 100.5,
            prompt_tokens: 30000,
            completion_tokens: 20000,
            total_tokens: 50000,
            api_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            cache_read_input_tokens: 1000,
            cache_creation_input_tokens: 500,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 100.5,
                  prompt_tokens: 30000,
                  completion_tokens: 20000,
                  total_tokens: 50000,
                  api_requests: 100,
                  successful_requests: 95,
                  failed_requests: 5,
                  cache_read_input_tokens: 1000,
                  cache_creation_input_tokens: 500,
                },
                metadata: {},
                api_key_breakdown: {
                  "key-1": {
                    metrics: {
                      spend: 60.0,
                      prompt_tokens: 18000,
                      completion_tokens: 12000,
                      total_tokens: 30000,
                      api_requests: 60,
                      successful_requests: 57,
                      failed_requests: 3,
                      cache_read_input_tokens: 600,
                      cache_creation_input_tokens: 300,
                    },
                    metadata: {
                      key_alias: "test-key-1",
                      team_id: "team1",
                    },
                  },
                  "key-2": {
                    metrics: {
                      spend: 40.5,
                      prompt_tokens: 12000,
                      completion_tokens: 8000,
                      total_tokens: 20000,
                      api_requests: 40,
                      successful_requests: 38,
                      failed_requests: 2,
                      cache_read_input_tokens: 400,
                      cache_creation_input_tokens: 200,
                    },
                    metadata: {
                      key_alias: "test-key-2",
                      team_id: "team2",
                    },
                  },
                },
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithBreakdown, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result["gpt-4"].top_api_keys).toHaveLength(2);
    expect(result["gpt-4"].top_api_keys[0].spend).toBe(60.0);
    expect(result["gpt-4"].top_api_keys[0].api_key).toBe("key-1");
    expect(result["gpt-4"].top_api_keys[1].spend).toBe(40.5);
  });

  it("should limit top_api_keys to 5 entries", () => {
    const dailyActivityWithManyКлючи: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 100.5,
            prompt_tokens: 30000,
            completion_tokens: 20000,
            total_tokens: 50000,
            api_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            cache_read_input_tokens: 1000,
            cache_creation_input_tokens: 500,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 100.5,
                  prompt_tokens: 30000,
                  completion_tokens: 20000,
                  total_tokens: 50000,
                  api_requests: 100,
                  successful_requests: 95,
                  failed_requests: 5,
                  cache_read_input_tokens: 1000,
                  cache_creation_input_tokens: 500,
                },
                metadata: {},
                api_key_breakdown: {
                  "key-1": {
                    metrics: {
                      spend: 20.0,
                      prompt_tokens: 6000,
                      completion_tokens: 4000,
                      total_tokens: 10000,
                      api_requests: 20,
                      successful_requests: 19,
                      failed_requests: 1,
                      cache_read_input_tokens: 200,
                      cache_creation_input_tokens: 100,
                    },
                    metadata: { key_alias: "key-1", team_id: null },
                  },
                  "key-2": {
                    metrics: {
                      spend: 19.0,
                      prompt_tokens: 5700,
                      completion_tokens: 3800,
                      total_tokens: 9500,
                      api_requests: 19,
                      successful_requests: 18,
                      failed_requests: 1,
                      cache_read_input_tokens: 190,
                      cache_creation_input_tokens: 95,
                    },
                    metadata: { key_alias: "key-2", team_id: null },
                  },
                  "key-3": {
                    metrics: {
                      spend: 18.0,
                      prompt_tokens: 5400,
                      completion_tokens: 3600,
                      total_tokens: 9000,
                      api_requests: 18,
                      successful_requests: 17,
                      failed_requests: 1,
                      cache_read_input_tokens: 180,
                      cache_creation_input_tokens: 90,
                    },
                    metadata: { key_alias: "key-3", team_id: null },
                  },
                  "key-4": {
                    metrics: {
                      spend: 17.0,
                      prompt_tokens: 5100,
                      completion_tokens: 3400,
                      total_tokens: 8500,
                      api_requests: 17,
                      successful_requests: 16,
                      failed_requests: 1,
                      cache_read_input_tokens: 170,
                      cache_creation_input_tokens: 85,
                    },
                    metadata: { key_alias: "key-4", team_id: null },
                  },
                  "key-5": {
                    metrics: {
                      spend: 16.0,
                      prompt_tokens: 4800,
                      completion_tokens: 3200,
                      total_tokens: 8000,
                      api_requests: 16,
                      successful_requests: 15,
                      failed_requests: 1,
                      cache_read_input_tokens: 160,
                      cache_creation_input_tokens: 80,
                    },
                    metadata: { key_alias: "key-5", team_id: null },
                  },
                  "key-6": {
                    metrics: {
                      spend: 15.0,
                      prompt_tokens: 4500,
                      completion_tokens: 3000,
                      total_tokens: 7500,
                      api_requests: 15,
                      successful_requests: 14,
                      failed_requests: 1,
                      cache_read_input_tokens: 150,
                      cache_creation_input_tokens: 75,
                    },
                    metadata: { key_alias: "key-6", team_id: null },
                  },
                },
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithManyКлючи, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result["gpt-4"].top_api_keys).toHaveLength(5);
    expect(result["gpt-4"].top_api_keys[0].spend).toBe(20.0);
    expect(result["gpt-4"].top_api_keys[4].spend).toBe(16.0);
  });

  it("should return empty object when results array is empty", () => {
    const result = processActivityData({ results: [] }, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    expect(result).toEqual({});
  });

  it("should populate top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for api_keys when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs breakdown contains api_key_breakdown for that key", () => {
    const dailyActivityWithРежимlsForКлюч: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: EMPTY_SPEND_METRICS,
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: EMPTY_SPEND_METRICS,
                metadata: {},
                api_key_breakdown: {
                  "api-key-hash-1": {
                    metrics: {
                      spend: 60.0,
                      prompt_tokens: 18000,
                      completion_tokens: 12000,
                      total_tokens: 30000,
                      api_requests: 60,
                      successful_requests: 57,
                      failed_requests: 3,
                      cache_read_input_tokens: 0,
                      cache_creation_input_tokens: 0,
                    },
                    metadata: { key_alias: "key-alias-1", team_id: "team1" },
                  },
                },
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {
              "api-key-hash-1": {
                metrics: {
                  spend: 60.0,
                  prompt_tokens: 18000,
                  completion_tokens: 12000,
                  total_tokens: 30000,
                  api_requests: 60,
                  successful_requests: 57,
                  failed_requests: 3,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                metadata: { key_alias: "key-alias-1", team_id: "team1" },
              },
            },
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithРежимlsForКлюч, "api_keys", MOCK_TEAMS);

    expect(result["api-key-hash-1"].top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs).toHaveLength(1);
    expect(result["api-key-hash-1"].top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs[0].Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toBe("gpt-4");
    expect(result["api-key-hash-1"].top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs[0].spend).toBe(60.0);
    expect(result["api-key-hash-1"].top_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs[0].requests).toBe(60);
  });

  it("should not process api_key_breakdown when key is api_keys", () => {
    const dailyActivityWithBreakdown: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 100.5,
            prompt_tokens: 30000,
            completion_tokens: 20000,
            total_tokens: 50000,
            api_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            cache_read_input_tokens: 1000,
            cache_creation_input_tokens: 500,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {},
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {
              "key-1": {
                metrics: {
                  spend: 50.25,
                  prompt_tokens: 15000,
                  completion_tokens: 10000,
                  total_tokens: 25000,
                  api_requests: 50,
                  successful_requests: 47,
                  failed_requests: 3,
                  cache_read_input_tokens: 500,
                  cache_creation_input_tokens: 250,
                },
                metadata: {
                  key_alias: "test-key-1",
                  team_id: "team1",
                },
              },
            },
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithBreakdown, "api_keys", MOCK_TEAMS);

    expect(result["key-1"].top_api_keys).toEqual([]);
  });

  it("should handle missing cache tokens gracefully", () => {
    const dailyActivityWithвыходCache: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 100.5,
            prompt_tokens: 30000,
            completion_tokens: 20000,
            total_tokens: 50000,
            api_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
          breakdown: {
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 100.5,
                  prompt_tokens: 30000,
                  completion_tokens: 20000,
                  total_tokens: 50000,
                  api_requests: 100,
                  successful_requests: 95,
                  failed_requests: 5,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                metadata: {},
                api_key_breakdown: {},
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_groups: {},
            mcp_servers: {},
            providers: {},
            api_keys: {},
            entities: {},
          },
        },
      ],
    };

    const result = processActivityData(dailyActivityWithвыходCache, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result["gpt-4"].total_cache_read_input_tokens).toBe(0);
    expect(result["gpt-4"].total_cache_creation_input_tokens).toBe(0);
  });

  it("should handle empty breakdown gracefully", () => {
    const emptyКаждый деньActivity: { results: Каждый деньData[] } = {
      results: [
        {
          date: "2025-01-01",
          metrics: {
            spend: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            api_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
          breakdown: EMPTY_BREAKDOWN,
        },
      ],
    };

    const result = processActivityData(emptyКаждый деньActivity, "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    expect(result).toEqual({});
  });
});

describe("formatКлючLabel", () => {
  it("should return key_alias when no team_id is present", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData = createMockКлючМетрикаWithМетаданные({
      key_alias: "test-key",
      team_id: null,
    });

    const result = formatКлючLabel(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData, "test-key", MOCK_TEAMS);
    expect(result).toBe("test-key");
  });

  it("should return key_alias with team alias when team_id matches", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData = createMockКлючМетрикаWithМетаданные({
      key_alias: "test-key",
      team_id: "team1",
    });

    const result = formatКлючLabel(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData, "test-key", MOCK_TEAMS);
    expect(result).toBe("test-key (team: Test Team 1)");
  });

  it("should return key_alias with team_id when team is not found", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData = createMockКлючМетрикаWithМетаданные({
      key_alias: "test-key",
      team_id: "nonexistent-team",
    });

    const result = formatКлючLabel(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData, "test-key", MOCK_TEAMS);
    expect(result).toBe("test-key (team_id: nonexistent-team)");
  });

  it("should use key-hash fallback when key_alias is null", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData = createMockКлючМетрикаWithМетаданные({
      key_alias: null,
      team_id: "team1",
    });

    const result = formatКлючLabel(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData, "actual-key", MOCK_TEAMS);
    expect(result).toBe("key-hash-actual-key (team: Test Team 1)");
  });

  it("should use user_email when key_alias is null", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData = createMockКлючМетрикаWithМетаданные({
      key_alias: null,
      team_id: "team1",
      user_email: "alice@example.com",
    });

    const result = formatКлючLabel(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData, "actual-key", MOCK_TEAMS);
    expect(result).toBe("alice@example.com (team: Test Team 1)");
  });

  it("should return key_alias with team_id when teams array is empty", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData = createMockКлючМетрикаWithМетаданные({
      key_alias: "my-key",
      team_id: "team1",
    });

    const result = formatКлючLabel(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюData, "my-key", []);
    expect(result).toBe("my-key (team_id: team1)");
  });
});
