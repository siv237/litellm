"use client";

import { MCPServer } from "@/components/mcp_tools/types";

export interface RequiredFieldDef {
  key: string;
  label: string;
  description: string;
  check: (server: MCPServer) => boolean;
}

export interface FieldGroup {
  label: string;
  fields: RequiredFieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Документация",
    fields: [
      {
        key: "description",
        label: "Описание",
        description: "Требуется непустое описание",
        check: (s) => !!s.description?.trim(),
      },
      {
        key: "alias",
        label: "Псевдоним",
        description: "Должен быть отображаемый псевдоним",
        check: (s) => !!s.alias?.trim(),
      },
    ],
  },
  {
    label: "Источник",
    fields: [
      {
        key: "source_url",
        label: "URL GitHub / исходников",
        description: "Должна быть ссылка на репозиторий-источник",
        check: (s) => !!s.source_url?.trim(),
      },
    ],
  },
  {
    label: "Подключение",
    fields: [
      {
        key: "url",
        label: "URL сервера",
        description: "Должен быть настроен URL",
        check: (s) => !!s.url?.trim(),
      },
    ],
  },
  {
    label: "Безопасность",
    fields: [
      {
        key: "auth_type",
        label: "Аутентификация настроена",
        description: "Должна быть аутентификация (не 'none')",
        check: (s) => !!s.auth_type && s.auth_type !== "none",
      },
    ],
  },
];

export const MCP_REQUIRED_FIELD_DEFS: RequiredFieldDef[] = FIELD_GROUPS.flatMap((g) => g.fields);

export const SETTINGS_KEY = "mcp_required_fields";
