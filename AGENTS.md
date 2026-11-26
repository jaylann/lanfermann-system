# lanfermann-system

Component library (`@lanfermann/ui`) for Next.js + Tailwind CSS v4 on Base UI (`@base-ui/react`),
plus a Storybook workshop and a Next.js consumer app. bun workspaces. See README.md for scripts
and the consumer contract, and `packages/ui/DESIGN.md` for the design language and its decisions.
The rules per concern (components, tokens, motion, slides, visual verification) are in
`.claude/rules/`; read the one for what you change.

## Layout

- `packages/ui` — the library, published to npm as `@lanfermann/ui`. Source in `src/`, built by
  tsdown (`unbundle`, ESM + d.ts) to `dist/`. Public API is four entries and nothing else:
  `src/index.ts` (the library), `src/slides/index.ts` (`@lanfermann/ui/slides`),
  `src/slides/catalog/index.ts` (`…/slides/catalog`, generated) and
  `src/slides/player/index.ts` (`…/slides/player`).
  - `src/styles.css` + `src/styles/*.css` — tokens: grounds, status, type, radius, depth, motion.
  - `src/slides/<name>/<name>.tsx` — the parts of a deck on the 1920 by 1080 canvas, styled by
    `src/styles/slides.css` (`@lanfermann/ui/slides.css`). Flat, in px, on grounds of their own.
  - `src/slides/player/` — what presents a deck: audience view, presenter console, print and
    check. The build also writes it as one script with its styles and fonts to `player/`
    (`scripts/slides/build-player.ts`; not in git, published), for a deck that is a single file.
  - `src/motion/springs.ts` — the spring table; `bun run gen:motion` writes
    `src/styles/motion.generated.css` from it (a test fails when they drift).
  - `src/components/<name>/<name>.tsx` with `<name>.stories.tsx` beside it; shared bits in
    `src/internal/` and `src/lib/`.
  - `brand/` — the logo files (favicon, app icon, avatar), exported as `@lanfermann/ui/brand/*`.
    The marks are not under the MIT license (`TRADEMARK.md`).
  - `.storybook/`, `stories/` (foundations, patterns, lab) — the workshop. It lives inside the
    package because bun installs are isolated per workspace.
  - `scripts/visual/capture.ts` — screenshots, state strips and motion strips of every story;
    `compare.ts` and `docker.ts` diff them against `visual-baseline/` (the committed pictures).
  - `vitest.config.ts` — two projects: `unit` (`bun run test`) and `storybook`
    (`bun run test:stories`: every story in a browser, axe at `error`, `play` functions).
- `packages/slides` — the deck tool, published as `@lanfermann/slides`: the commands `init`,
  `check`, `dev`, `build`, `pack` and `unpack` of `slides`. Plain Node, no React: `src/index.ts`
  is the library, and its `bundleDeck`, `typecheckDeck`, `deckHtml` and `deckTemplate` are the
  contract the hub builds on (issues #90 and #115), so their names and shapes are not changed
  here alone; `src/cli.ts` only maps arguments
  (`src/run.ts`).
  `fixtures/` holds the decks it is tested on, some wrong on purpose, so ESLint, tsc and the
  spell check leave them out. The format of a deck is `docs/deck-format.md`. It reads the
  built `packages/ui/player/` and `dist/`: build the library first. `bun run slides:e2e` runs
  the built tool and opens what it wrote in the system's Chrome, outside the sandbox.
- `apps/docs` — Next.js App Router app consuming the built `dist` via `workspace:*`: the consumer
  smoke test, not the place to look at components. `apps/docs/AGENTS.md` is managed by `next dev`;
  leave it, and read `apps/docs/node_modules/next/dist/docs/` before changing Next code.
- Root owns ESLint (`eslint.config.js`), Prettier, git hooks (`githooks/`) and CI.

## Rules

- Components wrap Base UI parts; never reimplement behavior Base UI provides.
- Style only with the semantic tokens (`bg-ground`, `text-fg`, `border-line`, `depth-*`,
  `spring-*`, …): no raw palette colours, no `dark:` variant, no ad-hoc shadows. The look of
  depth is edited in `src/styles/depth.css` only. New `depth-*` utilities must be added to
  `depthNames` in `src/lib/cn.ts` (a test checks it).
- Merge caller `className` with `mergeClassName()` on Base UI parts (it keeps the function form)
  and `cn()` elsewhere. Put `data-slot="<component>-<part>"` on every part.
- Named exports only from the library; files that use hooks or Base UI parts start with
  `"use client"`. Compound components export flat names (`Menu`, `MenuTrigger`, `MenuContent`).
- Motion: CSS transitions with `spring-*` for state changes and popups; import Motion only through
  `src/motion/motion.tsx`, and only for gestures or content swaps.
- `bun install` builds the library (postinstall); after changing `packages/ui` run
  `bun run --filter @lanfermann/ui build` (or `bun run dev`) before typechecking the docs app.
- Verify with `bun run lint && bun run typecheck && bun run test && bun run build`, then
  `bun run build-storybook`, the capture script, `bun run test:stories` and `bun run visual:check`
  (see `.claude/rules/visual-verification.md`).
- What moves is a transform; what follows a finger is looked at on a real phone
  (`bun run storybook:phone`) before it is called smooth.
- Look-and-feel decisions are Justin's: build the options as switches, show them side by side at
  real size, and ask. Record the outcome in `packages/ui/DESIGN.md`.
- Before asking him to look or pick, rebuild (`bun run build-storybook`) and serve the build
  (`bun run storybook:phone`, which prints the Mac and phone links). Open the exact story on the
  served build and check that the switch you ask about changes the page. Then lead the reply with
  those links. While he is still looking, list the open picks in the reply; open the question
  dialog only once he says he has looked. Each question says in one line what is being decided
  and what changes for him. (Retro 2026-11-16: about ten questions in five sessions were
  rejected because he had nothing to look at yet.)
- Sample copy in stories is German, sentence case, real content. The wording of interface strings
  is Justin's to decide as well.
