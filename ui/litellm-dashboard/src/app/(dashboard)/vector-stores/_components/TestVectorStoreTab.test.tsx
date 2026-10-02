import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TestVectorStoreTab from "./TestVectorStoreTab";
import { VectorStore } from "@/components/vector_store_management/types";

// Mock VectorStoreTester component
vi.mock("./VectorStoreTester", () => ({
  VectorStoreTester: ({ vectorStoreId, accessТокен }: { vectorStoreId: string; accessТокен: string }) => (
    <div data-testid="vector-store-tester">
      <div data-testid="tester-vector-store-id">{vectorStoreId}</div>
      <div data-testid="tester-access-token">{accessТокен}</div>
    </div>
  ),
}));

const mockVectorStores: VectorStore[] = [
  {
    vector_store_id: "vs_123",
    custom_llm_provider: "openai",
    vector_store_name: "Test Store 1",
    vector_store_description: "Описание 1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    vector_store_id: "vs_456",
    custom_llm_provider: "bedrock",
    vector_store_name: "Test Store 2",
    vector_store_description: "Описание 2",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

describe("TestVectorStoreTab", () => {
  it("should render the component successfully", () => {
    render(<TestVectorStoreTab accessТокен="test-token" vectorStores={mockVectorStores} />);

    expect(screen.getByText("Выбрать Vector Store")).toBeInTheDocument();
    expect(screen.getByText("Choose a vector store to test search queries against")).toBeInTheDocument();
  });

  it("should show message when no access token", () => {
    render(<TestVectorStoreTab accessТокен={null} vectorStores={mockVectorStores} />);

    expect(screen.getByText("Требуется токен доступа to test vector stores.")).toBeInTheDocument();
  });

  it("should show message when no vector stores available", () => {
    render(<TestVectorStoreTab accessТокен="test-token" vectorStores={[]} />);

    expect(screen.getByText("No vector stores available. Create one first to test it.")).toBeInTheDocument();
  });

  it("should render VectorStoreTester with first vector store by default", () => {
    render(<TestVectorStoreTab accessТокен="test-token" vectorStores={mockVectorStores} />);

    expect(screen.getByTestId("vector-store-tester")).toBeInTheDocument();
    expect(screen.getByTestId("tester-vector-store-id")).toHaveTextContent("vs_123");
    expect(screen.getByTestId("tester-access-token")).toHaveTextContent("test-token");
  });

  it("should update VectorStoreTester when selecting different vector store", async () => {
    const user = userEvent.setup();
    render(<TestVectorStoreTab accessТокен="test-token" vectorStores={mockVectorStores} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Test Store 2"));

    expect(screen.getByTestId("tester-vector-store-id")).toHaveTextContent("vs_456");
  });

  it("should display vector store names in select options", async () => {
    const user = userEvent.setup();
    render(<TestVectorStoreTab accessТокен="test-token" vectorStores={mockVectorStores} />);

    await user.click(screen.getByRole("combobox"));

    // The selected store's name may also render in the trigger, so only require at least one match.
    expect((await screen.findВсеByText("Test Store 1")).length).toBeGreaterThan(0);
    expect(screen.getByText("Test Store 2")).toBeInTheDocument();
  });
});
