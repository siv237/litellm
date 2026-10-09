import React from "react";

import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

export const ModalityRoutingControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const modalityRouting = value.modality_routing ?? false;
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={modalityRouting}
          onCheckedChange={(nextModalityRouting) => onChange({ ...value, modality_routing: nextModalityRouting })}
          aria-label="Направлять запросы с изображениями к vision-моделям"
        />
        <strong className="font-semibold">Направлять запросы с изображениями к vision-моделям</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        Заменяет выбранную модель без входных изображений на ближайший более высокий уровень с такой возможностью, затем на модель по умолчанию, вместо ошибки 400 от провайдера. Заменяются только модели с явным supports_vision: false, а закрепление сессии по-прежнему приоритетнее, если не включить переопределение ниже.
      </span>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.modality_pin_override ?? false}
          onCheckedChange={(modalityPinOverride) => onChange({ ...value, modality_pin_override: modalityPinOverride })}
          disabled={!modalityRouting}
          aria-label="Переопределять закрепление сессии для запросов с изображениями"
        />
        <strong className="font-semibold">Переопределять закрепление сессии для запросов с изображениями</strong>
      </div>
      <span className="block text-xs text-muted-foreground">
        Направить оборот с изображением на способную модель, даже если сессия закреплена за моделью без изображений. Закрепление сохраняется — следующий текстовый оборот вернётся к нему. Требуется включённая маршрутизация изображений.
      </span>
    </>
  );
};
