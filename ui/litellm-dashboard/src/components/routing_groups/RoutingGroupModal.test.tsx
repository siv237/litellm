import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/../tests/test-utils";

import МаршрутизацияGroupModal from "./МаршрутизацияGroupModal";
import type { МаршрутизацияGroup } from "./types";

const STRATEGIES = ["simple-shuffle", "latency-based-routing", "usage-based-routing"];
const MODEL_OPTIONS = ["gpt-4o", "claude-sonnet", "gemini-pro"];
const STRATEGY_DESCRIPTIONS = { "simple-shuffle": "Spreads requests evenly across the group." };

const EXPECTED_STORED_PAYLOAD: МаршрутизацияGroup = {
  group_name: "already-taken",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o", "claude-sonnet"],
  routing_strategy: "latency-based-routing",
  routing_strategy_args: { ttl: 3600 },
};

const SEEDED_CREATE: МаршрутизацияGroup = { group_name: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"], routing_strategy: "simple-shuffle" };

const EXPECTED_SLASH_AND_SPACE_PAYLOAD: МаршрутизацияGroup = {
  group_name: "team a/fast chat",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"],
  routing_strategy: "simple-shuffle",
  routing_strategy_args: null,
};

const STORED_GROUP: МаршрутизацияGroup = {
  group_name: "already-taken",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o", "claude-sonnet"],
  routing_strategy: "latency-based-routing",
  routing_strategy_args: { ttl: 3600 },
};

const STORED_GROUP_NULL_ARGS: МаршрутизацияGroup = {
  group_name: "already-taken",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
  routing_strategy: "latency-based-routing",
  routing_strategy_args: null,
};

const EXPECTED_NULL_ARGS_PAYLOAD: МаршрутизацияGroup = {
  group_name: "already-taken",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
  routing_strategy: "latency-based-routing",
  routing_strategy_args: null,
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof МаршрутизацияGroupModal>> = {}) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <МаршрутизацияGroupModal
      open
      mode="create"
      initialЗначение={null}
      availableStrategies={STRATEGIES}
      strategyDescriptions={STRATEGY_DESCRIPTIONS}
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюOptions={MODEL_OPTIONS}
      existingGroupNames={["already-taken", "other-group"]}
      onClose={onClose}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit, onClose };
};

const typeName = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  const input = screen.getByLabelText("Название группы");
  await user.clear(input);
  await user.type(input, name);
};

const setArgs = async (user: ReturnType<typeof userEvent.setup>, json: string) => {
  const textarea = screen.getByLabelText("Аргументы стратегии (JSON)");
  await user.clear(textarea);
  if (json) {
    await user.type(textarea, json);
  }
};

const pickModels = async (user: ReturnType<typeof userEvent.setup>, ...models: string[]) => {
  await user.click(screen.getByLabelText("Режимls"));
  for (const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию of Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs) {
    await user.click(await screen.findByRole("option", { name: Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию }));
  }
};

const pickStrategy = async (user: ReturnType<typeof userEvent.setup>, strategy: string) => {
  await user.click(screen.getByLabelText("Стратегия маршрутизации"));
  await user.click(await screen.findByRole("option", { name: strategy }));
};

const save = async (user: ReturnType<typeof userEvent.setup>, name: string) =>
  await user.click(screen.getByRole("button", { name }));

