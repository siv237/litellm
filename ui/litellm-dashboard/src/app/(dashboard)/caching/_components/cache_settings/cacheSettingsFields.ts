export type CacheFieldType =
  | "string"
  | "password"
  | "integer"
  | "float"
  | "boolean"
  | "list"
  | "model-select"
  | "select";

export interface CacheFieldOption {
  readonly value: string;
  readonly label: string;
}

export type RedisType = "node" | "cluster" | "sentinel" | "semantic";

export type CacheSection = "connection" | "cluster" | "sentinel" | "semantic" | "ssl" | "cacheManagement" | "gcp";

export type CacheFieldRule = (value: unknown) => string | null;

// Marker the backend returns for a configured credential and maps back to the
// stored secret on save, so the plaintext never round-trips through the form.
export const REDACTED_VALUE = "***REDACTED***";

export interface CacheField {
  readonly name: string;
  readonly label: string;
  readonly type: CacheFieldType;
  readonly section: CacheSection;
  readonly helpText: string;
  readonly redisType: RedisType | null;
  readonly defaultValue?: string | number | boolean;
  readonly options?: readonly CacheFieldOption[];
  readonly rules?: CacheFieldRule[];
  // Credential field: never prefilled into the form, and dropped from the save
  // payload when left untouched so the redacted marker is never persisted.
  readonly secret?: boolean;
}

export const REDIS_TYPES: readonly RedisType[] = ["node", "cluster", "sentinel", "semantic"];

export const REDIS_TYPE_DESCRIPTIONS: Readonly<Record<RedisType, string>> = {
  node: "Обычный узел/единственный экземпляр Redis",
  cluster: "Режим Redis Cluster для высокой доступности и горизонтального масштабирования",
  sentinel: "Режим Redis Sentinel для высокой доступности с автоматическим переключением",
  semantic: "Семантический кэш: переиспользует ответы для похожих запросов",
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value).trim() === "";

const portRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? null : "Порт — целое число от 1 до 65535";
};

const jsonListRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(value));
  } catch {
    return "Должен быть корректный JSON-массив (двойные кавычки)";
  }
  return Array.isArray(parsed) ? null : "Должен быть JSON-массив";
};

const nonNegativeIntegerRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? null : "Должно быть целым неотрицательным числом";
};

const numberRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  return Number.isNaN(Number(value)) ? "Должно быть числом" : null;
};

export const CACHE_FIELDS: readonly CacheField[] = [
  {
    name: "url",
    label: "Redis URL",
    type: "string",
    section: "connection",
    helpText:
      "Полный URL подключения Redis/Valkey (напр. redis://:password@host:6379/1). Если задан, имеет приоритет над хостом, портом, паролем и индексом БД.",
    redisType: null,
    secret: true,
  },
  {
    name: "host",
    label: "Хост",
    type: "string",
    section: "connection",
    helpText: "Имя хоста или IP-адрес сервера Redis",
    redisType: null,
  },
  {
    name: "port",
    label: "Порт",
    type: "string",
    section: "connection",
    helpText: "Номер порта сервера Redis",
    redisType: null,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "db",
    label: "Индекс базы данных",
    type: "integer",
    section: "connection",
    helpText: "Логический индекс базы данных для изоляции кэша (напр. 1 для redis://host:6379/1)",
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "password",
    label: "Пароль",
    type: "password",
    section: "connection",
    helpText: "Пароль сервера Redis",
    redisType: null,
    secret: true,
  },
  {
    name: "username",
    label: "Имя пользователя",
    type: "string",
    section: "connection",
    helpText: "Имя пользователя сервера Redis (если требуется)",
    redisType: null,
  },
  {
    name: "redis_startup_nodes",
    label: "Startup-узлы",
    type: "list",
    section: "cluster",
    helpText: 'Список startup-узлов Redis Cluster (напр. [{"host": "127.0.0.1", "port": "7001"}])',
    redisType: "cluster",
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    label: "Узлы Sentinel",
    type: "list",
    section: "sentinel",
    helpText: 'Список узлов Sentinel (напр. [["localhost", 26379]])',
    redisType: "sentinel",
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    label: "Имя сервиса",
    type: "string",
    section: "sentinel",
    helpText: "Имя master-сервиса для Redis Sentinel",
    redisType: "sentinel",
  },
  {
    name: "sentinel_password",
    label: "Пароль Sentinel",
    type: "password",
    section: "sentinel",
    helpText: "Пароль для аутентификации Redis Sentinel",
    redisType: "sentinel",
    secret: true,
  },
  {
    name: "similarity_threshold",
    label: "Порог схожести",
    type: "float",
    section: "semantic",
    helpText: "Порог схожести для семантического кэша",
    redisType: "semantic",
    defaultValue: 0.8,
    rules: [numberRule],
  },
  {
    name: "redis_semantic_cache_embedding_model",
    label: "Модель эмбеддингов",
    type: "model-select",
    section: "semantic",
    helpText: "Модель эмбеддингов для семантического кэша",
    redisType: "semantic",
  },
  {
    name: "semantic_cache_scope",
    label: "Область семантического кэша",
    type: "select",
    section: "semantic",
    helpText:
      "Кто может разделять попадание в семантический кэш. «Ключ» разделяет попадания между всеми конечными пользователями ключа/команды/организации. «Конечный пользователь» изолирует по пользователю; запросы без конечного пользователя используют область ключа.",
    redisType: "semantic",
    defaultValue: "key",
    options: [
      { value: "key", label: "Ключ (общий для всех конечных пользователей ключа/команды/организации)" },
      { value: "end_user", label: "Конечный пользователь (изоляция по пользователю)" },
    ],
  },
  {
    name: "ssl",
    label: "SSL",
    type: "boolean",
    section: "ssl",
    helpText: "Включить подключение SSL/TLS",
    redisType: null,
    defaultValue: false,
  },
  {
    name: "ssl_cert_reqs",
    label: "Требования к SSL-сертификату",
    type: "string",
    section: "ssl",
    helpText: "Требования к SSL-сертификату (None, CERT_REQUIRED, CERT_OPTIONAL)",
    redisType: null,
  },
  {
    name: "ssl_check_hostname",
    label: "Проверять имя хоста SSL",
    type: "boolean",
    section: "ssl",
    helpText: "Включить проверку имени хоста SSL",
    redisType: null,
    defaultValue: false,
  },
  {
    name: "namespace",
    label: "Пространство имён",
    type: "string",
    section: "cacheManagement",
    helpText: "Префикс пространства имён для ключей кэша",
    redisType: null,
  },
  {
    name: "ttl",
    label: "TTL (секунды)",
    type: "float",
    section: "cacheManagement",
    helpText: "Время жизни записей кэша в секундах",
    redisType: null,
    rules: [numberRule],
  },
  {
    name: "max_connections",
    label: "Макс. соединений",
    type: "integer",
    section: "cacheManagement",
    helpText: "Максимальное число соединений в пуле",
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "gcp_service_account",
    label: "Сервисный аккаунт GCP",
    type: "string",
    section: "gcp",
    helpText:
      "Сервисный аккаунт GCP для аутентификации IAM (напр. projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com)",
    redisType: null,
  },
  {
    name: "gcp_ssl_ca_certs",
    label: "SSL CA-серты GCP",
    type: "string",
    section: "gcp",
    helpText: "Путь к файлу SSL CA-сертификата для GCP Memorystore Redis",
    redisType: null,
  },
];
