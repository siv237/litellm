import { getProviderLogoAndName, Providers, providerLogoMap } from "@/components/provider_info_helpers";
import milvusLogo from "../../public/assets/logos/milvus.svg";
import mongodbLogo from "../../public/assets/logos/mongodb.svg";
import postgresqlLogo from "../../public/assets/logos/postgresql.svg";
import s3VectorLogo from "../../public/assets/logos/s3_vector.png";
import valkeyLogo from "../../public/assets/logos/valkey.svg";

export enum VectorStoreProviders {
  Bedrock = "Amazon Bedrock",
  S3Vectors = "Amazon S3 Vectors",
  PgVector = "PostgreSQL pgvector (LiteLLM Connector)",
  VertexRagEngine = "Vertex AI RAG Engine",
  VertexAiSearch = "Vertex AI Search",
  OpenAI = "OpenAI",
  Azure = "Azure OpenAI",
  Milvus = "Milvus",
  MongoDB = "MongoDB (BETA)",
  Valkey = "Valkey",
}

export const vectorStoreProviderMap: Record<string, string> = {
  Bedrock: "bedrock",
  PgVector: "pg_vector",
  VertexRagEngine: "vertex_ai",
  VertexAiSearch: "vertex_ai/search_api",
  OpenAI: "openai",
  Azure: "azure",
  Milvus: "milvus",
  MongoDB: "mongodb",
  S3Vectors: "s3_vectors",
  Valkey: "valkey",
};

export const vectorStoreProviderLogoMap: Record<string, string> = {
  [VectorStoreProviders.Bedrock]: providerLogoMap[Providers.Bedrock] ?? "",
  [VectorStoreProviders.PgVector]: postgresqlLogo.src,
  [VectorStoreProviders.VertexRagEngine]: providerLogoMap[Providers.Vertex_AI] ?? "",
  [VectorStoreProviders.VertexAiSearch]: providerLogoMap[Providers.Vertex_AI] ?? "",
  [VectorStoreProviders.OpenAI]: providerLogoMap[Providers.OpenAI] ?? "",
  [VectorStoreProviders.Azure]: providerLogoMap[Providers.Azure] ?? "",
  [VectorStoreProviders.Milvus]: milvusLogo.src,
  [VectorStoreProviders.MongoDB]: mongodbLogo.src,
  [VectorStoreProviders.S3Vectors]: s3VectorLogo.src,
  [VectorStoreProviders.Valkey]: valkeyLogo.src,
};

// Define field types for provider-specific configurations
export interface VectorStoreFieldConfig {
  name: string;
  label: string;
  tooltip: string;
  placeholder?: string;
  required: boolean;
  type?: "text" | "password" | "select";
  options?: { value: string; label: string }[];
  initialValue?: string;
}

