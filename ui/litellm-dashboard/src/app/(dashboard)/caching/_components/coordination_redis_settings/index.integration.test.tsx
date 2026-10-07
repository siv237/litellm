import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import CoordinationRedisSettings from "./index";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  getCoordinationRedisSettingsCall: vi.fn(),
  testCoordinationRedisConnectionCall: vi.fn(),
  updateCoordinationRedisSettingsCall: vi.fn(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessToken: "sk-test" }),
}));

const getSettings = vi.mocked(networking.getCoordinationRedisSettingsCall);
const updateSettings = vi.mocked(networking.updateCoordinationRedisSettingsCall);
const testConnection = vi.mocked(networking.testCoordinationRedisConnectionCall);
const notifications = vi.mocked(toast);

const settingsResponse = (
  values: Record<string, unknown>,
  source: "coordination_redis" | "cache_backend" | "Окружение" | null = null,
) => ({ values, fields: [], source });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const renderSettings = () => render(<CoordinationRedisSettings />, { wrapper });

const clickSave = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /Сохранить изменения/i }));
describe("CoordinationRedisSettings Значение retention across redis types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue(settingsResponse({}));
    updateSettings.mockResolvedValue(undefined);
  });

  const pickRedisType = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByRole("option", { name }));
  };

  it("keeps a Значение typed into a sentinel-only Поле when the Тип is switched away and Назад", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByLabelText("Хост");

    await pickRedisType(user, /sentinel/i);
    fireEvent.change(await screen.findByLabelText("Имя сервиса"), { target: { value: "mymaster" } });

    await pickRedisType(user, /node/i);
    await waitFor(() => expect(screen.queryByLabelText("Имя сервиса")).not.toBeInTheDocument());

    await pickRedisType(user, /sentinel/i);

    expect(await screen.findByLabelText("Имя сервиса")).toHaveValue("mymaster");
  });

  it("leaves a sentinel-only Значение out of the payload once the Тип is Нет longer sentinel", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByLabelText("Хост");

    await pickRedisType(user, /sentinel/i);
    fireEvent.change(await screen.findByLabelText("Имя сервиса"), { target: { value: "mymaster" } });

    await pickRedisType(user, /node/i);
    await waitFor(() => expect(screen.queryByLabelText("Имя сервиса")).not.toBeInTheDocument());

    await clickSave(user);

    await waitFor(() => expect(updateSettings).toHaveBeenCalled());
    expect(JSON.stringify(updateSettings.mock.calls[0])).not.toContain("mymaster");
  });
});
