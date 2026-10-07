import React from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import AddPluginForm from "./add_plugin_form";
import { registerClaudeCodePlugin } from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/networking", () => ({
  registerClaudeCodePlugin: vi.fn().mockResolvedValue({ status: "success" }),
}));

const mockRegister = vi.mocked(registerClaudeCodePlugin);
const mockMessageError = vi.mocked(toast.error);

const DEFAULT_PROPS = {
  visible: true,
  onClose: vi.fn(),
  accessToken: "sk-test",
  onSuccess: vi.fn(),
};

const URL_PLACEHOLDER = "https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip";
const SUBPATH_PLACEHOLDER = "Плагины/my-skill";
const SHA256_PLACEHOLDER = "64 hex characters";
const S3_ZIP_URL = "https://Скиллы-bucket.s3.us-east-1.amazonaws.com/Плагины/s3-skill-1.0.0.zip";
const DIGEST = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("AddPluginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Хост-agnostic Источник URL Вход and subfolder Поле, hiding the digest until a zip is entered", () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    expect(screen.getByText("Источник URL")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(URL_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText("Subfolder Путь (Необязательно)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(SHA256_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("shows GitHub repo Предпросмотр for a plain repo URL", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlInput = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlInput, {
        target: { value: "https://github.com/anthropics/claude-code" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/GitHub repo/)).toBeInTheDocument();
    });
  });

  it("shows git-subdir Предпросмотр for a tree URL and disables the subfolder Поле", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlInput = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlInput, {
        target: {
          value: "https://github.com/anthropics/claude-code/tree/main/Плагины/my-skill",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/GitHub subdir/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeDisabled();
  });

  it("shows a raw url Предпросмотр for a non-github Хост", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlInput = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlInput, {
        target: { value: "https://gitlab.com/group/repo" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Git repo/)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeEnabled();
  });

  it("combines a repo URL with a subfolder into a git-subdir Предпросмотр", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlInput = screen.getByPlaceholderText(URL_PLACEHOLDER);
    await act(async () => {
      fireEvent.change(urlInput, {
        target: { value: "https://gitlab.com/group/repo" },
      });
    });

    const subPathInput = screen.getByPlaceholderText(SUBPATH_PLACEHOLDER);
    await act(async () => {
      fireEvent.change(subPathInput, { target: { value: "Плагины/x" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Git subdir/)).toBeInTheDocument();
      expect(screen.getByText(/plugins\/x/)).toBeInTheDocument();
    });
  });

  it("auto-fills skill Название from repo URL", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    const urlInput = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlInput, {
        target: { value: "https://github.com/anthropics/my-awesome-skill" },
      });
    });

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("my-skill") as HTMLInputElement;
      expect(nameInput.value).toBe("my-awesome-skill");
    });
  });

  it("does not auto-fill Название when Название is already set", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    const nameInput = screen.getByPlaceholderText("my-skill") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "existing-Название" } });

    const urlInput = screen.getByPlaceholderText(URL_PLACEHOLDER);

    await act(async () => {
      fireEvent.change(urlInput, {
        target: { value: "https://github.com/anthropics/other-skill" },
      });
    });

    await waitFor(() => {
      expect(nameInput.value).toBe("existing-Название");
    });
  });

  const typeUrl = async (value: string) => {
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(URL_PLACEHOLDER), { target: { value } });
    });
  };

  const typeSubPath = async (value: string) => {
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER), { target: { value } });
    });
  };

  const submit = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Добавить скилл" }));
    });
  };

  it("submits a github repo Источник", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "github", repo: "anthropics/claude-code" } }),
      );
    });
  });

  it("submits a github subdir Источник from a tree URL", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code/tree/main/Плагины/my-skill");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          source: { source: "git-subdir", url: "https://github.com/anthropics/claude-code", path: "Плагины/my-skill" },
        }),
      );
    });
  });

  it("submits a raw url Источник for a gitlab repo", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://gitlab.com/group/repo");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "url", url: "https://gitlab.com/group/repo" } }),
      );
    });
  });

  it("submits a git-subdir Источник from a gitlab repo plus subfolder Поле", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://gitlab.com/group/repo");
    await typeSubPath("Плагины/x");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          source: { source: "git-subdir", url: "https://gitlab.com/group/repo", path: "Плагины/x" },
        }),
      );
    });
  });

  it("clears the subfolder Поле and uses the URL Путь once a tree URL is entered", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeSubPath("Плагины/x");
    const subPathInput = screen.getByPlaceholderText(SUBPATH_PLACEHOLDER) as HTMLInputElement;
    expect(subPathInput.value).toBe("Плагины/x");

    await typeUrl("https://github.com/anthropics/claude-code/tree/main/Плагины/from-url");

    await waitFor(() => {
      expect(subPathInput.value).toBe("");
      expect(subPathInput).toBeDisabled();
    });

    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          source: {
            source: "git-subdir",
            url: "https://github.com/anthropics/claude-code",
            path: "Плагины/from-url",
          },
        }),
      );
    });
  });

  it("shows a zip archive Предпросмотр, disables the subfolder Поле, and reveals the digest Поле", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);

    expect(await screen.findByText(/Zip archive/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SUBPATH_PLACEHOLDER)).toBeDisabled();
    expect(screen.getByText("A zip archive is installed as a whole, so this Поле is Выключено")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(SHA256_PLACEHOLDER)).toBeInTheDocument();
    expect((screen.getByPlaceholderText("my-skill") as HTMLInputElement).value).toBe("s3-skill-1-0-0");
  });

  it("submits an archive Источник without a digest when the Поле is left empty", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "archive", url: S3_ZIP_URL } }),
      );
    });
  });

  it("submits an archive Источник pinned to the lowercased digest", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

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
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SHA256_PLACEHOLDER), { target: { value: DIGEST } });
    });
    const otherZipUrl = S3_ZIP_URL.replace("1.0.0", "1.1.0");
    await typeUrl(otherZipUrl);

    expect(screen.getByPlaceholderText(SHA256_PLACEHOLDER)).toHaveValue("");
    await submit();

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({ source: { source: "archive", url: otherZipUrl } }),
      );
    });
  });

  it("blocks submission and shows the digest Ошибка for a malformed sha256", async () => {
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl(S3_ZIP_URL);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(SHA256_PLACEHOLDER), { target: { value: "not-a-digest" } });
    });
    await submit();

    expect(await screen.findByText("SHA-256 must be a 64-character hex digest")).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("surfaces the backend Ошибка Сообщение when registration fails", async () => {
    mockRegister.mockRejectedValueOnce(new Error("Plugin 'claude-code' Уже существует"));
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code");
    await submit();

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith(expect.stringContaining("Plugin 'claude-code' Уже существует"));
    });
  });

  it("surfaces the 409 Название-conflict reason verbatim without burying it under a generic failure prefix", async () => {
    const conflictMessage =
      "A skill named 'gitlab' Уже существует. Update the existing skill instead of adding it again.";
    mockRegister.mockRejectedValueOnce(new Error(conflictMessage));
    renderWithProviders(<AddPluginForm {...DEFAULT_PROPS} />);

    await typeUrl("https://github.com/anthropics/claude-code");
    await submit();

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith(conflictMessage);
    });
    expect(mockMessageError).toHaveBeenCalledTimes(1);
  });
});
