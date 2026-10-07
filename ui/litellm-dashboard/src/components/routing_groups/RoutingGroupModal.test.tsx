import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/../tests/test-utils";

import RoutingGroupModal from "./RoutingGroupModal";
import type { RoutingGroup } from "./types";

const STRATEGIES = ["simple-shuffle", "latency-based-Маршрутизация", "Использование-based-Маршрутизация"];
const MODEL_OPTIONS = ["gpt-4o", "claude-sonnet", "gemini-pro"];
const STRATEGY_DESCRIPTIONS = { "simple-shuffle": "Spreads requests evenly across the group." };

const EXPECTED_STORED_PAYLOAD: RoutingGroup = {
  group_name: "already-taken",
  models: ["gpt-4o", "claude-sonnet"],
  routing_strategy: "latency-based-Маршрутизация",
  routing_strategy_args: { ttl: 3600 },
};

const SEEDED_CREATE: RoutingGroup = { group_name: "", models: ["gemini-pro"], routing_strategy: "simple-shuffle" };

const EXPECTED_SLASH_AND_SPACE_PAYLOAD: RoutingGroup = {
  group_name: "Команда a/fast chat",
  models: ["gemini-pro"],
  routing_strategy: "simple-shuffle",
  routing_strategy_args: null,
};

const STORED_GROUP: RoutingGroup = {
  group_name: "already-taken",
  models: ["gpt-4o", "claude-sonnet"],
  routing_strategy: "latency-based-Маршрутизация",
  routing_strategy_args: { ttl: 3600 },
};

const STORED_GROUP_NULL_ARGS: RoutingGroup = {
  group_name: "already-taken",
  models: ["gpt-4o"],
  routing_strategy: "latency-based-Маршрутизация",
  routing_strategy_args: null,
};

const EXPECTED_NULL_ARGS_PAYLOAD: RoutingGroup = {
  group_name: "already-taken",
  models: ["gpt-4o"],
  routing_strategy: "latency-based-Маршрутизация",
  routing_strategy_args: null,
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof RoutingGroupModal>> = {}) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <RoutingGroupModal
      open
      mode="Создать"
      initialValue={null}
      availableStrategies={STRATEGIES}
      strategyDescriptions={STRATEGY_DESCRIPTIONS}
      modelOptions={MODEL_OPTIONS}
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
  for (const model of models) {
    await user.click(await screen.findByRole("option", { name: model }));
  }
};

const pickStrategy = async (user: ReturnType<typeof userEvent.setup>, strategy: string) => {
  await user.click(screen.getByLabelText("Стратегия маршрутизации"));
  await user.click(await screen.findByRole("option", { name: strategy }));
};

const save = async (user: ReturnType<typeof userEvent.setup>, name: string) =>
  await user.click(screen.getByRole("button", { name }));

