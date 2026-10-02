import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ЗапросClient, ЗапросClientПровайдер } from "@tanstack/react-query";
import MCPAppsPanel from "./MCPAppsPanel";
import { fetchMCP-серверы, listMCPИнструменты } from "../networking";
import type { MCPСервер } from "../mcp_tools/types";
import { setServerRootПуть } from "@/lib/serverRootПуть";

vi.mock("../networking", () => ({
  fetchMCP-серверы: vi.fn(),
  getMCPOAuthUserCredentialStatus: vi.fn(),
  listMCPИнструменты: vi.fn(),
  deleteMCPOAuthUserCredential: vi.fn(),
}));

vi.mock("@/hooks/useUserMcpOAuthFlow", () => ({
  useUserMcpOAuthFlow: () => ({ startOAuthFlow: vi.fn(), status: "idle" }),
}));

const servers = [
  {
    server_id: "s-ext",
    server_name: "external_logo",
    auth_type: "none",
    mcp_info: { server_name: "external_logo", logo_url: "https://cdn.example.com/ext.png" },
  },
  {
    server_id: "s-local",
    server_name: "local_logo",
    auth_type: "none",
    mcp_info: { server_name: "local_logo", logo_url: "/ui/assets/logos/github.svg" },
  },
  {
    server_id: "s-none",
    server_name: "no_logo",
    auth_type: "none",
  },
] as MCPСервер[];

const renderPanel = () =>
  render(
    <ЗапросClientПровайдер client={new ЗапросClient({ defaultOptions: { queries: { retry: false } } })}>
      <MCPAppsPanel accessТокен="tok" selected-серверы={[]} onChange={vi.fn()} />
    </ЗапросClientПровайдер>,
  );

