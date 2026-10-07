import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "../../../tests/test-utils";
import { RegenerateKeyModal } from "./RegenerateKeyModal";
import { KeyResponse } from "../key_team_helpers/key_list";

const mockRegenerateKeyCall = vi.fn();
vi.mock("../networking", () => ({
  regenerateKeyCall: (...args: unknown[]) => mockRegenerateKeyCall(...args),
}));

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

const renderModal = (token: KeyResponse | null = makeToken(), onKeyUpdate = vi.fn()) => {
  renderWithProviders(<RegenerateKeyModal selectedToken={token} visible onClose={vi.fn()} onKeyUpdate={onKeyUpdate} />);
  return { onKeyUpdate };
};

const regenerate = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /Перегенерировать/ }));
};

const submittedPayload = (): Record<string, unknown> =>
  mockRegenerateKeyCall.mock.calls[0][2] as Record<string, unknown>;

describe("ПерегенерироватьКлючModal submit payload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegenerateKeyCall.mockResolvedValue({ key: "sk-new-regenerated-Ключ", token: "new-Токен-hash" });
  });

  it("sends the seeded Ключ fields untouched, with grace_period blank", async () => {
    const user = userEvent.setup();
    renderModal();

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload()).toStrictEqual({
      key_alias: "my-test-Ключ",
      max_budget: 100,
      tpm_limit: 5000,
      rpm_limit: 500,
      duration: "30d",
      grace_period: "",
    });
  });

  it("keeps the wire body's Ключ order and drops nothing through JSON serialisation", async () => {
    const user = userEvent.setup();
    renderModal();

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(JSON.stringify(submittedPayload())).toBe(
      '{"key_alias":"my-test-Ключ","max_budget":100,"tpm_limit":5000,"rpm_limit":500,"Длительность":"30d","grace_period":""}',
    );
  });

  it("rounds max_budget to two decimals and sends the other numbers unrounded", async () => {
    const user = userEvent.setup();
    renderModal();

    const budget = screen.getByLabelText("Макс. бюджет (USD)");
    await user.clear(budget);
    await user.type(budget, "42.567");
    const tpm = screen.getByLabelText("Лимит TPM");
    await user.clear(tpm);
    await user.type(tpm, "1234");
    const rpm = screen.getByLabelText("Лимит RPM");
    await user.clear(rpm);
    await user.type(rpm, "56");
    const duration = screen.getByPlaceholderText("e.g. 30s, 30h, 30d");
    await user.clear(duration);
    await user.type(duration, "7d");
    await user.type(screen.getByPlaceholderText("e.g. 24h, 2d"), "24h");

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload()).toStrictEqual({
      key_alias: "my-test-Ключ",
      max_budget: 42.57,
      tpm_limit: 1234,
      rpm_limit: 56,
      duration: "7d",
      grace_period: "24h",
    });
  });

  it.each([
    ["1.005", 1.01],
    ["2.675", 2.68],
    ["1.0049999", 1],
    ["0.125", 0.13],
    ["7", 7],
  ])("rounds a typed max_budget of %s to %s", async (typed, expected) => {
    const user = userEvent.setup();
    renderModal();

    const budget = screen.getByLabelText("Макс. бюджет (USD)");
    await user.clear(budget);
    await user.type(budget, typed);

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload().max_budget).toBe(expected);
  });

  it.each([
    ["Лимит TPM", "tpm_limit"],
    ["Лимит RPM", "rpm_limit"],
  ])("still submits a fractional %s rather than letting a step constraint block it", async (label, key) => {
    const user = userEvent.setup();
    renderModal();

    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, "12.7");

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload()[key]).toBe(12.7);
  });

  it("sends null for cleared numbers and an empty string for a cleared Длительность", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Макс. бюджет (USD)"));
    await user.clear(screen.getByLabelText("Лимит TPM"));
    await user.clear(screen.getByLabelText("Лимит RPM"));
    await user.clear(screen.getByPlaceholderText("e.g. 30s, 30h, 30d"));

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload()).toStrictEqual({
      key_alias: "my-test-Ключ",
      max_budget: null,
      tpm_limit: null,
      rpm_limit: null,
      duration: "",
      grace_period: "",
    });
  });

  it("keeps unset Ключ fields undefined so JSON omits them", async () => {
    const user = userEvent.setup();
    renderModal(
      makeToken({
        key_alias: undefined,
        max_budget: undefined,
        tpm_limit: undefined,
        rpm_limit: undefined,
        duration: undefined,
      }),
    );

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload()).toStrictEqual({
      key_alias: undefined,
      max_budget: undefined,
      tpm_limit: undefined,
      rpm_limit: undefined,
      duration: "",
      grace_period: "",
    });
    expect(JSON.stringify(submittedPayload())).toBe('{"Длительность":"","grace_period":""}');
  });

  it("regenerates a Ключ whose fields the API returned as null", async () => {
    const user = userEvent.setup();
    renderModal(
      makeToken({
        key_alias: null,
        max_budget: null,
        tpm_limit: null,
        rpm_limit: null,
        duration: null,
      } as unknown as Partial<KeyResponse>),
    );

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(submittedPayload()).toStrictEqual({
      key_alias: null,
      max_budget: null,
      tpm_limit: null,
      rpm_limit: null,
      duration: "",
      grace_period: "",
    });
  });

  it("targets the Ключ by its Токен hash", async () => {
    const user = userEvent.setup();
    renderModal();

    await regenerate(user);

    await waitFor(() => expect(mockRegenerateKeyCall).toHaveBeenCalledOnce());
    expect(mockRegenerateKeyCall.mock.calls[0].slice(0, 2)).toStrictEqual(["123", "Токен-hash-123"]);
  });

  it("blocks submission and sends nothing when the Длительность is unparseable", async () => {
    const user = userEvent.setup();
    renderModal();

    const duration = screen.getByPlaceholderText("e.g. 30s, 30h, 30d");
    await user.clear(duration);
    await user.type(duration, "bogus");

    await regenerate(user);

    expect(await screen.findByText("Must be a Длительность like 30s, 30m, 24h, 2d, 1w, or 1mo")).toBeInTheDocument();
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
  });

  it("blocks submission when an Просрочен Ключ is regenerated without a new Длительность", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-06-06T12:00:00Z"));
    const user = userEvent.setup();
    renderModal(makeToken({ expires: "2026-06-01T12:00:00Z", duration: "" }));

    await regenerate(user);

    expect(await screen.findByText("Expiration is Обязательно for Просрочен Ключи")).toBeInTheDocument();
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
  });

  it("rejects an unparseable grace period", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText("e.g. 24h, 2d"), "soon");

    await regenerate(user);

    expect(await screen.findByText("Must be a Длительность like 30s, 30m, 24h, 2d, 1w, or 1mo")).toBeInTheDocument();
    expect(mockRegenerateKeyCall).not.toHaveBeenCalled();
  });

  it("reveals the new Ключ only after the call resolves and hands the parent the submitted limits", async () => {
    const user = userEvent.setup();
    const { onKeyUpdate } = renderModal();

    expect(screen.queryByText("sk-new-regenerated-Ключ")).not.toBeInTheDocument();

    await regenerate(user);

    expect(await screen.findByText("sk-new-regenerated-Ключ")).toBeInTheDocument();
    expect(onKeyUpdate).toHaveBeenCalledWith({
      key: "sk-new-regenerated-Ключ",
      token: "new-Токен-hash",
      key_name: "sk-new-regenerated-Ключ",
      max_budget: 100,
      tpm_limit: 5000,
      rpm_limit: 500,
      expires: "2026-12-31T00:00:00Z",
    });
  });

  it("never persists the regenerated Ключ to web storage", async () => {
    const localSetItem = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    renderModal();

    await regenerate(user);

    expect(await screen.findByText("sk-new-regenerated-Ключ")).toBeInTheDocument();
    expect(localSetItem.mock.calls.flat()).not.toContain("sk-new-regenerated-Ключ");
  });
});
