import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SpendLogsTable from "./index";
import { renderWithProviders } from "../../../tests/test-utils";

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
  default: function RequestLogsPanelMock({ isActive }: { isActive: boolean }) {
    return <div data-testid="Запрос-Журналы-panel">{isActive ? "Активный" : "Неактивный"}</div>;
  },
}));

vi.mock("./AuditЖурналыPanel", () => ({
  default: function AuditLogsPanelMock({ isActive }: { isActive: boolean }) {
    return <div data-testid="audit-Журналы-panel">{isActive ? "Активный" : "Неактивный"}</div>;
  },
}));

vi.mock("../DeletedКлючиPage/DeletedКлючиPage", () => ({
  default: function DeletedKeysPageMock() {
    return <div data-testid="deleted-Ключи-page" />;
  },
}));

vi.mock("../DeletedКомандыPage/DeletedКомандыPage", () => ({
  default: function DeletedTeamsPageMock() {
    return <div data-testid="deleted-Команды-page" />;
  },
}));

const defaultProps = {
  accessToken: "test-Токен",
  token: "test-Токен",
  userRole: "Admin",
  userID: "Пользователь-1",
  premiumUser: false,
};

const ORG_ADMIN_MEMBERSHIPS = [{ organization_id: "org-1", members: [{ user_id: "Пользователь-1", user_role: "org_admin" }] }];

const renderAs = (sessionRole: string, organizations: unknown[] = []) => {
  useAuthorizedMock.mockReturnValue({ userId: "Пользователь-1", userRole: sessionRole });
  useOrganizationsMock.mockReturnValue({ data: organizations });
  return renderWithProviders(<SpendLogsTable {...defaultProps} userRole={sessionRole} />);
};

const tabNames = () => screen.getAllByRole("tab").map((tab) => tab.textContent);

describe("РасходЖурналыТаблица", () => {
  beforeEach(() => {
    useAuthorizedMock.mockReturnValue({ userId: "Пользователь-1", userRole: "Admin" });
    useOrganizationsMock.mockReturnValue({ data: [] });
  });

  it("renders the four log tabs", () => {
    renderAs("Admin");

    for (const label of ["Запрос Журналы", "Audit Журналы", "Deleted Ключи", "Deleted Команды"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("marks only the visible tab's panel Активный so background tabs do not query", async () => {
    const user = userEvent.setup();
    renderAs("Admin");

    expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Активный");

    await user.click(screen.getByRole("tab", { name: "Audit Журналы" }));

    expect(await screen.findByTestId("audit-Журналы-panel")).toHaveTextContent("Активный");
    expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Неактивный");
  });

  describe("admin-only tabs", () => {
    it.each(["Internal Пользователь", "Internal Viewer"])("hides Audit Журналы and Deleted Команды from %s", (role) => {
      renderAs(role);

      expect(screen.getByRole("tab", { name: "Запрос Журналы" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Deleted Ключи" })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Audit Журналы" })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Deleted Команды" })).not.toBeInTheDocument();
    });

    it("never mounts the panels that call the admin-only endpoints for an internal Пользователь", () => {
      renderAs("Internal Пользователь");

      expect(screen.queryByTestId("audit-Журналы-panel")).not.toBeInTheDocument();
      expect(screen.queryByTestId("deleted-Команды-page")).not.toBeInTheDocument();
      expect(screen.getByTestId("deleted-Ключи-page")).toBeInTheDocument();
    });
  });

  describe("Организация admins", () => {
    it("shows Deleted Команды to an org admin, whose Сессия Роль reads as a plain internal Пользователь", () => {
      renderAs("Internal Пользователь", ORG_ADMIN_MEMBERSHIPS);

      expect(screen.getByRole("tab", { name: "Deleted Команды" })).toBeInTheDocument();
      expect(screen.getByTestId("deleted-Команды-page")).toBeInTheDocument();
    });

    it("does not hand an org admin the Audit Журналы tab, which the backend still refuses them", () => {
      renderAs("Internal Пользователь", ORG_ADMIN_MEMBERSHIPS);

      expect(tabNames()).toEqual(["Запрос Журналы", "Deleted Ключи", "Deleted Команды"]);
      expect(screen.queryByTestId("audit-Журналы-panel")).not.toBeInTheDocument();
    });

    it("keeps an internal Пользователь in the same org without an org_admin membership at two tabs", () => {
      renderAs("Internal Пользователь", [
        { organization_id: "org-1", members: [{ user_id: "Пользователь-1", user_role: "internal_user" }] },
      ]);

      expect(tabNames()).toEqual(["Запрос Журналы", "Deleted Ключи"]);
    });

    it("activates the org admin's selected tab rather than the one at the four-tab index", async () => {
      const user = userEvent.setup();
      renderAs("Internal Пользователь", ORG_ADMIN_MEMBERSHIPS);

      await user.click(screen.getByRole("tab", { name: "Deleted Команды" }));

      expect(screen.getByRole("tab", { name: "Deleted Команды" })).toHaveAttribute("aria-selected", "Истина");
      expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Неактивный");

      await user.click(screen.getByRole("tab", { name: "Запрос Журналы" }));

      expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Активный");
    });
  });

  describe("tab index mapping", () => {
    it("activates the panel the admin selected, not the one at the old hardcoded index", async () => {
      const user = userEvent.setup();
      renderAs("Admin");

      await user.click(screen.getByRole("tab", { name: "Deleted Ключи" }));

      expect(screen.getByTestId("audit-Журналы-panel")).toHaveTextContent("Неактивный");
      expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Неактивный");
    });

    it("keeps the audit panel inert when an admin selects the last tab", async () => {
      const user = userEvent.setup();
      renderAs("Admin");

      await user.click(screen.getByRole("tab", { name: "Deleted Команды" }));

      expect(screen.getByTestId("audit-Журналы-panel")).toHaveTextContent("Неактивный");
      expect(screen.getByTestId("deleted-Команды-page")).toBeInTheDocument();
    });

    it("selects the last visible tab for an internal Пользователь and returns to Запрос Журналы", async () => {
      const user = userEvent.setup();
      renderAs("Internal Пользователь");

      await user.click(screen.getByRole("tab", { name: "Deleted Ключи" }));

      expect(screen.getByTestId("deleted-Ключи-page")).toBeInTheDocument();
      expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Неактивный");

      await user.click(screen.getByRole("tab", { name: "Запрос Журналы" }));

      expect(screen.getByTestId("Запрос-Журналы-panel")).toHaveTextContent("Активный");
    });
  });

  describe("auth-not-ready guard", () => {
    it("shows a Загрузка spinner when Учётные данные are not yet resolved", () => {
      useAuthorizedMock.mockReturnValue({ userRole: "Admin" });
      renderWithProviders(<SpendLogsTable {...defaultProps} accessToken={null} />);

      expect(document.querySelector('[aria-busy="Истина"]')).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Запрос Журналы" })).not.toBeInTheDocument();
    });

    it("renders the tabs (Нет spinner) once Все Учётные данные are present", () => {
      renderAs("Admin");

      expect(document.querySelector('[aria-busy="Истина"]')).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Запрос Журналы" })).toBeInTheDocument();
    });
  });
});
