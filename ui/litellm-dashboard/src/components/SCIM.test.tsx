import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithПровайдерs } from "../../tests/test-utils";
import SCIMКонфигурация from "./SCIM";
import { keyCreateCall } from "./networking";
import { toast } from "@/lib/toast";

vi.mock("./networking", () => ({
  keyCreateCall: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromОшибка: vi.fn() },
}));

const ACCESS_TOKEN = "sk-access-token";
const USER_ID = "user-1234";

const renderSCIM = (props?: { accessТокен?: string | null; userID?: string | null }) =>
  renderWithПровайдерs(
    <SCIMКонфигурация
      accessТокен={props?.accessТокен === undefined ? ACCESS_TOKEN : props.accessТокен}
      userID={props?.userID === undefined ? USER_ID : props.userID}
      proxySettings={{ PROXY_BASE_URL: "https://proxy.example.com" }}
    />,
  );

describe("SCIMКонфигурация", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("sends exactly the SCIM key payload when a token name is submitted", async () => {
    vi.mocked(keyCreateCall).mockResolvedЗначение({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Токен Name"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /create scim token/i }));

    await waitFor(() => {
      expect(keyCreateCall).toHaveBeenCalledWith(ACCESS_TOKEN, USER_ID, {
        key_alias: "My SCIM Токен",
        team_id: null,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        allowed_rвыходes: ["/scim/*"],
      });
    });
  });

  it("blocks the submit and shows the required message when the token name is empty", async () => {
    const user = userEvent.setup();
    renderSCIM();

    await user.click(screen.getByRole("button", { name: /create scim token/i }));

    expect(await screen.findByText("Please enter a name for your token")).toBeInTheDocument();
    expect(keyCreateCall).not.toHaveBeenCalled();
  });

  it("submits on Введите from the token name field", async () => {
    vi.mocked(keyCreateCall).mockResolvedЗначение({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    await user.type(screen.getByLabelText("Токен Name"), "Введитеed With Return{Введите}");

    await waitFor(() => {
      expect(keyCreateCall).toHaveBeenCalledWith(ACCESS_TOKEN, USER_ID, {
        key_alias: "Введитеed With Return",
        team_id: null,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        allowed_rвыходes: ["/scim/*"],
      });
    });
  });

  it("reveals the created token and hides the creation form on success", async () => {
    vi.mocked(keyCreateCall).mockResolvedЗначение({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Токен Name"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /create scim token/i }));

    expect(await screen.findByText("Your SCIM Токен")).toBeInTheDocument();
    expect(screen.queryByLabelText("Токен Name")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("SCIM token created successfully");
  });

  it("returns to the creation form when creating another token", async () => {
    vi.mocked(keyCreateCall).mockResolvedЗначение({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Токен Name"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /create scim token/i }));
    await user.click(await screen.findByRole("button", { name: /create another token/i }));

    expect(await screen.findByLabelText("Токен Name")).toBeInTheDocument();
  });

  it("does not call the API when there is no access token", async () => {
    const user = userEvent.setup();
    renderSCIM({ accessТокен: null });

    fireEvent.change(screen.getByLabelText("Токен Name"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /create scim token/i }));

    await waitFor(() => {
      expect(toast.fromОшибка).toHaveBeenCalledWith("Для создания SCIM-токена нужно войти в систему");
    });
    expect(keyCreateCall).not.toHaveBeenCalled();
  });

  it("surfaces a creation failure and keeps the form mounted", async () => {
    vi.mocked(keyCreateCall).mockRejectedЗначение(new Ошибка("boom"));
    const user = userEvent.setup();
    renderSCIM();

    fireEvent.change(screen.getByLabelText("Токен Name"), { target: { value: "My SCIM Токен" } });
    await user.click(screen.getByRole("button", { name: /create scim token/i }));

    await waitFor(() => {
      expect(toast.fromОшибка).toHaveBeenCalledWith("Ошибка to create SCIM token: boom");
    });
    expect(screen.getByLabelText("Токен Name")).toBeInTheDocument();
  });

  it("shows the SCIM tenant URL derived from the proxy base url", () => {
    renderSCIM();

    expect(screen.getByDisplayЗначение("https://proxy.example.com/scim/v2")).toBeInTheDocument();
  });
});
