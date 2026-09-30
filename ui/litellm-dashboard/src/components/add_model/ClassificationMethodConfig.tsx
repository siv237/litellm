import { transitionClassifierType } from "./classifier_type_transition";
import JevClassifierConfig from "./JevClassifierConfig";
import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import React from "react";
import ClassifierPromptEditor from "./ClassifierPromptEditor";
import OpeningPromptEditor, { type OpeningPromptSelection } from "./OpeningPromptEditor";
import { RestrictedSection, restrictedBy } from "./TierRestrictions";
import HeuristicScoringConfig from "./HeuristicScoringConfig";
import ClassifierReasoningEffortSelect from "./ClassifierReasoningEffortSelect";
import ClassifierCircuitBreakerConfig from "./ClassifierCircuitBreakerConfig";
import ClassifierVisionConfig from "./ClassifierVisionConfig";
import type { ReasoningEffort } from "./complexity_router_tiers";
import { useComplexityScorerDefaults } from "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults";
import {
  ClassificationFrequency,
  ClassifierFallback,
  ClassifierLLMConfig,
  ClassifierType,
  ComplexityRouterConfigValue,
  classificationFrequency,
  withClassificationFrequency,
  DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS,
  MIN_QUOTED_CONTEXT_TURN_CHARS,
  DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE,
  DEFAULT_CLASSIFIER_FALLBACK,
  DEFAULT_CLASSIFIER_TIMEOUT_MS,
  DEFAULT_CLASSIFICATION_RUBRIC,
  ClassificationRubric,
  effectiveTierLabel,
  heuristicScoringRole,
  usesLlmClassifier,
  usesClassifierContext,
  DEFAULT_HYBRID_BOUNDARY_MARGIN,
  HEURISTIC_FIRST_MAX_TIER_KEYS,
  effectiveClassifierType,
} from "./ComplexityRouterConfig";

const DEFAULT_SCORING_EXPLANATION =
  "Маршрутизатор оценивает каждый запрос по 7 встроенным измерениям: число токенов, наличие кода, маркеры " +
  "рассуждения, технические термины, простые индикаторы, многошаговые паттерны и сложность вопроса, плюс " +
  "добавленные вами измерения. Взвешенный балл определяет уровень:";

const HEURISTIC_V2_EXPLANATION =
  "Маршрутизатор оценивает вероятность успеха для всех четырёх уровней встроенной калиброванной моделью и выбирает " +
  "первый уровень, достигший обученного порога. Работает локально, без вызова API классификатора.";

const CLASSIFIER_TIMEOUT_ID = "classifier-timeout-ms";
const CLASSIFIER_CONTEXT_WINDOW_SIZE_ID = "classifier-context-window-size";
const CLASSIFIER_CONTEXT_BUDGET_CHARS_ID = "classifier-context-budget-chars";
const HYBRID_BOUNDARY_MARGIN_ID = "hybrid-boundary-margin";

const CUSTOM_PROMPT_WITH_HEURISTIC_FALLBACK =
  "This router classifies with your own prompt, so the tier comes from whatever rubric it states. The four tier " +
  "names stay fixed. The scoring below is the heuristic, which now runs only when the classifier call fails:";

const CUSTOM_PROMPT_WITH_DEFAULT_MODEL_FALLBACK =
  "This router classifies with your own prompt, so the tier comes from whatever rubric it states. The four tier " +
  "names stay fixed. The scoring below no longer runs at all, since a failed classifier routes to the default " +
  "model instead:";

/**
 * What the scoring breakdown below it actually describes. A custom prompt means the score no longer
 * decides the tier, and pairing one with the default-model fallback means the heuristic never runs
 * at all, so the panel must not keep implying a score is involved on either router.
 */
const scoringExplanation = (value: ComplexityRouterConfigValue): string => {
  if (value.classifier_type === "heuristic_v2") return HEURISTIC_V2_EXPLANATION;
  const usesCustomPrompt =
    usesLlmClassifier(value.classifier_type) && Boolean(value.classifier_llm_config?.system_prompt?.trim());
  if (!usesCustomPrompt) return DEFAULT_SCORING_EXPLANATION;
  return value.classifier_fallback === "default_model"
    ? CUSTOM_PROMPT_WITH_DEFAULT_MODEL_FALLBACK
    : CUSTOM_PROMPT_WITH_HEURISTIC_FALLBACK;
};

