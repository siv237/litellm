import { Info } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requiredUnlessSiblingSet, tagsControl, textControl } from "./mcpFieldRules";

interface IdJagFormFieldsProps {
  isEditing?: boolean;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const PRIVATE_KEY_PATH = ["credentials", "client_private_key"] as const;

const IdJagFormFields: React.FC<IdJagFormFieldsProps> = ({ isEditing = false }) => {
  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel
            label="Токен-эндпоинт организации (шаг 1)"
            tooltip="Токен-эндпоинт сервера авторизации вашего IdP организации. LiteLLM обменивает здесь утверждение идентичности пользователя на утверждение ID-JAG (RFC 8693 с requested_token_type=urn:ietf:params:oauth:token-type:id-jag)."
          />
        }
        name="token_exchange_endpoint"
        required={!isEditing}
        rules={requiredWhenCreating("Для ID-JAG обязателен токен-эндпоинт организации")}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://your-org.okta.com/oauth2/v1/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Токен-эндпоинт ресурса (шаг 2)"
            tooltip="Токен-эндпоинт вышестоящего сервера авторизации ресурса. LiteLLM отправляет сюда утверждение ID-JAG как разрешение jwt-bearer по RFC 7523, чтобы получить токен доступа, принимаемый MCP-сервером."
          />
        }
        name={["credentials", "id_jag_resource_token_endpoint"]}
        required={!isEditing}
        rules={requiredWhenCreating("Для ID-JAG обязателен токен-эндпоинт ресурса")}
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://upstream.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label="Client ID" tooltip="Client ID OAuth2, под которым LiteLLM аутентифицируется на обоих шагах." />}
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating("Для ID-JAG обязателен Client ID")}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={`Введите OAuth client ID${placeholderSuffix}`}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Client Secret"
            tooltip="Аутентифицирует LiteLLM как OAuth-клиент через client_secret_post. Оставьте пустым, если вместо секрета используется закрытый ключ: закрытый ключ имеет приоритет."
          />
        }
        name={["credentials", "client_secret"]}
        rules={
          isEditing
            ? undefined
            : {
                deps: ["credentials.client_private_key"],
                validate: {
                  secretOrPrivateKey: requiredUnlessSiblingSet(
                    PRIVATE_KEY_PATH,
                    "Укажите секрет клиента или закрытый ключ клиента",
                  ),
                },
              }
        }
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={`Введите секрет OAuth-клиента${placeholderSuffix}`}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Закрытый ключ клиента (PEM)"
            tooltip="Закрытый ключ PEM для подписи клиентского утверждения private_key_jwt по RFC 7523. Обычно требуется для Okta Cross App Access. Если задан, имеет приоритет над секретом клиента."
          />
        }
        name={PRIVATE_KEY_PATH}
      >
        {(control) => (
          <Textarea
            {...textControl(control)}
            rows={3}
            placeholder={`-----BEGIN PRIVATE KEY-----${placeholderSuffix}`}
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="ID закрытого ключа (необязательно)"
            tooltip="kid, объявляемый в заголовке JWT клиентского утверждения, чтобы IdP мог выбрать нужный зарегистрированный ключ."
          />
        }
        name={["credentials", "client_private_key_id"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="my-signing-key-1" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Алгоритм подписи клиентского утверждения (необязательно)"
            tooltip="Алгоритм подписи JWT клиентского утверждения. По умолчанию RS256."
          />
        }
        name={["credentials", "client_assertion_signing_alg"]}
      >
        {(control) => <Input {...textControl(control)} placeholder="RS256" className={fieldClassName} />}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Audience (необязательно)"
            tooltip="Параметр audience RFC 8693, отправляемый на шаге 1, указывает вышестоящую систему, для которой выпускается утверждение ID-JAG."
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
            label="Индикатор ресурса (необязательно)"
            tooltip="Индикатор ресурса RFC 8707, отправляемый на шаге 1. Отдельно от Audience — параметра RFC 8693."
          />
        }
        name={["credentials", "id_jag_resource"]}
      >
        {(control) => (
          <Input {...textControl(control)} placeholder="https://upstream.example.com/mcp" className={fieldClassName} />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label="Тип токена субъекта (необязательно)"
            tooltip="Тип утверждения идентичности, обмениваемого на шаге 1. По умолчанию urn:ietf:params:oauth:token-type:id_token."
          />
        }
        name="subject_token_type"
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="urn:ietf:params:oauth:token-type:id_token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={<FieldLabel label="Scopes (необязательно)" tooltip="Scopes, запрашиваемые на шаге 1 обмена." />}
        name={["credentials", "scopes"]}
      >
        {(control) => <MultiSelect {...tagsControl(control)} placeholder="Добавить scopes" className="rounded-lg" />}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default IdJagFormFields;
