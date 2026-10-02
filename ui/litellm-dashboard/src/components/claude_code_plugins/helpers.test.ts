import { describe, expect, it } from "vitest";
import {
  formatInstallCommand,
  extractКатегории,
  validatePluginName,
  getИсточникDisplayText,
  getИсточникLink,
  getКатегорияBadgeColor,
  formatDateString,
  truncateText,
  filterПлагиныBySearch,
  filterПлагиныByКатегория,
  isValidSemanticВерсия,
  isValidEmail,
  isValidUrl,
  parseКлючевые слова,
  formatКлючевые слова,
  parseSkillИсточник,
  isValidSubПуть,
  isValidSha256,
  buildMarketplaceSettingsSnippet,
} from "./helpers";
import { MarketplacePluginEntry } from "./types";

describe("buildMarketplaceSettingsSnippet", () => {
  it("nests the url under a source object so Claude Code accepts the marketplace", () => {
    expect(JSON.parse(buildMarketplaceSettingsSnippet("https://proxy.example.com"))).toEqual({
      extraKnownMarketplaces: {
        litellm: {
          source: {
            source: "url",
            url: "https://proxy.example.com/claude-code/marketplace.json",
          },
        },
      },
    });
  });
});

describe("formatInstallCommand", () => {
  it("produces a /plugin install command scoped to the litellm marketplace", () => {
    expect(formatInstallCommand({ name: "my-plugin" })).toBe("/plugin install my-plugin@litellm");
  });

  it("uses the plugin name as the identifier", () => {
    expect(formatInstallCommand({ name: "code-review" })).toBe("/plugin install code-review@litellm");
  });
});

describe("extractКатегории", () => {
  it("returns Все and Other for empty list", () => {
    expect(extractКатегории([])).toEqual(["Все", "Other"]);
  });

  it("extracts and sorts unique categories", () => {
    const plugins = [{ category: "Разработка" }, { category: "Analytics" }, { category: "Разработка" }];
    expect(extractКатегории(plugins)).toEqual(["Все", "Analytics", "Разработка", "Other"]);
  });

  it("ignores empty/whitespace categories", () => {
    const plugins = [{ category: "" }, { category: "  " }, { category: "Инструменты" }];
    expect(extractКатегории(plugins)).toEqual(["Все", "Инструменты", "Other"]);
  });

  it("handles undefined category", () => {
    const plugins = [{ category: undefined }, { category: "Безопасность" }];
    expect(extractКатегории(plugins)).toEqual(["Все", "Безопасность", "Other"]);
  });
});

describe("validatePluginName", () => {
  it("accepts valid kebab-case names", () => {
    expect(validatePluginName("my-plugin")).toBe(true);
    expect(validatePluginName("plugin123")).toBe(true);
    expect(validatePluginName("a-b-c")).toBe(true);
  });

  it("rejects names with uppercase", () => {
    expect(validatePluginName("MyPlugin")).toBe(false);
  });

  it("rejects names with spaces", () => {
    expect(validatePluginName("my plugin")).toBe(false);
  });

  it("rejects empty/whitespace names", () => {
    expect(validatePluginName("")).toBe(false);
    expect(validatePluginName("  ")).toBe(false);
  });

  it("rejects names with special characters", () => {
    expect(validatePluginName("my_plugin")).toBe(false);
    expect(validatePluginName("my.plugin")).toBe(false);
  });
});