/**
 * The three boundaries this card states, as displayed strings, or null until the proxy's shipped defaults
 * have arrived. Kept out of the component so the card cannot state a range the router stopped using, and
 * so the derivation does not add branches to an already dense render.
 */
const boundaryRanges = (
  shipped: Record<string, number> | undefined,
  overrides: Record<string, number> | undefined,
  reasoningOverrideMinScore: number | undefined,
): {
  simpleMedium: string;
  mediumComplex: string;
  complexReasoning: string;
  reasoningOverrideFloor: string;
} | null => {
  const effective: Record<string, number> = { ...shipped, ...overrides };
  const [low, mid, high] = [effective.simple_medium, effective.medium_complex, effective.complex_reasoning];
  if (low === undefined || mid === undefined || high === undefined) return null;
  return {
    simpleMedium: low.toFixed(2),
    mediumComplex: mid.toFixed(2),
    complexReasoning: high.toFixed(2),
    reasoningOverrideFloor: (reasoningOverrideMinScore ?? low).toFixed(2),
  };
};

const HowClassificationWorks: React.FC<{ value: ComplexityRouterConfigValue }> = ({ value }) => {
  // The shipped boundaries come from the proxy, so this card cannot state ranges the router stopped using.
  const { data: scorerDefaults, isError } = useComplexityScorerDefaults();
  const scorerRuns = heuristicScoringRole(value) !== "never";
  const ranges = boundaryRanges(
    scorerDefaults?.tier_boundaries,
    value.tier_boundaries,
    value.reasoning_override_min_score,
  );

  if (value.custom_tier_set) return null;

  return (
    <Card className="bg-muted mt-4">
      <CardContent>
        <strong className="block mb-2 font-semibold">Как работает классификация</strong>
        <span className="text-[13px] text-muted-foreground">{scoringExplanation(value)}</span>
        {scorerRuns && ranges && (
          <ul className="mt-2 pl-5 text-[13px] text-muted-foreground">
            <li>
              <strong>{effectiveTierLabel("SIMPLE", value.tier_labels)}</strong>: балл &lt; {ranges.simpleMedium}
            </li>
            <li>
              <strong>{effectiveTierLabel("MEDIUM", value.tier_labels)}</strong>: балл {ranges.simpleMedium} –{" "}
              {ranges.mediumComplex}
            </li>
            <li>
              <strong>{effectiveTierLabel("COMPLEX", value.tier_labels)}</strong>: балл {ranges.mediumComplex} –{" "}
              {ranges.complexReasoning}
            </li>
            <li>
              <strong>{effectiveTierLabel("REASONING", value.tier_labels)}</strong>: балл &gt;{" "}
              {ranges.complexReasoning} (или 2+ маркеров рассуждения с баллом не менее{" "}
              {ranges.reasoningOverrideFloor})
            </li>
          </ul>
        )}
        {!ranges && isError && (
          <span className="text-[13px] block mt-2 text-muted-foreground">
            Не удалось загрузить диапазоны баллов уровней с прокси.
          </span>
        )}
      </CardContent>
    </Card>
  );
};

interface ClassificationMethodConfigProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  modelOptions: { value: string; label: string }[];
  effortOptionsByModel: Record<string, string[] | null | undefined>;
  customTechnicalKeywords?: string[];
  onCustomTechnicalKeywordsChange?: (keywords: string[]) => void;
  showValidationErrors?: boolean;
  /** The resolved default model - see resolveComplexityDefaultModel. Names and gates the radio. */
  defaultModel?: string;
}

