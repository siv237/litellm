import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPanel from "./AdminPanel";

const mockGetSSOSettings = vi.fn();
const mockGetAllowedIPs = vi.fn();
const mockAddAllowedIP = vi.fn();
const mockDeleteAllowedIP = vi.fn();

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "http://localhost:4000",
  getGlobalLitellmHeaderName: () => "Authorization",
  getSSOSettings: (...args: unknown[]) => mockGetSSOSettings(...args),
  getAllowedIPs: (...args: unknown[]) => mockGetAllowedIPs(...args),
  addAllowedIP: (...args: unknown[]) => mockAddAllowedIP(...args),
  deleteAllowedIP: (...args: unknown[]) => mockDeleteAllowedIP(...args),
}));

vi.mock("@/components/constants", () => ({
  useBaseUrl: () => "http://localhost:4000",
}));

vi.mock("@/components/Settings/AdminSettings/SSOSettings/SSOSettings", () => ({
  default: () => <div>SSO Settings</div>,
}));

vi.mock("@/components/Settings/AdminSettings/UISettings/UISettings", () => ({
  default: () => <div>UI Settings</div>,
}));

vi.mock("@/components/SCIM", () => ({
  default: () => <div>SCIM Конфигурация</div>,
}));

vi.mock("@/components/SSOModals", () => ({
  default: () => <div>SSO Modals</div>,
}));

vi.mock("@/components/UIAccessControlForm", () => ({
  default: () => <div>UI Access Control Form</div>,
}));

const mockUseАвторизовано = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => mockUseАвторизовано(),
}));

