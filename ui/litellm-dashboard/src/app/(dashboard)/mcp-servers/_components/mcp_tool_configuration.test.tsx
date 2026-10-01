import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MCPToolConfiguration from "./mcp_tool_configuration";

const tools = [
  { name: "read_user", description: "Read user" },
  { name: "delete_user", description: "Delete user" },
];

const renderToolConfiguration = (onAllowedToolsChange = vi.fn()) => {
  render(
    <MCPToolConfiguration
      accessToken="token"
      formValues={{ url: "https://example.com/mcp", transport: "http", auth_type: "none" }}
      allowedTools={[]}
      existingAllowedTools={null}
      onAllowedToolsChange={onAllowedToolsChange}
      toolNameToDisplayName={{}}
      toolNameToDescription={{}}
      onToolNameToDisplayNameChange={vi.fn()}
      onToolNameToDescriptionChange={vi.fn()}
      externalTools={tools}
      externalCanFetch
      isEditMode
    />,
  );

  return onAllowedToolsChange;
};

describe("MCPToolConfiguration", () => {
  it("shows legacy unrestricted edit tools enabled in flat view", async () => {
    const onAllowedToolsChange = renderToolConfiguration();

    fireEvent.click(screen.getByText("Плоский список"));

    expect(screen.getByText(/разрешено пользователям/)).toBeInTheDocument();
    expect(screen.getAllByText("Включён")).toHaveLength(2);

    fireEvent.click(screen.getByText("read_user"));

    await waitFor(() => {
      expect(onAllowedToolsChange).toHaveBeenLastCalledWith(["delete_user"]);
    });
  });

  it("preserves a restored selection on a legacy server instead of clearing it on init", async () => {
    const onAllowedToolsChange = vi.fn();

    render(
      <MCPToolConfiguration
        accessToken="token"
        formValues={{ url: "https://example.com/mcp", transport: "http", auth_type: "none" }}
        allowedTools={["read_user"]}
        existingAllowedTools={null}
        hasToolAllowlistInteraction
        onAllowedToolsChange={onAllowedToolsChange}
        toolNameToDisplayName={{}}
        toolNameToDescription={{}}
        onToolNameToDisplayNameChange={vi.fn()}
        onToolNameToDescriptionChange={vi.fn()}
        externalTools={tools}
        externalCanFetch
        isEditMode
      />,
    );

    await waitFor(() => {
      expect(onAllowedToolsChange).toHaveBeenCalled();
    });
    expect(onAllowedToolsChange).toHaveBeenLastCalledWith(["read_user"]);
    expect(onAllowedToolsChange).not.toHaveBeenCalledWith([]);
  });

  it("keeps legacy unrestricted tools disabled after all are toggled off", async () => {
    const Wrapper = () => {
      const [allowedTools, setAllowedTools] = useState<string[]>([]);
      const [hasToolAllowlistInteraction, setHasToolAllowlistInteraction] = useState(false);

      return (
        <MCPToolConfiguration
          accessToken="token"
          formValues={{ url: "https://example.com/mcp", transport: "http", auth_type: "none" }}
          allowedTools={allowedTools}
          existingAllowedTools={null}
          hasToolAllowlistInteraction={hasToolAllowlistInteraction}
          onToolAllowlistInteraction={() => setHasToolAllowlistInteraction(true)}
          onAllowedToolsChange={setAllowedTools}
          toolNameToDisplayName={{}}
          toolNameToDescription={{}}
          onToolNameToDisplayNameChange={vi.fn()}
          onToolNameToDescriptionChange={vi.fn()}
          externalTools={tools}
          externalCanFetch
          isEditMode
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByText("Плоский список"));
    fireEvent.click(screen.getByText("read_user"));
    fireEvent.click(screen.getByText("delete_user"));

    await waitFor(() => {
      expect(screen.getByText(/разрешено пользователям/)).toBeInTheDocument();
      expect(screen.getAllByText("Отключён")).toHaveLength(2);
    });
  });

  it("shows a validation error for a display name containing a space", async () => {
    const Wrapper = () => {
      const [toolNameToDisplayName, settoolNameToDisplayName] = useState<Record<string, string>>({});

      return (
        <MCPToolConfiguration
          accessToken="token"
          formValues={{ url: "https://example.com/mcp", transport: "http", auth_type: "none" }}
          allowedTools={[]}
          existingAllowedTools={null}
          onAllowedToolsChange={vi.fn()}
          toolNameToDisplayName={toolNameToDisplayName}
          toolNameToDescription={{}}
          onToolNameToDisplayNameChange={settoolNameToDisplayName}
          onToolNameToDescriptionChange={vi.fn()}
          externalTools={tools}
          externalCanFetch
          isEditMode
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByText("Плоский список"));
    fireEvent.click(screen.getAllByTitle("Изменить отображаемое имя и описание")[0]);

    const input = screen.getByPlaceholderText("read_user");
    fireEvent.change(input, { target: { value: "Browse Repo Docs" } });

    await waitFor(() => {
      expect(
        screen.getByText("Допускаются только буквы, цифры, подчёркивания и дефисы (без пробелов)."),
      ).toBeInTheDocument();
    });
  });

  it("accepts a Bedrock-safe display name without showing a validation error", async () => {
    const Wrapper = () => {
      const [toolNameToDisplayName, settoolNameToDisplayName] = useState<Record<string, string>>({});

      return (
        <MCPToolConfiguration
          accessToken="token"
          formValues={{ url: "https://example.com/mcp", transport: "http", auth_type: "none" }}
          allowedTools={[]}
          existingAllowedTools={null}
          onAllowedToolsChange={vi.fn()}
          toolNameToDisplayName={toolNameToDisplayName}
          toolNameToDescription={{}}
          onToolNameToDisplayNameChange={settoolNameToDisplayName}
          onToolNameToDescriptionChange={vi.fn()}
          externalTools={tools}
          externalCanFetch
          isEditMode
        />
      );
    };

    render(<Wrapper />);

    fireEvent.click(screen.getByText("Плоский список"));
    fireEvent.click(screen.getAllByTitle("Изменить отображаемое имя и описание")[0]);

    const input = screen.getByPlaceholderText("read_user");
    fireEvent.change(input, { target: { value: "browse_repo_docs" } });

    await waitFor(() => {
      expect(
        screen.queryByText("Допускаются только буквы, цифры, подчёркивания и дефисы (без пробелов)."),
      ).not.toBeInTheDocument();
    });
  });
});