const ClassifierTypeRadios: React.FC<{
  value: ComplexityRouterConfigValue;
  classifierType: ClassifierType;
  onTypeChange: (classifierType: ClassifierType) => void;
}> = ({ value, classifierType, onTypeChange }) => {
  const scorerLocked = Boolean(value.custom_tier_set);
  const scorerLockedReason = restrictedBy(value, "heuristicClassifier")?.reason;
  return (
    <RadioGroup
      value={classifierType}
      onValueChange={(classifierType: unknown) => onTypeChange(classifierType as ClassifierType)}
      className="w-full"
    >
      <div className="flex w-full flex-col items-start gap-2">
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">Эвристика</strong>{" "}
              <span className="text-muted-foreground">
                (по умолчанию), оценка по правилам без вызовов API и задержкой &lt;1 мс
              </span>
            </span>
          </Label>
        </SimpleTooltip>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic_v2" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">Эвристика v2</strong>{" "}
              <span className="text-muted-foreground">
                использует встроенные калиброванные вероятности четырёх уровней без вызова API
              </span>
            </span>
          </Label>
        </SimpleTooltip>
        <Label className="items-start font-normal leading-normal">
          <RadioGroupItem value="llm" className="mt-0.5" />
          <span>
            <strong className="font-semibold">LLM-классификатор</strong>{" "}
            <span className="text-muted-foreground">определяет уровень вызовом модели (напр. маленькой/быстрой)</span>
          </span>
        </Label>
        <Label className="items-start font-normal leading-normal">
          <RadioGroupItem value="jev" className="mt-0.5" />
          <span>
            <strong className="font-semibold">JEV-классификатор</strong>{" "}
            <span className="text-muted-foreground">использует TypeSafe System One Choice для выбора уровня</span>
          </span>
        </Label>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic_first" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">Сначала эвристика</strong>{" "}
              <span className="text-muted-foreground">
                scores locally, and only pays for the classifier when the score does not confidently land a cheap tier
              </span>
            </span>
          </Label>
        </SimpleTooltip>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="hybrid" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">Гибрид</strong>{" "}
              <span className="text-muted-foreground">
                keeps the local score at any tier, and only pays for the classifier when that score lands near a tier
                boundary
              </span>
            </span>
          </Label>
        </SimpleTooltip>
      </div>
    </RadioGroup>
  );
};

