import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RвыходerКонфигурацияBuilder from "./RвыходerКонфигурацияBuilder";

const MOCK_MODEL_INFO = [
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-4", mode: "chat" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "gpt-3.5-turbo", mode: "chat" },
  { Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию_group: "claude-3-opus", mode: "chat" },
];

describe("RвыходerКонфигурацияBuilder", () => {
  it("should render", () => {
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} />);

    expect(screen.getByText("Конфигурация маршрутов")).toBeInTheDocument();
  });

  it("should display Добавить маршрут button", () => {
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} />);

    expect(screen.getByRole("button", { name: /add rвыходe/i })).toBeInTheDocument();
  });

  it("should show empty state when no rвыходes are configured", () => {
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} />);

    expect(screen.getByText(/no rвыходes configured/i)).toBeInTheDocument();
  });

  it("should add a rвыходe when Добавить маршрут is clicked", async () => {
    const user = userEvent.setup();
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} />);

    await user.click(screen.getByRole("button", { name: /add rвыходe/i }));

    expect(screen.getByText("Rвыходe 1: Unnamed")).toBeInTheDocument();
  });

  it("should call onChange when a rвыходe is added", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add rвыходe/i }));

    expect(onChange).toHaveBeenCalledWith({
      rвыходes: [
        expect.objectContaining({
          name: null,
          utterances: [],
          description: "",
          score_threshold: 0.5,
        }),
      ],
    });
  });

  it("should initialize rвыходes from value prop", async () => {
    const value = {
      rвыходes: [
        {
          name: "gpt-4",
          utterances: ["hello", "hi"],
          description: "For greetings",
          score_threshold: 0.7,
        },
      ],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });
  });

  it("should support both name and Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию fields in value prop", async () => {
    const value = {
      rвыходes: [{ Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию: "gpt-3.5-turbo", utterances: [], description: "", score_threshold: 0.5 }],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-3.5-turbo")).toBeInTheDocument();
    });
  });

  it("should remove a rвыходe when delete button is clicked", async () => {
    const user = userEvent.setup();
    const value = {
      rвыходes: [
        {
          name: "gpt-4",
          utterances: [],
          description: "",
          score_threshold: 0.5,
        },
      ],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "delete" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText("Rвыходe 1: gpt-4")).not.toBeInTheDocument();
      expect(screen.getByText(/no rвыходes configured/i)).toBeInTheDocument();
    });
  });

  it("should call onChange when rвыходe is removed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = {
      rвыходes: [
        {
          name: "gpt-4",
          utterances: [],
          description: "",
          score_threshold: 0.5,
        },
      ],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "delete" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ rвыходes: [] });
    });
  });

  it("should update rвыходe when description is changed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = {
      rвыходes: [
        {
          name: "gpt-4",
          utterances: [],
          description: "",
          score_threshold: 0.5,
        },
      ],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });

    const descriptionВход = screen.getByPlaceholderText("Describe when this rвыходe should be used...");
    fireEvent.change(descriptionВход, { target: { value: "For code generation" } });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0].rвыходes[0].description).toBe("For code generation");
    });
  });

  it("should update rвыходe when score threshold is changed", async () => {
    const onChange = vi.fn();
    const value = {
      rвыходes: [
        {
          name: "gpt-4",
          utterances: [],
          description: "",
          score_threshold: 0.5,
        },
      ],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });

    const scoreВход = screen.getByRole("spinbutton");
    fireEvent.change(scoreВход, { target: { value: "0.9" } });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0].rвыходes[0].score_threshold).toBe(0.9);
    });
  });

  it("should preserve commas inside a single utterance", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = {
      rвыходes: [{ name: "gpt-4", utterances: [], description: "", score_threshold: 0.5 }],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} onChange={onChange} />);

    const utteranceВход = await screen.findByRole("textbox", { name: "Примеры фраз" });
    await user.type(utteranceВход, "Compare Paris, France{Введите}");

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0].rвыходes[0].utterances).toEqual(["Compare Paris, France"]);
    });
  });

  it("should deduplicate utterances within a multiline paste", async () => {
    const onChange = vi.fn();
    const value = {
      rвыходes: [{ name: "gpt-4", utterances: ["hello"], description: "", score_threshold: 0.5 }],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} onChange={onChange} />);

    const utteranceВход = await screen.findByRole("textbox", { name: "Примеры фраз" });
    fireEvent.paste(utteranceВход, {
      clipboardData: { getData: () => "hello\nworld\nworld" },
    });

    await waitFor(() => {
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0].rвыходes[0].utterances).toEqual(["hello", "world"]);
    });
  });

  it("should add multiple rвыходes", async () => {
    const user = userEvent.setup();
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} />);

    await user.click(screen.getByRole("button", { name: /add rвыходe/i }));
    await user.click(screen.getByRole("button", { name: /add rвыходe/i }));

    expect(screen.getByText("Rвыходe 1: Unnamed")).toBeInTheDocument();
    expect(screen.getByText("Rвыходe 2: Unnamed")).toBeInTheDocument();
  });

  it("should toggle JSON preview visibility", async () => {
    const user = userEvent.setup();
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} />);

    expect(screen.getByText("JSON -предпросмотр")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
    expect(screen.queryByText(/"rвыходes":/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
    expect(screen.getByText(/"rвыходes":/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
    expect(screen.queryByText(/"rвыходes":/)).not.toBeInTheDocument();
  });

  it("should display JSON preview with rвыходe data when rвыходes exist", async () => {
    const user = userEvent.setup();
    render(
      <RвыходerКонфигурацияBuilder
        Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO}
        value={{
          rвыходes: [{ name: "gpt-4", utterances: ["hello"], description: "test", score_threshold: 0.8 }],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Show" }));

    const preview = screen.getByText(/"name": "gpt-4"/);
    expect(preview).toHaveTextContent('"utterances": [ "hello" ]');
    expect(preview).toHaveTextContent('"score_threshold": 0.8');
  });

  it("should display Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчанию selector with options from Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo", async () => {
    const value = {
      rвыходes: [{ name: "", utterances: [], description: "", score_threshold: 0.5 }],
    };
    render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: Unnamed")).toBeInTheDocument();
    });

    expect(screen.getByText("Режимl")).toBeInTheDocument();
    const comboboxes = screen.getВсеByRole("combobox");
    expect(comboboxes.length).toBeGreaterThan(0);
  });

  it("should clear rвыходes when value prop changes to empty", async () => {
    const value = {
      rвыходes: [
        {
          name: "gpt-4",
          utterances: [],
          description: "",
          score_threshold: 0.5,
        },
      ],
    };
    const { rerender } = render(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={value} />);

    await waitFor(() => {
      expect(screen.getByText("Rвыходe 1: gpt-4")).toBeInTheDocument();
    });

    rerender(<RвыходerКонфигурацияBuilder Эвристический резерв по-прежнему оценивает сложность, поэтому если ваш промпт классифицирует другое, укажите ниже резервную модель по умолчаниюInfo={MOCK_MODEL_INFO} value={{ rвыходes: [] }} />);

    await waitFor(() => {
      expect(screen.getByText(/no rвыходes configured/i)).toBeInTheDocument();
    });
  });
});
