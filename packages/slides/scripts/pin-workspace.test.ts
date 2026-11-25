import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

import { pinWorkspaceRanges } from "./pin-workspace.ts";

const versions = new Map([
  ["@lanfermann/ui", "0.12.0"],
  ["@lanfermann/slides", "0.1.0"],
]);
const pin = (manifest: object): unknown =>
  JSON.parse(pinWorkspaceRanges(JSON.stringify(manifest), versions));

it("writes the package's own version where the range is workspace:*", () => {
  expect(
    pin({ name: "x", dependencies: { "@lanfermann/ui": "workspace:*", esbuild: "^0.28.2" } }),
  ).toEqual({ name: "x", dependencies: { "@lanfermann/ui": "0.12.0", esbuild: "^0.28.2" } });
});

it("keeps the sign of workspace:^ and workspace:~, and a range that is written out", () => {
  expect(
    pin({
      dependencies: { "@lanfermann/ui": "workspace:^" },
      peerDependencies: { "@lanfermann/slides": "workspace:~" },
      devDependencies: { "@lanfermann/ui": "workspace:>=0.12.0 <0.14.0" },
    }),
  ).toEqual({
    dependencies: { "@lanfermann/ui": "^0.12.0" },
    peerDependencies: { "@lanfermann/slides": "~0.1.0" },
    devDependencies: { "@lanfermann/ui": ">=0.12.0 <0.14.0" },
  });
});

it("refuses a package the workspace does not have", () => {
  expect(() => pin({ dependencies: { "@lanfermann/other": "workspace:*" } })).toThrow(
    "@lanfermann/other is not a package of this workspace",
  );
});

it("leaves nothing of a workspace range in this package's own manifest", () => {
  const manifest = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  // What is pinned here is what the release has to pin: the test fails when a new workspace
  // dependency appears that the release would not know.
  expect(manifest).toContain('"@lanfermann/ui": "workspace:*"');
  const pinned = pinWorkspaceRanges(manifest, versions);
  expect(pinned).not.toContain("workspace:");
  expect(pinned).toContain('"@lanfermann/ui": "0.12.0"');
  expect(pinned.endsWith("}\n")).toBe(true);
});
