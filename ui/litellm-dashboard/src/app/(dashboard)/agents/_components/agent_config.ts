/**
 * Shared configuration for agent form fields
 * Used across create, view, and update operations
 */

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "switch" | "list" | "select";
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  defaultValue?: any;
  rows?: number;
  validation?: any[];
  options?: string[];
  helpText?: string;
}

export interface SectionConfig {
  key: string;
  title: string;
  fields: FieldConfig[];
  defaultExpanded?: boolean;
}

export const AGENT_FORM_CONFIG: {
  basic: SectionConfig;
  skills: SectionConfig;
  capabilities: SectionConfig;
  optional: SectionConfig;
  litellm: SectionConfig;
  cost: SectionConfig;
  tracing: SectionConfig;
} = {
  basic: {
    key: "basic",
    title: "Основная информация",
    defaultExpanded: true,
    fields: [
      {
        name: "name",
        label: "Отображаемое имя",
        type: "text",
        required: true,
        placeholder: "напр., Агент поддержки клиентов",
      },
      {
        name: "description",
        label: "Описание",
        type: "textarea",
        required: true,
        placeholder: "Describe what this agent does...",
        rows: 3,
      },
      {
        name: "url",
        label: "URL",
        type: "url",
        required: false,
        placeholder: "http://localhost:9999/",
        tooltip: "Базовый URL, где размещён агент (необязательно)",
      },
      {
        name: "version",
        label: "Версия",
        type: "text",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
      },
      {
        name: "protocolVersion",
        label: "Версия протокола",
        type: "select",
        options: ["1.0", "0.3"],
        defaultValue: "1.0",
        tooltip:
          "Версия протокола A2A, которую LiteLLM отдаёт клиентам для этого агента. LiteLLM преобразует ответы вышестоящего агента к этой версии, поэтому клиенты всегда видят выбранную здесь версию, независимо от версии исходного агента.",
        helpText:
          "LiteLLM serves this version to clients and converts the upstream agent's responses to match it, regardless of the original agent's version.",
      },
    ],
  },
  skills: {
    key: "skills",
    title: "Навыки",
    fields: [
      {
        name: "skills",
        label: "Навыки",
        type: "list",
        defaultValue: [],
      },
    ],
  },
  capabilities: {
    key: "capabilities",
    title: "Возможности",
    fields: [
      {
        name: "streaming",
        label: "Потоковая передача",
        type: "switch",
        defaultValue: false,
      },
      {
        name: "pushNotifications",
        label: "Push-уведомления",
        type: "switch",
      },
      {
        name: "stateTransitionHistory",
        label: "История переходов состояний",
        type: "switch",
      },
    ],
  },
  optional: {
    key: "optional",
    title: "Дополнительные настройки",
    fields: [
      {
        name: "iconUrl",
        label: "URL значка",
        type: "url",
        placeholder: "https://example.com/icon.png",
      },
      {
        name: "documentationUrl",
        label: "URL документации",
        type: "url",
        placeholder: "https://docs.example.com",
      },
      {
        name: "supportsAuthenticatedExtendedCard",
        label: "Поддержка расширенной аутентифицированной карточки",
        type: "switch",
      },
    ],
  },
  litellm: {
    key: "litellm",
    title: "Параметры LiteLLM",
    fields: [
      {
        name: "model",
        label: "Модель (необязательно)",
        type: "text",
      },
      {
        name: "make_public",
        label: "Сделать публичным",
        type: "switch",
      },
    ],
  },
  cost: {
    key: "cost",
    title: "Настройка стоимости",
    fields: [
      {
        name: "cost_per_query",
        label: "Стоимость запроса ($)",
        type: "text",
        placeholder: "0.0",
        tooltip: "Фиксированная стоимость запроса",
      },
      {
        name: "input_cost_per_token",
        label: "Стоимость входного токена ($)",
        type: "text",
        placeholder: "0.000001",
        tooltip: "Стоимость входного токена",
      },
      {
        name: "output_cost_per_token",
        label: "Стоимость выходного токена ($)",
        type: "text",
        placeholder: "0.000002",
        tooltip: "Стоимость выходного токена",
      },
    ],
  },
  tracing: {
    key: "tracing",
    title: "Трассировка",
    fields: [
      {
        name: "enable_tracing",
        label: "Включить трассировку",
        type: "switch",
        defaultValue: false,
        tooltip: "Включить трассировку запросов для этого агента",
      },
    ],
  },
};

export const SKILL_FIELD_CONFIG = {
  id: {
    name: "id",
    label: "ID навыка",
    required: true,
    placeholder: "e.g., hello_world",
  },
  name: {
    name: "name",
    label: "Название навыка",
    required: true,
    placeholder: "e.g., Returns hello world",
  },
  description: {
    name: "description",
    label: "Описание",
    required: true,
    placeholder: "Что делает этот навык",
    rows: 2,
  },
  tags: {
    name: "tags",
    label: "Теги",
    required: true,
    placeholder: "Введите тег и нажмите Enter",
  },
  examples: {
    name: "examples",
    label: "Примеры",
    placeholder: "Введите пример и нажмите Enter",
  },
};

/**
 * Get default form values from configuration
 */
export const getDefaultFormValues = () => {
  const defaults: any = {
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
  };

  Object.values(AGENT_FORM_CONFIG).forEach((section) => {
    section.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });

  return defaults;
};

/**
 * Build agent data from form values according to AgentConfig spec
 */
