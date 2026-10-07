import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { convertPromptFileToJson, createPromptCall } from "@/components/networking";

import AddPromptForm from "./add_prompt_form";

vi.mock("@/components/networking", () => ({
  convertPromptFileToJson: vi.fn(),
  createPromptCall: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

const mockConvert = vi.mocked(convertPromptFileToJson);
const mockCreate = vi.mocked(createPromptCall);
const mockFromBackend = vi.mocked(toast.fromError);
const mockSuccess = vi.mocked(toast.success);

const PROMPT_ID_PLACEHOLDER = "Введите уникальный ID промпта (напр. my_prompt_id)";

const CONVERTED_JSON = { model: "gpt-4o", messages: [{ role: "Пользователь", content: "hi {{Название}}" }] };

const renderForm = () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(<AddPromptForm visible onClose={onClose} accessToken="sk-test" onSuccess={onSuccess} />);
  return { onClose, onSuccess };
};

const typePromptId = (value: string) =>
  fireEvent.change(screen.getByPlaceholderText(PROMPT_ID_PLACEHOLDER), { target: { value } });

const attachPromptFile = async (file: File) => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });
  await screen.findByText(`Выбрано: ${file.Название}`);
};

const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Создать Prompt" }));
  });
};

describe("AddPromptForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConvert.mockResolvedValue({ prompt_id: "converted_prompt_id", json_data: CONVERTED_JSON });
    mockCreate.mockResolvedValue({ status: "success" });
  });

  it("sends the converted upload as the exact Создать-prompt payload, then closes and refreshes", async () => {
    const { onClose, onSuccess } = renderForm();
    const file = new File(["Модель: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    typePromptId("my_prompt_id");
    await attachPromptFile(file);
    await submit();

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith("sk-test", {
        prompt_id: "my_prompt_id",
        litellm_params: {
          prompt_integration: "dotprompt",
          prompt_id: "converted_prompt_id",
          prompt_data: CONVERTED_JSON,
        },
        prompt_info: {
          prompt_type: "db",
        },
      });
    });
    expect(mockConvert).toHaveBeenCalledWith("sk-test", file);
    expect(mockSuccess).toHaveBeenCalledWith("Промпт создан");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("refuses to submit without an uploaded file", async () => {
    renderForm();

    typePromptId("my_prompt_id");
    await submit();

    await waitFor(() => {
      expect(mockFromBackend).toHaveBeenCalledWith("Загрузите файл .prompt");
    });
    expect(mockConvert).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("blocks submission and reports a missing ID промпта", async () => {
    renderForm();

    await submit();

    expect(await screen.findByText("Please enter a ID промпта")).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("blocks submission and reports a ID промпта with unsupported characters", async () => {
    renderForm();
    const file = new File(["Модель: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    typePromptId("my prompt!");
    await attachPromptFile(file);
    await submit();

    expect(
      await screen.findByText("ID промпта can only contain letters, numbers, underscores, and hyphens"),
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
