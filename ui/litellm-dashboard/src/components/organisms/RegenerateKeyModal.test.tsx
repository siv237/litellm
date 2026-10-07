import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import { RegenerateKeyModal } from "./RegenerateKeyModal";
import { KeyResponse } from "../key_team_helpers/key_list";
import { toast } from "@/lib/toast";

// Mock the networking call
const mockRegenerateKeyCall = vi.fn();
vi.mock("../networking", () => ({
  regenerateKeyCall: (...args: unknown[]) => mockRegenerateKeyCall(...args),
}));

const mockNotificationFromBackend = vi.mocked(toast.fromError);

const makeToken = (overrides: Partial<KeyResponse> = {}): KeyResponse =>
  ({
    token: "Токен-hash-123",
    token_id: "Токен-id-123",
    key_name: "sk-test-Ключ",
    key_alias: "my-test-Ключ",
    max_budget: 100,
    tpm_limit: 5000,
    rpm_limit: 500,
    duration: "30d",
    expires: "2026-12-31T00:00:00Z",
    ...overrides,
  }) as KeyResponse;

describe("ПерегенерироватьКлючModal", () => {
  const mockOnClose = vi.fn();
  const mockOnKeyUpdate = vi.fn();

  const defaultProps = {
    selectedToken: makeToken(),
    visible: true,
    onClose: mockOnClose,
    onKeyUpdate: mockOnKeyUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the modal with correct title", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    expect(screen.getByText("Перегенерировать виртуальный ключ")).toBeInTheDocument();
  });

  it("should not render the modal when visible is Ложь", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} visible={false} />);
    expect(screen.queryByText("Перегенерировать виртуальный ключ")).not.toBeInTheDocument();
  });

  it("should display the form with pre-filled values", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    const keyAliasInput = screen.getByLabelText("Псевдоним ключа") as HTMLInputElement;
    expect(keyAliasInput).toBeDisabled();
    expect(keyAliasInput).toHaveValue("my-test-Ключ");
  });

  it("should display the current expiry when Токен has expires", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    expect(screen.getByText(/Текущий срок:/)).toBeInTheDocument();
  });

  it("should display 'Never' when Токен has Нет expires", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} selectedToken={makeToken({ expires: undefined })} />);
    expect(screen.getByText("Текущий срок: Never")).toBeInTheDocument();
  });

  it("should show Отмена and Перегенерировать buttons in form view", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Перегенерировать/ })).toBeInTheDocument();
  });

  it("should call onClose when Отмена is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Отмена" }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("should call onClose when the X Закрыть button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("should render form fields for Бюджет and Лимиты запросов", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    expect(screen.getByText("Макс. бюджет (USD)")).toBeInTheDocument();
    expect(screen.getByText("Лимит TPM")).toBeInTheDocument();
    expect(screen.getByText("Лимит RPM")).toBeInTheDocument();
  });

  it("should render Длительность and grace period fields", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    expect(screen.getByText("Истекает")).toBeInTheDocument();
    expect(screen.getByText("Grace Period")).toBeInTheDocument();
  });

  it("should display grace period recommendation text", () => {
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    expect(screen.getByText("Рекомендуется: 24–72 ч для продуктовых ключей")).toBeInTheDocument();
  });

  it("should call ПерегенерироватьКлючCall and show success view on successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockRegenerateKeyCall).toHaveBeenCalledOnce();
    });

    await waitFor(() => {
      expect(screen.getByText("sk-new-regenerated-Ключ")).toBeInTheDocument();
    });

    expect(screen.getByText(/will not see it again/)).toBeInTheDocument();
  });

  it("should show Закрыть button after successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("sk-new-regenerated-Ключ")).toBeInTheDocument();
    });

    // Should show Close buttons (footer + modal X), not Cancel/Regenerate
    const closeButtons = screen.getAllByRole("button", { name: "Закрыть" });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "Отмена" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Перегенерировать/ })).not.toBeInTheDocument();
  });

  it("should show Скопировать Ключ button after successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Скопировать Ключ/ })).toBeInTheDocument();
    });
  });

  it("should swap the Скопировать Ключ button to 'Скопировано' after clicking it", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    const copyButton = await screen.findByRole("button", { name: /Скопировать Ключ/ });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Скопировано/ })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Скопировать Ключ/ })).not.toBeInTheDocument();
  });

  it("should display the 'Виртуальный ключ' label above the Ключ in the success view", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Виртуальный ключ")).toBeInTheDocument();
    });
  });

  it("should call onКлючUpdate with Обновлён data after successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    const updateCall = mockOnKeyUpdate.mock.calls[0][0];
    expect(updateCall.key_name).toBe("sk-new-regenerated-Ключ");
  });

  it.each([
    ["30s", /New expiry:/],
    ["15m", /New expiry:/],
    ["2h", /New expiry:/],
    ["7d", /New expiry:/],
    ["2w", /New expiry:/],
    ["1mo", /New expiry:/],
  ])("should compute a new expiry Предпросмотр for Длительность '%s'", async (durationInput, expected) => {
    const user = userEvent.setup();
    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    const durationField = screen.getByPlaceholderText("e.g. 30s, 30h, 30d");
    await user.clear(durationField);
    await user.type(durationField, durationInput);

    await waitFor(() => {
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  it("should use the API Ответ's ISO expires for the optimistic update", async () => {
    const user = userEvent.setup();
    const apiExpires = "2026-06-13T11:08:16.783000Z";
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
      expires: apiExpires,
    });

    renderWithProviders(
      <RegenerateKeyModal {...defaultProps} selectedToken={makeToken({ expires: "2026-12-31T00:00:00Z" })} />,
    );

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    expect(mockOnKeyUpdate.mock.calls[0][0].expires).toBe(apiExpires);
  });

  it("should fall Назад to the Предыдущее expiry when the API Ответ omits expires", async () => {
    const user = userEvent.setup();
    const previousExpires = "2026-12-31T00:00:00Z";
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(
      <RegenerateKeyModal {...defaultProps} selectedToken={makeToken({ expires: previousExpires })} />,
    );

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    expect(mockOnKeyUpdate.mock.calls[0][0].expires).toBe(previousExpires);
  });

  it("should reject unparseable Длительность values before calling Перегенерировать", async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);

    const durationField = screen.getByPlaceholderText("e.g. 30s, 30h, 30d");
    await user.clear(durationField);
    await user.type(durationField, "bogus");

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Must be a Длительность like 30s, 30m, 24h, 2d, 1w, or 1mo")).toBeInTheDocument();
    });
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
    expect(mockNotificationFromBackend).not.toHaveBeenCalled();
  });

  it("should pass form values to onКлючUpdate even when the API echoes Назад different limits", async () => {
    // Regression: when the regenerate endpoint returns GenerateKeyResponse, it echoes
    // back the existing max_budget / tpm_limit / rpm_limit. The modal must prefer the
    // values the user just submitted, not whatever the server echoes.
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
      // stale values echoed from the server
      max_budget: 9999,
      tpm_limit: 9999,
      rpm_limit: 9999,
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    const updateCall = mockOnKeyUpdate.mock.calls[0][0];
    // The form's pre-filled values (from makeToken) must win over the API echo.
    expect(updateCall.max_budget).toBe(100);
    expect(updateCall.tpm_limit).toBe(5000);
    expect(updateCall.rpm_limit).toBe(500);
  });

  it("should display Псевдоним ключа in success view", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("my-test-Ключ")).toBeInTheDocument();
    });
  });

  it("should display 'Нет Псевдоним set' when Ключ has Нет Псевдоним", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} selectedToken={makeToken({ key_alias: undefined })} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Нет Псевдоним set")).toBeInTheDocument();
    });
  });

  it("should not call ПерегенерироватьКлючCall when selectedToken is null", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegenerateKeyModal {...defaultProps} selectedToken={null} />);

    // The form shouldn't even be populated, but we check the button doesn't trigger a call
    const regenerateBtn = screen.queryByRole("button", { name: /Перегенерировать/ });
    if (regenerateBtn) {
      await user.click(regenerateBtn);
    }

    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
  });

  it("should mark expiry as Просрочен without pre-filling a Длительность", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-06-06T12:00:00Z"));

    renderWithProviders(
      <RegenerateKeyModal
        {...defaultProps}
        selectedToken={makeToken({ expires: "2026-06-01T12:00:00Z", duration: "" })}
      />,
    );

    expect(screen.getByText(/\(expired\)/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 30s, 30h, 30d")).toHaveValue("");
  });

  it("should require a new expiration before regenerating an Просрочен Ключ", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-06-06T12:00:00Z"));
    const user = userEvent.setup();

    renderWithProviders(
      <RegenerateKeyModal
        {...defaultProps}
        selectedToken={makeToken({ expires: "2026-06-01T12:00:00Z", duration: "" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Expiration is Обязательно for Просрочен Ключи")).toBeInTheDocument();
    });
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
    // Form validation rejections must not surface a backend-style toast.
    expect(mockNotificationFromBackend).not.toHaveBeenCalled();
  });

  it("should pass the correct Токен identifier to ПерегенерироватьКлючCall", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-Ключ",
      token: "new-hash",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockRegenerateKeyCall).toHaveBeenCalledWith(
        "123", // accessToken from mocked useAuthorized
        "Токен-hash-123", // selectedToken.token
        expect.any(Object),
      );
    });
  });

  it("should report the rotated hash from token_id when the API leaves Токен null", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({
      key: "sk-new-regenerated-Ключ",
      token: null,
      token_id: "rotated-hash-456",
    });

    renderWithProviders(<RegenerateKeyModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });
    expect(mockOnKeyUpdate.mock.calls[0][0].token).toBe("rotated-hash-456");
  });
});
