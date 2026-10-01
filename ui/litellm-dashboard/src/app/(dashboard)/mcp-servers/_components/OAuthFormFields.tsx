import { Info } from "lucide-react";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OAUTH_FLOW } from "@/components/mcp_tools/types";
import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import TokenEndpointAuthMethodField from "./TokenEndpointAuthMethodField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import {
  numberControl,
  parsesAsJson,
  selectControl,
  selectTriggerControl,
  tagsControl,
  textControl,
} from "./mcpFieldRules";

interface OAuthFlowStatus {
  startOAuthFlow: () => void;
  status: string;
  error: string | null;
  tokenResponse: { access_token?: string; expires_in?: number } | null;
}

interface OAuthFormFieldsProps {
  isM2M: boolean;
  isEditing?: boolean;
  oauthFlow?: OAuthFlowStatus;
  initialFlowType?: string;
  /** Link to provider docs for creating an OAuth app (e.g. GitHub). */
  docsUrl?: string | null;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const OAUTH_FLOW_ITEMS = [
  { value: OAUTH_FLOW.M2M, label: "Машина-машина (M2M)" },
  { value: OAUTH_FLOW.INTERACTIVE, label: "Интерактивный (PKCE)" },
];

const UPSTREAM_RESOURCE_TOOLTIP =
  "RFC 8707 resource indicator sent to the authorization server so it mints a token audienced for this MCP server. " +
  "Leave blank to send nothing, which is the default and what most providers expect. Use 'auto' to send this server's " +
  "own URL. Set an exact identifier when the authorization server expects a specific one. Some providers reject this " +
  "parameter and take the audience from scopes instead; if you see AADSTS901002, leave it blank. If you see " +
  "invalid_target, the authorization server needs it set.";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const UpstreamResourceField: React.FC = () => (
  <MountedFormField
    label={<FieldLabel label="Индикатор ресурса (необязательно)" tooltip={UPSTREAM_RESOURCE_TOOLTIP} />}
    name={["credentials", "upstream_resource"]}
  >
    {(control) => (
      <Input {...textControl(control)} placeholder="auto или https://mcp.example.com/mcp" className={fieldClassName} />
    )}
  </MountedFormField>
);

const OAuthFormFields: React.FC<OAuthFormFieldsProps> = ({
  isM2M,
  isEditing = false,
  oauthFlow,
  initialFlowType,
  docsUrl,
}) => {
  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel
            label="Тип потока OAuth"
            tooltip="Выберите, как прокси аутентифицируется на этом MCP-сервере. M2M — для межсерверного взаимодействия по данным клиента. Интерактивный (PKCE) — для пользовательских сценариев с авторизацией в браузере."
          />
        }
        name="oauth_flow_type"
        {...(initialFlowType ? { defaultValue: initialFlowType } : {})}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={OAUTH_FLOW_ITEMS}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue placeholder="Выберите поток OAuth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OAUTH_FLOW.M2M}>
                <div>
                  <span className="font-medium">Машина-машина (M2M)</span>
                  <span className="ml-2 text-xs text-muted-foreground">server-to-server, no user interaction</span>
                </div>
              </SelectItem>
              <SelectItem value={OAUTH_FLOW.INTERACTIVE}>
                <div>
                  <span className="font-medium">Интерактивный (PKCE)</span>
                  <span className="ml-2 text-xs text-muted-foreground">browser-based user authorization</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </MountedFormField>

