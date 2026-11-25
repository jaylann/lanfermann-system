import { readFileSync } from "node:fs";

import { expect, it } from "vitest";

import { version } from "./version";

it("is the version of package.json (the release writes both)", () => {
  const manifest: unknown = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  expect(manifest).toMatchObject({ name: "@lanfermann/slides", version });
});
