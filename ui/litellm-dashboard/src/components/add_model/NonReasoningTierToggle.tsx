import React from "react";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const NonReasoningTierToggle: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  available: boolean;
}> = ({ value, onChange, available }) => {
  const handleToggle = (enabled: boolean): void => {
    const { NON_REASONING: existingPool, ...keptTiers } = value.tiers;
    // Turning it off must also release the plan-mode floor, which the backend rejects while it
    // names an inactive tier. An orphaned keyword rule is left for the save gate to name.
    const next: ComplexityRouterConfigValue = enabled
      ? { ...value, enable_non_reasoning_tier: true, tiers: { ...keptTiers, NON_REASONING: existingPool ?? [] } }
      : {
          ...value,
          enable_non_reasoning_tier: undefined,
          tiers: keptTiers,
          plan_mode_min_tier: value.plan_mode_min_tier === "NON_REASONING" ? undefined : value.plan_mode_min_tier,
        };
    onChange(next);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.enable_non_reasoning_tier === true}
          disabled={!available}
          onCheckedChange={handleToggle}
          aria-label="Добавить уровень без рассуждений"
        />
        <strong className="font-semibold">Добавить уровень без рассуждений</strong>
      </div>
      <span className="block text-xs text-muted-foreground">
        Добавляет NON_REASONING под Simple — для служебного агентного трафика, который передаёт или переформатирует информацию, а не рассуждает. Эскалация по-прежнему поднимает запрос выше, когда нужно больше.
        {!available && " Requires the LLM or JEV classification method"}
      </span>
      <Separator className="my-4" />
    </>
  );
};

export default NonReasoningTierToggle;