describe("МаршрутизацияGroupModal", () => {
  it("submits an untouched Изменить of a group whose stored arguments are null", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "Изменить", initialValue: STORED_GROUP_NULL_ARGS });

    await save(user, "Сохранить изменения");

    expect(onSubmit).toHaveBeenCalledWith(EXPECTED_NULL_ARGS_PAYLOAD);
  });

  it("submits an untouched Изменить with the stored Модели, strategy and parsed arguments", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "Изменить", initialValue: STORED_GROUP });

    await save(user, "Сохранить изменения");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(EXPECTED_STORED_PAYLOAD);
  });

  it("carries a typed Название группы into the payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ initialValue: SEEDED_CREATE });

    await typeName(user, "fast-chat");
    await save(user, "Создать Group");

    const expected: RoutingGroup = {
      group_name: "fast-chat",
      models: ["gemini-pro"],
      routing_strategy: "simple-shuffle",
      routing_strategy_args: null,
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("sends null arguments when the selected strategy does not take them", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      mode: "Изменить",
      initialValue: { ...STORED_GROUP, routing_strategy: "simple-shuffle" },
    });

    expect(screen.queryByLabelText("Аргументы стратегии (JSON)")).not.toBeInTheDocument();
    await save(user, "Сохранить изменения");

    const expected: RoutingGroup = {
      group_name: "already-taken",
      models: ["gpt-4o", "claude-sonnet"],
      routing_strategy: "simple-shuffle",
      routing_strategy_args: null,
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("sends null arguments when the argument box is emptied", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "Изменить", initialValue: STORED_GROUP });

    await setArgs(user, "");
    await save(user, "Сохранить изменения");

    expect(onSubmit.mock.calls[0][0]?.routing_strategy_args).toBeNull();
  });

  it("edits the arguments into the payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "Изменить", initialValue: STORED_GROUP });

    await setArgs(user, '{{"ttl": 60, "lowest_latency_buffer": 0}');
    await save(user, "Сохранить изменения");

    expect(onSubmit.mock.calls[0][0]?.routing_strategy_args).toStrictEqual({ ttl: 60, lowest_latency_buffer: 0 });
  });

  it("blocks the Сохранить and flags the Поле when the arguments are not valid JSON", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({ mode: "Изменить", initialValue: STORED_GROUP });

    await setArgs(user, "not json");
    await save(user, "Сохранить изменения");

    expect(await screen.findByText("Must be valid JSON")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a Название группы", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialValue: { group_name: "", models: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await save(user, "Создать Group");

    expect(await screen.findByText("Название группы is Обязательно")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires at least one Модель", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await typeName(user, "Нет-Модели");
    await save(user, "Создать Group");

    expect(await screen.findByText("Выбрать at least one Модель")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a Название longer than 64 characters", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialValue: { group_name: "", models: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "a".repeat(65));
    await save(user, "Создать Group");

    expect(await screen.findByText("Must be 64 characters or fewer")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts a Название with slashes and spaces, since the backend does", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialValue: { group_name: "", models: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "Команда a/fast chat");
    await save(user, "Создать Group");

    expect(onSubmit).toHaveBeenCalledWith(EXPECTED_SLASH_AND_SPACE_PAYLOAD);
  });

  it("rejects a whitespace-only Название as missing", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialValue: { group_name: "", models: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "   ");
    await save(user, "Создать Group");

    expect(await screen.findByText("Название группы is Обязательно")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a Название another group already uses, ignoring case", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal({
      initialValue: { group_name: "", models: ["gemini-pro"], routing_strategy: "simple-shuffle" },
    });

    await typeName(user, "Other-Group");
    await save(user, "Создать Group");

    expect(await screen.findByText("A group with this Название Уже существует")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("locks the Название in Изменить Режим and pretty-prints the stored arguments", () => {
    renderModal({ mode: "Изменить", initialValue: STORED_GROUP });

    expect(screen.getByLabelText("Название группы")).toHaveValue("already-taken");
    expect(screen.getByLabelText("Название группы")).toBeDisabled();
    expect(screen.getByLabelText("Аргументы стратегии (JSON)")).toHaveValue('{\n  "ttl": 3600\n}');
  });

  it("carries picked Модели and a picked strategy into the payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await typeName(user, "probe-group");
    await pickModels(user, "gpt-4o", "claude-sonnet");
    await pickStrategy(user, "latency-based-Маршрутизация");
    await setArgs(user, '{{"ttl": 99}');
    await save(user, "Создать Group");

    const expected: RoutingGroup = {
      group_name: "probe-group",
      models: ["gpt-4o", "claude-sonnet"],
      routing_strategy: "latency-based-Маршрутизация",
      routing_strategy_args: { ttl: 99 },
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("forgets arguments typed before the strategy stopped taking them", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderModal();

    await typeName(user, "probe-group");
    await pickModels(user, "gpt-4o");
    await pickStrategy(user, "latency-based-Маршрутизация");
    await setArgs(user, '{{"ttl": 99}');
    await pickStrategy(user, "simple-shuffle");
    expect(screen.queryByLabelText("Аргументы стратегии (JSON)")).not.toBeInTheDocument();
    await pickStrategy(user, "latency-based-Маршрутизация");

    expect(screen.getByLabelText("Аргументы стратегии (JSON)")).toHaveValue("");

    await save(user, "Создать Group");
    const expected: RoutingGroup = {
      group_name: "probe-group",
      models: ["gpt-4o"],
      routing_strategy: "latency-based-Маршрутизация",
      routing_strategy_args: null,
    };
    expect(onSubmit.mock.calls[0][0]).toStrictEqual(expected);
  });

  it("describes the selected strategy", async () => {
    renderModal();

    expect(await screen.findByText("Spreads requests evenly across the group.")).toBeInTheDocument();
  });
});