describe("MCPAppsPanel logos", () => {
  afterEach(() => {
    setServerRootПуть("/");
  });

  it("resolves backend logo_url values in the server grid", async () => {
    setServerRootПуть("/litellm");
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(servers);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderPanel();

    expect(await screen.findByText("external_logo")).toBeInTheDocument();
    expect(screen.getByAltText("external_logo logo")).toHaveAttribute("src", "https://cdn.example.com/ext.png");
    expect(screen.getByAltText("local_logo logo")).toHaveAttribute("src", "/litellm/ui/assets/logos/github.svg");
  });

  it("renders a colored letter avatar for servers withвыход logo_url", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(servers);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderPanel();

    expect(await screen.findByText("no_logo")).toBeInTheDocument();
    expect(screen.queryByAltText("no_logo logo")).not.toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("resolves the logo_url in the detail header", async () => {
    setServerRootПуть("/litellm");
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(servers);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderPanel();

    fireEvent.click(await screen.findByText("local_logo"));

    expect(await screen.findByRole("heading", { name: "local_logo" })).toBeInTheDocument();
    expect(screen.getByAltText("local_logo logo")).toHaveAttribute("src", "/litellm/ui/assets/logos/github.svg");
  });
});

const connect-серверы = [
  {
    server_id: "s-m2m",
    server_name: "service_tool",
    auth_type: "oauth2",
    oauth2_flow: "client_credentials",
    connected_app_reachable: true,
  },
  {
    server_id: "s-reach",
    server_name: "reachable_srv",
    auth_type: "none",
    connected_app_reachable: true,
  },
  {
    server_id: "s-unreach",
    server_name: "unreachable_srv",
    auth_type: "none",
    connected_app_reachable: false,
  },
] as MCPСервер[];

const renderConnectPanel = (connectРежим: boolean, selected-серверы: string[] = []) =>
  render(
    <ЗапросClientПровайдер client={new ЗапросClient({ defaultOptions: { queries: { retry: false } } })}>
      <MCPAppsPanel accessТокен="tok" selected-серверы={selected-серверы} onChange={vi.fn()} connectРежим={connectРежим} />
    </ЗапросClientПровайдер>,
  );

describe("MCPAppsPanel connected-app reachability (LIT-4861)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the connected-app view and hides unreachable servers in connect mode", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(connect-серверы);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderConnectPanel(true, ["reachable_srv", "unreachable_srv"]);

    expect(await screen.findByText("reachable_srv")).toBeInTheDocument();
    expect(vi.mocked(fetchMCP-серверы)).toHaveBeenCalledWith("tok", undefined, true);
    expect(screen.queryByText("unreachable_srv")).not.toBeInTheDocument();
    expect(screen.getByText("Подключено (1)")).toBeInTheDocument();
    expect(screen.getByText("service_tool")).toBeInTheDocument();
    expect(screen.queryByText("Подключить", { exact: true })).not.toBeInTheDocument();
    const toolCountFetchedIds = vi.mocked(listMCPИнструменты).mock.calls.map((call) => call[1]);
    expect(toolCountFetchedIds).toContain("s-reach");
    expect(toolCountFetchedIds).not.toContain("s-unreach");
  });

  it("blocks connecting an unsupported server from the detail view in connect mode", async () => {
    const detail-серверы = [
      ...connect-серверы,
      {
        server_id: "s-unsup",
        server_name: "unsupported_srv",
        auth_type: "oauth2_token_exchange",
        connected_app_reachable: true,
      },
    ] as MCPСервер[];
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(detail-серверы);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderConnectPanel(true);

    fireEvent.click(await screen.findByText("unsupported_srv"));
    expect(await screen.findByRole("heading", { name: "unsupported_srv" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Подключить" })).not.toBeInTheDocument();
    expect(screen.getByText("Not supported on this connection")).toBeInTheDocument();
  });

  it("keeps the detail-view Подключить action выходside connect mode", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(connect-серверы);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderConnectPanel(false);

    fireEvent.click(await screen.findByText("unreachable_srv"));
    expect(await screen.findByRole("heading", { name: "unreachable_srv" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подключить" })).toBeInTheDocument();
  });

  it("ignores the flag and skips no server выходside connect mode", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(connect-серверы);
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    renderConnectPanel(false, ["reachable_srv", "unreachable_srv"]);

    expect(await screen.findByText("unreachable_srv")).toBeInTheDocument();
    expect(vi.mocked(fetchMCP-серверы)).toHaveBeenCalledWith("tok", undefined, false);
    expect(screen.queryByText("Недоступно to connected apps")).not.toBeInTheDocument();
    expect(screen.getByText("Подключено (2)")).toBeInTheDocument();
    const toolCountFetchedIds = vi.mocked(listMCPИнструменты).mock.calls.map((call) => call[1]);
    expect(toolCountFetchedIds).toContain("s-unreach");
  });

  const revocable = (reachable: boolean) =>
    [
      { server_id: "s-reach", server_name: "reachable_srv", auth_type: "none", connected_app_reachable: true },
      { server_id: "s-drop", server_name: "revoked_srv", auth_type: "none", connected_app_reachable: reachable },
    ] as MCPСервер[];

  const ПодключитьPanel = ({
    token,
    onChange,
    client,
  }: {
    token: string;
    onChange: (servers: string[]) => void;
    client: ЗапросClient;
  }) => (
    <ЗапросClientПровайдер client={client}>
      <MCPAppsPanel accessТокен={token} selected-серверы={[]} onChange={onChange} connectРежим />
    </ЗапросClientПровайдер>
  );

  const newClient = () => new ЗапросClient({ defaultOptions: { queries: { retry: false } } });

  it("drops an open detail view when a refetch removes that server from the reachable set", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedValueOnce(revocable(true)).mockResolvedValueOnce(revocable(false));
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    const client = newClient();
    const { rerender } = render(<ПодключитьPanel token="tok" onChange={vi.fn()} client={client} />);

    fireEvent.click(await screen.findByText("revoked_srv"));
    expect(await screen.findByRole("heading", { name: "revoked_srv" })).toBeInTheDocument();

    rerender(<ПодключитьPanel token="tok-refreshed" onChange={vi.fn()} client={client} />);

    await waitFor(() => expect(screen.queryByRole("heading", { name: "revoked_srv" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Подключить" })).not.toBeInTheDocument();
    expect(screen.queryByText("revoked_srv")).not.toBeInTheDocument();
    expect(screen.getByText("reachable_srv")).toBeInTheDocument();
  });

  it("does not select a server whose Подключить finishes after a refetch removed it", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedValueOnce(revocable(true)).mockResolvedValueOnce(revocable(false));
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    const onChange = vi.fn();
    const client = newClient();
    const { rerender } = render(<ПодключитьPanel token="tok" onChange={onChange} client={client} />);

    fireEvent.click(await screen.findByText("revoked_srv"));
    expect(await screen.findByRole("heading", { name: "revoked_srv" })).toBeInTheDocument();

    let finishПодключить: (result: { tools: never[] }) => void = () => {};
    vi.mocked(listMCPИнструменты).mockImplementationOnce(() => new Promise((resolve) => (finishПодключить = resolve)));
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));

    rerender(<ПодключитьPanel token="tok-refreshed" onChange={onChange} client={client} />);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "revoked_srv" })).not.toBeInTheDocument());

    await act(async () => {
      finishПодключить({ tools: [] });
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("revoked_srv")).not.toBeInTheDocument();
    expect(screen.getByText("Подключено", { exact: false })).toHaveTextContent("Подключено");
  });

  it("does not select a server when Подключить resolves in the same tick the refetch drops it", async () => {
    let finishRefetch: (servers: MCPСервер[]) => void = () => {};
    vi.mocked(fetchMCP-серверы)
      .mockResolvedValueOnce(revocable(true))
      .mockImplementationOnce(() => new Promise((resolve) => (finishRefetch = resolve)));
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    const onChange = vi.fn();
    const client = newClient();
    const { rerender } = render(<ПодключитьPanel token="tok" onChange={onChange} client={client} />);

    fireEvent.click(await screen.findByText("revoked_srv"));
    expect(await screen.findByRole("heading", { name: "revoked_srv" })).toBeInTheDocument();

    let finishПодключить: (result: { tools: never[] }) => void = () => {};
    vi.mocked(listMCPИнструменты).mockImplementationOnce(() => new Promise((resolve) => (finishПодключить = resolve)));
    fireEvent.click(screen.getByRole("button", { name: "Подключить" }));

    rerender(<ПодключитьPanel token="tok-refreshed" onChange={onChange} client={client} />);

    await act(async () => {
      finishRefetch(revocable(false));
      finishПодключить({ tools: [] });
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("revoked_srv")).not.toBeInTheDocument();
  });

  it("does not let a superseded list load overwrite the current reachable set", async () => {
    let finishStaleLoad: (servers: MCPСервер[]) => void = () => {};
    vi.mocked(fetchMCP-серверы)
      .mockImplementationOnce(() => new Promise((resolve) => (finishStaleLoad = resolve)))
      .mockResolvedValueOnce(revocable(false));
    vi.mocked(listMCPИнструменты).mockResolvedЗначение({ tools: [] });

    const client = newClient();
    const { rerender } = render(<ПодключитьPanel token="tok" onChange={vi.fn()} client={client} />);
    rerender(<ПодключитьPanel token="tok-refreshed" onChange={vi.fn()} client={client} />);

    expect(await screen.findByText("reachable_srv")).toBeInTheDocument();

    await act(async () => {
      finishStaleLoad(revocable(true));
    });

    expect(screen.queryByText("revoked_srv")).not.toBeInTheDocument();
  });
});
