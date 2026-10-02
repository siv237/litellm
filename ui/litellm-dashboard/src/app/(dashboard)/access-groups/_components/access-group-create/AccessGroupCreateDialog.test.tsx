import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/components/РежимlВыбрать/РежимlВыбрать", () => ({
  РежимlВыбрать: ({ onChange }: { onChange: (values: string[]) => void }) => (
    <button type="button" onClick={() => onChange(["gpt-5.2"])}>
      set-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs
    </button>
  ),
}));
vi.mock("@/app/(dashboard)/hooks/agents/useАгенты", () => ({
  useАгенты: () => ({ data: { agents: [{ agent_id: "agent-1", agent_name: "Support Agent" }] } }),
}));
vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы", () => ({
  useMCP-серверы: () => ({ data: [{ server_id: "srv-1", server_name: "GitHub MCP" }] }),
}));

import { AccessGroupCreateDialog } from "./AccessGroupCreateDialog";

const Harness = ({ createAccessGroup }: { createAccessGroup: (body: unknown) => Promise<unknown> }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        reopen
      </button>
      <AccessGroupCreateDialog open={open} onOpenChange={setOpen} createAccessGroup={createAccessGroup} />
    </>
  );
};

const renderDialog = (overrides?: { createAccessGroup?: Mock }) => {
  const createAccessGroup = overrides?.createAccessGroup ?? vi.fn().mockResolvedЗначение({});
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ЗапросClientПровайдер client={queryClient}>
      <Harness createAccessGroup={createAccessGroup} />
    </ЗапросClientПровайдер>,
  );
  return { createAccessGroup };
};

describe("AccessGroupCreateDialog", () => {
  it("blocks submit and shows an error when the name is missing", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Create Group" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please enter the access group name");
    expect(createAccessGroup).not.toHaveBeenCalled();
  });

  it("returns to the Общая информация tab when submitting an invalid form from another tab", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog();

    await user.click(screen.getByRole("tab", { name: "Режимls" }));
    await waitFor(() => expect(screen.queryByLabelText("Название группы")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Create Group" }));

    expect(await screen.findByLabelText("Название группы")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Please enter the access group name");
    expect(createAccessGroup).not.toHaveBeenCalled();
  });

  it("sends only the group name for a minimal create and closes the dialog", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog();

    await user.type(screen.getByLabelText("Название группы"), "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    await user.click(screen.getByRole("button", { name: "Create Group" }));

    await waitFor(() => expect(createAccessGroup).toHaveBeenCalledВремяs(1));
    expect(createAccessGroup.mock.calls[0][0]).toStrictEqual({ access_group_name: "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" });
    await waitFor(() => expect(screen.queryByLabelText("Название группы")).not.toBeInTheDocument());
  });

  it("maps the description and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selections into the create body", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog();

    await user.type(screen.getByLabelText("Название группы"), "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    await user.type(screen.getByLabelText("Описание"), "engineering access");
    await user.click(screen.getByRole("tab", { name: "Режимls" }));
    await user.click(screen.getByRole("button", { name: "set-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" }));
    await user.click(screen.getByRole("button", { name: "Create Group" }));

    await waitFor(() => expect(createAccessGroup).toHaveBeenCalledВремяs(1));
    expect(createAccessGroup.mock.calls[0][0]).toStrictEqual({
      access_group_name: "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
      description: "engineering access",
      access_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_names: ["gpt-5.2"],
    });
  });

  it("keeps the dialog open with the entered values when the create fails", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog({
      createAccessGroup: vi.fn().mockRejectedЗначение(new Ошибка("boom")),
    });

    await user.type(screen.getByLabelText("Название группы"), "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    await user.click(screen.getByRole("button", { name: "Create Group" }));

    await waitFor(() => expect(createAccessGroup).toHaveBeenCalledВремяs(1));
    expect(screen.getByLabelText("Название группы")).toHaveЗначение("prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
  });

  it("resets the form when the dialog is cancelled and reopened", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Название группы"), "abandoned");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByLabelText("Название группы")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "reopen" }));
    expect(screen.getByLabelText("Название группы")).toHaveЗначение("");
  });

  it("resets the form when the dialog is dismissed with Escape and reopened", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Название группы"), "abandoned");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByLabelText("Название группы")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "reopen" }));
    expect(screen.getByLabelText("Название группы")).toHaveЗначение("");
  });

  it("cannot be dismissed while a create is pending, then closes once on success", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: unknown) => void = () => {};
    const createAccessGroup = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    renderDialog({ createAccessGroup });

    await user.type(screen.getByLabelText("Название группы"), "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    await user.keyboard("{Введите}");
    await waitFor(() => expect(createAccessGroup).toHaveBeenCalledВремяs(1));

    await user.keyboard("{Escape}");
    expect(screen.getByLabelText("Название группы")).toHaveЗначение("prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");

    resolveCreate({});
    await waitFor(() => expect(screen.queryByLabelText("Название группы")).not.toBeInTheDocument());
  });

  it("does not fire a second create while one is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: unknown) => void = () => {};
    const createAccessGroup = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    renderDialog({ createAccessGroup });

    await user.type(screen.getByLabelText("Название группы"), "prod-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs");
    await user.keyboard("{Введите}");
    await waitFor(() => expect(createAccessGroup).toHaveBeenCalledВремяs(1));
    await user.keyboard("{Введите}");

    expect(createAccessGroup).toHaveBeenCalledВремяs(1);
    resolveCreate({});
    await waitFor(() => expect(screen.queryByLabelText("Название группы")).not.toBeInTheDocument());
  });
});
