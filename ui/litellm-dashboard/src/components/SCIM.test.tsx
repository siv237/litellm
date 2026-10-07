import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../tests/test-utils";
import SCIMConfig from "./SCIM";
import { keyCreateCall } from "./networking";
import { toast } from "@/lib/toast";

vi.mock("./networking", () => ({
  keyCreateCall: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

const ACCESS_TOKEN = "sk-access-Токен";
const USER_ID = "Пользователь-1234";

const renderSCIM = (props?: { accessToken?: string | null; userID?: string | null }) =>
  renderWithProviders(
    <SCIMConfig
      accessToken={props?.accessToken === undefined ? ACCESS_TOKEN : props.accessToken}
      userID={props?.userID === undefined ? USER_ID : props.userID}
      proxySettings={{ PROXY_BASE_URL: "https://proxy.example.com" }}
    />,
  );

describe("SCIMКонфигурация", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends exactly the SCIM Ключ payload when a Имя токена is submitted", async () => {
    vi.mocked(keyCreateCall).mockResolvedValue({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Имя токена"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /Создать scim Токен/i }));

    await waitFor(() => {
      expect(keyCreateCall).toHaveBeenCalledWith(ACCESS_TOKEN, USER_ID, {
        key_alias: "My SCIM Токен",
        team_id: null,
        models: [],
        allowed_routes: ["/scim/*"],
      });
    });
  });

  it("blocks the submit and shows the Обязательно Сообщение when the Имя токена is empty", async () => {
    const user = userEvent.setup();
    renderSCIM();

    await user.click(screen.getByRole("button", { name: /Создать scim Токен/i }));

    expect(await screen.findByText("Please enter a Название for your Токен")).toBeInTheDocument();
    expect(keyCreateCall).not.toHaveBeenCalled();
  });

  it("submits on Enter from the Имя токена Поле", async () => {
    vi.mocked(keyCreateCall).mockResolvedValue({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    await user.type(screen.getByLabelText("Имя токена"), "Entered With Return{Enter}");

    await waitFor(() => {
      expect(keyCreateCall).toHaveBeenCalledWith(ACCESS_TOKEN, USER_ID, {
        key_alias: "Entered With Return",
        team_id: null,
        models: [],
        allowed_routes: ["/scim/*"],
      });
    });
  });

  it("reveals the Создан Токен and hides the creation form on success", async () => {
    vi.mocked(keyCreateCall).mockResolvedValue({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Имя токена"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /Создать scim Токен/i }));

    expect(await screen.findByText("Ваш SCIM-токен")).toBeInTheDocument();
    expect(screen.queryByLabelText("Имя токена")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("SCIM Токен Создан successfully");
  });

  it("returns to the creation form when creating another Токен", async () => {
    vi.mocked(keyCreateCall).mockResolvedValue({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Имя токена"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /Создать scim Токен/i }));
    await user.click(await screen.findByRole("button", { name: /Создать ещё токен/i }));

    expect(await screen.findByLabelText("Имя токена")).toBeInTheDocument();
  });

  it("does not call the API when there is Нет access Токен", async () => {
    const user = userEvent.setup();
    renderSCIM({ accessToken: null });

    fireEvent.change(screen.getByLabelText("Имя токена"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /Создать scim Токен/i }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("Для создания SCIM-токена нужно войти в систему");
    });
    expect(keyCreateCall).not.toHaveBeenCalled();
  });

  it("surfaces a creation failure and keeps the form mounted", async () => {
    vi.mocked(keyCreateCall).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Имя токена"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /Создать scim Токен/i }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("Ошибка to Создать SCIM Токен: boom");
    });
    expect(screen.getByLabelText("Имя токена")).toBeInTheDocument();
  });

  it("shows the URL тенанта SCIM derived from the proxy base url", () => {
    renderSCIM();

    expect(screen.getByDisplayValue("https://proxy.example.com/scim/v2")).toBeInTheDocument();
  });
});
