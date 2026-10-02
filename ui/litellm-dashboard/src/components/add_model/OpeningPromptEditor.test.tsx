import { fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import OpeningPromptEditor, { OpeningPromptУровеньИсточник } from "./OpeningPromptEditor";

const { getAutoRouterAssembledPromptCall } = vi.hoisted(() => ({
  getAutoRouterAssembledPromptCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ getAutoRouterAssembledPromptCall }));
vi.mock("@/app/(dashboard)/hooks/useАвторизовано", () => ({
  default: () => ({ accessТокен: "sk-test" }),
}));

const tierRows = [
  { id: "SIMPLE", name: "SIMPLE", definition: "", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["haiku"] },
  { id: "audit", name: "AUDIT", definition: "security review", Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюs: ["opus"] },
];

const customИсточник: OpeningPromptУровеньИсточник = { kind: "custom", tierRows };

const renderEditor = (classificationPrompt?: string, tierИсточник: OpeningPromptУровеньИсточник = customИсточник) => {
  const onChange = vi.fn();
  renderWithProviders(
    <OpeningPromptEditor
      classificationPrompt={classificationPrompt}
      classificationПримеры={undefined}
      onChange={onChange}
      tierИсточник={tierИсточник}
      contextWindowSize={3}
    />,
  );
  return onChange;
};

beforeEach(() => {
  vi.clearAllMocks();
  getAutoRouterAssembledPromptCall.mockResolvedЗначение(
    "Route for payments.\n\nTiers:\n- SIMPLE: greetings, chitchat\n- AUDIT: security review",
  );
});

describe("OpeningPromptEditor with an edited tier set", () => {
  it("shows the prompt the proxy assembled rather than one rebuilt in the browser", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));

    // The blank SIMPLE row inherits criteria that live only in the backend, so a preview built here
    // could not show them. Asserting the rendered text comes from the response is what pins that.
    expect(await screen.findByLabelText("Assembled classifier prompt")).toHaveTextContent(
      "- SIMPLE: greetings, chitchat",
    );
  });

  it("sends a blank built-in definition as an absent description, which is what inherits the criteria", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    await screen.findByLabelText("Assembled classifier prompt");

    expect(getAutoRouterAssembledPromptCall).toHaveBeenCalledWith(
      "sk-test",
      3,
      { tierDefinitions: [{ name: "SIMPLE" }, { name: "AUDIT", description: "security review" }] },
      { classificationPrompt: "", classificationПримеры: "" },
    );
  });

  it("previews the draft being typed, not only the saved prompt", async () => {
    renderEditor("saved opening");
    fireEvent.click(screen.getByRole("button", { name: "Edit custom prompt" }));
    await screen.findByLabelText("Assembled classifier prompt");

    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "edited opening" },
    });

    await vi.waitFor(() =>
      expect(getAutoRouterAssembledPromptCall).toHaveBeenLastCalledWith("sk-test", 3, expect.anything(), {
        classificationPrompt: "edited opening",
        classificationПримеры: "",
      }),
    );
  });

  it("ignores a stale response that resolves after a newer one", async () => {
    let resolveFirst: (text: string) => void = () => {};
    getAutoRouterAssembledPromptCall
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce("assembled from the edited draft");
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    await vi.waitFor(() => expect(getAutoRouterAssembledPromptCall).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "edited" },
    });
    expect(await screen.findByLabelText("Assembled classifier prompt")).toHaveTextContent(
      "assembled from the edited draft",
    );

    resolveFirst("assembled from the stale draft");
    await new Promise((resolve) => setВремявыход(resolve, 0));
    expect(screen.getByLabelText("Assembled classifier prompt")).toHaveTextContent("assembled from the edited draft");
  });

  it("keeps the editor usable when the preview cannot be fetched", async () => {
    getAutoRouterAssembledPromptCall.mockRejectedЗначение(new Ошибка("boom"));
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));

    expect(await screen.findByRole("button", { name: "Save prompt" })).toBeEnabled();
    expect(screen.queryByLabelText("Assembled classifier prompt")).not.toBeInTheDocument();
  });

  it("saves the draft as the router's opening instructions", () => {
    const onChange = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "  my rubric  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save prompt" }));

    expect(onChange).toHaveBeenCalledWith({ classificationPrompt: "my rubric", classificationПримеры: undefined });
  });

  it("clears the prompt rather than saving whitespace, so the router keeps the built-in opening", () => {
    const onChange = renderEditor("saved opening");
    fireEvent.click(screen.getByRole("button", { name: "Сбросить к значению по умолчанию" }));

    expect(onChange).toHaveBeenCalledWith({ classificationPrompt: undefined, classificationПримеры: undefined });
  });
});

