import React from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, testQueryClient, waitFor, within } from "../../tests/test-utils";
import TeamSSOSettings from "./TeamSSOSettings";
import * as networking from "./networking";
import { toast } from "@/lib/toast";

vi.mock("./networking");

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({
    token: "test-token",
    accessToken: "test-token",
    userId: "test-user",
    userEmail: "test-user@example.com",
    userRole: "Admin",
    premiumUser: true,
    disabledPersonalKeyCreation: null,
    showSSOBanner: false,
  }),
}));

vi.mock("./common_components/budget_duration_dropdown", () => {
  const BudgetDurationDropdown = ({ value, onChange }: { value: string | null; onChange: (value: string) => void }) => (
    <select
      data-testid="budget-duration-dropdown"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Budget duration"
    >
      <option value="">Select duration</option>
      <option value="24h">Daily</option>
      <option value="7d">Weekly</option>
      <option value="30d">Monthly</option>
    </select>
  );
  BudgetDurationDropdown.displayName = "BudgetDurationDropdown";
  return {
    default: BudgetDurationDropdown,
    getBudgetDurationLabel: vi.fn((value: string) => {
      const map: Record<string, string> = { "24h": "daily", "7d": "weekly", "30d": "monthly" };
      return map[value] || value;
    }),
  };
});

vi.mock("./key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: vi.fn((model: string) => model),
}));

vi.mock("./common_components/OrganizationDropdown", () => ({
  default: ({
    organizations,
    value,
    onChange,
    placeholder,
    loading,
  }: {
    organizations?: { organization_id: string; organization_alias: string }[] | null;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    loading?: boolean;
  }) => (
    <div>
      <select
        data-testid="organization-dropdown"
        data-loading={String(Boolean(loading))}
        aria-label="Default organization"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {organizations?.map((org) => (
          <option key={org.organization_id} value={org.organization_id}>
            {org.organization_alias} ({org.organization_id})
          </option>
        ))}
      </select>
      <button
        type="button"
        data-testid="organization-dropdown-clear"
        onClick={() => onChange?.(undefined as unknown as string)}
      >
        Clear organization
      </button>
    </div>
  ),
}));

vi.mock("./ModelSelect/ModelSelect", () => {
  const ModelSelect = ({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) => (
    <select
      data-testid="model-select"
      multiple
      value={value || []}
      onChange={(e) => {
        const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value);
        onChange(selectedValues);
      }}
      aria-label="Models"
    >
      <option value="gpt-4">gpt-4</option>
      <option value="claude-3">claude-3</option>
    </select>
  );
  ModelSelect.displayName = "ModelSelect";
  return { ModelSelect };
});

const mockGetDefaultTeamSettings = vi.mocked(networking.getDefaultTeamSettings);
const mockUpdateDefaultTeamSettings = vi.mocked(networking.updateDefaultTeamSettings);
const mockOrganizationListCall = vi.mocked(networking.organizationListCall);
const mockToast = vi.mocked(toast);

const MOCK_ORGANIZATIONS = [
  { organization_id: "org-1", organization_alias: "Engineering" },
  { organization_id: "org-2", organization_alias: "Sales" },
];

