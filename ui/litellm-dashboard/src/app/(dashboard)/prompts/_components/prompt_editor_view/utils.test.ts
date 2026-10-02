import { describe, expect, it } from "vitest";
import { PromptType } from "./types";
import {
  convertToDotPrompt,
  extractVariables,
  getВерсияNumber,
  parseExistingPrompt,
  stripВерсияFromPromptId,
} from "./utils";

describe("extractVariables", () => {
  it("should extract variables from messages", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "",
      messages: [
        { role: "user", content: "Hello {{name}}, how are you?" },
        { role: "assistant", content: "I am fine {{name}}" },
      ],
    };

    const result = extractVariables(prompt);
    expect(result).toEqual(["name"]);
  });

  it("should extract variables from developer message", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "You are {{role}} assistant",
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = extractVariables(prompt);
    expect(result).toEqual(["role"]);
  });

  it("should extract variables from both messages and developer message", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "You are {{role}} assistant",
      messages: [
        { role: "user", content: "Hello {{name}}" },
        { role: "assistant", content: "Hi {{name}}, I am {{role}}" },
      ],
    };

    const result = extractVariables(prompt);
    expect(result.sort()).toEqual(["name", "role"].sort());
  });

  it("should return empty array when no variables present", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "You are an assistant",
      messages: [{ role: "user", content: "Hello world" }],
    };

    const result = extractVariables(prompt);
    expect(result).toEqual([]);
  });

  it("should handle duplicate variables", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "",
      messages: [
        { role: "user", content: "Hello {{name}}" },
        { role: "assistant", content: "Hi {{name}} again" },
      ],
    };

    const result = extractVariables(prompt);
    expect(result).toEqual(["name"]);
  });
});

describe("convertToDotPrompt", () => {
  it("should convert basic prompt to dot prompt format", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "",
      messages: [{ role: "user", content: "Hello world" }],
    };

    const result = convertToDotPrompt(prompt);
    expect(result).toContain("---");
    expect(result).toContain("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4");
    expect(result).toContain("input:");
    expect(result).toContain("schema:");
    expect(result).toContain("выходput:");
    expect(result).toContain("format: text");
    expect(result).toContain("User: Hello world");
    const cleared = convertToDotPrompt({ ...prompt, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: null });
    expect(cleared).toBe(result.replace("Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4\n", ""));
  });

  it("should include config parameters when set", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {
        temperature: 0.7,
        max_tokens: 100,
        top_p: 0.9,
      },
      tools: [],
      developerСообщение: "",
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = convertToDotPrompt(prompt);
    expect(result).toContain("temperature: 0.7");
    expect(result).toContain("max_tokens: 100");
    expect(result).toContain("top_p: 0.9");
  });

  it("should include input schema with variables", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "",
      messages: [{ role: "user", content: "Hello {{name}}" }],
    };

    const result = convertToDotPrompt(prompt);
    expect(result).toContain("input:");
    expect(result).toContain("schema:");
    expect(result).toContain("name: string");
  });

  it("should include developer message when present", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "You are a helpful assistant",
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = convertToDotPrompt(prompt);
    expect(result).toContain("Developer: You are a helpful assistant");
  });

  it("should include tools when present", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [
        {
          name: "get_weather",
          description: "Get weather information",
          json: '{"type": "function", "function": {"name": "get_weather"}}',
        },
      ],
      developerСообщение: "",
      messages: [{ role: "user", content: "Hello" }],
    };

    const result = convertToDotPrompt(prompt);
    expect(result).toContain("tools:");
    expect(result).toContain('{"type":"function","function":{"name":"get_weather"}}');
  });

  it("should handle multiple messages with different roles", () => {
    const prompt: PromptType = {
      name: "test",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      config: {},
      tools: [],
      developerСообщение: "",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "How are you?" },
      ],
    };

    const result = convertToDotPrompt(prompt);
    expect(result).toContain("User: Hello");
    expect(result).toContain("Assistant: Hi there");
    expect(result).toContain("User: How are you?");
  });
});

