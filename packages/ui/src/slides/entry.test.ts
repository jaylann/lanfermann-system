import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * The slide parts are a second entry (`@lanfermann/ui/slides`) so that an app which shows no deck
 * never loads them. That only holds while nothing in the library's own entry imports from here.
 */
describe("the slides entry", () => {
  const src = fileURLToPath(new URL("..", import.meta.url));
  const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter(
    (file) => /\.tsx?$/.test(file) && !file.startsWith("slides/"),
  );

  it("is not imported by anything outside src/slides", () => {
    expect(files.length).toBeGreaterThan(100);
    const importing = files.filter((file) =>
      /from\s+"(@\/slides|[./]+\/slides)\//.test(readFileSync(`${src}/${file}`, "utf8")),
    );
    expect(importing).toEqual([]);
  });
});
