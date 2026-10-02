import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import MCPПодключитьPicker from "./MCPПодключитьPicker";
import { fetchMCP-серверы } from "../networking";
import type { MCPСервер } from "../mcp_tools/types";
import { setСерверRootПуть } from "@/lib/serverRootПуть";

vi.mock("../networking", () => ({
  fetchMCP-серверы: vi.fn(),
  listMCPИнструменты: vi.fn(),
}));

const servers = [
  {
    server_id: "s-ext",
    server_name: "external_logo",
    mcp_info: { server_name: "external_logo", logo_url: "https://cdn.example.com/ext.png" },
  },
  {
    server_id: "s-local",
    server_name: "local_logo",
    mcp_info: { server_name: "local_logo", logo_url: "/ui/assets/logos/github.svg" },
  },
  {
    server_id: "s-none",
    server_name: "no_logo",
  },
] as MCPСервер[];

describe("MCPПодключитьPicker logos", () => {
  afterEach(() => {
    setСерверRootПуть("/");
  });

  it("resolves backend logo_url values through the Logo component", async () => {
    setСерверRootПуть("/litellm");
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(servers);

    render(<MCPПодключитьPicker accessТокен="tok" selected-серверы={[]} onChange={vi.fn()} />);

    expect(await screen.findByText("external_logo")).toBeInTheDocument();
    expect(screen.getByAltText("external_logo logo")).toHaveAttribute("src", "https://cdn.example.com/ext.png");
    expect(screen.getByAltText("local_logo logo")).toHaveAttribute("src", "/litellm/ui/assets/logos/github.svg");
  });

  it("renders no logo at all for servers withвыход logo_url", async () => {
    vi.mocked(fetchMCP-серверы).mockResolvedЗначение(servers);

    render(<MCPПодключитьPicker accessТокен="tok" selected-серверы={[]} onChange={vi.fn()} />);

    expect(await screen.findByText("no_logo")).toBeInTheDocument();
    expect(screen.queryByAltText("no_logo logo")).not.toBeInTheDocument();
  });
});
