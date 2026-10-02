import { Info } from "lucide-react";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { useWatch } from "react-hook-form";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { selectControl, selectTriggerControl, tagsControl, textControl } from "./mcpFieldRules";

interface TokenExchangeFormFieldsProps {
  isEditing?: boolean;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const TOKEN_EXCHANGE_PROFILE_ITEMS = [
  { value: "rfc8693", label: "RFC 8693 (стандарт)" },
  { value: "entra_obo", label: "Microsoft Entra OBO" },
];

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const TokenExchangeFormFields: React.FC<TokenExchangeFormFieldsProps> = ({ isEditing = false }) => {
  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const isEntraObo = useWatch({ name: "token_exchange_profile" }) === "entra_obo";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel
            label="Профиль"
            tooltip="Token-exchange wire dialect. RFC 8693 is the standard token-exchange grant. Microsoft Entra OBO uses Entra's On-Behalf-Of dialect (the RFC 7523 jwt-bearer grant with requested_token_use=on_behalf_of) and carries the target resource in a scope like api://<app-id>/.default."
          />
        }
        name="token_exchange_profile"
        {...(isEditing ? {} : { defaultValue: "rfc8693" })}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={TOKEN_EXCHANGE_PROFILE_ITEMS}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOKEN_EXCHANGE_PROFILE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="font-medium">{item.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Эндпоинт обмена токенов (необязательно)"
            tooltip="Эндпоинт токенов RFC 8693. Прокси обменивает входящий токен пользователя на ограниченный токен для вызова вышестоящего MCP-сервера. Оставьте пустым — адрес определится автоматически по метаданным защищённого ресурса (сначала RFC 9728, затем RFC 8414)."
          />
        }
        name="token_exchange_endpoint"
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://idp.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="ID клиента"
            tooltip="OAuth2 ID клиента для аутентификации в эндпоинте обмена токенов."
          />
        }
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating("Client ID is required for token exchange")}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={`Enter OAuth client ID${placeholderSuffix}`}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Секрет клиента"
            tooltip="Секрет OAuth2-клиента для аутентификации в эндпоинте обмена токенов."
          />
        }
        name={["credentials", "client_secret"]}
        required={!isEditing}
        rules={requiredWhenCreating("Client Secret is required for token exchange")}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={`Enter OAuth client secret${placeholderSuffix}`}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      {!isEntraObo && (
        <>
          <MountedFormField
            label={
              <FieldLabel
                label="Audience (необязательно)"
                tooltip="Целевая audience обменённого токена (RFC 8693). Указывает вышестоящий MCP-сервер, для которого предназначен токен."
              />
            }
            name="audience"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://upstream.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label="Subject token type (необязательно)"
                tooltip="Тип входящего токена пользователя (RFC 8693 subject_token_type). По умолчанию urn:ietf:params:oauth:token-type:access_token."
              />
            }
            name="subject_token_type"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="urn:ietf:params:oauth:token-type:access_token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
        </>
      )}
      <MountedFormField
        label={
          <FieldLabel
            label={isEntraObo ? "Scopes" : "Scopes (optional)"}
            tooltip={
              isEntraObo
                ? "Microsoft Entra OBO carries the target resource in the scope, so at least one is required (e.g. api://<app-id>/.default)."
                : "Optional scopes to request during the token exchange."
            }
          />
        }
        name={["credentials", "scopes"]}
        required={isEntraObo}
        rules={
          isEntraObo
            ? {
                validate: {
                  required: requiredRule("Microsoft Entra OBO requires a scope, e.g. api://<app-id>/.default"),
                },
              }
            : undefined
        }
      >
        {(control) => (
          <MultiSelect
            {...tagsControl(control)}
            placeholder={isEntraObo ? "api://<app-id>/.default" : "Add scopes"}
            className="rounded-lg"
          />
        )}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default TokenExchangeFormFields;