describe("getИсточникDisplayText", () => {
  it("shows github repo", () => {
    expect(getИсточникDisplayText({ source: "github", repo: "org/repo" })).toBe("GitHub: org/repo");
  });

  it("shows url", () => {
    expect(getИсточникDisplayText({ source: "url", url: "https://example.com" })).toBe("https://example.com");
  });

  it("shows git-subdir as url @ path for a github subdir", () => {
    expect(getИсточникDisplayText({ source: "git-subdir", url: "https://github.com/org/repo", path: "plugins/x" })).toBe(
      "https://github.com/org/repo @ plugins/x",
    );
  });

  it("shows git-subdir as url @ path for a gitlab subdir", () => {
    expect(getИсточникDisplayText({ source: "git-subdir", url: "https://gitlab.com/org/repo", path: "sub/dir" })).toBe(
      "https://gitlab.com/org/repo @ sub/dir",
    );
  });

  it("shows the archive url for an archive source", () => {
    expect(getИсточникDisplayText({ source: "archive", url: "https://bucket.s3.amazonaws.com/skill.zip" })).toBe(
      "https://bucket.s3.amazonaws.com/skill.zip",
    );
  });

  it("returns unknown for missing data", () => {
    expect(getИсточникDisplayText({ source: "github" })).toBe("Unknown source");
  });
});

describe("getИсточникLink", () => {
  it("returns github link for github source", () => {
    expect(getИсточникLink({ source: "github", repo: "org/repo" })).toBe("https://github.com/org/repo");
  });

  it("returns url for url source", () => {
    expect(getИсточникLink({ source: "url", url: "https://example.com" })).toBe("https://example.com");
  });

  it("returns the repo url for a github git-subdir source", () => {
    expect(getИсточникLink({ source: "git-subdir", url: "https://github.com/org/repo", path: "plugins/x" })).toBe(
      "https://github.com/org/repo",
    );
  });

  it("returns the repo url for a gitlab git-subdir source", () => {
    expect(getИсточникLink({ source: "git-subdir", url: "https://gitlab.com/org/repo", path: "sub/dir" })).toBe(
      "https://gitlab.com/org/repo",
    );
  });

  it("returns the archive url for an archive source", () => {
    expect(getИсточникLink({ source: "archive", url: "https://bucket.s3.amazonaws.com/skill.zip" })).toBe(
      "https://bucket.s3.amazonaws.com/skill.zip",
    );
  });

  it("returns null when no repo or url", () => {
    expect(getИсточникLink({ source: "github" })).toBeNull();
  });
});

describe("getКатегорияBadgeColor", () => {
  it("returns blue for development categories", () => {
    expect(getКатегорияBadgeColor("Разработка")).toBe("blue");
    expect(getКатегорияBadgeColor("dev-tools")).toBe("blue");
  });

  it("returns green for productivity categories", () => {
    expect(getКатегорияBadgeColor("Продуктивность")).toBe("green");
    expect(getКатегорияBadgeColor("Workflow")).toBe("green");
  });

  it("returns purple for learning categories", () => {
    expect(getКатегорияBadgeColor("Learning")).toBe("purple");
    expect(getКатегорияBadgeColor("Education")).toBe("purple");
  });

  it("returns red for security categories", () => {
    expect(getКатегорияBadgeColor("Безопасность")).toBe("red");
    expect(getКатегорияBadgeColor("Safety")).toBe("red");
  });

  it("returns orange for data categories", () => {
    expect(getКатегорияBadgeColor("Data")).toBe("orange");
    expect(getКатегорияBadgeColor("Analytics")).toBe("orange");
  });

  it("returns yellow for integration categories", () => {
    expect(getКатегорияBadgeColor("Integration")).toBe("yellow");
    expect(getКатегорияBadgeColor("API")).toBe("yellow");
  });

  it("returns gray for unknown or undefined categories", () => {
    expect(getКатегорияBadgeColor("Unknown")).toBe("gray");
    expect(getКатегорияBadgeColor(undefined)).toBe("gray");
  });
});

describe("formatDateString", () => {
  it("formats valid date strings", () => {
    const result = formatDateString("2024-01-15T12:00:00Z");
    expect(result).toContain("2024");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });

  it("returns N/A for undefined", () => {
    expect(formatDateString(undefined)).toBe("N/A");
  });

  it("returns N/A for empty string", () => {
    expect(formatDateString("")).toBe("N/A");
  });
});

