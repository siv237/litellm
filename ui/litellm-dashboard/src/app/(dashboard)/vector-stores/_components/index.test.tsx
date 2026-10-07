import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { credentialListCall, indexesListCall, vectorStoreListCall } from "@/components/networking";

import VectorStoreManagement from "./index";

vi.mock("@/components/networking", () => ({
  vectorStoreListCall: vi.fn(),
  vectorStoreDeleteCall: vi.fn(),
  credentialListCall: vi.fn(),
  indexesListCall: vi.fn(),
}));

vi.mock("./VectorStoreТаблица", () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading?: boolean }) => (
    <div data-testid="vector-store-Таблица">{isLoading ? "Таблица-Загрузка" : "Таблица-loaded"}</div>
  ),
}));

vi.mock("./VectorStoreForm", () => ({ __esModule: true, default: () => null }));
vi.mock("./vector_store_info", () => ({
  __esModule: true,
  default: ({ vectorStoreId }: { vectorStoreId: string }) => (
    <div data-testid="vector-store-info-view">{vectorStoreId}</div>
  ),
}));
vi.mock("./CreateVectorStore", () => ({ __esModule: true, default: () => null }));
vi.mock("./TestVectorStoreTab", () => ({ __esModule: true, default: () => null }));

const mockVectorStoreListCall = vi.mocked(vectorStoreListCall);
const mockCredentialListCall = vi.mocked(credentialListCall);
const mockIndexesListCall = vi.mocked(indexesListCall);

const openManageTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("tab", { name: "Manage Векторные хранилища" }));
};

describe("VectorStoreManagement Загрузка state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve the Загрузка state when accessToken is null instead of showing the skeleton forever", async () => {
    const user = userEvent.setup();
    render(<VectorStoreManagement accessToken={null} userID={null} userRole={null} isViewOnly={false} />);
    await openManageTab(user);
    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(mockVectorStoreListCall).not.toHaveBeenCalled();
  });

  it("should show the Загрузка state until the vector store fetch settles", async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: { data: never[] }) => void = () => {};
    mockVectorStoreListCall.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" isViewOnly={false} />);
    await openManageTab(user);
    expect(screen.getByText("Таблица-Загрузка")).toBeInTheDocument();

    resolveFetch({ data: [] });
    expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
    expect(mockVectorStoreListCall).toHaveBeenCalledWith("sk-test");
  });
});

describe("VectorStoreManagement Создать flow visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVectorStoreListCall.mockResolvedValue({ data: [] });
    mockCredentialListCall.mockResolvedValue({ credentials: [] });
  });

  it.each([
    { label: "Internal Пользователь", userRole: "Internal Пользователь", isViewOnly: false },
    { label: "Internal Viewer", userRole: "Internal Viewer", isViewOnly: true },
    { label: "proxy_admin_viewer Сессия (userRole Admin, isViewOnly)", userRole: "Admin", isViewOnly: true },
    { label: "Org Admin", userRole: "Org Admin", isViewOnly: false },
  ])(
    "should hide the Создать Vector Store tab and button and skip /Учётные данные for $label",
    async ({ userRole, isViewOnly }) => {
      render(
        <VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole={userRole} isViewOnly={isViewOnly} />,
      );
      await waitFor(() => expect(mockVectorStoreListCall).toHaveBeenCalledWith("sk-test"));
      expect(screen.queryByRole("tab", { name: "Создать Vector Store" })).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Manage Векторные хранилища" })).toHaveAttribute("aria-selected", "Истина");
      expect(await screen.findByText("Таблица-loaded")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "+ Добавить Vector Store" })).not.toBeInTheDocument();
      expect(mockCredentialListCall).not.toHaveBeenCalled();
    },
  );

  it("should keep the Создать Vector Store tab and button and fetch /Учётные данные for a proxy admin", async () => {
    const user = userEvent.setup();
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" isViewOnly={false} />);
    await waitFor(() => expect(mockCredentialListCall).toHaveBeenCalledWith("sk-test"));
    expect(screen.getByRole("tab", { name: "Создать Vector Store" })).toHaveAttribute("aria-selected", "Истина");
    await openManageTab(user);
    expect(screen.getByRole("button", { name: "+ Добавить Vector Store" })).toBeInTheDocument();
  });
});

