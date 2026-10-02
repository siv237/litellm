import React from "react";
import { ArrowRight, Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { getProxyBaseUrl } from "./networking";

interface RoutePreviewProps {
  pathValue: string;
  targetValue: string;
  includeSubpath: boolean;
}

const Endpoint = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0 flex-1 rounded-lg border bg-muted/40 p-3">
    <div className="mb-2 text-sm text-muted-foreground">{label}</div>
    <code className="block overflow-x-auto font-mono text-sm text-foreground">{children}</code>
  </div>
);

const RoutePreview: React.FC<RoutePreviewProps> = ({ pathValue, targetValue, includeSubpath }) => {
  const proxyBaseUrl = getProxyBaseUrl();

  if (!pathValue || !targetValue) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Предпросмотр маршрутизации</CardTitle>
        <CardDescription>Как будут маршрутизироваться ваши запросы</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h4 className="mb-3 text-base font-semibold">Базовая маршрутизация:</h4>
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <Endpoint label="Ваш эндпоинт">{`${proxyBaseUrl}${pathValue}`}</Endpoint>
            <ArrowRight className="size-5 shrink-0 self-center text-muted-foreground max-sm:rotate-90" />
            <Endpoint label="Перенаправляет в">{targetValue}</Endpoint>
          </div>
        </div>

        {includeSubpath ? (
          <div>
            <h4 className="mb-3 text-base font-semibold">С подпутями:</h4>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Endpoint label="Ваш эндпоинт + подпуть">
                {`${proxyBaseUrl}${pathValue}`}
                <span className="text-primary">/v1/text-to-image/base/model</span>
              </Endpoint>
              <ArrowRight className="size-5 shrink-0 self-center text-muted-foreground max-sm:rotate-90" />
              <Endpoint label="Перенаправляет в">
                {targetValue}
                <span className="text-primary">/v1/text-to-image/base/model</span>
              </Endpoint>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Любой путь после {pathValue} будет добавлен к целевому URL
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium">Не видите нужной маршрутизации?</span> Попробуйте включить «Include Subpaths» выше — это разрешит подмаршруты вроде{" "}
              <code className="rounded-sm bg-primary/10 px-1 py-0.5 font-mono text-xs">/api/v1/models</code> на автоматическое перенаправление.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoutePreview;
