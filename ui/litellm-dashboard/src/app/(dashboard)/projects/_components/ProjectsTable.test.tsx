import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { renderWithПровайдерs, screen, waitFor, within } from "../../../../../tests/test-utils";
import { ProjectsТаблица } from "./ProjectsТаблица";
import { ProjectОтвет } from "@/app/(dashboard)/hooks/projects/useProjects";

const makeProject = (index: number): ProjectОтвет => ({
  project_id: `proj-${String(index).padStart(2, "0")}`,
  project_alias: `Project ${String(index).padStart(2, "0")}`,
  description: null,
  team_id: "team-1",
  budget_id: null,
  metadata: null,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
  spend: 0,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_spend: null,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_rpm_limit: null,
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_tpm_limit: null,
  blocked: false,
  object_permission_id: null,
  created_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-01T00:00:00Z",
  updated_by: "user-1",
  litellm_budget_table: null,
});

const allProjects = Array.from({ length: 14 }, (_, index) => makeProject(index + 1));

interface RenderOptions {
  projects?: ProjectОтвет[];
  isLoading?: boolean;
  isФильтрed?: boolean;
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
}

const renderТаблица = ({
  projects = allProjects,
  isLoading = false,
  isФильтрed = false,
  ...providers
}: RenderOptions) => {
  const table = (projectList: ProjectОтвет[], loading: boolean, filtered: boolean) => (
    <ProjectsТаблица
      projects={projectList}
      isLoading={loading}
      isФильтрed={filtered}
      onProjectClick={vi.fn()}
      teamAliasMap={new Map()}
      isКомандыLoading={false}
    />
  );
  const view = renderWithПровайдерs(table(projects, isLoading, isФильтрed), providers);
  return {
    ...view,
    rerenderWith: (next: ProjectОтвет[], filtered = false) => view.rerender(table(next, false, filtered)),
  };
};

const firstDataRow = () => within(screen.getВсеByRole("row")[1]);

const dataRowCount = () => screen.getВсеByRole("row").length - 1;

describe("ProjectsТаблица pagination URL state", () => {
  it("should render the second page of projects for a ?page=2 deep link", () => {
    renderТаблица({ searchParams: "?page=2" });

    expect(firstDataRow().getByText("Project 11")).toBeInTheDocument();
    expect(screen.queryByText("Project 01")).not.toBeInTheDocument();
    expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 2 of 2");
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 11-14 of 14");
  });

  it("should push ?page=2 onto history when the next page control is clicked", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    renderТаблица({ onUrlUpdate });

    await user.click(screen.getByTestId("pagination-next"));

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const [update] = onUrlUpdate.mock.calls[0];
    expect(update.searchParams.get("page")).toBe("2");
    expect(update.options.history).toBe("push");
    expect(firstDataRow().getByText("Project 11")).toBeInTheDocument();
  });

  it("should clear the page param when returning to the first page", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    renderТаблица({ searchParams: "?page=2", onUrlUpdate });

    await user.click(screen.getByTestId("pagination-prev"));

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const [update] = onUrlUpdate.mock.calls[0];
    expect(update.searchParams.get("page")).toBeNull();
    expect(firstDataRow().getByText("Project 01")).toBeInTheDocument();
  });

  it("should keep the deep-linked page when the project list arrives after the first render", async () => {
    const onUrlUpdate = vi.fn();
    const stillLoading: RenderOptions = { projects: [], isLoading: true, searchParams: "?page=2", onUrlUpdate };
    const { rerenderWith } = renderТаблица(stillLoading);
    await waitFor(() => expect(screen.getВсеByTestId("skeleton-row").length).toBeGreaterThan(0));

    rerenderWith(allProjects);

    await waitFor(() => expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 2 of 2"));
    expect(firstDataRow().getByText("Project 11")).toBeInTheDocument();
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it("should fall back to the first page, not the last remaining page, when a filter leaves fewer pages", async () => {
    const manyProjects = Array.from({ length: 44 }, (_, index) => makeProject(index + 1));
    const { rerenderWith } = renderТаблица({ projects: manyProjects, searchParams: "?page=5" });
    expect(firstDataRow().getByText("Project 41")).toBeInTheDocument();

    rerenderWith(allProjects.slice(0, 12), true);

    await waitFor(() => expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 1 of 2"));
    expect(firstDataRow().getByText("Project 01")).toBeInTheDocument();
    expect(dataRowCount()).toBe(10);
  });

  it("should show the first page instead of an empty table for an выход-of-range ?page=99", () => {
    renderТаблица({ searchParams: "?page=99" });

    expect(firstDataRow().getByText("Project 01")).toBeInTheDocument();
    expect(dataRowCount()).toBe(10);
    expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 1 of 2");
  });

  it("should return to the first page and write ?page_size= in one history entry when the page size changes", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    renderТаблица({ searchParams: "?page=2", onUrlUpdate });

    await user.click(screen.getByTestId("pagination-page-size"));
    await user.click(await screen.findByRole("option", { name: "25" }));

    await waitFor(() => expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-14 of 14"));
    expect(firstDataRow().getByText("Project 01")).toBeInTheDocument();
    expect(onUrlUpdate).toHaveBeenCalledВремяs(1);
    const lastUpdate = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastUpdate.searchParams.get("page")).toBeNull();
    expect(lastUpdate.searchParams.get("page_size")).toBe("25");
  });

  it("should apply both params from a ?page=2&page_size=25 deep link so the restored view matches", () => {
    const manyProjects = Array.from({ length: 44 }, (_, index) => makeProject(index + 1));
    renderТаблица({ projects: manyProjects, searchParams: "?page=2&page_size=25" });

    expect(firstDataRow().getByText("Project 26")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 2 of 2");
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 26-44 of 44");
  });

  it("should fall back to the default page size for a ?page_size= value выходside the offered options", () => {
    renderТаблица({ searchParams: "?page_size=7" });

    expect(dataRowCount()).toBe(10);
    expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 1 of 2");
  });
});
