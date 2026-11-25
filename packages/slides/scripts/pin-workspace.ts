/**
 * Writes real versions where a package.json names a package of this workspace as `workspace:*`,
 * before the package is packed for npm. The release runs it on the checkout of the release tag
 * (.github/workflows/release.yml); nothing of it is committed.
 *
 *   node packages/slides/scripts/pin-workspace.ts packages/slides
 *
 * Neither packer can be trusted with this. npm publishes the range as it stands. bun fills in
 * the version its lockfile holds for the workspace, and a release moves package.json, not the
 * lockfile: on 2026-11-24 `bun pm pack` wrote `@lanfermann/ui: 0.9.0` while the library was at
 * 0.12.0. So the version is read from the other package's own package.json.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FIELDS = ["dependencies", "peerDependencies", "optionalDependencies", "devDependencies"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The text of a package.json with every `workspace:` range replaced: `workspace:*` by the
 * package's exact version, `workspace:^` and `workspace:~` by that version behind the sign, and
 * `workspace:<range>` by the range. A package the workspace does not have is an error.
 */
export function pinWorkspaceRanges(
  manifest: string,
  versions: ReadonlyMap<string, string>,
): string {
  const json: unknown = JSON.parse(manifest);
  if (!isRecord(json)) throw new Error("The package.json is not an object.");
  for (const field of FIELDS) {
    const dependencies = json[field];
    if (!isRecord(dependencies)) continue;
    for (const [name, range] of Object.entries(dependencies)) {
      if (typeof range !== "string" || !range.startsWith("workspace:")) continue;
      const version = versions.get(name);
      if (version === undefined) {
        throw new Error(`${name} is not a package of this workspace, so its version is unknown.`);
      }
      const wanted = range.slice("workspace:".length);
      dependencies[name] =
        wanted === "*" || wanted === ""
          ? version
          : wanted === "^" || wanted === "~"
            ? `${wanted}${version}`
            : wanted;
    }
  }
  return `${JSON.stringify(json, null, 2)}\n`;
}

/** The name and version of every package under the workspace's folders. */
function workspaceVersions(root: string): Map<string, string> {
  const versions = new Map<string, string>();
  for (const group of ["packages", "apps"]) {
    for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      let json: unknown;
      try {
        json = JSON.parse(readFileSync(join(root, group, entry.name, "package.json"), "utf8"));
      } catch {
        // A folder without a package.json is no package.
        continue;
      }
      if (isRecord(json) && typeof json.name === "string" && typeof json.version === "string") {
        versions.set(json.name, json.version);
      }
    }
  }
  return versions;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../../..", import.meta.url));
  const dir = process.argv[2];
  if (dir === undefined) throw new Error("Usage: node pin-workspace.ts <package folder>");
  const file = join(resolve(root, dir), "package.json");
  const before = readFileSync(file, "utf8");
  const after = pinWorkspaceRanges(before, workspaceVersions(root));
  writeFileSync(file, after);
  console.log(after === before ? "no workspace range to write" : `wrote real versions to ${file}`);
}
