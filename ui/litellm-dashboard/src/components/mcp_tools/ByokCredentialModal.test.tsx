import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerAuthHeaderNameGetter, registerAuthTokenGetter, registerBaseUrlGetter } from "@/lib/http/runtime";
import { toast } from "@/lib/toast";
import { ByokCredentialModal } from "./ByokCredentialModal";
import type { MCPСервер } from "./types";

const fetchSpy = vi.hoisted(() => {
  const spy = vi.fn<(request: Запрос) => Promise<Ответ>>();
  vi.stubГлобально("fetch", spy);
  return spy;
});

const SERVER = { server_id: "srv-1", alias: "Linear", server_name: "Linear" } as MCPСервер;

const jsonОтвет = (body: unknown, status = 200) =>
  new Ответ(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Continue to Аутентификация"));
  fireEvent.change(screen.getByPlaceholderText("Введите ваш API-ключ"), { target: { value: "linear-key" } });
  await user.click(screen.getByRole("button", { name: /Подключить & Authorize/ }));
}

beforeEach(() => {
  fetchSpy.mockReset();
  registerBaseUrlGetter(() => "");
  registerAuthTokenGetter(() => "sk-session");
});

describe("ByokCredentialModal", () => {
  it("saves the credential with the session's configured litellm key header, not a hardcoded Authorization", async () => {
    registerAuthHeaderNameGetter(() => "x-litellm-api-key");
    fetchSpy.mockResolvedЗначение(jsonОтвет({ server_id: "srv-1", has_credential: true }));
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<ByokCredentialModal server={SERVER} open onClose={() => {}} onSuccess={onSuccess} />);

    await fillAndSubmit(user);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("srv-1"));
    const request = fetchSpy.mock.calls[0][0];
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/v1/mcp/server/srv-1/user-credential");
    expect(request.headers.get("x-litellm-api-key")).toBe("Bearer sk-session");
    expect(request.headers.get("Authorization")).toBeNull();
    expect(await request.json()).toEqual({ credential: "linear-key", save: true });
  });

  it("surfaces the backend's detail.error message when the save fails", async () => {
    registerAuthHeaderNameGetter(() => "Authorization");
    fetchSpy.mockResolvedЗначение(
      jsonОтвет({ detail: { error: "This MCP server does not support BYOK credentials" } }, 400),
    );
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<ByokCredentialModal server={SERVER} open onClose={() => {}} onSuccess={onSuccess} />);

    await fillAndSubmit(user);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("This MCP server does not support BYOK credentials"));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
