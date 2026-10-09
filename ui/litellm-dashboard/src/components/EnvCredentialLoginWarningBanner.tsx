"use client";

import React, { useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/utils/roles";

const DISMISS_STORAGE_KEY = "litellm:envCredentialLoginWarningDismissed";

export const EnvCredentialLoginWarningBanner: React.FC<{ accessToken: string | null }> = ({ accessToken }) => {
  const { userRole } = useAuth();
  const { data: healthData } = useHealthReadinessDetails(accessToken);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_STORAGE_KEY) === "true",
  );

  if (dismissed || !isAdminRole(userRole) || !healthData?.show_env_credential_login_warning) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Включён вход по реквизитам окружения</p>
        <p>
          Любой, у кого есть <code className="font-mono">UI_USERNAME</code>/<code className="font-mono">UI_PASSWORD</code> (или master-ключ, когда <code className="font-mono">UI_PASSWORD</code> не задан) может войти как админ прокси по общему статическому секрету. Сначала создайте обычный админский аккаунт с паролем, затем задайте{" "}
          <code className="font-mono">general_settings.disable_env_credential_login: true</code> чтобы отключить этот вход.
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label="Скрыть баннер" onClick={handleDismiss}>
        <X />
      </Button>
    </div>
  );
};
