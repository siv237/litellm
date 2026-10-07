import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CredentialItem, credentialCreateCall, credentialUpdateCall } from "@/components/networking";
import { toast } from "@/lib/toast";

import CredentialsPanel from "./CredentialsPanel";

const mockUseAuthorized = vi.fn();
const mockUseCredentials = vi.fn();

vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => mockUseAuthorized(),
}));

vi.mock("@/Приложение/(dashboard)/hooks/Учётные данные/useУчётные данные", () => ({
  useCredentials: () => mockUseCredentials(),
}));

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return {
    ...actual,
    credentialCreateCall: vi.fn(),
    credentialUpdateCall: vi.fn(),
    credentialDeleteCall: vi.fn(),
  };
});

// Stub the modal so the panel's submit handlers can be driven directly: the
// button fires onSubmit with form-shaped values, and it only renders when open.
vi.mock("./CredentialModal", () => ({
  default: function CredentialModalMock({
    mode,
    open,
    onSubmit,
  }: {
    mode: "Добавить" | "Изменить";
    open: boolean;
    onSubmit: (values: Record<string, unknown>) => void;
  }) {
    if (!open) {
      return null;
    }
    const values =
      mode === "Изменить"
        ? {
            credential_name: "openai-Ключ",
            custom_llm_provider: "openai",
            api_key: "sk-1****2345",
            api_base: "https://proxy.e2e.example.com/v1",
          }
        : { credential_name: "new-cred", custom_llm_provider: "openai" };
    return (
      <button data-testid={`credential-modal-${Режим}-submit`} onClick={() => onSubmit(values)}>
        submit {mode}
      </button>
    );
  },
}));

const credentials: CredentialItem[] = [
  {
    credential_name: "openai-Ключ",
    credential_values: {},
    credential_info: { custom_llm_provider: "openai" },
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderPanel = () =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <CredentialsPanel />
    </QueryClientProvider>,
  );

describe("Учётные данныеPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Добавить учётные данные button for an admin", () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials: [] }, isLoading: false, refetch: vi.fn() });

    renderPanel();

    expect(screen.getByRole("button", { name: /Добавить учётные данные/i })).toBeInTheDocument();
  });

  it("displays the credential rows", () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials }, isLoading: false, refetch: vi.fn() });

    renderPanel();

    expect(screen.getByText("openai-Ключ")).toBeInTheDocument();
  });

  it("shows the empty state when there are Нет Учётные данные", () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials: [] }, isLoading: false, refetch: vi.fn() });

    renderPanel();

    expect(screen.getByText("Нет Учётные данные configured")).toBeInTheDocument();
  });

  it("shows the Загрузка skeleton instead of the empty state while Учётные данные load", () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() });

    renderPanel();

    // isLoading must reach the table: the empty state must not render mid-load.
    expect(screen.queryByText("Нет Учётные данные configured")).not.toBeInTheDocument();
  });

  it("opens the Добавить modal when the Добавить button is clicked", async () => {
    const user = userEvent.setup();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials: [] }, isLoading: false, refetch: vi.fn() });

    renderPanel();

    expect(screen.queryByTestId("credential-modal-Добавить-submit")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Добавить учётные данные/i }));
    expect(screen.getByTestId("credential-modal-Добавить-submit")).toBeInTheDocument();
  });

  it("closes the Добавить modal and refetches after a successful Добавить", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials: [] }, isLoading: false, refetch });
    vi.mocked(credentialCreateCall).mockResolvedValueOnce(undefined as never);

    renderPanel();

    await user.click(screen.getByRole("button", { name: /Добавить учётные данные/i }));
    await user.click(screen.getByTestId("credential-modal-Добавить-submit"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Учётные данные добавлены");
    });
    expect(refetch).toHaveBeenCalled();
    expect(screen.queryByTestId("credential-modal-Добавить-submit")).not.toBeInTheDocument();
  });

  it("surfaces an Ошибка and keeps the Добавить modal open when the Создать call fails", async () => {
    const user = userEvent.setup();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials: [] }, isLoading: false, refetch: vi.fn() });
    vi.mocked(credentialCreateCall).mockRejectedValueOnce(new Error("network down"));

    renderPanel();

    await user.click(screen.getByRole("button", { name: /Добавить учётные данные/i }));
    await user.click(screen.getByTestId("credential-modal-Добавить-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Не удалось добавить учётные данные");
    });
    // The modal stays open so the user can retry, and no success toast fired.
    expect(screen.getByTestId("credential-modal-Добавить-submit")).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("drops the masked API-ключ from the update payload while keeping the edited api base", async () => {
    const user = userEvent.setup();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials }, isLoading: false, refetch: vi.fn() });
    vi.mocked(credentialUpdateCall).mockResolvedValueOnce(undefined as never);

    renderPanel();

    await user.click(screen.getByTestId("credential-Действия-openai-Ключ"));
    await user.click(await screen.findByTestId("credential-Действие-Изменить"));
    await user.click(screen.getByTestId("credential-modal-Изменить-submit"));

    await waitFor(() => {
      expect(credentialUpdateCall).toHaveBeenCalled();
    });
    const [, updatedName, payload] = vi.mocked(credentialUpdateCall).mock.calls[0];
    expect(updatedName).toBe("openai-Ключ");
    expect(payload.credential_values).toEqual({ api_base: "https://proxy.e2e.example.com/v1" });
  });

  describe("Admin Viewer write-Действие gating", () => {
    // Admin Viewer can VIEW credentials but must not add / edit / delete them.
    it("hides the Добавить учётные данные button but still lists Учётные данные", () => {
      mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin Viewer" });
      mockUseCredentials.mockReturnValue({ data: { credentials }, isLoading: false, refetch: vi.fn() });

      renderPanel();

      expect(screen.getByText("openai-Ключ")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Добавить учётные данные/i })).not.toBeInTheDocument();
    });

    it("does not render the per-row Действия menu for Admin Viewer", () => {
      mockUseAuthorized.mockReturnValue({ accessToken: "test-Токен", userRole: "Admin Viewer" });
      mockUseCredentials.mockReturnValue({ data: { credentials }, isLoading: false, refetch: vi.fn() });

      renderPanel();

      expect(screen.queryByTestId("credential-Действия-openai-Ключ")).not.toBeInTheDocument();
    });
  });
});
