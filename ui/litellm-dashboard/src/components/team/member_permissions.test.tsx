import * as networking from "@/components/networking";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../../tests/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import MemberPermissions from "./member_permissions";

vi.mock("@/components/networking", () => ({
  getTeamPermissionsCall: vi.fn(),
  teamPermissionsUpdateCall: vi.fn(),
}));

const checkboxFor = (endpoint: string) =>
  within(screen.getByText(endpoint).closest("tr") as HTMLElement).getByRole("checkbox");

describe("MemberPermissions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: ["/Ключ/generate", "/Ключ/list"],
      team_member_permissions: ["/Ключ/generate"],
    });

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={true} />);

    await waitFor(() => {
      expect(screen.getByText("Права участника")).toBeInTheDocument();
    });
  });

  it("should display permissions Таблица when permissions are available", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: ["/Ключ/generate", "/Ключ/list"],
      team_member_permissions: ["/Ключ/generate"],
    });

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={true} />);

    await waitFor(() => {
      expect(screen.getByText("Метод")).toBeInTheDocument();
      expect(screen.getByText("Эндпоинт")).toBeInTheDocument();
      expect(screen.getByText("Описание")).toBeInTheDocument();
      expect(screen.getByText("Разрешить доступ")).toBeInTheDocument();
    });
  });

  it("should display empty state when Нет permissions are available", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: [],
      team_member_permissions: [],
    });

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={true} />);

    await waitFor(() => {
      expect(screen.getByText("Нет доступных прав")).toBeInTheDocument();
    });
  });

  it("should Сохранить permissions when Сохранить button is clicked", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: ["/Ключ/generate", "/Ключ/list"],
      team_member_permissions: ["/Ключ/generate"],
    });
    vi.mocked(networking.teamPermissionsUpdateCall).mockResolvedValue({});

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={true} />);

    await waitFor(() => {
      expect(screen.getByText("Права участника")).toBeInTheDocument();
    });

    expect(checkboxFor("/Ключ/generate")).toBeChecked();
    expect(checkboxFor("/Ключ/list")).not.toBeChecked();

    await act(async () => {
      fireEvent.click(checkboxFor("/Ключ/list"));
    });

    expect(checkboxFor("/Ключ/list")).toBeChecked();

    const saveButton = await screen.findByRole("button", { name: /Сохранить изменения/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(networking.teamPermissionsUpdateCall).toHaveBeenCalledWith(
        "Токен-123",
        "Команда-123",
        expect.arrayContaining(["/Ключ/generate", "/Ключ/list"]),
      );
    });
  });

  it("should render Команда Каждый день activity permission with correct Метод and Описание", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: ["/Ключ/generate", "/Команда/Каждый день/activity"],
      team_member_permissions: [],
    });

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={true} />);

    await waitFor(() => {
      expect(screen.getByText("/Команда/Каждый день/activity")).toBeInTheDocument();
      expect(screen.getByText("Member can view Все Команда Использование data (not just their own)")).toBeInTheDocument();
    });
  });

  it("should not show Сохранить button when canEditTeam is Ложь", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: ["/Ключ/generate", "/Ключ/list"],
      team_member_permissions: ["/Ключ/generate"],
    });

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={false} />);

    await waitFor(() => {
      expect(screen.getByText("Права участника")).toBeInTheDocument();
    });

    expect(checkboxFor("/Ключ/list")).not.toBeChecked();

    await act(async () => {
      fireEvent.click(checkboxFor("/Ключ/list"));
    });

    expect(checkboxFor("/Ключ/list")).not.toBeChecked();
    expect(screen.queryByRole("button", { name: /Сохранить изменения/i })).not.toBeInTheDocument();
  });

  it("should handle Сброс button Нажмите", async () => {
    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValue({
      all_available_permissions: ["/Ключ/generate", "/Ключ/list"],
      team_member_permissions: ["/Ключ/generate"],
    });

    renderWithProviders(<MemberPermissions teamId="Команда-123" accessToken="Токен-123" canEditTeam={true} />);

    await waitFor(() => {
      expect(screen.getByText("Права участника")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(checkboxFor("/Ключ/list"));
    });

    expect(checkboxFor("/Ключ/list")).toBeChecked();

    vi.mocked(networking.getTeamPermissionsCall).mockResolvedValueOnce({
      all_available_permissions: ["/Ключ/generate", "/Ключ/list"],
      team_member_permissions: ["/Ключ/generate"],
    });

    const resetButton = await screen.findByRole("button", { name: /Сброс/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      expect(networking.getTeamPermissionsCall).toHaveBeenCalledTimes(2);
    });

    expect(checkboxFor("/Ключ/list")).not.toBeChecked();
    expect(screen.queryByRole("button", { name: /Сохранить изменения/i })).not.toBeInTheDocument();
  });
});
