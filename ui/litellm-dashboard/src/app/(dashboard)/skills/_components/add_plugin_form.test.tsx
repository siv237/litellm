import React from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithПровайдерs } from "@/../tests/test-utils";
import AddPluginForm from "./add_plugin_form";
import { registerClaudeCodePlugin } from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  registerClaudeCodePlugin: vi.fn().mockResolvedЗначение({ status: "success" }),
}));

const mockRegister = vi.mocked(registerClaudeCodePlugin);
const mockСообщениеОшибка = vi.mocked(toast.error);

const DEFAULT_PROPS = {
  visible: true,
  onClose: vi.fn(),
  accessТокен: "sk-test",
  onSuccess: vi.fn(),
};

const URL_PLACEHOLDER = "https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip";
const SUBPATH_PLACEHOLDER = "plugins/my-skill";
const SHA256_PLACEHOLDER = "64 hex characters";
const S3_ZIP_URL = "https://skills-bucket.s3.us-east-1.amazonaws.com/plugins/s3-skill-1.0.0.zip";
const DIGEST = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("AddPluginForm", () => {
  beforeEach(() => {
    vi.clearВсеMocks();
  });

  it("renders the host-agnostic source URL input and subfolder field, hiding the digest until a zip is entered", () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    expect(screen.getByText("Источник URL")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(URL_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText("Subfolder path (Optional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(SHA256_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("shows GitHub repo preview for a plain repo URL", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlВход = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlВход, {
        target: { value: "https://github.com/anthropics/claude-code" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/GitHub repo/)).toBeInTheDocument();
    });
  });

  it("shows git-subdir preview for a tree URL and disables the subfolder field", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlВход = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlВход, {
        target: {
          value: "https://github.com/anthropics/claude-code/tree/main/plugins/my-skill",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/GitHub subdir/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeDisabled();
  });

  it("shows a raw url preview for a non-github host", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlВход = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlВход, {
        target: { value: "https://gitlab.com/group/repo" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Git repo/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeEnabled();
  });

  it("combines a repo URL with a subfolder into a git-subdir preview", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlВход = screen.getByPlaceholderText(URL_PLACEHOLDER);
    await act(async () => {
      fireEvent.change(urlВход, {
        target: { value: "https://gitlab.com/group/repo" },
      });
    });

    const subПутьВход = screen.getByPlaceholderText(SUBPATH_PLACEHOLDER);
    await act(async () => {
      fireEvent.change(subПутьВход, { target: { value: "plugins/x" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Git subdir/)).toBeInTheDocument();
      expect(screen.getByText(/plugins\/x/)).toBeInTheDocument();
    });
  });

  it("auto-fills skill name from repo URL", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlВход = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlВход, {
        target: { value: "https://github.com/anthropics/my-awesome-skill" },
      });
    });

    await waitFor(() => {
      const nameВход = screen.getByPlaceholderText("my-skill") as HTMLВходElement;
      expect(nameВход.value).toBe("my-awesome-skill");
    });
  });

  it("does not auto-fill name when name is already set", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    const nameВход = screen.getByPlaceholderText("my-skill") as HTMLВходElement;
    fireEvent.change(nameВход, { target: { value: "existing-name" } });

    const urlВход = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlВход, {
        target: { value: "https://github.com/anthropics/other-skill" },
      });
    });

    await waitFor(() => {
      expect(nameВход.value).toBe("existing-name");
    });
  });

  const typeUrl = async (value: string) => {
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value } });
    });
  };

  const typeSubПуть = async (value: string) => {
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER), { target: { value } });
    });
  };

  const submit = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Добавить скилл" }));
    });
  };

  it("submits a github repo source", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "github", repo: "anthropics/claude-code" } }),
      );
    });
  });

  it("submits a github subdir source from a tree URL", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code/tree/main/plugins/my-skill");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          source: { source: "git-subdir", url: "https://github.com/anthropics/claude-code", path: "plugins/my-skill" },
        }),
      );
    });
  });

  it("submits a raw url source for a gitlab repo", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://gitlab.com/group/repo");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "url", url: "https://gitlab.com/group/repo" } }),
      );
    });
  });

  it("submits a git-subdir source from a gitlab repo plus subfolder field", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://gitlab.com/group/repo");
    await typeSubПуть("plugins/x");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          source: { source: "git-subdir", url: "https://gitlab.com/group/repo", path: "plugins/x" },
        }),
      );
    });
  });

  it("clears the subfolder field and uses the URL path once a tree URL is entered", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeSubПуть("plugins/x");
    const subПутьВход = screen.getByPlaceholderText(SUBPATH_PLACEHOLDER) as HTMLВходElement;
    expect(subПутьВход.value).toBe("plugins/x");

    await typeUrl("https://github.com/anthropics/claude-code/tree/main/plugins/from-url");

    await waitFor(() => {
      expect(subПутьВход.value).toBe("");
      expect(subПутьВход).toBeDisabled();
    });

    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          source: {
            source: "git-subdir",
            url: "https://github.com/anthropics/claude-code",
            path: "plugins/from-url",
          },
        }),
      );
    });
  });

  it("shows a zip archive preview, disables the subfolder field, and reveals the digest field", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);

    expect(await screen.findByText(/Zip archive/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeDisabled();
    expect(screen.getByText("A zip archive is installed as a whole, so this field is disabled")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SHA256_PLACEHOLDER)).toBeInTheDocument();
    expect((screen.getByPlaceholderText("my-skill") as HTMLВходElement).value).toBe("s3-skill-1-0-0");
  });

  it("submits an archive source withвыход a digest when the field is left empty", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "archive", url: S3_ZIP_URL } }),
      );
    });
  });

  it("submits an archive source pinned to the lowercased digest", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SHA256_PLACEHOLDER), {
        target: { value: ` ${DIGEST.toUpperCase()} ` },
      });
    });
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "archive", url: S3_ZIP_URL, sha256: DIGEST } }),
      );
    });
  });

  it("drops the digest once the archive URL changes so a stale checksum is never sent for a new file", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SHA256_PLACEHOLDER), { target: { value: DIGEST } });
    });
    const otherZipUrl = S3_ZIP_URL.replace("1.0.0", "1.1.0");
    await typeUrl(otherZipUrl);

    expect(screen.getByPlaceholderText(SHA256_PLACEHOLDER)).toHaveЗначение("");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "archive", url: otherZipUrl } }),
      );
    });
  });

  it("blocks submission and shows the digest error for a malformed sha256", async () => {
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SHA256_PLACEHOLDER), { target: { value: "not-a-digest" } });
    });
    await submit();

    expect(await screen.findByText("SHA-256 must be a 64-character hex digest")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("surfaces the backend error message when registration fails", async () => {
    mockRegister.mockRejectedЗначениеOnce(new Ошибка("Plugin 'claude-code' already exists"));
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code");
    await submit();

    await waitFor(() => {
      expect(mockСообщениеОшибка).toHaveBeenCalledWith(expect.stringContaining("Plugin 'claude-code' already exists"));
    });
  });

  it("surfaces the 409 name-conflict reason verbatim withвыход burying it under a generic failure prefix", async () => {
    const conflictСообщение =
      "A skill named 'gitlab' already exists. Update the existing skill instead of adding it again.";
    mockRegister.mockRejectedЗначениеOnce(new Ошибка(conflictСообщение));
    renderWithПровайдерs(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code");
    await submit();

    await waitFor(() => {
      expect(mockСообщениеОшибка).toHaveBeenCalledWith(conflictСообщение);
    });
    expect(mockСообщениеОшибка).toHaveBeenCalledВремяs(1);
  });
});
