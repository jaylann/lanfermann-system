import { afterEach, describe, expect, it, vi } from "vitest";

import { highlightLines } from "./highlight";

describe("highlightLines", () => {
  afterEach(() => vi.restoreAllMocks());

  /*
   * Next.js with `cacheComponents` fails the build of a page that reads the clock while it is
   * prerendered, and Shiki's tokenizer reads it once per line. Next notices the read the way
   * this test does: through `Date.now` itself.
   */
  it("reads no clock while it colours code", () => {
    const now = vi.spyOn(Date, "now");
    const lines = highlightLines('export const ground = "paper";', "ts");
    expect(now).not.toHaveBeenCalled();
    expect(lines[0]?.some((token) => token.color?.includes("--lf-code-keyword"))).toBe(true);
  });

  /* Configuration a server's docs show: a settings file, an environment file, a Windows shell. */
  it.each([
    ["toml", '[server]\nport = 8080\nname = "sevdesk"', "--lf-code-string"],
    ["env", "SEVDESK_ALLOW=write\n# only drafts", "--lf-code-comment"],
    ["powershell", '$env:SEVDESK_API_TOKEN = "abc"', "--lf-code-string"],
  ] as const)("colours %s", (language, code, role) => {
    const tokens = highlightLines(code, language).flat();
    expect(tokens.some((token) => token.color?.includes(role))).toBe(true);
  });

  /* The ini grammar's scopes differ between Shiki versions: it is enough that it is not plain. */
  it("colours ini", () => {
    const tokens = highlightLines("[profile work]\nregion = eu\n; a comment", "ini").flat();
    expect(tokens.some((token) => token.color && !token.color.includes("--lf-code-text"))).toBe(
      true,
    );
  });

  it("leaves the clock as it found it", () => {
    const now = vi.spyOn(Date, "now");
    highlightLines("bun add @lanfermann/ui", "sh");
    expect(Date.now).toBe(now);
    Date.now();
    expect(now).toHaveBeenCalledOnce();
  });
});