describe("truncateText", () => {
  it("returns text unchanged if shorter than max", () => {
    expect(truncateText("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncateText("hello world", 5)).toBe("hello...");
  });

  it("handles exact length", () => {
    expect(truncateText("hello", 5)).toBe("hello");
  });

  it("handles empty text", () => {
    expect(truncateText("", 5)).toBe("");
  });
});

describe("filterПлагиныBySearch", () => {
  const plugins: MarketplacePluginEntry[] = [
    {
      name: "code-formatter",
      source: { source: "github", repo: "org/formatter" },
      description: "Formats code nicely",
      keywords: ["format", "lint"],
    },
    {
      name: "data-viewer",
      source: { source: "github", repo: "org/viewer" },
      description: "View data",
      keywords: ["analytics"],
    },
  ];

  it("returns all plugins for empty search", () => {
    expect(filterПлагиныBySearch(plugins, "")).toEqual(plugins);
    expect(filterПлагиныBySearch(plugins, "  ")).toEqual(plugins);
  });

  it("matches by name", () => {
    expect(filterПлагиныBySearch(plugins, "formatter")).toHaveLength(1);
    expect(filterПлагиныBySearch(plugins, "formatter")[0].name).toBe("code-formatter");
  });

  it("matches by description", () => {
    expect(filterПлагиныBySearch(plugins, "nicely")).toHaveLength(1);
  });

  it("matches by keyword", () => {
    expect(filterПлагиныBySearch(plugins, "analytics")).toHaveLength(1);
    expect(filterПлагиныBySearch(plugins, "analytics")[0].name).toBe("data-viewer");
  });

  it("is case insensitive", () => {
    expect(filterПлагиныBySearch(plugins, "FORMATTER")).toHaveLength(1);
  });
});

describe("filterПлагиныByКатегория", () => {
  const plugins: MarketplacePluginEntry[] = [
    { name: "a", source: { source: "github" }, category: "Dev" },
    { name: "b", source: { source: "github" }, category: "Безопасность" },
    { name: "c", source: { source: "github" }, category: "" },
    { name: "d", source: { source: "github" } },
  ];

  it("returns all plugins for 'Все'", () => {
    expect(filterПлагиныByКатегория(plugins, "Все")).toEqual(plugins);
  });

  it("returns uncategorized plugins for 'Other'", () => {
    const result = filterПлагиныByКатегория(plugins, "Other");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["c", "d"]);
  });

  it("filters by specific category", () => {
    const result = filterПлагиныByКатегория(plugins, "Dev");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("a");
  });
});

describe("isValidSemanticВерсия", () => {
  it("accepts valid semver", () => {
    expect(isValidSemanticВерсия("1.0.0")).toBe(true);
    expect(isValidSemanticВерсия("0.1.0-alpha")).toBe(true);
    expect(isValidSemanticВерсия("2.3.4+build.1")).toBe(true);
  });

  it("rejects invalid semver", () => {
    expect(isValidSemanticВерсия("1.0")).toBe(false);
    expect(isValidSemanticВерсия("abc")).toBe(false);
  });

  it("returns true for undefined (необязательно)", () => {
    expect(isValidSemanticВерсия(undefined)).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("returns true for undefined (необязательно)", () => {
    expect(isValidEmail(undefined)).toBe(true);
  });
});

describe("isValidUrl", () => {
  it("accepts valid urls", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects invalid urls", () => {
    expect(isValidUrl("not a url")).toBe(false);
  });

  it("returns true for undefined (необязательно)", () => {
    expect(isValidUrl(undefined)).toBe(true);
  });
});

describe("isValidSha256", () => {
  it("accepts an empty digest and a 64-character hex digest in either case", () => {
    expect(isValidSha256("")).toBe(true);
    expect(isValidSha256("a".repeat(64))).toBe(true);
    expect(isValidSha256(" " + "ABCDEF0123456789".repeat(4) + " ")).toBe(true);
  });

  it("rejects wrong length and non-hex digests", () => {
    expect(isValidSha256("a".repeat(63))).toBe(false);
    expect(isValidSha256("a".repeat(65))).toBe(false);
    expect(isValidSha256("g".repeat(64))).toBe(false);
  });
});

describe("parseКлючевые слова", () => {
  it("splits comma-separated keywords", () => {
    expect(parseКлючевые слова("a, b, c")).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace", () => {
    expect(parseКлючевые слова("  foo ,  bar  ")).toEqual(["foo", "bar"]);
  });

  it("filters empty entries", () => {
    expect(parseКлючевые слова("a,,b,")).toEqual(["a", "b"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseКлючевые слова("")).toEqual([]);
    expect(parseКлючевые слова("  ")).toEqual([]);
  });
});

describe("formatКлючевые слова", () => {
  it("joins keywords with comma and space", () => {
    expect(formatКлючевые слова(["a", "b", "c"])).toBe("a, b, c");
  });

  it("returns empty string for empty/undefined array", () => {
    expect(formatКлючевые слова([])).toBe("");
    expect(formatКлючевые слова(undefined)).toBe("");
  });
});

describe("parseSkillИсточник", () => {
  it("parses a plain github repo", () => {
    expect(parseSkillИсточник("github.com/org/repo")?.parsed).toEqual({ source: "github", repo: "org/repo" });
  });

  it("strips a .git suffix from the github repo shorthand", () => {
    expect(parseSkillИсточник("https://github.com/org/repo.git")?.parsed).toEqual({
      source: "github",
      repo: "org/repo",
    });
  });

  it("parses a github tree URL into a git-subdir", () => {
    expect(parseSkillИсточник("github.com/org/repo/tree/main/plugins/x")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://github.com/org/repo",
      path: "plugins/x",
    });
  });

  it("drops a trailing file segment from a github blob URL", () => {
    expect(parseSkillИсточник("github.com/org/repo/blob/main/x/SKILL.md")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://github.com/org/repo",
      path: "x",
    });
  });

  it("combines a github repo with an explicit subfolder", () => {
    expect(parseSkillИсточник("github.com/org/repo", "plugins/x")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://github.com/org/repo",
      path: "plugins/x",
    });
  });

  it("treats a gitlab repo as a raw url source", () => {
    expect(parseSkillИсточник("gitlab.com/org/repo")?.parsed).toEqual({
      source: "url",
      url: "https://gitlab.com/org/repo",
    });
  });

  it("keeps the .git suffix on raw urls", () => {
    expect(parseSkillИсточник("https://gitlab.com/org/repo.git")?.parsed).toEqual({
      source: "url",
      url: "https://gitlab.com/org/repo.git",
    });
  });

  it("combines a gitlab repo with an explicit subfolder", () => {
    expect(parseSkillИсточник("gitlab.com/org/repo", "plugins/x")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://gitlab.com/org/repo",
      path: "plugins/x",
    });
  });

  it("combines a self-hosted host with an explicit subfolder", () => {
    expect(parseSkillИсточник("https://git.acme.com/team/repo", "sub/dir")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://git.acme.com/team/repo",
      path: "sub/dir",
    });
  });

  it("lets a github URL-encoded subdir win over an also-provided subfolder", () => {
    expect(parseSkillИсточник("github.com/org/repo/tree/main/plugins/x", "ignored/path")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://github.com/org/repo",
      path: "plugins/x",
    });
  });

  it("rejects traversal, absolute, and double-slash subfolders", () => {
    expect(parseSkillИсточник("gitlab.com/org/repo", "../etc")).toBeNull();
    expect(parseSkillИсточник("gitlab.com/org/repo", "/abs")).toBeNull();
    expect(parseSkillИсточник("gitlab.com/org/repo", "a//b")).toBeNull();
  });

  it("returns null for empty and garbage input", () => {
    expect(parseSkillИсточник("")).toBeNull();
    expect(parseSkillИсточник("   ")).toBeNull();
    expect(parseSkillИсточник("not a url")).toBeNull();
  });

  it("parses an S3 zip URL into an archive source and names the skill after the file", () => {
    expect(parseSkillИсточник("https://skills-bucket.s3.us-east-1.amazonaws.com/plugins/My_Skill-1.0.0.zip")).toEqual({
      parsed: { source: "archive", url: "https://skills-bucket.s3.us-east-1.amazonaws.com/plugins/My_Skill-1.0.0.zip" },
      label: "Zip archive — skills-bucket.s3.us-east-1.amazonaws.com/plugins/My_Skill-1.0.0.zip",
      suggestedName: "my-skill-1-0-0",
    });
  });

  it("keeps the query string of a zip URL so versioned or signed object links still resolve", () => {
    expect(parseSkillИсточник("https://bucket.s3.amazonaws.com/skill.ZIP?versionId=abc")?.parsed).toEqual({
      source: "archive",
      url: "https://bucket.s3.amazonaws.com/skill.ZIP?versionId=abc",
    });
  });

  it("ignores the subfolder for a zip URL since the archive is installed whole", () => {
    expect(parseSkillИсточник("https://artifacts.example.com/skill.zip", "plugins/x")?.parsed).toEqual({
      source: "archive",
      url: "https://artifacts.example.com/skill.zip",
    });
  });

  it("rejects a plain http zip URL", () => {
    expect(parseSkillИсточник("http://artifacts.example.com/skill.zip")).toBeNull();
  });

  it("treats a github zip download URL as an archive rather than a repo path", () => {
    expect(parseSkillИсточник("https://github.com/org/repo/releases/download/v1/skill.zip")?.parsed).toEqual({
      source: "archive",
      url: "https://github.com/org/repo/releases/download/v1/skill.zip",
    });
  });

  it("suggests a kebab-friendly name from the last path segment", () => {
    expect(parseSkillИсточник("github.com/org/my-awesome-skill")?.suggestedName).toBe("my-awesome-skill");
    expect(parseSkillИсточник("github.com/org/repo/tree/main/plugins/cool-skill")?.suggestedName).toBe("cool-skill");
    expect(parseSkillИсточник("gitlab.com/org/repo", "plugins/x")?.suggestedName).toBe("x");
  });

  it("rejects a bad explicit subfolder for a github repo", () => {
    expect(parseSkillИсточник("github.com/org/repo", "../etc")).toBeNull();
    expect(parseSkillИсточник("github.com/org/repo", "/abs")).toBeNull();
    expect(parseSkillИсточник("github.com/org/repo", "a//b")).toBeNull();
  });

  it("treats a blob URL pointing at a root file as the plain repo", () => {
    expect(parseSkillИсточник("github.com/org/repo/blob/main/SKILL.md")?.parsed).toEqual({
      source: "github",
      repo: "org/repo",
    });
  });

  it("strips query strings and fragments before parsing", () => {
    expect(parseSkillИсточник("github.com/org/repo?tab=readme")?.parsed).toEqual({ source: "github", repo: "org/repo" });
    expect(parseSkillИсточник("github.com/org/repo#section")?.parsed).toEqual({ source: "github", repo: "org/repo" });
  });

  it("rejects a tree URL whose folder has a space or percent-encoded segment", () => {
    expect(parseSkillИсточник("github.com/org/repo/tree/main/a b")).toBeNull();
    expect(parseSkillИсточник("github.com/org/repo/tree/main/a%20b")).toBeNull();
  });

  it("rвыходes uppercase and www github hosts through the github shorthand", () => {
    expect(parseSkillИсточник("GitHub.com/org/repo/tree/main/x")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://github.com/org/repo",
      path: "x",
    });
    expect(parseSkillИсточник("www.github.com/org/repo")?.parsed).toEqual({ source: "github", repo: "org/repo" });
  });

  it("keeps a dotted folder name as the subdir path", () => {
    expect(parseSkillИсточник("github.com/org/repo/blob/main/my.skill")?.parsed).toEqual({
      source: "git-subdir",
      url: "https://github.com/org/repo",
      path: "my.skill",
    });
  });

  it("falls back to the repo for a tree URL with a branch but no folder", () => {
    expect(parseSkillИсточник("github.com/org/repo/tree/main")?.parsed).toEqual({ source: "github", repo: "org/repo" });
  });

  it("kebab-cases the suggested name from a mixed-case repo", () => {
    expect(parseSkillИсточник("github.com/Org/My_Repo")?.suggestedName).toBe("my-repo");
  });

  it("rejects a bare host or single-segment raw git url", () => {
    expect(parseSkillИсточник("gitlab.com")).toBeNull();
    expect(parseSkillИсточник("gitlab.com/org")).toBeNull();
  });
});

