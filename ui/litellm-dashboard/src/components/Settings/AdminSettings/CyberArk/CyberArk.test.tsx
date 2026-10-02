import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../../tests/test-utils";
import CyberArk from "./CyberArk";

const mockUseАвторизовано = vi.hoisted(() => vi.fn());
const mockUseCyberArkКонфигурация = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: mockUseАвторизовано,
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useCyberArkКонфигурация", () => ({
  useCyberArkКонфигурация: mockUseCyberArkКонфигурация,
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useDeleteCyberArkКонфигурация", () => ({
  useDeleteCyberArkКонфигурация: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkКонфигурация", () => ({
  useUpdateCyberArkКонфигурация: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("./EditCyberArkModal", () => ({
  default: ({ isVisible }: { isVisible: boolean }) => (isVisible ? <div>Edit CyberArk Конфигурацияuration</div> : null),
}));

vi.mock("@/components/common_components/DeleteResourceModal", () => ({
  default: () => null,
}));

describe("CyberArk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseАвторизовано.mockReturnЗначение({ accessТокен: "test-token" });
    const emptyКонфигурацияРезультат = {
      data: { values: {} },
      isLoading: false,
      isОшибка: false,
      error: null,
    };
    mockUseCyberArkКонфигурация.mockReturnЗначение(emptyКонфигурацияРезультат);
  });

  it("should render", () => {
    renderWithProviders(<CyberArk />);

    expect(screen.getByRole("heading", { name: "CyberArk Conjur" })).toBeInTheDocument();
  });

  it("should open the configuration editor from the empty state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CyberArk />);

    await user.click(screen.getByRole("button", { name: /configure cyberark/i }));

    expect(screen.getByText("Edit CyberArk Конфигурацияuration")).toBeInTheDocument();
  });

  it("should display configured values and management actions", () => {
    const configuredРезультат = {
      data: { values: { cyberark_api_base: "https://conjur.example.com", cyberark_api_key: "secret" } },
      isLoading: false,
      isОшибка: false,
      error: null,
    };
    mockUseCyberArkКонфигурация.mockReturnЗначение(configuredРезультат);

    renderWithProviders(<CyberArk />);

    expect(screen.getByText("https://conjur.example.com")).toBeInTheDocument();
    expect(screen.getByText("Метод авторизации")).toBeInTheDocument();
    expect(screen.getAllByText("API Ключ")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /test connection/i })).toBeInTheDocument();
  });
});
