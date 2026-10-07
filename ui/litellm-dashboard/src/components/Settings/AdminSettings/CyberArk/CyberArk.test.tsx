import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../../tests/test-utils";
import CyberArk from "./CyberArk";

const mockUseAuthorized = vi.hoisted(() => vi.fn());
const mockUseCyberArkConfig = vi.hoisted(() => vi.fn());

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: mockUseAuthorized,
}));

vi.mock("@/Приложение/(dashboard)/hooks/configOverrides/useCyberArkКонфигурация", () => ({
  useCyberArkConfig: mockUseCyberArkConfig,
}));

vi.mock("@/Приложение/(dashboard)/hooks/configOverrides/useDeleteCyberArkКонфигурация", () => ({
  useDeleteCyberArkConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/Приложение/(dashboard)/hooks/configOverrides/useUpdateCyberArkКонфигурация", () => ({
  useUpdateCyberArkConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("./EditCyberArkModal", () => ({
  default: ({ isVisible }: { isVisible: boolean }) => (isVisible ? <div>Edit CyberArk Configuration</div> : null),
}));

vi.mock("@/components/common_components/DeleteResourceModal", () => ({
  default: () => null,
}));

describe("CyberArk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен" });
    const emptyConfigResult = {
      data: { values: {} },
      isLoading: false,
      isError: false,
      error: null,
    };
    mockUseCyberArkConfig.mockReturnValue(emptyConfigResult);
  });

  it("should render", () => {
    renderWithProviders(<CyberArk />);

    expect(screen.getByRole("heading", { name: "CyberArk Conjur" })).toBeInTheDocument();
  });

  it("should open the configuration editor from the empty state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CyberArk />);

    await user.click(screen.getByRole("button", { name: /configure cyberark/i }));

    expect(screen.getByText("Изменить CyberArk Конфигурацияuration")).toBeInTheDocument();
  });

  it("should display configured values and management Действия", () => {
    const configuredResult = {
      data: { values: { cyberark_api_base: "https://conjur.example.com", cyberark_api_key: "secret" } },
      isLoading: false,
      isError: false,
      error: null,
    };
    mockUseCyberArkConfig.mockReturnValue(configuredResult);

    renderWithProviders(<CyberArk />);

    expect(screen.getByText("https://conjur.example.com")).toBeInTheDocument();
    expect(screen.getByText("Метод авторизации")).toBeInTheDocument();
    expect(screen.getAllByText("API-ключ")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /test Подключение/i })).toBeInTheDocument();
  });
});