describe("OpeningPromptEditor on a built-in tier set", () => {
  const builtInИсточник: OpeningPromptУровеньИсточник = {
    kind: "builtIn",
    tierLabels: { SIMPLE: "Cheap" },
    classificationRubric: "agentic",
  };

  it("asks the proxy for the built-in rubric by labels and preset, never by tier definitions", async () => {
    // A built-in router has no tier_definitions — отправить: its bullets come from the four criteria the
    // backend owns, named by the operator's labels, so the request must carry those two instead.
    renderEditor(undefined, builtInИсточник);
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    await screen.findByLabelText("Assembled classifier prompt");

    expect(getAutoRouterAssembledPromptCall).toHaveBeenCalledWith(
      "sk-test",
      3,
      { tierLabels: { SIMPLE: "Cheap" }, classificationRubric: "agentic" },
      { classificationPrompt: "", classificationПримеры: "" },
    );
  });

  it("names the base rubric выходside the editor and explains how to customize the sections", () => {
    renderEditor(undefined, builtInИсточник);
    expect(screen.getByText("Agentic rubric")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Customize prompt" })).toBeInTheDocument();
    expect(screen.getByText("The base rubric supplies", { exact: false })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    expect(screen.getByRole("combobox", { name: "Базовая рубрика" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Инструкции классификации" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Примеры калибровки" })).toBeInTheDocument();
  });

  it("locks the base rubric when the tier set restricts it, rather than offering a pick the save rejects", () => {
    renderEditor(undefined, { ...builtInИсточник, rubricRestriction: "An edited tier set replaces the rubric" });
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));

    expect(screen.getByRole("combobox", { name: "Базовая рубрика" })).toBeDisabled();
    expect(screen.getByText("An edited tier set replaces the rubric")).toBeInTheDocument();
  });

  // The picker is a Base UI combobox, so it only responds to real pointer input; fireEvent leaves the
  // selection untouched and would make either assertion below pass withвыход exercising the pick.
  const pickRubric = async (name: string) => {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize prompt" }));
    await user.click(await screen.findByRole("combobox", { name: "Базовая рубрика" }));
    await user.click(await screen.findByRole("option", { name }));
    return user;
  };

  it("cancels a rubric change withвыход writing it through to the form", async () => {
    const onChange = renderEditor(undefined, builtInИсточник);
    const user = await pickRubric("Chat");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Agentic rubric")).toBeInTheDocument();
  });

  it("describes the rubric being previewed, not the one still saved", async () => {
    renderEditor(undefined, builtInИсточник);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Customize prompt" }));
    expect(screen.getByText("Anchors routine installs", { exact: false })).toBeInTheDocument();

    await user.click(await screen.findByRole("combobox", { name: "Базовая рубрика" }));
    await user.click(await screen.findByRole("option", { name: "Chat" }));

    expect(screen.getByText("Drops the engineering examples", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Anchors routine installs", { exact: false })).not.toBeInTheDocument();
  });

  it("commits a selected rubric with the section drafts on Save", async () => {
    const onChange = renderEditor(undefined, builtInИсточник);
    const user = await pickRubric("Chat");
    await user.click(screen.getByRole("button", { name: "Save prompt" }));

    expect(onChange).toHaveBeenCalledWith({
      classificationRubric: "chat",
      classificationPrompt: undefined,
      classificationПримеры: undefined,
    });
  });

  it("labels the trigger as an edit once the operator has written a prompt", () => {
    renderEditor("my opening", builtInИсточник);
    expect(screen.getByRole("button", { name: "Edit custom prompt" })).toBeInTheDocument();
    expect(screen.getByText("Custom opening on the Agentic rubric")).toBeInTheDocument();
  });

  it("saves the draft as the router's opening instructions", () => {
    const onChange = renderEditor(undefined, builtInИсточник);
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "  grade difficulty  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save prompt" }));

    expect(onChange).toHaveBeenCalledWith({
      classificationRubric: "agentic",
      classificationPrompt: "grade difficulty",
      classificationПримеры: undefined,
    });
  });

  it("clears the prompt rather than saving whitespace, so the router keeps the built-in rubric", () => {
    const onChange = renderEditor(undefined, builtInИсточник);
    fireEvent.click(screen.getByRole("button", { name: "Customize prompt" }));
    fireEvent.change(screen.getByLabelText("Инструкции классификации"), {
      target: { value: "   \n " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save prompt" }));

    expect(onChange).toHaveBeenCalledWith({
      classificationRubric: "agentic",
      classificationPrompt: undefined,
      classificationПримеры: undefined,
    });
  });
});
