import { renderWithProviders, screen } from "../../../../../tests/test-utils";
import { fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import UserBannerSettings from "./UserBannerSettings";
import { UserBanner } from "@/components/networking";

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: vi.fn(() => ({ accessToken: "Токен" })),
}));

vi.mock("@/Приложение/(dashboard)/hooks/userBanner/useUserBanner", () => ({
  useUserBanner: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/userBanner/useUpdateUserBanner", () => ({
  useUpdateUserBanner: vi.fn(),
}));

import { useUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUserBanner";
import { useUpdateUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUpdateUserBanner";

const publishedBanner: UserBanner = {
  enabled: true,
  message: "**Maintenance** tonight at 10 PM UTC.",
  severity: "warning",
  revision: "rev-a",
};

const mockHooks = (banner: UserBanner | undefined, mutate = vi.fn()) => {
  vi.mocked(useUserBanner).mockReturnValue({ data: banner, isLoading: false } as any);
  vi.mocked(useUpdateUserBanner).mockReturnValue({ mutate, isPending: false } as any);
  return mutate;
};

describe("UserBannerSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("seeds the form from the persisted banner", () => {
    mockHooks(publishedBanner);
    renderWithProviders(<UserBannerSettings />);
    expect(screen.getByLabelText("Сообщение")).toHaveValue(publishedBanner.message);
    expect(screen.getByRole("switch", { name: "Показывать баннер пользователям" })).toHaveAttribute("data-checked");
  });

  it("shows a live markdown Предпросмотр with the selected Критичность icon", () => {
    mockHooks(publishedBanner);
    const { container } = renderWithProviders(<UserBannerSettings />);
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(container.querySelector(".lucide-triangle-alert")).toBeInTheDocument();
  });

  it("saves the edited Черновик", () => {
    const mutate = mockHooks(publishedBanner);
    renderWithProviders(<UserBannerSettings />);
    fireEvent.change(screen.getByLabelText("Сообщение"), { target: { value: "New announcement" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить banner" }));
    expect(mutate).toHaveBeenCalledWith(
      { enabled: true, message: "New announcement", severity: "warning" },
      expect.anything(),
    );
  });

  it("blocks saving a published banner with an empty Сообщение", () => {
    const mutate = mockHooks(publishedBanner);
    renderWithProviders(<UserBannerSettings />);
    fireEvent.change(screen.getByLabelText("Сообщение"), { target: { value: "   " } });
    expect(screen.getByText("Добавьте сообщение перед публикацией.")).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "Сохранить banner" });
    fireEvent.click(saveButton);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("allows unpublishing without a Сообщение", () => {
    const mutate = mockHooks({ enabled: false, message: "", severity: "info", revision: "" });
    renderWithProviders(<UserBannerSettings />);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить banner" }));
    expect(mutate).toHaveBeenCalledWith({ enabled: false, message: "", severity: "info" }, expect.anything());
  });

  it.each([
    ["info", "Info"],
    ["warning", "Warning"],
    ["Ошибка", "Ошибка"],
  ])("shows the %s Критичность by its human label", (severity, label) => {
    mockHooks({ ...publishedBanner, severity: severity as UserBanner["Критичность"] });
    renderWithProviders(<UserBannerSettings />);

    expect(screen.getByRole("combobox", { name: "Критичность баннера" })).toHaveTextContent(label);
  });
});
