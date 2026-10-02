import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditРезервные модели, { Резервные модели } from "./EditРезервные модели";
import * as fetchРежимlsModule from "@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs";

vi.mock("@/components/llm_calls/fetch_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", () => ({
  fetchAvailableРежимls: vi.fn(),
}));

const renderWithЗапросClient = (ui: React.ReactElement) => {
  const queryClient = new ЗапросClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<ЗапросClientПровайдер client={queryClient}>{ui}</ЗапросClientПровайдер>);
};

describe("EditРезервные модели", () => {
  const accessТокен = "test-token";
  const fallbackEntry = { "gpt-4": ["gpt-3.5-turbo", "claude-3-opus"] };
  const value: Резервные модели = [{ "gpt-4": ["gpt-3.5-turbo", "claude-3-opus"] }, { "claude-3-opus": ["gpt-4"] }];

  const setup = (overrides: Partial<React.ComponentProps<typeof EditРезервные модели>> = {}) => {
    const onChange = overrides.onChange ?? vi.fn().mockResolvedЗначение(undefined);
    const onClose = overrides.onClose ?? vi.fn();
    renderWithЗапросClient(
      <EditРезервные модели
        accessТокен={accessТокен}
        fallbackEntry={fallbackEntry}
        value={value}
        onChange={onChange}
        onClose={onClose}
        {...overrides}
      />,
    );
    return { onChange, onClose };
  };

  beforeEach(() => {
    vi.clearВсеMocks();
    vi.mocked(fetchРежимlsModule.fetchAvailableРежимls).mockResolvedЗначение([
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "claude-3-opus", mode: "chat" },
      { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gemini-pro", mode: "chat" },
    ]);
  });

  it("prefills the existing fallback chain for the primary Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    setup();
    const chain = await screen.findByRole("list", { name: "Fallback chain" });
    expect(within(chain).getByText("gpt-3.5-turbo")).toBeInTheDocument();
    expect(within(chain).getByText("claude-3-opus")).toBeInTheDocument();
  });

  it("removes a fallback Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию and saves only the edited entry", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn().mockResolvedЗначение(undefined);
    const onClose = vi.fn();
    setup({ onChange, onClose });

    const chain = await screen.findByRole("list", { name: "Fallback chain" });
    await user.click(within(chain).getByRole("button", { name: "Remove gpt-3.5-turbo" }));

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([{ "gpt-4": ["claude-3-opus"] }, { "claude-3-opus": ["gpt-4"] }]);
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("blocks saving with an empty fallback chain", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn().mockResolvedЗначение(undefined);
    setup({ fallbackEntry: { "gpt-4": ["gpt-3.5-turbo"] }, onChange });

    const chain = await screen.findByRole("list", { name: "Fallback chain" });
    await user.click(within(chain).getByRole("button", { name: "Remove gpt-3.5-turbo" }));

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
