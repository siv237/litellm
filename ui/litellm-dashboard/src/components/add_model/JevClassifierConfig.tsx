import React, { useId } from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTooltip } from "@/components/ui/tooltip";
import ClassifierCircuitBreakerConfig from "./ClassifierCircuitBreakerConfig";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { defaultJevClassifierConfig } from "./jev_classifier_config";

export default function JevClassifierConfig({
  value,
  onChange,
}: {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}) {
  const id = useId();
  const { premiumUser } = useAuthorized();
  const config = value.jev_classifier_config ?? defaultJevClassifierConfig();
  const update = (patch: Partial<typeof config>) =>
    onChange({ ...value, jev_classifier_config: { ...config, ...patch } });

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Использует оценку TypeSafe System One Choice с настроенными уровнями
      </p>
      <div>
        <Label htmlFor={`${id}-model`}>Модель JEV</Label>
        <Input id={`${id}-model`} value={config.model} onChange={(event) => update({ model: event.target.value })} />
      </div>
      <div>
        <Label htmlFor={`${id}-timeout`}>Таймаут JEV (мс)</Label>
        <Input
          id={`${id}-timeout`}
          type="number"
          min={1}
          step={1}
          value={config.timeout_ms}
          onChange={(event) => update({ timeout_ms: Number(event.target.value) })}
        />
      </div>
      <ClassifierCircuitBreakerConfig
        value={config}
        onChange={(next) =>
          update({
            circuit_breaker_enabled: next.circuit_breaker_enabled,
            circuit_breaker_cooldown_seconds: next.circuit_breaker_cooldown_seconds,
          })
        }
      />
      <div>
        <Label htmlFor={`${id}-instructions`}>Инструкции JEV</Label>
        <SimpleTooltip
          content={!premiumUser ? "Custom JEV instructions require a LiteLLM Enterprise license" : undefined}
        >
          <div>
            <Textarea
              id={`${id}-instructions`}
              value={config.instructions ?? ""}
              disabled={!premiumUser}
              placeholder="Оставьте пустым для встроенных инструкций"
              onChange={(event) => update({ instructions: event.target.value || undefined })}
            />
          </div>
        </SimpleTooltip>
        {config.instructions && (
          <Button variant="outline" type="button" onClick={() => update({ instructions: undefined })}>
            Восстановить встроенные инструкции JEV
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Built-in JEV is available without a license and uses the shipped tier criteria
          {!premiumUser && (
            <>
              . Custom instructions require LiteLLM Enterprise. Get a trial key{" "}
              <a href="https://www.litellm.ai/#pricing" target="_blank" rel="noopener noreferrer" className="underline">
                here
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