describe("TeamSSOSettings", () => {
  const defaultProps = {
    accessToken: "test-token",
    userID: "test-user",
    userRole: "admin",
  };

  const mockSettingsResponse = {
    values: {
      max_budget: 1000,
      budget_duration: "30d",
      tpm_limit: 500,
      rpm_limit: 100,
      models: ["gpt-4"],
      team_member_permissions: ["/key/generate", "/key/update"],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    testQueryClient.clear();
    mockOrganizationListCall.mockResolvedValue(MOCK_ORGANIZATIONS);
  });

  // --- Loading & Error States ---

  it("should show an accessible loading state while fetching settings", () => {
    mockGetDefaultTeamSettings.mockImplementation(() => new Promise(() => {}));

    const { container } = renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText("Настройки команд по умолчанию")).not.toBeInTheDocument();
  });

  it("should display error message when fetch fails", async () => {
    mockGetDefaultTeamSettings.mockRejectedValue(new Error("Fetch failed"));

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Настройки команд по умолчанию недоступны или нет прав на их просмотр."),
      ).toBeInTheDocument();
    });
    expect(mockToast.fromError).toHaveBeenCalledWith("Не удалось загрузить настройки команд");
  });

  it("should not fetch settings when access token is null", async () => {
    renderWithProviders(<TeamSSOSettings accessToken={null} userID="test-user" userRole="admin" />);

    await waitFor(() => {
      expect(mockGetDefaultTeamSettings).not.toHaveBeenCalled();
    });
  });

  // --- View Mode ---

  it("should render title and subtitle", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Настройки команд по умолчанию")).toBeInTheDocument();
      expect(
        screen.getByText("Эти значения применяются по умолчанию при создании новых команд."),
      ).toBeInTheDocument();
    });
  });

  it("should render section headers", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Бюджет и лимиты запросов")).toBeInTheDocument();
      expect(screen.getByText("Доступ и разрешения")).toBeInTheDocument();
    });
  });

  it("should display all field labels and descriptions", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Макс. бюджет")).toBeInTheDocument();
      expect(screen.getByText("Период бюджета")).toBeInTheDocument();
      expect(screen.getByText("Лимит TPM")).toBeInTheDocument();
      expect(screen.getByText("Лимит RPM")).toBeInTheDocument();
      expect(screen.getByText("Модели")).toBeInTheDocument();
      expect(screen.getByText("Разрешения участников команды")).toBeInTheDocument();
    });

    // Descriptions
    expect(screen.getByText("Максимальный бюджет (USD) для новых команд, создаваемых автоматически.")).toBeInTheDocument();
    expect(screen.getByText("Как часто сбрасывается бюджет команды.")).toBeInTheDocument();
  });

  it("should display formatted values in view mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      // max_budget displayed with $
      expect(screen.getByText("$1,000")).toBeInTheDocument();
      // budget_duration through getBudgetDurationLabel
      expect(screen.getByText("monthly")).toBeInTheDocument();
      // tpm_limit formatted
      expect(screen.getByText("500")).toBeInTheDocument();
      // rpm_limit formatted
      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  it("should display models as tags in view mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("gpt-4")).toBeInTheDocument();
    });
  });

  it("should display permissions as tags in view mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("/key/generate")).toBeInTheDocument();
      expect(screen.getByText("/key/update")).toBeInTheDocument();
    });
  });

  it("should display 'Не задано' for null values", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue({
      values: {
        max_budget: null,
        budget_duration: null,
        tpm_limit: null,
        rpm_limit: null,
        models: [],
        team_member_permissions: [],
      },
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      const notSetElements = screen.getAllByText("Не задано");
      // max_budget, budget_duration, tpm_limit, rpm_limit, models (empty), permissions (empty)
      expect(notSetElements.length).toBeGreaterThanOrEqual(4);
    });
  });

  // --- Edit Mode Toggle ---

  it("should toggle to edit mode when Edit Settings is clicked", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));

    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Изменить настройки/i })).not.toBeInTheDocument();
  });

  it("should cancel edit mode and reset values", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    await userEvent.click(screen.getByRole("button", { name: "Отмена" }));

    expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Отмена" })).not.toBeInTheDocument();
  });

  // --- Edit Mode Fields ---

  it("should show budget duration dropdown in edit mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));

    await waitFor(() => {
      expect(screen.getByTestId("budget-duration-dropdown")).toBeInTheDocument();
    });
  });

  it("should show ModelSelect in edit mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));

    await waitFor(() => {
      expect(screen.getByTestId("model-select")).toBeInTheDocument();
    });
  });

  it("should show number inputs for budget and rate limits in edit mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));

    await waitFor(() => {
      expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    });
  });

  it("should let users add a permission and persist it", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);
    mockUpdateDefaultTeamSettings.mockResolvedValue({
      settings: {
        ...mockSettingsResponse.values,
        team_member_permissions: ["/key/generate", "/key/update", "/key/delete"],
      },
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    const permissionComboboxes = screen.getAllByRole("combobox");
    const permissionCombobox = permissionComboboxes[permissionComboboxes.length - 1];
    expect(permissionCombobox).toBeInTheDocument();
    await userEvent.click(permissionCombobox!);
    const deletePermissionOptions = await screen.findAllByText("/key/delete");
    await userEvent.click(deletePermissionOptions[deletePermissionOptions.length - 1]);
    await userEvent.keyboard("{Escape}");

    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateDefaultTeamSettings).toHaveBeenCalledWith("test-token", {
        ...mockSettingsResponse.values,
        organization_id: null,
        team_member_permissions: ["/key/generate", "/key/update", "/key/delete"],
      });
    });
    expect(screen.getByText("/key/delete")).toBeInTheDocument();
  });

  // --- Save ---

  it("should save settings and show success notification", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);
    mockUpdateDefaultTeamSettings.mockResolvedValue({
      settings: mockSettingsResponse.values,
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateDefaultTeamSettings).toHaveBeenCalledWith("test-token", expect.any(Object));
    });

    expect(mockToast.success).toHaveBeenCalledWith("Настройки команд по умолчанию обновлены");

    // Should exit edit mode after save
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });
  });

  // --- Default Organization ---

  it("should display the default organization alias and id in view mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue({
      values: { ...mockSettingsResponse.values, organization_id: "org-2" },
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Sales (org-2)")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Команды, созданные без явной организации, относятся к этой организации."),
    ).toBeInTheDocument();
  });

  it("should fall back to the raw organization id when it is not in the organization list", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue({
      values: { ...mockSettingsResponse.values, organization_id: "org-deleted" },
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("org-deleted")).toBeInTheDocument();
    });
  });

  it("should display 'Не задано' when the settings payload has no organization_id", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Не задано")).toBeInTheDocument();
    });
  });

  it("should populate the organization dropdown with the fetched organizations in edit mode", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));

    await waitFor(() => {
      const dropdown = screen.getByTestId("organization-dropdown");
      expect(within(dropdown).getByRole("option", { name: "Engineering (org-1)" })).toBeInTheDocument();
      expect(within(dropdown).getByRole("option", { name: "Sales (org-2)" })).toBeInTheDocument();
    });
  });

  it("should send the selected organization_id when saving", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);
    mockUpdateDefaultTeamSettings.mockResolvedValue({
      settings: { ...mockSettingsResponse.values, organization_id: "org-2" },
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sales (org-2)" })).toBeInTheDocument();
    });
    await userEvent.selectOptions(screen.getByTestId("organization-dropdown"), "org-2");
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateDefaultTeamSettings).toHaveBeenCalledWith("test-token", {
        ...mockSettingsResponse.values,
        organization_id: "org-2",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Sales (org-2)")).toBeInTheDocument();
    });
  });

  it("should send a null organization_id when the selection is cleared", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue({
      values: { ...mockSettingsResponse.values, organization_id: "org-2" },
    });
    mockUpdateDefaultTeamSettings.mockResolvedValue({
      settings: { ...mockSettingsResponse.values, organization_id: null },
    });

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    await userEvent.click(screen.getByTestId("organization-dropdown-clear"));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockUpdateDefaultTeamSettings).toHaveBeenCalledWith("test-token", {
        ...mockSettingsResponse.values,
        organization_id: null,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Не задано")).toBeInTheDocument();
    });
  });

  it("should show error notification when save fails", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);
    mockUpdateDefaultTeamSettings.mockRejectedValue(new Error("Save failed"));

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(mockToast.fromError).toHaveBeenCalledWith("Не удалось обновить настройки команд");
    });
  });

  it("should disable cancel button while saving", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue(mockSettingsResponse);
    mockUpdateDefaultTeamSettings.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ settings: mockSettingsResponse.values }), 100)),
    );

    renderWithProviders(<TeamSSOSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Изменить настройки/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /Изменить настройки/i }));
    await userEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    expect(screen.getByRole("button", { name: "Отмена" })).toBeDisabled();
  });
});
