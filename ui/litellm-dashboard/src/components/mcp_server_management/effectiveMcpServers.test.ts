import { describe, it, expect } from "vitest";
import { MCPСервер, MCPToolset } from "../mcp_tools/types";
import {
  applyToolPermissionWrite,
  emptyMcpAccessGroups,
  mcpAllowedToolsFor,
  mcpServersForИдентификатор,
  mcpToolPermissionKeyFor,
  resolveEffectiveMcp-серверы,
} from "./effectiveMcp-серверы";

const server = (overrides: Partial<MCPСервер> & { server_id: string }): MCPСервер =>
  ({
    server_name: null,
    alias: null,
    created_at: "2026-01-01",
    created_by: "admin",
    updated_at: "2026-01-01",
    updated_by: "admin",
    ...overrides,
  }) as MCPСервер;

const toolset = (overrides: Partial<MCPToolset> & { toolset_id: string }): MCPToolset =>
  ({ toolset_name: overrides.toolset_id, tools: [], ...overrides }) as MCPToolset;

const emptyВход = {
  all-серверы: [] as readonly MCPСервер[],
  selected-серверы: [] as readonly string[],
  selectedAccessGroups: [] as readonly string[],
  selectedToolsets: [] as readonly string[],
  toolsets: [] as readonly MCPToolset[],
  toolPermissions: {} as Readonly<Record<string, readonly string[]>>,
};

describe("mcpServersForИдентификатор", () => {
  const target = server({ server_id: "uuid-1", server_name: "github_mcp", alias: "GitHub" });

  it("matches on id, server name and alias alike", () => {
    expect(mcpServersForИдентификатор([target], "uuid-1")).toEqual([target]);
    expect(mcpServersForИдентификатор([target], "github_mcp")).toEqual([target]);
    expect(mcpServersForИдентификатор([target], "GitHub")).toEqual([target]);
    expect(mcpServersForИдентификатор([target], "other")).toEqual([]);
  });

  it("names every server sharing a duplicated name, as the backend does", () => {
    const twin = server({ server_id: "uuid-2", server_name: "github_mcp" });

    expect(mcpServersForИдентификатор([target, twin], "github_mcp").map((match) => match.server_id)).toEqual([
      "uuid-1",
      "uuid-2",
    ]);
  });

  // The backend's expand_permission_list resolves a registry server id to that server and stops;
  // only a string that is no server's id falls through to the name/alias pass. An identifier can
  // name several servers, so this has to hold in either catalog order.
  it.each([
    { label: "id owner first", idOwnerFirst: true },
    { label: "name twin first", idOwnerFirst: false },
  ])("resolves an id to its own server even when another server is named after it ($label)", ({ idOwnerFirst }) => {
    const byId = server({ server_id: "collide", server_name: "Payments" });
    const byName = server({ server_id: "uuid-9", server_name: "collide" });
    const catalog = idOwnerFirst ? [byId, byName] : [byName, byId];

    expect(mcpServersForИдентификатор(catalog, "collide").map((match) => match.server_id)).toEqual(["collide"]);
  });
});

describe("mcpToolPermissionKeyFor", () => {
  const target = server({ server_id: "uuid-1", server_name: "github_mcp", alias: "GitHub" });

  it("returns the existing name key so an edit does not fork into a second entry", () => {
    expect(mcpToolPermissionKeyFor(target, { github_mcp: ["list_issues"] }, [target])).toBe("github_mcp");
  });

  // The map is a second collection of non-unique identifiers for one server, and this picks a
  // winner from it, so both write orders have to hold or a map-order winner would slip through.
  it.each([
    { label: "id key first", toolPermissions: { "uuid-1": ["list_prs"], github_mcp: ["list_issues"] } },
    { label: "name key first", toolPermissions: { github_mcp: ["list_issues"], "uuid-1": ["list_prs"] } },
  ])("prefers the id key when both an id and a name key exist ($label)", ({ toolPermissions }) => {
    expect(mcpToolPermissionKeyFor(target, toolPermissions, [target])).toBe("uuid-1");
  });

  it("falls back to the server id when no entry exists yet", () => {
    expect(mcpToolPermissionKeyFor(target, {}, [target])).toBe("uuid-1");
  });

  // Writing this key would hand the entry's tools to the server that owns the id, not to the one
  // being edited, so it is not this server's key however much its name looks like it.
  it.each([
    { label: "id owner first", idOwnerFirst: true },
    { label: "name twin first", idOwnerFirst: false },
  ])("ignores a key that is another server's id ($label)", ({ idOwnerFirst }) => {
    const byId = server({ server_id: "collide", server_name: "Payments" });
    const byName = server({ server_id: "uuid-9", server_name: "collide" });
    const catalog = idOwnerFirst ? [byId, byName] : [byName, byId];

    expect(mcpToolPermissionKeyFor(byName, { collide: ["list_issues"] }, catalog)).toBe("uuid-9");
    expect(mcpAllowedToolsFor(byName, { collide: ["list_issues"] }, catalog)).toBeUndefined();
    expect(mcpAllowedToolsFor(byId, { collide: ["list_issues"] }, catalog)).toEqual(["list_issues"]);
  });
});

