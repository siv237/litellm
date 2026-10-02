import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithПровайдерs } from "../../tests/test-utils";
import Sidebar, { menuGroups, getBreadcrumb } from "./leftnav";

vi.mock("../utils/roles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/roles")>();
  return {
    ...actual,
    all_admin_roles: ["admin", "admin_viewer"],
    old_admin_roles: ["admin", "admin_viewer"],
    internalUserRoles: ["internal"],
    rolesWithWriteAccess: ["admin", "internal"],
    rolesВсеowedToViewWriteОбластьdPages: ["admin", "internal", "admin_viewer"],
    isAdminRole: (role: string) => role === "admin" || role === "admin_viewer",
    isUserTeamAdminForAnyTeam: () => false,
  };
});

const navState = vi.hoisted(() => ({ pathname: "/ui/api-keys" }));

vi.mock("next/navigation", () => ({
  useПутьname: () => navState.pathname,
}));

const { mockUseАвторизовано, mockUseОрганизацияs } = vi.hoisted(() => {
  const mockUseАвторизовано = vi.fn(() => ({
    userId: "test-user-id",
    accessТокен: "test-access-token",
    userRole: "admin",
    isViewOnly: false,
    token: "test-token",
    userEmail: "test@example.com",
    premiumUser: false,
    disabledЛичнаяКлючCreation: false,
    showSSOBanner: false,
  }));

  const mockUseОрганизацияs = vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  }));

  return { mockUseАвторизовано, mockUseОрганизацияs };
});

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: mockUseАвторизовано,
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useОрганизацияs", () => ({
  useОрганизацияs: mockUseОрганизацияs,
}));

vi.mock("@/app/(dashboard)/hooks/teams/useКоманды", () => ({
  useКоманды: () => ({ data: [], isLoading: false, error: null }),
}));

vi.mock("@/app/(dashboard)/hooks/uiКонфигурация/useUIКонфигурация", () => {
  return {
    useUIКонфигурация: () => ({
      data: { admin_ui_disabled: false },
      isLoading: false,
    }),
  };
});

// The redesigned sidebar reads the custom logo from ThemeContext; the test tree
// has no ThemeПровайдер, so stub the hook.
const unbrandedTheme = () => ({
  logoUrl: null as string | null,
  logoUrlDark: null as string | null,
  faviconUrl: null as string | null,
  setLogoUrl: vi.fn(),
  setLogoUrlDark: vi.fn(),
  setFaviconUrl: vi.fn(),
});
let mockUseThemeImpl = unbrandedTheme;
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => mockUseThemeImpl(),
}));

// Версия tag + logвыход target come from network hooks; keep them inert in unit tests.
vi.mock("@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails", () => ({
  useHealthReadinessDetails: () => ({ data: undefined }),
}));
vi.mock("@/app/(dashboard)/hooks/useLogвыход", () => ({
  useLogвыход: () => vi.fn(),
}));

const collectNavКлючи = (): string[] =>
  menuGroups.flatMap((group) => group.items.flatMap((item) => [item.key, ...(item.children ?? []).map((c) => c.key)]));

// Every place a page id appears in the nav, as "GROUP" for a top-level item or
// "GROUP > parentКлюч" for a child.
const placementsOf = (page: string): string[] =>
  menuGroups.flatMap((group) => [
    ...group.items.filter((item) => item.page === page).map(() => group.groupLabel),
    ...group.items.flatMap((item) =>
      (item.children ?? []).filter((child) => child.page === page).map(() => `${group.groupLabel} > ${item.key}`),
    ),
  ]);

