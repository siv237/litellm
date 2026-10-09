import React from "react";
import { Control } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { FormField } from "@/components/shared/form/FormField";
import AgentSelector from "../agent_management/AgentSelector";
import NumericalInput from "../shared/numerical_input";
import SkillSelector from "../skills/SkillSelector";
import { AgentsAndGroups, KeyEditFormValues } from "./keyEditFormValues";

export const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  </>
);

const KEY_TYPE_OPTIONS = [
  { value: "default", label: "Полный доступ", hint: "Может вызывать все маршруты (AI API, управление и только чтение)" },
  { value: "llm_api", label: "AI APIs", hint: "Может вызывать только маршруты AI API (chat/completions, embeddings и т.п.)" },
  { value: "management", label: "Управление", hint: "Может вызывать только маршруты управления (пользователи/команды/ключи)" },
];

export const KeyTypeSelect = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <Select
    items={Object.fromEntries(KEY_TYPE_OPTIONS.map((option) => [option.value, option.label]))}
    value={value}
    onValueChange={(next: string | null) => next != null && onChange(next)}
  >
    <SelectTrigger id={id} className="w-full">
      <SelectValue placeholder="Выберите тип ключа" />
    </SelectTrigger>
    <SelectContent>
      {KEY_TYPE_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          <div className="py-1">
            <div className="font-medium">{option.label}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{option.hint}</div>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const SKILLS_HINT =
  "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here.";

export const KeyAgentAndSkillFields = ({
  control,
  accessToken,
}: {
  control: Control<KeyEditFormValues>;
  accessToken: string;
}) => (
  <>
    <FormField control={control} name="agents_and_groups" label="Агенты / группы доступа">
      {({ value, onChange }) => (
        <AgentSelector
          onChange={onChange}
          value={value as AgentsAndGroups | undefined}
          accessToken={accessToken}
          placeholder="Выберите агентов или группы доступа (необязательно)"
        />
      )}
    </FormField>

    <FormField control={control} name="skills" label={labelWithHint("Skills", SKILLS_HINT)}>
      {({ value, onChange }) => (
        <SkillSelector onChange={onChange} value={value as string[] | undefined} accessToken={accessToken} />
      )}
    </FormField>
  </>
);

export const KeyBudgetNumberField = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<KeyEditFormValues>;
  name: "max_budget" | "soft_budget";
  label: string;
  placeholder: string;
}) => (
  <FormField control={control} name={name} label={label}>
    {({ ref: _ref, ...field }) => (
      <NumericalInput
        {...field}
        value={field.value ?? ""}
        step={0.01}
        style={{ width: "100%" }}
        placeholder={placeholder}
      />
    )}
  </FormField>
);
