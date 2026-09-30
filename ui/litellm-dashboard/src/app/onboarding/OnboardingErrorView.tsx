import React from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { buttonVariants } from "@/components/ui/button";
import { getLoginUrl } from "@/utils/returnUrlUtils";

export function OnboardingErrorView() {
  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert variant="error">
        <CircleAlert />
        <AlertTitle>Не удалось загрузить приглашение</AlertTitle>
        <AlertDescription>Ссылка-приглашение может быть недействительна или просрочена.</AlertDescription>
      </Alert>
      <div className="mt-4">
        <a href={getLoginUrl()} className={buttonVariants({ variant: "outline" })}>
          К входу
        </a>
      </div>
    </div>
  );
}
