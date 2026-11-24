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
  code, 2px on tags and placeholder blocks, full on markers and discs, 0 elsewhere.
- A 2px `border-rule` opens a block, 1px `border-line` separates its rows.

## Stories

- Title `Slides/<Name>`. One slide per story on `onStage` with `slideParameters`
  (`src/slides/story-slide.tsx`): the capture is the canvas at its own size, taken once. A story
  that leaves the ground open follows the toolbar (`toolbarGround`); a ground a part looks
  different on gets a story of its own.
- German sample copy as a deck would carry it: a title that is a sentence with a full stop, a
  source under every figure, no dashes.
- Read the 1920 by 1080 capture before calling a part done, then compare it with the artifact's
  render of the same content.
