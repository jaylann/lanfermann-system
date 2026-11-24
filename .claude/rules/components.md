# Components

How a component in `packages/ui/src/components/<name>/` is built. Base UI docs are local:
`packages/ui/node_modules/@base-ui/react/docs/react/components/<name>.md` and
`…/docs/react/handbook/`. Read the component's page before wrapping it.

## Shape

- `<name>.tsx` beside `<name>.stories.tsx`. Compound parts are exported flat (`Dialog`,
  `DialogTrigger`, `DialogContent`), each with `data-slot="<component>-<part>"`.
- Files that use hooks or Base UI parts start with `"use client"`. Plain markup components
  (Card, Badge, Text, Heading, Alert, Kbd, Spinner) stay server-safe: no hooks, no Base UI.
- Class-name recipes a Server Component may want to call live in a file **without**
  `"use client"` (see `button/button-variants.ts`).
- Variants with `class-variance-authority`. Merge the caller's `className` with
  `mergeClassName()` on Base UI parts and `cn()` on plain elements.
- Every export goes through `src/index.ts` (a slide part through `src/slides/index.ts`, see
  `slides.md`). Document the component with a short comment that says when to use it and how to
  word it, not what the code does.

## Behaviour

- Never reimplement what Base UI provides (focus, dismissal, typeahead, validation, portals).
- A link keeps link semantics: do not render `<a>` through `Button`; style it with
  `buttonVariants()`.
- A control smaller than 44px carries `touch-target` (and is positioned, and does not clip).
- A field that shows one thing and submits another (dates, times) is built on
  `src/internal/typed-input.tsx`: text is read when typing ends, the ISO value goes to a hidden
  input, and text that cannot be read becomes the field's validation message.
- Popups: `Portal > Positioner > Popup`. The popup takes `popupMotion` from
  `src/internal/popup.ts` and `data-theme={useGround()}`, so it keeps the ground it was opened on.
- Sizes come from the density variables. Label text is `text-control`; helper and error text
  `text-sm`. An input is `pointer-coarse:text-base` so iOS does not zoom.
- Focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`.
  Never `outline-none` on a focusable part (in Tailwind v4 it also hides the later outline).
  Text fields are the exception: their halo is in the depth recipe, with `focus:outline-hidden`.
- Disabled: `data-disabled:` variants, no gloss or shadow (`depth-flat`), `text-on-disabled`.
  No opacity.
- A status never relies on colour: it has words, and an icon.

## Stories

- Title `Components/<Name>`. One story per state worth a screenshot; a `Sizes` or `Tones` board
  where there are variants. German sample copy, sentence case, real content.
- `parameters.visual`: `viewport` sized to the content, `target` for the control the `states`
  capture should hover and press, `motion` for every transition the component performs.
- A popup needs an `Open` story (`defaultOpen`, `modal={false}`) so it shows in still captures.
- A `Keyboard` story with a `play` function walks the keyboard path and what the component
  reports. Stories with `play` are tests only: the capture script skips them.
- Every story has to pass axe (`a11y: { test: "error" }`). Two of the same landmark in one story
  fail it: one component per story.
