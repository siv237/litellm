import React, { useState, useEffect } from "react";
import { z } from "zod/v4";
import { keyCreateCall } from "./networking";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CircleAlert, CirclePlus, Copy, Info, KeyRound, Link } from "lucide-react";
import { parseErrorMessage } from "./shared/errorUtils";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";

interface SCIMConfigProps {
  accessToken: string | null;
  userID: string | null;
  proxySettings: any;
}

const scimTokenSchema = z.object({
  key_alias: z.string().min(1, "Please enter a name for your token"),
});

type SCIMTokenFormValues = z.infer<typeof scimTokenSchema>;

const SCIMConfig: React.FC<SCIMConfigProps> = ({ accessToken, userID, proxySettings }) => {
  const form = useZodForm(scimTokenSchema, { defaultValues: { key_alias: "" } });
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [baseUrl, setBaseUrl] = useState("<your_proxy_base_url>");

  useEffect(() => {
    let url = "<your_proxy_base_url>";

    if (proxySettings && proxySettings.PROXY_BASE_URL && proxySettings.PROXY_BASE_URL !== undefined) {
      url = proxySettings.PROXY_BASE_URL;
    } else if (typeof window !== "undefined") {
      // Use the current origin as the base URL if no proxy URL is set
      url = window.location.origin;
    }

    setBaseUrl(url);
  }, [proxySettings]);

  const scimBaseUrl = `${baseUrl}/scim/v2`;

  const handleCreateSCIMToken = async (values: SCIMTokenFormValues) => {
    if (!accessToken || !userID) {
      toast.fromError("Для создания SCIM-токена нужно войти в систему");
      return;
    }

    try {
      setIsCreatingToken(true);

      const formData = {
        key_alias: values.key_alias || "SCIM Access Token",
        team_id: null,
        models: [],
        allowed_routes: ["/scim/*"],
      };

      const response = await keyCreateCall(accessToken, userID, formData);
      setTokenData(response);
      toast.success("SCIM token created successfully");
    } catch (error: any) {
      console.error("Error creating SCIM token:", error);
      toast.fromError("Failed to create SCIM token: " + parseErrorMessage(error));
    } finally {
      setIsCreatingToken(false);
    }
  };

  return (
    <div className="grid grid-cols-1">
      <Card>
        <CardContent>
          <div className="flex items-center mb-4">
            <CardTitle>SCIM Configuration</CardTitle>
          </div>
          <p className="text-muted-foreground">
            System for Cross-domain Identity Management (SCIM) allows you to automatically provision and manage users
            and groups in LiteLLM.
          </p>

          <Separator className="my-6" />

          <div className="space-y-8">
            {/* Step 1: SCIM URL */}
            <div>
              <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-info/15 text-info mr-2">1</div>
                <h3 className="text-lg font-medium flex items-center">
                  <Link className="h-5 w-5 mr-2" />
                  URL тенанта SCIM
                </h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Используйте этот URL в настройках SCIM-интеграции вашего провайдера идентификации.
              </p>
              <div className="flex items-center">
                <Input value={scimBaseUrl} disabled={true} readOnly className="grow" />
                <CopyToClipboard text={scimBaseUrl} onCopy={() => toast.success("URL скопирован в буфер")}>
                  <Button type="button" className="ml-2 flex items-center">
                    <Copy />
                    Скопировать
                  </Button>
                </CopyToClipboard>
              </div>
            </div>

            {/* Step 2: SCIM Token */}
            <div>
              <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-info/15 text-info mr-2">2</div>
                <h3 className="text-lg font-medium flex items-center">
                  <KeyRound className="h-5 w-5 mr-2" />
                  Токен аутентификации
                </h3>
              </div>

              <Alert variant="info" className="mb-4">
                <Info />
                <AlertTitle>Использование SCIM</AlertTitle>
                <AlertDescription>
                  Для аутентификации в SCIM API нужен SCIM-токен. Создайте его ниже и используйте в настройках вашего SCIM-провайдера.
                </AlertDescription>
              </Alert>

              {!tokenData ? (
                <div className="bg-muted p-4 rounded-lg">
                  <form onSubmit={form.handleSubmit(handleCreateSCIMToken)}>
                    <FieldGroup>
                      <FormField control={form.control} name="key_alias" label="Имя токена">
                        {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="SCIM-токен доступа" />}
                      </FormField>
                      <div>
                        <Button
                          type="submit"
                          disabled={isCreatingToken}
                          aria-busy={isCreatingToken}
                          className="flex items-center"
                        >
                          {isCreatingToken ? <UiLoadingSpinner className="size-4" /> : <KeyRound />}
                          Create SCIM Token
                        </Button>
                      </div>
                    </FieldGroup>
                  </form>
                </div>
              ) : (
                <Card className="block p-6 border border-warning/30 bg-warning/10">
                  <div className="flex items-center mb-2 text-warning">
                    <CircleAlert className="h-5 w-5 mr-2" />
                    <h4 className="text-lg font-medium text-warning">Ваш SCIM-токен</h4>
                  </div>
                  <p className="text-warning mb-4 font-medium">
                    Скопируйте токен сейчас — больше вы его не увидите.
                  </p>
                  <div className="flex items-center">
                    <Input value={tokenData.key} className="grow mr-2" type="password" disabled={true} readOnly />
                    <CopyToClipboard text={tokenData.key} onCopy={() => toast.success("Токен скопирован в буфер")}>
                      <Button type="button" className="flex items-center">
                        <Copy />
                        Скопировать
                      </Button>
                    </CopyToClipboard>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4 flex items-center"
                    onClick={() => setTokenData(null)}
                  >
                    <CirclePlus />
                    Создать ещё токен
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SCIMConfig;
