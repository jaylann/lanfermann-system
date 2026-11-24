# Slides

How a part in `packages/ui/src/slides/<name>/` is built. The rule book of a slide (ten rules,
canvas, type, grounds, forms) is `packages/ui/DESIGN.md`, "Slides"; the values are in
`src/styles/slides.css`. The reference for every part is the Lanfermann Freelance artifact
(inventory in issue #85).

## Shape

- `<name>.tsx` beside `<name>.stories.tsx`, exported from `src/slides/index.ts`
  (`@lanfermann/ui/slides`), never from `src/index.ts`. The main entry must not import from
  `src/slides`.
- Parts keep the artifact's names and props, with its wording as JSDoc on every prop: that text
  is what the author of a deck reads.
- Plain markup: no hooks, no Base UI, no `"use client"`. The exceptions are the parts that read
  the deck (`Deck`, `Footer`) or measure a box (`Stage`).
- `data-slot="slide-<part>"` on every part; `data-lines="<n>"` on a text part that may take at
  most `n` lines (the player's check reports more); `data-bleed` on a part that may leave the
  canvas.

## Style

- A slide is drawn in px on 1920 by 1080 and scaled as a whole. Inside a slide the spacing
  utilities count in px (`--spacing: 4px`): `p-32` is 128px. Use the steps 8, 12, 16, 24, 32,
  48, 64, 96 and 128 only.
- Sizes are `text-slide-*` only. Widths on the grid are `slide-span-<n>`; a grid template that
  depends on props is an inline style.
- Colours are the semantic tokens (`bg-ground`, `text-fg`, `text-fg-body`, `text-fg-muted`,
  `border-line`, `border-rule`, `text-accent`, `bg-surface`, `bg-surface-quiet`). They resolve
  to the slide's own ground (`data-slide-ground`), which no `data-theme` and no dark mode
  changes. Never put `data-theme` on a slide part, and never use a UI-layer token there
  (`hairline`, `sheet`, `raised`, the status and series colours follow the page, not the slide).
- No `depth-*`, no shadow, no gradient, no blur, no transition. Radii: 4px on media frames and
  code, 2px on tags and placeholder blocks, 36px on the phone's frame, full on markers and
  discs, 0 elsewhere.
- A frame that shows someone's screen or photo (`BrowserFrame`, `PhoneFrame`, `Media`,
  `Profile`) is always light: it sets `data-slide-ground="paper"` on itself, and what stands
  inside it (a `Marker`, the wireframe) uses the normal tokens. The stand-in for a missing
  picture is `bg-slide-placeholder` and `bg-slide-placeholder-strong`.
- A chart is a list (`<ol>` with one `<li>` per bar or column) whose values are written out; a
  diagram's boxes are real text and only its connector drawing is an image with a label.
- Typography in sample copy and examples: a narrow no-break space (` `) before a unit
  („68 %“, „1.900 €“). Write it as the escape: a pasted one gets lost.
- A 2px `border-rule` opens a block, 1px `border-line` separates its rows.

## Stories

- Title `Slides/<Name>`. One slide per story on `onStage` with `slideParameters`
  (`src/slides/story-slide.tsx`): the capture is the canvas at its own size, taken once. A story
  that leaves the ground open follows the toolbar (`toolbarGround`); a ground a part looks
  different on gets a story of its own.
- No doc comment (`/** */`) above `const meta`: Storybook writes it into the meta as a second
  `parameters` key (the docs description), which replaces `parameters: slideParameters`. The
  story then renders, but centred and captured at 720 by 480. Use `//` there.
- German sample copy as a deck would carry it: a title that is a sentence with a full stop, a
  source under every figure, no dashes.
- Read the 1920 by 1080 capture before calling a part done, then compare it with the artifact's
  render of the same content.

## Example and catalog

- Every part has `<name>.example.tsx` with `function <Name>Example()`: one whole slide that uses
  the part as a deck would. Its story's `Default` renders it, and `bun run gen:slides-catalog`
  writes it, with the part's doc comment and its props, into
  `src/slides/catalog/catalog.generated.ts` (`@lanfermann/ui/slides/catalog`). A test fails when
  the file is out of date, when a part is missing from `catalog/groups.ts`, or when a prop has
  no doc comment.
- An example names `deck` and `page` so that it can stand alone; the catalog leaves both out,
  because inside a `Deck` they are filled in.
- Prop types are written out (`"title" | "statement"`, not `keyof typeof sizes`): the catalog
  shows them as they stand in the source.

## The player

- `src/slides/player/` is the one corner of the slide kit with hooks and `"use client"`. Its
  chrome is interface, not a slide: the library's tokens and `text-sm` to `text-3xl` under
  `data-theme="ink"`, flat, plain `<button>` and `<a>`, no Base UI.
- All of its words are in `labels.ts` (German, Justin's to word). What utilities cannot say is
  in `chrome.css`, which no script imports (`@lanfermann/ui/slides/player.css`).
- State changes only through `reduce` (`state.ts`); keys, swipes, the hash and the second
  window all send its actions. Keep those modules pure and tested.
- Its stories are `stories/slides/player.stories.tsx`, with `hash={false}` and a fixed `now`.
  No story opens a window.
- A class a deck may use must be in `player/classes.json`: the bundle's stylesheet holds only
  what the kit's own sources use. Add a family through `@source inline(...)` in
  `scripts/slides/build-player.ts`.
