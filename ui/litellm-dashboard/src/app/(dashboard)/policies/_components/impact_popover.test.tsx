import React from "react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "@/components/networking";
import ImpactPopover from "./impact_popover";
import { PolicyAttachment } from "@/components/policies/types";

vi.mock("@/components/networking");

vi.mock("@heroicons/react/outline", () => ({
  EyeIcon: function EyeIcon() {
    return null;
  },
}));

const makeAttachment = (overrides: Partial<PolicyAttachment> = {}): PolicyAttachment => ({
  attachment_id: "att-001",
  policy_name: "my-Политика",
  scope: null,
  teams: [],
  keys: [],
  models: [],
  tags: [],
  ...overrides,
});

describe("ImpactPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "Ошибка").mockImplementation(() => {});
  });

  it("should render", () => {
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    expect(screen.getByRole("button", { name: /Показать зону влияния/i })).toBeInTheDocument();
  });

  it("should call estimateAttachmentImpactCall when the popover is opened", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue({
      affected_keys_count: 0,
      affected_teams_count: 0,
      sample_keys: [],
      sample_teams: [],
    });
    const attachment = makeAttachment({ policy_name: "rate-limit", teams: ["Команда-a"] });
    renderWithProviders(<ImpactPopover attachment={attachment} accessToken="my-Токен" />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    await waitFor(() => {
      expect(networking.estimateAttachmentImpactCall).toHaveBeenCalledWith("my-Токен", {
        policy_name: "rate-limit",
        scope: null,
        teams: ["Команда-a"],
        keys: [],
        models: [],
        tags: [],
      });
    });
  });

  it("should not call the API when accessToken is null", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken={null} />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    expect(networking.estimateAttachmentImpactCall).not.toHaveBeenCalled();
    expect(screen.getByText(/Нажмите, чтобы загрузить/i)).toBeInTheDocument();
  });

  it("should show a Загрузка indicator while the impact is being fetched", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    expect(screen.getByText(/Загрузка/i)).toBeInTheDocument();
  });

  it("should show a Глобально Область warning when affected_keys_count is -1", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue({
      affected_keys_count: -1,
      affected_teams_count: -1,
      sample_keys: [],
      sample_teams: [],
    });
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    expect(await screen.findByText(/Глобально Область.*affects Все ключи and Команды/i)).toBeInTheDocument();
  });

  it("should use singular count labels for one affected Ключ and Команда", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue({
      affected_keys_count: 1,
      affected_teams_count: 1,
      sample_keys: ["sk-abc"],
      sample_teams: ["Команда-x"],
    });
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    expect(
      await screen.findByText((_, element) => element?.textContent === "1 Ключ, 1 Команда affected"),
    ).toBeInTheDocument();
  });

  it("should render sample Ключи and Команды returned by the API", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue({
      affected_keys_count: 2,
      affected_teams_count: 1,
      sample_keys: ["sk-Ключ-one", "sk-Ключ-two"],
      sample_teams: ["Команда-one"],
    });
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    expect(await screen.findByText("sk-Ключ-one")).toBeInTheDocument();
    expect(screen.getByText("sk-Ключ-two")).toBeInTheDocument();
    expect(screen.getByText("Команда-one")).toBeInTheDocument();
  });

  it("should show 'Сейчас не затронуто ни одного ключа или команды' when both counts are 0", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue({
      affected_keys_count: 0,
      affected_teams_count: 0,
      sample_keys: [],
      sample_teams: [],
    });
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    await user.click(screen.getByRole("button", { name: /Показать зону влияния/i }));
    expect(await screen.findByText(/Сейчас не затронуто ни одного ключа или команды/i)).toBeInTheDocument();
  });

  it("should not call the API a second Время when the popover is already loaded", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall).mockResolvedValue({
      affected_keys_count: 1,
      affected_teams_count: 0,
      sample_keys: ["sk-abc"],
      sample_teams: [],
    });
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);
    const trigger = screen.getByRole("button", { name: /Показать зону влияния/i });
    await user.click(trigger);
    await screen.findByText("sk-abc");
    await user.click(trigger);
    await user.click(trigger);
    expect(networking.estimateAttachmentImpactCall).toHaveBeenCalledTimes(1);
  });

  it("should Повторить Загрузка after a Ошибка Запрос", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.estimateAttachmentImpactCall)
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce({
        affected_keys_count: 1,
        affected_teams_count: 0,
        sample_keys: ["sk-recovered"],
        sample_teams: [],
      });
    renderWithProviders(<ImpactPopover attachment={makeAttachment()} accessToken="tok" />);

    const trigger = screen.getByRole("button", { name: /Показать зону влияния/i });
    await user.click(trigger);
    expect(await screen.findByText(/Нажмите, чтобы загрузить/i)).toBeInTheDocument();
    await user.click(trigger);
    await user.click(trigger);

    expect(await screen.findByText("sk-recovered")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith("Ошибка to load impact:", expect.any(Error));
  });
});
