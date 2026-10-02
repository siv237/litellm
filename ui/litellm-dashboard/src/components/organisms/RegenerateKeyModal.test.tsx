import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import { ПерегенерироватьКлючModal } from "./ПерегенерироватьКлючModal";
import { КлючОтвет } from "../key_team_helpers/key_list";
import { toast } from "@/lib/toast";

// Mock the networking call
const mockRegenerateKeyCall = vi.fn();
vi.mock("../networking", () => ({
  regenerateKeyCall: (...args: unknown[]) => mockRegenerateKeyCall(...args),
}));

const mockNotificationFromBackend = vi.mocked(toast.fromОшибка);

const makeТокен = (overrides: Partial<КлючОтвет> = {}): КлючОтвет =>
  ({
    token: "token-hash-123",
    token_id: "token-id-123",
    key_name: "sk-test-key",
    key_alias: "my-test-key",
    max_budget: 100,
    tpm_limit: 5000,
    rpm_limit: 500,
    duration: "30d",
    expires: "2026-12-31T00:00:00Z",
    ...overrides,
  }) as КлючОтвет;

describe("ПерегенерироватьКлючModal", () => {
  const mockOnClose = vi.fn();
  const mockOnKeyUpdate = vi.fn();

  const defaultProps = {
    selectedТокен: makeТокен(),
    visible: true,
    onClose: mockOnClose,
    onKeyUpdate: mockOnKeyUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the modal with correct title", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    expect(screen.getByText("Перегенерировать виртуальный ключ")).toBeInTheDocument();
  });

  it("should not render the modal when visible is false", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} visible={false} />);
    expect(screen.queryByText("Перегенерировать виртуальный ключ")).not.toBeInTheDocument();
  });

  it("should display the form with pre-filled values", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    const keyAliasВход = screen.getByLabelText("Псевдоним ключа") as HTMLInElement;
    expect(keyAliasВход).toBeDisabled();
    expect(keyAliasВход).toHaveЗначение("my-test-key");
  });

  it("should display the current expiry when token has expires", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    expect(screen.getByText(/Текущий срок:/)).toBeInTheDocument();
  });

  it("should display 'Never' when token has no expires", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} selectedТокен={makeТокен({ expires: undefined })} />);
    expect(screen.getByText("Текущий срок: Never")).toBeInTheDocument();
  });

  it("should show Cancel and Перегенерировать buttons in form view", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Перегенерировать/ })).toBeInTheDocument();
  });

  it("should call onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("should call onClose when the X close button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("should render form fields for budget and rate limits", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    expect(screen.getByText("Макс. бюджет (USD)")).toBeInTheDocument();
    expect(screen.getByText("Лимит TPM")).toBeInTheDocument();
    expect(screen.getByText("Лимит RPM")).toBeInTheDocument();
  });

  it("should render duration and grace period fields", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    expect(screen.getByText("Истекает")).toBeInTheDocument();
    expect(screen.getByText("Grace Period")).toBeInTheDocument();
  });

  it("should display grace period recommendation text", () => {
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    expect(screen.getByText("Рекомендуется: 24–72 ч для продуктовых ключей")).toBeInTheDocument();
  });

  it("should call regenerateKeyCall and show success view on successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockRegenerateKeyCall).toHaveBeenCalledOnce();
    });

    await waitFor(() => {
      expect(screen.getByText("sk-new-regenerated-key")).toBeInTheDocument();
    });

    expect(screen.getByText(/will not see it again/)).toBeInTheDocument();
  });

  it("should show Close button after successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("sk-new-regenerated-key")).toBeInTheDocument();
    });

    // Should show Close buttons (footer + modal X), not Cancel/Перегенерировать
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Перегенерировать/ })).not.toBeInTheDocument();
  });

  it("should show Copy Ключ button after successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copy Ключ/ })).toBeInTheDocument();
    });
  });

  it("should swap the Copy Ключ button to 'Copied' after clicking it", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    const copyButton = await screen.findByRole("button", { name: /Copy Ключ/ });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copied/ })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Copy Ключ/ })).not.toBeInTheDocument();
  });

  it("should display the 'Виртуальный ключ' label above the key in the success view", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Виртуальный ключ")).toBeInTheDocument();
    });
  });

  it("should call onKeyUpdate with updated data after successful regeneration", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    const updateCall = mockOnKeyUpdate.mock.calls[0][0];
    expect(updateCall.key_name).toBe("sk-new-regenerated-key");
  });

  it.each([
    ["30s", /Новый срок:/],
    ["15m", /Новый срок:/],
    ["2h", /Новый срок:/],
    ["7d", /Новый срок:/],
    ["2w", /Новый срок:/],
    ["1mo", /Новый срок:/],
  ])("should compute a new expiry preview for duration '%s'", async (durationВход, expected) => {
    const user = userEvent.setup();
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    const durationПоле = screen.getByPlaceholderText("e.g. 30s, 30h, 30d");
    await user.clear(durationПоле);
    await user.type(durationПоле, durationВход);

    await waitFor(() => {
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  it("should use the API response's ISO expires for the optimistic update", async () => {
    const user = userEvent.setup();
    const apiExpires = "2026-06-13T11:08:16.783000Z";
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
      expires: apiExpires,
    });

    renderWithProviders(
      <ПерегенерироватьКлючModal {...defaultProps} selectedТокен={makeТокен({ expires: "2026-12-31T00:00:00Z" })} />,
    );

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    expect(mockOnKeyUpdate.mock.calls[0][0].expires).toBe(apiExpires);
  });

  it("should fall back to the previous expiry when the API response omits expires", async () => {
    const user = userEvent.setup();
    const previousExpires = "2026-12-31T00:00:00Z";
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(
      <ПерегенерироватьКлючModal {...defaultProps} selectedТокен={makeТокен({ expires: previousExpires })} />,
    );

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    expect(mockOnKeyUpdate.mock.calls[0][0].expires).toBe(previousExpires);
  });

  it("should reject unparseable duration values before calling regenerate", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);

    const durationПоле = screen.getByPlaceholderText("e.g. 30s, 30h, 30d");
    await user.clear(durationПоле);
    await user.type(durationПоле, "bogus");

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Must be a duration like 30s, 30m, 24h, 2d, 1w, or 1mo")).toBeInTheDocument();
    });
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
    expect(mockNotificationFromBackend).not.toHaveBeenCalled();
  });

  it("should pass form values to onKeyUpdate even when the API echoes back different limits", async () => {
    // Regression: when the regenerate endpoint returns GenerateКлючОтвет, it echoes
    // back the existing max_budget / tpm_limit / rpm_limit. The modal must prefer the
    // values the user just submitted, not whatever the server echoes.
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
      // stale values echoed from the server
      max_budget: 9999,
      tpm_limit: 9999,
      rpm_limit: 9999,
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });

    const updateCall = mockOnKeyUpdate.mock.calls[0][0];
    // The form's pre-filled values (from makeТокен) must win over the API echo.
    expect(updateCall.max_budget).toBe(100);
    expect(updateCall.tpm_limit).toBe(5000);
    expect(updateCall.rpm_limit).toBe(500);
  });

  it("should display key alias in success view", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("my-test-key")).toBeInTheDocument();
    });
  });

  it("should display 'No alias set' when key has no alias", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: "new-token-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} selectedТокен={makeТокен({ key_alias: undefined })} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("No alias set")).toBeInTheDocument();
    });
  });

  it("should not call regenerateKeyCall when selectedТокен is null", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} selectedТокен={null} />);

    // The form shouldn't even be populated, but we check the button doesn't trigger a call
    const regenerateBtn = screen.queryByRole("button", { name: /Перегенерировать/ });
    if (regenerateBtn) {
      await user.click(regenerateBtn);
    }

    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
  });

  it("should mark expiry as expired withвыход pre-filling a duration", async () => {
    vi.spyOn(Date, "now").mockReturnЗначение(Date.parse("2026-06-06T12:00:00Z"));

    renderWithProviders(
      <ПерегенерироватьКлючModal
        {...defaultProps}
        selectedТокен={makeТокен({ expires: "2026-06-01T12:00:00Z", duration: "" })}
      />,
    );

    expect(screen.getByText(/\(expired\)/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 30s, 30h, 30d")).toHaveЗначение("");
  });

  it("should require a new expiration before regenerating an expired key", async () => {
    vi.spyOn(Date, "now").mockReturnЗначение(Date.parse("2026-06-06T12:00:00Z"));
    const user = userEvent.setup();

    renderWithProviders(
      <ПерегенерироватьКлючModal
        {...defaultProps}
        selectedТокен={makeТокен({ expires: "2026-06-01T12:00:00Z", duration: "" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(screen.getByText("Expiration is required for expired keys")).toBeInTheDocument();
    });
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
    // Form validation rejections must not surface a backend-style toast.
    expect(mockNotificationFromBackend).not.toHaveBeenCalled();
  });

  it("should pass the correct token identifier to regenerateKeyCall", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-key",
      token: "new-hash",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockRegenerateKeyCall).toHaveBeenCalledWith(
        "123", // accessТокен from mocked useАвторизовано
        "token-hash-123", // selectedТокен.token
        expect.any(Object),
      );
    });
  });

  it("should report the rotated hash from token_id when the API leaves token null", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedЗначение({
      key: "sk-new-regenerated-key",
      token: null,
      token_id: "rotated-hash-456",
    });

    renderWithProviders(<ПерегенерироватьКлючModal {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));

    await waitFor(() => {
      expect(mockOnKeyUpdate).toHaveBeenCalledOnce();
    });
    expect(mockOnKeyUpdate.mock.calls[0][0].token).toBe("rotated-hash-456");
  });
});
