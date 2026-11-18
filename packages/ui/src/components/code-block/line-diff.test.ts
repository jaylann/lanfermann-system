import { describe, expect, it } from "vitest";

import { changedRange, diffLines, splitRuns } from "./line-diff";

/** A configuration as an app builds it from a reader's choices. */
function config(env: Record<string, string>) {
  return JSON.stringify(
    { mcpServers: { sevdesk: { command: "npx", args: ["-y", "mcp-server-sevdesk"], env } } },
    null,
    2,
  ).split("\n");
}

const token = { SEVDESK_API_TOKEN: "<dein API-Token>" };

describe("diffLines", () => {
  it("keeps every line when nothing changed", () => {
    const lines = config(token);
    expect(diffLines(lines, lines)).toEqual({ from: lines.map((_, i) => i), removed: [] });
  });

  it("adds a line and keeps the one above it that only gained a comma", () => {
    const before = config(token);
    const after = config({ ...token, SEVDESK_DRY_RUN: "1" });
    const { from, removed } = diffLines(before, after);
    const tokenLine = before.findIndex((line) => line.includes("SEVDESK_API_TOKEN"));
    const dryRun = after.findIndex((line) => line.includes("SEVDESK_DRY_RUN"));
    expect(from[tokenLine]).toBe(tokenLine);
    expect(after[tokenLine]).toMatch(/,$/);
    expect(from[dryRun]).toBe(-1);
    expect(from.filter((index) => index === -1)).toHaveLength(1);
    expect(removed).toEqual([]);
  });

  it("removes a line again, the line above it losing its comma", () => {
    const before = config({ ...token, SEVDESK_DRY_RUN: "1" });
    const after = config(token);
    const { from, removed } = diffLines(before, after);
    expect(removed).toEqual([before.findIndex((line) => line.includes("SEVDESK_DRY_RUN"))]);
    expect(from).not.toContain(-1);
  });

  it("changes a value in place", () => {
    const before = config({ ...token, SEVDESK_ALLOW: "read,draft" });
    const after = config({ ...token, SEVDESK_ALLOW: "read,draft,commit" });
    const allow = before.findIndex((line) => line.includes("SEVDESK_ALLOW"));
    const { from, removed } = diffLines(before, after);
    expect(from[allow]).toBe(allow);
    expect(removed).toEqual([]);
  });

  it("adds a line between two lines that stay, and changes one beside it", () => {
    const before = config({ ...token, SEVDESK_ALLOW: "read,draft", SEVDESK_AUDIT_LOG: "/a.jsonl" });
    const after = config({
      ...token,
      SEVDESK_ALLOW: "read,draft,commit",
      SEVDESK_DRY_RUN: "1",
      SEVDESK_AUDIT_LOG: "/a.jsonl",
    });
    const { from, removed } = diffLines(before, after);
    const at = (lines: string[], name: string) => lines.findIndex((line) => line.includes(name));
    expect(from[at(after, "SEVDESK_ALLOW")]).toBe(at(before, "SEVDESK_ALLOW"));
    expect(from[at(after, "SEVDESK_DRY_RUN")]).toBe(-1);
    expect(from[at(after, "SEVDESK_AUDIT_LOG")]).toBe(at(before, "SEVDESK_AUDIT_LOG"));
    expect(removed).toEqual([]);
  });

  it("finds a flag added to a shell command", () => {
    const before = [
      "claude mcp add sevdesk \\",
      "  -e SEVDESK_API_TOKEN=$SEVDESK_API_TOKEN \\",
      "  -- npx -y mcp-server-sevdesk",
    ];
    const after = [before[0]!, before[1]!, "  -e SEVDESK_DRY_RUN=1 \\", before[2]!];
    expect(diffLines(before, after)).toEqual({ from: [0, 1, -1, 2], removed: [] });
  });

  it("tells a setting that changed from one that went and one that came", () => {
    const before = ["SEVDESK_ALLOW=read", "SEVDESK_CONFIRM=browser", "SEVDESK_HTTP_TRUST_PROXY=1"];
    const after = [
      "SEVDESK_ALLOW=read,draft,commit",
      "SEVDESK_DRY_RUN=1",
      "SEVDESK_HTTP_TRUST_PROXY=1",
    ];
    expect(diffLines(before, after)).toEqual({ from: [0, -1, 2], removed: [1] });
  });

  it("replaces code that has nothing in common", () => {
    expect(diffLines(["{", "}"], ["claude mcp add sevdesk"])).toEqual({
      from: [-1],
      removed: [0, 1],
    });
  });

  it("keeps empty lines and repeated lines in their order", () => {
    const before = ["a", "", "}", "", "}"];
    const after = ["a", "", "b", "}", "", "}"];
    expect(diffLines(before, after)).toEqual({ from: [0, 1, -1, 2, 3, 4], removed: [] });
  });

  it("compares the ends only when the code is too long for a full comparison", () => {
    const before = Array.from({ length: 600 }, (_, i) => `line ${i}`);
    const after = [...before.slice(0, 300), "new", ...before.slice(300)];
    const { from, removed } = diffLines(before, after);
    expect(from[300]).toBe(-1);
    expect(from[0]).toBe(0);
    expect(from[600]).toBe(599);
    expect(removed).toEqual([]);
  });
});

describe("changedRange", () => {
  it("finds what was put in", () => {
    expect(changedRange('"read,draft"', '"read,draft,commit"')).toEqual([11, 18]);
    expect(changedRange('"x": "y"', '"x": "y",')).toEqual([8, 9]);
  });

  it("is null when nothing was put in", () => {
    expect(changedRange("same", "same")).toBeNull();
    expect(changedRange('"x": "y",', '"x": "y"')).toBeNull();
  });

  it("takes a doubled letter as one change", () => {
    expect(changedRange("aa", "aaa")).toEqual([2, 3]);
  });
});

describe("splitRuns", () => {
  const runs = [
    { content: '"SEVDESK_ALLOW"', color: "attribute" },
    { content: ": ", color: "punct" },
    { content: '"read,draft,commit"', color: "string" },
  ];

  it("cuts the runs at the range and flags what is inside", () => {
    const pieces = splitRuns(runs, [28, 35]);
    expect(pieces.map((piece) => piece.content).join("")).toBe(
      runs.map((run) => run.content).join(""),
    );
    expect(pieces.filter((piece) => piece.fresh).map((piece) => piece.content)).toEqual([
      ",commit",
    ]);
    expect(pieces.find((piece) => piece.fresh)?.color).toBe("string");
  });

  it("flags a range that spans runs in each of them", () => {
    const pieces = splitRuns(runs, [10, 20]);
    expect(pieces.filter((piece) => piece.fresh).map((piece) => piece.content)).toEqual([
      'LLOW"',
      ": ",
      '"re',
    ]);
  });
});