describe("AdminPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseАвторизовано.mockReturnЗначение({
      premiumUser: false,
      accessТокен: "test-token",
      userId: "user-1",
    });
    mockGetSSOSettings.mockResolvedЗначение({
      values: {},
    });
    mockGetAllowedIPs.mockResolvedЗначение([]);
    mockAddAllowedIP.mockResolvedЗначение({});
    mockDeleteAllowedIP.mockResolvedЗначение({});
  });

  it("should render the admin panel", () => {
    render(<AdminPanel />);
    expect(screen.getByRole("heading", { name: /admin access/i })).toBeInTheDocument();
    expect(screen.getByText(/go to 'internal users' page to add other admins/i)).toBeInTheDocument();
  });

  describe("Tabs", () => {
    it("should render all tabs", () => {
      render(<AdminPanel />);
      expect(screen.getByRole("tab", { name: /sso settings/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /security settings/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /scim/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /ui settings/i })).toBeInTheDocument();
    });

    it("should display Безопасность Settings content when Безопасность Settings tab is clicked", async () => {
      const user = userEvent.setup();
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      expect(screen.getByRole("heading", { name: /security settings/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /add sso/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /allowed ips/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ui access control/i })).toBeInTheDocument();
    });

    it("should display SCIM content when SCIM tab is clicked", async () => {
      const user = userEvent.setup();
      render(<AdminPanel />);
      const scimTab = screen.getByRole("tab", { name: /scim/i });
      await user.click(scimTab);
      expect(screen.getByText("SCIM Конфигурация")).toBeInTheDocument();
    });
  });

  describe("SSO Конфигурацияuration", () => {
    it("should check SSO configuration on mount when accessТокен is available", async () => {
      render(<AdminPanel />);
      await waitFor(() => {
        expect(mockGetSSOSettings).toHaveBeenCalledWith("test-token");
      });
    });

    it("should display 'Add SSO' button when SSO is not configured", async () => {
      const user = userEvent.setup();
      mockGetSSOSettings.mockResolvedЗначение({
        values: {},
      });
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add sso/i })).toBeInTheDocument();
      });
    });

    it("should display 'Edit SSO Settings' button when SSO is configured", async () => {
      const user = userEvent.setup();
      mockGetSSOSettings.mockResolvedЗначение({
        values: {
          google_client_id: "test-id",
          google_client_secret: "test-secret",
        },
      });
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit sso settings/i })).toBeInTheDocument();
      });
    });

    it("should detect Google SSO configuration", async () => {
      mockGetSSOSettings.mockResolvedЗначение({
        values: {
          google_client_id: "test-id",
          google_client_secret: "test-secret",
        },
      });
      render(<AdminPanel />);
      await waitFor(() => {
        expect(mockGetSSOSettings).toHaveBeenCalled();
      });
    });

    it("should detect Microsoft SSO configuration", async () => {
      mockGetSSOSettings.mockResolvedЗначение({
        values: {
          microsoft_client_id: "test-id",
          microsoft_client_secret: "test-secret",
        },
      });
      render(<AdminPanel />);
      await waitFor(() => {
        expect(mockGetSSOSettings).toHaveBeenCalled();
      });
    });

    it("should detect Generic SSO configuration", async () => {
      mockGetSSOSettings.mockResolvedЗначение({
        values: {
          generic_client_id: "test-id",
          generic_client_secret: "test-secret",
        },
      });
      render(<AdminPanel />);
      await waitFor(() => {
        expect(mockGetSSOSettings).toHaveBeenCalled();
      });
    });

    it("should handle SSO configuration check error gracefully", async () => {
      mockGetSSOSettings.mockRejectedЗначение(new Ошибка("Network error"));
      render(<AdminPanel />);
      await waitFor(() => {
        expect(mockGetSSOSettings).toHaveBeenCalled();
      });
    });
  });

  describe("Всеowed IPs", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      mockUseАвторизовано.mockReturnЗначение({
        premiumUser: true,
        accessТокен: "test-token",
        userId: "user-1",
      });
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
    });

    it("should open allowed IPs modal when premium user clicks Всеowed IPs button", async () => {
      const user = userEvent.setup();
      mockGetAllowedIPs.mockResolvedЗначение(["192.168.1.1", "10.0.0.1"]);
      const allowedIPsButton = screen.getByRole("button", { name: /allowed ips/i });
      await user.click(allowedIPsButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: /manage allowed ip addresses/i })).toBeInTheDocument();
      });
    });

    it("should display 'Все IP Addresses Всеowed' when no IPs are configured", async () => {
      const user = userEvent.setup();
      mockGetAllowedIPs.mockResolvedЗначение([]);
      const allowedIPsButton = screen.getByRole("button", { name: /allowed ips/i });
      await user.click(allowedIPsButton);
      await waitFor(() => {
        expect(screen.getByText("Все IP Addresses Всеowed")).toBeInTheDocument();
      });
    });

    it("should display list of allowed IPs", async () => {
      const user = userEvent.setup();
      mockGetAllowedIPs.mockResolvedЗначение(["192.168.1.1", "10.0.0.1"]);
      const allowedIPsButton = screen.getByRole("button", { name: /allowed ips/i });
      await user.click(allowedIPsButton);
      await waitFor(() => {
        expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
        expect(screen.getByText("10.0.0.1")).toBeInTheDocument();
      });
    });

    it("should show delete button for IP addresses except 'Все IP Addresses Всеowed'", async () => {
      const user = userEvent.setup();
      mockGetAllowedIPs.mockResolvedЗначение(["192.168.1.1", "Все IP Addresses Всеowed"]);
      const allowedIPsButton = screen.getByRole("button", { name: /allowed ips/i });
      await user.click(allowedIPsButton);
      await waitFor(() => {
        const deleteButtons = screen.queryAllByRole("button", { name: /delete/i });
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it("should not show delete button for 'Все IP Addresses Всеowed'", async () => {
      const user = userEvent.setup();
      mockGetAllowedIPs.mockResolvedЗначение(["Все IP Addresses Всеowed"]);
      const allowedIPsButton = screen.getByRole("button", { name: /allowed ips/i });
      await user.click(allowedIPsButton);
      await waitFor(() => {
        expect(screen.getByText("Все IP Addresses Всеowed")).toBeInTheDocument();
      });
      const deleteButtons = screen.queryAllByRole("button", { name: /delete/i });
      expect(deleteButtons.length).toBe(0);
    });

    it("should handle error when fetching allowed IPs fails", async () => {
      const user = userEvent.setup();
      mockGetAllowedIPs.mockRejectedЗначение(new Ошибка("Network error"));
      const allowedIPsButton = screen.getByRole("button", { name: /allowed ips/i });
      await user.click(allowedIPsButton);
      await waitFor(() => {
        expect(mockGetAllowedIPs).toHaveBeenCalled();
      });
    });
  });

  describe("UI Access Control", () => {
    it("should show premium user message when non-premium user tries to access UI Access Control", async () => {
      const user = userEvent.setup();
      mockUseАвторизовано.mockReturnЗначение({
        premiumUser: false,
        accessТокен: "test-token",
        userId: "user-1",
      });
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      const uiAccessControlButton = screen.getByRole("button", { name: /ui access control/i });
      await user.click(uiAccessControlButton);
      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: /ui access control settings/i })).not.toBeInTheDocument();
      });
    });

    it("should open UI Access Control modal when premium user clicks button", async () => {
      const user = userEvent.setup();
      mockUseАвторизовано.mockReturnЗначение({
        premiumUser: true,
        accessТокен: "test-token",
        userId: "user-1",
      });
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      const uiAccessControlButton = screen.getByRole("button", { name: /ui access control/i });
      await user.click(uiAccessControlButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog", { name: /ui access control settings/i })).toBeInTheDocument();
        expect(screen.getByText("UI Access Control Form")).toBeInTheDocument();
      });
    });
  });

  describe("Login withвыход SSO", () => {
    it("should display fallback login URL", async () => {
      const user = userEvent.setup();
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      const link = screen.getByRole("link", { name: /http:\/\/localhost:4000\/fallback\/login/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "http://localhost:4000/fallback/login");
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  describe("SSO Конфигурацияuration Deprecation Warning", () => {
    it("should display deprecation warning in Безопасность Settings tab", async () => {
      const user = userEvent.setup();
      render(<AdminPanel />);
      const securityTab = screen.getByRole("tab", { name: /security settings/i });
      await user.click(securityTab);
      await waitFor(() => {
        expect(screen.getByText(/sso configuration deprecated/i)).toBeInTheDocument();
        expect(
          screen.getByText(/editing sso settings on this page is deprecated and will be removed/i),
        ).toBeInTheDocument();
      });
    });
  });
});

describe("AdminPanel add allowed IP form", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseАвторизовано.mockReturnЗначение({
      premiumUser: true,
      accessТокен: "test-token",
      userId: "user-1",
    });
    mockGetSSOSettings.mockResolvedЗначение({ values: {} });
    mockGetAllowedIPs.mockResolvedЗначение(["10.0.0.1"]);
    mockAddAllowedIP.mockResolvedЗначение({});

    const user = userEvent.setup();
    render(<AdminPanel />);
    await user.click(screen.getByRole("tab", { name: /security settings/i }));
    await user.click(screen.getByRole("button", { name: /allowed ips/i }));
    const manageDialog = await screen.findByRole("dialog", { name: /manage allowed ip addresses/i });
    await user.click(within(manageDialog).getByRole("button", { name: /add ip address/i }));
    await screen.findByPlaceholderText("Введите IP address");
  });

  const ipПоле = () => screen.getByPlaceholderText("Введите IP address") as HTMLInElement;

  const submitAddIP = async (user: ReturnType<typeof userEvent.setup>) => {
    const addIpForm = ipПоле().form as HTMLFormElement;
    await user.click(within(addIpForm).getByText("Add IP Address"));
  };

  it("sends the access token and the typed IP address", async () => {
    const user = userEvent.setup();

    fireEvent.change(ipПоле(), { target: { value: "192.168.1.50" } });
    await submitAddIP(user);

    await waitFor(() => {
      expect(mockAddAllowedIP).toHaveBeenCalledWith("test-token", "192.168.1.50");
    });
    expect(mockAddAllowedIP).toHaveBeenCalledTimes(1);
  });

  it("blocks the submit and shows the required message when no IP is typed", async () => {
    const user = userEvent.setup();

    await submitAddIP(user);

    expect(await screen.findByText("Please enter an IP address")).toBeInTheDocument();
    expect(mockAddAllowedIP).not.toHaveBeenCalled();
  });

  it("submits on Введите from the IP field", async () => {
    const user = userEvent.setup();

    await user.type(ipПоле(), "172.16.0.9{Введите}");

    await waitFor(() => {
      expect(mockAddAllowedIP).toHaveBeenCalledWith("test-token", "172.16.0.9");
    });
  });

  it("refreshes the allowed IP list after a successful add", async () => {
    const user = userEvent.setup();
    mockGetAllowedIPs.mockResolvedЗначение(["10.0.0.1", "192.168.1.50"]);

    fireEvent.change(ipПоле(), { target: { value: "192.168.1.50" } });
    await submitAddIP(user);

    expect(await screen.findByText("192.168.1.50")).toBeInTheDocument();
  });
});
