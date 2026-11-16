# lanfermann-system

The Lanfermann design system: React components for Next.js + Tailwind CSS v4, built on
[Base UI](https://base-ui.com) unstyled primitives. How it looks, moves and reads, and why, is
written down in [`packages/ui/DESIGN.md`](packages/ui/DESIGN.md).

## Stack

- **`packages/ui`** — `@lanfermann/ui`, the component library. TypeScript, built with
  [tsdown](https://tsdown.dev) to ESM + type declarations, one file per module so `"use client"`
  directives are kept. Base UI (`@base-ui/react`) for behavior and accessibility, Tailwind for
  styling, `class-variance-authority` for variants, `cn()` (clsx + tailwind-merge) for class
  composition, [Hugeicons](https://hugeicons.com) for icons.
  - **Storybook** (inside the package) is the workshop: every component, the foundations
    (grounds, type, depth, motion, icons) and whole-screen patterns.
  - `scripts/visual/capture.ts` takes screenshots, state strips and motion strips of every story.
  - Every story is also a test (accessibility, and a `play` function for its keyboard path), and
    its picture is compared with a committed baseline.
- **`apps/docs`** — a Next.js (App Router) app that consumes the built library through the
  workspace. It is the consumer smoke test, not the place to look at components.
- bun workspaces · ESLint + Prettier · Vitest · GitHub Actions.

## Setup

```bash
bun install                        # also builds @lanfermann/ui (postinstall)
git config core.hooksPath githooks # commit-msg + staged lint/format hooks
bun run storybook                  # the workshop, http://127.0.0.1:6006
```

| Script                            | What it does                                                 |
| --------------------------------- | ------------------------------------------------------------ |
| `bun run storybook`               | Storybook dev server on port 6006                            |
| `bun run build-storybook`         | Static Storybook in `packages/ui/storybook-static`           |
| `bun run shots`                   | Screenshots of every story into `packages/ui/.visual`        |
| `bun run dev`                     | Library in watch mode + docs dev server                      |
| `bun run build`                   | Build library, then docs                                     |
| `bun run gen:motion`              | Regenerate the spring CSS from `src/motion/springs.ts`       |
| `bun run lint` / `lint:fix`       | ESLint over the whole workspace                              |
| `bun run format` / `format:check` | Prettier                                                     |
| `bun run typecheck`               | `tsc --noEmit` in every workspace                            |
| `bun run test`                    | Vitest (class merging, token contrast, generated-file drift) |

In `packages/ui`, with a browser:

| Script                    | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `bun run test:stories`    | Every story in a real browser: no accessibility violation, `play` passes |
| `bun run visual:check`    | Draws every story in the pinned container and compares with the baseline |
| `bun run visual:baseline` | Draws them again and accepts the result as the new baseline              |
| `bun run storybook:phone` | Serves the built workshop on the local network, for a real phone         |

`test:stories` takes `VISUAL_BROWSER=chrome|webkit|firefox` and `SB_GROUND=ink`.

### When a picture changes

`visual:check` needs Docker: the browser that draws the pictures is the one in the pinned
Playwright image (`scripts/visual/image.ts`), on a laptop and in CI alike, because only the same
build with the same fonts draws the same pixels. Build the workshop first
(`bun run build-storybook`).

If the check fails, look at the strips in `packages/ui/.visual/diff/` (baseline, now, and the
difference). If the change is meant, run `bun run visual:baseline`, look at the changed files
under `packages/ui/visual-baseline/` and commit them with the change that caused them. A bump of
Playwright redraws everything: it gets a baseline run of its own. Without Docker at hand, the
`Visual baseline` workflow draws them on a runner and offers them as a download; it does not
commit them.

## Using it in an app

```bash
bun add @lanfermann/ui
```

```css
/* app/globals.css */
@import "tailwindcss";
@import "@lanfermann/ui/styles.css";
```

```tsx
// app/layout.tsx
import { JetBrains_Mono, Sofia_Sans } from "next/font/google";

const sans = Sofia_Sans({ subsets: ["latin"], variable: "--font-sofia-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="paper" className={`${sans.variable} ${mono.variable}`}>
      <body className="relative min-h-dvh font-sans text-fg-body">
        <div className="isolate flow-root min-h-dvh bg-ground">{children}</div>
      </body>
    </html>
  );
}
```

```tsx
import { Button, Field, FieldLabel, Input } from "@lanfermann/ui";
```

What the app provides, and what it gets:

- **Peers:** `react`, `react-dom` and `tailwindcss` 4. `motion` 14 is an optional peer: every
  component animates with CSS so far; it is reserved for gestures.
- **Fonts:** Sofia Sans and JetBrains Mono, exposed as `--font-sofia-sans` and
  `--font-jetbrains-mono` on `<html>` (as above), or the Fontsource variable packages.
- **Root:** Base UI portals popups to `<body>`. Give the body `relative` and wrap the app in an
  `isolate` element so popups stack above it. The wrapper paints the ground
  (`flow-root min-h-dvh bg-ground`), never the body: Safari fills what lies beyond the page
  (behind its status bar and toolbar, and an overscroll) from `<html>` and `<body>` blended, the
  body on top, and `<html>` takes the colour of the end the reader is at: the ground at the top,
  the footer's near the end of a page with a `SiteFooter`.
- **Tokens:** `styles.css` defines the semantic utilities (`bg-ground`, `bg-surface`, `text-fg`,
  `text-fg-muted`, `border-line`, `bg-accent`, the status colours, `depth-*`, `spring-*`, …) and
  registers the library's compiled output as a Tailwind source. App code styles with these, not
  with raw palette colours.
- **Grounds:** `data-theme="paper | tint | ink | indigo"` on `<html>` or on any element switches
  the colour scope; `.dark` is an alias for Ink, and the `dark:` variant follows it. For a nested
  region that opens popups, use `<Ground ground="ink">` so they keep that ground.
- **Density:** controls are compact by default; `data-density="comfortable"` on `<html>` or on a
  subtree gives the larger set.

## Adding a component

1. Read `packages/ui/DESIGN.md` and the rule files in `.claude/rules/` (tokens, components,
   motion, visual verification). They are short and they are the conventions.
2. `packages/ui/src/components/<name>/<name>.tsx` — wrap the Base UI part, style with the
   semantic tokens, put `data-slot` on every part. Add `"use client"` when it uses hooks or Base
   UI parts.
3. `<name>.stories.tsx` beside it, and an export in `packages/ui/src/index.ts`.
4. Give it a `Keyboard` story with a `play` function for its keyboard path.
5. Look at it: `bun run build-storybook`, then the capture script, on all four grounds, in the
   three engines and at phone width. Then `bun run test:stories` and `bun run visual:check`.

## Conventions

- **Branches:** `stage` is the working branch; `main` is release/tag-only.
- **Releases:** a push to `main` makes release-please open a release PR with the next version and
  the changelog, read from the commit messages. Merging it publishes `@lanfermann/ui` to npm from
  CI, with provenance (`.github/workflows/release.yml`), and brings the release commit back to
  `stage`: a fast-forward, or a `main` → `stage` PR if `stage` moved on in the meantime.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), enforced by the
  `commit-msg` hook and the `pr-title` CI check.
- **Linting/format:** staged files are fixed on commit; CI runs lint, typecheck, test, build, the
  Storybook build, the story tests, the visual check and a spell check.

## License

The code is under the [MIT license](LICENSE). The name and the logo are not: see
[TRADEMARK.md](TRADEMARK.md). Issues and pull requests: [CONTRIBUTING.md](CONTRIBUTING.md).
