import React from "react";
import { fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import MCPToolArgumentsForm, { MCPToolArgumentsFormRef } from "./MCPToolArgumentsForm";
import { MCPTool, InputSchema } from "./types";

const toolWith = (schema: InputSchema | string): MCPTool =>
  ({ name: "demo_tool", description: "", inputSchema: schema, mcp_info: {} }) as unknown as MCPTool;

const renderForm = (schema: InputSchema | string) => {
  const ref = React.createRef<MCPToolArgumentsFormRef>();
  renderWithProviders(<MCPToolArgumentsForm ref={ref} tool={toolWith(schema)} />);
  return ref;
};

const submit = async (ref: React.RefObject<MCPToolArgumentsFormRef | null>) => ref.current!.getSubmitValues();

const submitError = async (ref: React.RefObject<MCPToolArgumentsFormRef | null>) => {
  try {
    await ref.current!.getSubmitValues();
    return null;
  } catch (error) {
    return error;
  }
};

describe("MCPToolArgumentsForm", () => {
  it("keeps dotted arguments separate from a same-prefix object and converts their values", async () => {
    const ref = renderForm({
      type: "object",
      properties: {
        "filter.category": { type: "string" },
        filter: { type: "object" },
        "page.limit": { type: "integer" },
        query: { type: "string" },
      },
      required: ["filter.category"],
    });

    fireEvent.change(screen.getByRole("textbox", { name: "filter.category *" }), {
      target: { value: "invoices" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "filter" }), {
      target: { value: '{"category":"receipts","Метаданные":{"region":"eu"}}' },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "page.limit" }), { target: { value: "7" } });
    fireEvent.change(screen.getByRole("textbox", { name: "query" }), { target: { value: "September" } });

    const expected = {
      "filter.category": "invoices",
      filter: { category: "receipts", metadata: { region: "eu" } },
      "page.limit": 7,
      query: "September",
    };
    await expect(submit(ref)).resolves.toEqual(expected);
  });

  it("shows Обязательно validation on the literal dotted Поле and accepts a correction", async () => {
    const ref = renderForm({
      type: "object",
      properties: { "filter.category": { type: "string" } },
      required: ["filter.category"],
    });

    expect(await submitError(ref)).toEqual({
      errorFields: [{ name: ["filter.category"], errors: ["Please enter filter.category"] }],
    });
    expect(await screen.findByText("Please enter filter.category")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "filter.category *" })).toHaveAttribute("aria-invalid", "Истина");

    fireEvent.change(screen.getByRole("textbox", { name: "filter.category *" }), {
      target: { value: "invoices" },
    });
    await expect(submit(ref)).resolves.toEqual({ "filter.category": "invoices" });
  });

  it("validates JSON for dotted arguments inside params and preserves their literal names", async () => {
    const ref = renderForm({
      type: "object",
      properties: {
        params: {
          type: "object",
          properties: { "filter.options": { type: "object" } },
          required: ["filter.options"],
        },
      },
      required: [],
    });
    const field = screen.getByRole("textbox", { name: "filter.options *" });
    fireEvent.change(field, { target: { value: "invalid" } });

    expect(await submitError(ref)).toEqual({
      errorFields: [{ name: ["filter.options"], errors: ["Invalid JSON"] }],
    });
    expect(await screen.findByText("Invalid JSON")).toBeInTheDocument();

    fireEvent.change(field, { target: { value: '{"region":"eu"}' } });
    await expect(submit(ref)).resolves.toEqual({ params: { "filter.options": { region: "eu" } } });
  });

  it("resets dotted defaults and positional values when the selected tool changes", async () => {
    const ref = React.createRef<MCPToolArgumentsFormRef>();
    const { rerender } = renderWithProviders(
      <MCPToolArgumentsForm
        ref={ref}
        tool={toolWith({
          type: "object",
          properties: { "filter.category": { type: "string", default: "invoices" } },
          required: [],
        })}
      />,
    );
    expect(screen.getByRole("textbox", { name: "filter.category" })).toHaveValue("invoices");
    await expect(submit(ref)).resolves.toEqual({ "filter.category": "invoices" });
    fireEvent.change(screen.getByRole("textbox", { name: "filter.category" }), {
      target: { value: "edited" },
    });
    await expect(submit(ref)).resolves.toEqual({ "filter.category": "edited" });

    rerender(
      <MCPToolArgumentsForm
        ref={ref}
        tool={{
          ...toolWith({
            type: "object",
            properties: {
              query: { type: "string", default: "new tool" },
              "filter.category": { type: "string", default: "receipts" },
            },
            required: [],
          }),
          name: "another_tool",
        }}
      />,
    );
    expect(screen.getByRole("textbox", { name: "filter.category" })).toHaveValue("receipts");
    await expect(submit(ref)).resolves.toEqual({ query: "new tool", "filter.category": "receipts" });
  });

  it("returns typed values for a string, integer, number and boolean Поле", async () => {
    const user = userEvent.setup();
    const ref = renderForm({
      type: "object",
      properties: {
        city: { type: "string" },
        count: { type: "integer" },
        ratio: { type: "number" },
        verbose: { type: "boolean" },
      },
      required: [],
    });

    await user.type(screen.getByPlaceholderText("Enter city"), "berlin");
    await user.clear(screen.getByPlaceholderText("Enter count"));
    await user.type(screen.getByPlaceholderText("Enter count"), "7");
    await user.clear(screen.getByPlaceholderText("Enter ratio"));
    await user.type(screen.getByPlaceholderText("Enter ratio"), "1.5");

    const expected = { city: "berlin", count: 7, ratio: 1.5, verbose: false };
    await expect(submit(ref)).resolves.toEqual(expected);
  });

  it("truncates a fractional Значение for an integer Поле", async () => {
    const user = userEvent.setup();
    const ref = renderForm({ type: "object", properties: { count: { type: "integer" } }, required: [] });

    await user.clear(screen.getByPlaceholderText("Enter count"));
    await user.type(screen.getByPlaceholderText("Enter count"), "9.8");

    await expect(submit(ref)).resolves.toEqual({ count: 9 });
  });

  it("drops an empty Необязательно string rather than sending an empty Значение", async () => {
    const ref = renderForm({
      type: "object",
      properties: { city: { type: "string" }, country: { type: "string" } },
      required: [],
    });

    await expect(submit(ref)).resolves.toEqual({});
  });

  it("parses a JSON object Поле into an object", async () => {
    const user = userEvent.setup();
    const ref = renderForm({ type: "object", properties: { filters: { type: "object" } }, required: [] });

    const textarea = screen.getByPlaceholderText("Enter JSON object for Фильтры");
    await user.clear(textarea);
    await user.type(textarea, '{{"a": 1}');

    await expect(submit(ref)).resolves.toEqual({ filters: { a: 1 } });
  });

  it("parses a JSON array Поле into an array", async () => {
    const user = userEvent.setup();
    const ref = renderForm({ type: "object", properties: { tags: { type: "array" } }, required: [] });

    const textarea = screen.getByPlaceholderText("Enter JSON array for Теги");
    await user.clear(textarea);
    await user.type(textarea, '[["x","y"]');

    await expect(submit(ref)).resolves.toEqual({ tags: ["x", "y"] });
  });

  it("rejects and reports invalid JSON for an object Поле", async () => {
    const user = userEvent.setup();
    const ref = renderForm({ type: "object", properties: { filters: { type: "object" } }, required: [] });

    const textarea = screen.getByPlaceholderText("Enter JSON object for Фильтры");
    await user.clear(textarea);
    await user.type(textarea, "not json");

    expect(await submitError(ref)).not.toBeNull();
    expect(await screen.findByText("Invalid JSON")).toBeInTheDocument();
  });

  it("rejects a JSON array typed into an object Поле", async () => {
    const user = userEvent.setup();
    const ref = renderForm({ type: "object", properties: { filters: { type: "object" } }, required: [] });

    const textarea = screen.getByPlaceholderText("Enter JSON object for Фильтры");
    await user.clear(textarea);
    await user.type(textarea, "[[1,2]");

    expect(await submitError(ref)).not.toBeNull();
    expect(await screen.findByText("Please enter a JSON object")).toBeInTheDocument();
  });

  it("rejects an empty Обязательно Поле with the per-Поле Сообщение", async () => {
    const ref = renderForm({ type: "object", properties: { city: { type: "string" } }, required: ["city"] });

    expect(await submitError(ref)).not.toBeNull();
    expect(await screen.findByText("Please enter city")).toBeInTheDocument();
  });

  it("rejects with a non-Ошибка carrying ОшибкаПолеs, which is what the caller branches on", async () => {
    const ref = renderForm({ type: "object", properties: { city: { type: "string" } }, required: ["city"] });

    const error = await submitError(ref);
    expect(error).not.toBeInstanceOf(Error);
    expect(error).toMatchObject({ errorFields: [{ name: ["city"], errors: ["Please enter city"] }] });
  });

  it("wraps values under params when the schema nests them", async () => {
    const user = userEvent.setup();
    const ref = renderForm({
      type: "object",
      properties: {
        params: { type: "object", properties: { city: { type: "string" } }, required: [] },
      },
      required: [],
    });

    await user.type(screen.getByPlaceholderText("Enter city"), "oslo");

    await expect(submit(ref)).resolves.toEqual({ params: { city: "oslo" } });
  });

  it("renders a single Вход Поле when the schema is only a string", async () => {
    const user = userEvent.setup();
    const ref = renderForm("tool_input_schema");

    await user.type(screen.getByPlaceholderText("Введите входные данные для инструмента"), "hello");

    await expect(submit(ref)).resolves.toEqual({ input: "hello" });
  });

  it("reports the Обязательно Сообщение for the string-schema Вход", async () => {
    const ref = renderForm("tool_input_schema");

    expect(await submitError(ref)).not.toBeNull();
    expect(await screen.findByText("Please Введите входные данные для инструмента")).toBeInTheDocument();
  });

  it("seeds a schema default and sends it untouched", async () => {
    const ref = renderForm({
      type: "object",
      properties: { city: { type: "string", default: "paris" }, count: { type: "integer", default: 3 } },
      required: [],
    });

    await expect(submit(ref)).resolves.toEqual({ city: "paris", count: 3 });
  });

  it("shows the empty state and submits nothing when the schema has Нет properties", async () => {
    const ref = renderForm({ type: "object" } as InputSchema);

    expect(screen.getByText("Для этого инструмента параметры не требуются.")).toBeInTheDocument();
    await expect(submit(ref)).resolves.toEqual({});
  });
});

it("should distinguish an unset enum from empty string and retain explicit Ложь", async () => {
  const user = userEvent.setup();
  const ref = renderForm({
    type: "object",
    properties: {
      mode: { type: "string", enum: ["", "fast"], default: "fast" },
      active: { type: "boolean", default: true },
    },
  });
  await user.click(screen.getByRole("combobox", { name: "Режим" }));
  await user.click(await screen.findByRole("option", { name: "Выбрать Режим" }));
  await user.click(screen.getByRole("combobox", { name: "Активный" }));
  await user.click(await screen.findByRole("option", { name: "Ложь" }));
  await expect(submit(ref)).resolves.toEqual({ active: false });
  await user.click(screen.getByRole("combobox", { name: "Режим" }));
  await user.click(await screen.findByRole("option", { name: "Empty string" }));
  expect(screen.getByRole("combobox", { name: "Режим" })).toHaveTextContent("Empty string");
  await expect(submit(ref)).resolves.toEqual({ mode: "", active: false });
});
