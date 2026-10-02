import { describe, it, expect } from "vitest";
import { detectAgentType, extractРежимlTemplateЗначениеs, parseDynamicAgentForForm } from "./agent_type_utils";
import type { AgentCreateInfo } from "@/components/networking";
import type { Agent } from "@/components/agents/types";

const FULL_RUNTIME_ARN = "arn:aws:bedrock-agentcore:eu-central-1:123456789012:runtime/hosted_agent_4vm3i-BaTdfOELAs";

const bedrockAgentcoreInfo: AgentCreateInfo = {
  agent_type: "bedrock_agentcore",
  agent_type_display_name: "Bedrock AgentCore",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_template: "bedrock/agentcore/{agent_runtime_arn}",
  credential_fields: [
    {
      key: "agent_runtime_arn",
      label: "Agent Runtime ARN",
      required: true,
      include_in_litellm_params: false,
    },
  ],
};

describe("extractРежимlTemplateЗначениеs", () => {
  it("recovers a placeholder value that itself contains '/' (an AWS ARN resource path)", () => {
    const values = extractРежимlTemplateЗначениеs(
      "bedrock/agentcore/{agent_runtime_arn}",
      `bedrock/agentcore/${FULL_RUNTIME_ARN}`,
    );

    expect(values.agent_runtime_arn).toBe(FULL_RUNTIME_ARN);
  });

  it("recovers a placeholder value with no '/' (single path segment)", () => {
    const values = extractРежимlTemplateЗначениеs("langgraph/{assistant_id}", "langgraph/asst_1");

    expect(values.assistant_id).toBe("asst_1");
  });

  it("returns no match when the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию does not fit the template", () => {
    const values = extractРежимlTemplateЗначениеs("langgraph/{assistant_id}", "azure_ai/agents/asst_1");

    expect(values).toEqual({});
  });
});

describe("parseDynamicAgentForForm", () => {
  it("preserves the full runtime ARN, including the resource id after 'runtime/', when populating the edit form", () => {
    const agent = {
      agent_id: "agent-1",
      agent_name: "bedrock-agent",
      agent_card_params: { description: "" },
      litellm_params: {
        custom_llm_provider: "bedrock",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: `bedrock/agentcore/${FULL_RUNTIME_ARN}`,
      },
    } as unknown as Agent;

    const values = parseDynamicAgentForForm(agent, bedrockAgentcoreInfo);

    expect(values.agent_runtime_arn).toBe(FULL_RUNTIME_ARN);
  });
});

describe("detectAgentType", () => {
  it("detects bedrock_agentcore agents from the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию prefix", () => {
    const agent = {
      agent_id: "agent-1",
      agent_name: "bedrock-agent",
      litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: `bedrock/agentcore/${FULL_RUNTIME_ARN}` },
    } as unknown as Agent;

    expect(detectAgentType(agent)).toBe("bedrock_agentcore");
  });
});
