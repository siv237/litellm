import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { ModelGroup } from "@/components/llm_calls/fetch_models";

const DEFAULT_MATCH_THRESHOLD = 0.5;

interface SemanticKeywordMatchingProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  embeddingModel: string | undefined;
  onEmbeddingModelChange: (model: string) => void;
  matchThreshold: number;
  onMatchThresholdChange: (threshold: number) => void;
  modelInfo: ModelGroup[];
  showValidationErrors?: boolean;
}

const SemanticKeywordMatching: React.FC<SemanticKeywordMatchingProps> = ({
  enabled,
  onEnabledChange,
  embeddingModel,
  onEmbeddingModelChange,
  matchThreshold,
  onMatchThresholdChange,
  modelInfo,
  showValidationErrors = false,
}) => {
  const embeddingModels = modelInfo.filter((model) => model.mode === "embedding");
  const modelOptions = Array.from(new Set(embeddingModels.map((model) => model.model_group))).map((model_group) => ({
    value: model_group,
    label: model_group,
  }));
  const embeddingModelMissing = showValidationErrors && !embeddingModel;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Семантическое сопоставление по ключевым словам</span>
            <SimpleTooltip content="Распознавать похожие формулировки через сравнение эмбеддингов, а не текста. Переопределяет прямое совпадение ключевых слов">
              <Info className="size-4 text-muted-foreground" />
            </SimpleTooltip>
          </div>
          <span className="text-muted-foreground text-sm">
            Использует те же пары «слово — уровень» и переопределяет прямое совпадение. Добавляет задержку на сетевой запрос к эмбеддинг-модели.
          </span>
        </div>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label="Семантическое сопоставление по ключевым словам" />
      </div>

      {enabled && (
        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-border">
          <div>
            <span className="mb-1 block text-sm font-medium">Эмбеддинг-модель</span>
            <SearchSelect
              options={modelOptions}
              value={embeddingModel ?? ""}
              onValueChange={(model) => {
                if (model !== null) onEmbeddingModelChange(model);
              }}
              placeholder="Выберите эмбеддинг-модель"
              emptyText="Эмбеддинг-модели не найдены"
              aria-label="Эмбеддинг-модель"
              allowClear={false}
              className={embeddingModelMissing ? "border-destructive" : undefined}
            />
            {embeddingModelMissing && <span className="text-xs text-destructive">Требуется эмбеддинг-модель</span>}
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium">Минимальная оценка совпадения</span>
            <Input
              type="number"
              value={matchThreshold}
              onChange={(event) =>
                onMatchThresholdChange(event.target.value === "" ? DEFAULT_MATCH_THRESHOLD : event.target.valueAsNumber)
              }
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Совпадение только при оценке сходства не ниже этой.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticKeywordMatching;
export { DEFAULT_MATCH_THRESHOLD };
