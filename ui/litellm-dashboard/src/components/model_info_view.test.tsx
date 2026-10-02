import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import РежимlInfoView from "./Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info_view";
import { toast } from "@/lib/toast";
import * as networking from "./networking";
vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../tests/mocks/complexityWeightrDefaults"),
);

vi.mock("../../utils/dataUtils", () => ({
  copyToClipboard: vi.fn().mockResolvedЗначение(true),
}));

vi.mock("./networking", () => ({
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoV1Call: vi.fn(),
  credentialGetCall: vi.fn(),
  credentialListCall: vi.fn(),
  getGuardrailsList: vi.fn(),
  tagListCall: vi.fn(),
  testПодключениеЗапрос: vi.fn(),
  testModelGroupПодключение: vi.fn(),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюPatchUpdateCall: vi.fn(),
  Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюDeleteCall: vi.fn(),
  credentialCreateCall: vi.fn(),
  vectorStoreListCall: vi.fn(),
}));

const mockUseModelsInfo = vi.fn();
const mockUseModelHub = vi.fn();

vi.mock("@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useModels", () => ({
  useModelsInfo: (...args: any[]) => mockUseModelsInfo(...args),
  useModelHub: (...args: any[]) => mockUseModelHub(...args),
}));

const mockUseModelCostMap = vi.fn();
vi.mock("@/app/(dashboard)/hooks/Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs/useModelCostMap", () => ({
  useModelCostMap: (...args: any[]) => mockUseModelCostMap(...args),
}));

const mockUsePtuCostAttributionEnabled = vi.fn();
vi.mock("@/app/(dashboard)/hooks/uiSettings/usePtuCostAttributionEnabled", () => ({
  usePtuCostAttributionEnabled: () => mockUsePtuCostAttributionEnabled(),
}));

const mockToast = vi.mocked(toast);
const mockModelInfoV1Call = vi.mocked(networking.modelInfoV1Call);
const mockCredentialGetCall = vi.mocked(networking.credentialGetCall);
const mockCredentialListCall = vi.mocked(networking.credentialListCall);
const mockGetGuardrailsList = vi.mocked(networking.getGuardrailsList);
const mockTagListCall = vi.mocked(networking.tagListCall);
const mockTestПодключениеЗапрос = vi.mocked(networking.testПодключениеЗапрос);
const mockTestModelGroupПодключение = vi.mocked(networking.testModelGroupПодключение);
const mockModelPatchUpdateCall = vi.mocked(networking.modelPatchUpdateCall);
const mockModelDeleteCall = vi.mocked(networking.modelDeleteCall);
const mockCredentialCreateCall = vi.mocked(networking.credentialCreateCall);
const mockVectorStoreListCall = vi.mocked(networking.vectorStoreListCall);