// Skill sources are served on the unauthenticated public feeds and cloned by clients, so the
// parser must never publish an insecure, credentialed, internal, or malformed clone URL.
describe("parseSkillИсточник — security boundary", () => {
  it("rejects non-https schemes", () => {
    for (const url of [
      "http://gitlab.com/org/repo",
      "HTTP://gitlab.com/org/repo",
      "ssh://gitlab.com/org/repo",
      "git://gitlab.com/org/repo",
      "ftp://gitlab.com/org/repo",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "data:text/plain,hi",
      "//gitlab.com/org/repo",
    ]) {
      expect(parseSkillИсточник(url)).toBeNull();
    }
  });

  it("rejects URLs with embedded credentials", () => {
    expect(parseSkillИсточник("https://user:token@gitlab.com/org/repo")).toBeNull();
    expect(parseSkillИсточник("https://user@gitlab.com/org/repo")).toBeNull();
    // userinfo confusion: the real host is evil.com, not github.com
    expect(parseSkillИсточник("https://github.com@evil.com/org/repo")).toBeNull();
  });

  it("rejects IP-literal hosts (loopback, private, metadata, obfuscated, IPv6)", () => {
    for (const url of [
      "https://127.0.0.1/org/repo",
      "https://10.0.0.5/org/repo",
      "https://169.254.169.254/org/repo",
      "https://2130706433/org/repo",
      "https://[::ffff:127.0.0.1]/org/repo",
    ]) {
      expect(parseSkillИсточник(url)).toBeNull();
    }
  });

  it("does not grant GitHub shorthand to a look-alike host", () => {
    expect(parseSkillИсточник("https://github.com.evil.com/org/repo")?.parsed).toEqual({
      source: "url",
      url: "https://github.com.evil.com/org/repo",
    });
  });

  it("rejects GitHub org/repo segments with illegal characters", () => {
    expect(parseSkillИсточник("github.com/o@x/repo")).toBeNull();
    expect(parseSkillИсточник("github.com/org/..%2f..%2fx")).toBeNull();
  });
});

describe("isValidSubПуть", () => {
  it("accepts relative segment paths", () => {
    expect(isValidSubПуть("plugins/x")).toBe(true);
    expect(isValidSubПуть("sub/dir")).toBe(true);
    expect(isValidSubПуть("a.b-c_d")).toBe(true);
    expect(isValidSubПуть("plugins/x/")).toBe(true);
  });

  it("rejects empty, traversal, absolute, and double-slash paths", () => {
    expect(isValidSubПуть("")).toBe(false);
    expect(isValidSubПуть("../etc")).toBe(false);
    expect(isValidSubПуть("/abs")).toBe(false);
    expect(isValidSubПуть("a//b")).toBe(false);
  });
});
