import React, { useState, useMemo } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HowItWorks: React.FC = () => {
  const [responseCost, setResponseCost] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  const calculatedDiscount = useMemo(() => {
    const cost = parseFloat(responseCost);
    const discount = parseFloat(discountAmount);
    const hasInvalidCost = isNaN(cost) || cost === 0;
    const hasInvalidDiscount = isNaN(discount) || discount === 0;

    if (hasInvalidCost || hasInvalidDiscount) {
      return null;
    }

    const originalCost = cost + discount;
    const discountPercentage = (discount / originalCost) * 100;

    return {
      originalCost: originalCost.toFixed(10),
      finalCost: cost.toFixed(10),
      discountAmount: discount.toFixed(10),
      discountPercentage: discountPercentage.toFixed(2),
    };
  }, [responseCost, discountAmount]);

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">Расчёт стоимости</h3>
        <p className="text-xs text-muted-foreground">
          Скидки применяются к стоимости провайдера:{" "}
          <code className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-foreground">
            final_cost = base_cost × (1 - discount%/100)
          </code>
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">Пример</h3>
        <p className="text-xs text-muted-foreground">
          Скидка 5% на запрос $10,00: $10,00 × (1 - 0,05) = $9,50
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">Допустимый диапазон</h3>
        <p className="text-xs text-muted-foreground">Процент скидки — от 0% до 100%</p>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">Проверка скидок</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Сделайте тестовый запрос и проверьте заголовки ответа — скидки виднplied:
        </p>
        <CodeBlock
          language="bash"
          code={`curl -X POST -i http://your-proxy:4000/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-1234" \\
  -d '{
    "model": "gemini/gemini-2.5-pro",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}
        />
        <p className="mb-2 mt-3 text-xs text-muted-foreground">Ищите в ответе эти заголовки:</p>
        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <code className="whitespace-nowrap rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
              x-litellm-response-cost
            </code>
            <p className="text-xs text-muted-foreground">Итоговая стоимость после скидки</p>
          </div>
          <div className="flex items-start gap-3">
            <code className="whitespace-nowrap rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
              x-litellm-response-cost-original
            </code>
            <p className="text-xs text-muted-foreground">Исходная стоимость до скидки</p>
          </div>
          <div className="flex items-start gap-3">
            <code className="whitespace-nowrap rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
              x-litellm-response-cost-discount-amount
            </code>
            <p className="text-xs text-muted-foreground">Размер скидки</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Калькулятор скидки</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Введите значения из заголовков ответа, чтобы проверить скидку:
        </p>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="response-cost" className="mb-1 block text-xs">
              Стоимость ответа (x-litellm-response-cost)
            </Label>
            <Input
              id="response-cost"
              placeholder="0.0171938125"
              value={responseCost}
              onChange={(event) => setResponseCost(event.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="discount-amount" className="mb-1 block text-xs">
              Сумма скидки (x-litellm-response-cost-discount-amount)
            </Label>
            <Input
              id="discount-amount"
              placeholder="0.0009049375"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {calculatedDiscount && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Расчётный результат</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Исходная стоимость:</p>
                <code className="font-mono text-xs text-foreground">${calculatedDiscount.originalCost}</code>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Итоговая стоимость:</p>
                <code className="font-mono text-xs text-foreground">${calculatedDiscount.finalCost}</code>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Сумма скидки:</p>
                <code className="font-mono text-xs text-foreground">${calculatedDiscount.discountAmount}</code>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <p className="text-xs font-semibold text-foreground">Скидка применена:</p>
                <p className="text-sm font-bold text-foreground">{calculatedDiscount.discountPercentage}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorks;