      {isM2M ? (
        <>
          <MountedFormField
            label={<FieldLabel label="Client ID" tooltip="Client ID OAuth2 для разрешительного типа client_credentials." />}
            name={["credentials", "client_id"]}
            required={!isEditing}
            rules={requiredWhenCreating("Client ID is required for M2M OAuth")}
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
              <FieldLabel label="Client Secret" tooltip="Client Secret OAuth2 для разрешительного типа client_credentials." />
            }
            name={["credentials", "client_secret"]}
            required={!isEditing}
            rules={requiredWhenCreating("Client Secret is required for M2M OAuth")}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter OAuth client secret${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label="URL токена" tooltip="URL эндпоинта токена для разрешительного типа client_credentials." />}
            name="token_url"
            required={!isEditing}
            rules={requiredWhenCreating("Token URL is required for M2M OAuth")}
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://auth.example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={
              <FieldLabel
                label="Области доступа (необязательно)"
                tooltip="Необязательные области доступа для разрешительного типа client_credentials."
              />
            }
            name={["credentials", "scopes"]}
          >
            {(control) => <MultiSelect {...tagsControl(control)} placeholder="Добавить области доступа" className="rounded-lg" />}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
        </>
      ) : (
        <>
          <MountedFormField
            label={
              <span className="flex items-center justify-between w-full">
                <FieldLabel
                  label="Client ID (необязательно)"
                  tooltip="Указывайте, только если ваш MCP-сервер не поддерживает динамическую регистрацию клиентов."
                />
                {docsUrl && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:text-info/80 ml-2 font-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Создать OAuth-приложение →
                  </a>
                )}
              </span>
            }
            name={["credentials", "client_id"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter client ID${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label="Client Secret (необязательно)"
                tooltip="Указывайте, только если ваш MCP-сервер не поддерживает динамическую регистрацию клиентов."
              />
            }
            name={["credentials", "client_secret"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter client secret${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label="Области доступа (необязательно)"
                tooltip="Необязательные области доступа, запрашиваемые при обмене токена. Несколько областей разделяйте Enter или запятыми."
              />
            }
            name={["credentials", "scopes"]}
          >
            {(control) => <MultiSelect {...tagsControl(control)} placeholder="Добавить области доступа" className="rounded-lg" />}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
          <MountedFormField
            label={
              <FieldLabel
                label="Эмитент (необязательно)"
                tooltip="OAuth 2.0 authorization server issuer (RFC 8414). Leave empty to discover endpoints from the upstream resource; set it to pin the trust anchor, which makes this issuer's document the only endpoint source (RFC 8414 §3.3), overriding the Authorization/Token/Registration URLs above and failing closed if its metadata cannot be fetched."
              />
            }
            name="issuer"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://issuer.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label="URL авторизации (необязательно)"
                tooltip="Необязательная перезапись эндпоинта авторизации."
              />
            }
            name="authorization_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/authorize"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label="URL токена (необязательно)" tooltip="Необязательная перезапись эндпоинта токена." />}
            name="token_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={
              <FieldLabel
                label="URL регистрации (необязательно)"
                tooltip="Необязательная перезапись эндпоинта динамической регистрации клиентов."
              />
            }
            name="registration_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/register"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label="Правила проверки токена (необязательно)"
                tooltip='JSON-объект правил «ключ-значение», проверяемых в ответе OAuth-токена перед сохранением. Поддерживается точечная нотация для вложенных полей (например {"organization": "my-org", "team.id": "123"}). Токены, не прошедшие проверку, отклоняются с HTTP 403.'
              />
            }
            name="token_validation_json"
            rules={{ validate: { json: parsesAsJson("Must be valid JSON") } }}
          >
            {(control) => (
              <Textarea
                {...textControl(control)}
                placeholder={'{\n  "organization": "my-org",\n  "team.id": "123"\n}'}
                rows={4}
                className="font-mono text-sm rounded-lg border-border focus:border-info focus:ring-ring"
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label="TTL хранения токена (секунды, необязательно)"
                tooltip="Сколько времени хранить пользовательский OAuth-токен доступа в Redis (не дольше самого expires_in). Оставьте пустым, чтобы вычислить TTL из expires_in токена; иначе действует значение по умолчанию — 12 часов."
              />
            }
            name="token_storage_ttl_seconds"
          >
            {(control) => (
              <Input {...numberControl(control)} min={1} placeholder="e.g. 3600" className="w-full rounded-lg" />
            )}
          </MountedFormField>
          {oauthFlow && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Получите новый токен доступа через OAuth и временно сохраните его в сессии как значение
                аутентификации.
              </p>
              <Button
                variant="secondary"
                onClick={oauthFlow.startOAuthFlow}
                disabled={oauthFlow.status === "authorizing" || oauthFlow.status === "exchanging"}
              >
                {oauthFlow.status === "authorizing"
                  ? "Ожидание авторизации..."
                  : oauthFlow.status === "exchanging"
                    ? "Обмен кода авторизации..."
                    : "Авторизовать и получить токен"}
              </Button>
              {oauthFlow.error && <p className="text-sm text-destructive">{oauthFlow.error}</p>}
              {oauthFlow.status === "success" && oauthFlow.tokenResponse?.access_token && (
                <p className="text-sm text-success">
                  Токен получен. Истекает через {oauthFlow.tokenResponse.expires_in ?? "?"} с.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default OAuthFormFields;
