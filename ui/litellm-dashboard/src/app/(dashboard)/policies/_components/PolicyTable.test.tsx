import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ПолитикаТаблица from "./ПолитикаТаблица";
import { Политика } from "@/components/policies/types";

const makeПолитика = (overrides: Partial<Политика> = {}): Политика => ({
  policy_id: "policy-id-1",
  policy_name: "test-policy",
  inherit: null,
  description: null,
  гардрейловs_add: [],
  гардрейловs_remove: [],
  condition: null,
  ...overrides,
});

const defaultProps = {
  policies: [],
  isLoading: false,
  onDeleteClick: vi.fn(),
  onEditClick: vi.fn(),
  onViewClick: vi.fn(),
  isAdmin: true,
};

describe("ПолитикаТаблица", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render column headers", () => {
    renderWithProviders(<ПолитикаТаблица {...defaultProps} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Описание")).toBeInTheDocument();
    expect(screen.getByText("Гардрейлы (добавить)")).toBeInTheDocument();
    expect(screen.getByText("Создан")).toBeInTheDocument();
  });

  it("should show skeleton rows when isLoading is true", () => {
    renderWithProviders(<ПолитикаТаблица {...defaultProps} isLoading />);
    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
  });

  it("should show the empty state when there are no policies", () => {
    renderWithProviders(<ПолитикаТаблица {...defaultProps} />);
    expect(screen.getByText("No policies found")).toBeInTheDocument();
  });

  it("should render a clickable name cell for each grouped policy", () => {
    const policies = [
      makeПолитика({ policy_name: "alpha-policy", policy_id: "id-1" }),
      makeПолитика({ policy_name: "beta-policy", policy_id: "id-2" }),
    ];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    expect(screen.getByRole("button", { name: "alpha-policy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "beta-policy" })).toBeInTheDocument();
  });

  it("should sort rows by policy name ascending by default", () => {
    const policies = [
      makeПолитика({ policy_name: "zeta-policy", policy_id: "id-z" }),
      makeПолитика({ policy_name: "alpha-policy", policy_id: "id-a" }),
    ];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("alpha-policy")).toBeInTheDocument();
    expect(within(rows[1]).getByText("zeta-policy")).toBeInTheDocument();
  });

  it("should call onViewClick with the policy_id when the policy name is clicked", async () => {
    const user = userEvent.setup();
    const policy = makeПолитика({ policy_name: "my-policy", policy_id: "view-id-1" });
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={[policy]} />);
    await user.click(screen.getByRole("button", { name: "my-policy" }));
    expect(defaultProps.onViewClick).toHaveBeenCalledWith("view-id-1");
  });

  it("should call onDeleteClick with policy_id and policy_name from the actions menu", async () => {
    const user = userEvent.setup();
    const policy = makeПолитика({ policy_name: "del-policy", policy_id: "del-id-1" });
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={[policy]} />);
    await user.click(screen.getByTestId("policy-actions-del-id-1"));
    await user.click(await screen.findByTestId("policy-action-delete"));
    expect(defaultProps.onDeleteClick).toHaveBeenCalledWith("del-id-1", "del-policy");
  });

  it("should call onEditClick with the policy from the actions menu", async () => {
    const user = userEvent.setup();
    const policy = makeПолитика({ policy_name: "edit-policy", policy_id: "edit-id-1" });
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={[policy]} />);
    await user.click(screen.getByTestId("policy-actions-edit-id-1"));
    await user.click(await screen.findByTestId("policy-action-edit"));
    expect(defaultProps.onEditClick).toHaveBeenCalledWith(policy);
  });

  it("should not show the actions menu for non-admins", () => {
    const policy = makeПолитика();
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={[policy]} isAdmin={false} />);
    expect(screen.queryByTestId(`policy-actions-${policy.policy_id}`)).not.toBeInTheDocument();
  });

  it("should show a version badge when multiple versions of the same policy name exist", () => {
    const publishedВерсия: Partial<Политика> = {
      policy_name: "versioned",
      policy_id: "v1",
      version_status: "published",
      version_number: 1,
    };
    const productionВерсия: Partial<Политика> = {
      policy_name: "versioned",
      policy_id: "v2",
      version_status: "production",
      version_number: 2,
    };
    const policies = [makeПолитика(publishedВерсия), makeПолитика(productionВерсия)];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    expect(screen.getByText("2 versions")).toBeInTheDocument();
  });

  it("should group policies with the same name into a single row", () => {
    const policies = [
      makeПолитика({ policy_name: "shared", policy_id: "s1", version_status: "published" }),
      makeПолитика({ policy_name: "shared", policy_id: "s2", version_status: "production" }),
    ];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    expect(screen.getAllByText("shared")).toHaveLength(1);
  });

  it("should show an overflow badge when more than 2 гардрейловs_add exist", () => {
    const policy = makeПолитика({ гардрейловs_add: ["g1", "g2", "g3", "g4"] });
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={[policy]} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("should prefer the production version as the primary policy when grouping", async () => {
    const user = userEvent.setup();
    const policies = [
      makeПолитика({ policy_name: "grouped", policy_id: "published-id", version_status: "published" }),
      makeПолитика({ policy_name: "grouped", policy_id: "prod-id", version_status: "production" }),
    ];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    await user.click(screen.getByRole("button", { name: /grouped/ }));
    expect(defaultProps.onViewClick).toHaveBeenCalledWith("prod-id");
  });

  const sameNamedDbЧерновик: Partial<Политика> = {
    policy_name: "config-policy",
    policy_id: "db-draft-id",
    version_status: "draft",
    version_number: 2,
  };
  const configTwin: Partial<Политика> = {
    policy_name: "config-policy",
    policy_id: "config-policy",
    version_status: "production",
    definition_location: "config",
  };

  it("should render a config policy and a same-named DB draft as separate rows", () => {
    const policies = [makeПолитика(sameNamedDbЧерновик), makeПолитика(configTwin)];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    expect(screen.getAllByText("config-policy")).toHaveLength(2);
    expect(screen.getByText("Конфигурация")).toBeInTheDocument();
  });

  it("should keep a same-named DB draft reachable next to a config policy", async () => {
    const user = userEvent.setup();
    const policies = [makeПолитика(sameNamedDbЧерновик), makeПолитика(configTwin)];
    renderWithProviders(<ПолитикаТаблица {...defaultProps} policies={policies} />);
    await user.click(screen.getByRole("button", { name: "config-policy" }));
    expect(defaultProps.onViewClick).toHaveBeenCalledWith("db-draft-id");
    await user.click(screen.getByTestId("policy-actions-db-draft-id"));
    expect(await screen.findByTestId("policy-action-edit")).not.toHaveAttribute("data-disabled");
  });
});