const ClassificationMethodConfig: React.FC<ClassificationMethodConfigProps> = ({
  value,
  onChange,
  modelOptions,
  effortOptionsByModel,
  customTechnicalKeywords,
  onCustomTechnicalKeywordsChange,
  showValidationErrors = false,
  defaultModel,
}) => {
  const [draft, setDraft] = React.useState<{ id: string; raw: string } | null>(null);
  const hasDefaultModel = Boolean(defaultModel);
  const classifierType = effectiveClassifierType(value);
  const sessionFrequencyRestriction = restrictedBy(value, "sessionAffinity");
  const classifierModelMissing =
    showValidationErrors && usesLlmClassifier(classifierType) && !value.classifier_llm_config?.model;
  const usesCustomPrompt = Boolean(value.classifier_llm_config?.system_prompt?.trim());
  const contextBudget = value.classifier_context_budget_chars ?? DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS;
  const contextBudgetQuotesNothing = contextBudget > 0 && contextBudget < MIN_QUOTED_CONTEXT_TURN_CHARS;
  const classificationRubric = value.classifier_llm_config?.classification_rubric ?? DEFAULT_CLASSIFICATION_RUBRIC;
  const classifierModel = value.classifier_llm_config?.model ?? "";
  const classifierReasoningEffort = value.classifier_llm_config?.reasoning_effort;
  const explicitlySupportedClassifierEfforts = effortOptionsByModel[classifierModel];

  const handleClassifierTypeChange = (classifierType: ClassifierType) => {
    onChange(transitionClassifierType(value, classifierType));
  };

  const handleHeuristicFirstMaxTierChange = (tier: string) => {
    onChange({ ...value, heuristic_first_max_tier: tier });
  };

  const handleHybridBoundaryMarginChange = (raw: string) => {
    setDraft({ id: HYBRID_BOUNDARY_MARGIN_ID, raw });
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    onChange({ ...value, hybrid_boundary_margin: Math.min(1, Math.max(0, parsed)) });
  };

  // One write for everything the prompt dialog owns. The rubric arrives here rather than through the
  // rubric handler because two onChange calls in one tick would both spread this render's `value`,
  // so whichever landed second would drop the other's edit.
  const handleClassificationPromptChange = ({
    classificationPrompt,
    classificationExamples,
    classificationRubric: selectedRubric,
  }: OpeningPromptSelection) => {
    const rubricConfig: ClassifierLLMConfig = {
      ...value.classifier_llm_config,
      model: value.classifier_llm_config?.model ?? "",
      timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
      classification_rubric: selectedRubric,
    };
    const nextValue: ComplexityRouterConfigValue = {
      ...value,
      ...(selectedRubric && { classifier_llm_config: rubricConfig }),
      classification_prompt: classificationPrompt,
      classification_examples: classificationExamples,
    };
    onChange(nextValue);
  };

  const handleClassifierModelChange = (model: string | null) => {
    if (model === null) return;
    if (model === value.classifier_llm_config?.model) return;
    const { reasoning_effort: _reasoningEffort, ...classifierLlmConfig } = value.classifier_llm_config ?? {
      model: "",
      timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS,
    };
    onChange({
      ...value,
      classifier_llm_config: {
        ...classifierLlmConfig,
        model,
        timeout_ms: classifierLlmConfig.timeout_ms,
      },
    });
  };

  const handleClassifierReasoningEffortChange = (reasoningEffort: ReasoningEffort | undefined) => {
    if (!value.classifier_llm_config) return;
    const { reasoning_effort: _reasoningEffort, ...classifierLlmConfig } = value.classifier_llm_config;
    onChange({
      ...value,
      classifier_llm_config:
        reasoningEffort === undefined
          ? classifierLlmConfig
          : { ...classifierLlmConfig, reasoning_effort: reasoningEffort },
    });
  };

  const handleClassifierTimeoutChange = (timeoutMs: number) => {
    onChange({
      ...value,
      classifier_llm_config: {
        ...value.classifier_llm_config,
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: timeoutMs,
      },
    });
  };

  const handleClassificationRubricChange = (classificationRubric: ClassificationRubric) => {
    onChange({
      ...value,
      classifier_llm_config: {
        ...value.classifier_llm_config,
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
        classification_rubric: classificationRubric,
      },
    });
  };

  const handleClassifierSystemPromptChange = (systemPrompt: string | undefined) => {
    onChange({
      ...value,
      classifier_llm_config: {
        ...value.classifier_llm_config,
        model: value.classifier_llm_config?.model ?? "",
        timeout_ms: value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS,
        system_prompt: systemPrompt,
      },
    });
  };

  const handleClassifierFallbackChange = (fallback: ClassifierFallback) => {
    onChange({ ...value, classifier_fallback: fallback });
  };

  const handleClassificationFrequencyChange = (frequency: ClassificationFrequency) => {
    onChange(withClassificationFrequency(value, frequency));
  };

  const handleClassifierContextWindowSizeChange = (windowSize: number) => {
    onChange({
      ...value,
      classifier_context_window_size: windowSize,
    });
  };

  const handleClassifierContextBudgetCharsChange = (budgetChars: number) => {
    onChange({
      ...value,
      classifier_context_budget_chars: budgetChars,
    });
  };

  const handleClassifierIntegerChange = (
    id: string,
    raw: string,
    minimum: number,
    onCommit: (value: number) => void,
  ) => {
    setDraft({ id, raw });
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    onCommit(Math.max(minimum, Math.round(parsed)));
  };

  const handleClassifierContextIncludeAssistantTurnsChange = (includeAssistantTurns: boolean) => {
    onChange({
      ...value,
      classifier_context_include_assistant_turns: includeAssistantTurns,
    });
  };

  return (
    <>
      <ClassifierTypeRadios value={value} classifierType={classifierType} onTypeChange={handleClassifierTypeChange} />

      {classifierType === "heuristic_first" && (
        <div className="mt-4 space-y-2">
          <strong className="block font-semibold">Решать локально до</strong>
          <Select
            value={value.heuristic_first_max_tier}
            onValueChange={(tier: unknown) => handleHeuristicFirstMaxTierChange(tier as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEURISTIC_FIRST_MAX_TIER_KEYS.map((tier) => (
                <SelectItem key={tier} value={tier}>
                  {effectiveTierLabel(tier, value.tier_labels)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Запрос, который скорер помещает на этот уровень или ниже, направляется туда без вызова классификатора. Всё, что скорер поместил выше, и всё, где сигнала не найдено вообще, уходит классификатору
          </p>
        </div>
      )}

      {classifierType === "hybrid" && (
        <div className="mt-4 space-y-2">
          <strong className="block font-semibold">Запас у границы</strong>
          <Input
            id={HYBRID_BOUNDARY_MARGIN_ID}
            type="text"
            inputMode="decimal"
            value={
              draft?.id === HYBRID_BOUNDARY_MARGIN_ID
                ? draft.raw
                : String(value.hybrid_boundary_margin ?? DEFAULT_HYBRID_BOUNDARY_MARGIN)
            }
            onChange={(event) => handleHybridBoundaryMarginChange(event.target.value)}
            onBlur={() => setDraft(null)}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Балл, отстоящий дальше этого значения от любой границы уровней, направляется на уровень самого скорера,
            каким бы дорогим он ни был. Балл ближе этого значения — и всё, где сигнала нет вообще, — уходит
            классификатору, чтобы разрешить ничью
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <strong className="block font-semibold">Как часто классифицировать</strong>
        <RadioGroup
          value={classificationFrequency(value)}
          onValueChange={(frequency: unknown) =>
            handleClassificationFrequencyChange(frequency as ClassificationFrequency)
          }
        >
          <div className="inline-flex flex-col gap-2">
            <Label className="items-start font-normal leading-normal">
              <RadioGroupItem value="every_request" className="mt-0.5" />
              <span>
                <span>Каждый запрос</span>{" "}
                <span className="text-muted-foreground">: оценивать каждый ход, включая продолжения после результатов инструментов</span>
              </span>
            </Label>
            <Label className="items-start font-normal leading-normal">
              <RadioGroupItem value="user_turn" className="mt-0.5" />
              <span>
                <span>Каждое новое сообщение пользователя</span>{" "}
                <span className="text-muted-foreground">
                  : оценивать каждый новый вопрос человека и удерживать уровень для последующих вызовов инструментов
                </span>
              </span>
            </Label>
            <Label className="items-start font-normal leading-normal">
              <RadioGroupItem value="session" className="mt-0.5" disabled={Boolean(sessionFrequencyRestriction)} />
              <span>
                <span>Один раз за сессию</span>{" "}
                <span className="text-muted-foreground">
                  {sessionFrequencyRestriction?.reason ??
                    ": score the first turn only, then hold that tier and its deployment for the whole session"}
                </span>
              </span>
            </Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-muted-foreground">
          Удержание уровня оставляет агента на одной модели во всём цикле инструментов и снижает стоимость оценки. Ход, который маршрутизатор не может сопоставить с удержанным решением (например, без ID сессии или с просроченным), оценивается заново
        </p>
      </div>

      {classifierType === "jev" && <JevClassifierConfig value={value} onChange={onChange} />}
      {usesLlmClassifier(classifierType) && (
        <div className="mt-4 space-y-3">
          <div>
            <strong className="block mb-1 font-semibold">Модель-классификатор</strong>
            <SearchSelect
              options={modelOptions}
              value={value.classifier_llm_config?.model ?? ""}
              onValueChange={handleClassifierModelChange}
              placeholder="Выберите модель для классификации сложности запросов"
              emptyText="Модели не найдены"
              allowClear={false}
              className={classifierModelMissing ? "border-destructive" : undefined}
              aria-label="Модель-классификатор"
            />
            {classifierModelMissing && <span className="text-xs text-destructive">Требуется модель-классификатор</span>}
          </div>
          <ClassifierReasoningEffortSelect
            model={classifierModel}
            value={classifierReasoningEffort}
            explicitlySupported={explicitlySupportedClassifierEfforts}
            onChange={handleClassifierReasoningEffortChange}
          />
          <div>
            <Label htmlFor={CLASSIFIER_TIMEOUT_ID} className="block mb-1 font-semibold">
              Таймаут (мс)
            </Label>
            <Input
              id={CLASSIFIER_TIMEOUT_ID}
              type="text"
              inputMode="numeric"
              value={
                draft?.id === CLASSIFIER_TIMEOUT_ID
                  ? draft.raw
                  : String(value.classifier_llm_config?.timeout_ms ?? DEFAULT_CLASSIFIER_TIMEOUT_MS)
              }
              onChange={(event) =>
                handleClassifierIntegerChange(
                  CLASSIFIER_TIMEOUT_ID,
                  event.target.value,
                  1,
                  handleClassifierTimeoutChange,
                )
              }
              onBlur={() => setDraft(null)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">
              Сколько времени есть у вызова классификатора до сбоя и перехода на резервный вариант ниже.
            </span>
          </div>
          <ClassifierCircuitBreakerConfig
            value={value.classifier_llm_config ?? { model: "", timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS }}
            onChange={(classifier_llm_config) => onChange({ ...value, classifier_llm_config })}
          />
          <ClassifierVisionConfig
            value={value.classifier_llm_config ?? { model: "", timeout_ms: DEFAULT_CLASSIFIER_TIMEOUT_MS }}
            onChange={(classifier_llm_config) => onChange({ ...value, classifier_llm_config })}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <strong className="font-semibold">Промпт классификатора</strong>
              <SimpleTooltip content="Every rubric uses the same four tiers. They differ in the worked examples that show the classifier where the boundary between tiers sits, and the Business rubric also rewrites the tier definitions for business traffic. Pick the rubric, and write your own opening instructions and calibration examples, inside the prompt editor.">
                <Info className="size-4 text-muted-foreground" />
              </SimpleTooltip>
            </div>
            {!value.custom_tier_set && usesCustomPrompt ? (
              <ClassifierPromptEditor
                systemPrompt={value.classifier_llm_config?.system_prompt}
                onChange={handleClassifierSystemPromptChange}
                contextWindowSize={value.classifier_context_window_size ?? DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE}
                tierLabels={value.tier_labels}
                classificationRubric={classificationRubric}
              />
            ) : (
              <OpeningPromptEditor
                classificationPrompt={value.classification_prompt}
                classificationExamples={value.classification_examples}
                onChange={handleClassificationPromptChange}
                tierSource={
                  value.custom_tier_set
                    ? { kind: "custom", tierRows: value.custom_tier_set.tiers }
                    : {
                        kind: "builtIn",
                        tierLabels: value.tier_labels,
                        classificationRubric,
                        rubricRestriction: restrictedBy(value, "classificationRubric")?.reason,
                      }
                }
                contextWindowSize={value.classifier_context_window_size ?? DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE}
              />
            )}
          </div>
        </div>
      )}
      {usesClassifierContext(classifierType) && (
        <div className="mt-4 space-y-3">
          <RestrictedSection heading="Если классификатор не справился" by={restrictedBy(value, "classifierFallback")}>
            <RadioGroup
              value={value.classifier_fallback ?? DEFAULT_CLASSIFIER_FALLBACK}
              onValueChange={(fallback: unknown) => handleClassifierFallbackChange(fallback as ClassifierFallback)}
            >
              <div className="inline-flex flex-col gap-2">
                <Label className="items-start font-normal leading-normal">
                  <RadioGroupItem value="heuristic" className="mt-0.5" />
                  <span>
                    <span>Оценивать эвристикой</span>{" "}
                    <span className="text-muted-foreground">— когда классификатор корректно оценивает сложность</span>
                  </span>
                </Label>
                <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
                  <RadioGroupItem value="default_model" disabled={!hasDefaultModel} className="mt-0.5" />
                  <SimpleTooltip
                    content={
                      hasDefaultModel
                        ? "Change it from the Default Model select."
                        : "Set a default model on this router to use this option"
                    }
                  >
                    <span>
                      <span>Направлять на модель по умолчанию{defaultModel ? ` (${defaultModel})` : ""}</span>{" "}
                      <span className="text-muted-foreground">
                        — когда ваш промпт оценивает что-то кроме сложности
                      </span>
                    </span>
                  </SimpleTooltip>
                </Label>
              </div>
            </RadioGroup>
            <span className="block text-xs text-muted-foreground">
              Применяется при ошибке вызова классификатора, таймауте или неразбираемом ответе.
            </span>
          </RestrictedSection>
          <div>
            <Label htmlFor={CLASSIFIER_CONTEXT_WINDOW_SIZE_ID} className="block mb-1 font-semibold">
              Размер контекстного окна
            </Label>
            <Input
              id={CLASSIFIER_CONTEXT_WINDOW_SIZE_ID}
              type="text"
              inputMode="numeric"
              value={
                draft?.id === CLASSIFIER_CONTEXT_WINDOW_SIZE_ID
                  ? draft.raw
                  : String(value.classifier_context_window_size ?? DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE)
              }
              onChange={(event) =>
                handleClassifierIntegerChange(
                  CLASSIFIER_CONTEXT_WINDOW_SIZE_ID,
                  event.target.value,
                  0,
                  handleClassifierContextWindowSizeChange,
                )
              }
              onBlur={() => setDraft(null)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">
              Number of prior user turns sent to the classifier provider, excluding tool output and harness reminders.
              LLM and JEV default to 3 turns; JEV sends them to the configured TypeSafe endpoint. Set to 0 to omit
              conversation history. The current message and selected system text are still sent.
            </span>
          </div>
          <div>
            <Label htmlFor={CLASSIFIER_CONTEXT_BUDGET_CHARS_ID} className="block mb-1 font-semibold">
              Бюджет символов контекста
            </Label>
            <Input
              id={CLASSIFIER_CONTEXT_BUDGET_CHARS_ID}
              type="text"
              inputMode="numeric"
              value={
                draft?.id === CLASSIFIER_CONTEXT_BUDGET_CHARS_ID
                  ? draft.raw
                  : String(value.classifier_context_budget_chars ?? DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS)
              }
              onChange={(event) =>
                handleClassifierIntegerChange(
                  CLASSIFIER_CONTEXT_BUDGET_CHARS_ID,
                  event.target.value,
                  0,
                  handleClassifierContextBudgetCharsChange,
                )
              }
              onBlur={() => setDraft(null)}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground">
              Суммарное число символов предыдущего диалога, передаваемых классификатору. Ходы берутся от новых к старым целиком, пока помещаются, поэтому короткий диалог не обрезается.
            </span>
            {contextBudgetQuotesNothing && (
              <span className="block text-xs text-destructive">
                Ниже {MIN_QUOTED_CONTEXT_TURN_CHARS} символов не остаётся места даже на один ход целиком, поэтому
                длинный диалог доходит до классификатора совсем без контекста. Установите размер контекстного окна в 0,
                чтобы намеренно выключить контекст.
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Switch
                checked={value.classifier_context_include_assistant_turns ?? false}
                onCheckedChange={handleClassifierContextIncludeAssistantTurnsChange}
                size="sm"
                aria-label="Включать ходы ассистента"
              />
              <strong className="font-semibold">Включать ходы ассистента</strong>
              <SimpleTooltip content="По умолчанию выключено. Включение меняет решения об уровне (а значит, и расход) у существующего маршрутизатора и отправляет текст ассистента модели-классификатору, которая может быть от другого провайдера.">
                <Info className="size-4 text-muted-foreground" />
              </SimpleTooltip>
            </div>
            <span className="text-xs text-muted-foreground">
              Пусть классификатор видит и ответы ассистента — тогда заметна сложность, названная моделью, а не
              пользователем: план, который ассистент назвал сложным и одобрили словом &quot;да&quot;, классифицируется
              по одобряемой работе. При этом размер контекстного окна считает последние N ходов по обеим ролям, а не
              последние N ходов пользователя.
            </span>
          </div>
        </div>
      )}

      {heuristicScoringRole(value) !== "never" && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <strong className="font-semibold">Пользовательские технические ключевые слова</strong>
            <SimpleTooltip content="Термины предметной области, добавляемые к встроенному списку технических ключевых слов. Промпты с такими терминами получают более высокий балл по техническому измерению и направляются на более мощные модели.">
              <Info className="size-4 text-muted-foreground" />
            </SimpleTooltip>
          </div>
          <span className="block mb-2 text-xs text-muted-foreground">
            Необязательно: добавьте термины к встроенному списку, чтобы точнее классифицировать по техническому измерению (напр. udp, kafka, terraform).
          </span>
          <MultiSelect
            options={(customTechnicalKeywords ?? []).map((keyword) => ({ label: keyword, value: keyword }))}
            value={customTechnicalKeywords ?? []}
            onValueChange={(keywords: string[]) =>
              onCustomTechnicalKeywordsChange?.(
                Array.from(
                  new Set(keywords.flatMap((keyword) => keyword.split(",").map((part) => part.trim())).filter(Boolean)),
                ),
              )
            }
            placeholder="Введите ключевое слово и нажмите Enter"
            emptyText="Введите текст, чтобы добавить ключевое слово"
            allowCustomValues
            className="w-full"
          />
        </div>
      )}

      <HeuristicScoringConfig value={value} onChange={onChange} />

      <HowClassificationWorks value={value} />
    </>
  );
};

export default ClassificationMethodConfig;
