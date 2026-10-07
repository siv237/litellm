import { describe, it, expect } from "vitest";
import { FIELD_GROUPS, MCP_REQUIRED_FIELD_DEFS, SETTINGS_KEY } from "./MCPStandardsSettings";
import { MCPServer } from "@/components/mcp_tools/types";

const makeServer = (overrides: Partial<MCPServer> = {}): MCPServer => ({
  server_id: "s1",
  created_at: "2024-01-01",
  created_by: "Пользователь",
  updated_at: "2024-01-01",
  updated_by: "Пользователь",
  ...overrides,
});

describe("FIELD_GROUPS", () => {
  it("should contain four groups", () => {
    expect(FIELD_GROUPS).toHaveLength(4);
    expect(FIELD_GROUPS.map((g) => g.label)).toEqual(["Документация", "Источник", "Подключение", "Безопасность"]);
  });
});

describe("MCP_REQUIRED_FIELD_DEFS", () => {
  it("should flatten Все fields from groups", () => {
    const totalFields = FIELD_GROUPS.reduce((sum, g) => sum + g.fields.length, 0);
    expect(MCP_REQUIRED_FIELD_DEFS).toHaveLength(totalFields);
  });
});

describe("Поле check functions", () => {
  const findCheck = (key: string) => MCP_REQUIRED_FIELD_DEFS.find((f) => f.key === key)!.check;

  it("should pass Описание check when Описание is present", () => {
    expect(findCheck("Описание")(makeServer({ description: "A service" }))).toBe(true);
  });

  it("should fail Описание check when Описание is empty", () => {
    expect(findCheck("Описание")(makeServer({ description: "  " }))).toBe(false);
  });

  it("should pass auth check when auth_type is not Нет", () => {
    expect(findCheck("auth_type")(makeServer({ auth_type: "oauth2" }))).toBe(true);
  });

  it("should fail auth check when auth_type is Нет", () => {
    expect(findCheck("auth_type")(makeServer({ auth_type: "Нет" }))).toBe(false);
  });

  it("should fail auth check when auth_type is missing", () => {
    expect(findCheck("auth_type")(makeServer())).toBe(false);
  });
});

describe("SETTINGS_KEY", () => {
  it("should equal mcp_required_fields", () => {
    expect(SETTINGS_KEY).toBe("mcp_required_fields");
  });
});
