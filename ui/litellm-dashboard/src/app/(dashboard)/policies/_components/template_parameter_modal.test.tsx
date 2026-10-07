import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import TemplateParameterModal from "./template_parameter_modal";

const { modelHubCall, enrichPolicyTemplateStream } = vi.hoisted(() => ({
  modelHubCall: vi.fn(),
  enrichPolicyTemplateStream: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ modelHubCall, enrichPolicyTemplateStream }));

type StreamResult = { competitors: string[]; competitor_variations?: Record<string, string[]> };
type StreamArgs = [
  token: string,
  templateId: string,
  params: Record<string, string>,
  model: string,
  onName: (name: string) => void,
  onDone: (result: StreamResult) => void,
];

interface TestTemplate {
  id: string;
  title: string;
  llm_enrichment?: { parameter: string };
  parameters: { name: string; label: string; type: string; required: boolean; placeholder?: string }[];
}

const plainTemplate: TestTemplate = {
  id: "tpl-plain",
  title: "Базовый Redaction",
  parameters: [
    { name: "org_name", label: "Название организации", type: "string", required: true, placeholder: "e.g. Contoso" },
    { name: "note", label: "Note", type: "string", required: false, placeholder: "Необязательно note" },
  ],
};

const enrichmentTemplate: TestTemplate = {
  id: "tpl-competitor",
  title: "Competitor Blocking",
  llm_enrichment: { parameter: "brand_name" },
  parameters: [{ name: "brand_name", label: "Название вашего бренда", type: "string", required: true }],
};

const defaultProps = {
  visible: true,
  template: plainTemplate,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  accessToken: "sk-test",
};

const renderModal = (props: Partial<typeof defaultProps> = {}) =>
  renderWithProviders(<TemplateParameterModal {...defaultProps} {...props} />);

describe("TemplateParameterModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modelHubCall.mockResolvedValue({ data: [{ model_group: "gpt-5.1" }] });
  });

  it("renders nothing while closed", () => {
    renderModal({ visible: false });

    expect(screen.queryByText("Базовый Redaction")).not.toBeInTheDocument();
  });

  it("shows the template title and purpose when opened", async () => {
    renderModal();

    expect(await screen.findByText("Базовый Redaction")).toBeInTheDocument();
    expect(screen.getByText("Настройка блокировки конкурентов для вашего бренда")).toBeInTheDocument();
  });

  it("renders exactly one labelled Поле per template parameter", async () => {
    renderModal();

    // Exactly one: a plain template used to render every parameter twice, once from
    // the shared list and again from a duplicate no-enrichment branch.
    expect(await screen.findByText("Название организации")).toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("e.g. Contoso")).toHaveLength(1);
    expect(screen.getAllByPlaceholderText("Необязательно note")).toHaveLength(1);
  });

  it("keeps Continue Выключено until every Обязательно parameter is filled", async () => {
    const user = userEvent.setup();
    renderModal();

    await screen.findByText("Базовый Redaction");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("e.g. Contoso"), { target: { value: "Contoso" } });

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("hands the entered parameters Назад to the caller", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderModal({ onConfirm });

    await screen.findByText("Базовый Redaction");
    fireEvent.change(screen.getByPlaceholderText("e.g. Contoso"), { target: { value: "Contoso" } });
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0]).toEqual({ org_name: "Contoso", note: "" });
  });

  it("cancels Назад to the caller", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderModal({ onCancel });

    await screen.findByText("Базовый Redaction");
    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("offers AI discovery controls for an enrichment template", async () => {
    renderModal({ template: enrichmentTemplate });

    expect(await screen.findByText("Поиск конкурентов")).toBeInTheDocument();
    expect(screen.getByText("Название вашего бренда")).toBeInTheDocument();
    expect(screen.getByText("Выберите модель")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate Competitor Names/ })).toBeInTheDocument();
  });

  it("loads the Модель list for an enrichment template", async () => {
    renderModal({ template: enrichmentTemplate });

    await waitFor(() => {
      expect(modelHubCall).toHaveBeenCalledWith("sk-test");
    });
  });

  it("hides the Модель picker when competitors are entered manually", async () => {
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await screen.findByText("Поиск конкурентов");
    await user.click(screen.getByText("Ввести вручную"));

    await waitFor(() => {
      expect(screen.queryByText("Выберите модель")).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Generate Competitor Names/ })).not.toBeInTheDocument();
  });

  it("keeps Continue Выключено for an enrichment template until competitors exist", async () => {
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await screen.findByText("Поиск конкурентов");
    fireEvent.change(screen.getByPlaceholderText("напр. Acme Airlines"), { target: { value: "Contoso" } });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("streams discovered competitor names and enables Continue once they arrive", async () => {
    enrichPolicyTemplateStream.mockImplementation(async (...args: StreamArgs) => {
      const [, , , , onName, onDone] = args;
      onName("Northwind");
      onDone({ competitors: ["Northwind", "Fabrikam"], competitor_variations: {} });
    });
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await screen.findByText("Поиск конкурентов");
    fireEvent.change(screen.getByPlaceholderText("напр. Acme Airlines"), { target: { value: "Contoso" } });
    await user.click(screen.getAllByRole("combobox")[0]);
    const options = await screen.findAllByText("gpt-5.1");
    await user.click(options[options.length - 1]);
    await user.click(screen.getByRole("button", { name: /Generate Competitor Names/ }));

    expect(await screen.findByText("Northwind")).toBeInTheDocument();
    expect(screen.getByText("Fabrikam")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    });
  });

  it("passes the discovered competitors to the caller on Подтвердить", async () => {
    enrichPolicyTemplateStream.mockImplementation(async (...args: StreamArgs) => {
      const [, , , , , onDone] = args;
      onDone({ competitors: ["Northwind"] });
    });
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate, onConfirm });

    await screen.findByText("Поиск конкурентов");
    fireEvent.change(screen.getByPlaceholderText("напр. Acme Airlines"), { target: { value: "Contoso" } });
    await user.click(screen.getAllByRole("combobox")[0]);
    const options = await screen.findAllByText("gpt-5.1");
    await user.click(options[options.length - 1]);
    await user.click(screen.getByRole("button", { name: /Generate Competitor Names/ }));
    await screen.findByText("Northwind");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onConfirm).toHaveBeenCalledWith({ brand_name: "Contoso" }, { competitors: ["Northwind"] });
  });
});
