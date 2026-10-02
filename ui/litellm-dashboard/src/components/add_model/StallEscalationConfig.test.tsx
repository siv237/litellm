import { fireEvent, renderWithПровайдерs, screen } from "../../../tests/test-utils";
import { vi } from "vitest";
import type { — сложностьRвыходerКонфигурацияЗначение } from "./— сложностьRвыходerКонфигурация";
import StallEscalationКонфигурация, { stallEscalationBlockedReason } from "./StallEscalationКонфигурация";

const tiers = { SIMPLE: "gpt-4o-mini", MEDIUM: "gpt-4o", COMPLEX: "claude-sonnet-4", REASONING: "o1-preview" };

const baseЗначение: — сложностьRвыходerКонфигурацияЗначение = {
  tiers,
  classifier_type: "heuristic",
};

const renderКонфигурация = (value: Partial<— сложностьRвыходerКонфигурацияЗначение> = {}) => {
  const onChange = vi.fn();
  renderWithПровайдерs(<StallEscalationКонфигурация value={{ ...baseЗначение, ...value }} onChange={onChange} />);
  return onChange;
};

const toggle = () => screen.getByRole("switch", { name: "Escalate a stalled task to a stronger Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию" });

describe("stallEscalationBlockedReason", () => {
  it("blocks on session pinning, which replays a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию instead of classifying", () => {
    expect(stallEscalationBlockedReason({ ...baseЗначение, session_affinity: true })).toContain("Classification Метод");
  });

  it("blocks on user-turn classification, which skips the agent-loop turns a stall shows up in", () => {
    expect(stallEscalationBlockedReason({ ...baseЗначение, classification_mode: "user_turn" })).toContain("every request");
  });

  it("allows the default every-request rвыходer", () => {
    expect(stallEscalationBlockedReason(baseЗначение)).toBeNull();
  });
});

describe("StallEscalationКонфигурация", () => {
  it("hides the knobs until the feature is turned on", () => {
    renderКонфигурация();
    expect(toggle()).not.toBeChecked();
    expect(screen.queryByLabelText("Repeats before escalating")).not.toBeInTheDocument();
  });

  it("turning it on seeds both knobs so the saved config is explicit rather than half-set", () => {
    const onChange = renderКонфигурация();
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stall_escalation_enabled: true,
        stall_escalation_window: 6,
        stall_escalation_repeat_threshold: 3,
      }),
    );
  });

  it("turning it off clears all three keys, since the backend rejects them next to session pinning", () => {
    const onChange = renderКонфигурация({
      stall_escalation_enabled: true,
      stall_escalation_window: 6,
      stall_escalation_repeat_threshold: 3,
    });
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        stall_escalation_enabled: undefined,
        stall_escalation_window: undefined,
        stall_escalation_repeat_threshold: undefined,
      }),
    );
  });

  it("raises the window to match a larger threshold, which could otherwise never be reached", () => {
    const onChange = renderКонфигурация({
      stall_escalation_enabled: true,
      stall_escalation_window: 4,
      stall_escalation_repeat_threshold: 3,
    });
    fireEvent.change(screen.getByLabelText("Repeats before escalating"), { target: { value: "9" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ stall_escalation_repeat_threshold: 9, stall_escalation_window: 9 }),
    );
  });

  it("holds the window at the threshold when someone types a smaller one", () => {
    const onChange = renderКонфигурация({
      stall_escalation_enabled: true,
      stall_escalation_window: 6,
      stall_escalation_repeat_threshold: 3,
    });
    fireEvent.change(screen.getByLabelText("Recent calls examined"), { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ stall_escalation_window: 3 }));
  });

  it("floors the threshold at 2, below which a single ordinary retry would escalate", () => {
    const onChange = renderКонфигурация({ stall_escalation_enabled: true });
    fireEvent.change(screen.getByLabelText("Repeats before escalating"), { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ stall_escalation_repeat_threshold: 2 }));
  });

  it("disables the toggle and says why when session pinning is on", () => {
    renderКонфигурация({ session_affinity: true });
    expect(toggle()).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/How often to classify/)).toBeInTheDocument();
  });

  it("hides the knobs when a blocker is switched on under an already-enabled rвыходer", () => {
    renderКонфигурация({ stall_escalation_enabled: true, session_affinity: true });
    expect(screen.queryByLabelText("Repeats before escalating")).not.toBeInTheDocument();
  });

  it("still lets an already-on rвыходer turn it off once a blocker appears, which the save needs", () => {
    const onChange = renderКонфигурация({ stall_escalation_enabled: true, session_affinity: true });
    expect(toggle()).not.toHaveAttribute("aria-disabled", "true");
    fireEvent.click(toggle());
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ stall_escalation_enabled: undefined }));
  });
});
