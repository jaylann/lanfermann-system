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
- **`packages/slides`** — `@lanfermann/slides`, the command-line tool that checks, previews,
  builds and packs a slide deck written with the library's slide parts (see [Decks](#decks)).
  A package of its own, so the library does not carry a bundler and a compiler.
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
| `bun run slides:e2e`              | The deck tool from end to end, in the system's Chrome        |

In `packages/ui`, with a browser:

| Script                    | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `bun run test:stories`    | Every story in a real browser: no accessibility violation, `play` passes |
| `bun run visual:check`    | Draws every story in the pinned container and compares with the baseline |
| `bun run visual:baseline` | Draws them again and accepts the result as the new baseline              |
| `bun run storybook:phone` | Serves the built workshop on the local network, for a real phone         |

`test:stories` takes `VISUAL_BROWSER=chrome|webkit|firefox`, `SB_GROUND=ink` and `SB_MODE=dark`.

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
import { ThemeScript } from "@lanfermann/ui";
import { JetBrains_Mono, Sofia_Sans } from "next/font/google";

const sans = Sofia_Sans({ subsets: ["latin"], variable: "--font-sofia-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      data-theme="paper"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
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
  the colour scope; `.dark` is an alias for Ink. For a nested region that opens popups, use
  `<Ground ground="ink">` so they keep that ground.
- **Dark mode:** `data-mode="dark"` on `<html>` turns every ground into its dark counterpart, and
  the `dark:` variant follows it (and Ink). `<ThemeScript />` in the `<head>` sets it before the
  first paint from the reader's stored choice, or from the system's setting without one; give
  `<html>` `suppressHydrationWarning`, since the script writes there before React hydrates. Wire
  the switch with `useTheme`, which keeps the choice in `localStorage` and a cookie (`lf-theme`,
  for a server that renders `data-mode` itself) and fades the page into the new mode:

  ```tsx
  "use client";
  import { ThemeSwitch, useTheme } from "@lanfermann/ui";

  export function Theme() {
    const { theme, setTheme } = useTheme();
    return <ThemeSwitch value={theme} onValueChange={setTheme} />;
  }
  ```

  Without `ThemeScript` the page stays light until the reader switches.

- **Density:** controls are compact by default; `data-density="comfortable"` on `<html>` or on a
  subtree gives the larger set.

### Slides

The parts of a deck are a second entry, so an app that shows none does not load them. Import the
stylesheet after the library's, and the parts from `@lanfermann/ui/slides`:

```css
@import "tailwindcss";
@import "@lanfermann/ui/styles.css";
@import "@lanfermann/ui/slides.css";
```

```tsx
import { Deck, Slide, Spacer, Stage } from "@lanfermann/ui/slides";

<Stage>
  <Slide ground="ink" deck="Der digitale Handschlag" page={4}>
    <h2 className="slide-span-12 text-slide-statement font-medium text-fg">
      Vertrauen entsteht,
      <br />
      bevor das Telefon klingelt.
    </h2>
    <Spacer />
  </Slide>
</Stage>;
```

- A slide is a fixed canvas of 1920 by 1080px. `Stage` scales it to the box it is given; a
  `Deck` on its own stacks its slides at that size, which is also how it prints (one slide a
  page, through a named `@page`, so the app's other pages print as before). A page that is
  nothing but a deck, such as the source of a PDF, sets `data-slides-document` on `<html>`, or
  Chromium ends the PDF on one empty page.
- A slide has grounds of its own (`ground="paper | tint | ink | indigo"`). `data-theme` and dark
  mode do not reach it: a deck is the same picture on a dark page.
- A slide may show its blocks click by click: `<Step at={1}>…</Step>` around a block, or `step`
  on an item of a part that lists things. What appears keeps its place, so nothing reflows. The
  player counts the steps from the parts; a component of your own that uses steps inside names
  them where it is used (`steps={2}`). Presented live, a step fades in and the blocks of a new
  slide rise in; everywhere else (a `Deck` on its own, a print, a preview) every step is shown and
  nothing moves. `data-motion="none"` on a `Slide` keeps it still.
- The rules of a slide (type, grid, one accent, sources) are in `packages/ui/DESIGN.md`, "Slides".

#### Presenting a deck

The player is a third entry, `@lanfermann/ui/slides/player`. It takes a `<Deck>` element and is
the whole page:

```css
@import "@lanfermann/ui/slides.css";
@import "@lanfermann/ui/slides/player.css";
```

```tsx
"use client";
import { Player } from "@lanfermann/ui/slides/player";

<Player deck={deck} mode="presenter" />;
```

- `mode="audience"` (default) shows one slide as large as the window: arrows, Space, PageUp and
  PageDown (a clicker), Home and End, a swipe, a click on either half, `F` for the full screen,
  `B` for a black screen, and `#/7` or `#/<id>` as a deep link. `pdf="…"` adds „PDF laden“.
- `mode="presenter"` is the console: the current and the next slide, the notes (`notes` on a
  slide), the time since the first step and the time of day, the grid of all slides (`G`), and a
  second window for the audience that follows this one.
- `mode="print"` stacks the slides one a page, for Chromium's `page.pdf()` with
  `preferCSSPageSize` and `printBackground`. `mode="check"` measures them and writes a report to
  `window.__slidesReport`: parts beyond the content box or the canvas, boxes that cut off their
  content, a text on more lines than its `data-lines` allows, a slide that threw.
- `window.__slidesReady` is `true`, in every mode, once fonts and pictures are there and a frame
  has been drawn; in check mode the report is on the window by then. Every slide is
  `[data-slot="slide"]` with `data-slide-index` and, where it has one, `data-slide-id`.
- In a frame of another page (`window.parent !== window`, or `embed`) the player speaks to that
  page over `postMessage`: it says `ready` and then its `state` on every change, takes `go` and
  `intent` from the parent only, opens no window and asks for no full screen. The messages are
  in `src/slides/player/embed.ts`.
- `labels` replaces the player's own words, which are German by default.

A deck that is **one HTML file** uses the prebuilt player instead, which the package ships in
`@lanfermann/ui/slides/player/*`: `player.global.js` (React, the slide parts and the player as
one script that sets `globalThis.__LF_SLIDES__`), `player.css`, `fonts.inline.css` (or `fonts.css`
with `fonts/`), `classes.json` (the class names `player.css` defines: what a deck may use),
`manifest.json` and `NOTICES.txt`. The deck's own script is compiled with `react`,
`react/jsx-runtime` and `@lanfermann/ui/slides` mapped to `__LF_SLIDES__.React`, `.jsxRuntime` and
`.slides`, and calls `__LF_SLIDES__.mount(deck, { mode, modes, pdf, labels })`. `?mode=` in the
address picks another mode if `modes` allows it; by default that is every mode but the presenter's.
The file runs from disk without a network.

### Language

Every component says its own words in German and formats numbers and dates with `de-DE`. A
`LocaleProvider` around the app switches both to English (`en-US`):

```tsx
import { LocaleProvider } from "@lanfermann/ui";

<LocaleProvider locale="en">{children}</LocaleProvider>;
```

A label or a `locale` passed to a component still wins. Server-safe parts (`Stat`, `Steps`,
`Callout`, `Link` and the like) follow the provider for the words they render as text; a label
that is an attribute (`Chip`'s `removeLabel`, `Breadcrumbs`' `label`, `AnchorHeading`'s
`anchorLabel`) and the `locale` of `Bullet` and `Funnel` are passed from a Server Component, with
the words from `getMessages(locale)`. The typed date fields read and write the format of the
language: 30.11.2026 in German, 11/30/2026 (month first, also 11/30, 11-30-2026 and "11/14 to
11/30") in English, where a date with dots is not read. A time is on the field's own clock in
both (`hourCycle`, 24 hours by default), and what is submitted stays the ISO value. `DateField`,
`DateRangeField` and `TimeField` take `labels` for their validation messages and the sheet's
keys.

### Consent (cookie banner)

`ConsentProvider` asks before anything that stores or reads data in the browser is loaded, keeps
the answer in a first-party cookie (`lf-consent`, no ID), and renders the banner itself. It is a
client component that takes functions, so give it a small client file of its own:

```tsx
// app/consent.tsx
"use client";
import { type ConsentConfig, ConsentProvider } from "@lanfermann/ui";
import { persistConsent } from "./actions";

const config: ConsentConfig = {
  revision: "2026-11-18", // change it when the texts change: everyone is asked again
  categories: [
    {
      id: "medien",
      name: "Externe Medien",
      description: "Zeigt Videos von anderen Anbietern direkt auf der Seite.",
      services: [
        {
          id: "youtube",
          name: "YouTube",
          provider: "Google Ireland Limited, Irland",
          purpose: "Zeigt eingebettete Videos.",
          profiling: true,
          thirdCountry: "USA",
          privacyUrl: "https://policies.google.com/privacy",
        },
      ],
    },
  ],
};

export function Consent({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider
      config={config}
      privacyHref="/datenschutz"
      imprintHref="/impressum"
      persist={persistConsent}
    >
      {children}
    </ConsentProvider>
  );
}
```

```ts
// app/actions.ts — optional: Safari keeps a cookie written by script for at most 7 days.
"use server";
import { cookies } from "next/headers";

export async function persistConsent(value: string, maxAge: number) {
  if (value.length > 2048 || !/^[\w%.~-]*$/.test(value)) return;
  (await cookies()).set("lf-consent", decodeURIComponent(value), {
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: true,
    httpOnly: false,
  });
}
```

- Wrap the app in `<Consent>` inside the `isolate` element of the root layout.
- Gate what needs consent: `<ConsentGate service="matomo"><Script … /></ConsentGate>` renders
  only once it is allowed (never on the server); `<ConsentEmbed service="youtube"><iframe …
/></ConsentEmbed>` shows a placeholder that loads nothing until asked. `useConsent()` gives
  `status`, `allows(id)` and the decisions, for code that loads a script itself.
- Put `<ConsentSettingsTrigger />` among the legal links of every page's footer (in a
  `SiteFooter`, with `className={siteFooterLinkClass}` inside a `<li>`).
- `onChange(record, { granted, revoked, initial })` is the place for Google Consent Mode or a
  server-side log; it also runs once on load with a stored answer.
- A Server Component can read the same cookie: `parseConsent(cookie?.value, config)`. Reading
  `cookies()` makes the route dynamic (under Cache Components it needs a `<Suspense>`); the
  banner itself never needs it.
- What the component cannot know, the site states: every service truthfully in `config`, the
  same in its privacy policy, and old configs kept (git history does) as proof of what was asked.
  Revoking deletes the first-party storage a service lists; its cookies on other domains are out
  of reach.

## Decks

A deck is a folder with a `deck.tsx` whose default export is a `<Deck>` element, with `notes`
on each slide for the presenter. `@lanfermann/slides` (`packages/slides`) turns it into one HTML
file that runs from a disk without a network:

```bash
slides check <dir>                    # imports, notes, classes, types, and the layout of every slide
slides dev <dir>                      # the presenter's view on 127.0.0.1, built again on change
slides build <dir> --audience --pdf   # <slug>.html without the notes, and <slug>.pdf
slides build <dir> --presenter        # <slug>.presenter.html, with the notes
slides pack <dir>                     # the source as one JSON file for the hub
```

- A deck imports React, `@lanfermann/ui/slides` and its own files, and nothing else. `check`
  names anything else by file, line and column.
- The file for an audience holds no notes: they are taken out of the source before it is
  compiled, and the finished script is searched for their words. A deck whose notes cannot be
  left out for certain gets no file.
- Every built file carries a policy that lets it load nothing, and the notices of what the
  player contains.
- `check` and `--pdf` draw the deck in the system's Chrome through `playwright-core`; nothing is
  downloaded. `SLIDES_BROWSER` picks another browser.

The format, the rules for notes and pictures, and every code the check prints:
[`packages/slides/docs/deck-format.md`](packages/slides/docs/deck-format.md). The library
behind the commands (`bundleDeck`, `typecheckDeck`, `deckHtml`), which the hub uses as well:
[`packages/slides/README.md`](packages/slides/README.md).

In this repository the tool runs from its source folder after `bun run build`
(`node packages/slides/dist/cli.js check packages/slides/fixtures/sample`), and
`bun run slides:e2e` walks all of it through a browser.

## Adding a component

1. Read `packages/ui/DESIGN.md` and the rule files in `.claude/rules/` (tokens, components,
   motion, visual verification). They are short and they are the conventions.
2. `packages/ui/src/components/<name>/<name>.tsx` — wrap the Base UI part, style with the
   semantic tokens, put `data-slot` on every part. Add `"use client"` when it uses hooks or Base
   UI parts.
3. `<name>.stories.tsx` beside it, and an export in `packages/ui/src/index.ts`. A slide part
   lives in `packages/ui/src/slides/<name>/` instead and is exported from `src/slides/index.ts`
   (`.claude/rules/slides.md`).
4. Give it a `Keyboard` story with a `play` function for its keyboard path.
5. Look at it: `bun run build-storybook`, then the capture script, on all four grounds, in the
   three engines and at phone width. Then `bun run test:stories` and `bun run visual:check`.

## Conventions

- **Branches:** `stage` is the working branch; `main` is release/tag-only.
- **Releases:** a push to `main` makes release-please open a release PR per package with the
  next version and the changelog, read from the commit messages that touched it. Merging one
  publishes that package to npm from CI, with provenance (`.github/workflows/release.yml`), and
  brings the release commit back to `stage`: a fast-forward, or a `main` → `stage` PR if `stage`
  moved on in the meantime. `@lanfermann/ui` is tagged `vX.Y.Z`, `@lanfermann/slides`
  `slides-vX.Y.Z`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), enforced by the
  `commit-msg` hook and the `pr-title` CI check.
- **Linting/format:** staged files are fixed on commit; CI runs lint, typecheck, test, build, the
  Storybook build, the story tests, the deck tool's end-to-end run, the visual check and a spell
  check.

## License

The code is under the [MIT license](LICENSE). The name and the logo are not: see
[TRADEMARK.md](TRADEMARK.md). Issues and pull requests: [CONTRIBUTING.md](CONTRIBUTING.md).
