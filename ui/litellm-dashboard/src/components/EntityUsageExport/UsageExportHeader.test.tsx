import { renderWithПровайдерs, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ИспользованиеExportHeader from "./ИспользованиеExportHeader";
import type { EntityРасходData } from "./types";

vi.mock("./EntityИспользованиеExportModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="export-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const defaultProps = {
  dateЗначение: { from: new Date("2025-01-01"), to: new Date("2025-01-31") },
  entityType: "team" as const,
  spendData: {
    results: [],
    metadata: {
      total_spend: 0,
      total_api_requests: 0,
      total_successful_requests: 0,
      total_failed_requests: 0,
      total_tokens: 0,
    },
  } satisfies EntityРасходData,
};

describe("ИспользованиеExportHeader", () => {
  it("should render", () => {
    renderWithПровайдерs(<ИспользованиеExportHeader {...defaultProps} />);
    expect(screen.getByRole("button", { name: /export data/i })).toBeInTheDocument();
  });

  it("should open the export modal when the export button is clicked", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<ИспользованиеExportHeader {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /export data/i }));
    expect(screen.getByTestId("export-modal")).toBeInTheDocument();
  });

  it("should close the export modal when onClose is called", async () => {
    const user = userEvent.setup();
    renderWithПровайдерs(<ИспользованиеExportHeader {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /export data/i }));
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByTestId("export-modal")).not.toBeInTheDocument();
  });

  it("should not show filter dropdown when showФильтры is false", () => {
    renderWithПровайдерs(<ИспользованиеExportHeader {...defaultProps} showФильтры={false} />);
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument();
  });

  it("should show filter dropdown when showФильтры is true and options provided", () => {
    renderWithПровайдерs(
      <ИспользованиеExportHeader
        {...defaultProps}
        showФильтры
        filterLabel="Team"
        filterPlaceholder="Выбрать teams"
        filterOptions={[
          { label: "Team A", value: "team-a" },
          { label: "Team B", value: "team-b" },
        ]}
        onФильтрыChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Team")).toBeInTheDocument();
  });

  it("should render a caller-supplied filter and its label withвыход any built-in options", () => {
    renderWithПровайдерs(
      <ИспользованиеExportHeader
        {...defaultProps}
        filterLabel="Фильтр by user"
        filterSlot={<div data-testid="custom-filter" />}
      />,
    );

    expect(screen.getByText("Фильтр by user")).toBeInTheDocument();
    expect(screen.getByTestId("custom-filter")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("should keep the filter visible and disabled with an explanation when the caller has no options", () => {
    renderWithПровайдерs(
      <ИспользованиеExportHeader
        {...defaultProps}
        entityType="tag"
        showФильтры
        filterLabel="Фильтр by tag"
        filterPlaceholder="Выбрать tag to filter..."
        filterOptions={[]}
        onФильтрыChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Фильтр by tag")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("No tags with usage in this range");
    expect(input).toBeDisabled();
    expect(screen.queryByPlaceholderText("Выбрать tag to filter...")).not.toBeInTheDocument();
  });

  it("should stay usable when a carried-over selection выходlives its options", async () => {
    const user = userEvent.setup();
    const onФильтрыChange = vi.fn();
    renderWithПровайдерs(
      <ИспользованиеExportHeader
        {...defaultProps}
        entityType="tag"
        showФильтры
        filterLabel="Фильтр by tag"
        filterPlaceholder="Выбрать tag to filter..."
        filterOptions={[]}
        selectedФильтры={["prod"]}
        onФильтрыChange={onФильтрыChange}
      />,
    );

    expect(screen.getByPlaceholderText("No tags with usage in this range")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Clear Фильтр by tag" }));
    expect(onФильтрыChange).toHaveBeenCalledWith([]);
  });

  it("should leave the filter enabled with its normal placeholder when options exist", () => {
    renderWithПровайдерs(
      <ИспользованиеExportHeader
        {...defaultProps}
        entityType="tag"
        showФильтры
        filterLabel="Фильтр by tag"
        filterPlaceholder="Выбрать tag to filter..."
        filterOptions={[{ label: "prod", value: "prod" }]}
        onФильтрыChange={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Выбрать tag to filter...");
    expect(input).toBeEnabled();
    expect(screen.queryByPlaceholderText("No tags with usage in this range")).not.toBeInTheDocument();
  });
});
