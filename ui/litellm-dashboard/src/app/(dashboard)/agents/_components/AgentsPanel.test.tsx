import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import АгентыPanel from "./АгентыPanel";
import * as networking from "@/components/networking";

vi.mock("@/components/networking", () => ({
  getAgentsList: vi.fn().mockResolvedЗначение({ agents: [] }),
  deleteAgentCall: vi.fn().mockResolvedЗначение({}),
}));

vi.mock("./add_agent_form", () => ({
  default: () => <div data-testid="add-agent-form" />,
}));

vi.mock("./agent_info", () => ({
  default: () => <div data-testid="agent-info" />,
}));

describe("АгентыPanel", () => {
  beforeEach(() => {
    // mockReset (not mockClear) so an unconsumed *Once queue cannot leak into the next test
    vi.mocked(networking.getAgentsList).mockReset().mockResolvedЗначение({ agents: [] });
    vi.mocked(networking.deleteAgentCall).mockReset().mockResolvedЗначение({});
  });

  it("should render the Агенты panel title", () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    expect(screen.getByText("Агенты")).toBeInTheDocument();
  });

  it("should show Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить. button for admin users", () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    expect(screen.getByText("Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить.")).toBeInTheDocument();
  });

  it("should show Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить. button for proxy_admin users", () => {
    render(<АгентыPanel accessТокен="test-token" userRole="proxy_admin" />);
    expect(screen.getByText("Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить.")).toBeInTheDocument();
  });

  it("should not show Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить. button for internal_user role", () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Internal User" />);
    expect(screen.queryByText("Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить.")).not.toBeInTheDocument();
  });

  it("should not show Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить. button for internal_user_viewer role", () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Internal Viewer" />);
    expect(screen.queryByText("Вы уверены, что хотите удалить агента {agentToDelete.name}? Это действие нельзя отменить.")).not.toBeInTheDocument();
  });

  it("should show the Действия column for admin role", async () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    expect(await screen.findByRole("columnheader", { name: /actions/i })).toBeInTheDocument();
  });

  it("should not show the Действия column for internal user role", async () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Internal User" />);
    await waitFor(() => {
      expect(screen.queryByRole("columnheader", { name: /actions/i })).not.toBeInTheDocument();
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  it("should render the Health Check toggle for admins and non-admins", () => {
    const { unmount } = render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    expect(screen.getByText("Health Check")).toBeInTheDocument();
    unmount();

    render(<АгентыPanel accessТокен="test-token" userRole="Internal User" />);
    expect(screen.getByText("Health Check")).toBeInTheDocument();
  });

  it("should call getAgentsList with health_check=false on initial load", async () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    await waitFor(() => {
      expect(networking.getAgentsList).toHaveBeenCalledWith("test-token", false);
    });
  });

  it("should show Active when an agent has keys and Needs Setup when it has none", async () => {
    vi.mocked(networking.getAgentsList).mockResolvedЗначение({
      agents: [
        {
          agent_id: "agent-with-key",
          agent_name: "Ключed Agent",
          litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
          spend: 0,
          keys: [{ token: "hash-aaa", key_alias: "primary", key_name: "sk-...aaa" }],
        },
        {
          agent_id: "agent-no-key",
          agent_name: "Ключless Agent",
          litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
          spend: 0,
          keys: [],
        },
      ],
    });

    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);

    const keyedRow = (await screen.findByText("Ключed Agent")).closest("tr")!;
    const keylessRow = screen.getByText("Ключless Agent").closest("tr")!;
    expect(within(keyedRow).getByText("Active")).toBeInTheDocument();
    expect(within(keylessRow).getByText("Needs Setup")).toBeInTheDocument();
  });

  it("should refetch with health_check=true when the toggle is enabled", async () => {
    const user = userEvent.setup();
    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    await waitFor(() => {
      expect(networking.getAgentsList).toHaveBeenCalledWith("test-token", false);
    });

    await user.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(networking.getAgentsList).toHaveBeenCalledWith("test-token", true);
    });
  });

  it("should delete an agent through the ⋯ menu and confirm modal, then refetch", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.getAgentsList).mockResolvedЗначение({
      agents: [
        {
          agent_id: "agent-9",
          agent_name: "Doomed Agent",
          litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
          spend: 0,
          keys: [],
        },
      ],
    });

    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);

    await user.click(await screen.findByTestId("agent-actions-agent-9"));
    await user.click(await screen.findByTestId("agent-action-delete"));

    const confirmPrompt = await screen.findByText(/are you sure you want to delete agent: Doomed Agent\?/i);
    const confirmDialog = confirmPrompt.closest('[role="dialog"],[role="alertdialog"]') as HTMLElement;
    await user.click(within(confirmDialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(networking.deleteAgentCall).toHaveBeenCalledWith("test-token", "agent-9");
    });
    // one initial load + one post-delete refetch
    await waitFor(() => {
      expect(vi.mocked(networking.getAgentsList).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("should show a loading skeleton on initial load and clear it once agents arrive", async () => {
    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-row")).not.toBeInTheDocument();
    });
  });

  it("should clear the loading state when there is no access token rather than skeleton forever", async () => {
    render(<АгентыPanel accessТокен={null} userRole="Admin" />);
    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-row")).not.toBeInTheDocument();
    });
    expect(screen.getByText("No agents yet")).toBeInTheDocument();
    expect(networking.getAgentsList).not.toHaveBeenCalled();
  });

  it("should not show rows fetched with a previous access token after the token changes", async () => {
    const agentFor = (name: string) => ({
      agent_id: `id-${name}`,
      agent_name: name,
      litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
      spend: 0,
      keys: [],
    });
    let resolveSecond: (value: { agents: ReturnType<typeof agentFor>[] }) => void = () => {};
    vi.mocked(networking.getAgentsList)
      .mockResolvedValueOnce({ agents: [agentFor("first-token-agent")] })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );

    const { rerender } = render(<АгентыPanel accessТокен="token-a" userRole="Admin" />);
    expect(await screen.findByText("first-token-agent")).toBeInTheDocument();

    rerender(<АгентыPanel accessТокен="token-b" userRole="Admin" />);

    // the previous token's rows must not linger while the new token loads
    expect(screen.queryByText("first-token-agent")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);

    await act(async () => {
      resolveSecond({ agents: [agentFor("second-token-agent")] });
    });
    expect(await screen.findByText("second-token-agent")).toBeInTheDocument();
  });

  it("should drop previous rows when the fetch for a new token fails", async () => {
    vi.mocked(networking.getAgentsList)
      .mockResolvedValueOnce({
        agents: [
          { agent_id: "stale", agent_name: "Stale Agent", litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" }, spend: 0, keys: [] },
        ],
      })
      .mockRejectedValueOnce(new Ошибка("unauthorized"));

    const { rerender } = render(<АгентыPanel accessТокен="token-a" userRole="Admin" />);
    expect(await screen.findByText("Stale Agent")).toBeInTheDocument();

    rerender(<АгентыPanel accessТокен="token-b" userRole="Admin" />);

    await waitFor(() => {
      expect(screen.getByText("No agents yet")).toBeInTheDocument();
    });
    expect(screen.queryByText("Stale Agent")).not.toBeInTheDocument();
  });

  it("should ignore a superseded response so it cannot overwrite the current token's rows", async () => {
    let resolveFirst: (value: {
      agents: { agent_id: string; agent_name: string; litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: string }; spend: number; keys: [] }[];
    }) => void = () => {};
    vi.mocked(networking.getAgentsList)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({
        agents: [
          { agent_id: "current", agent_name: "Current Agent", litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" }, spend: 0, keys: [] },
        ],
      });

    const { rerender } = render(<АгентыPanel accessТокен="token-a" userRole="Admin" />);
    rerender(<АгентыPanel accessТокен="token-b" userRole="Admin" />);

    expect(await screen.findByText("Current Agent")).toBeInTheDocument();

    // the slow token-a response lands last and must be discarded
    await act(async () => {
      resolveFirst({
        agents: [
          { agent_id: "stale", agent_name: "Superseded Agent", litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" }, spend: 0, keys: [] },
        ],
      });
    });

    expect(screen.queryByText("Superseded Agent")).not.toBeInTheDocument();
    expect(screen.getByText("Current Agent")).toBeInTheDocument();
  });

  it("should keep rows visible during a health-check refetch instead of re-showing the skeleton", async () => {
    const user = userEvent.setup();
    const agents = [
      {
        agent_id: "agent-1",
        agent_name: "Stable Agent",
        litellm_params: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
        spend: 0,
        keys: [],
      },
    ];
    let resolveRefetch: (value: { agents: typeof agents }) => void = () => {};
    vi.mocked(networking.getAgentsList)
      .mockResolvedValueOnce({ agents })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefetch = resolve;
          }),
      );

    render(<АгентыPanel accessТокен="test-token" userRole="Admin" />);
    expect(await screen.findByText("Stable Agent")).toBeInTheDocument();

    await user.click(screen.getByRole("switch"));

    expect(screen.getByText("Stable Agent")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton-row")).not.toBeInTheDocument();

    await act(async () => {
      resolveRefetch({ agents });
    });
  });
});
