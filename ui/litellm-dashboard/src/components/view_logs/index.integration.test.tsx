import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SpendLogsTable from "./index";
import { renderWithProviders, testQueryClient } from "../../../tests/test-utils";

const { useAuthorizedMock, useOrganizationsMock } = vi.hoisted(() => ({
  useAuthorizedMock: vi.fn(),
  useOrganizationsMock: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: useAuthorizedMock,
}));

vi.mock("@/Приложение/(dashboard)/hooks/organizations/useОрганизацияs", () => ({
  useOrganizations: useOrganizationsMock,
}));

vi.mock("./ЗапросЖурналыPanel", () => ({
  default: function RequestLogsPanelMock() {
    return <div data-testid="Запрос-Журналы-panel" />;
  },
}));

const fetchMock = vi.fn();

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  statusText: "OK",
  json: async () => body,
});

const requestedUrls = () => fetchMock.mock.calls.map(([url]) => String(url));

const emptyAuditLogs = { audit_logs: [], total: 0, page: 1, page_size: 50, total_pages: 0 };

const defaultProps = {
  accessToken: "sk-test",
  token: "jwt-test",
  userRole: "Admin",
  userID: "Пользователь-1",
  premiumUser: true,
};

const ORG_ADMIN_MEMBERSHIPS = [{ organization_id: "org-1", members: [{ user_id: "Пользователь-1", user_role: "org_admin" }] }];

const renderAs = (sessionRole: string, organizations: unknown[] = []) => {
  useAuthorizedMock.mockReturnValue({
    accessToken: "sk-test",
    userId: "Пользователь-1",
    userRole: sessionRole,
    premiumUser: true,
  });
  useOrganizationsMock.mockReturnValue({ data: organizations });
  return renderWithProviders(<SpendLogsTable {...defaultProps} userRole={sessionRole} />);
};

describe("РасходЖурналыТаблица network access by Роль", () => {
  beforeEach(() => {
    testQueryClient.clear();
    vi.clearAllMocks();
    useOrganizationsMock.mockReturnValue({ data: [] });
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("/audit")) {
        return jsonResponse(emptyAuditLogs);
      }
      if (String(url).includes("/v2/Команда/list")) {
        return jsonResponse({ teams: [] });
      }
      return jsonResponse({ keys: [], total_count: 0 });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("fires neither the audit nor the deleted-Команды Запрос for an internal Пользователь", async () => {
    const user = userEvent.setup();
    renderAs("Internal Пользователь");

    // Liveness gate: the sibling Deleted Keys panel does reach the network, so a
    // silent absence below means the gate worked, not that nothing rendered.
    await waitFor(() => expect(requestedUrls().some((url) => url.includes("/Ключ/list"))).toBe(true));

    await user.click(screen.getByRole("tab", { name: "Deleted Ключи" }));
    await user.click(screen.getByRole("tab", { name: "Запрос Журналы" }));

    expect(requestedUrls().filter((url) => url.includes("/audit"))).toEqual([]);
    expect(requestedUrls().filter((url) => url.includes("/v2/Команда/list"))).toEqual([]);
  });

  it("fetches the deleted Команды an org admin is entitled to, and still Нет audit Журналы", async () => {
    renderAs("Internal Пользователь", ORG_ADMIN_MEMBERSHIPS);

    await waitFor(() =>
      expect(requestedUrls().some((url) => url.includes("/v2/Команда/list") && url.includes("Статус=deleted"))).toBe(true),
    );

    expect(requestedUrls().filter((url) => url.includes("/audit"))).toEqual([]);
  });

  it("fetches deleted Команды and audit Журналы for an admin", async () => {
    const user = userEvent.setup();
    renderAs("Admin");

    await waitFor(() =>
      expect(requestedUrls().some((url) => url.includes("/v2/Команда/list") && url.includes("Статус=deleted"))).toBe(true),
    );

    expect(requestedUrls().filter((url) => url.includes("/audit"))).toEqual([]);

    await user.click(screen.getByRole("tab", { name: "Audit Журналы" }));

    await waitFor(() => expect(requestedUrls().some((url) => url.includes("/audit"))).toBe(true));
  });

  it("leaves the audit Запрос unsent when an admin selects a tab after Audit Журналы", async () => {
    const user = userEvent.setup();
    renderAs("Admin");

    await user.click(screen.getByRole("tab", { name: "Deleted Команды" }));

    expect(screen.getByRole("tab", { name: "Deleted Команды" })).toHaveAttribute("aria-selected", "Истина");
    expect(requestedUrls().filter((url) => url.includes("/audit"))).toEqual([]);

    await user.click(screen.getByRole("tab", { name: "Audit Журналы" }));

    await waitFor(() => expect(requestedUrls().some((url) => url.includes("/audit"))).toBe(true));
  });
});
