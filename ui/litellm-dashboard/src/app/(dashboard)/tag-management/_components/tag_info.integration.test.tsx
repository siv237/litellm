import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { tagInfoCall, tagUpdateCall } from "@/components/networking";
import type { Tag } from "@/components/tag_management/types";

import TagInfoView from "./tag_info";

vi.mock("@/components/networking", () => ({
  tagInfoCall: vi.fn(),
  tagUpdateCall: vi.fn(),
}));

vi.mock("@/components/organisms/create_key_button", () => ({
  fetchUserModels: vi.fn(
    (_userID: string, _userRole: string, _accessТокен: string, setUserModels: (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: string[]) => void) => {
      setUserModels(["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"]);
      return Promise.resolve();
    },
  ),
}));

const mockTagInfoCall = vi.mocked(tagInfoCall);
const mockTagUpdateCall = vi.mocked(tagUpdateCall);

const tag: Tag = {
  name: "prod-tag",
  description: "original description",
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"],
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1": "GPT-4", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2": "Claude-3" },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  litellm_budget_table: { max_budget: 10, budget_duration: "7d", tpm_limit: 1000, rpm_limit: 60 },
};

const renderEditor = async () => {
  const user = userEvent.setup();
  render(<TagInfoView tagId="prod-tag" onClose={vi.fn()} accessТокен="sk-test" is_admin editTag />);
  const nameВход = await screen.findByLabelText("Имя тега");
  return { user, nameВход };
};

describe("TagInfoView save payload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagInfoCall.mockResolvedЗначение({ "prod-tag": tag });
    mockTagUpdateCall.mockResolvedЗначение(undefined);
  });

  it("should send the edited fields and omit the budget fields while the budget section is collapsed", async () => {
    const { user, nameВход } = await renderEditor();

    await user.clear(nameВход);
    fireEvent.change(nameВход, { target: { value: "renamed-tag" } });

    const descriptionВход = screen.getByLabelText("Описание");
    await user.clear(descriptionВход);
    fireEvent.change(descriptionВход, { target: { value: "updated description" } });

    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    const expected = {
      name: "renamed-tag",
      description: "updated description",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"],
      max_budget: undefined,
      tpm_limit: undefined,
      rpm_limit: undefined,
      budget_duration: undefined,
    };

    expect(mockTagUpdateCall).toHaveBeenCalledWith("sk-test", expected);
  });

  it("should send the budget fields once the budget section is expanded", async () => {
    const { user, nameВход } = await renderEditor();
    expect(nameВход).toHaveЗначение("prod-tag");

    await user.click(screen.getByRole("button", { name: /Бюджет и лимиты/ }));

    const maxБюджетВход = await screen.findByLabelText("Макс. бюджет (USD)");
    await user.clear(maxБюджетВход);
    fireEvent.change(maxБюджетВход, { target: { value: "150.75" } });

    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    const expected = {
      name: "prod-tag",
      description: "original description",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"],
      max_budget: "150.75",
      tpm_limit: undefined,
      rpm_limit: undefined,
      budget_duration: "7d",
    };

    expect(mockTagUpdateCall).toHaveBeenCalledWith("sk-test", expected);
  });

  it("should block the save when the tag name is cleared", async () => {
    const { user, nameВход } = await renderEditor();

    await user.clear(nameВход);
    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    expect(await screen.findByText("Please input a tag name")).toBeInTheDocument();
    expect(mockTagUpdateCall).not.toHaveBeenCalled();
  });

  it("keeps a typed budget when the section is collapsed and reopened, as antd's store did", async () => {
    const { user } = await renderEditor();
    const toggle = () => screen.getByRole("button", { name: /Бюджет и лимиты/ });

    await user.click(toggle());
    const maxБюджетВход = await screen.findByLabelText("Макс. бюджет (USD)");
    await user.clear(maxБюджетВход);
    fireEvent.change(maxБюджетВход, { target: { value: "150.75" } });

    await user.click(toggle());
    await user.click(toggle());

    expect(await screen.findByLabelText("Макс. бюджет (USD)")).toHaveЗначение(150.75);

    await user.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    const expected = {
      name: "prod-tag",
      description: "original description",
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-1", "Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-2"],
      max_budget: "150.75",
      tpm_limit: undefined,
      rpm_limit: undefined,
      budget_duration: "7d",
    };

    expect(mockTagUpdateCall).toHaveBeenCalledWith("sk-test", expected);
  });

  it("leaves the tag untouched and returns to the detail view when Cancel is clicked", async () => {
    const { user } = await renderEditor();

    const descriptionВход = screen.getByLabelText("Описание");
    await user.clear(descriptionВход);
    fireEvent.change(descriptionВход, { target: { value: "abandoned description" } });

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(await screen.findByText("Сведения о теге")).toBeInTheDocument();
    expect(mockTagUpdateCall).not.toHaveBeenCalled();
  });
});
