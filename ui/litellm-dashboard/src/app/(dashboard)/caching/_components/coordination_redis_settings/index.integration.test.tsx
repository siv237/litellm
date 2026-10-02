import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import КоординационныйRedisSettings from "./index";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  getCoordinationRedisSettingsCall: vi.fn(),
  testCoordinationRedisConnectionCall: vi.fn(),
  updateCoordinationRedisSettingsCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessТокен: "sk-test" }),
}));

const getSettings = vi.mocked(networking.getCoordinationRedisSettingsCall);
const updateSettings = vi.mocked(networking.updateCoordinationRedisSettingsCall);
const testПодключение = vi.mocked(networking.testCoordinationRedisConnectionCall);
const notifications = vi.mocked(toast);

const settingsОтвет = (
  values: Record<string, unknown>,
  source: "coordination_redis" | "cache_backend" | "environment" | null = null,
) => ({ values, fields: [], source });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new ЗапросClient({ defaultOptions: { queries: { retry: false } } });
  return <ЗапросClientПровайдер client={queryClient}>{children}</ЗапросClientПровайдер>;
};

const renderSettings = () => render(<КоординационныйRedisSettings />, { wrapper });

const clickSave = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /save changes/i }));
describe("КоординационныйRedisSettings value retention across redis types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedЗначение(settingsОтвет({}));
    updateSettings.mockResolvedЗначение(undefined);
  });

  const pickRedisType = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByRole("option", { name }));
  };

  it("keeps a value typed into a sentinel-only field when the type is switched away and back", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByLabelText("Хост");

    await pickRedisType(user, /sentinel/i);
    fireEvent.change(await screen.findByLabelText("Имя сервиса"), { target: { value: "mymaster" } });

    await pickRedisType(user, /node/i);
    await waitFor(() => expect(screen.queryByLabelText("Имя сервиса")).not.toBeInTheDocument());

    await pickRedisType(user, /sentinel/i);

    expect(await screen.findByLabelText("Имя сервиса")).toHaveЗначение("mymaster");
  });

  it("leaves a sentinel-only value выход of the payload once the type is no longer sentinel", async () => {
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
