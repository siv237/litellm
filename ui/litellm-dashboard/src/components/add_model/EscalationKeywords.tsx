import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import React from "react";

export const DEFAULT_ESCALATION_KEYWORDS = ["LITELLM ESCALATE"];

interface EscalationKeywordsProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

const EscalationKeywords: React.FC<EscalationKeywordsProps> = ({ keywords, onChange }) => {
  return (
    <div className="w-full max-w-none">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="m-0 text-xl font-semibold text-foreground">Ключевые слова эскалации</h4>
        <SimpleTooltip content="Фразы с учётом регистра, которые пользователь может включить в сообщение, чтобы принудительно поднять уровень сложности, если результат не устраивает. Можно потребовать более сильную модель, но не выбрать конкретную.">
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>
      <span className="mb-2 block text-xs text-muted-foreground">
        Необязательно: если сообщение пользователя содержит одну из этих фраз, запрос поднимается на уровень выше обычного. Совпадение чувствительно к регистру, поэтому LITELLM ESCALATE срабатывает только в точной «кричащей» форме. Оставьте пустым, чтобы отключить.
      </span>
      <MultiSelect
        options={keywords.map((keyword) => ({ label: keyword, value: keyword }))}
        value={keywords}
        onValueChange={onChange}
        placeholder="напр., LITELLM ESCALATE"
        emptyText="Введите фразу и добавьте"
        allowCustomValues
        className="w-full"
      />
    </div>
  );
};

export default EscalationKeywords;
