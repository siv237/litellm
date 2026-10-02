import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { MCPToolsetsTab } from "./MCPToolsetsTab";
import * as networking from "@/components/networking";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcp-серверы/useMCPToolsets";
import { useMCP-серверы } from "@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы";
import { MCPToolset } from "@/components/mcp_tools/types";

vi.mock("@/components/networking", () => ({
  createMCPToolset: vi.fn(),
  updateMCPToolset: vi.fn(),
  deleteMCPToolset: vi.fn(),
  listMCPИнструменты: vi.fn(),
  getProxyBaseUrl: vi.fn().mockReturnЗначение("http://localhost:4000"),
}));

vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCPToolsets", () => ({ useMCPToolsets: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы", () => ({ useMCP-серверы: vi.fn() }));

const setup = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

const renderTab = (toolsets: MCPToolset[] = []) => {
  vi.mocked(useMCPToolsets).mockReturnЗначение({
    data: toolsets,
    isLoading: false,
  } as unknown as ReturnType<typeof useMCPToolsets>);
  vi.mocked(useMCP-серверы).mockReturnЗначение({ data: [] } as unknown as ReturnType<typeof useMCP-серверы>);
  render(
    <ЗапросClientПровайдер client={new ЗапросClient({ defaultOptions: { queries: { retry: false, gcВремя: 0 } } })}>
      <MCPToolsetsTab accessТокен="sk-test" userRole="Admin" />
    </ЗапросClientПровайдер>,
  );
};

const dialogWithButton = async (name: string | RegExp) => {
  const button = await screen.findByRole("button", { name });
  const dialog = button.closest('[role="dialog"]');
  if (dialog === null) {
    throw new Ошибка(`no dialog contains a "${name}" button`);
  }
  return within(dialog as HTMLElement);
};

const openEditFor = async (user: ReturnType<typeof setup>) => {
  await user.click(await screen.findByRole("button", { name: "Open toolset actions" }));
  await user.click(await screen.findByRole("menuitem", { name: /изменить/i }));
  return dialogWithButton(/сохранить изменения/i);
};

const openCreate = async (user: ReturnType<typeof setup>) => {
  await user.click(screen.getByRole("button", { name: /новый набор/i }));
  return dialogWithButton(/создать набор/i);
};

describe("MCPToolsetsTab create/edit toolset form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a toolset with the typed name, description and no tools", async () => {
    const user = setup();
    vi.mocked(networking.createMCPToolset).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.createMCPToolset>>,
    );
    renderTab();

    const dialog = await openCreate(user);
    fireEvent.change(dialog.getByPlaceholderText("напр. github-linear-tools"), {
      target: { value: "github-linear-tools" },
    });
    fireEvent.change(dialog.getByPlaceholderText("Необязательное описание"), { target: { value: "tools for triage" } });
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    await waitFor(() => {
      expect(networking.createMCPToolset).toHaveBeenCalledWith("sk-test", {
        toolset_name: "github-linear-tools",
        description: "tools for triage",
        tools: [],
      });
    });
    expect(networking.createMCPToolset).toHaveBeenCalledTimes(1);
  });

  it("sends an empty string when the description is left untouched", async () => {
    const user = setup();
    vi.mocked(networking.createMCPToolset).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.createMCPToolset>>,
    );
    renderTab();

    const dialog = await openCreate(user);
    fireEvent.change(dialog.getByPlaceholderText("напр. github-linear-tools"), { target: { value: "solo" } });
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    await waitFor(() => {
      expect(networking.createMCPToolset).toHaveBeenCalledWith("sk-test", {
        toolset_name: "solo",
        description: "",
        tools: [],
      });
    });
  });

  it("blocks the submit and shows the required message when the name is empty", async () => {
    const user = setup();
    renderTab();

    const dialog = await openCreate(user);
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    expect(await dialog.findByText("Введите название набора")).toBeInTheDocument();
    expect(networking.createMCPToolset).not.toHaveBeenCalled();
  });

  it("does not treat a whitespace-only description as absent", async () => {
    const user = setup();
    vi.mocked(networking.createMCPToolset).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.createMCPToolset>>,
    );
    renderTab();

    const dialog = await openCreate(user);
    fireEvent.change(dialog.getByPlaceholderText("напр. github-linear-tools"), { target: { value: "spaced" } });
    fireEvent.change(dialog.getByPlaceholderText("Необязательное описание"), { target: { value: "  " } });
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    await waitFor(() => {
      expect(networking.createMCPToolset).toHaveBeenCalledWith("sk-test", {
        toolset_name: "spaced",
        description: "  ",
        tools: [],
      });
    });
  });

  it("seeds the edit form from the toolset and updates it by id", async () => {
    const user = setup();
    vi.mocked(networking.updateMCPToolset).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.updateMCPToolset>>,
    );
    const toolset = {
      toolset_id: "ts-1",
      toolset_name: "existing",
      description: "old description",
      tools: [{ server_id: "srv-1", tool_name: "search" }],
    } as MCPToolset;
    renderTab([toolset]);

    const dialog = await openEditFor(user);
    const name = await dialog.findByDisplayЗначение("existing");
    expect(name).toBe(dialog.getByPlaceholderText("напр. github-linear-tools"));
    expect(dialog.getByText("Набор инструментов")).toBeInTheDocument();
    expect(dialog.getByPlaceholderText("Необязательное описание")).toHaveЗначение("old description");

    await user.clear(name);
    fireEvent.change(name, { target: { value: "renamed" } });
    await user.click(dialog.getByRole("button", { name: /сохранить изменения/i }));

    const expectedUpdate = {
      toolset_id: "ts-1",
      toolset_name: "renamed",
      description: "old description",
      tools: [{ server_id: "srv-1", tool_name: "search" }],
    };
    await waitFor(() => {
      expect(networking.updateMCPToolset).toHaveBeenCalledWith("sk-test", expectedUpdate);
    });
  });

  it("seeds an absent description as an empty string rather than failing", async () => {
    const user = setup();
    vi.mocked(networking.updateMCPToolset).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.updateMCPToolset>>,
    );
    const toolset = {
      toolset_id: "ts-2",
      toolset_name: "no-desc",
      description: null,
      tools: [],
    } as unknown as MCPToolset;
    renderTab([toolset]);

    const dialog = await openEditFor(user);
    await dialog.findByDisplayЗначение("no-desc");
    expect(dialog.getByPlaceholderText("Необязательное описание")).toHaveЗначение("");

    await user.click(dialog.getByRole("button", { name: /сохранить изменения/i }));

    const expectedUpdate = { toolset_id: "ts-2", toolset_name: "no-desc", description: "", tools: [] };
    await waitFor(() => {
      expect(networking.updateMCPToolset).toHaveBeenCalledWith("sk-test", expectedUpdate);
    });
  });
});