export const buildAgentDataFromForm = (values: any, existingAgent?: any) => {
  const agentData: any = {
    agent_name: values.agent_name,
    agent_card_params: {
      protocolVersion: values.protocolVersion || "1.0",
      name: values.name || values.agent_name,
      description: values.description || "",
      url: values.url || "",
      version: values.version || "1.0.0",
      defaultInputModes: existingAgent?.agent_card_params?.defaultInputModes || ["text"],
      defaultOutputModes: existingAgent?.agent_card_params?.defaultOutputModes || ["text"],
      capabilities: {
        streaming: values.streaming === true,
        ...(values.pushNotifications !== undefined && { pushNotifications: values.pushNotifications }),
        ...(values.stateTransitionHistory !== undefined && { stateTransitionHistory: values.stateTransitionHistory }),
      },
      skills: values.skills || [],
      ...(values.iconUrl && { iconUrl: values.iconUrl }),
      ...(values.documentationUrl && { documentationUrl: values.documentationUrl }),
      ...(values.supportsAuthenticatedExtendedCard !== undefined && {
        supportsAuthenticatedExtendedCard: values.supportsAuthenticatedExtendedCard,
      }),
    },
  };

  const params: Record<string, any> = {};

  if (values.model) params.model = values.model;
  if (values.make_public !== undefined) params.make_public = values.make_public;
  if (values.cost_per_query) params.cost_per_query = parseFloat(values.cost_per_query);
  if (values.input_cost_per_token) params.input_cost_per_token = parseFloat(values.input_cost_per_token);
  if (values.output_cost_per_token) params.output_cost_per_token = parseFloat(values.output_cost_per_token);

  if (Object.keys(params).length > 0) {
    agentData.litellm_params = params;
  }

  if (values.tpm_limit != null) agentData.tpm_limit = values.tpm_limit;
  if (values.rpm_limit != null) agentData.rpm_limit = values.rpm_limit;
  if (values.session_tpm_limit != null) agentData.session_tpm_limit = values.session_tpm_limit;
  if (values.session_rpm_limit != null) agentData.session_rpm_limit = values.session_rpm_limit;
  // static_headers: convert [{header, value}, ...] → {header: value, ...}
  if (Array.isArray(values.static_headers) && values.static_headers.length > 0) {
    const staticHeaders: Record<string, string> = {};
    values.static_headers.forEach((entry: { header?: string; value?: string }) => {
      const key = entry?.header?.trim();
      if (key) staticHeaders[key] = entry?.value ?? "";
    });
    if (Object.keys(staticHeaders).length > 0) {
      agentData.static_headers = staticHeaders;
    }
  }

  // extra_headers: already an array of strings from Select tags
  if (Array.isArray(values.extra_headers) && values.extra_headers.length > 0) {
    agentData.extra_headers = values.extra_headers;
  }

  return agentData;
};

export const parseMcpPermissionsForForm = (agent: any) => ({
  allowed_mcp_servers_and_groups: {
    servers: agent.object_permission?.mcp_servers ?? [],
    accessGroups: agent.object_permission?.mcp_access_groups ?? [],
    toolsets: agent.object_permission?.mcp_toolsets ?? [],
  },
  mcp_tool_permissions: agent.object_permission?.mcp_tool_permissions ?? {},
});

/**
 * Always includes every MCP key (empty when cleared) so removals persist;
 * the proxy merges object_permission per key, leaving non-MCP grants untouched.
 */
export const buildMcpObjectPermission = (values: any) => ({
  mcp_servers: values.allowed_mcp_servers_and_groups?.servers ?? [],
  mcp_access_groups: values.allowed_mcp_servers_and_groups?.accessGroups ?? [],
  mcp_toolsets: values.allowed_mcp_servers_and_groups?.toolsets ?? [],
  mcp_tool_permissions: values.mcp_tool_permissions ?? {},
});

/**
 * Parse agent data for form fields
 */
export const parseAgentForForm = (agent: any) => {
  const skills =
    agent.agent_card_params?.skills?.map((skill: any) => ({
      ...skill,
      tags: skill.tags,
      examples: skill.examples || [],
    })) || [];

  return {
    agent_name: agent.agent_name,
    name: agent.agent_card_params?.name,
    description: agent.agent_card_params?.description,
    url: agent.agent_card_params?.url,
    version: agent.agent_card_params?.version,
    protocolVersion: agent.agent_card_params?.protocolVersion,
    streaming: agent.agent_card_params?.capabilities?.streaming,
    pushNotifications: agent.agent_card_params?.capabilities?.pushNotifications,
    stateTransitionHistory: agent.agent_card_params?.capabilities?.stateTransitionHistory,
    skills: skills,
    iconUrl: agent.agent_card_params?.iconUrl,
    documentationUrl: agent.agent_card_params?.documentationUrl,
    supportsAuthenticatedExtendedCard: agent.agent_card_params?.supportsAuthenticatedExtendedCard,
    model: agent.litellm_params?.model,
    make_public: agent.litellm_params?.make_public,
    cost_per_query: agent.litellm_params?.cost_per_query,
    input_cost_per_token: agent.litellm_params?.input_cost_per_token,
    output_cost_per_token: agent.litellm_params?.output_cost_per_token,
    tpm_limit: agent.tpm_limit,
    rpm_limit: agent.rpm_limit,
    session_tpm_limit: agent.session_tpm_limit,
    session_rpm_limit: agent.session_rpm_limit,
    // static_headers: {key: value} → [{header, value}, ...]
    static_headers: agent.static_headers
      ? Object.entries(agent.static_headers as Record<string, string>).map(([header, value]) => ({
          header,
          value,
        }))
      : [],
    // extra_headers: already an array of strings
    extra_headers: agent.extra_headers ?? [],
    ...parseMcpPermissionsForForm(agent),
  };
};
