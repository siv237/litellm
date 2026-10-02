import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeOpenAIEmbeddingsЗапрос } from "./embeddings_api";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "https://example.com"),
  getГлобальноLitellmHeaderName: vi.fn(() => "Authorization"),
}));

describe("embeddings_api", () => {
  const mockUpdateEmbeddingsUI = vi.fn();
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockResolvedЗначение({
      ok: true,
      json: async () => ({
        data: [
          {
            embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
            index: 0,
            object: "embedding",
          },
        ],
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "text-embedding-3-small",
        object: "list",
      }),
      text: async () => "",
    } as Ответ);

    // @ts-ignore - assigning to global for test environment
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearВсеMocks();
  });

  it("should make a request to the embeddings endpoint", async () => {
    await makeOpenAIEmbeddingsЗапрос(
      "Hello, world!",
      mockUpdateEmbeddingsUI,
      "text-embedding-3-small",
      "1234567890",
      [],
    );

    expect(mockFetch).toHaveBeenCalledВремяs(1);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer 1234567890",
      },
      body: JSON.stringify({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "text-embedding-3-small",
        input: "Hello, world!",
      }),
    });
    expect(mockUpdateEmbeddingsUI).toHaveBeenCalledWith(
      JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5]),
      "text-embedding-3-small",
    );
  });

  it("should not include encoding_format when making the request", async () => {
    await makeOpenAIEmbeddingsЗапрос("Sample text", mockUpdateEmbeddingsUI, "text-embedding-3-small", "abcdef", []);

    const fetchCall = mockFetch.mock.calls[0];
    const options = fetchCall[1] as ЗапросInit;
    const body = options.body as string;
    const parsedBody = JSON.parse(body);

    expect(parsedBody).not.toHaveСвойство("encoding_format");
    expect(parsedBody).toEqual({
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "text-embedding-3-small",
      input: "Sample text",
    });
  });
});
