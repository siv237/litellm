/**
 * Page metadata for UI Settings configuration
 * This file contains descriptions and metadata for all navigation pages
 */

// Page descriptions for UI Settings configuration
export const pageDescriptions: Record<string, string> = {
  "api-keys": "Управление виртуальными ключами доступа к API",
  "llm-playground": "Интерактивный playground тестовых запросов к LLM",
  models: "Настройка и управление моделями LLM и эндпоинтами",
  agents: "Создание и управление ИИ-агентами",
  agentic: "Управление агентными ресурсами: агенты, запуски процессов и память",
  workflows: "Отслеживание истории надёжных запусков процессов",
  "mcp-servers": "Настройка серверов Model Context Protocol",
  memory: "Просмотр и управление записями памяти агентов в /v1/memory",
  guardrails: "Настройка модерации контента и защитных гардрейлов",
  policies: "Определение политик доступа и использования",
  "search-tools": "Настройка инструментов поиска и выборки RAG",
  "tool-policies": "Настройка политик и прав использования инструментов",
  "vector-stores": "Управление векторными базами для эмбеддингов",
  new_usage: "Аналитика и метрики использования",
  "cost-optimization": "Отслеживание и настройка экономии: сжатие и кэширование промптов, авто-маршрутизация",
  logs: "Журналы запросов и ответов",
  "guardrails-monitor": "Мониторинг работы гардрейлов и журналы",
  users: "Управление внутренними аккаунтами и правами",
  teams: "Создание и управление командами для контроля доступа",
  organizations: "Управление организациями и их участниками",
  projects: "Управление проектами внутри команд",
  "access-groups": "Управление группами доступа по ролям",
  budgets: "Установка и контроль бюджетов расхода",
  api_ref: "Обзор документации API и эндпоинтов",
  "model-hub-table": "Доступные ИИ-модели и провайдеры",
  "learning-resources": "Руководства и документация",
  caching: "Настройка кэширования ответов и координационного Redis",
  "transform-request": "Правила трансформации запросов",
  "cost-tracking": "Учёт и анализ стоимости API",
  "ui-theme": "Внешний вид дашборда",
  "tag-management": "Организация ресурсов тегами",
  prompts: "Управление шаблонами промптов и их версиями",
  skills: "Обзор и управление скиллами Claude Code",
  usage: "Устаревший дашборд использования",
  "router-settings": "Настройка маршрутизации и балансировки",
  "logging-and-alerts": "Настройка логирования и оповещений",
  "admin-panel": "Панель администратора и настройки",
};

export interface PageMetadata {
  page: string;
  label: string;
  group: string;
  description: string;
}