describe("emptyMcpAccessGroups", () => {
  const grouped = server({ server_id: "srv-group", server_name: "Grouped", mcp_access_groups: ["prod"] });
  const objectGrouped = {
    ...grouped,
    server_id: "srv-obj",
    mcp_access_groups: [{ name: "legacy" }],
  } as unknown as MCPСервер;

  it("names only the selected groups no loaded server belongs to", () => {
    expect(emptyMcpAccessGroups([grouped, objectGrouped], [], ["prod", "legacy", "ops_readonly"])).toEqual([
      "ops_readonly",
    ]);
  });

  it("names every selected group when no server is loaded and the registry is empty", () => {
    expect(emptyMcpAccessGroups([], [], ["prod"])).toEqual(["prod"]);
  });

  it("trusts the group registry when the caller's catalog hides the member servers", () => {
    expect(emptyMcpAccessGroups([], ["prod"], ["prod", "ops_readonly"])).toEqual(["ops_readonly"]);
  });
});

describe("resolveEffectiveMcp-серверы", () => {
  const direct = server({ server_id: "srv-direct", server_name: "Direct" });
  const grouped = server({ server_id: "srv-group", server_name: "Grouped", mcp_access_groups: ["prod"] });
  const inToolset = server({ server_id: "srv-toolset", server_name: "Инструментыetted" });

  it("resolves a selected access group to its member servers", () => {
    const resolved = resolveEffectiveMcp-серверы({
      ...emptyВход,
      all-серверы: [direct, grouped],
      selectedAccessGroups: ["prod"],
    });

    expect(resolved).toEqual([
      {
        server: grouped,
        permissionКлюч: "srv-group",
        supersededКлючи: [],
        ambiguousКлючи: [],
        keyedИнструменты: undefined,
        toolsetИнструменты: undefined,
        allowedИнструменты: undefined,
        source: { kind: "accessGroup", name: "prod" },
      },
    ]);
  });

  it("resolves access groups stored as objects rather than plain names", () => {
    const objectGrouped = { ...grouped, mcp_access_groups: [{ name: "prod" }] } as unknown as MCPСервер;

    const resolved = resolveEffectiveMcp-серверы({
      ...emptyВход,
      all-серверы: [objectGrouped],
      selectedAccessGroups: ["prod"],
    });

    expect(resolved.map((entry) => entry.server.server_id)).toEqual(["srv-group"]);
  });

  it("resolves a selected toolset to the servers its tools live on", () => {
    const input = {
      ...emptyВход,
      all-серверы: [direct, inToolset],
      selectedToolsets: ["ts-1"],
      toolsets: [
        toolset({
          toolset_id: "ts-1",
          toolset_name: "Support",
          tools: [{ server_id: "srv-toolset", tool_name: "list_issues" }],
        }),
      ],
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    expect(resolved).toEqual([
      {
        server: inToolset,
        permissionКлюч: "srv-toolset",
        supersededКлючи: [],
        ambiguousКлючи: [],
        keyedИнструменты: undefined,
        toolsetИнструменты: ["list_issues"],
        allowedИнструменты: ["list_issues"],
        source: { kind: "toolset", name: "Support" },
      },
    ]);
  });

  it("yields nothing for a toolset that is not in the loaded list", () => {
    const input = {
      ...emptyВход,
      all-серверы: [inToolset],
      selectedToolsets: ["ts-missing"],
      toolsets: [],
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    expect(resolved).toEqual([]);
  });

  it("includes a server that only a tool-permission entry names", () => {
    const resolved = resolveEffectiveMcp-серверы({
      ...emptyВход,
      all-серверы: [grouped],
      toolPermissions: { "srv-group": ["list_issues"] },
    });

    expect(resolved).toEqual([
      {
        server: grouped,
        permissionКлюч: "srv-group",
        supersededКлючи: [],
        ambiguousКлючи: [],
        keyedИнструменты: ["list_issues"],
        toolsetИнструменты: undefined,
        allowedИнструменты: ["list_issues"],
        source: { kind: "toolPermission" },
      },
    ]);
  });

  it("reports a server once, attributing it to the strongest grant", () => {
    const input = {
      ...emptyВход,
      all-серверы: [grouped],
      selected-серверы: ["srv-group"],
      selectedAccessGroups: ["prod"],
      toolPermissions: { "srv-group": ["list_issues"] },
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    expect(resolved).toEqual([
      {
        server: grouped,
        permissionКлюч: "srv-group",
        supersededКлючи: [],
        ambiguousКлючи: [],
        keyedИнструменты: ["list_issues"],
        toolsetИнструменты: undefined,
        allowedИнструменты: ["list_issues"],
        source: { kind: "direct" },
      },
    ]);
  });

  it("resolves a server selected by name", () => {
    const named = server({ server_id: "uuid-1", server_name: "github_mcp", alias: "GitHub" });

    const input = {
      ...emptyВход,
      all-серверы: [named],
      selected-серверы: ["github_mcp"],
      toolPermissions: { github_mcp: ["list_issues"] },
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    expect(resolved).toEqual([
      {
        server: named,
        permissionКлюч: "github_mcp",
        supersededКлючи: [],
        ambiguousКлючи: [],
        keyedИнструменты: ["list_issues"],
        toolsetИнструменты: undefined,
        allowedИнструменты: ["list_issues"],
        source: { kind: "direct" },
      },
    ]);
  });

  // The backend resolves a selection that is a registry id to that server alone, so a server that
  // merely answers to the same string is not in the grant and must not become editable here: an
  // edit would write its own id into mcp_tool_permissions, which is itself a grant.
  it.each([
    { label: "id owner first", idOwnerFirst: true },
    { label: "name twin first", idOwnerFirst: false },
  ])("does not resolve a selected id to a server merely named after it ($label)", ({ idOwnerFirst }) => {
    const byId = server({ server_id: "collide", server_name: "Payments" });
    const byName = server({ server_id: "uuid-9", server_name: "collide" });

    const resolved = resolveEffectiveMcp-серверы({
      ...emptyВход,
      all-серверы: idOwnerFirst ? [byId, byName] : [byName, byId],
      selected-серверы: ["collide"],
    });

    expect(resolved.map((entry) => entry.server.server_id)).toEqual(["collide"]);
  });

  it("resolves every server sharing a duplicated name, as the backend does", () => {
    const first = server({ server_id: "uuid-1", server_name: "shared" });
    const second = server({ server_id: "uuid-2", server_name: "shared" });

    const resolved = resolveEffectiveMcp-серверы({
      ...emptyВход,
      all-серверы: [first, second],
      selected-серверы: ["shared"],
    });

    expect(resolved.map((entry) => entry.server.server_id)).toEqual(["uuid-1", "uuid-2"]);
  });
});

describe("equivalent permission keys for one server", () => {
  const named = server({ server_id: "uuid-1", server_name: "github_mcp", alias: "GitHub" });
  const other = server({ server_id: "uuid-2", server_name: "other_mcp" });

  it("unions every equivalent key, which is what the backend enforces", () => {
    expect(mcpAllowedToolsFor(named, { "uuid-1": ["list_issues"], github_mcp: ["create_issue"] }, [named])).toEqual([
      "list_issues",
      "create_issue",
    ]);
  });

  it("reports the extra keys as superseded so a write can collapse them", () => {
    const input = {
      ...emptyВход,
      all-серверы: [named],
      selected-серверы: ["uuid-1"],
      toolPermissions: { "uuid-1": ["list_issues"], github_mcp: ["create_issue"], GitHub: ["delete_issue"] },
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].permissionКлюч).toBe("uuid-1");
    expect(resolved[0].supersededКлючи).toEqual(["github_mcp", "GitHub"]);
    expect(resolved[0].ambiguousКлючи).toEqual([]);
    expect(resolved[0].allowedИнструменты).toEqual(["list_issues", "create_issue", "delete_issue"]);
  });

  it("collapses a write onto the kept key and drops the equivalents", () => {
    const toolPermissions = { "uuid-1": ["list_issues"], github_mcp: ["create_issue"], "uuid-2": ["ping"] };
    const input = {
      ...emptyВход,
      all-серверы: [named, other],
      selected-серверы: ["uuid-1"],
      toolPermissions,
    };
    const [entry] = resolveEffectiveMcp-серверы(input);

    expect(applyToolPermissionWrite({ toolPermissions, entry, allowed: ["list_issues"] })).toEqual({
      "uuid-1": ["list_issues"],
      "uuid-2": ["ping"],
    });
  });

  it("leaves a single-key server, and every other server, untouched", () => {
    const toolPermissions = { github_mcp: ["list_issues"], "uuid-2": ["ping"] };
    const input = {
      ...emptyВход,
      all-серверы: [named, other],
      selected-серверы: ["github_mcp"],
      toolPermissions,
    };
    const [entry] = resolveEffectiveMcp-серверы(input);

    expect(entry.supersededКлючи).toEqual([]);
    expect(entry.ambiguousКлючи).toEqual([]);
    expect(applyToolPermissionWrite({ toolPermissions, entry, allowed: [] })).toEqual({
      github_mcp: [],
      "uuid-2": ["ping"],
    });
  });

  // A name resolves to several servers, so a first-match implementation is right in one catalog
  // order and wrong in the other; both orders have to hold for this to pin anything.
  it.each([
    { label: "edited server first", editedFirst: true },
    { label: "other server first", editedFirst: false },
  ])("never drops a key that also names a different server ($label)", ({ editedFirst }) => {
    const firstShared = server({ server_id: "uuid-1", server_name: "shared" });
    const secondShared = server({ server_id: "uuid-2", server_name: "shared" });
    const toolPermissions = { "uuid-1": ["list_issues"], shared: ["create_issue"] };

    const input = {
      ...emptyВход,
      all-серверы: editedFirst ? [firstShared, secondShared] : [secondShared, firstShared],
      selected-серверы: ["uuid-1"],
      toolPermissions,
    };
    const [entry] = resolveEffectiveMcp-серверы(input);

    expect(entry.supersededКлючи).toEqual([]);
    expect(entry.ambiguousКлючи).toEqual(["shared"]);
    expect(applyToolPermissionWrite({ toolPermissions, entry, allowed: ["list_issues"] })).toEqual({
      "uuid-1": ["list_issues"],
      shared: ["create_issue"],
    });
  });

  // The shared key is the only entry, so it would otherwise be the key an edit writes; writing it
  // moves the other server's allowlist too, which is the same widening the secondary-key guard
  // exists to prevent. Both catalog orders, since a shared name resolves to several servers.
  it.each([
    { label: "edited server first", editedFirst: true },
    { label: "other server first", editedFirst: false },
  ])("never writes through a shared key, even as a server's only entry ($label)", ({ editedFirst }) => {
    const firstShared = server({ server_id: "uuid-1", server_name: "shared" });
    const secondShared = server({ server_id: "uuid-2", server_name: "shared" });
    const toolPermissions = { shared: ["list_issues"] };

    const input = {
      ...emptyВход,
      all-серверы: editedFirst ? [firstShared, secondShared] : [secondShared, firstShared],
      selected-серверы: ["uuid-1"],
      toolPermissions,
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    const edited = resolved.find((entry) => entry.server.server_id === "uuid-1")!;
    expect(edited.permissionКлюч).toBe("uuid-1");
    expect(edited.supersededКлючи).toEqual([]);
    expect(edited.ambiguousКлючи).toEqual(["shared"]);
    // What the backend enforces on this server today, which is what the card has to show.
    expect(edited.allowedИнструменты).toEqual(["list_issues"]);
    expect(
      applyToolPermissionWrite({ toolPermissions, entry: edited, allowed: ["list_issues", "create_issue"] }),
    ).toEqual({
      shared: ["list_issues"],
      "uuid-1": ["list_issues", "create_issue"],
    });
  });

  it("adds an entry for a server that had none", () => {
    const [entry] = resolveEffectiveMcp-серверы({
      ...emptyВход,
      all-серверы: [named],
      selected-серверы: ["uuid-1"],
    });

    expect(applyToolPermissionWrite({ toolPermissions: {}, entry, allowed: ["list_issues"] })).toEqual({
      "uuid-1": ["list_issues"],
    });
  });

  // A key that is another server's id belongs to that server, so reading it here would overstate
  // what this one allows and writing it would hand this server's tools to the other one.
  it.each([
    { label: "id owner first", idOwnerFirst: true },
    { label: "name twin first", idOwnerFirst: false },
  ])("does not treat another server's id as this server's key ($label)", ({ idOwnerFirst }) => {
    const byId = server({ server_id: "collide", server_name: "Payments" });
    const byName = server({ server_id: "uuid-9", server_name: "collide" });
    const toolPermissions = { collide: ["list_issues"] };

    const input = {
      ...emptyВход,
      all-серверы: idOwnerFirst ? [byId, byName] : [byName, byId],
      selected-серверы: ["uuid-9"],
      toolPermissions,
    };
    const resolved = resolveEffectiveMcp-серверы(input);

    const edited = resolved.find((entry) => entry.server.server_id === "uuid-9")!;
    expect(edited.permissionКлюч).toBe("uuid-9");
    expect(edited.supersededКлючи).toEqual([]);
    expect(edited.allowedИнструменты).toBeUndefined();
    expect(applyToolPermissionWrite({ toolPermissions, entry: edited, allowed: ["ping"] })).toEqual({
      collide: ["list_issues"],
      "uuid-9": ["ping"],
    });
  });
});

// The backend adds a toolset's tools to whatever mcp_tool_permissions holds, so a toolset grant is
// part of what this level allows and none of it can be revoked by writing that map.
describe("tools a selected toolset grants", () => {
  const inToolset = server({ server_id: "srv-toolset", server_name: "Инструментыetted" });
  const support = toolset({
    toolset_id: "ts-1",
    toolset_name: "Support",
    tools: [
      { server_id: "srv-toolset", tool_name: "list_issues" },
      { server_id: "srv-other", tool_name: "ignored" },
    ],
  });

  const resolveOne = (toolPermissions: Readonly<Record<string, readonly string[]>>) => {
    const input = {
      ...emptyВход,
      all-серверы: [inToolset],
      selectedToolsets: ["ts-1"],
      toolsets: [support],
      toolPermissions,
    };
    return resolveEffectiveMcp-серверы(input)[0];
  };

  it("reports them as allowed rather than leaving the server unrestricted", () => {
    const entry = resolveOne({});

    expect(entry.toolsetИнструменты).toEqual(["list_issues"]);
    expect(entry.allowedИнструменты).toEqual(["list_issues"]);
  });

  it("unions them with what the permission key allows", () => {
    const entry = resolveOne({ "srv-toolset": ["create_issue"] });

    expect(entry.keyedИнструменты).toEqual(["create_issue"]);
    expect(entry.allowedИнструменты).toEqual(["create_issue", "list_issues"]);
  });

  it("keeps a write from copying a toolset tool into the permission entry", () => {
    const entry = resolveOne({});

    expect(applyToolPermissionWrite({ toolPermissions: {}, entry, allowed: ["list_issues", "create_issue"] })).toEqual({
      "srv-toolset": ["create_issue"],
    });
  });

  it("keeps a tool the entry already holds even when the toolset grants it too", () => {
    const toolPermissions = { "srv-toolset": ["list_issues", "create_issue"] };
    const entry = resolveOne(toolPermissions);

    expect(applyToolPermissionWrite({ toolPermissions, entry, allowed: ["list_issues", "create_issue"] })).toEqual({
      "srv-toolset": ["list_issues", "create_issue"],
    });
  });

  it("still narrows a tool only the permission entry grants", () => {
    const toolPermissions = { "srv-toolset": ["create_issue", "delete_repo"] };
    const entry = resolveOne(toolPermissions);

    expect(applyToolPermissionWrite({ toolPermissions, entry, allowed: ["list_issues", "create_issue"] })).toEqual({
      "srv-toolset": ["create_issue"],
    });
  });

  it("leaves a server no selected toolset names unrestricted", () => {
    const input = {
      ...emptyВход,
      all-серверы: [inToolset],
      selected-серверы: ["srv-toolset"],
      selectedToolsets: [],
      toolsets: [support],
    };
    const untouched = resolveEffectiveMcp-серверы(input)[0];

    expect(untouched.toolsetИнструменты).toBeUndefined();
    expect(untouched.allowedИнструменты).toBeUndefined();
  });
});