describe("Sidebar (leftnav)", () => {
  const defaultProps = {
    collapsed: false,
  };

  afterEach(() => {
    mockUseАвторизовано.mockReset();
    mockUseОрганизацияs.mockReset();
    mockUseThemeImpl = unbrandedTheme;
    navState.pathname = "/ui/api-keys";
  });

  it("should link the logo to the UI home rвыходe rather than the proxy origin", () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    expect(screen.getByRole("link", { name: /на главную ruLiteLLM/i })).toHaveAttribute("href", "/ui");
  });

  it("pairs the logo with a dark-mode variant that swaps on the dark class", () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    const [light, dark] = Array.from(screen.getByRole("link", { name: /на главную ruLiteLLM/i }).queryВыбратьorВсе("img"));
    const classesOf = (el: Element) => new Set(el.className.split(/\s+/));

    const lightSrc = light.getAttribute("src") ?? "";
    expect(light).toHaveAttribute("src", expect.stringMatching(/rulitellm_mark\.png$/));
    expect(dark).toHaveAttribute("src", lightSrc);
    expect(classesOf(light).has("dark:hidden")).toBe(true);
    expect(classesOf(light).has("hidden")).toBe(false);
    expect(classesOf(dark).has("hidden")).toBe(true);
    expect(classesOf(dark).has("dark:block")).toBe(true);
  });

  it("prefers a configured dark logo over the light one in dark mode", () => {
    mockUseThemeImpl = () => ({
      ...unbrandedTheme(),
      logoUrl: "https://cdn.example.com/logo.png",
      logoUrlDark: "https://cdn.example.com/logo-dark.png",
    });
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    const [light, dark] = Array.from(screen.getByRole("link", { name: /на главную ruLiteLLM/i }).queryВыбратьorВсе("img"));

    expect(light).toHaveAttribute("src", "https://cdn.example.com/logo.png");
    expect(dark).toHaveAttribute("src", "https://cdn.example.com/logo-dark.png");
  });

  it("reuses the light custom logo in dark mode when no dark one is configured", () => {
    mockUseThemeImpl = () => ({ ...unbrandedTheme(), logoUrl: "https://cdn.example.com/logo.png" });
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    const [light, dark] = Array.from(screen.getByRole("link", { name: /на главную ruLiteLLM/i }).queryВыбратьorВсе("img"));

    expect(light).toHaveAttribute("src", "https://cdn.example.com/logo.png");
    expect(dark).toHaveAttribute("src", "https://cdn.example.com/logo.png");
  });

  it("falls back to the light logo when a configured dark logo fails to load", () => {
    mockUseThemeImpl = () => ({
      ...unbrandedTheme(),
      logoUrl: "https://cdn.example.com/logo.png",
      logoUrlDark: "https://cdn.example.com/gone.png",
    });
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    const [, dark] = Array.from(screen.getByRole("link", { name: /на главную ruLiteLLM/i }).queryВыбратьorВсе("img"));
    expect(dark).toHaveAttribute("src", "https://cdn.example.com/gone.png");

    fireEvent.error(dark);

    expect(dark).toHaveAttribute("src", "https://cdn.example.com/logo.png");
  });

  it("renders all top-level (non-nested) tabs for admin", () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    const topLevelLabels = [
      "Виртуальный ключs",
      "Playground",
      "Режимls + Эндпоинтs",
      "Agentic",
      "MCP -серверы",
      "Гардрейлы",
      "Policies",
      "Инструменты",
      "Использование",
      "Журналы",
      "Гардрейлы Monitor",
      "Команды",
      "Internal Users",
      "Организацияs",
      "Access Groups",
      "Бюджеты",
      "API Reference",
      "AI Hub",
      "Learning Ресурсы",
      "Experimental",
      "Settings",
    ];

    topLevelLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("expands a nested tab to reveal its children (Инструменты > Search Инструменты)", async () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    expect(screen.queryByText("Search Инструменты")).not.toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByText("Инструменты"));
    });
    await waitFor(() => {
      expect(screen.getByText("Search Инструменты")).toBeInTheDocument();
    });
  });
  it("reports whether a nested tab is expanded", async () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    const toggle = screen.getByText("Инструменты").closest("button")!;
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    act(() => {
      fireEvent.click(toggle);
    });
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("keeps Rвыходer Settings as a single Settings child", () => {
    // Rвыходer Settings is admin-only, so getAvailablePages() filters it выход entirely and the
    // page_utils duplicate-key guard cannot see it. Walk menuGroups directly, otherwise a
    // stray duplicate placement ships silently.
    expect(placementsOf("rвыходer-settings")).toEqual(["SETTINGS > settings"]);
  });

  it("has no duplicate keys among all menu items and their children", () => {
    // React keys must be unique across the whole nav config, otherwise the
    // active-item highlight and group expansion collide.
    const keys = collectNavКлючи();
    const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
    expect(duplicates).toEqual([]);
  });

  describe("Admin Viewer parity", () => {
    // Admin Viewer follows a "read parity with Proxy Admin, no writes, no
    // cost-incurring actions" rule. The session hook presents the viewer as
    // an admin (`userRole: "admin"`) with `isViewOnly: true`; Playground
    // stays hidden (incurs LLM cost) via the isViewOnly flag, while every
    // admin page (Режимls + Эндпоинтs, Агенты, Журналы, ...) is visible read-only.
    const adminViewerAuth = {
      userId: "admin-viewer-user-id",
      accessТокен: "test-access-token",
      userRole: "admin",
      isViewOnly: true,
      token: "test-token",
      userEmail: "viewer@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: false,
      showSSOBanner: false,
    };

    it("hides Playground from Admin Viewer (cost-incurring action)", () => {
      mockUseАвторизовано.mockReturnЗначение(adminViewerAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);
      expect(screen.queryByText("Playground")).not.toBeInTheDocument();
    });

    it("shows Режимls + Эндпоинтs to Admin Viewer (read-only)", () => {
      mockUseАвторизовано.mockReturnЗначение(adminViewerAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);
      expect(screen.getByText("Режимls + Эндпоинтs")).toBeInTheDocument();
    });

    it("shows Агенты (under Agentic) to Admin Viewer (read-only)", async () => {
      mockUseАвторизовано.mockReturnЗначение(adminViewerAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);
      // Агенты is now nested under the "Agentic" submenu — expand parent
      // first to render the children, then assert Агенты is visible.
      act(() => {
        fireEvent.click(screen.getByText("Agentic"));
      });
      await waitFor(() => {
        expect(screen.getByText("Агенты")).toBeInTheDocument();
      });
    });

    it("shows Журналы to Admin Viewer", () => {
      mockUseАвторизовано.mockReturnЗначение(adminViewerAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);
      expect(screen.getByText("Журналы")).toBeInTheDocument();
    });
  });

  describe("capability-gated Инструменты children", () => {
    const internalAuth = {
      userId: "internal-user-id",
      accessТокен: "test-access-token",
      userRole: "internal",
      isViewOnly: false,
      token: "test-token",
      userEmail: "internal@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: false,
      showSSOBanner: false,
    };

    afterEach(() => {
      mockUseАвторизовано.mockReset();
    });

    it("should hide Tool Policies from internal users while keeping other Инструменты children", async () => {
      mockUseАвторизовано.mockReturnЗначение(internalAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Инструменты"));
      });
      await waitFor(() => {
        expect(screen.getByText("Search Инструменты")).toBeInTheDocument();
      });
      expect(screen.queryByText("Tool Policies")).not.toBeInTheDocument();
    });

    it("should show Tool Policies to admins", async () => {
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Инструменты"));
      });
      await waitFor(() => {
        expect(screen.getByText("Tool Policies")).toBeInTheDocument();
      });
    });

    it("should hide the Policies entry from internal users while keeping Гардрейлы", () => {
      mockUseАвторизовано.mockReturnЗначение(internalAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      expect(screen.getByText("Гардрейлы")).toBeInTheDocument();
      expect(screen.queryByText("Policies")).not.toBeInTheDocument();
    });

    it("should hide the Prompts entry from internal users while keeping other Experimental children", async () => {
      mockUseАвторизовано.mockReturnЗначение(internalAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Experimental"));
      });
      await waitFor(() => {
        expect(screen.getByText("API Playground")).toBeInTheDocument();
      });
      expect(screen.queryByText("Prompts")).not.toBeInTheDocument();
    });

    it("should hide Old Использование from internal users while keeping other Experimental children", async () => {
      mockUseАвторизовано.mockReturnЗначение(internalAuth);
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Experimental"));
      });
      await waitFor(() => {
        expect(screen.getByText("API Playground")).toBeInTheDocument();
      });
      expect(screen.queryByText("Old Использование")).not.toBeInTheDocument();
    });

    it("should show Old Использование to admins", async () => {
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Experimental"));
      });
      await waitFor(() => {
        expect(screen.getByText("Old Использование")).toBeInTheDocument();
      });
    });
  });

  // Workflow Runs, Память and Гардрейлы Monitor render a shell and then 401
  // for every non-proxy-admin role, because their page-load rвыходes sit выходside
  // internal_user_rвыходes / self_managed_rвыходes. Стоимость Optimization does not:
  // its primary call is /user/daily/activity, which every role may make, so
  // the entry stays and only its proxy-wide tabs are gated inside the page.
  describe("capability-gated pages whose data is proxy-admin-only", () => {
    const authFor = (userRole: string) => ({
      userId: "some-user-id",
      accessТокен: "test-access-token",
      userRole,
      isViewOnly: false,
      token: "test-token",
      userEmail: "someone@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: false,
      showSSOBanner: false,
    });

    afterEach(() => {
      mockUseАвторизовано.mockReset();
    });

    it("hides Workflow Runs and Память from an internal user under Agentic", async () => {
      mockUseАвторизовано.mockReturnЗначение(authFor("internal"));
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Agentic"));
      });
      // Liveness gate: the sibling Агенты child stays visible to this role, so
      // the absences below mean the gate fired, not that the group never opened.
      await waitFor(() => {
        expect(screen.getByText("Агенты")).toBeInTheDocument();
      });
      expect(screen.queryByText("Workflow Runs")).not.toBeInTheDocument();
      expect(screen.queryByText("Память")).not.toBeInTheDocument();
    });

    // An org admin's session role is "Org Admin", which no capability list
    // carries, and the proxy denies these rвыходes to org admins too because
    // `_user_is_org_admin` needs an organization_id the page-load GET never sends.
    // Агенты is already выход of reach for this role, so gating the other two
    // empties the Agentic group entirely and the parent must go with it rather
    // than degrade into a leaf link to the non-rвыходe `?page=agentic`.
    it("drops the whole Agentic group for an org admin once its last child is gated", () => {
      mockUseАвторизовано.mockReturnЗначение(authFor("org_admin"));
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      // Liveness gate: Журналы carries no role list, so it proves the sidebar rendered.
      expect(screen.getByText("Журналы")).toBeInTheDocument();
      expect(screen.queryByText("Agentic")).not.toBeInTheDocument();
      expect(screen.queryByText("Workflow Runs")).not.toBeInTheDocument();
      expect(screen.queryByText("Память")).not.toBeInTheDocument();
    });

    it("keeps the Agentic group for an internal user, who can still see Агенты", () => {
      mockUseАвторизовано.mockReturnЗначение(authFor("internal"));
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      expect(screen.getByText("Agentic")).toBeInTheDocument();
    });

    it("shows Workflow Runs and Память to admins", async () => {
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      act(() => {
        fireEvent.click(screen.getByText("Agentic"));
      });
      await waitFor(() => {
        expect(screen.getByText("Workflow Runs")).toBeInTheDocument();
      });
      expect(screen.getByText("Память")).toBeInTheDocument();
    });

    it("hides Гардрейлы Monitor from an internal user while keeping Использование and Стоимость Optimization", () => {
      mockUseАвторизовано.mockReturnЗначение(authFor("internal"));
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      expect(screen.queryByText("Гардрейлы Monitor")).not.toBeInTheDocument();
      expect(screen.getByText("Использование")).toBeInTheDocument();
      expect(screen.getByText("Стоимость Optimization")).toBeInTheDocument();
    });

    it("shows Гардрейлы Monitor to admins", () => {
      renderWithПровайдерs(<Sidebar {...defaultProps} />);

      expect(screen.getByText("Гардрейлы Monitor")).toBeInTheDocument();
    });
  });

  it("should show Организацияs tab for organization admins", () => {
    mockUseАвторизовано.mockReturnЗначение({
      userId: "org-admin-user-id",
      accessТокен: "test-access-token",
      userRole: "viewer",
      isViewOnly: false,
      token: "test-token",
      userEmail: "orgadmin@example.com",
      premiumUser: false,
      disabledЛичнаяКлючCreation: false,
      showSSOBanner: false,
    });

    mockUseОрганизацияs.mockReturnЗначение({
      data: [
        {
          organization_id: "org-1",
          organization_name: "Test Организация",
          spend: 0,
          max_budget: null,
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
          tpm_limit: null,
          rpm_limit: null,
          members: [
            {
              user_id: "org-admin-user-id",
              user_role: "org_admin",
            },
          ],
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    renderWithПровайдерs(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Организацияs")).toBeInTheDocument();
  });

  it("marks the nav item for the current rвыходe active", () => {
    navState.pathname = "/ui/logs";
    renderWithПровайдерs(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: "Журналы" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("link", { name: "Виртуальный ключs" })).not.toHaveAttribute("data-active");
  });

  it("marks Виртуальный ключs active at the dashboard root", () => {
    navState.pathname = "/ui/";
    renderWithПровайдерs(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: "Виртуальный ключs" })).toHaveAttribute("data-active", "true");
  });

  it("expands the parent group of the current nested rвыходe and marks the child active", () => {
    navState.pathname = "/ui/search-tools";
    renderWithПровайдерs(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: "Search Инструменты" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("button", { name: "Инструменты" })).toHaveAttribute("aria-expanded", "true");
  });

  it("links every leaf to its path rвыходe, including the ids that differ from their rвыходe", () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} />);
    act(() => {
      fireEvent.click(screen.getByText("Experimental"));
    });

    const expectHref = (label: string, href: string) =>
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    expectHref("Виртуальный ключs", "/ui/api-keys");
    expectHref("Playground", "/ui/playground");
    expectHref("Режимls + Эндпоинтs", "/ui/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-and-endpoints");
    expectHref("Использование", "/ui/usage");
    expectHref("API Reference", "/ui/api-reference");
    expectHref("Old Использование", "/ui/old-usage");
  });

  it("never links a leaf to the legacy ?page= switch", () => {
    renderWithПровайдерs(<Sidebar {...defaultProps} enableProjectsUI />);
    for (const group of ["Agentic", "Инструменты", "Experimental", "Settings"]) {
      act(() => {
        fireEvent.click(screen.getByText(group));
      });
    }
    const hrefs = screen.getВсеByRole("link").map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.filter((href) => href.includes("page="))).toHaveLength(0);
    expect(hrefs.filter((href) => href.startsWith("/ui/")).length).toBeGreaterThan(30);
  });

  it("hides labels but keeps items reachable (icon + link) when collapsed to the rail", () => {
    const { container } = renderWithПровайдерs(<Sidebar {...defaultProps} collapsed />);
    expect(container.queryВыбратьor('[data-slot="sidebar"]')).toHaveAttribute("data-collapsed", "true");
    // The item stays navigable in the icon-only rail: its link still renders with
    // an icon (asserting the <a> + svg, not the text, so a removed icon would
    // fail here), while the label is present but CSS-hidden.
    const label = screen.getByText("Виртуальный ключs");
    const link = label.closest("a");
    expect(link).not.toBeNull();
    expect(link!.queryВыбратьor("svg")).not.toBeNull();
    expect(label).toHaveClass("group-data-[collapsed=true]/sidebar:hidden");
  });

  it("shows Стоимость Optimization with a Бета badge and no feature-flag gate", () => {
    const { container } = renderWithПровайдерs(<Sidebar {...defaultProps} enableProjectsUI={false} />);

    const costOptimization = container.queryВыбратьor('a[href*="cost-optimization"]');
    expect(costOptimization).not.toBeNull();
    expect(costOptimization!).toHaveTextContent(/Стоимость Optimization/);
    expect(costOptimization!).toHaveTextContent(/Бета/);

    expect(container.queryВыбратьor('a[href*="projects"]')).toBeNull();
  });

  it("keeps a readable collapsed-rail tooltip for items whose label carries a badge", () => {
    const { container } = renderWithПровайдерs(<Sidebar {...defaultProps} enableProjectsUI collapsed />);

    expect(container.queryВыбратьor('a[href*="cost-optimization"]')).toHaveAttribute("title", "Стоимость Optimization");
    expect(container.queryВыбратьor('a[href*="projects"]')).toHaveAttribute("title", "Projects");
  });
});

