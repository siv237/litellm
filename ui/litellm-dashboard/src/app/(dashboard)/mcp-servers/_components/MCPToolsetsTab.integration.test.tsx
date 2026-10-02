import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { MCPИнструментыetsTab } from "./MCPИнструментыetsTab";
import * as networking from "@/components/networking";
import { useMCPИнструментыets } from "@/app/(dashboard)/hooks/mcp-серверы/useMCPИнструментыets";
import { useMCP-серверы } from "@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы";
import { MCPИнструментыet } from "@/components/mcp_tools/types";

vi.mock("@/components/networking", () => ({
  createMCPИнструментыet: vi.fn(),
  updateMCPИнструментыet: vi.fn(),
  deleteMCPИнструментыet: vi.fn(),
  listMCPИнструменты: vi.fn(),
  getProxyBaseUrl: vi.fn().mockReturnЗначение("http://localhost:4000"),
}));

vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCPИнструментыets", () => ({ useMCPИнструментыets: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/mcp-серверы/useMCP-серверы", () => ({ useMCP-серверы: vi.fn() }));

const setup = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

const renderTab = (toolsets: MCPИнструментыet[] = []) => {
  vi.mocked(useMCPИнструментыets).mockReturnЗначение({
    data: toolsets,
    isLoading: false,
  } as unknown as ReturnType<typeof useMCPИнструментыets>);
  vi.mocked(useMCP-серверы).mockReturnЗначение({ data: [] } as unknown as ReturnType<typeof useMCP-серверы>);
  render(
    <ЗапросClientПровайдер client={new ЗапросClient({ defaultOptions: { queries: { retry: false, gcВремя: 0 } } })}>
      <MCPИнструментыetsTab accessТокен="sk-test" userRole="Admin" />
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

describe("MCPИнструментыetsTab create/edit toolset form", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("creates a toolset with the typed name, description and no tools", async () => {
    const user = setup();
    vi.mocked(networking.createMCPИнструментыet).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.createMCPИнструментыet>>,
    );
    renderTab();

    const dialog = await openCreate(user);
    fireEvent.change(dialog.getByPlaceholderText("напр. github-linear-tools"), {
      target: { value: "github-linear-tools" },
    });
    fireEvent.change(dialog.getByPlaceholderText("Необязательное описание"), { target: { value: "tools for triage" } });
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    await waitFor(() => {
      expect(networking.createMCPИнструментыet).toHaveBeenCalledWith("sk-test", {
        toolset_name: "github-linear-tools",
        description: "tools for triage",
        tools: [],
      });
    });
    expect(networking.createMCPИнструментыet).toHaveBeenCalledВремяs(1);
  });

  it("sends an empty string when the description is left untouched", async () => {
    const user = setup();
    vi.mocked(networking.createMCPИнструментыet).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.createMCPИнструментыet>>,
    );
    renderTab();

    const dialog = await openCreate(user);
    fireEvent.change(dialog.getByPlaceholderText("напр. github-linear-tools"), { target: { value: "solo" } });
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    await waitFor(() => {
      expect(networking.createMCPИнструментыet).toHaveBeenCalledWith("sk-test", {
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
    expect(networking.createMCPИнструментыet).not.toHaveBeenCalled();
  });

  it("does not treat a whitespace-only description as absent", async () => {
    const user = setup();
    vi.mocked(networking.createMCPИнструментыet).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.createMCPИнструментыet>>,
    );
    renderTab();

    const dialog = await openCreate(user);
    fireEvent.change(dialog.getByPlaceholderText("напр. github-linear-tools"), { target: { value: "spaced" } });
    fireEvent.change(dialog.getByPlaceholderText("Необязательное описание"), { target: { value: "  " } });
    await user.click(dialog.getByRole("button", { name: /создать набор/i }));

    await waitFor(() => {
      expect(networking.createMCPИнструментыet).toHaveBeenCalledWith("sk-test", {
        toolset_name: "spaced",
        description: "  ",
        tools: [],
      });
    });
  });

  it("seeds the edit form from the toolset and updates it by id", async () => {
    const user = setup();
    vi.mocked(networking.updateMCPИнструментыet).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.updateMCPИнструментыet>>,
    );
    const toolset = {
      toolset_id: "ts-1",
      toolset_name: "existing",
      description: "old description",
      tools: [{ server_id: "srv-1", tool_name: "search" }],
    } as MCPИнструментыet;
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
      expect(networking.updateMCPИнструментыet).toHaveBeenCalledWith("sk-test", expectedUpdate);
    });
  });

  it("seeds an absent description as an empty string rather than failing", async () => {
    const user = setup();
    vi.mocked(networking.updateMCPИнструментыet).mockResolvedЗначение(
      {} as Awaited<ReturnType<typeof networking.updateMCPИнструментыet>>,
    );
    const toolset = {
      toolset_id: "ts-2",
      toolset_name: "no-desc",
      description: null,
      tools: [],
    } as unknown as MCPИнструментыet;
    renderTab([toolset]);

    const dialog = await openEditFor(user);
    await dialog.findByDisplayЗначение("no-desc");
    expect(dialog.getByPlaceholderText("Необязательное описание")).toHaveЗначение("");

    await user.click(dialog.getByRole("button", { name: /сохранить изменения/i }));

    const expectedUpdate = { toolset_id: "ts-2", toolset_name: "no-desc", description: "", tools: [] };
    await waitFor(() => {
      expect(networking.updateMCPИнструментыet).toHaveBeenCalledWith("sk-test", expectedUpdate);
    });
  });
});
