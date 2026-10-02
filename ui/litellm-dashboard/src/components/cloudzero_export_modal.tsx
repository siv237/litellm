import React, { useState, useEffect } from "react";
import { CircleCheck, FileDown } from "lucide-react";
import { z } from "zod/v4";
import { getGlobalLitellmHeaderName } from "@/components/networking";
import { toast } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const cloudZeroSettingsSchema = z.object({
  api_key: z.string().min(1, "Please enter your CloudZero API key"),
  connection_id: z.string().min(1, "Please enter the CloudZero connection ID"),
});

interface CloudZeroExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
}

type CloudZeroSettings = z.output<typeof cloudZeroSettingsSchema>;

interface CloudZeroSettingsView {
  api_key_masked: string;
  connection_id: string;
  status: string;
}

type ExportType = "cloudzero" | "csv";

const CloudZeroExportModal: React.FC<CloudZeroExportModalProps> = ({ isOpen, onClose, accessToken }) => {
  const form = useZodForm(cloudZeroSettingsSchema, {
    defaultValues: { api_key: "", connection_id: "" },
  });
  const [loading, setLoading] = useState(false);
  const [existingSettings, setExistingSettings] = useState<CloudZeroSettingsView | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [exportType, setExportType] = useState<ExportType>("cloudzero");
  const [exportLoading, setExportLoading] = useState(false);

  // Load existing settings when modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      loadExistingSettings();
    }
  }, [isOpen, accessToken]);

  const loadExistingSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch("/cloudzero/settings", {
        method: "GET",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const settings = await response.json();
        setExistingSettings(settings);
        // Pre-populate form with existing settings (except masked API key)
        form.setValue("connection_id", settings.connection_id);
      } else if (response.status !== 404) {
        // 404 means no settings configured yet, which is fine
        const errorData = await response.json();
        toast.fromError(`Failed to load existing settings: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error loading CloudZero settings:", error);
      toast.fromError("Не удалось загрузить существующие настройки");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveCloudZeroSettings = async (values: CloudZeroSettings) => {
    if (!accessToken) {
      toast.fromError("Токен доступа недоступен");
      return;
    }

    setLoading(true);
    try {
      const endpoint = existingSettings ? "/cloudzero/settings" : "/cloudzero/init";
      const method = existingSettings ? "PUT" : "POST";

      // Add default timezone for backend compatibility
      const payload = {
        ...values,
        timezone: "UTC",
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "CloudZero settings saved successfully");
        setExistingSettings({
          api_key_masked: values.api_key.substring(0, 4) + "****" + values.api_key.slice(-4),
          connection_id: values.connection_id,
          status: "configured",
        });
        return true;
      } else {
        toast.fromError(data.error || "Failed to save CloudZero settings");
        return false;
      }
    } catch (error) {
      console.error("Error saving CloudZero settings:", error);
      toast.fromError("Не удалось сохранить настройки CloudZero");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleExportCloudZero = async () => {
    if (!accessToken) {
      toast.fromError("Токен доступа недоступен");
      return;
    }

    setExportLoading(true);
    try {
      const response = await fetch("/cloudzero/export", {
        method: "POST",
        headers: {
          [getGlobalLitellmHeaderName()]: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 100000,
          operation: "replace_hourly",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Export to CloudZero completed successfully");
        onClose();
      } else {
        toast.fromError(data.error || "Failed to export to CloudZero");
      }
    } catch (error) {
      console.error("Error exporting to CloudZero:", error);
      toast.fromError("Failed to export to CloudZero");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // TODO: Implement CSV export functionality
      toast.info("CSV export functionality coming soon!");
      onClose();
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.fromError("Failed to export CSV");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = async () => {
    if (exportType === "cloudzero") {
      // Check if settings exist, if not save them first
      if (!existingSettings) {
        let values: CloudZeroSettings | undefined;
        await form.handleSubmit((formValues) => {
          values = formValues;
        })();
        if (!values) return;
        const success = await handleSaveCloudZeroSettings(values);
        if (!success) return;
      }
      await handleExportCloudZero();
    } else {
      await handleExportCSV();
    }
  };

  const handleModalClose = () => {
    form.reset();
    setExportType("cloudzero");
    setExistingSettings(null);
    onClose();
  };

  const exportOptions = [
    {
      value: "cloudzero",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/cloudzero.png"
            alt="CloudZero"
            className="w-5 h-5"
            onError={(e) => {
              // Fallback to text if image fails to load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span>Экспорт в CloudZero</span>
        </div>
      ),
    },
    {
      value: "csv",
      label: (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Экспорт в CSV</span>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Экспорт данных</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Export Type Selection */}
          <div>
            <p className="text-sm font-medium mb-2 block">Назначение экспорта</p>
            <Select items={exportOptions} value={exportType} onValueChange={(value) => value && setExportType(value)}>
              <SelectTrigger className="w-full" aria-label="Назначение экспорта">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CloudZero Configuration */}
          {exportType === "cloudzero" && (
            <div>
              {settingsLoading ? (
                <div className="flex justify-center py-8">
                  <UiLoadingSpinner className="size-8" />
                </div>
              ) : (
                <>
                  {existingSettings && (
                    <Alert className="mb-4">
                      <CircleCheck />
                      <AlertTitle>Существующая конфигурация CloudZero</AlertTitle>
                      <AlertDescription>
                        API-ключ: {existingSettings.api_key_masked}
                        <br />
                        ID подключения: {existingSettings.connection_id}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!existingSettings && (
                    <form onSubmit={(event) => event.preventDefault()}>
                      <FieldGroup>
                        <FormField control={form.control} name="api_key" label="API-ключ CloudZero">
                          {({ ref, ...field }) => (
                            <PasswordInput {...field} ref={ref} placeholder="Введите API-ключ CloudZero" />
                          )}
                        </FormField>

                        <FormField control={form.control} name="connection_id" label="ID подключения">
                          {({ ref, ...field }) => (
                            <Input {...field} ref={ref} placeholder="Введите ID подключения CloudZero" />
                          )}
                        </FormField>
                      </FieldGroup>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* CSV Export Info */}
          {exportType === "csv" && (
            <Alert variant="info">
              <FileDown />
              <AlertTitle>Экспорт CSV</AlertTitle>
              <AlertDescription>
                Выгрузите данные о расходе в CSV для анализа в табличном редакторе.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleModalClose}>
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={loading || exportLoading}
              aria-busy={loading || exportLoading}
            >
              {(loading || exportLoading) && <UiLoadingSpinner className="size-4" />}
              {exportType === "cloudzero" ? "Export to CloudZero" : "Export CSV"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloudZeroExportModal;