describe("РежимlInfoView", () => {
  let queryClient: ЗапросClient;

  const defaultModelData = {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "GPT-4",
    litellm_params: {
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
      api_base: "https://api.openai.com/v1",
      custom_llm_provider: "openai",
      litellm_credential_name: "selected-credential",
    },
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
      id: "123",
      created_by: "123",
      created_at: "2024-01-01T00:00:00Z",
      db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true,
      input_cost_per_token: 0.00003,
      выходput_cost_per_token: 0.00006,
    },
  };

  const DEFAULT_ADMIN_PROPS = {
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюId: "123",
    onClose: vi.fn(),
    accessТокен: "test-token",
    userID: "123",
    userRole: "Admin",
    isViewOnly: false,
    onModelUpdate: vi.fn(),
    Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюAccessGroups: ["group1", "group2"],
  };

  beforeEach(() => {
    queryClient = new ЗапросClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    mockUsePtuCostAttributionEnabled.mockReturnЗначение(false);

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [defaultModelData],
      },
      isLoading: false,
      error: null,
    });

    mockUseModelHub.mockReturnЗначение({
      data: {
        data: [],
      },
      isLoading: false,
      error: null,
    });

    mockUseModelCostMap.mockReturnЗначение({
      data: {},
      isLoading: false,
      error: null,
    });

    mockModelInfoV1Call.mockResolvedЗначение({
      data: [defaultModelData],
    });

    mockCredentialGetCall.mockResolvedЗначение({
      credential_name: "test-credential",
      credential_values: {},
      credential_info: {},
    });
    mockCredentialListCall.mockResolvedЗначение({
      credentials: [
        {
          credential_name: "selected-credential",
          credential_values: {},
          credential_info: {},
        },
      ],
    });

    mockGetGuardrailsList.mockResolvedЗначение({
      гардрейловs: [{ гардрейлов_name: "content_filter" }, { гардрейлов_name: "toxicity_filter" }],
    });

    mockTagListCall.mockResolvedЗначение({
      test_tag: {
        name: "test_tag",
        description: "A test tag",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      production_tag: {
        name: "production_tag",
        description: "Продакшен ready Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs",
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    });

    mockTestПодключениеЗапрос.mockResolvedЗначение({
      status: "success",
    });

    mockVectorStoreListCall.mockResolvedЗначение({
      data: [
        { vector_store_id: "vs-alpha", vector_store_name: "Alpha" },
        { vector_store_id: "vs-beta", vector_store_name: "Бета" },
      ],
    } as never);
    mockModelPatchUpdateCall.mockResolvedЗначение({});
    mockModelDeleteCall.mockResolvedЗначение({});
    mockCredentialCreateCall.mockResolvedЗначение({});
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ЗапросClientПровайдер, { client: queryClient }, children);

  it("should render", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
    });
  });

  it("should display loading state when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию data is loading", () => {
    mockUseModelsInfo.mockReturnЗначение({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    expect(screen.getByText("Загрузка…")).toBeInTheDocument();
  });

  it("should display not found message when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию data is not available", async () => {
    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Модель не найдена")).toBeInTheDocument();
    });
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name in the header", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Публичное название модели:/)).toBeInTheDocument();
    });
  });

  it("should display back button that calls onClose when clicked", async () => {
    const mockOnClose = vi.fn();
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} onClose={mockOnClose} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /назад к моделям/i });
    await user.click(backButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should display test connection button", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /test connection/i })).toBeInTheDocument();
    });
  });

  it("should test connection when test connection button is clicked", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
    });

    const testButton = screen.getByRole("button", { name: /test connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(mockTestПодключениеЗапрос).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith("Тест подключения успешен!");
    });
  });

  it("should pass Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info.id to disambiguate duplicate Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name deployments", async () => {
    // Regression test: when two deployments share `Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name` (e.g.
    // wildcard `openai/*` with different `api_base` values), the UI
    // must forward the clicked row's `Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info.id` to the backend.
    // Otherwise /health/test_connection silently probes deployments[0]
    // instead of the deployment the user actually selected.
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
    });

    const testButton = screen.getByRole("button", { name: /test connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(mockTestПодключениеЗапрос).toHaveBeenCalled();
    });

    const callArgs = mockTestПодключениеЗапрос.mock.calls[0];
    // Signature: (accessТокен, litellm_params, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info, mode)
    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoArg = callArgs[2] as Record<string, unknown>;
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoArg).toBeDefined();
    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfoArg.id).toBe("123");
  });

  it("should display error notification when connection test fails", async () => {
    const user = userEvent.setup();
    mockTestПодключениеЗапрос.mockRejectedЗначение(new Ошибка("Подключение failed"));

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
    });

    const testButton = screen.getByRole("button", { name: /test connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it("should display reuse credentials button for admin users", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /re-use credentials/i })).toBeInTheDocument();
    });
  });

  it("should disable reuse credentials button for non-admin users", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} userRole="User" />, { wrapper });
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /re-use credentials/i });
      expect(button).toBeDisabled();
    });
  });

  it("should display delete Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию button", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /delete Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i })).toBeInTheDocument();
    });
  });

  // A proxy_admin_viewer session reads "Admin" through effectiveSessionRole, but the update
  // and delete endpoints 403 it, so the write buttons must not be offered.
  it("should disable delete and update buttons for a view-only admin session", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} isViewOnly={true} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-button")).toBeDisabled();
    });
    expect(screen.getByTestId("update-api-key-button")).toBeDisabled();
  });

  it("should disable delete button when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is not a DB Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    const nonDbModelData = {
      ...defaultModelData,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
        ...defaultModelData.model_info,
        db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: false,
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [nonDbModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      const deleteButton = screen.getByRole("button", { name: /delete Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  it("should disable delete button when user is not admin and did not create the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    const nonCreatedByUserModelData = {
      ...defaultModelData,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
        ...defaultModelData.model_info,
        created_by: "456",
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [nonCreatedByUserModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} userRole="User" />, { wrapper });
    await waitFor(() => {
      const deleteButton = screen.getByRole("button", { name: /delete Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  it("should display overview and raw JSON tabs", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /raw json/i })).toBeInTheDocument();
    });
  });

  it("keeps the edit form and its touched fields alive across a tab switch", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await user.click(await screen.findByRole("button", { name: /редактировать настройки/i }));
    const costВход = screen.getByPlaceholderText("Введите стоимость входных токенов") as HTMLInElement;
    await user.clear(costВход);
    await user.type(costВход, "5");

    await user.click(screen.getByRole("tab", { name: /raw json/i }));
    await user.click(screen.getByRole("tab", { name: /overview/i }));

    expect(screen.getByPlaceholderText("Введите стоимость входных токенов")).toBe(costВход);
    expect(Number(costВход.value)).toBe(5);
    await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalled();
    });
    expect(mockModelPatchUpdateCall.mock.calls[0][1].litellm_params.input_cost_per_token).toBeCloseTo(5 / 1_000_000);
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию information in overview tab", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Провайдер")).toBeInTheDocument();
      expect(screen.getByText("Модель LiteLLM")).toBeInTheDocument();
      expect(screen.getByText("Цены")).toBeInTheDocument();
    });
  });

  it("should display edit settings button when user can edit Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });
  });

  it("should not display edit settings button when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is not a DB Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
    const nonDbModelData = {
      ...defaultModelData,
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
        ...defaultModelData.model_info,
        db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: false,
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [nonDbModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /редактировать настройки/i })).not.toBeInTheDocument();
    });
  });

  it("should enter edit mode when edit settings button is clicked", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /редактировать настройки/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /отмена/i })).toBeInTheDocument();
    });
  });

  it("should display form fields in edit mode", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /редактировать настройки/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Введите название модели")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Введите название модели LiteLLM")).toBeInTheDocument();
    });
  });

  it("should allow editing Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию name in edit mode", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /редактировать настройки/i });
    await user.click(editButton);

    const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюNameВход = await screen.findByPlaceholderText("Введите название модели");
    await user.clear(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюNameВход);
    fireEvent.change(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюNameВход, { target: { value: "Обновлён Название модели" } });

    expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюNameВход).toHaveЗначение("Обновлён Название модели");
  });

  it("should cancel editing when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /редактировать настройки/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /отмена/i })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /отмена/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /сохранить изменения/i })).not.toBeInTheDocument();
    });
  });

  it("should save Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию changes when save button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnModelUpdate = vi.fn();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} onModelUpdate={mockOnModelUpdate} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /редактировать настройки/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /сохранить изменения/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith("Настройки модели обновлены");
      expect(mockOnModelUpdate).toHaveBeenCalled();
    });
  });

  it("should display tags section", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Теги")).toBeInTheDocument();
    });
  });

  it("should display LiteLLM Params section", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Параметры LiteLLM")).toBeInTheDocument();
    });
  });

  it("should show existing credentials field in edit mode", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

    await waitFor(() => {
      expect(screen.getByText("Существующие учётные данные")).toBeInTheDocument();
    });
  });

  it("should keep selector credential and ignore litellm_credential_name from LiteLLM Params json", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

    const litellmParamsВход = screen
      .getAllByRole("textbox")
      .find(
        (input) =>
          input.tagName === "TEXTAREA" && (input as HTMLTextAreaElement).value.includes('"custom_llm_provider"'),
      );
    expect(litellmParamsВход).toBeDefined();
    if (!litellmParamsВход) {
      return;
    }
    expect((litellmParamsВход as HTMLTextAreaElement).value).not.toContain("litellm_credential_name");
    await user.clear(litellmParamsВход);
    await user.paste(`{"litellm_credential_name":"from-json","timeвыход":42}`);

    await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalled();
    });

    const updatePayload = mockModelPatchUpdateCall.mock.calls[0][1];
    expect(updatePayload.litellm_params.litellm_credential_name).toBe("selected-credential");
    expect(updatePayload.litellm_params.litellm_credential_name).not.toBe("from-json");
  });

  it("should not include vector_store_ids in update payload when Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию has none", async () => {
    // Regression: editing a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию withвыход vector stores used to inject
    // vector_store_ids: [] into litellm_params, which then propagated to
    // inference requests and broke Anthropic calls.
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalled();
    });

    const updatePayload = mockModelPatchUpdateCall.mock.calls[0][1];
    expect(updatePayload.litellm_params).not.toHaveСвойство("vector_store_ids");
  });

  describe("PTU cost attribution gate", () => {
    const ptuModelData = {
      ...defaultModelData,
      // Zero per-token pricing is what the backend stores for a PTU deployment, since the flat
      // cost of its reserved capacity already covers the traffic that capacity serves.
      litellm_params: { ...defaultModelData.litellm_params, input_cost_per_token: 0, выходput_cost_per_token: 0 },
      Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
        ...defaultModelData.model_info,
        team_id: "team-1",
        input_cost_per_token: 0,
        выходput_cost_per_token: 0,
        ptu_count: 15,
        cost_per_ptu_per_hour: 2,
        ptu_effective_from: "2026-07-01T00:00:00+00:00",
        ptu_effective_to: "2026-08-01T00:00:00+00:00",
      },
    };

    const renderWithPtuModel = () => {
      mockUseModelsInfo.mockReturnЗначение({ data: { data: [ptuModelData] }, isLoading: false, error: null });
      mockModelInfoV1Call.mockResolvedЗначение({ data: [ptuModelData] });
      return render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    };

    it("hides the PTU fields when disabled, even for a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию that already stores PTU config", async () => {
      renderWithPtuModel();

      await waitFor(() => {
        expect(screen.getByText("Настройки модели")).toBeInTheDocument();
      });

      expect(screen.queryByText("Количество PTU")).not.toBeInTheDocument();
      expect(screen.queryByText("Стоимость PTU / час (USD)")).not.toBeInTheDocument();
      expect(screen.queryByText("PTU действует с (UTC)")).not.toBeInTheDocument();
      expect(screen.queryByText("PTU действует по (UTC)")).not.toBeInTheDocument();
    });

    it("shows the PTU fields when enabled", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      renderWithPtuModel();

      await waitFor(() => {
        expect(screen.getByText("Количество PTU")).toBeInTheDocument();
      });
      expect(screen.getByText("Стоимость PTU / час (USD)")).toBeInTheDocument();
      expect(screen.getByText("PTU действует с (UTC)")).toBeInTheDocument();
      expect(screen.getByText("PTU действует по (UTC)")).toBeInTheDocument();
    });

    it("omits PTU fields from the save payload when disabled, so an unrelated edit cannot clear stored config", async () => {
      const user = userEvent.setup();
      renderWithPtuModel();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() => {
        expect(mockModelPatchUpdateCall).toHaveBeenCalled();
      });

      const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo = mockModelPatchUpdateCall.mock.calls[0][1].model_info;
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo).not.toHaveСвойство("ptu_count");
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo).not.toHaveСвойство("cost_per_ptu_per_hour");
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo).not.toHaveСвойство("ptu_effective_from");
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo).not.toHaveСвойство("ptu_effective_to");
    });

    it("shows a zeroed PTU price as 0.0000 rather than Not Set", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      renderWithPtuModel();

      await waitFor(() => {
        expect(screen.getByText("Стоимость входных токенов (за 1 млн)")).toBeInTheDocument();
      });
      for (const label of ["Стоимость входных токенов (за 1 млн)", "Стоимость выходных токенов (за 1 млн)"]) {
        expect(screen.getByText(label).parentElement).toHaveTextContent("0.0000");
      }
    });

    it("blocks the save once the operator types a non-zero per-token cost alongside PTU config", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      const user = userEvent.setup();
      renderWithPtuModel();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Введите стоимость входных токенов")).toBeInTheDocument();
      });
      await user.clear(screen.getByPlaceholderText("Введите стоимость входных токенов"));
      fireEvent.change(screen.getByPlaceholderText("Введите стоимость входных токенов"), { target: { value: "2.5" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() => {
        expect(screen.getByText(/тарифицируется по зарезервированной мощности/i)).toBeInTheDocument();
      });
      expect(mockModelPatchUpdateCall).not.toHaveBeenCalled();
    });

    it("lets the operator put a cost-map-priced deployment on PTU withвыход clearing the seeded rate", async () => {
      // A rate the form seeded from /Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/info is the server's own, so refusing it blocked
      // every attempt to enable PTU from the dashboard.
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      const seededModel = {
        ...defaultModelData,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { ...defaultModelData.model_info, team_id: "team-1", input_cost_per_token: 0.0000003 },
      };
      mockUseModelsInfo.mockReturnЗначение({ data: { data: [seededModel] }, isLoading: false, error: null });
      mockModelInfoV1Call.mockResolvedЗначение({ data: [seededModel] });
      const user = userEvent.setup();
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("напр. 15")).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText("напр. 15"), { target: { value: "15" } });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() => {
        expect(screen.queryByText(/тарифицируется по зарезервированной мощности/i)).not.toBeInTheDocument();
      });
    });

    const enterPtuEdit = async (user: ReturnType<typeof userEvent.setup>) => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      renderWithPtuModel();
      expect(await screen.findByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));
      expect(await screen.findByPlaceholderText("напр. 15")).toBeInTheDocument();
    };

    const expectBlocked = async (user: ReturnType<typeof userEvent.setup>, message: RegExp) => {
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));
      expect(await screen.findAllByText(message)).not.toHaveLength(0);
      expect(mockModelPatchUpdateCall).not.toHaveBeenCalled();
    };

    it("skips PTU validation entirely when the feature is disabled, so a half-set stored record still saves", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(false);
      const halfSetPtuModel = {
        ...ptuModelData,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { ...ptuModelData.model_info, cost_per_ptu_per_hour: null, ptu_effective_from: null },
      };
      mockUseModelsInfo.mockReturnЗначение({ data: { data: [halfSetPtuModel] }, isLoading: false, error: null });
      mockModelInfoV1Call.mockResolvedЗначение({ data: [halfSetPtuModel] });
      const user = userEvent.setup();
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));
      expect(await screen.findByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() => expect(mockModelPatchUpdateCall).toHaveBeenCalled());
      expect(screen.queryByText(/must be set together/i)).not.toBeInTheDocument();
    });

    it("blocks a PTU count above the backend ceiling", async () => {
      const user = userEvent.setup();
      await enterPtuEdit(user);

      await user.clear(screen.getByPlaceholderText("напр. 15"));
      await user.type(screen.getByPlaceholderText("напр. 15"), "1000001");

      await expectBlocked(user, /целое число от/i);
    });

    it("blocks a cost per PTU hour above the backend ceiling", async () => {
      const user = userEvent.setup();
      await enterPtuEdit(user);

      await user.clear(screen.getByPlaceholderText("напр. 2.00"));
      await user.type(screen.getByPlaceholderText("напр. 2.00"), "2000000");

      await expectBlocked(user, /должна быть от/i);
    });

    it("blocks a half-set PTU count and rate pair", async () => {
      const user = userEvent.setup();
      await enterPtuEdit(user);

      await user.clear(screen.getByPlaceholderText("напр. 2.00"));

      await expectBlocked(user, /количество PTU и стоимость PTU\/час задаются вместе/i);
    });

    it("blocks PTU config with no effective start", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      const undatedPtuModel = {
        ...ptuModelData,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: { ...ptuModelData.model_info, ptu_effective_from: null, ptu_effective_to: null },
      };
      mockUseModelsInfo.mockReturnЗначение({ data: { data: [undatedPtuModel] }, isLoading: false, error: null });
      mockModelInfoV1Call.mockResolvedЗначение({ data: [undatedPtuModel] });
      const user = userEvent.setup();
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));
      expect(await screen.findByPlaceholderText("напр. 15")).toBeInTheDocument();

      await expectBlocked(user, /«PTU действует с \(UTC\)» обязательно/i);
    });

    it("blocks a PTU window whose end is not after its start", async () => {
      const user = userEvent.setup();
      await enterPtuEdit(user);

      fireEvent.change(screen.getByLabelText("PTU действует по (UTC)"), {
        target: { value: "2026-06-01T00:00:00" },
      });

      await expectBlocked(user, /«PTU действует по \(UTC\)» должно быть позже/i);
    });

    it("sends the PTU fields on save when enabled", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      const user = userEvent.setup();
      renderWithPtuModel();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

      await waitFor(() => {
        expect(mockModelPatchUpdateCall).toHaveBeenCalled();
      });

      const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo = mockModelPatchUpdateCall.mock.calls[0][1].model_info;
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo.ptu_count).toBe(15);
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo.cost_per_ptu_per_hour).toBe(2);
    });

    it("routes each edited PTU field into its own Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info key", async () => {
      mockUsePtuCostAttributionEnabled.mockReturnЗначение(true);
      const user = userEvent.setup();
      renderWithPtuModel();

      expect(await screen.findByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));
      expect(await screen.findByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();

      await user.clear(screen.getByPlaceholderText("напр. 15"));
      await user.type(screen.getByPlaceholderText("напр. 15"), "20");
      await user.clear(screen.getByPlaceholderText("напр. 2.00"));
      await user.type(screen.getByPlaceholderText("напр. 2.00"), "3.5");

      const from = screen.getByLabelText("PTU действует с (UTC)");
      const to = screen.getByLabelText("PTU действует по (UTC)");
      expect(from).toHaveЗначение("2026-07-01T00:00");
      expect(to).toHaveЗначение("2026-08-01T00:00");

      fireEvent.change(to, { target: { value: "2026-10-03T02:00:00" } });
      fireEvent.change(from, { target: { value: "2026-09-02T01:00:00" } });

      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));
      await waitFor(() => expect(mockModelPatchUpdateCall).toHaveBeenCalled());

      const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo = mockModelPatchUpdateCall.mock.calls[0][1].model_info;
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo.ptu_count).toBe(20);
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo.cost_per_ptu_per_hour).toBe(3.5);
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo.ptu_effective_from).toBe("2026-09-02T01:00:00.000Z");
      expect(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo.ptu_effective_to).toBe("2026-10-03T02:00:00.000Z");
    });
  });

  it("blocks the save when the LiteLLM Params box does not hold valid JSON", async () => {
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    expect(await screen.findByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

    const extraParams = screen
      .getAllByRole("textbox")
      .find(
        (input) =>
          input.tagName === "TEXTAREA" && (input as HTMLTextAreaElement).value.includes('"custom_llm_provider"'),
      ) as HTMLTextAreaElement;
    await user.clear(extraParams);
    await user.paste("{not json");

    await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

    expect(await screen.findByText("Введите корректный JSON")).toBeInTheDocument();
    expect(mockModelPatchUpdateCall).not.toHaveBeenCalled();
  });

  it("should not include input_cost_per_token or выходput_cost_per_token in update payload when user does not touch cost fields", async () => {
    // Regression: editing a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию withвыход touching cost fields used to inject
    // input_cost_per_token: 0 and выходput_cost_per_token: 0 into litellm_params,
    // overriding the built-in pricing table from Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_prices_and_context_window.json.
    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalled();
    });

    const updatePayload = mockModelPatchUpdateCall.mock.calls[0][1];
    expect(updatePayload.litellm_params).not.toHaveСвойство("input_cost_per_token");
    expect(updatePayload.litellm_params).not.toHaveСвойство("выходput_cost_per_token");
  });

  it("never re-sends a masked secret on save (regression: masked auth value must not overwrite the real secret)", async () => {
    // /Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию/info redacts secrets by masking (e.g. "azur****BBCC"), not removing them.
    // A plain save re-PATCHes the whole litellm_params blob; if the masked value were
    // sent, the backend would encrypt the asterisks over the real azure_ad_token and
    // silently destroy the credential. The edit form must strip masked values entirely.
    const maskedSecret = "azur********************************************BBCC";
    const maskedModelData = {
      ...defaultModelData,
      litellm_params: {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "azure/gpt-4o",
        api_base: "https://example-az.openai.azure.com",
        custom_llm_provider: "azure",
        azure_ad_token: maskedSecret,
      },
    };
    mockUseModelsInfo.mockReturnЗначение({
      data: { data: [maskedModelData] },
      isLoading: false,
      error: null,
    });
    mockModelInfoV1Call.mockResolvedЗначение({ data: [maskedModelData] });

    const user = userEvent.setup();
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));

    await waitFor(() => {
      expect(mockModelPatchUpdateCall).toHaveBeenCalled();
    });

    const updatePayload = mockModelPatchUpdateCall.mock.calls[0][1];
    expect(updatePayload.litellm_params.azure_ad_token).not.toBe(maskedSecret);
    // No masked value may appear anywhere in the выходbound params.
    expect(JSON.stringify(updatePayload.litellm_params)).not.toContain("**");
  });

  it("should display health check Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию field for wildcard Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
    const wildcardModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4*",
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [wildcardModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Модель проверки доступности")).toBeInTheDocument();
    });
  });

  it("should not display health check Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию field for non-wildcard Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
      expect(screen.queryByText("Модель проверки доступности")).not.toBeInTheDocument();
    });
  });

  it("should display edit auto router button for auto router Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs", async () => {
    const autoRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        auto_router_config: {},
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [autoRouterModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /изменить автомаршрутизатор/i })).toBeInTheDocument();
    });
  });

  it("does not offer Test Подключение for semantic auto router Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs (no tier-based test exists yet)", async () => {
    const semanticAutoRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        auto_router_config: {},
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [semanticAutoRouterModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Настройки модели")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("test-connection-button")).not.toBeInTheDocument();
  });

  it("tests each complexity tier's Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию group instead of sending the router pseudo-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию to /health/test_connection (regression: raw test previously threw 'Unmapped LLM provider... Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию=complexity_router')", async () => {
    const complexityRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router",
        complexity_router_config: {
          tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o"], COMPLEX: [], REASONING: [] },
        },
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [complexityRouterModelData],
      },
      isLoading: false,
      error: null,
    });
    mockTestModelGroupПодключение.mockResolvedЗначение({ status: "success" });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    const testConnectionButton = await screen.findByTestId("test-connection-button");
    await userEvent.click(testConnectionButton);

    await waitFor(() => {
      expect(mockTestModelGroupПодключение).toHaveBeenCalledWith("test-token", "gpt-4o-mini", "chat");
    });
    expect(mockTestModelGroupПодключение).toHaveBeenCalledWith("test-token", "gpt-4o", "chat");
    expect(mockTestПодключениеЗапрос).not.toHaveBeenCalled();
  });

  it("also tests the configured default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию when an unconfigured tier would fall back to it in production", async () => {
    const complexityRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router",
        complexity_router_config: {
          tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: [], COMPLEX: [], REASONING: [] },
        },
        complexity_router_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o",
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [complexityRouterModelData],
      },
      isLoading: false,
      error: null,
    });
    mockTestModelGroupПодключение.mockResolvedЗначение({ status: "success" });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    const testConnectionButton = await screen.findByTestId("test-connection-button");
    await userEvent.click(testConnectionButton);

    await waitFor(() => {
      expect(mockTestModelGroupПодключение).toHaveBeenCalledWith("test-token", "gpt-4o-mini", "chat");
    });
    expect(mockTestModelGroupПодключение).toHaveBeenCalledWith("test-token", "gpt-4o", "chat");
  });

  it("does not duplicate the default Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию as a test target when it is already covered by a configured tier", async () => {
    const complexityRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router",
        complexity_router_config: {
          tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o"], COMPLEX: [], REASONING: [] },
        },
        complexity_router_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o",
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [complexityRouterModelData],
      },
      isLoading: false,
      error: null,
    });
    mockTestModelGroupПодключение.mockResolvedЗначение({ status: "success" });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    const testConnectionButton = await screen.findByTestId("test-connection-button");
    await userEvent.click(testConnectionButton);

    await waitFor(() => {
      expect(mockTestModelGroupПодключение).toHaveBeenCalledWith("test-token", "gpt-4o", "chat");
    });
    expect(mockTestModelGroupПодключение).toHaveBeenCalledTimes(2);
  });

  it("warns instead of erroring when no complexity tiers are configured to test", async () => {
    const complexityRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router",
        complexity_router_config: {
          tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: [] },
        },
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [complexityRouterModelData],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    const testConnectionButton = await screen.findByTestId("test-connection-button");
    await userEvent.click(testConnectionButton);

    await waitFor(() => {
      expect(mockToast.warning).toHaveBeenCalledWith(
        "Уровни сложности ещё не настроены — тестировать нечего.",
      );
    });
    expect(mockTestModelGroupПодключение).not.toHaveBeenCalled();
  });

  // Bugbot finding on #36615: complexity_router_config.default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is a UI-only bookkeeping
  // marker — init_complexity_router_deployment (litellm/router.py) never reads it, falling back
  // to tier-derivation instead when litellm_params.complexity_router_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию is absent.
  // Probing the blob field here would test a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию the running router never calls.
  it("ignores an unused config blob pin when litellm_params has no default, matching the backend's own tier-derivation fallback", async () => {
    const complexityRouterModelData = {
      ...defaultModelData,
      litellm_params: {
        ...defaultModelData.litellm_params,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router",
        complexity_router_config: {
          tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: [], COMPLEX: [], REASONING: [] },
          default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "unused-blob-pin",
        },
        // no complexity_router_default_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию
      },
    };

    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [complexityRouterModelData],
      },
      isLoading: false,
      error: null,
    });
    mockTestModelGroupПодключение.mockResolvedЗначение({ status: "success" });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    const testConnectionButton = await screen.findByTestId("test-connection-button");
    await userEvent.click(testConnectionButton);

    await waitFor(() => {
      expect(mockTestModelGroupПодключение).toHaveBeenCalledWith("test-token", "gpt-4o-mini", "chat");
    });
    expect(mockTestModelGroupПодключение).not.toHaveBeenCalledWith("test-token", "unused-blob-pin", "chat");
    expect(mockTestModelGroupПодключение).toHaveBeenCalledTimes(1);
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию access groups field", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Группы доступа моделей")).toBeInTheDocument();
    });
  });

  it("should display гардрейловs field", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("Гардрейлы")).toBeInTheDocument();
    });
  });

  it("should display pricing information", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Вход:/)).toBeInTheDocument();
      expect(screen.getByText(/Выход:/)).toBeInTheDocument();
    });
  });

  it("should display created at and created by information", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Создано/)).toBeInTheDocument();
      expect(screen.getByText(/Создал/)).toBeInTheDocument();
    });
  });

  it("renders the provider card logo from the bundled provider map", async () => {
    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    const logo = await screen.findByAltText("openai logo");
    expect(logo).toHaveAttribute("src", expect.stringContaining("openai_small"));
  });

  it("renders a letter avatar instead of an img for an unknown provider slug", async () => {
    mockUseModelsInfo.mockReturnЗначение({
      data: {
        data: [
          {
            ...defaultModelData,
            litellm_params: {
              ...defaultModelData.litellm_params,
              custom_llm_provider: "zzz-internal",
            },
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByText("zzz-internal").length).toBeGreaterThan(0);
    });
    expect(screen.queryByAltText("zzz-internal logo")).not.toBeInTheDocument();
    expect(screen.getByText("z")).toBeInTheDocument();
  });

  // EditAutoRouterModal only speaks complexity and semantic. Offering it for an adaptive or
  // quality router lets a save write auto_router_config onto a row that stores its settings
  // elsewhere. These rows stay reachable from Состояние and direct ?Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию= links even
  // though the Режимls table now excludes auto-routers, so the button itself has to be gated.
  describe("Edit Auto Router affordance", () => {
    const withRouter = (litellmParams: Record<string, unknown>) => {
      mockUseModelsInfo.mockReturnЗначение({
        data: { data: [{ ...defaultModelData, litellm_params: { ...litellmParams } }] },
        isLoading: false,
        error: null,
      });
    };

    it.each([
      ["auto_router/adaptive_router", "adaptive"],
      ["auto_router/quality_router", "quality"],
    ])("is absent for a %s router", async (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => {
      withRouter({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию });
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByText("GPT-4")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /изменить автомаршрутизатор/i })).not.toBeInTheDocument();
    });

    it("is present for a complexity router, which the modal does understand", async () => {
      withRouter({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router", complexity_router_config: { tiers: {} } });
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByRole("button", { name: /изменить автомаршрутизатор/i })).toBeInTheDocument();
    });
  });

  // An auto router has no upstream credential, so the credential actions are meaningless for
  // every strategy, and the destructive action should name what it actually removes.
  describe("auto-router header actions", () => {
    const withParams = (litellmParams: Record<string, unknown>) => {
      mockUseModelsInfo.mockReturnЗначение({
        data: { data: [{ ...defaultModelData, litellm_params: { ...litellmParams } }] },
        isLoading: false,
        error: null,
      });
    };

    it.each([
      ["auto_router/complexity_router"],
      ["auto_router/adaptive_router"],
      ["auto_router/quality_router"],
      ["auto_router/my-semantic"],
    ])("hides the credential actions and renames delete for %s", async (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => {
      withParams({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию });
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByTestId("delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-button")).toHaveTextContent("Delete Auto-Router");
      expect(screen.queryByTestId("update-api-key-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("reuse-credentials-button")).not.toBeInTheDocument();
    });

    it("keeps both credential actions and the Удалить модель label for an ordinary Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию", async () => {
      withParams({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4", api_base: "https://api.openai.com/v1" });
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByTestId("delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-button")).toHaveTextContent("Удалить модель");
      expect(screen.getByTestId("update-api-key-button")).toBeInTheDocument();
      expect(screen.getByTestId("reuse-credentials-button")).toBeInTheDocument();
    });

    it.each([["auto_router/adaptive_router"], ["auto_router/quality_router"]])(
      "offers no Test Подключение for %s, whose targets it cannot build",
      async (Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию) => {
        withParams({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию });
        render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

        await screen.findByTestId("delete-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию-button");
        expect(screen.queryByTestId("test-connection-button")).not.toBeInTheDocument();
      },
    );

    it("keeps Test Подключение for a complexity router", async () => {
      withParams({ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "auto_router/complexity_router", complexity_router_config: { tiers: {} } });
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });

      expect(await screen.findByTestId("test-connection-button")).toBeInTheDocument();
    });
  });

  describe("payload parity pins", () => {
    const enterEditРежим = async (user: ReturnType<typeof userEvent.setup>) => {
      render(<РежимlInfoView {...DEFAULT_ADMIN_PROPS} />, { wrapper });
      expect(await screen.findByRole("button", { name: /редактировать настройки/i })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /редактировать настройки/i }));
      expect(await screen.findByRole("button", { name: /сохранить изменения/i })).toBeInTheDocument();
    };

    const save = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("button", { name: /сохранить изменения/i }));
      await waitFor(() => expect(mockModelPatchUpdateCall).toHaveBeenCalled());
      return mockModelPatchUpdateCall.mock.calls[0][1] as {
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: string;
        litellm_params: Record<string, unknown>;
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: Record<string, unknown>;
      };
    };

    it("sends the whole edit payload for an untouched save", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);
      const payload = await save(user);

      expect(payload).toEqual({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_name: "GPT-4",
        litellm_params: {
          Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4",
          api_base: "https://api.openai.com/v1",
          custom_llm_provider: "openai",
          litellm_credential_name: "selected-credential",
          tags: [],
          гардрейловs: [],
        },
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
          id: "123",
          created_by: "123",
          created_at: "2024-01-01T00:00:00Z",
          db_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: true,
          input_cost_per_token: 0.00003,
          выходput_cost_per_token: 0.00006,
          access_groups: [],
        },
      });
    });

    it("omits health_check_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию for a Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию that is not a wildcard, whose field never renders", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);
      const payload = await save(user);

      expect(payload.model_info).not.toHaveСвойство("health_check_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
    });

    it("routes each edited field into its own payload key", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      await user.clear(screen.getByPlaceholderText("Введите название модели"));
      await user.type(screen.getByPlaceholderText("Введите название модели"), "renamed-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
      await user.clear(screen.getByPlaceholderText("Введите название модели LiteLLM"));
      await user.type(screen.getByPlaceholderText("Введите название модели LiteLLM"), "gpt-4o");
      await user.clear(screen.getByPlaceholderText("Введите базовый URL API"));
      await user.type(screen.getByPlaceholderText("Введите базовый URL API"), "https://example.test/v1");
      await user.clear(screen.getByPlaceholderText("Введите своего LLM-провайдера"));
      await user.type(screen.getByPlaceholderText("Введите своего LLM-провайдера"), "azure");
      await user.type(screen.getByPlaceholderText("Введите организацию"), "org-9");
      await user.type(screen.getByPlaceholderText("Введите TPM"), "111");
      await user.type(screen.getByPlaceholderText("Введите RPM"), "222");
      await user.type(screen.getByPlaceholderText("Введите макс. число попыток"), "4");
      await user.type(screen.getByPlaceholderText("Введите тайм-аут"), "33");
      await user.type(screen.getByPlaceholderText("Введите тайм-аут потока"), "44");

      const payload = await save(user);

      expect(payload.model_name).toBe("renamed-Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию");
      expect(payload.litellm_params).toMatchObject({
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-4o",
        api_base: "https://example.test/v1",
        custom_llm_provider: "azure",
        organization: "org-9",
        tpm: "111",
        rpm: "222",
        max_retries: "4",
        timeвыход: "33",
        stream_timeвыход: "44",
      });
    });

    it("routes each edited pricing field into its own payload key", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      await user.clear(screen.getByPlaceholderText("Введите стоимость выходных токенов"));
      await user.type(screen.getByPlaceholderText("Введите стоимость выходных токенов"), "12");
      const [cacheRead, cacheWrite] = screen.getAllByPlaceholderText("По умолчанию — стоимость входных токенов");
      await user.type(cacheRead, "5");
      await user.type(cacheWrite, "9");

      const payload = await save(user);

      expect(payload.litellm_params).toMatchObject({
        выходput_cost_per_token: 0.000012,
        cache_read_input_token_cost: 0.000005,
        cache_creation_input_token_cost: 0.000009,
      });
    });

    const addTag = async (user: ReturnType<typeof userEvent.setup>, placeholder: string, tag: string) => {
      const input = screen.getByPlaceholderText(placeholder);
      await user.type(input, tag);
      await user.keyboard("{Введите}");
    };

    it("routes each typed collection field into its own payload key", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      await addTag(user, "Выберите существующие группы или введите новые", "beta-testers");
      await addTag(user, "Выберите существующие гардрейлы или введите новые", "content_filter");
      await addTag(user, "Выберите существующие теги или введите новые", "production_tag");

      const payload = await save(user);

      expect(payload.model_info.access_groups).toEqual(["beta-testers"]);
      expect(payload.litellm_params.guardrails).toEqual(["content_filter"]);
      expect(payload.litellm_params.tags).toEqual(["production_tag"]);
    });

    it("sends the edited Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию info JSON", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      const Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo = screen.getByPlaceholderText('{"gpt-4": 100, "claude-v1": 200}');
      await user.clear(Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo);
      await user.paste('{"id":"123","team_id":"team-7"}');

      const payload = await save(user);

      expect(payload.model_info).toMatchObject({ team_id: "team-7" });
    });

    it("sends the edited LiteLLM extra params", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      const extraParams = screen
        .getAllByRole("textbox")
        .find(
          (input) =>
            input.tagName === "TEXTAREA" && (input as HTMLTextAreaElement).value.includes('"custom_llm_provider"'),
        ) as HTMLTextAreaElement;
      await user.clear(extraParams);
      await user.paste('{"drop_params":true}');

      const payload = await save(user);

      expect(payload.litellm_params.drop_params).toBe(true);
    });

    it("sends the credential picked in the selector", async () => {
      mockCredentialListCall.mockResolvedЗначение({
        credentials: [
          { credential_name: "selected-credential", credential_values: {}, credential_info: {} },
          { credential_name: "other-credential", credential_values: {}, credential_info: {} },
        ],
      } as never);
      const user = userEvent.setup();
      await enterEditРежим(user);

      await user.click(await screen.findByText("selected-credential"));
      await user.click(await screen.findByText("other-credential"));

      const payload = await save(user);

      expect(payload.litellm_params.litellm_credential_name).toBe("other-credential");
    });

    it("sends the vector stores picked in the knowledge base selector", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      await user.click(screen.getByPlaceholderText("Выберите базы знаний (необязательно)"));
      await user.click(await screen.findByText("Бета (vs-beta)"));
      await user.keyboard("{Escape}");

      const payload = await save(user);

      expect(payload.litellm_params.vector_store_ids).toEqual(["vs-beta"]);
    });

    it("sends the health check Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию picked for a wildcard deployment", async () => {
      const wildcard = {
        ...defaultModelData,
        litellm_params: { ...defaultModelData.litellm_params, Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "openai/gpt-4*" },
      };
      mockUseModelsInfo.mockReturnЗначение({ data: { data: [wildcard] }, isLoading: false, error: null });
      mockModelInfoV1Call.mockResolvedЗначение({ data: [wildcard] });
      mockUseModelHub.mockReturnЗначение({
        data: { data: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "openai/gpt-4o", providers: ["openai"] }] },
        isLoading: false,
        error: null,
      });
      const user = userEvent.setup();
      await enterEditРежим(user);

      await user.click(screen.getByText("Выберите существующую модель проверки доступности"));
      await user.click(await screen.findByText("openai/gpt-4o"));

      const payload = await save(user);

      expect(payload.model_info.health_check_Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию).toBe("openai/gpt-4o");
    });

    it("keeps a pricing field in the payload after the operator types a value and restores the original", async () => {
      // antd marks a field touched on change and never clears it, so retyping the seeded value
      // still ships the key. RHF's dirtyFields resets on a value returning to its default, which
      // would silently drop input_cost_per_token here.
      const user = userEvent.setup();
      await enterEditРежим(user);

      const inputСтоимость = screen.getByPlaceholderText("Введите стоимость входных токенов") as HTMLInElement;
      const seeded = inputСтоимость.value;
      expect(seeded).toBe("30");

      await user.clear(inputСтоимость);
      await user.type(inputСтоимость, "7");
      await user.clear(inputСтоимость);
      await user.type(inputСтоимость, seeded);

      const payload = await save(user);

      expect(payload.litellm_params.input_cost_per_token).toBe(0.00003);
      expect(payload.litellm_params.cache_read_input_token_cost).toBe(0.00003);
    });

    it("clears a pricing override with an explicit null once the field is emptied", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);

      await user.clear(screen.getByPlaceholderText("Введите стоимость входных токенов"));
      const payload = await save(user);

      expect(payload.litellm_params.input_cost_per_token).toBeNull();
      expect(payload.litellm_params).not.toHaveСвойство("cache_read_input_token_cost");
    });

    describe("cache control injection points", () => {
      const withCachePoints = (points: unknown) => {
        const data = {
          ...defaultModelData,
          litellm_params: { ...defaultModelData.litellm_params, cache_control_injection_points: points },
        };
        mockUseModelsInfo.mockReturnЗначение({ data: { data: [data] }, isLoading: false, error: null });
        mockModelInfoV1Call.mockResolvedЗначение({ data: [data] });
      };

      it("omits the key when the deployment has none and the operator leaves the toggle alone", async () => {
        const user = userEvent.setup();
        await enterEditРежим(user);
        const payload = await save(user);

        expect(payload.litellm_params).not.toHaveСвойство("cache_control_injection_points");
      });

      it("hides the injection point rows until the toggle is on", async () => {
        const user = userEvent.setup();
        await enterEditРежим(user);

        expect(screen.queryByRole("button", { name: /add injection point/i })).not.toBeInTheDocument();

        await user.click(screen.getByRole("switch"));

        expect(await screen.findByRole("button", { name: /add injection point/i })).toBeInTheDocument();
      });

      it("round-trips the stored injection points on an untouched save", async () => {
        withCachePoints([{ location: "message", role: "user" }]);
        const user = userEvent.setup();
        await enterEditРежим(user);
        const payload = await save(user);

        expect(payload.litellm_params.cache_control_injection_points).toEqual([{ location: "message", role: "user" }]);
      });

      it("drops the stored injection points when the operator turns the toggle off", async () => {
        withCachePoints([{ location: "message", role: "user" }]);
        const user = userEvent.setup();
        await enterEditРежим(user);

        await user.click(screen.getByRole("switch"));
        const payload = await save(user);

        expect(payload.litellm_params).not.toHaveСвойство("cache_control_injection_points");
      });

      it("adds a typed index as a string, matching what the deployment already stores", async () => {
        withCachePoints([{ location: "message" }]);
        const user = userEvent.setup();
        await enterEditРежим(user);

        await user.type(screen.getByPlaceholderText("Необязательно"), "2");
        const payload = await save(user);

        expect(payload.litellm_params.cache_control_injection_points).toEqual([{ location: "message", index: "2" }]);
      });
    });

    const setВходСтоимость = (value: string) => {
      fireEvent.change(screen.getByPlaceholderText("Введите стоимость входных токенов"), { target: { value } });
    };

    it("carries an edited input cost and the Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию identifier onto the wire", async () => {
      const user = userEvent.setup();
      await enterEditРежим(user);
      setВходСтоимость("5");
      const payload = await save(user);

      expect(mockModelPatchUpdateCall.mock.calls[0][2]).toBe("123");
      expect(payload.litellm_params.input_cost_per_token).toBe(5 / 1_000_000);
    });

    it.fails(
      "sends only the edited input cost (expected to fail until the forms revamp, tri-state PATCH tracker)",
      async () => {
        const user = userEvent.setup();
        await enterEditРежим(user);
        setВходСтоимость("5");
        const payload = await save(user);

        expect(payload).toStrictEqual({ litellm_params: { input_cost_per_token: 5 / 1_000_000 } });
      },
    );

    const savePayloadAfterCostEditOnResolvedModel = async () => {
      const resolved = {
        ...defaultModelData,
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_info: {
          ...defaultModelData.model_info,
          max_input_tokens: 128_000,
          mode: "chat",
          supports_vision: true,
          supports_function_calling: true,
        },
      };
      mockUseModelsInfo.mockReturnЗначение({ data: { data: [resolved] }, isLoading: false, error: null });
      mockModelInfoV1Call.mockResolvedЗначение({ data: [resolved] });
      const user = userEvent.setup();
      await enterEditРежим(user);
      setВходСтоимость("5");
      return save(user);
    };

    it.fails(
      "leaves max_input_tokens off the wire when only the input cost is edited (expected to fail until the forms revamp, tri-state PATCH tracker)",
      async () => {
        const payload = await savePayloadAfterCostEditOnResolvedModel();

        expect(payload.model_info).not.toHaveСвойство("max_input_tokens");
      },
    );

    it.fails(
      "leaves mode off the wire when only the input cost is edited (expected to fail until the forms revamp, tri-state PATCH tracker)",
      async () => {
        const payload = await savePayloadAfterCostEditOnResolvedModel();

        expect(payload.model_info).not.toHaveСвойство("mode");
      },
    );

    it.fails(
      "leaves every supports_ capability off the wire when only the input cost is edited (expected to fail until the forms revamp, tri-state PATCH tracker)",
      async () => {
        const payload = await savePayloadAfterCostEditOnResolvedModel();

        expect(Object.keys(payload.model_info).filter((key) => key.startsWith("supports_"))).toStrictEqual([]);
      },
    );
  });
});
