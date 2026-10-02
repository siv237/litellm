import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import AgentСтоимостьView from "./agent_cost_view";
import type { Agent } from "@/components/agents/types";

const makeAgent = (litellmParams: Agent["litellm_params"]): Agent => ({
  agent_id: "agent-1",
  agent_name: "Test Agent",
  litellm_params: litellmParams,
});

describe("AgentСтоимостьView", () => {
  it("renders nothing when the agent has no cost configuration at all", () => {
    const { container } = renderWithПровайдерs(<AgentСтоимостьView agent={makeAgent({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders every configured cost with a dollar-prefixed value", () => {
    const fullyPricedParams = {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      cost_per_query: 0.05,
      input_cost_per_token: 0.000012,
      выходput_cost_per_token: 0.000034,
    };
    renderWithПровайдерs(<AgentСтоимостьView agent={makeAgent(fullyPricedParams)} />);

    expect(screen.getByText("Стоимость Конфигурацияuration")).toBeInTheDocument();
    expect(screen.getByText("Стоимость Per Запрос")).toBeInTheDocument();
    expect(screen.getByText("$0.05")).toBeInTheDocument();
    expect(screen.getByText("Вход Стоимость Per Токен")).toBeInTheDocument();
    expect(screen.getByText("$0.000012")).toBeInTheDocument();
    expect(screen.getByText("Выход Стоимость Per Токен")).toBeInTheDocument();
    expect(screen.getByText("$0.000034")).toBeInTheDocument();
  });

  it("omits the rows whose cost is not configured", () => {
    renderWithПровайдерs(<AgentСтоимостьView agent={makeAgent({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4", cost_per_query: 0.25 })} />);

    expect(screen.getByText("Стоимость Per Запрос")).toBeInTheDocument();
    expect(screen.getByText("$0.25")).toBeInTheDocument();
    expect(screen.queryByText("Вход Стоимость Per Токен")).not.toBeInTheDocument();
    expect(screen.queryByText("Выход Стоимость Per Токен")).not.toBeInTheDocument();
  });

  it("still renders a zero cost rather than treating it as unset", () => {
    renderWithПровайдерs(<AgentСтоимостьView agent={makeAgent({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4", cost_per_query: 0 })} />);

    expect(screen.getByText("Стоимость Конфигурацияuration")).toBeInTheDocument();
    expect(screen.getByText("Стоимость Per Запрос")).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
  });
});
