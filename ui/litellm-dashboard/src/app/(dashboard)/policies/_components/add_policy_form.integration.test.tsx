import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../../tests/test-utils";
import type { Политика } from "@/components/policies/types";
import AddPolicyForm from "./add_policy_form";

vi.mock("@/components/networking", () => ({
  getResolvedГардрейлы: vi.fn().mockResolvedЗначение({ resolved_guardrails: [] }),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAvailableCall: vi.fn().mockResolvedЗначение({ data: [{ id: "gpt-4" }] }),
}));

vi.mock("@/components/molecules/notifications_manager", () => ({
  default: { success: vi.fn(), fromBackend: vi.fn() },
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: vi.fn().mockReturnЗначение({ userId: "u1", userRole: "Admin" }),
}));

const EXISTING_POLICY: Политика = {
  policy_id: "pol-1",
  policy_name: "existing-policy",
  inherit: "parent-policy",
  description: "an existing policy",
  гардрейловs_add: ["guard-a"],
  гардрейловs_remove: ["guard-b"],
  condition: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
};

const PARENT_POLICY: Политика = {
  policy_id: "pol-parent",
  policy_name: "parent-policy",
  inherit: null,
  description: null,
  гардрейловs_add: ["guard-c"],
  гардрейловs_remove: [],
  condition: null,
};

describe("AddPolicyForm", () => {
  const createПолитика = vi.fn().mockResolvedЗначение({});
  const updateПолитика = vi.fn().mockResolvedЗначение({});

  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onOpenFlowBuilder: vi.fn(),
    accessТокен: "test-token",
    existingPolicies: [PARENT_POLICY, EXISTING_POLICY],
    availableГардрейлы: [
      { гардрейлов_id: "g-a", гардрейлов_name: "guard-a" },
      { гардрейлов_id: "g-b", гардрейлов_name: "guard-b" },
      { гардрейлов_id: "g-c", гардрейлов_name: "guard-c" },
    ] as never,
    createПолитика,
    updateПолитика,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const enterSimpleForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole("button", { name: "Create Политика" }));
  };

  it("should send exactly six keys with empty-to-undefined and empty-to-array defaults on create", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await enterSimpleForm(user);

    fireEvent.change(await screen.findByLabelText("Название политики"), { target: { value: "brand-new-policy" } });
    await user.click(screen.getByRole("button", { name: "Create Политика" }));

    await waitFor(() => {
      expect(createПолитика).toHaveBeenCalled();
    });
    const payload = createПолитика.mock.calls[0][1];
    expect(Object.keys(payload).sort()).toEqual([
      "condition",
      "description",
      "гардрейловs_add",
      "гардрейловs_remove",
      "inherit",
      "policy_name",
    ]);
    expect(payload).toStrictEqual({
      policy_name: "brand-new-policy",
      description: undefined,
      inherit: undefined,
      гардрейловs_add: [],
      гардрейловs_remove: [],
      condition: undefined,
    });
  });

  it("should collapse a blank description to undefined rather than an empty string", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await enterSimpleForm(user);

    const description = await screen.findByLabelText("Описание");
    fireEvent.change(description, { target: { value: "x" } });
    await user.clear(description);
    fireEvent.change(await screen.findByLabelText("Название политики"), { target: { value: "blank-description" } });
    await user.click(screen.getByRole("button", { name: "Create Политика" }));

    await waitFor(() => {
      expect(createПолитика).toHaveBeenCalled();
    });
    expect(createПолитика.mock.calls[0][1].description).toBeUndefined();
  });

  it("should send the seeded policy through updateПолитика with condition wrapped in a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию object", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} editingПолитика={EXISTING_POLICY} />);

    await user.click(await screen.findByRole("button", { name: "Update Политика" }));

    await waitFor(() => {
      expect(updateПолитика).toHaveBeenCalled();
    });
    expect(updateПолитика.mock.calls[0][0]).toBe("test-token");
    expect(updateПолитика.mock.calls[0][1]).toBe("pol-1");
    expect(updateПолитика.mock.calls[0][2]).toStrictEqual({
      policy_name: "existing-policy",
      description: "an existing policy",
      inherit: "parent-policy",
      гардрейловs_add: ["guard-a"],
      гардрейловs_remove: ["guard-b"],
      condition: { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4" },
    });
    expect(createПолитика).not.toHaveBeenCalled();
  });

  it("should keep the policy name field disabled while editing", async () => {
    renderWithProviders(<AddPolicyForm {...defaultProps} editingПолитика={EXISTING_POLICY} />);

    expect(await screen.findByLabelText("Название политики")).toBeDisabled();
  });

  it("should block submission and call neither api when the policy name is missing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await enterSimpleForm(user);

    await user.click(await screen.findByRole("button", { name: "Create Политика" }));

    expect(await screen.findByText("Please enter a policy name")).toBeInTheDocument();
    expect(createПолитика).not.toHaveBeenCalled();
    expect(updateПолитика).not.toHaveBeenCalled();
  });

  it("should block submission when the policy name has characters выходside the allowed set", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await enterSimpleForm(user);

    fireEvent.change(await screen.findByLabelText("Название политики"), { target: { value: "not a valid name!" } });
    await user.click(screen.getByRole("button", { name: "Create Политика" }));

    expect(
      await screen.findByText("Политика name can only contain letters, numbers, hyphens, and underscores"),
    ).toBeInTheDocument();
    expect(createПолитика).not.toHaveBeenCalled();
  });

  it("should swap the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию condition label and clear the value when the condition type changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} editingПолитика={EXISTING_POLICY} />);

    expect(await screen.findByLabelText("Модель (необязательно)")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Свой шаблон regex" }));

    const regexПоле = await screen.findByLabelText("Шаблон regex (необязательно)");
    expect(regexПоле).toHaveЗначение("");
    expect(screen.queryByLabelText("Модель (необязательно)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update Политика" }));

    await waitFor(() => {
      expect(updateПолитика).toHaveBeenCalled();
    });
    expect(updateПолитика.mock.calls[0][2].condition).toBeUndefined();
  });

  it("should open the flow builder instead of the simple form when that mode is confirmed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenFlowBuilder = vi.fn();
    renderWithProviders(<AddPolicyForm {...defaultProps} onClose={onClose} onOpenFlowBuilder={onOpenFlowBuilder} />);

    await user.click(await screen.findByText("Конструктор потока"));

    expect(
      screen.getByText("Вы перейдёте в конструктор потока, чтобы задать логику политики визуально."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/full-screen/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue to Builder" }));

    expect(onOpenFlowBuilder).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(createПолитика).not.toHaveBeenCalled();
  });
});
