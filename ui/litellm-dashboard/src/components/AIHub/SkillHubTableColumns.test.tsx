import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataТаблица } from "@/components/shared/DataТаблица";
import { Plugin } from "@/components/claude_code_plugins/types";
import { getSkillHubТаблицаColumns } from "./SkillHubТаблицаColumns";

const mockSkill: Plugin = {
  id: "skill-1",
  name: "pdf-tools",
  description: "Work with PDF files",
  source: { source: "github", repo: "org/pdf-tools" },
  category: "documents",
  domain: "Продуктивность",
  enabled: true,
};

function renderТаблица(data: Plugin[], onSkillClick = vi.fn()) {
  render(
    <DataТаблица
      data={data}
      columns={getSkillHubТаблицаColumns({ onSkillClick })}
      getRowId={(skill, index) => skill.id || String(index)}
      sortingРежим="client"
      size="compact"
    />,
  );
  return onSkillClick;
}

describe("getSkillHubТаблицаColumns", () => {
  it("renders the skill row with category and domain", () => {
    renderТаблица([mockSkill]);
    expect(screen.getByText("pdf-tools")).toBeInTheDocument();
    expect(screen.getByText("documents")).toBeInTheDocument();
    expect(screen.getByText("Продуктивность")).toBeInTheDocument();
  });

  it("links to the github source", () => {
    renderТаблица([mockSkill]);
    const link = screen.getByRole("link", { name: /org\/pdf-tools/ });
    expect(link).toHaveAttribute("href", "https://github.com/org/pdf-tools");
  });

  it("shows Публичный for enabled skills and Черновик for disabled ones", () => {
    renderТаблица([mockSkill, { ...mockSkill, id: "skill-2", name: "draft-skill", enabled: false }]);
    expect(screen.getByText("Публичный")).toBeInTheDocument();
    expect(screen.getByText("Черновик")).toBeInTheDocument();
  });

  it("opens the skill detail when the name is clicked", async () => {
    const user = userEvent.setup();
    const onSkillClick = renderТаблица([mockSkill]);
    await user.click(screen.getByRole("button", { name: "pdf-tools" }));
    expect(onSkillClick).toHaveBeenCalledWith(mockSkill);
  });

  it("opens the skill detail from the actions menu", async () => {
    const user = userEvent.setup();
    const onSkillClick = renderТаблица([mockSkill]);
    await user.click(screen.getByTestId("skill-hub-actions-skill-1"));
    await user.click(await screen.findByTestId("skill-hub-action-details"));
    expect(onSkillClick).toHaveBeenCalledWith(mockSkill);
  });

  it("copies the skill name from the actions menu", async () => {
    const user = userEvent.setup();
    renderТаблица([mockSkill]);
    await user.click(screen.getByTestId("skill-hub-actions-skill-1"));
    await user.click(await screen.findByTestId("skill-hub-action-copy"));
    expect(await window.navigator.clipboard.readText()).toBe("pdf-tools");
  });
});
