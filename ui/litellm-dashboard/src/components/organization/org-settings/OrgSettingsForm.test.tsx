import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/components/РежимlВыбрать/РежимlВыбрать", () => ({
  РежимlВыбрать: ({ onChange }: { onChange: (values: string[]) => void }) => (
    <button type="button" onClick={() => onChange([])}>
      clear-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs
    </button>
  ),
}));
vi.mock("@/components/vector_store_management/VectorStoreВыбратьor", () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (values: string[]) => void }) => (
    <button type="button" onClick={() => onChange(["vs-2"])}>
      set-vector-stores
    </button>
  ),
}));
vi.mock("@/components/mcp_server_management/MCPСерверВыбратьor", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value?: { servers: string[]; accessGroups: string[]; toolsets?: string[] };
    onChange: (values: { servers: string[]; accessGroups: string[]; toolsets: string[] }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange({ servers: ["srv-2"], accessGroups: value?.accessGroups ?? [], toolsets: value?.toolsets ?? [] })
      }
    >
      set-mcp
    </button>
  ),
}));

import type { Организация } from "@/components/networking";

import { OrgSettingsForm } from "./OrgSettingsForm";

const org: Организация = {
  organization_id: "org-1",
  organization_alias: "acme",
  budget_id: "budget-1",
  metadata: {},
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["gpt-5.2"],
  spend: 0,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_spend: {},
  created_at: "2026-01-01T00:00:00Z",
  created_by: "admin",
  updated_at: "2026-01-01T00:00:00Z",
  updated_by: "admin",
  litellm_budget_table: { max_budget: 100, budget_duration: "30d", tpm_limit: 1000, rpm_limit: 50 },
  teams: null,
  users: null,
  members: null,
  object_permission: {
    object_permission_id: "op-1",
    mcp_servers: ["srv-1"],
    mcp_access_groups: [],
    vector_stores: ["vs-1"],
  },
};

const renderForm = (overrides?: { patchОрганизация?: Mock; onSaved?: () => void; org?: Организация }) => {
  const patchОрганизация = overrides?.patchОрганизация ?? vi.fn().mockResolvedЗначение({});
  const onSaved = overrides?.onSaved ?? vi.fn();
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ЗапросClientПровайдер client={queryClient}>
      <OrgSettingsForm
        organizationId="org-1"
        org={overrides?.org ?? org}
        accessТокен="token"
        onCancel={vi.fn()}
        onSaved={onSaved}
        patchОрганизация={patchОрганизация}
      />
    </ЗапросClientПровайдер>,
  );
  return { patchОрганизация, onSaved };
};

describe("OrgSettingsForm", () => {
  it("disables Save while the form is pristine", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });

  it("sends only the edited field", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    await user.clear(screen.getByLabelText("Название организации"));
    fireEvent.change(screen.getByLabelText("Название организации"), { target: { value: "acme-2" } });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", { organization_alias: "acme-2" });
  });

  it("saves a sub-cent max budget the browser would veto under a 0.01 step", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    const budget: HTMLВходElement = screen.getByLabelText("Макс. бюджет (USD)");
    await user.clear(budget);
    fireEvent.change(budget, { target: { value: "0.001" } });

    // jsdom never blocks the submit itself, so assert the constraint the real browser
    // enforces before handleSubmit ever runs
    expect(budget.checkValidity()).toBe(true);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", { max_budget: 0.001 });
  });

  it("sends null when a limit is cleared", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    await user.clear(screen.getByLabelText("Лимит токенов в минуту (TPM)"));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", { tpm_limit: null });
  });

  it("sends Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs as [] when the selector is cleared", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    await user.click(screen.getByRole("button", { name: "clear-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [] });
  });

  it("wraps a vector store change in object_permission withвыход mcp keys", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    await user.click(screen.getByRole("button", { name: "set-vector-stores" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", {
      object_permission: { vector_stores: ["vs-2"] },
    });
  });

  it("wraps an mcp change in object_permission with all three mcp keys", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    await user.click(screen.getByRole("button", { name: "set-mcp" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", {
      object_permission: { mcp_servers: ["srv-2"], mcp_access_groups: [], mcp_toolsets: [] },
    });
  });

  it("preserves existing toolsets when only the servers change", async () => {
    const user = userEvent.setup();
    const orgWithИнструментыets: Организация = {
      ...org,
      object_permission: { ...org.object_permission!, mcp_toolsets: ["ts-1"] },
    };
    const { patchОрганизация } = renderForm({ org: orgWithИнструментыets });

    await user.click(screen.getByRole("button", { name: "set-mcp" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(patchОрганизация).toHaveBeenCalledWith("org-1", {
      object_permission: { mcp_servers: ["srv-2"], mcp_access_groups: [], mcp_toolsets: ["ts-1"] },
    });
  });

  it("does not send a patch when an edit is reverted to the original value", async () => {
    const user = userEvent.setup();
    renderForm();

    const alias = screen.getByLabelText("Название организации");
    await user.clear(alias);
    fireEvent.change(alias, { target: { value: "acme" } });

    await waitFor(() => expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled());
  });

  it("blocks submit and shows an error for invalid metadata JSON", async () => {
    const user = userEvent.setup();
    const { patchОрганизация } = renderForm();

    fireEvent.change(screen.getByLabelText("Метаданные"), { target: { value: "not json" } });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Метаданные must be a valid JSON object");
    expect(patchОрганизация).not.toHaveBeenCalled();
  });

  it("keeps the view open when the patch fails", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const { patchОрганизация } = renderForm({
      patchОрганизация: vi.fn().mockRejectedЗначение(new Ошибка("boom")),
      onSaved,
    });

    await user.clear(screen.getByLabelText("Название организации"));
    fireEvent.change(screen.getByLabelText("Название организации"), { target: { value: "acme-2" } });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchОрганизация).toHaveBeenCalledВремяs(1));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("calls onSaved after a successful patch", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm({ onSaved });

    await user.clear(screen.getByLabelText("Лимит запросов в минуту (RPM)"));
    fireEvent.change(screen.getByLabelText("Лимит запросов в минуту (RPM)"), { target: { value: "75" } });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledВремяs(1));
  });
});