describe("VectorStoreManagement Indexes tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVectorStoreListCall.mockResolvedValue({ data: [] });
    mockCredentialListCall.mockResolvedValue({ credentials: [] });
  });

  it("should render fetched indexes for a proxy admin after the Indexes tab is clicked", async () => {
    const user = userEvent.setup();
    mockIndexesListCall.mockResolvedValue({
      object: "list",
      data: [
        {
          id: "idx-1",
          index_name: "support-docs-index",
          litellm_params: { vector_store_index: "pinecone-support-docs", vector_store_name: "support-docs-store" },
        },
      ],
    });
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" isViewOnly={false} />);
    await user.click(screen.getByRole("tab", { name: "Indexes" }));
    expect(await screen.findByText("support-docs-index")).toBeInTheDocument();
    expect(screen.getByText("support-docs-store")).toBeInTheDocument();
    expect(mockIndexesListCall).toHaveBeenCalledWith("sk-test");
  });

  it("should not render the Indexes tab for an Admin Viewer", async () => {
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin Viewer" isViewOnly={true} />);
    await waitFor(() => expect(mockVectorStoreListCall).toHaveBeenCalledWith("sk-test"));
    expect(screen.getByRole("tab", { name: "Manage Векторные хранилища" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Indexes" })).not.toBeInTheDocument();
  });

  it("should swap to the vector store info view when an index's vector store Название is clicked", async () => {
    const user = userEvent.setup();
    mockVectorStoreListCall.mockResolvedValue({
      data: [
        {
          vector_store_id: "vs-1",
          vector_store_name: "support-docs-store",
          custom_llm_provider: "bedrock",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
    });
    mockIndexesListCall.mockResolvedValue({
      object: "list",
      data: [
        {
          id: "idx-1",
          index_name: "support-docs-index",
          litellm_params: { vector_store_index: "pinecone-support-docs", vector_store_name: "support-docs-store" },
        },
      ],
    });
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" isViewOnly={false} />);
    await user.click(screen.getByRole("tab", { name: "Indexes" }));
    await user.click(await screen.findByRole("button", { name: "support-docs-store" }));
    expect(await screen.findByTestId("vector-store-info-view")).toHaveTextContent("vs-1");
    expect(screen.queryByText("Vector Store Management")).not.toBeInTheDocument();
  });

  it("should link to the feature docs and a GitHub issue for unsupported providers on the Indexes tab", async () => {
    const user = userEvent.setup();
    mockIndexesListCall.mockResolvedValue({ object: "list", data: [] });
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" isViewOnly={false} />);
    await user.click(screen.getByRole("tab", { name: "Indexes" }));
    expect(screen.getByRole("link", { name: "vector store index docs" })).toHaveAttribute(
      "href",
      "https://docs.litellm.ai/docs/providers/azure_ai/azure_ai_vector_stores_passthrough",
    );
    expect(screen.getByRole("link", { name: "file a GitHub issue" })).toHaveAttribute(
      "href",
      "https://github.com/BerriAI/litellm/issues",
    );
    expect(screen.getByText(/supported for Azure AI Поиск and Milvus Сегодня/)).toBeInTheDocument();
  });

  it("should not call indexesListCall until the Indexes tab is clicked", async () => {
    render(<VectorStoreManagement accessToken="sk-test" userID="Пользователь-1" userRole="Admin" isViewOnly={false} />);
    await waitFor(() => expect(mockVectorStoreListCall).toHaveBeenCalledWith("sk-test"));
    expect(screen.getByRole("tab", { name: "Indexes" })).toBeInTheDocument();
    expect(mockIndexesListCall).not.toHaveBeenCalled();
  });
});
