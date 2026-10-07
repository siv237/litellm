import { fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import OpeningPromptEditor, { OpeningPromptTierSource } from "./OpeningPromptEditor";

const { getAutoRouterAssembledPromptCall } = vi.hoisted(() => ({
  getAutoRouterAssembledPromptCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ getAutoRouterAssembledPromptCall }));
vi.mock("@/Приложение/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessToken: "sk-test" }),
}));

const tierRows = [
  { id: "SIMPLE", name: "SIMPLE", definition: "", models: ["haiku"] },
  { id: "audit", name: "AUDIT", definition: "Безопасность review", models: ["opus"] },
];

const customSource: OpeningPromptTierSource = { kind: "custom", tierRows };

const renderEditor = (classificationPrompt?: string, tierSource: OpeningPromptTierSource = customSource) => {
  const onChange = vi.fn();
  renderWithProviders(
    <OpeningPromptEditor
      classificationPrompt={classificationPrompt}
      classificationExamples={undefined}
      onChange={onChange}
      tierSource={tierSource}
      contextWindowSize={3}
    />,
  );
  return onChange;
};

beforeEach(() => {
  vi.clearAllMocks();
  getAutoRouterAssembledPromptCall.mockResolvedValue(
    "Route for payments.\n\nУровеньs:\n- SIMPLE: greetings, chitchat\n- AUDIT: Безопасность review",
  );
});

describe("OpeningPromptEditor with an edited Уровень set", () => {
  it("shows the prompt the proxy assembled rather than one rebuilt in the browser", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));

    // The blank SIMPLE row inherits criteria that live only in the backend, so a preview built here
    // could not show them. Asserting the rendered text comes from the response is what pins that.
    expect(await screen.findByLabelText("Собранный промпт классификатора")).toHaveTextContent(
      "- SIMPLE: greetings, chitchat",
    );
  });

  it("sends a blank built-in definition as an absent Описание, which is what inherits the criteria", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    await screen.findByLabelText("Собранный промпт классификатора");

    expect(getAutoRouterAssembledPromptCall).toHaveBeenCalledWith(
      "sk-test",
      3,
      { tierDefinitions: [{ name: "SIMPLE" }, { name: "AUDIT", description: "Безопасность review" }] },
      { classificationPrompt: "", classificationExamples: "" },
    );
  });

  it("previews the Черновик being typed, not only the saved prompt", async () => {
    renderEditor("saved opening");
    fireEvent.click(screen.getByRole("button", { name: "Изменить custom prompt" }));
    await screen.findByLabelText("Собранный промпт классификатора");

    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "edited opening" },
    });

    await vi.waitFor(() =>
      expect(getAutoRouterAssembledPromptCall).toHaveBeenLastCalledWith("sk-test", 3, expect.anything(), {
        classificationPrompt: "edited opening",
        classificationExamples: "",
      }),
    );
  });

  it("ignores a stale Ответ that resolves after a newer one", async () => {
    let resolveFirst: (text: string) => void = () => {};
    getAutoRouterAssembledPromptCall
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce("assembled from the edited Черновик");
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    await vi.waitFor(() => expect(getAutoRouterAssembledPromptCall).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "edited" },
    });
    expect(await screen.findByLabelText("Собранный промпт классификатора")).toHaveTextContent(
      "assembled from the edited Черновик",
    );

    resolveFirst("assembled from the stale Черновик");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByLabelText("Собранный промпт классификатора")).toHaveTextContent("assembled from the edited Черновик");
  });

  it("keeps the editor usable when the Предпросмотр cannot be fetched", async () => {
    getAutoRouterAssembledPromptCall.mockRejectedValue(new Error("boom"));
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));

    expect(await screen.findByRole("button", { name: "Сохранить промпт" })).toBeEnabled();
    expect(screen.queryByLabelText("Собранный промпт классификатора")).not.toBeInTheDocument();
  });

  it("saves the Черновик as the router's opening Инструкции", () => {
    const onChange = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "  my rubric  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить промпт" }));

    expect(onChange).toHaveBeenCalledWith({ classificationPrompt: "my rubric", classificationExamples: undefined });
  });

  it("clears the prompt rather than saving whitespace, so the router keeps the built-in opening", () => {
    const onChange = renderEditor("saved opening");
    fireEvent.click(screen.getByRole("button", { name: "Сбросить к значению по умолчанию" }));

    expect(onChange).toHaveBeenCalledWith({ classificationPrompt: undefined, classificationExamples: undefined });
  });
});

