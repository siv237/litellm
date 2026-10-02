import { beforeEach, describe, expect, it, vi } from "vitest";
import type { РежимlGroup } from "@/components/llm_calls/fetch_models";
import { determineEndpointType, filterModelsForЭндпоинт, isModelCompatibleWithЭндпоинт } from "./ЭндпоинтUtils";
import { ЭндпоинтType } from "@/components/chat_ui/mode_endpoint_mapping";

vi.mock("@/components/chat_ui/mode_endpoint_mapping", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/chat_ui/mode_endpoint_mapping")>();
  return {
    ...actual,
    getEndpointType: vi.fn(actual.getEndpointType),
  };
});

import { getEndpointType } from "@/components/chat_ui/mode_endpoint_mapping";

describe("determineEndpointType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the correct endpoint type when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is found and has a valid mode", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo",
        mode: "chat",
      },
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "dall-e-3",
        mode: "image_generation",
      },
    ];

    // Mock getEndpointType to return IMAGE for image_generation mode
    vi.mocked(getEndpointType).mockReturnЗначение(ЭндпоинтType.IMAGE);

    const result = determineEndpointType("dall-e-3", mockModelInfo);

    expect(getEndpointType).toHaveBeenCalledWith("image_generation");
    expect(result).toBe(ЭндпоинтType.IMAGE);
  });

  it("should return CHAT endpoint type when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is found but has no mode", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo",
        // No mode property
      },
    ];

    const result = determineEndpointType("gpt-3.5-turbo", mockModelInfo);

    expect(getEndpointType).not.toHaveBeenCalled();
    expect(result).toBe(ЭндпоинтType.CHAT);
  });

  it("should return CHAT endpoint type when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is not found in Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo",
        mode: "chat",
      },
    ];

    const result = determineEndpointType("non-existent-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);

    expect(getEndpointType).not.toHaveBeenCalled();
    expect(result).toBe(ЭндпоинтType.CHAT);
  });

  it("should return CHAT endpoint type when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo array is empty", () => {
    const mockModelInfo: РежимlGroup[] = [];

    const result = determineEndpointType("any-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);

    expect(getEndpointType).not.toHaveBeenCalled();
    expect(result).toBe(ЭндпоинтType.CHAT);
  });

  it("should handle different mode types correctly", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "tts-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        mode: "audio_speech",
      },
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "whisper-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        mode: "audio_transcription",
      },
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "embedding-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        mode: "embedding",
      },
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "video-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        mode: "video_generation",
      },
    ];

    // Test speech mode
    vi.mocked(getEndpointType).mockReturnValueOnce(ЭндпоинтType.SPEECH);
    const speechРезультат = determineEndpointType("tts-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);
    expect(getEndpointType).toHaveBeenCalledWith("audio_speech");
    expect(speechРезультат).toBe(ЭндпоинтType.SPEECH);

    // Reset mock for next test
    vi.clearAllMocks();

    // Test transcription mode
    vi.mocked(getEndpointType).mockReturnValueOnce(ЭндпоинтType.TRANSCRIPTION);
    const transcriptionРезультат = determineEndpointType("whisper-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);
    expect(getEndpointType).toHaveBeenCalledWith("audio_transcription");
    expect(transcriptionРезультат).toBe(ЭндпоинтType.TRANSCRIPTION);

    // Reset mock for next test
    vi.clearAllMocks();

    // Test embedding mode
    vi.mocked(getEndpointType).mockReturnValueOnce(ЭндпоинтType.EMBEDDINGS);
    const embeddingРезультат = determineEndpointType("embedding-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);
    expect(getEndpointType).toHaveBeenCalledWith("embedding");
    expect(embeddingРезультат).toBe(ЭндпоинтType.EMBEDDINGS);

    // Reset mock for next test
    vi.clearAllMocks();

    // Test video mode
    vi.mocked(getEndpointType).mockReturnValueOnce(ЭндпоинтType.VIDEO);
    const videoРезультат = determineEndpointType("video-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);
    expect(getEndpointType).toHaveBeenCalledWith("video_generation");
    expect(videoРезультат).toBe(ЭндпоинтType.VIDEO);
  });

  it("should prioritize the first matching Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию when there are duplicates", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo",
        mode: "chat",
      },
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo",
        mode: "image_generation", // Different mode for same Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name
      },
    ];

    vi.mocked(getEndpointType).mockReturnЗначение(ЭндпоинтType.CHAT);

    const result = determineEndpointType("gpt-3.5-turbo", mockModelInfo);

    expect(getEndpointType).toHaveBeenCalledWith("chat");
    expect(result).toBe(ЭндпоинтType.CHAT);
  });

  it("should handle Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs with undefined mode property explicitly set", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        mode: undefined,
      },
    ];

    const result = determineEndpointType("test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);

    expect(getEndpointType).not.toHaveBeenCalled();
    expect(result).toBe(ЭндпоинтType.CHAT);
  });

  it("should handle Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs with empty string mode", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию",
        mode: "",
      },
    ];

    const result = determineEndpointType("test-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", mockModelInfo);

    // Empty string is falsy, so getEndpointType should not be called
    expect(getEndpointType).not.toHaveBeenCalled();
    expect(result).toBe(ЭндпоинтType.CHAT);
  });

  it("should handle case-sensitive Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group matching", () => {
    const mockModelInfo: РежимlGroup[] = [
      {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "GPT-3.5-TURBO",
        mode: "chat",
      },
    ];

    vi.mocked(getEndpointType).mockReturnЗначение(ЭндпоинтType.CHAT);

    const result = determineEndpointType("gpt-3.5-turbo", mockModelInfo);

    expect(getEndpointType).not.toHaveBeenCalled();
    expect(result).toBe(ЭндпоинтType.CHAT);
  });
});

