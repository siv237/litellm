import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";

import UIThemeSettings from "./UIThemeSettings";

const setLogoUrl = vi.fn();
const setLogoUrlDark = vi.fn();
const setFaviconUrl = vi.fn();

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    logoUrl: null,
    setLogoUrl,
    logoUrlDark: null,
    setLogoUrlDark,
    faviconUrl: null,
    setFaviconUrl,
  }),
}));

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "",
  getГлобальноLitellmHeaderName: () => "Authorization",
}));

const LOGO_PLACEHOLDER = "https://example.com/logo.png";
const LOGO_DARK_PLACEHOLDER = "https://example.com/logo-dark.png";
const FAVICON_PLACEHOLDER = "https://example.com/favicon.ico";

const okОтвет = (values: Record<string, string | null> = {}) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ values }) } as Ответ);

const fetchMock = vi.fn<typeof fetch>();

const patchCalls = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH");

const bodyOf = (call: Parameters<typeof fetch>) => JSON.parse(String(call[1]?.body));

describe("UIThemeSettings", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
    fetchMock.mockImplementation(() => okОтвет());
    vi.stubГлобально("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubВсеГлобальноs();
  });

  it("should render nothing withвыход an access token", () => {
    const { container } = render(<UIThemeSettings userID="user-1" userRole="Admin" accessТокен={null} />);

    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should load the saved logo and favicon urls into the inputs", async () => {
    fetchMock.mockImplementation(() =>
      okОтвет({ logo_url: "https://cdn.example.com/logo.svg", favicon_url: "https://cdn.example.com/fav.ico" }),
    );

    render(<UIThemeSettings userID="user-1" userRole="Admin" accessТокен="sk-test" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(LOGO_PLACEHOLDER)).toHaveЗначение("https://cdn.example.com/logo.svg");
    });
    expect(screen.getByPlaceholderText(FAVICON_PLACEHOLDER)).toHaveЗначение("https://cdn.example.com/fav.ico");
    expect(setLogoUrl).toHaveBeenCalledWith("https://cdn.example.com/logo.svg");
    expect(setFaviconUrl).toHaveBeenCalledWith("https://cdn.example.com/fav.ico");
  });

  it("should save the entered urls and report success", async () => {
    const user = userEvent.setup();
    render(<UIThemeSettings userID="user-1" userRole="Admin" accessТокен="sk-test" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText(LOGO_PLACEHOLDER), { target: { value: "https://a.test/logo.png" } });
    fireEvent.change(screen.getByPlaceholderText(FAVICON_PLACEHOLDER), { target: { value: "https://a.test/fav.ico" } });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    expect(bodyOf(patchCalls()[0])).toEqual({
      logo_url: "https://a.test/logo.png",
      logo_url_dark: null,
      favicon_url: "https://a.test/fav.ico",
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Настройки темы обновлены"));
  });

  it("should load and save a separate dark-mode logo url", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() => okОтвет({ logo_url_dark: "https://cdn.example.com/logo-dark.svg" }));

    render(<UIThemeSettings userID="user-1" userRole="Admin" accessТокен="sk-test" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(LOGO_DARK_PLACEHOLDER)).toHaveЗначение("https://cdn.example.com/logo-dark.svg");
    });
    expect(setLogoUrlDark).toHaveBeenCalledWith("https://cdn.example.com/logo-dark.svg");

    fireEvent.change(screen.getByPlaceholderText(LOGO_DARK_PLACEHOLDER), {
      target: { value: "https://a.test/logo-dark.png" },
    });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    expect(bodyOf(patchCalls()[0]).logo_url_dark).toBe("https://a.test/logo-dark.png");
  });

  it("should surface a backend failure when saving fails", async () => {
    const user = userEvent.setup();
    render(<UIThemeSettings userID="user-1" userRole="Admin" accessТокен="sk-test" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false } as Ответ));

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(toast.fromОшибка).toHaveBeenCalledWith("Не удалось обновить настройки темы"));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should clear both inputs and persist nulls when resetting to default", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(() =>
      okОтвет({ logo_url: "https://cdn.example.com/logo.svg", favicon_url: "https://cdn.example.com/fav.ico" }),
    );

    render(<UIThemeSettings userID="user-1" userRole="Admin" accessТокен="sk-test" />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(LOGO_PLACEHOLDER)).toHaveЗначение("https://cdn.example.com/logo.svg");
    });

    await user.click(screen.getByRole("button", { name: "Reset to Default" }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    expect(bodyOf(patchCalls()[0])).toEqual({ logo_url: null, logo_url_dark: null, favicon_url: null });
    expect(screen.getByPlaceholderText(LOGO_PLACEHOLDER)).toHaveЗначение("");
    expect(screen.getByPlaceholderText(LOGO_DARK_PLACEHOLDER)).toHaveЗначение("");
    expect(screen.getByPlaceholderText(FAVICON_PLACEHOLDER)).toHaveЗначение("");
    expect(setLogoUrl).toHaveBeenLastCalledWith(null);
    expect(setLogoUrlDark).toHaveBeenLastCalledWith(null);
    expect(setFaviconUrl).toHaveBeenLastCalledWith(null);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Настройки темы сброшены к значениям по умолчанию"));
  });
});
