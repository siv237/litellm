import { screen, waitFor } from "@testing-library/react";
import { renderWithПровайдерs } from "../../../tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as networking from "../networking";
import ПолитикаВыбратьor, { getПолитикаOptionEntries, policyВерсияRef, POLICY_VERSION_ID_PREFIX } from "./ПолитикаВыбратьor";
import { Политика } from "./types";

vi.mock("../networking");

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

const makeПолитика = (overrides: Partial<Политика>): Политика => ({
  policy_id: "uuid-1",
  policy_name: "test-policy",
  inherit: null,
  description: null,
  гардрейловs_add: [],
  гардрейловs_remove: [],
  condition: null,
  ...overrides,
});

describe("policyВерсияRef", () => {
  it("should prefix the policy id with the version prefix", () => {
    expect(policyВерсияRef("abc-123")).toBe(`${POLICY_VERSION_ID_PREFIX}abc-123`);
  });
});

describe("getПолитикаOptionEntries", () => {
  it("should filter выход draft policies", () => {
    const policies = [
      makeПолитика({ policy_name: "draft-one", version_status: "draft" }),
      makeПолитика({ policy_name: "published-one", version_status: "published", policy_id: "pub-id" }),
    ];
    const options = getПолитикаOptionEntries(policies);
    expect(options).toHaveLength(1);
    expect(options[0].label).toContain("published-one");
  });

  it("should use the policy_name as value for production policies", () => {
    const policy = makeПолитика({ policy_name: "prod-policy", version_status: "production" });
    const options = getПолитикаOptionEntries([policy]);
    expect(options[0].value).toBe("prod-policy");
  });

  it("should use a version ref as value for published (non-production) policies", () => {
    const policy = makeПолитика({ policy_id: "abc-123", policy_name: "pub-policy", version_status: "published" });
    const options = getПолитикаOptionEntries([policy]);
    expect(options[0].value).toBe(policyВерсияRef("abc-123"));
  });

  it("should include the version number and status in the label", () => {
    const policy = makeПолитика({ policy_name: "my-policy", version_status: "published", version_number: 3 });
    const options = getПолитикаOptionEntries([policy]);
    expect(options[0].label).toContain("v3");
    expect(options[0].label).toContain("published");
  });

  it("should append the description to the label when present", () => {
    const policy = makeПолитика({
      policy_name: "my-policy",
      version_status: "published",
      description: "blocks PII",
    });
    const options = getПолитикаOptionEntries([policy]);
    expect(options[0].label).toContain("blocks PII");
  });

  it("should treat policies with no version_status as draft and filter them выход", () => {
    const policy = makeПолитика({ policy_name: "implicit-draft" });
    const options = getПолитикаOptionEntries([policy]);
    expect(options).toHaveLength(0);
  });
});

describe("ПолитикаВыбратьor", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearВсеMocks();
    can.mockReturnЗначение(true);
  });

  it("should render", () => {
    vi.mocked(networking.getPoliciesList).mockResolvedЗначение({ policies: [] });
    renderWithПровайдерs(<ПолитикаВыбратьor accessТокен="tok" onChange={mockOnChange} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should fetch policies on mount with the given access token", async () => {
    vi.mocked(networking.getPoliciesList).mockResolvedЗначение({ policies: [] });
    renderWithПровайдерs(<ПолитикаВыбратьor accessТокен="my-token" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(networking.getPoliciesList).toHaveBeenCalledWith("my-token");
    });
  });

  it("should call onPoliciesLoaded with the fetched policies after mount", async () => {
    const policies = [makeПолитика({ version_status: "production" })];
    vi.mocked(networking.getPoliciesList).mockResolvedЗначение({ policies });
    const onPoliciesLoaded = vi.fn();
    renderWithПровайдерs(
      <ПолитикаВыбратьor accessТокен="tok" onChange={mockOnChange} onPoliciesLoaded={onPoliciesLoaded} />,
    );
    await waitFor(() => {
      expect(onPoliciesLoaded).toHaveBeenCalledWith(policies);
    });
  });

  it("should show a disabled placeholder when disabled prop is true", () => {
    vi.mocked(networking.getPoliciesList).mockResolvedЗначение({ policies: [] });
    renderWithПровайдерs(<ПолитикаВыбратьor accessТокен="tok" onChange={mockOnChange} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("should not fetch policies when accessТокен is empty", () => {
    renderWithПровайдерs(<ПолитикаВыбратьor accessТокен="" onChange={mockOnChange} />);
    expect(networking.getPoliciesList).not.toHaveBeenCalled();
  });

  it("should render nothing and skip the admin-only fetch withвыход the viewPolicies capability", async () => {
    can.mockReturnЗначение(false);
    vi.mocked(networking.getPoliciesList).mockResolvedЗначение({ policies: [] });

    const { container } = renderWithПровайдерs(<ПолитикаВыбратьor accessТокен="tok" onChange={mockOnChange} />);

    await waitFor(() => {
      expect(can).toHaveBeenCalledWith("viewPolicies");
    });
    expect(networking.getPoliciesList).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
