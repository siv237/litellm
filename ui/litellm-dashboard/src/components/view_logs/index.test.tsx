import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import РасходЖурналыТаблица from "./index";
import { renderWithПровайдерs } from "../../../tests/test-utils";

const { useАвторизованоMock, useОрганизацияsMock } = vi.hoisted(() => ({
  useАвторизованоMock: vi.fn(),
  useОрганизацияsMock: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: useАвторизованоMock,
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useОрганизацияs", () => ({
  useОрганизацияs: useОрганизацияsMock,
}));

vi.mock("./ЗапросЖурналыPanel", () => ({
  default: function ЗапросЖурналыPanelMock({ isActive }: { isActive: boolean }) {
    return <div data-testid="request-logs-panel">{isActive ? "active" : "inactive"}</div>;
  },
}));

vi.mock("./AuditЖурналыPanel", () => ({
  default: function AuditЖурналыPanelMock({ isActive }: { isActive: boolean }) {
    return <div data-testid="audit-logs-panel">{isActive ? "active" : "inactive"}</div>;
  },
}));

vi.mock("../DeletedКлючиPage/DeletedКлючиPage", () => ({
  default: function DeletedКлючиPageMock() {
    return <div data-testid="deleted-keys-page" />;
  },
}));

vi.mock("../DeletedКомандыPage/DeletedКомандыPage", () => ({
  default: function DeletedКомандыPageMock() {
    return <div data-testid="deleted-teams-page" />;
  },
}));

const defaultProps = {
  accessТокен: "test-token",
  token: "test-token",
  userRole: "Admin",
  userID: "user-1",
  premiumUser: false,
};

const ORG_ADMIN_MEMBERSHIPS = [{ organization_id: "org-1", members: [{ user_id: "user-1", user_role: "org_admin" }] }];

const renderAs = (sessionRole: string, organizations: unknown[] = []) => {
  useАвторизованоMock.mockReturnЗначение({ userId: "user-1", userRole: sessionRole });
  useОрганизацияsMock.mockReturnЗначение({ data: organizations });
  return renderWithПровайдерs(<РасходЖурналыТаблица {...defaultProps} userRole={sessionRole} />);
};

const tabNames = () => screen.getВсеByRole("tab").map((tab) => tab.textContent);

describe("РасходЖурналыТаблица", () => {
  beforeEach(() => {
    useАвторизованоMock.mockReturnЗначение({ userId: "user-1", userRole: "Admin" });
    useОрганизацияsMock.mockReturnЗначение({ data: [] });
  });

  it("renders the four log tabs", () => {
    renderAs("Admin");

    for (const label of ["Запрос Журналы", "Audit Журналы", "Deleted Ключи", "Deleted Команды"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("marks only the visible tab's panel active so background tabs do not query", async () => {
    const user = userEvent.setup();
    renderAs("Admin");

    expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("active");

    await user.click(screen.getByRole("tab", { name: "Audit Журналы" }));

    expect(await screen.findByTestId("audit-logs-panel")).toHaveTextContent("active");
    expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("inactive");
  });

  describe("admin-only tabs", () => {
    it.each(["Internal User", "Internal Viewer"])("hides Audit Журналы and Deleted Команды from %s", (role) => {
      renderAs(role);

      expect(screen.getByRole("tab", { name: "Запрос Журналы" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Deleted Ключи" })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Audit Журналы" })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Deleted Команды" })).not.toBeInTheDocument();
    });

    it("never mounts the panels that call the admin-only endpoints for an internal user", () => {
      renderAs("Internal User");

      expect(screen.queryByTestId("audit-logs-panel")).not.toBeInTheDocument();
      expect(screen.queryByTestId("deleted-teams-page")).not.toBeInTheDocument();
      expect(screen.getByTestId("deleted-keys-page")).toBeInTheDocument();
    });
  });

  describe("organization admins", () => {
    it("shows Deleted Команды to an org admin, whose session role reads as a plain internal user", () => {
      renderAs("Internal User", ORG_ADMIN_MEMBERSHIPS);

      expect(screen.getByRole("tab", { name: "Deleted Команды" })).toBeInTheDocument();
      expect(screen.getByTestId("deleted-teams-page")).toBeInTheDocument();
    });

    it("does not hand an org admin the Audit Журналы tab, which the backend still refuses them", () => {
      renderAs("Internal User", ORG_ADMIN_MEMBERSHIPS);

      expect(tabNames()).toEqual(["Запрос Журналы", "Deleted Ключи", "Deleted Команды"]);
      expect(screen.queryByTestId("audit-logs-panel")).not.toBeInTheDocument();
    });

    it("keeps an internal user in the same org withвыход an org_admin membership at two tabs", () => {
      renderAs("Internal User", [
        { organization_id: "org-1", members: [{ user_id: "user-1", user_role: "internal_user" }] },
      ]);

      expect(tabNames()).toEqual(["Запрос Журналы", "Deleted Ключи"]);
    });

    it("activates the org admin's selected tab rather than the one at the four-tab index", async () => {
      const user = userEvent.setup();
      renderAs("Internal User", ORG_ADMIN_MEMBERSHIPS);

      await user.click(screen.getByRole("tab", { name: "Deleted Команды" }));

      expect(screen.getByRole("tab", { name: "Deleted Команды" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("inactive");

      await user.click(screen.getByRole("tab", { name: "Запрос Журналы" }));

      expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("active");
    });
  });

  describe("tab index mapping", () => {
    it("activates the panel the admin selected, not the one at the old hardcoded index", async () => {
      const user = userEvent.setup();
      renderAs("Admin");

      await user.click(screen.getByRole("tab", { name: "Deleted Ключи" }));

      expect(screen.getByTestId("audit-logs-panel")).toHaveTextContent("inactive");
      expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("inactive");
    });

    it("keeps the audit panel inert when an admin selects the last tab", async () => {
      const user = userEvent.setup();
      renderAs("Admin");

      await user.click(screen.getByRole("tab", { name: "Deleted Команды" }));

      expect(screen.getByTestId("audit-logs-panel")).toHaveTextContent("inactive");
      expect(screen.getByTestId("deleted-teams-page")).toBeInTheDocument();
    });

    it("selects the last visible tab for an internal user and returns to Запрос Журналы", async () => {
      const user = userEvent.setup();
      renderAs("Internal User");

      await user.click(screen.getByRole("tab", { name: "Deleted Ключи" }));

      expect(screen.getByTestId("deleted-keys-page")).toBeInTheDocument();
      expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("inactive");

      await user.click(screen.getByRole("tab", { name: "Запрос Журналы" }));

      expect(screen.getByTestId("request-logs-panel")).toHaveTextContent("active");
    });
  });

  describe("auth-not-ready guard", () => {
    it("shows a loading spinner when credentials are not yet resolved", () => {
      useАвторизованоMock.mockReturnЗначение({ userRole: "Admin" });
      renderWithПровайдерs(<РасходЖурналыТаблица {...defaultProps} accessТокен={null} />);

      expect(document.queryВыбратьor('[aria-busy="true"]')).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Запрос Журналы" })).not.toBeInTheDocument();
    });

    it("renders the tabs (no spinner) once all credentials are present", () => {
      renderAs("Admin");

      expect(document.queryВыбратьor('[aria-busy="true"]')).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Запрос Журналы" })).toBeInTheDocument();
    });
  });
});