describe("OpeningPromptEditor on a built-in Уровень set", () => {
  const builtInSource: OpeningPromptTierSource = {
    kind: "builtIn",
    tierLabels: { SIMPLE: "Cheap" },
    classificationRubric: "agentic",
  };

  it("asks the proxy for the built-in rubric by labels and preset, never by Уровень definitions", async () => {
    // A built-in router has no tier_definitions to send: its bullets come from the four criteria the
    // backend owns, named by the operator's labels, so the request must carry those two instead.
    renderEditor(undefined, builtInSource);
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    await screen.findByLabelText("Собранный промпт классификатора");

    expect(getAutoRouterAssembledPromptCall).toHaveBeenCalledWith(
      "sk-test",
      3,
      { tierLabels: { SIMPLE: "Cheap" }, classificationRubric: "agentic" },
      { classificationPrompt: "", classificationExamples: "" },
    );
  });

  it("names the Базовая рубрика outside the editor and explains how to customize the sections", () => {
    renderEditor(undefined, builtInSource);
    expect(screen.getByText("Agentic rubric")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Customize prompt" })).toBeInTheDocument();
    expect(screen.getByText("The Базовая рубрика supplies", { exact: false })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    expect(screen.getByRole("combobox", { name: "Базовая рубрика" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Инструкции классификации" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Примеры калибровки" })).toBeInTheDocument();
  });

  it("locks the Базовая рубрика when the Уровень set restricts it, rather than offering a pick the Сохранить rejects", () => {
    renderEditor(undefined, { ...builtInSource, rubricRestriction: "An edited Уровень set replaces the rubric" });
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));

    expect(screen.getByRole("combobox", { name: "Базовая рубрика" })).toBeDisabled();
    expect(screen.getByText("An edited Уровень set replaces the rubric")).toBeInTheDocument();
  });

  // The picker is a Base UI combobox, so it only responds to real pointer input; fireEvent leaves the
  // selection untouched and would make either assertion below pass without exercising the pick.
  const pickRubric = async (name: string) => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize prompt" }));
    await user.click(await screen.findByRole("combobox", { name: "Базовая рубрика" }));
    await user.click(await screen.findByRole("option", { name }));
    return user;
  };

  it("cancels a rubric change without writing it through to the form", async () => {
    const onChange = renderEditor(undefined, builtInSource);
    const user = await pickRubric("Chat");
    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Agentic rubric")).toBeInTheDocument();
  });

  it("describes the rubric being previewed, not the one still saved", async () => {
    renderEditor(undefined, builtInSource);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize prompt" }));
    expect(screen.getByText("Anchors routine installs", { exact: false })).toBeInTheDocument();

    await user.click(await screen.findByRole("combobox", { name: "Базовая рубрика" }));
    await user.click(await screen.findByRole("option", { name: "Chat" }));

    expect(screen.getByText("Drops the engineering Примеры", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Anchors routine installs", { exact: false })).not.toBeInTheDocument();
  });

  it("commits a selected rubric with the section drafts on Сохранить", async () => {
    const onChange = renderEditor(undefined, builtInSource);
    const user = await pickRubric("Chat");
    await user.click(screen.getByRole("button", { name: "Сохранить промпт" }));

    expect(onChange).toHaveBeenCalledWith({
      classificationRubric: "chat",
      classificationPrompt: undefined,
      classificationExamples: undefined,
    });
  });

  it("labels the trigger as an Изменить once the operator has written a prompt", () => {
    renderEditor("my opening", builtInSource);
    expect(screen.getByRole("button", { name: "Изменить custom prompt" })).toBeInTheDocument();
    expect(screen.getByText("Custom opening on the Agentic rubric")).toBeInTheDocument();
  });

  it("saves the Черновик as the router's opening Инструкции", () => {
    const onChange = renderEditor(undefined, builtInSource);
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "  grade difficulty  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить промпт" }));

    expect(onChange).toHaveBeenCalledWith({
      classificationRubric: "agentic",
      classificationPrompt: "grade difficulty",
      classificationExamples: undefined,
    });
  });

  it("clears the prompt rather than saving whitespace, so the router keeps the built-in rubric", () => {
    const onChange = renderEditor(undefined, builtInSource);
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "   \n " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить промпт" }));

    expect(onChange).toHaveBeenCalledWith({
      classificationRubric: "agentic",
      classificationPrompt: undefined,
      classificationExamples: undefined,
    });
  });
});
