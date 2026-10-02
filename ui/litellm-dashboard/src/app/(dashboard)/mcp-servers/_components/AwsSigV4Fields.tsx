import { Info } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { requiredWhenSiblingSet, textControl } from "./mcpFieldRules";

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const ACCESS_KEY_PATH = ["credentials", "aws_access_key_id"] as const;
const SECRET_KEY_PATH = ["credentials", "aws_secret_access_key"] as const;

const AwsSigV4Fields: React.FC = () => (
  <>
    <p className="text-sm text-muted-foreground mb-2">
      Для MCP-серверов, размещённых на AWS Bedrock AgentCore.{" "}
      <a
        href="https://docs.litellm.ai/docs/mcp_aws_sigv4"
        target="_blank"
        rel="noopener noreferrer"
        className="text-info hover:text-info/80"
      >
        Смотреть документацию &rarr;
      </a>
    </p>
    <MountedFormField
      label={<FieldLabel label="Регион AWS" tooltip="Регион AWS для подписи SigV4 (например, us-east-1)" />}
      name={["credentials", "aws_region_name"]}
      required
      rules={{ validate: { required: requiredRule("AWS region is required for SigV4 auth") } }}
    >
      {(control) => <Input {...textControl(control)} placeholder="us-east-1" className={fieldClassName} />}
    </MountedFormField>
    <MountedFormField
      label={
        <FieldLabel
          label="Имя сервиса AWS"
          tooltip="Имя сервиса AWS для подписи SigV4. По умолчанию «bedrock-agentcore»."
        />
      }
      name={["credentials", "aws_service_name"]}
    >
      {(control) => <Input {...textControl(control)} placeholder="bedrock-agentcore" className={fieldClassName} />}
    </MountedFormField>
    <MountedFormField
      label={
        <FieldLabel
          label="ID ключа доступа AWS"
          tooltip="Необязательно. Если не указано, используется цепочка учётных данных boto3 (IAM-роль, переменные окружения и т. д.)."
        />
      }
      name={ACCESS_KEY_PATH}
      rules={{
        deps: ["credentials.aws_secret_access_key"],
        validate: {
          pairedWithSecret: requiredWhenSiblingSet(
            SECRET_KEY_PATH,
            "Access Key ID is required when Secret Access Key is provided",
          ),
        },
      }}
    >
      {(control) => (
        <PasswordInput
          {...textControl(control)}
          placeholder="AKIA... (optional — uses IAM role if blank)"
          groupClassName={fieldClassName}
        />
      )}
    </MountedFormField>
    <MountedFormField
      label={
        <FieldLabel label="Секретный ключ AWS" tooltip="Необязательно. Обязательно, если указан ID ключа доступа AWS." />
      }
      name={SECRET_KEY_PATH}
      rules={{
        deps: ["credentials.aws_access_key_id"],
        validate: {
          pairedWithAccessKey: requiredWhenSiblingSet(
            ACCESS_KEY_PATH,
            "Secret Access Key is required when Access Key ID is provided",
          ),
        },
      }}
    >
      {(control) => (
        <PasswordInput
          {...textControl(control)}
          placeholder="Введите секретный ключ (необязательно — при пустом значении используется IAM-роль)"
          groupClassName={fieldClassName}
        />
      )}
    </MountedFormField>
    <MountedFormField
      label={<FieldLabel label="Токен сессии AWS" tooltip="Необязательно. Нужен только для временных учётных данных STS." />}
      name={["credentials", "aws_session_token"]}
    >
      {(control) => (
        <PasswordInput
          {...textControl(control)}
          placeholder="Введите токен сессии (необязательно)"
          groupClassName={fieldClassName}
        />
      )}
    </MountedFormField>
    <MountedFormField
      label={
        <FieldLabel
          label="ARN роли AWS"
          tooltip="Необязательно. ARN IAM-роли, которая assumes через STS перед подписью. Если задан, ruLiteLLM вызывает sts:AssumeRole для получения временных учётных данных. Если явные ключи не переданы, используются окружение (IAM-роль, переменные окружения)."
        />
      }
      name={["credentials", "aws_role_name"]}
    >
      {(control) => (
        <Input
          {...textControl(control)}
          placeholder="arn:aws:iam::123456789012:role/MyRole (необязательно)"
          className={fieldClassName}
        />
      )}
    </MountedFormField>
    <MountedFormField
      label={
        <FieldLabel
          label="Имя сессии AWS"
          tooltip="Необязательно. Имя сессии для вызова AssumeRole — попадает в логи CloudTrail. Если пусто, генерируется автоматически."
        />
      }
      name={["credentials", "aws_session_name"]}
    >
      {(control) => (
        <Input
          {...textControl(control)}
          placeholder="litellm-prod (необязательно, генерируется автоматически при пустом значении)"
          className={fieldClassName}
        />
      )}
    </MountedFormField>
  </>
);

export default AwsSigV4Fields;