// Provider-specific field configurations
export const vectorStoreProviderFields: Record<string, VectorStoreFieldConfig[]> = {
  bedrock: [],
  pg_vector: [
    {
      name: "api_base",
      label: "Базовый URL API",
      tooltip: "Введите базовый URL развёрнутого сервера litellm-pgvector (напр. http://your-server:8000)",
      placeholder: "http://your-deployed-server:8000",
      required: true,
      type: "text",
    },
    {
      name: "api_key",
      label: "API-ключ",
      tooltip: "Введите API-ключ развёрнутого сервера litellm-pgvector",
      placeholder: "your-deployed-api-key",
      required: true,
      type: "password",
    },
  ],
  vertex_rag_engine: [],
  "vertex_ai/search_api": [
    {
      name: "vertex_project",
      label: "Проект Vertex",
      tooltip: "ID проекта Google Cloud, в котором размещено хранилище данных Vertex AI Search.",
      placeholder: "my-gcp-project-id",
      required: true,
      type: "text",
    },
    {
      name: "vertex_location",
      label: "Регион Vertex",
      tooltip: "Расположение хранилища данных Vertex AI Search. Допустимы global, us или eu.",
      required: true,
      type: "select",
      options: [
        { value: "global", label: "global" },
        { value: "us", label: "us" },
        { value: "eu", label: "eu" },
      ],
      initialValue: "global",
    },
    {
      name: "vertex_collection_id",
      label: "ID коллекции (необязательно)",
      tooltip: "ID коллекции Discovery Engine. Оставьте пустым, чтобы использовать коллекцию по умолчанию.",
      placeholder: "напр. my-custom-collection",
      required: false,
      type: "text",
    },
    {
      name: "vertex_engine_id",
      label: "ID движка (необязательно)",
      tooltip:
        "ID приложения поиска (движка). Обязателен для хранилищ website, healthcare и подключаемых (Workspace, Slack, Jira и т.п.), поскольку их поиск идёт через движок. Оставьте пустым для прямого запроса к хранилищу данных.",
      placeholder: "напр. my-search-app_1234567890",
      required: false,
      type: "text",
    },
  ],
  openai: [
    {
      name: "api_key",
      label: "API-ключ",
      tooltip: "Введите API-ключ OpenAI",
      placeholder: "sk-...",
      required: true,
      type: "password",
    },
  ],
  azure: [
    {
      name: "api_key",
      label: "API-ключ",
      tooltip: "Введите API-ключ Azure OpenAI",
      placeholder: "your-azure-api-key",
      required: true,
      type: "password",
    },
    {
      name: "api_base",
      label: "Базовый URL API",
      tooltip: "Введите эндпоинт Azure OpenAI (напр. https://your-resource.openai.azure.com/)",
      placeholder: "https://your-resource.openai.azure.com/",
      required: true,
      type: "text",
    },
  ],
  milvus: [
    {
      name: "api_key",
      label: "API-ключ",
      tooltip:
        "Чтобы получить токен, соедините двоеточием (:) имя пользователя и пароль для доступа к вашему экземпляру Milvus (напр. username:password)",
      placeholder: "username:password или API-ключ",
      required: true,
      type: "password",
    },
    {
      name: "api_base",
      label: "Базовый URL API",
      tooltip: "Введите эндпоинт Milvus (напр. https://your-milvus-endpoint.com/)",
      placeholder: "https://your-milvus-endpoint.com/",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      label: "Модель эмбеддингов",
      tooltip: "Выберите модель эмбеддингов",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
  ],
  mongodb: [
    {
      name: "api_base",
      label: "URL sidecar-сервиса",
      tooltip: "Используйте HTTPS для удалённого sidecar или HTTP с loopback-адресом для sidecar на том же хосте или Pod",
      placeholder: "http://127.0.0.1:8080",
      required: true,
      type: "text",
    },
    {
      name: "api_key",
      label: "API-ключ sidecar",
      tooltip: "Значение MONGODB_SIDECAR_API_KEY, настроенное в вашем MongoDB sidecar",
      placeholder: "Введите API-ключ sidecar",
      required: true,
      type: "password",
    },
    {
      name: "mongodb_database",
      label: "База данных",
      tooltip: "База данных MongoDB с коллекцией, которую нужно искать",
      placeholder: "sample_mflix",
      required: true,
      type: "text",
    },
    {
      name: "mongodb_collection",
      label: "Коллекция",
      tooltip: "Коллекция, на которой построен индекс MongoDB Vector Search",
      placeholder: "embedded_movies",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      label: "Модель эмбеддингов",
      tooltip:
        "The embedding model on this proxy that created the vectors already stored in your collection. LiteLLM embeds every search query with it, so it must be the same model. A different model of the same size will not error, it will just return wrong results. Add it under Models first if it is not listed",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
    {
      name: "mongodb_embedding_field",
      label: "Имя векторного поля",
      tooltip:
        "Поле в каждом документе, содержащее его эмбеддинг. Должно совпадать с путём, на котором создан индекс MongoDB Vector Search (по умолчанию: embedding)",
      placeholder: "embedding",
      required: false,
      type: "text",
      initialValue: "embedding",
    },
    {
      name: "mongodb_text_field",
      label: "Текстовое поле",
      tooltip:
        "Поле в каждом документе с читаемым текстом. LiteLLM возвращает его в результатах поиска; допускается путь через точку, напр. metadata.body (по умолчанию: text)",
      placeholder: "text",
      required: false,
      type: "text",
      initialValue: "text",
    },
    {
      name: "mongodb_num_candidates",
      label: "Число кандидатов",
      tooltip:
        "How many nearest neighbours MongoDB examines before returning the top results. Higher is more accurate and slower. Leave blank to let LiteLLM scale it with the requested result count",
      placeholder: "100",
      required: false,
      type: "text",
    },
  ],
  valkey: [
    {
      name: "valkey_host",
      label: "Хост Valkey",
      tooltip: "Имя хоста или IP сервера Valkey без redis:// и порта (напр. my-valkey.example.com)",
      placeholder: "my-valkey.example.com",
      required: true,
      type: "text",
    },
    {
      name: "valkey_port",
      label: "Порт Valkey",
      tooltip: "Порт, который слушает сервер Valkey. Оставьте 6379, если меняли",
      placeholder: "6379",
      required: false,
      type: "text",
      initialValue: "6379",
    },
    {
      name: "valkey_password",
      label: "Пароль Valkey",
      tooltip: "Пароль для входа на сервер Valkey. Оставьте пустым, если пароля нет",
      required: false,
      type: "password",
    },
    {
      name: "valkey_ssl",
      label: "Использовать TLS",
      tooltip:
        "Установите true, если сервер Valkey требует шифрованное соединение (TLS), например AWS ElastiCache с включённым шифрованием в транзите",
      required: false,
      type: "select",
      options: [
        { value: "false", label: "false" },
        { value: "true", label: "true" },
      ],
      initialValue: "false",
    },
    {
      name: "embedding_model",
      label: "Модель эмбеддингов",
      tooltip:
        "Модель эмбеддингов на этом прокси, которой созданы эмбеддинги, уже сохранённые в индексе Valkey. LiteLLM ею же эмбеддит и поисковые запросы, поэтому модель должна быть та же — иначе результаты будут неверны. Если её нет в списке, сначала добавьте её в «Модели»",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
    {
      name: "valkey_text_field",
      label: "Текстовое поле",
      tooltip:
        "Поле с читаемым текстом в каждом сохранённом документе. LiteLLM возвращает его в результатах поиска. Должно совпадать со способом сохранения документов (по умолчанию: text)",
      placeholder: "text",
      required: false,
      type: "text",
      initialValue: "text",
    },
    {
      name: "valkey_embedding_field",
      label: "Имя векторного поля",
      tooltip:
        "Поле с эмбеддингом в каждом сохранённом документе. LiteLLM ищет по нему, поэтому оно должно совпадать с полем, на котором создан индекс (по умолчанию: embedding)",
      placeholder: "embedding",
      required: false,
      type: "text",
      initialValue: "embedding",
    },
  ],
  s3_vectors: [
    {
      name: "vector_bucket_name",
      label: "Имя бакета векторов",
      tooltip: "Имя бакета S3 для векторного хранилища (будет создан автоматически, если отсутствует)",
      placeholder: "my-vector-bucket",
      required: true,
      type: "text",
    },
    {
      name: "index_name",
      label: "Имя индекса",
      tooltip: "Имя векторного индекса (необязательно, при отсутствии генерируется автоматически)",
      placeholder: "my-vector-index",
      required: false,
      type: "text",
    },
    {
      name: "aws_region_name",
      label: "Регион AWS",
      tooltip: "Регион AWS, где расположен бакет S3 (напр. us-west-2)",
      placeholder: "us-west-2",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      label: "Модель эмбеддингов",
      tooltip: "Выберите модель эмбеддингов для генерации векторов",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
  ],
};

export const getVectorStoreProviderLogoAndName = (providerValue: string): { logo: string; displayName: string } => {
  const enumKey = Object.keys(vectorStoreProviderMap).find(
    (key) => vectorStoreProviderMap[key].toLowerCase() === providerValue.toLowerCase(),
  );
  if (!enumKey) {
    return getProviderLogoAndName(providerValue);
  }
  const displayName = VectorStoreProviders[enumKey as keyof typeof VectorStoreProviders];
  return { logo: vectorStoreProviderLogoMap[displayName], displayName };
};

export const getProviderSpecificFields = (providerValue: string): VectorStoreFieldConfig[] => {
  return vectorStoreProviderFields[providerValue] || [];
};
