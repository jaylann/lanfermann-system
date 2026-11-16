# Tokens

Where a value lives in `packages/ui/src/styles/`, and what must stay true when one is added.
Intent and decisions: `packages/ui/DESIGN.md`.

- `grounds.css` — the `--lf-*` colours of the four grounds. The first ten per block are copied
  from the brand kit: do not change them. Everything under "UI layer" is ours.
- `status.css` — danger, warning, success, info: text colour, `-soft` wash, `-solid` fill, `on-*`.
- `depth.css` — every shadow, edge and gloss, as per-ground `--depth-*` knobs plus one `depth-*`
  utility per role. The only place the raised look is edited.
- `density.css` — control sizes as variables (`--control-md`, `--check-size`, …) and
  `text-control`. Components read these; they never hard-code a control height.
- `type.css`, `radius.css`, `motion.css`, `marks.css` — the scale, the one radius knob, the two
  keyframe animations, the ring-to-disc `mark` utility.

## When adding or changing a token

- A new `--lf-*` token goes into **all four** ground blocks (a test compares the sets) and gets a
  `--color-*` alias in the `@theme inline` block at the bottom of the file.
- A custom property that references a ground token resolves where it is **declared**. Derived
  values go into every ground block or into `@theme inline`, never on `:root` alone, or a nested
  ground keeps its parent's colours.
- Text on a new background needs a contrast pair in `src/styles/tokens.test.ts` (4.5:1).
- A new `depth-*` utility is added to `depthNames` in `src/lib/cn.ts`, and its `shadow-*` /
  `inset-shadow-*` keys to the lists below it; a new font-size or animation key to the `theme`
  block there. Otherwise tailwind-merge misreads the class (a test catches the depth names).
- All states of one depth recipe keep the same number of shadow layers, in the same order, so
  `box-shadow` can transition between them. Pad with `0 0 0 0 transparent`.
- The gloss is a translucent `background-image` over the part's `background-color`. Never bake
  the base colour into the gradient: hover and press transition the colour underneath.
- Check a new value on all four grounds: `capture.ts shots --grounds all`. Indigo and Ink are
  where derived values usually break (white text on a white sheet, a thumb that vanishes).