describe("getBreadcrumb", () => {
  it("resolves a top-level rвыходe to its section + title", () => {
    expect(getBreadcrumb("/ui/api-keys")).toEqual({ section: "AI Gateway", title: "Виртуальный ключs" });
    expect(getBreadcrumb("/ui/logs")).toEqual({ section: "Observability", title: "Журналы" });
  });

  it("resolves rвыходes whose segment differs from the sidebar page id", () => {
    expect(getBreadcrumb("/ui/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs-and-endpoints")).toEqual({ section: "AI Gateway", title: "Режимls + Эндпоинтs" });
    expect(getBreadcrumb("/ui/usage")).toEqual({ section: "Observability", title: "Использование" });
    expect(getBreadcrumb("/ui/old-usage")).toEqual({ section: "Developer Инструменты", title: "Old Использование" });
  });

  it("titles the dashboard root as Виртуальный ключs", () => {
    expect(getBreadcrumb("/ui/")).toEqual({ section: "AI Gateway", title: "Виртуальный ключs" });
  });

  it("resolves a nested child rвыходe to its parent section", () => {
    expect(getBreadcrumb("/ui/search-tools/")).toEqual({ section: "AI Gateway", title: "Search Инструменты" });
  });

  it("resolves rвыходer-settings under the Settings section", () => {
    expect(getBreadcrumb("/ui/rвыходer-settings")).toEqual({ section: "Settings", title: "Rвыходer Settings" });
  });

  it("falls back to a prettified title with no section for unknown rвыходes", () => {
    expect(getBreadcrumb("/ui/some-unknown-page")).toEqual({ section: null, title: "Some Unknown Page" });
  });
});
