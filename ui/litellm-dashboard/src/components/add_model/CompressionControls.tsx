import { SimpleTooltip } from "@/components/ui/tooltip";
import { SearchSelect, SearchSelectOption } from "@/components/shared/SearchSelect";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import React from "react";
import { useGuardrails } from "@/app/(dashboard)/hooks/guardrails/useGuardrails";
import {
  AutoRouterCompressionState,
  isCompressionGuardrailProvider,
  NO_COMPRESSION,
} from "./buildAutoRouterCompression";

interface CompressionControlsProps {
  value: AutoRouterCompressionState;
  onChange: (state: AutoRouterCompressionState) => void;
}

const NONE_OPTION: SearchSelectOption = { label: "Нет (без сжатия)", value: NO_COMPRESSION };

const CompressionControls: React.FC<CompressionControlsProps> = ({ value, onChange }) => {
  const { routing, sameAsRouting, model } = value;
  const onRoutingChange = (newRouting: string | undefined) => onChange({ ...value, routing: newRouting });
  const onSameAsRoutingChange = (newSameAsRouting: boolean) => onChange({ ...value, sameAsRouting: newSameAsRouting });
  const onModelChange = (newModel: string | undefined) => onChange({ ...value, model: newModel });

  const { data } = useGuardrails();
  const compressionOptions: SearchSelectOption[] = (data?.guardrails ?? [])
    .filter((g) => isCompressionGuardrailProvider(g.litellm_params?.guardrail))
    .map((g) => ({ label: g.guardrail_name, value: g.guardrail_name }));
  const options: SearchSelectOption[] = [NONE_OPTION, ...compressionOptions];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">Решение маршрутизации</span>
          <SimpleTooltip content="Сжатие, применяемое к самому вызову классификатора, выбирающего уровень, отдельно от модели, куда маршрутизируется запрос.">
            <Info className="size-4 text-muted-foreground" />
          </SimpleTooltip>
        </div>
        <SearchSelect
          options={options}
          value={routing}
          onValueChange={(value) => onRoutingChange(value ?? undefined)}
          placeholder="Наследовать гардрейлы сжатия самого запроса"
          emptyText="Гардрейлы сжатия не найдены"
          aria-label="Сжатие решения маршрутизации"
        />
      </div>

      {routing !== undefined && (
        <div>
          <span className="mb-2 block text-sm font-medium">Вызов модели</span>
          <RadioGroup
            value={sameAsRouting ? "same" : "different"}
            onValueChange={(value: unknown) => onSameAsRoutingChange(value === "same")}
            className="w-full"
          >
            <div className="flex w-full flex-col items-start gap-2">
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="same" className="mt-0.5" />
                <span>Как в решении маршрутизации</span>
              </Label>
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="different" className="mt-0.5" />
                <span>Использовать другое сжатие</span>
              </Label>
            </div>
          </RadioGroup>

          {!sameAsRouting && (
            <div className="mt-3">
              <SearchSelect
                options={options}
                value={model}
                onValueChange={(value) => onModelChange(value ?? undefined)}
                placeholder="Нет (без сжатия)"
                emptyText="Гардрейлы сжатия не найдены"
                aria-label="Сжатие вызова модели"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressionControls;
