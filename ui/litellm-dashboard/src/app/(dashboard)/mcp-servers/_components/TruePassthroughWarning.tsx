import React from "react";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { AUTH_TYPE } from "@/components/mcp_tools/types";

/**
 * Warning shown in the create/edit MCP server forms when auth_type
 * true_passthrough is selected: the gateway performs no admission auth for
 * that server, so callers reach the upstream without a LiteLLM identity.
 */
export default function TruePassthroughWarning({ authType }: { authType?: string | null }) {
  if (authType !== AUTH_TYPE.TRUE_PASSTHROUGH) return null;
  return (
    <Alert className="mb-4">
      <TriangleAlert />
      <AlertTitle>Passthrough без проверки отключает аутентификацию ruLiteLLM для этого сервера</AlertTitle>
      <AlertDescription>
        Любой, кто достигает гейтвея, может вызывать этот сервер без ключа ruLiteLLM. Заголовок Authorization вызывающего передаётся апстриму дословно; лимиты и учёт расхода по ключам и командам не применяются, а аутентификацию вызывающих полностью обеспечивает апстрим. Если вызывающие должны по-прежнему проходить через ruLiteLLM, выберите OAuth Delegate.
      </AlertDescription>
    </Alert>
  );
}