describe("МаршрутизацияGroupModal", () => {
  it("submits an untouched edit of a group whose stored arguments are null", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "edit", initialЗначение: STORED_GROUP_NULL_ARGS });

    await save(user, "Save Changes");

    expect(onSubmit).toHaveBeenCalledWith(EXPECTED_NULL_ARGS_PAYLOAD);
  });

  it("submits an untouched edit with the stored Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs, strategy and parsed arguments", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "edit", initialЗначение: STORED_GROUP });

    await save(user, "Save Changes");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(EXPECTED_STORED_PAYLOAD);
  });

  it("carries a typed group name into the payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ initialЗначение: SEEDED_CREATE });

    await typeName(user, "fast-chat");
    await save(user, "Create Group");

    const expected: МаршрутизацияGroup = {
      group_name: "fast-chat",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"],
      routing_strategy: "simple-shuffle",
      routing_strategy_args: null,
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("sends null arguments when the selected strategy does not take them", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      mode: "edit",
      initialЗначение: { ...STORED_GROUP, routing_strategy: "simple-shuffle" },
    });

    expect(screen.queryByLabelText("Аргументы стратегии (JSON)")).not.toBeInTheDocument();
    await save(user, "Save Changes");

    const expected: МаршрутизацияGroup = {
      group_name: "already-taken",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o", "claude-sonnet"],
      routing_strategy: "simple-shuffle",
      routing_strategy_args: null,
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("sends null arguments when the argument box is emptied", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "edit", initialЗначение: STORED_GROUP });

    await setArgs(user, "");
    await save(user, "Save Changes");

    expect(onSubmit.mock.calls[0][0]?.routing_strategy_args).toBeNull();
  });

  it("edits the arguments into the payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "edit", initialЗначение: STORED_GROUP });

    await setArgs(user, '{{"ttl": 60, "lowest_latency_buffer": 0}');
    await save(user, "Save Changes");

    expect(onSubmit.mock.calls[0][0]?.routing_strategy_args).toStrictEqual({ ttl: 60, lowest_latency_buffer: 0 });
  });

  it("blocks the save and flags the field when the arguments are not valid JSON", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "edit", initialЗначение: STORED_GROUP });

    await setArgs(user, "not json");
    await save(user, "Save Changes");

    expect(await screen.findByText("Must be valid JSON")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a group name", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialЗначение: { group_name: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await save(user, "Create Group");

    expect(await screen.findByText("Group name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires at least one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await typeName(user, "no-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    await save(user, "Create Group");

    expect(await screen.findByText("Выбрать at least one Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a name longer than 64 characters", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialЗначение: { group_name: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "a".repeat(65));
    await save(user, "Create Group");

    expect(await screen.findByText("Must be 64 characters or fewer")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts a name with slashes and spaces, since the backend does", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialЗначение: { group_name: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "team a/fast chat");
    await save(user, "Create Group");

    expect(onSubmit).toHaveBeenCalledWith(EXPECTED_SLASH_AND_SPACE_PAYLOAD);
  });

  it("rejects a whitespace-only name as missing", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialЗначение: { group_name: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "   ");
    await save(user, "Create Group");

    expect(await screen.findByText("Group name is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a name another group already uses, ignoring case", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialЗначение: { group_name: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "Other-Group");
    await save(user, "Create Group");

    expect(await screen.findByText("A group with this name already exists")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("locks the name in edit mode and pretty-prints the stored arguments", () => {
    renderModal({ mode: "edit", initialЗначение: STORED_GROUP });

    expect(screen.getByLabelText("Название группы")).toHaveЗначение("already-taken");
    expect(screen.getByLabelText("Название группы")).toBeDisabled();
    expect(screen.getByLabelText("Аргументы стратегии (JSON)")).toHaveЗначение('{\n  "ttl": 3600\n}');
  });

  it("carries picked Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs and a picked strategy into the payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await typeName(user, "probe-group");
    await pickModels(user, "gpt-4o", "claude-sonnet");
    await pickStrategy(user, "latency-based-routing");
    await setArgs(user, '{{"ttl": 99}');
    await save(user, "Create Group");

    const expected: МаршрутизацияGroup = {
      group_name: "probe-group",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o", "claude-sonnet"],
      routing_strategy: "latency-based-routing",
      routing_strategy_args: { ttl: 99 },
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("forgets arguments typed before the strategy stopped taking them", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await typeName(user, "probe-group");
    await pickModels(user, "gpt-4o");
    await pickStrategy(user, "latency-based-routing");
    await setArgs(user, '{{"ttl": 99}');
    await pickStrategy(user, "simple-shuffle");
    expect(screen.queryByLabelText("Аргументы стратегии (JSON)")).not.toBeInTheDocument();
    await pickStrategy(user, "latency-based-routing");

    expect(screen.getByLabelText("Аргументы стратегии (JSON)")).toHaveЗначение("");

    await save(user, "Create Group");
    const expected: МаршрутизацияGroup = {
      group_name: "probe-group",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-4o"],
      routing_strategy: "latency-based-routing",
      routing_strategy_args: null,
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("describes the selected strategy", async () => {
    renderModal();

    expect(await screen.findByText("Spreads requests evenly across the group.")).toBeInTheDocument();
  });
});