describe("isModelCompatibleWithЭндпоинт / filterModelsForЭндпоинт", () => {
  beforeEach(async () => {
    const actual = await vi.importActual<typeof import("@/components/chat_ui/mode_endpoint_mapping")>(
      "@/components/chat_ui/mode_endpoint_mapping",
    );
    vi.mocked(getEndpointType).mockImplementation(actual.getEndpointType);
  });

  it("keeps Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs with no mode for every endpoint", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "custom-proxy-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" };
    expect(isModelCompatibleWithЭндпоинт(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, ЭндпоинтType.CHAT)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, ЭндпоинтType.REALTIME)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию, ЭндпоинтType.SPEECH)).toBe(true);
  });

  it("keeps chat Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for responses, anthropic messages, and interactions", () => {
    const chatModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4o", mode: "chat" };
    expect(isModelCompatibleWithЭндпоинт(chatModel, ЭндпоинтType.RESPONSES)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(chatModel, ЭндпоинтType.ANTHROPIC_MESSAGES)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(chatModel, ЭндпоинтType.INTERACTIONS)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(chatModel, ЭндпоинтType.SPEECH)).toBe(false);
  });

  it("keeps image Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for image_edits", () => {
    const imageModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "dall-e-3", mode: "image_generation" };
    expect(isModelCompatibleWithЭндпоинт(imageModel, ЭндпоинтType.IMAGE_EDITS)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(imageModel, ЭндпоинтType.IMAGE)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(imageModel, ЭндпоинтType.CHAT)).toBe(false);
  });

  it("keeps only realtime Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for the realtime endpoint", () => {
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: РежимlGroup[] = [
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4o", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-realtime", mode: "realtime" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "no-mode" },
    ];

    expect(filterModelsForЭндпоинт(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs, ЭндпоинтType.REALTIME).map((m) => m.model_group)).toEqual([
      "gpt-realtime",
      "no-mode",
    ]);
  });

  it("excludes unknown modes from conversational endpoints", () => {
    const batchModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "batch-job", mode: "batch" };
    const rerankModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "reranker", mode: "rerank" };
    expect(isModelCompatibleWithЭндпоинт(batchModel, ЭндпоинтType.CHAT)).toBe(false);
    expect(isModelCompatibleWithЭндпоинт(rerankModel, ЭндпоинтType.RESPONSES)).toBe(false);
    expect(isModelCompatibleWithЭндпоинт(batchModel, ЭндпоинтType.REALTIME)).toBe(false);
  });

  it("keeps completion-mode Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for the chat endpoint", () => {
    const completionModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "davinci-002", mode: "completion" };
    expect(isModelCompatibleWithЭндпоинт(completionModel, ЭндпоинтType.CHAT)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(completionModel, ЭндпоинтType.RESPONSES)).toBe(true);
    expect(isModelCompatibleWithЭндпоинт(completionModel, ЭндпоинтType.SPEECH)).toBe(false);
  });

  it("keeps image-edit Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs for the image-edits endpoint using the mode the backend sends", () => {
    const imageEditModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-image-1", mode: "image_edit" };
    const imageModel: РежимlGroup = { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "dall-e-3", mode: "image_generation" };

    expect(isModelCompatibleWithЭндпоинт(imageEditModel, ЭндпоинтType.IMAGE_EDITS)).toBe(true);
    expect(
      filterModelsForЭндпоинт([imageEditModel, imageModel], ЭндпоинтType.IMAGE_EDITS).map((m) => m.model_group),
    ).toEqual(["gpt-image-1", "dall-e-3"]);
  });
});
