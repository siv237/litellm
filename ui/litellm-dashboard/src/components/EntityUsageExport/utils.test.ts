// @vitest-environment jsdom

import type { DateRangePickerЗначение } from "@/components/shared/date_picker_types";
import Papa from "papaparse";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EntitySpendData, ExportОбласть } from "./types";
import {
  generateDailyData,
  generateDailyWithKeysData,
  generateDailyWithModelsData,
  generateExportData,
  generateМетаданные,
  getEntityBreakdown,
  handleExportCSV,
  handleExportJSON,
  resolveEntities,
} from "./utils";

vi.mock("@/utils/dataUtils", () => ({
  formatNumberWithCommas: vi.fn((value: number, decimals: number = 0) => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      return "-";
    }
    return value.toFixed(decimals);
  }),
}));

vi.mock("papaparse", () => ({
  default: {
    unparse: vi.fn((data: any[]) => "mocked-csv-data"),
  },
}));

describe("EntityUsageExport utils", () => {
  // Entity keys match team_ids because that's how the backend shapes team exports
  // (breakdown.entities is keyed by team_id). The fix under test uses the entity key
  // directly for display, so the key_alias/team_id in api_key_breakdown metadata is
  // no longer consulted — it's retained here only to mirror real payload shape.
  const mockSpendData: EntitySpendData = {
    results: [
      {
        date: "2025-01-01",
        breakdown: {
          entities: {
            "team-1": {
              metrics: {
                spend: 10.5,
                api_requests: 100,
                successful_requests: 95,
                failed_requests: 5,
                total_tokens: 1000,
                prompt_tokens: 600,
                completion_tokens: 400,
                cache_read_input_tokens: 50,
                cache_creation_input_tokens: 30,
              },
              api_key_breakdown: {
                key1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                  },
                  metadata: {
                    team_id: "team-1",
                    key_alias: "alias-1",
                  },
                },
              },
            },
            "team-2": {
              metrics: {
                spend: 20.3,
                api_requests: 200,
                successful_requests: 190,
                failed_requests: 10,
                total_tokens: 2000,
                prompt_tokens: 1200,
                completion_tokens: 800,
                cache_read_input_tokens: 100,
                cache_creation_input_tokens: 60,
              },
              api_key_breakdown: {
                key2: {
                  metrics: {
                    spend: 20.3,
                    api_requests: 200,
                    successful_requests: 190,
                    failed_requests: 10,
                    total_tokens: 2000,
                  },
                  metadata: {
                    team_id: "team-2",
                    key_alias: "alias-2",
                  },
                },
              },
            },
          },
        },
      },
      {
        date: "2025-01-02",
        breakdown: {
          entities: {
            "team-1": {
              metrics: {
                spend: 15.2,
                api_requests: 150,
                successful_requests: 145,
                failed_requests: 5,
                total_tokens: 1500,
                prompt_tokens: 900,
                completion_tokens: 600,
                cache_read_input_tokens: 75,
                cache_creation_input_tokens: 45,
              },
              api_key_breakdown: {
                key1: {
                  metrics: {
                    spend: 15.2,
                    api_requests: 150,
                    successful_requests: 145,
                    failed_requests: 5,
                    total_tokens: 1500,
                  },
                  metadata: {
                    team_id: "team-1",
                    key_alias: "alias-1",
                  },
                },
              },
            },
          },
        },
      },
    ],
    metadata: {
      total_spend: 46.0,
      total_api_requests: 450,
      total_successful_requests: 430,
      total_failed_requests: 20,
      total_tokens: 4500,
    },
  };

  const mockTeamAliasMap: Record<string, string> = {
    "team-1": "Team One",
    "team-2": "Team Two",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getEntityBreakdown", () => {
    it("should aggregate entity spend data across multiple days", () => {
      const result = getEntityBreakdown(mockSpendData);

      expect(result).toHaveLength(2);
      expect(result[0].metadata.id).toBe("team-1");
      expect(result[0].metrics.spend).toBe(25.7);
      expect(result[1].metadata.id).toBe("team-2");
      expect(result[1].metrics.spend).toBe(20.3);
    });

    it("should sort entities by spend descending", () => {
      const result = getEntityBreakdown(mockSpendData);

      expect(result[0].metrics.spend).toBeGreaterThan(result[1].metrics.spend);
    });

    it("should aggregate all metrics correctly", () => {
      const result = getEntityBreakdown(mockSpendData);
      const entity1 = result.find((e) => e.metadata.id === "team-1");

      expect(entity1?.metrics.api_requests).toBe(250);
      expect(entity1?.metrics.successful_requests).toBe(240);
      expect(entity1?.metrics.failed_requests).toBe(10);
      expect(entity1?.metrics.total_tokens).toBe(2500);
      expect(entity1?.metrics.prompt_tokens).toBe(1500);
      expect(entity1?.metrics.completion_tokens).toBe(1000);
      expect(entity1?.metrics.cache_read_input_tokens).toBe(125);
      expect(entity1?.metrics.cache_creation_input_tokens).toBe(75);
    });

    it("should use entity key as alias when no team alias map is provided", () => {
      // Non-team exports (tags, orgs, customers, …) pass no teamAliasMap.
      // For teams, this is also the fallback when a team is missing from the map.
      const result = getEntityBreakdown(mockSpendData);
      const entity1 = result.find((e) => e.metadata.id === "team-1");

      expect(entity1?.metadata.alias).toBe("team-1");
    });

    it("should use team alias map to resolve alias from entity key", () => {
      const spendDataWithoutAlias: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                "team-1": {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                    cache_read_input_tokens: 50,
                    cache_creation_input_tokens: 30,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = getEntityBreakdown(spendDataWithoutAlias, mockTeamAliasMap);
      const entity1 = result.find((e) => e.metadata.id === "team-1");

      expect(entity1?.metadata.alias).toBe("Team One");
    });

    it("should use entity id when team alias is not available", () => {
      const spendDataWithoutTeamId: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                    cache_read_input_tokens: 50,
                    cache_creation_input_tokens: 30,
                  },
                  api_key_breakdown: {},
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = getEntityBreakdown(spendDataWithoutTeamId);
      const entity1 = result.find((e) => e.metadata.id === "entity1");

      expect(entity1?.metadata.alias).toBe("entity1");
    });

    it("should handle empty spend data", () => {
      const emptySpendData: EntitySpendData = {
        results: [],
        metadata: {
          total_spend: 0,
          total_api_requests: 0,
          total_successful_requests: 0,
          total_failed_requests: 0,
          total_tokens: 0,
        },
      };

      const result = getEntityBreakdown(emptySpendData);

      expect(result).toHaveLength(0);
    });

    it("should handle missing необязательно token fields", () => {
      const spendDataWithMissingTokens: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                "team-1": {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = getEntityBreakdown(spendDataWithMissingTokens);
      const entity1 = result.find((e) => e.metadata.id === "team-1");

      expect(entity1?.metrics.prompt_tokens).toBe(0);
      expect(entity1?.metrics.completion_tokens).toBe(0);
    });
  });

  describe("generateDailyData", () => {
    it("should generate daily breakdown data with correct structure", () => {
      const result = generateDailyData(mockSpendData, "Team", mockTeamAliasMap);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveСвойство("Date");
      expect(result[0]).toHaveСвойство("Team");
      expect(result[0]).toHaveСвойство("ID команды");
      expect(result[0]).toHaveСвойство("Расход ($)");
      expect(result[0]).toHaveСвойство("Запросs");
      expect(result[0]).toHaveСвойство("Успешных запросов");
      expect(result[0]).toHaveСвойство("Запросов с ошибкой");
      expect(result[0]).toHaveСвойство("Всего токенов");
      expect(result[0]).toHaveСвойство("Prompt Токенs");
      expect(result[0]).toHaveСвойство("Completion Токенs");
      expect(result[0]).toHaveСвойство("Cache Read Вход Токенs");
      expect(result[0]).toHaveСвойство("Cache Creation Вход Токенs");
    });

    it("should export exact cache token values per entity per day", () => {
      const result = generateDailyData(mockSpendData, "Team", mockTeamAliasMap);

      const day1Team1 = result.find((r) => r.Date === "2025-01-01" && r["ID команды"] === "team-1");
      const day1Team2 = result.find((r) => r.Date === "2025-01-01" && r["ID команды"] === "team-2");
      const day2Team1 = result.find((r) => r.Date === "2025-01-02" && r["ID команды"] === "team-1");

      expect(day1Team1?.["Cache Read Вход Токенs"]).toBe(50);
      expect(day1Team1?.["Cache Creation Вход Токенs"]).toBe(30);
      expect(day1Team2?.["Cache Read Вход Токенs"]).toBe(100);
      expect(day1Team2?.["Cache Creation Вход Токенs"]).toBe(60);
      expect(day2Team1?.["Cache Read Вход Токенs"]).toBe(75);
      expect(day2Team1?.["Cache Creation Вход Токенs"]).toBe(45);
    });

    it("should sort data by date ascending", () => {
      const result = generateDailyData(mockSpendData, "Team");

      const dates = result.map((r) => new Date(r.Date).getВремя());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
      }
    });

    it("should use team alias when available", () => {
      const result = generateDailyData(mockSpendData, "Team", mockTeamAliasMap);
      const team1Entry = result.find((r) => r["ID команды"] === "team-1");

      expect(team1Entry?.["Team"]).toBe("Team One");
    });

    it("should use dash when team alias is not available", () => {
      const result = generateDailyData(mockSpendData, "Team");
      const entryWithoutTeamId = result.find((r) => !r["ID команды"] || r["ID команды"] === "-");

      if (entryWithoutTeamId) {
        expect(entryWithoutTeamId["Team"]).toBe("-");
      }
    });

    it("should fall back to the entity key when there is no team alias mapping", () => {
      // e.g. tag/org/customer exports where teamAliasMap has no entry for the entity,
      // or a team that isn't in the alias map — the entity key itself is the label.
      const spendDataWithoutAlias: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                "my-tag": {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {},
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = generateDailyData(spendDataWithoutAlias, "Tag");
      const entry = result[0];

      expect(entry["Tag ID"]).toBe("my-tag");
      expect(entry["Tag"]).toBe("my-tag");
    });

    it("should format spend values correctly", () => {
      const result = generateDailyData(mockSpendData, "Team");

      expect(result[0]["Расход ($)"]).toBeDefined();
    });

    it("should handle missing необязательно token fields", () => {
      const spendDataWithMissingTokens: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = generateDailyData(spendDataWithMissingTokens, "Team");

      expect(result[0]["Prompt Токенs"]).toBe(0);
      expect(result[0]["Completion Токенs"]).toBe(0);
      expect(result[0]["Cache Read Вход Токенs"]).toBe(0);
      expect(result[0]["Cache Creation Вход Токенs"]).toBe(0);
    });
  });

  describe("generateDailyWithKeysData", () => {
    const mockSpendDataWithКлючи: EntitySpendData = {
      results: [
        {
          date: "2025-01-01",
          breakdown: {
            entities: {
              "team-1": {
                metrics: {
                  spend: 10.5,
                  api_requests: 100,
                  successful_requests: 95,
                  failed_requests: 5,
                  total_tokens: 1000,
                  prompt_tokens: 600,
                  completion_tokens: 400,
                },
                api_key_breakdown: {
                  key1: {
                    metrics: {
                      spend: 5.0,
                      api_requests: 50,
                      successful_requests: 48,
                      failed_requests: 2,
                      total_tokens: 500,
                      prompt_tokens: 300,
                      completion_tokens: 200,
                    },
                    metadata: {
                      team_id: "team-1",
                      key_alias: "alias-1",
                    },
                  },
                  key2: {
                    metrics: {
                      spend: 5.5,
                      api_requests: 50,
                      successful_requests: 47,
                      failed_requests: 3,
                      total_tokens: 500,
                      prompt_tokens: 300,
                      completion_tokens: 200,
                    },
                    metadata: {
                      team_id: "team-1",
                      key_alias: "alias-2",
                    },
                  },
                },
              },
              "team-2": {
                metrics: {
                  spend: 20.3,
                  api_requests: 200,
                  successful_requests: 190,
                  failed_requests: 10,
                  total_tokens: 2000,
                  prompt_tokens: 1200,
                  completion_tokens: 800,
                },
                api_key_breakdown: {
                  key3: {
                    metrics: {
                      spend: 20.3,
                      api_requests: 200,
                      successful_requests: 190,
                      failed_requests: 10,
                      total_tokens: 2000,
                      prompt_tokens: 1200,
                      completion_tokens: 800,
                    },
                    metadata: {
                      team_id: "team-2",
                      key_alias: "alias-3",
                    },
                  },
                },
              },
            },
          },
        },
        {
          date: "2025-01-02",
          breakdown: {
            entities: {
              "team-1": {
                metrics: {
                  spend: 15.2,
                  api_requests: 150,
                  successful_requests: 145,
                  failed_requests: 5,
                  total_tokens: 1500,
                  prompt_tokens: 900,
                  completion_tokens: 600,
                },
                api_key_breakdown: {
                  key1: {
                    metrics: {
                      spend: 15.2,
                      api_requests: 150,
                      successful_requests: 145,
                      failed_requests: 5,
                      total_tokens: 1500,
                      prompt_tokens: 900,
                      completion_tokens: 600,
                    },
                    metadata: {
                      team_id: "team-1",
                      key_alias: "alias-1",
                    },
                  },
                },
              },
            },
          },
        },
      ],
      metadata: {
        total_spend: 46.0,
        total_api_requests: 450,
        total_successful_requests: 430,
        total_failed_requests: 20,
        total_tokens: 4500,
      },
    };

    it("should generate daily breakdown with key data and correct structure", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team", mockTeamAliasMap);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveСвойство("Date");
      expect(result[0]).toHaveСвойство("Team");
      expect(result[0]).toHaveСвойство("ID команды");
      expect(result[0]).toHaveСвойство("Псевдоним ключа");
      expect(result[0]).toHaveСвойство("Ключ ID");
      expect(result[0]).toHaveСвойство("Расход ($)");
      expect(result[0]).toHaveСвойство("Запросs");
      expect(result[0]).toHaveСвойство("Успешных запросов");
      expect(result[0]).toHaveСвойство("Запросов с ошибкой");
      expect(result[0]).toHaveСвойство("Всего токенов");
      expect(result[0]).toHaveСвойство("Prompt Токенs");
      expect(result[0]).toHaveСвойство("Completion Токенs");
      expect(result[0]).toHaveСвойство("Cache Read Вход Токенs");
      expect(result[0]).toHaveСвойство("Cache Creation Вход Токенs");
    });

    it("should export and aggregate cache token values per key", () => {
      const makeDay = (cacheRead: number, cacheCreation: number) => ({
        date: "2025-01-01",
        breakdown: {
          entities: {
            "team-1": {
              metrics: {
                spend: 5.0,
                api_requests: 50,
                successful_requests: 50,
                failed_requests: 0,
                total_tokens: 500,
                prompt_tokens: 300,
                completion_tokens: 200,
                cache_read_input_tokens: cacheRead,
                cache_creation_input_tokens: cacheCreation,
              },
              api_key_breakdown: {
                key1: {
                  metrics: {
                    spend: 5.0,
                    api_requests: 50,
                    successful_requests: 50,
                    failed_requests: 0,
                    total_tokens: 500,
                    prompt_tokens: 300,
                    completion_tokens: 200,
                    cache_read_input_tokens: cacheRead,
                    cache_creation_input_tokens: cacheCreation,
                  },
                  metadata: {
                    team_id: "team-1",
                    key_alias: "alias-1",
                  },
                },
              },
            },
          },
        },
      });

      const spendDataWithCache: EntitySpendData = {
        results: [makeDay(40, 25), makeDay(10, 5)],
        metadata: mockSpendDataWithКлючи.metadata,
      };

      const result = generateDailyWithKeysData(spendDataWithCache, "Team");

      expect(result).toHaveLength(1);
      expect(result[0]["Cache Read Вход Токенs"]).toBe(50);
      expect(result[0]["Cache Creation Вход Токенs"]).toBe(30);
    });

    it("should sort data by date ascending", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team");

      const dates = result.map((r) => new Date(r.Date).getВремя());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i + 1]);
      }
    });

    it("should aggregate metrics for duplicate date-team-key combinations", () => {
      const spendDataWithDuplicates: EntitySpendData = {
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 5.0,
                        api_requests: 50,
                        successful_requests: 48,
                        failed_requests: 2,
                        total_tokens: 500,
                        prompt_tokens: 300,
                        completion_tokens: 200,
                      },
                      metadata: {
                        team_id: "team-1",
                        key_alias: "alias-1",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 5.0,
                        api_requests: 50,
                        successful_requests: 47,
                        failed_requests: 3,
                        total_tokens: 500,
                        prompt_tokens: 300,
                        completion_tokens: 200,
                      },
                      metadata: {
                        team_id: "team-1",
                        key_alias: "alias-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: {
          total_spend: 21.0,
          total_api_requests: 200,
          total_successful_requests: 190,
          total_failed_requests: 10,
          total_tokens: 2000,
        },
      };

      const result = generateDailyWithKeysData(spendDataWithDuplicates, "Team");
      const key1Entries = result.filter((r) => r["Ключ ID"] === "key1");

      expect(key1Entries).toHaveLength(1);
      expect(key1Entries[0].Requests).toBe(100);
      expect(key1Entries[0]["Успешных запросов"]).toBe(95);
      expect(key1Entries[0]["Запросов с ошибкой"]).toBe(5);
      expect(key1Entries[0]["Всего токенов"]).toBe(1000);
    });

    it("should use team alias when available", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team", mockTeamAliasMap);
      const team1Entry = result.find((r) => r["ID команды"] === "team-1");

      expect(team1Entry?.["Team"]).toBe("Team One");
    });

    it("should use dash when team alias is not available", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team");
      const entryWithoutTeamAlias = result.find((r) => r["ID команды"] === "team-1" && !mockTeamAliasMap[r["ID команды"]]);

      if (entryWithoutTeamAlias) {
        expect(entryWithoutTeamAlias["Team"]).toBe("-");
      }
    });

    it("should use key alias when available", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team");
      const key1Entry = result.find((r) => r["Ключ ID"] === "key1");

      expect(key1Entry?.["Псевдоним ключа"]).toBe("alias-1");
    });

    it("should use dash when key alias is not available", () => {
      const spendDataWithвыходКлючAlias: EntitySpendData = {
        ...mockSpendDataWithКлючи,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                        prompt_tokens: 600,
                        completion_tokens: 400,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendDataWithКлючи.metadata,
      };

      const result = generateDailyWithKeysData(spendDataWithвыходКлючAlias, "Team");
      const key1Entry = result.find((r) => r["Ключ ID"] === "key1");

      expect(key1Entry?.["Псевдоним ключа"]).toBe("-");
    });

    it("should use entity id when team id is not available in metadata", () => {
      const spendDataWithoutTeamId: EntitySpendData = {
        ...mockSpendDataWithКлючи,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                        prompt_tokens: 600,
                        completion_tokens: 400,
                      },
                      metadata: {},
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendDataWithКлючи.metadata,
      };

      const result = generateDailyWithKeysData(spendDataWithoutTeamId, "Team");
      const entry = result.find((r) => r["Ключ ID"] === "key1");

      expect(entry?.["ID команды"]).toBe("entity1");
    });

    it("should use dash when team id is not available", () => {
      const spendDataWithoutTeamId: EntitySpendData = {
        ...mockSpendDataWithКлючи,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                        prompt_tokens: 600,
                        completion_tokens: 400,
                      },
                      metadata: {
                        team_id: null,
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendDataWithКлючи.metadata,
      };

      const result = generateDailyWithKeysData(spendDataWithoutTeamId, "Team");
      const entry = result.find((r) => r["Ключ ID"] === "key1");

      expect(entry?.["ID команды"]).toBe("entity1");
    });

    it("should format spend values correctly", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team");

      expect(result[0]["Расход ($)"]).toBeDefined();
    });

    it("should handle missing необязательно token fields", () => {
      const spendDataWithMissingTokens: EntitySpendData = {
        ...mockSpendDataWithКлючи,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                        key_alias: "alias-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendDataWithКлючи.metadata,
      };

      const result = generateDailyWithKeysData(spendDataWithMissingTokens, "Team");
      const key1Entry = result.find((r) => r["Ключ ID"] === "key1");

      expect(key1Entry?.["Prompt Токенs"]).toBe(0);
      expect(key1Entry?.["Completion Токенs"]).toBe(0);
      expect(key1Entry?.["Cache Read Вход Токенs"]).toBe(0);
      expect(key1Entry?.["Cache Creation Вход Токенs"]).toBe(0);
    });

    it("should handle empty api_key_breakdown", () => {
      const spendDataWithEmptyBreakdown: EntitySpendData = {
        ...mockSpendDataWithКлючи,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {},
                },
              },
            },
          },
        ],
        metadata: mockSpendDataWithКлючи.metadata,
      };

      const result = generateDailyWithKeysData(spendDataWithEmptyBreakdown, "Team");

      expect(result).toHaveLength(0);
    });

    it("should handle multiple keys for same team on same date", () => {
      const result = generateDailyWithKeysData(mockSpendDataWithКлючи, "Team");
      const team1Entries = result.filter((r) => r["ID команды"] === "team-1" && r.Date === "2025-01-01");

      expect(team1Entries.length).toBeGreaterThanOrEqual(2);
      const keyIds = team1Entries.map((r) => r["Ключ ID"]);
      expect(keyIds).toContain("key1");
      expect(keyIds).toContain("key2");
    });
  });

  describe("generateDailyWithModelsData", () => {
    const mockSpendDataWithModels: EntitySpendData = {
      results: [
        {
          date: "2025-01-01",
          breakdown: {
            entities: {
              "team-1": {
                metrics: {
                  spend: 10.5,
                  api_requests: 100,
                  successful_requests: 95,
                  failed_requests: 5,
                  total_tokens: 1000,
                  prompt_tokens: 600,
                  completion_tokens: 400,
                  cache_read_input_tokens: 50,
                  cache_creation_input_tokens: 30,
                },
                api_key_breakdown: {
                  key1: {
                    metrics: {
                      spend: 5.0,
                      api_requests: 50,
                      successful_requests: 48,
                      failed_requests: 2,
                      total_tokens: 500,
                    },
                    metadata: {
                      team_id: "team-1",
                    },
                  },
                  key2: {
                    metrics: {
                      spend: 5.5,
                      api_requests: 50,
                      successful_requests: 47,
                      failed_requests: 3,
                      total_tokens: 500,
                    },
                    metadata: {
                      team_id: "team-1",
                    },
                  },
                },
              },
            },
            Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
              "gpt-4": {
                metrics: {
                  spend: 5.0,
                  api_requests: 50,
                  successful_requests: 48,
                  failed_requests: 2,
                  total_tokens: 500,
                },
                api_key_breakdown: {
                  key1: {
                    metrics: {
                      spend: 5.0,
                      api_requests: 50,
                      successful_requests: 48,
                      failed_requests: 2,
                      total_tokens: 500,
                    },
                    metadata: { team_id: "team-1" },
                  },
                },
              },
              "gpt-3.5-turbo": {
                metrics: {
                  spend: 5.5,
                  api_requests: 50,
                  successful_requests: 47,
                  failed_requests: 3,
                  total_tokens: 500,
                },
                api_key_breakdown: {
                  key2: {
                    metrics: {
                      spend: 5.5,
                      api_requests: 50,
                      successful_requests: 47,
                      failed_requests: 3,
                      total_tokens: 500,
                    },
                    metadata: { team_id: "team-1" },
                  },
                },
              },
            },
          },
        },
      ],
      metadata: {
        total_spend: 10.5,
        total_api_requests: 100,
        total_successful_requests: 95,
        total_failed_requests: 5,
        total_tokens: 1000,
      },
    };

    it("should generate daily breakdown with Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию data", () => {
      const result = generateDailyWithModelsData(mockSpendDataWithModels, "Team", mockTeamAliasMap);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveСвойство("Date");
      expect(result[0]).toHaveСвойство("Team");
      expect(result[0]).toHaveСвойство("ID команды");
      expect(result[0]).toHaveСвойство("Режимl");
      expect(result[0]).toHaveСвойство("Расход ($)");
      expect(result[0]).toHaveСвойство("Запросs");
      expect(result[0]).toHaveСвойство("Successful");
      expect(result[0]).toHaveСвойство("Ошибка");
      expect(result[0]).toHaveСвойство("Всего токенов");
      expect(result[0]).toHaveСвойство("Prompt Токенs");
      expect(result[0]).toHaveСвойство("Completion Токенs");
      expect(result[0]).toHaveСвойство("Cache Read Вход Токенs");
      expect(result[0]).toHaveСвойство("Cache Creation Вход Токенs");
    });

    it("should export prompt, completion, and cache token values summed across keys for the same Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", () => {
      const data: EntitySpendData = {
        results: [
          {
            date: "2025-03-01",
            breakdown: {
              entities: {
                "team-1": {
                  metrics: {
                    spend: 5.0,
                    api_requests: 25,
                    successful_requests: 25,
                    failed_requests: 0,
                    total_tokens: 1050,
                    prompt_tokens: 750,
                    completion_tokens: 300,
                    cache_read_input_tokens: 450,
                    cache_creation_input_tokens: 200,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 2.0,
                        api_requests: 10,
                        successful_requests: 10,
                        failed_requests: 0,
                        total_tokens: 700,
                      },
                      metadata: { team_id: "team-1" },
                    },
                    key2: {
                      metrics: {
                        spend: 3.0,
                        api_requests: 15,
                        successful_requests: 15,
                        failed_requests: 0,
                        total_tokens: 350,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
                "claude-sonnet-4-5": {
                  metrics: {
                    spend: 5.0,
                    api_requests: 25,
                    successful_requests: 25,
                    failed_requests: 0,
                    total_tokens: 1050,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 2.0,
                        api_requests: 10,
                        successful_requests: 10,
                        failed_requests: 0,
                        total_tokens: 700,
                        prompt_tokens: 500,
                        completion_tokens: 200,
                        cache_read_input_tokens: 300,
                        cache_creation_input_tokens: 120,
                      },
                      metadata: { team_id: "team-1" },
                    },
                    key2: {
                      metrics: {
                        spend: 3.0,
                        api_requests: 15,
                        successful_requests: 15,
                        failed_requests: 0,
                        total_tokens: 350,
                        prompt_tokens: 250,
                        completion_tokens: 100,
                        cache_read_input_tokens: 150,
                        cache_creation_input_tokens: 80,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: {
          total_spend: 5.0,
          total_api_requests: 25,
          total_successful_requests: 25,
          total_failed_requests: 0,
          total_tokens: 1050,
        },
      };

      const result = generateDailyWithModelsData(data, "Team");

      expect(result).toHaveLength(1);
      expect(result[0].Model).toBe("claude-sonnet-4-5");
      expect(result[0]["Всего токенов"]).toBe(1050);
      expect(result[0]["Prompt Токенs"]).toBe(750);
      expect(result[0]["Completion Токенs"]).toBe(300);
      expect(result[0]["Cache Read Вход Токенs"]).toBe(450);
      expect(result[0]["Cache Creation Вход Токенs"]).toBe(200);
    });

    it("should sort data by date ascending", () => {
      const multiDayData: EntitySpendData = {
        results: [
          {
            date: "2025-01-02",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                    cache_read_input_tokens: 50,
                    cache_creation_input_tokens: 30,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
                "gpt-4": {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
            },
          },
          ...mockSpendDataWithModels.results,
        ],
        metadata: mockSpendDataWithModels.metadata,
      };

      const result = generateDailyWithModelsData(multiDayData, "Team");

      expect(new Date(result[0].Date).getВремя()).toBeLessThanOrEqual(
        new Date(result[result.length - 1].Date).getВремя(),
      );
    });

    it("should attribute each Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию only its own per-key spend", () => {
      const result = generateDailyWithModelsData(mockSpendDataWithModels, "Team");

      const gpt4Entry = result.find((r) => r.Model === "gpt-4");
      const gpt35Entry = result.find((r) => r.Model === "gpt-3.5-turbo");

      expect(gpt4Entry?.["Расход ($)"]).toBe("5.0000");
      expect(gpt4Entry?.Requests).toBe(50);
      expect(gpt4Entry?.["Всего токенов"]).toBe(500);

      expect(gpt35Entry?.["Расход ($)"]).toBe("5.5000");
      expect(gpt35Entry?.Requests).toBe(50);
      expect(gpt35Entry?.["Всего токенов"]).toBe(500);
    });

    it("should not duplicate a user's spend across every Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию (regression for LIT overcount)", () => {
      // One user, one key, that key used two Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs. The entity-level api_key_breakdown
      // carries the key's total (8.0) across both Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs; each Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию's api_key_breakdown
      // carries only that Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию's share (3.0 + 5.0). The per-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию rows must sum back to
      // the user-day total, not repeat the total once per Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию.
      const data: EntitySpendData = {
        results: [
          {
            date: "2025-02-14",
            breakdown: {
              entities: {
                user1: {
                  metrics: {
                    spend: 8.0,
                    api_requests: 80,
                    successful_requests: 78,
                    failed_requests: 2,
                    total_tokens: 800,
                    prompt_tokens: 500,
                    completion_tokens: 300,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 8.0,
                        api_requests: 80,
                        successful_requests: 78,
                        failed_requests: 2,
                        total_tokens: 800,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
                "claude-3-haiku": {
                  metrics: {
                    spend: 3.0,
                    api_requests: 30,
                    successful_requests: 29,
                    failed_requests: 1,
                    total_tokens: 300,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 3.0,
                        api_requests: 30,
                        successful_requests: 29,
                        failed_requests: 1,
                        total_tokens: 300,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
                "claude-sonnet-4-5": {
                  metrics: {
                    spend: 5.0,
                    api_requests: 50,
                    successful_requests: 49,
                    failed_requests: 1,
                    total_tokens: 500,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 5.0,
                        api_requests: 50,
                        successful_requests: 49,
                        failed_requests: 1,
                        total_tokens: 500,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: {
          total_spend: 8.0,
          total_api_requests: 80,
          total_successful_requests: 78,
          total_failed_requests: 2,
          total_tokens: 800,
        },
      };

      const result = generateDailyWithModelsData(data, "User");

      expect(result).toHaveLength(2);

      const haiku = result.find((r) => r.Model === "claude-3-haiku");
      const sonnet = result.find((r) => r.Model === "claude-sonnet-4-5");

      expect(haiku?.["Расход ($)"]).toBe("3.0000");
      expect(sonnet?.["Расход ($)"]).toBe("5.0000");

      const totalРасход = result.reduce((sum, r) => sum + parseFloat(r["Расход ($)"].replace(/,/g, "")), 0);
      const totalRequests = result.reduce((sum, r) => sum + r.Requests, 0);
      const totalTokens = result.reduce((sum, r) => sum + r["Всего токенов"], 0);

      expect(totalРасход).toBeCloseTo(8.0, 4);
      expect(totalRequests).toBe(80);
      expect(totalTokens).toBe(800);
    });

    it("should omit Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs the user never called instead of fanning выход", () => {
      // A second key (key2) belongs to a different user and is the only caller of
      // gpt-3.5-turbo. user1 only used key1 -> gpt-4. user1 must get exactly one row.
      const data: EntitySpendData = {
        results: [
          {
            date: "2025-02-14",
            breakdown: {
              entities: {
                user1: {
                  metrics: {
                    spend: 5.0,
                    api_requests: 50,
                    successful_requests: 48,
                    failed_requests: 2,
                    total_tokens: 500,
                    prompt_tokens: 300,
                    completion_tokens: 200,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 5.0,
                        api_requests: 50,
                        successful_requests: 48,
                        failed_requests: 2,
                        total_tokens: 500,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
                "gpt-4": {
                  metrics: {
                    spend: 5.0,
                    api_requests: 50,
                    successful_requests: 48,
                    failed_requests: 2,
                    total_tokens: 500,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 5.0,
                        api_requests: 50,
                        successful_requests: 48,
                        failed_requests: 2,
                        total_tokens: 500,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
                "gpt-3.5-turbo": {
                  metrics: {
                    spend: 9.0,
                    api_requests: 90,
                    successful_requests: 90,
                    failed_requests: 0,
                    total_tokens: 900,
                  },
                  api_key_breakdown: {
                    key2: {
                      metrics: {
                        spend: 9.0,
                        api_requests: 90,
                        successful_requests: 90,
                        failed_requests: 0,
                        total_tokens: 900,
                      },
                      metadata: { team_id: "team-2" },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: {
          total_spend: 14.0,
          total_api_requests: 140,
          total_successful_requests: 138,
          total_failed_requests: 2,
          total_tokens: 1400,
        },
      };

      const result = generateDailyWithModelsData(data, "User");

      expect(result).toHaveLength(1);
      expect(result[0].Model).toBe("gpt-4");
      expect(result[0]["Расход ($)"]).toBe("5.0000");
    });

    it("should use team alias when available", () => {
      const result = generateDailyWithModelsData(mockSpendDataWithModels, "Team", mockTeamAliasMap);
      const team1Entry = result.find((r) => r["ID команды"] === "team-1");

      expect(team1Entry?.["Team"]).toBe("Team One");
    });

    it("should use dash when team alias is not available", () => {
      const result = generateDailyWithModelsData(mockSpendDataWithModels, "Team");
      const entryWithoutTeamId = result.find((r) => !r["ID команды"] || r["ID команды"] === "-");

      if (entryWithoutTeamId) {
        expect(entryWithoutTeamId["Team"]).toBe("-");
      }
    });

    it("should handle empty Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs breakdown", () => {
      const spendDataWithвыходРежимls: EntitySpendData = {
        ...mockSpendDataWithModels,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                    cache_read_input_tokens: 50,
                    cache_creation_input_tokens: 30,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {},
            },
          },
        ],
        metadata: mockSpendDataWithModels.metadata,
      };

      const result = generateDailyWithModelsData(spendDataWithвыходРежимls, "Team");

      expect(result).toHaveLength(0);
    });
  });

  describe("generateExportData", () => {
    it("should return daily data when scope is daily", () => {
      const result = generateExportData(mockSpendData, "daily", "Team", mockTeamAliasMap);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveСвойство("Date");
      expect(result[0]).not.toHaveСвойство("Режимl");
    });

    it("should return daily with keys data when scope is daily_with_keys", () => {
      const mockDataWithКлючи: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                        prompt_tokens: 600,
                        completion_tokens: 400,
                      },
                      metadata: {
                        team_id: "team-1",
                        key_alias: "alias-1",
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = generateExportData(mockDataWithКлючи, "daily_with_keys", "Team", mockTeamAliasMap);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveСвойство("Псевдоним ключа");
      expect(result[0]).toHaveСвойство("Ключ ID");
      expect(result[0]).not.toHaveСвойство("Режимl");
    });

    it("should return daily with Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs data when scope is daily_with_models", () => {
      const mockDataWithModels: EntitySpendData = {
        ...mockSpendData,
        results: [
          {
            date: "2025-01-01",
            breakdown: {
              entities: {
                entity1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                    prompt_tokens: 600,
                    completion_tokens: 400,
                    cache_read_input_tokens: 50,
                    cache_creation_input_tokens: 30,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: {
                        team_id: "team-1",
                      },
                    },
                  },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
                "gpt-4": {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                  },
                  api_key_breakdown: {
                    key1: {
                      metrics: {
                        spend: 10.5,
                        api_requests: 100,
                        successful_requests: 95,
                        failed_requests: 5,
                        total_tokens: 1000,
                      },
                      metadata: { team_id: "team-1" },
                    },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = generateExportData(mockDataWithModels, "daily_with_models", "Team", mockTeamAliasMap);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveСвойство("Режимl");
    });

    it("should default to daily data for unknown scope", () => {
      const result = generateExportData(mockSpendData, "unknown" as ExportОбласть, "Team", mockTeamAliasMap);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).not.toHaveСвойство("Режимl");
    });
  });

  describe("generateМетаданные", () => {
    const mockDateRange: DateRangePickerЗначение = {
      from: new Date("2025-01-01"),
      to: new Date("2025-01-31"),
    };

    it("should generate metadata with correct structure", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily", mockSpendData);

      expect(result).toHaveСвойство("export_date");
      expect(result).toHaveСвойство("entity_type");
      expect(result).toHaveСвойство("date_range");
      expect(result).toHaveСвойство("filters_applied");
      expect(result).toHaveСвойство("export_scope");
      expect(result).toHaveСвойство("summary");
    });

    it("should include export date as ISO string", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily", mockSpendData);

      expect(result.export_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should include entity type", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily", mockSpendData);

      expect(result.entity_type).toBe("team");
    });

    it("should format date range correctly", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily", mockSpendData);

      expect(result.date_range.from).toBe("2025-01-01T00:00:00.000Z");
      expect(result.date_range.to).toBe("2025-01-31T00:00:00.000Z");
    });

    it("should handle missing date range values", () => {
      const incompleteDateRange: DateRangePickerЗначение = {
        from: undefined,
        to: undefined,
      };

      const result = generateМетаданные("team", incompleteDateRange, [], "daily", mockSpendData);

      expect(result.date_range.from).toBeUndefined();
      expect(result.date_range.to).toBeUndefined();
    });

    it("should set filters_applied to None when empty", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily", mockSpendData);

      expect(result.filters_applied).toBe("None");
    });

    it("should include filters when provided", () => {
      const result = generateМетаданные("team", mockDateRange, ["filter1", "filter2"], "daily", mockSpendData);

      expect(result.filters_applied).toEqual(["filter1", "filter2"]);
    });

    it("should include export scope", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily_with_models", mockSpendData);

      expect(result.export_scope).toBe("daily_with_models");
    });

    it("should include summary metrics from spend data", () => {
      const result = generateМетаданные("team", mockDateRange, [], "daily", mockSpendData);

      expect(result.summary.total_spend).toBe(46.0);
      expect(result.summary.total_requests).toBe(450);
      expect(result.summary.successful_requests).toBe(430);
      expect(result.summary.failed_requests).toBe(20);
      expect(result.summary.total_tokens).toBe(4500);
    });

    it("should include total_flat_cost and total_cost in summary when total_flat_cost is present", () => {
      const spendWithFlat: EntitySpendData = {
        ...mockSpendData,
        metadata: { ...mockSpendData.metadata, total_flat_cost: 6.45 },
      };
      const result = generateМетаданные("team", mockDateRange, [], "daily", spendWithFlat);
      expect(result.summary.total_flat_cost).toBeCloseTo(6.45, 4);
      expect(result.summary.total_cost).toBeCloseTo(46.0 + 6.45, 4);
    });

    it("should omit total_flat_cost and total_cost when total_flat_cost is zero", () => {
      const zeroFlat = { ...mockSpendData, metadata: { ...mockSpendData.metadata, total_flat_cost: 0 } };
      const result = generateМетаданные("team", mockDateRange, [], "daily", zeroFlat);
      expect(result.summary.total_flat_cost).toBeUndefined();
      expect(result.summary.total_cost).toBeUndefined();
    });
  });

  describe("generateDailyData PTU flat cost", () => {
    const dayWithFlat: EntitySpendData = {
      results: [
        {
          date: "2025-01-01",
          breakdown: {
            entities: {
              "team-1": {
                metrics: {
                  spend: 10,
                  flat_cost: 6.45,
                  api_requests: 50,
                  successful_requests: 50,
                  failed_requests: 0,
                  total_tokens: 500,
                  prompt_tokens: 300,
                  completion_tokens: 200,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
                api_key_breakdown: {},
              },
            },
          },
        },
      ],
      metadata: {
        total_spend: 10,
        total_flat_cost: 6.45,
        total_api_requests: 50,
        total_successful_requests: 50,
        total_failed_requests: 0,
        total_tokens: 500,
      },
    };

    it("includes Фиксированная стоимость ($) and Общая стоимость ($) columns when total_flat_cost is present", () => {
      const rows = generateDailyData(dayWithFlat, "Team", {});
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveСвойство("Фиксированная стоимость ($)");
      expect(rows[0]).toHaveСвойство("Общая стоимость ($)");
      expect(rows[0]["Фиксированная стоимость ($)"]).toBe("6.4500");
      expect(rows[0]["Общая стоимость ($)"]).toBe("16.4500");
    });

    it("does not include Фиксированная стоимость / Общая стоимость columns when total_flat_cost is zero", () => {
      const spendWithoutFlat: EntitySpendData = {
        ...dayWithFlat,
        metadata: {
          total_spend: 10,
          total_api_requests: 50,
          total_successful_requests: 50,
          total_failed_requests: 0,
          total_tokens: 500,
          total_flat_cost: 0,
        },
      };
      const rows = generateDailyData(spendWithoutFlat, "User", {});
      expect(rows).toHaveLength(1);
      expect(rows[0]).not.toHaveСвойство("Фиксированная стоимость ($)");
      expect(rows[0]).not.toHaveСвойство("Общая стоимость ($)");
    });
  });

  describe("handleExportCSV", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
      window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should create CSV file and trigger download", () => {
      const createObjectURLSpy = vi.spyOn(window.URL, "createObjectURL").mockReturnЗначение("blob:mock-url");
      vi.spyOn(window.URL, "revokeObjectURL");
      const createElementSpy = vi.spyOn(document, "createElement");
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      handleExportCSV(mockSpendData, "daily", "Team", "team", mockTeamAliasMap);

      const unparsedRows = vi.mocked(Papa.unparse).mock.calls[0][0] as Record<string, unknown>[];
      expect(unparsedRows).toHaveLength(3);
      const day1Team1 = unparsedRows.find((r) => r["Date"] === "2025-01-01" && r["ID команды"] === "team-1");
      expect(day1Team1?.["Cache Read Вход Токенs"]).toBe(50);

      const exportedBlob = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(exportedBlob.type).toBe("text/csv;charset=utf-8;");

      expect(createElementSpy).toHaveBeenCalledWith("a");
      const attached = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(attached.download).toMatch(/^team_usage_daily_.*\.csv$/);
      expect(removeChildSpy).toHaveBeenCalledWith(attached);
    });

    it("should generate correct filename", () => {
      const anchorElement = document.createElement("a");
      vi.spyOn(document, "createElement").mockReturnЗначение(anchorElement);

      const today = new Date().toISOString().split("T")[0];

      handleExportCSV(mockSpendData, "daily", "Team", "team", mockTeamAliasMap);

      expect(anchorElement.download).toBe(`team_usage_daily_${today}.csv`);
    });

    it("should create blob with correct type", () => {
      let blobType = "";
      const originalBlob = window.Blob;

      window.Blob = class extends Blob {
        constructor(parts?: BlobPart[] | undefined, options?: BlobPropertyBag | undefined) {
          super(parts, options);
          if (options?.type) {
            blobType = options.type;
          }
        }
      } as any;

      handleExportCSV(mockSpendData, "daily", "Team", "team", mockTeamAliasMap);

      expect(blobType).toBe("text/csv;charset=utf-8;");

      window.Blob = originalBlob;
    });
  });

  describe("handleExportJSON", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
      window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should create JSON file and trigger download", () => {
      const createObjectURLSpy = vi.spyOn(window.URL, "createObjectURL").mockReturnЗначение("blob:mock-url");
      vi.spyOn(window.URL, "revokeObjectURL");
      const createElementSpy = vi.spyOn(document, "createElement");
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");

      const mockDateRange: DateRangePickerЗначение = {
        from: new Date("2025-01-01"),
        to: new Date("2025-01-31"),
      };

      handleExportJSON(mockSpendData, "daily", "Team", "team", mockDateRange, [], mockTeamAliasMap);

      const exportedBlob = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(exportedBlob.type).toBe("application/json");

      expect(createElementSpy).toHaveBeenCalledWith("a");
      const attached = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
      expect(attached.download).toMatch(/^team_usage_daily_.*\.json$/);
      expect(removeChildSpy).toHaveBeenCalledWith(attached);
    });

    it("should generate correct filename", () => {
      const anchorElement = document.createElement("a");
      vi.spyOn(document, "createElement").mockReturnЗначение(anchorElement);

      const today = new Date().toISOString().split("T")[0];
      const mockDateRange: DateRangePickerЗначение = {
        from: new Date("2025-01-01"),
        to: new Date("2025-01-31"),
      };

      handleExportJSON(mockSpendData, "daily", "Team", "team", mockDateRange, [], mockTeamAliasMap);

      expect(anchorElement.download).toBe(`team_usage_daily_${today}.json`);
    });

    it("should create blob with correct type", () => {
      let blobType = "";
      const originalBlob = window.Blob;

      window.Blob = class extends Blob {
        constructor(parts?: BlobPart[] | undefined, options?: BlobPropertyBag | undefined) {
          super(parts, options);
          if (options?.type) {
            blobType = options.type;
          }
        }
      } as any;

      const mockDateRange: DateRangePickerЗначение = {
        from: new Date("2025-01-01"),
        to: new Date("2025-01-31"),
      };

      handleExportJSON(mockSpendData, "daily", "Team", "team", mockDateRange, [], mockTeamAliasMap);

      expect(blobType).toBe("application/json");

      window.Blob = originalBlob;
    });

    it("should include metadata and data in JSON export", () => {
      let jsonString = "";
      const originalBlob = window.Blob;

      window.Blob = class extends Blob {
        constructor(parts?: BlobPart[] | undefined, options?: BlobPropertyBag | undefined) {
          super(parts, options);
          if (parts && parts[0]) {
            jsonString = parts[0] as string;
          }
        }
      } as any;

      const mockDateRange: DateRangePickerЗначение = {
        from: new Date("2025-01-01"),
        to: new Date("2025-01-31"),
      };

      handleExportJSON(mockSpendData, "daily", "Team", "team", mockDateRange, ["filter1"], mockTeamAliasMap);

      const exportObject = JSON.parse(jsonString);
      expect(exportObject).toHaveСвойство("metadata");
      expect(exportObject).toHaveСвойство("data");
      expect(exportObject.metadata.entity_type).toBe("team");
      expect(exportObject.metadata.filters_applied).toEqual(["filter1"]);

      window.Blob = originalBlob;
    });
  });

  describe("resolveEntities and aggregated endpoint fallback", () => {
    // Simulates the response from /user/daily/activity/aggregated which has
    // empty entities but populated api_keys at the breakdown level.
    // Derived from mockSpendData: flatten all entities' api_key_breakdowns
    // into top-level api_keys, clear entities, and add a second key for team-1
    // to test multi-key grouping.
    const aggregatedSpendData: EntitySpendData = {
      ...mockSpendData,
      results: mockSpendData.results.slice(0, 1).map((day) => ({
        ...day,
        breakdown: {
          entities: {},
          api_keys: {
            ...Object.fromEntries(
              Object.values(day.breakdown.entities as Record<string, any>).flatMap((e: any) =>
                Object.entries(e.api_key_breakdown || {}),
              ),
            ),
            // Extra key on team-1 to test multi-key-per-team aggregation
            key1b: {
              metrics: { spend: 5, api_requests: 50, successful_requests: 48, failed_requests: 2, total_tokens: 500 },
              metadata: { team_id: "team-1", key_alias: "staging-key" },
            },
          },
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
            "gpt-4": {
              metrics: { spend: 35.8, api_requests: 350, total_tokens: 3500 },
              api_key_breakdown: {
                key1: {
                  metrics: {
                    spend: 10.5,
                    api_requests: 100,
                    successful_requests: 95,
                    failed_requests: 5,
                    total_tokens: 1000,
                  },
                  metadata: { team_id: "team-1" },
                },
                key1b: {
                  metrics: {
                    spend: 5,
                    api_requests: 50,
                    successful_requests: 48,
                    failed_requests: 2,
                    total_tokens: 500,
                  },
                  metadata: { team_id: "team-1" },
                },
                key2: {
                  metrics: {
                    spend: 20.3,
                    api_requests: 200,
                    successful_requests: 195,
                    failed_requests: 5,
                    total_tokens: 2000,
                  },
                  metadata: { team_id: "team-2" },
                },
              },
            },
          },
        },
      })),
    };

    describe("resolveEntities", () => {
      it("should return entities when populated", () => {
        const breakdown = {
          entities: { e1: { metrics: { spend: 1 } } },
          api_keys: { k1: { metrics: { spend: 2 }, metadata: { team_id: "t1" } } },
        };
        const result = resolveEntities(breakdown);
        expect(result).toBe(breakdown.entities);
      });

      it("should aggregate api_keys into entities when entities is empty", () => {
        const breakdown = aggregatedSpendData.results[0].breakdown;
        const result = resolveEntities(breakdown);

        // Two teams: team-1 (key1+key2) and team-2 (key3)
        expect(Object.keys(result)).toHaveLength(2);
        expect(result["team-1"]).toBeDefined();
        expect(result["team-2"]).toBeDefined();

        // team-1 spend = 10.5 (key1) + 5 (key1b)
        expect(result["team-1"].metrics.spend).toBe(15.5);
        expect(result["team-1"].metrics.api_requests).toBe(150);
        expect(result["team-1"].metrics.total_tokens).toBe(1500);

        // team-2 spend = 20.3 (key2)
        expect(result["team-2"].metrics.spend).toBe(20.3);
        expect(result["team-2"].metrics.api_requests).toBe(200);
      });

      it("should use 'Unassigned' for keys withвыход team_id", () => {
        const breakdown = {
          entities: {},
          api_keys: {
            k1: {
              metrics: { spend: 7, api_requests: 10, successful_requests: 10, failed_requests: 0, total_tokens: 100 },
              metadata: {},
            },
          },
        };
        const result = resolveEntities(breakdown);
        expect(result["Unassigned"]).toBeDefined();
        expect(result["Unassigned"].metrics.spend).toBe(7);
      });

      it("should handle missing or empty api_keys gracefully", () => {
        expect(Object.keys(resolveEntities({ entities: {}, api_keys: {} }))).toHaveLength(0);
        expect(Object.keys(resolveEntities({ entities: {} }))).toHaveLength(0);
      });

      it("should preserve api_key_breakdown on aggregated entities", () => {
        const breakdown = aggregatedSpendData.results[0].breakdown;
        const result = resolveEntities(breakdown);

        // team-1 should have key1 and key1b in api_key_breakdown
        expect(Object.keys(result["team-1"].api_key_breakdown)).toEqual(["key1", "key1b"]);
        // team-2 should have key2
        expect(Object.keys(result["team-2"].api_key_breakdown)).toEqual(["key2"]);
      });
    });

    describe("getEntityBreakdown with aggregated data", () => {
      it("should produce breakdown from api_keys when entities is empty", () => {
        const result = getEntityBreakdown(aggregatedSpendData);
        expect(result.length).toBeGreaterThan(0);

        // Sorted by spend desc: team-2 (20.3) then team-1 (15.5)
        expect(result[0].metrics.spend).toBe(20.3);
        expect(result[1].metrics.spend).toBe(15.5);
      });
    });

    describe("generateDailyData with aggregated data", () => {
      it("should produce rows from api_keys when entities is empty", () => {
        const result = generateDailyData(aggregatedSpendData, "Team");
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveСвойство("Date");
        expect(result[0]).toHaveСвойство("Team");
      });
    });

    describe("generateDailyWithKeysData with aggregated data", () => {
      it("should produce rows from api_keys when entities is empty", () => {
        const result = generateDailyWithKeysData(aggregatedSpendData, "Team");
        expect(result.length).toBeGreaterThan(0);

        // Should have 3 key rows (key1, key1b, key2)
        expect(result).toHaveLength(3);
        const keyIds = result.map((r) => r["Ключ ID"]);
        expect(keyIds).toContain("key1");
        expect(keyIds).toContain("key1b");
        expect(keyIds).toContain("key2");
      });
    });

    describe("generateDailyWithModelsData with aggregated data", () => {
      it("should produce rows from api_keys when entities is empty", () => {
        const result = generateDailyWithModelsData(aggregatedSpendData, "Team");
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveСвойство("Режимl");

        // team-1 = key1 (10.5) + key1b (5) on gpt-4; team-2 = key2 (20.3) on gpt-4.
        // Расход must aggregate per team-key, not repeat the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию total per team.
        const team1 = result.find((r) => r["ID команды"] === "team-1");
        const team2 = result.find((r) => r["ID команды"] === "team-2");
        expect(team1?.["Расход ($)"]).toBe("15.5000");
        expect(team2?.["Расход ($)"]).toBe("20.3000");
      });
    });
  });

  describe("display name resolution from entity metadata", () => {
    const entityMetrics = {
      spend: 12.25,
      api_requests: 40,
      successful_requests: 39,
      failed_requests: 1,
      total_tokens: 900,
      prompt_tokens: 500,
      completion_tokens: 400,
      cache_read_input_tokens: 20,
      cache_creation_input_tokens: 10,
    };

    const makeSpendData = (entity: string, metadata?: Record<string, any>): EntitySpendData => ({
      results: [
        {
          date: "2025-04-01",
          breakdown: {
            entities: {
              [entity]: {
                metrics: entityMetrics,
                metadata,
                api_key_breakdown: {
                  key1: {
                    metrics: entityMetrics,
                    metadata: { key_alias: "prod-key" },
                  },
                },
              },
            },
          },
        },
      ],
      metadata: mockSpendData.metadata,
    });

    it("should export the user email as the entity label and keep the raw user id in the id column", () => {
      const result = generateDailyData(
        makeSpendData("user-123", { user_email: "ada@example.com", user_alias: "Ada" }),
        "User",
      );

      expect(result).toHaveLength(1);
      expect(result[0]["User"]).toBe("ada@example.com");
      expect(result[0]["ID пользователя"]).toBe("user-123");
    });

    it("should fall back to the user alias when the user has no email", () => {
      const nullEmail = generateDailyData(
        makeSpendData("user-123", { user_email: null, user_alias: "Ada Lovelace" }),
        "User",
      );
      const missingEmail = generateDailyData(makeSpendData("user-123", { user_alias: "Ada Lovelace" }), "User");

      expect(nullEmail[0]["User"]).toBe("Ada Lovelace");
      expect(missingEmail[0]["User"]).toBe("Ada Lovelace");
    });

    it("should fall back to the raw entity key when the entity carries no metadata", () => {
      const noМетаданные = generateDailyData(makeSpendData("my-tag"), "Tag");
      const emptyМетаданные = generateDailyData(makeSpendData("customer-9", {}), "Customer");
      const blankNames = generateDailyData(makeSpendData("user-123", { user_email: null, user_alias: null }), "User");

      expect(noМетаданные[0]["Tag"]).toBe("my-tag");
      expect(emptyМетаданные[0]["Customer"]).toBe("customer-9");
      expect(blankNames[0]["User"]).toBe("user-123");
    });

    it("should prefer the team alias map over any alias in entity metadata", () => {
      const result = generateDailyData(
        makeSpendData("team-1", { team_alias: "Stale Alias", user_email: "ada@example.com" }),
        "Team",
        mockTeamAliasMap,
      );

      expect(result[0]["Team"]).toBe("Team One");
    });

    it("should use the team alias from entity metadata when the alias map has no entry for the team", () => {
      const result = generateDailyData(
        makeSpendData("team-9", { team_alias: "Team Nine", user_email: "ada@example.com" }),
        "Team",
        mockTeamAliasMap,
      );

      expect(result[0]["Team"]).toBe("Team Nine");
    });

    it("should resolve metadata.alias to the user email in getEntityBreakdown", () => {
      const withEmail = getEntityBreakdown(
        makeSpendData("user-123", { user_email: "ada@example.com", user_alias: "Ada" }),
      );
      const withoutEmail = getEntityBreakdown(makeSpendData("user-123", { user_alias: "Ada" }));

      expect(withEmail[0].metadata.alias).toBe("ada@example.com");
      expect(withEmail[0].metadata.id).toBe("user-123");
      expect(withoutEmail[0].metadata.alias).toBe("Ada");
    });

    it("should resolve the user email on every key row of the keys scope", () => {
      const spendData: EntitySpendData = {
        results: [
          {
            date: "2025-04-01",
            breakdown: {
              entities: {
                "user-123": {
                  metrics: entityMetrics,
                  metadata: { user_email: "ada@example.com", user_alias: "Ada" },
                  api_key_breakdown: {
                    key1: { metrics: entityMetrics, metadata: { key_alias: "prod-key" } },
                    key2: { metrics: entityMetrics, metadata: { key_alias: "dev-key" } },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = generateDailyWithKeysData(spendData, "User");

      expect(result).toHaveLength(2);
      expect(result.map((r) => r["User"])).toEqual(["ada@example.com", "ada@example.com"]);
      expect(result.map((r) => r["ID пользователя"])).toEqual(["user-123", "user-123"]);
      expect(result.find((r) => r["Ключ ID"] === "key1")?.["Псевдоним ключа"]).toBe("prod-key");
      expect(result.find((r) => r["Ключ ID"] === "key2")?.["Псевдоним ключа"]).toBe("dev-key");
    });

    it("should resolve each entity's own email in the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs scope", () => {
      const spendData: EntitySpendData = {
        results: [
          {
            date: "2025-04-01",
            breakdown: {
              entities: {
                "user-a": {
                  metrics: entityMetrics,
                  metadata: { user_email: "ada@example.com", user_alias: "Ada" },
                  api_key_breakdown: { key1: { metrics: entityMetrics, metadata: {} } },
                },
                "user-b": {
                  metrics: entityMetrics,
                  metadata: { user_email: null, user_alias: "Grace" },
                  api_key_breakdown: { key2: { metrics: entityMetrics, metadata: {} } },
                },
              },
              Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: {
                "claude-sonnet-4-5": {
                  metrics: entityMetrics,
                  api_key_breakdown: {
                    key1: { metrics: entityMetrics, metadata: {} },
                    key2: { metrics: entityMetrics, metadata: {} },
                  },
                },
              },
            },
          },
        ],
        metadata: mockSpendData.metadata,
      };

      const result = generateDailyWithModelsData(spendData, "User");

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.Model === "claude-sonnet-4-5")).toBe(true);
      expect(result.find((r) => r["ID пользователя"] === "user-a")?.["User"]).toBe("ada@example.com");
      expect(result.find((r) => r["ID пользователя"] === "user-b")?.["User"]).toBe("Grace");
    });
  });
});
