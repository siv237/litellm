import CopyButton from "@/components/shared/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { JsonViewer } from "./JsonViewer";

interface ClassifierAuditViewProps {
  request: Record<string, unknown>;
  response: unknown;
}

export function ClassifierAuditView({ request, response }: ClassifierAuditViewProps) {
  return (
    <div className="mb-6 space-y-4">
      <AuditField title="Вход классификатора" value={request.classifier_input}>
        Тело запроса провайдеру. Кэшированный вызов или отключённое логирование сообщений может не захватываться.
      </AuditField>
      <AuditField title="Исходный запрос, реквизиты скрыты" value={request.originating_request_masked}>
        Только для сравнения. Этот исходный запрос не добавлялся во вход классификатора.
      </AuditField>
      <AuditField title="Ответ классификатора" value={response}>
        Возвращённый вердикт и пояснения классификатора. Последующие правила маршрутизации могут изменить уровень.
      </AuditField>
    </div>
  );
}

function AuditField({ title, value, children }: { title: string; value: unknown; children: ReactNode }) {
  const serialized = JSON.stringify(value);
  const truncated = serialized?.includes("litellm_truncated") ?? false;

  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {value != null && <CopyButton value={JSON.stringify(value, null, 2)} label={`Copy ${title}`} />}
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{children}</p>
        {truncated && (
          <p role="status" className="mb-3 text-sm text-warning">
            Сохранённая копия усечена. Полный payload недоступен в настроенном хранилище логов.
          </p>
        )}
        {value == null ? (
          <p className="text-sm text-muted-foreground">Не захвачено или отключено логирование сообщений</p>
        ) : (
          <JsonViewer data={value} mode="formatted" />
        )}
      </CardContent>
    </Card>
  );
}
