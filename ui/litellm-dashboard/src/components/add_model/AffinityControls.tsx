import React from "react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { DEFAULT_DEPLOYMENT_AFFINITY, DEFAULT_SESSION_AFFINITY_TTL_SECONDS } from "./ComplexityRouterConfig";

export const AffinityControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const [ttlDraft, setTtlDraft] = React.useState<string | null>(null);
  const commitTtl = (raw: string) => {
    setTtlDraft(null);
    if (raw.trim() === "") {
      onChange({ ...value, session_affinity_ttl_seconds: undefined });
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange({ ...value, session_affinity_ttl_seconds: Math.max(1, Math.round(parsed)) });
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.deployment_affinity ?? DEFAULT_DEPLOYMENT_AFFINITY}
          onCheckedChange={(deploymentAffinity) => onChange({ ...value, deployment_affinity: deploymentAffinity })}
          aria-label="Закреплять сессию за одним деплойментом в группе моделей"
        />
        <strong className="font-semibold">Закреплять сессию за одним деплойментом в группе моделей</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        Держит сессию на одном деплойменте внутри группы — кэш промптов провайдера остаётся прогретым. Выключите, чтобы балансировать каждый оборот.
      </span>
      <div style={{ maxWidth: 320 }}>
        <label className="block text-sm font-medium mb-1" htmlFor="session-affinity-ttl">
          Сколько времени закрепление переживает простой (сек)
        </label>
        <Input
          id="session-affinity-ttl"
          inputMode="numeric"
          value={ttlDraft ?? value.session_affinity_ttl_seconds ?? ""}
          placeholder={String(DEFAULT_SESSION_AFFINITY_TTL_SECONDS)}
          onChange={(event) => setTtlDraft(event.target.value)}
          onBlur={(event) => commitTtl(event.target.value)}
        />
        <span className="block text-xs mt-1 text-muted-foreground">
          Refreshes after every request that reuses a pin. Empty tracks the backend default of{" "}
          {DEFAULT_SESSION_AFFINITY_TTL_SECONDS} seconds.
        </span>
      </div>
    </>
  );
};
