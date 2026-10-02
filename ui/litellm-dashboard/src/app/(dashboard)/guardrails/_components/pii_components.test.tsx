import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { КатегорияФильтр, QuickДействия, PiiEntityList } from "./pii_components";
import type { PiiEntityКатегория } from "@/components/гардрейловs/types";

describe("КатегорияФильтр", () => {
  it("should render", () => {
    const emptyКатегории: PiiEntityКатегория[] = [];
    render(<КатегорияФильтр categories={emptyКатегории} selectedКатегории={[]} onChange={() => {}} />);
    expect(screen.getByText("Фильтр по категории")).toBeInTheDocument();
  });
});

describe("QuickДействия", () => {
  it("should render", () => {
    render(<QuickДействия onВыбратьВсе={() => {}} onUnselectВсе={() => {}} hasSelectedEntities={false} />);
    expect(screen.getByText("Быстрые действия")).toBeInTheDocument();
  });
});

describe("PiiEntityList", () => {
  it("should render", () => {
    render(
      <PiiEntityList
        entities={[]}
        selectedEntities={[]}
        selectedДействия={{}}
        actions={[]}
        onEntityВыбрать={() => {}}
        onДействиеВыбрать={() => {}}
        entityToCategoryMap={new Map()}
      />,
    );
    expect(screen.getByText("Ни один тип PII не подходит под фильтр")).toBeInTheDocument();
  });
});
