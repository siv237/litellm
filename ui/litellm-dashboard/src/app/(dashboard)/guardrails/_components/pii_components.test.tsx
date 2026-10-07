import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryFilter, QuickActions, PiiEntityList } from "./pii_components";
import type { PiiEntityCategory } from "@/components/guardrails/types";

describe("CategoryFilter", () => {
  it("should render", () => {
    const emptyCategories: PiiEntityCategory[] = [];
    render(<CategoryFilter categories={emptyCategories} selectedCategories={[]} onChange={() => {}} />);
    expect(screen.getByText("Фильтр по категории")).toBeInTheDocument();
  });
});

describe("QuickДействиеs", () => {
  it("should render", () => {
    render(<QuickActions onSelectAll={() => {}} onUnselectAll={() => {}} hasSelectedEntities={false} />);
    expect(screen.getByText("Быстрые действия")).toBeInTheDocument();
  });
});

describe("PiiEntityList", () => {
  it("should render", () => {
    render(
      <PiiEntityList
        entities={[]}
        selectedEntities={[]}
        selectedActions={{}}
        actions={[]}
        onEntitySelect={() => {}}
        onActionSelect={() => {}}
        entityToCategoryMap={new Map()}
      />,
    );
    expect(screen.getByText("Ни один тип PII не подходит под фильтр")).toBeInTheDocument();
  });
});
