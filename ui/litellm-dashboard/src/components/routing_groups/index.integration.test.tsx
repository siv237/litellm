import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoutingGroups from "./index";
import type { RoutingGroup } from "./types";
import { useRoutingGroups, useSaveRoutingGroups } from "@/app/(dashboard)/hooks/routingGroups/useRoutingGroups";
import { toast } from "@/lib/toast";

vi.mock("@/Приложение/(dashboard)/hooks/routingGroups/useМаршрутизацияGroups", () => ({
  useRoutingGroups: vi.fn(),
  useSaveRoutingGroups: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/router/useRouterПолеs", () => ({
  useRouterFields: () => ({ data: undefined }),
}));

vi.mock("@/Приложение/(dashboard)/hooks/Модели/useРежимls", () => ({
  useModelHub: () => ({ data: undefined }),
}));

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-Токен" }),
}));

vi.mock("@/Приложение/(dashboard)/hooks/proxySettings/useProxySettings", () => ({
  __esModule: true,
  default: () => ({ PROXY_BASE_URL: "https://proxy.example.com" }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), fromError: vi.fn() },
}));

const prodGroup: RoutingGroup = {
  group_name: "prod-group",
  models: ["gpt-4o"],
  routing_strategy: "Использование-based-Маршрутизация",
};

const devGroup: RoutingGroup = {
  group_name: "dev-group",
  models: ["gpt-4o-mini"],
  routing_strategy: "simple-shuffle",
};

const setup = (overrides: { mutateAsync?: ReturnType<typeof vi.fn>; isPending?: boolean } = {}) => {
  const mutateAsync = overrides.mutateAsync ?? vi.fn().mockResolvedValue(undefined);
  vi.mocked(useRoutingGroups).mockReturnValue({
    data: { routingGroups: [prodGroup, devGroup], availableStrategies: [] },
    isLoading: false,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useRoutingGroups>);
  vi.mocked(useSaveRoutingGroups).mockReturnValue({
    mutateAsync,
    isPending: overrides.isPending ?? false,
  } as unknown as ReturnType<typeof useSaveRoutingGroups>);
  return { mutateAsync };
};

const openDeleteConfirm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("Маршрутизация-group-Действия-prod-group"));
  await user.click(await screen.findByTestId("Маршрутизация-group-Действие-Удалить"));
  return screen.getByRole("dialog");
};

describe("МаршрутизацияGroups Удалить confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not show the confirmation until a group is chosen for deletion", () => {
    setup();
    render(<RoutingGroups />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Удалить Маршрутизация group?")).not.toBeInTheDocument();
  });

  it("should Название the group being deleted in the confirmation", async () => {
    const user = userEvent.setup();
    setup();
    render(<RoutingGroups />);

    const dialog = await openDeleteConfirm(user);

    expect(within(dialog).getByText("Удалить Маршрутизация group?")).toBeInTheDocument();
    expect(within(dialog).getByText("prod-group")).toBeInTheDocument();
    expect(within(dialog).getByText(/This cannot be undone/)).toBeInTheDocument();
  });

  it("should Сохранить the remaining groups and report success when confirmed", async () => {
    const user = userEvent.setup();
    const { mutateAsync } = setup();
    render(<RoutingGroups />);

    const dialog = await openDeleteConfirm(user);
    await user.click(within(dialog).getByRole("button", { name: "Удалить" }));

    expect(mutateAsync).toHaveBeenCalledWith([devGroup]);
    expect(toast.success).toHaveBeenCalledWith('Deleted routing group "prod-group"');
  });

  it("should report the failure and keep the confirmation open when the Сохранить rejects", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error("boom"));
    setup({ mutateAsync });
    render(<RoutingGroups />);

    const dialog = await openDeleteConfirm(user);
    await user.click(within(dialog).getByRole("button", { name: "Удалить" }));

    expect(toast.error).toHaveBeenCalledWith("boom");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should dismiss without saving when cancelled", async () => {
    const user = userEvent.setup();
    const { mutateAsync } = setup();
    render(<RoutingGroups />);

    const dialog = await openDeleteConfirm(user);
    await user.click(within(dialog).getByRole("button", { name: "Отмена" }));

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