describe("parseExistingPrompt", () => {
  it("should keep saved prompts with missing or blank Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs unassigned", () => {
    for (const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюLine of ["", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: \n"]) {
      const prompt = parseExistingPrompt({
        prompt_spec: {
          prompt_id: "unassigned-prompt",
          litellm_params: { dotprompt_content: `---\n${Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюLine}temperature: 0\n---\nUser: Keep this message` },
        },
      });

      expect(prompt.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toBeNull();
      expect(convertToDotPrompt(prompt)).not.toMatch(/^Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию:/m);
    }
  });

  it("should parse basic dotprompt content", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: `---
Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4
input:
  schema:
выходput:
  format: text
---

User: Hello world`,
        },
        prompt_id: "test-prompt",
      },
    };

    const result = parseExistingPrompt(apiОтвет);
    expect(result.name).toBe("test-prompt");
    expect(result.Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toBe("gpt-4");
    expect(result.messages).toEqual([{ role: "user", content: "Hello world" }]);
  });

  it("should parse with config parameters", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: `---
Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4
temperature: 0.7
max_tokens: 100
top_p: 0.9
input:
  schema:
выходput:
  format: text
---

User: Hello`,
        },
        prompt_id: "test-prompt",
      },
    };

    const result = parseExistingPrompt(apiОтвет);
    expect(result.config.temperature).toBe(0.7);
    expect(result.config.max_tokens).toBe(100);
    expect(result.config.top_p).toBe(0.9);
  });

  it("should parse with developer message", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: `---
Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4
input:
  schema:
выходput:
  format: text
---

Developer: You are a helpful assistant

User: Hello`,
        },
        prompt_id: "test-prompt",
      },
    };

    const result = parseExistingPrompt(apiОтвет);
    expect(result.developerСообщение).toBe("You are a helpful assistant");
  });

  it("should parse multiple messages", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: `---
Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4
input:
  schema:
выходput:
  format: text
---

User: Hello
How are you?

Assistant: I am fine
Thank you for asking

User: Great!`,
        },
        prompt_id: "test-prompt",
      },
    };

    const result = parseExistingPrompt(apiОтвет);
    expect(result.messages).toEqual([
      { role: "user", content: "Hello\nHow are you?" },
      { role: "assistant", content: "I am fine\nThank you for asking" },
      { role: "user", content: "Great!" },
    ]);
  });

  it("should handle prompt with version suffix", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: `---
Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4
input:
  schema:
выходput:
  format: text
---

User: Hello`,
        },
        prompt_id: "test-prompt.v2",
      },
    };

    const result = parseExistingPrompt(apiОтвет);
    expect(result.name).toBe("test-prompt");
  });

  it("should throw error when no dotprompt_content", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {},
      },
    };

    expect(() => parseExistingPrompt(apiОтвет)).toThrow("No dotprompt_content found in API response");
  });

  it("should throw error for invalid dotprompt format", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: "invalid format",
        },
      },
    };

    expect(() => parseExistingPrompt(apiОтвет)).toThrow("Invalid dotprompt format");
  });

  it("should provide default values when parsing fails", () => {
    const apiОтвет = {
      prompt_spec: {
        litellm_params: {
          dotprompt_content: `---
Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: gpt-4
input:
  schema:
выходput:
  format: text
---

`,
        },
        prompt_id: "test-prompt",
      },
    };

    const result = parseExistingPrompt(apiОтвет);
    expect(result.messages).toEqual([
      { role: "user", content: "Введите task specifics. Use {{template_variables}} for dynamic inputs" },
    ]);
  });
});

describe("getВерсияNumber", () => {
  it("should return '1' for undefined promptId", () => {
    const result = getВерсияNumber(undefined);
    expect(result).toBe("1");
  });

  it("should return '1' for promptId withвыход version", () => {
    const result = getВерсияNumber("test-prompt");
    expect(result).toBe("1");
  });

  it("should extract version with dot separator", () => {
    const result = getВерсияNumber("test-prompt.v2");
    expect(result).toBe("2");
  });

  it("should extract version with underscore separator", () => {
    const result = getВерсияNumber("test-prompt_v3");
    expect(result).toBe("3");
  });

  it("should extract version with hyphen separator", () => {
    const result = getВерсияNumber("test-prompt-v4");
    expect(result).toBe("4");
  });

  it("should extract multi-digit version", () => {
    const result = getВерсияNumber("test-prompt.v123");
    expect(result).toBe("123");
  });
});

describe("stripВерсияFromPromptId", () => {
  it("should return empty string for undefined promptId", () => {
    const result = stripВерсияFromPromptId(undefined);
    expect(result).toBe("");
  });

  it("should return promptId unchanged when no version present", () => {
    const result = stripВерсияFromPromptId("test-prompt");
    expect(result).toBe("test-prompt");
  });

  it("should strip version with dot separator", () => {
    const result = stripВерсияFromPromptId("test-prompt.v2");
    expect(result).toBe("test-prompt");
  });

  it("should strip version with underscore separator", () => {
    const result = stripВерсияFromPromptId("test-prompt_v3");
    expect(result).toBe("test-prompt");
  });

  it("should strip version with hyphen separator", () => {
    const result = stripВерсияFromPromptId("test-prompt-v4");
    expect(result).toBe("test-prompt");
  });

  it("should strip multi-digit version", () => {
    const result = stripВерсияFromPromptId("test-prompt.v123");
    expect(result).toBe("test-prompt");
  });
});
