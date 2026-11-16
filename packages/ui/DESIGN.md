# Lanfermann UI: the design language

How `@lanfermann/ui` looks, moves and reads, and why. This is the reference for anyone (person or
agent) adding or changing a component. Values live in `src/styles/*.css` and
`src/motion/springs.ts`; this file explains the intent behind them and records what was decided.

The brand comes from the **Lanfermann Freelance** kit (tokens v3). That kit was written for slides
and documents and bans shadows and gradients there. This library is its interactive layer and
extends it on purpose; where the two differ, the difference is listed under "Departures from the
kit".

## The idea

**Only what moves casts a shadow.** What is read stays flat. What a hand operates is lit from
above and sits on a shadow, because its shadow says it moves, and the motion proves it. The one
exception is the seam of a website, where one section lies on the next as a plate.

| Matter  | What it is                                              | Treatment                                                                                                                           |
| ------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Panel   | ground and content                                      | Flat. A 2px rule with round ends opens a block, 1px lines divide rows. A website's sections are plates, with a `Seam` between them. |
| Fitting | anything pressed: buttons, thumbs, segments             | Glossy face, 1px edge, light top edge, soft shadow. Goes down when pressed.                                                         |
| Socket  | anything that takes a value: fields, checkboxes, tracks | Let in: a shaded top edge inside and a hairline or rim.                                                                             |
| Sheet   | anything temporary: menu, popover, dialog, toast        | Flat face, hairline edge, long shadow. Tooltips and toasts speak on Ink.                                                            |

One light, from above, and tinted: edges and contact shadows come from Ink (`19 18 28`), ambient
shadows from Ink mixed toward Indigo (`42 37 82`), never neutral black.

## The direction: Fase

Chosen by Justin on 2026-11-14 from four rendered directions (Beschlag, Fase, Kante, Einlage).
Fase is the Clerk recipe re-cut with the brand's violet light:

- **Faces are glossy.** A soft top-to-bottom gradient on every raised face; the committed
  (primary) button is a dark face lighter than Ink with a faint two-step gloss. The gloss must
  stay subtle: no visible band across a wide button.
- **Edges** are 1px in the fill's own hue (near-black on dark faces, Ink at 12% on white).
- **Light** is a 1px inset highlight on the top edge; dark faces also get a 1px inset shade at
  the bottom.
- **Shadows** are short and soft: a contact shadow plus one ambient layer. Hover lifts the
  ambient layer; press removes both, drops the gloss and adds an inner shade.
- **Text fields** are white with a hairline edge and a faint shadow. Focus is a 1px Indigo edge
  with a 4px Indigo halo at about 18%. Invalid is the same in danger.
- **Checkbox, radio and switch** are sockets (inner shade, visible edge) that fill with Indigo
  when checked or on.
- **Cards** are softly raised white sheets with a tinted footer strip.
- **Tabs** are a row of labels with a dot each. A soft grey highlight glides to the current tab
  and its dot closes from ring to filled Indigo disc. A row wider than its place stays one row:
  it scrolls sideways and fades at the side that has more. `TabsPanels` stacks the panels in one
  place, as tall as the tallest, so switching never moves what stands below.
- **Segmented control**: a grey trough with one raised white thumb that glides.

Every recipe lives in `src/styles/depth.css`, per ground. The board to judge a change on is the
story `Patterns/Specimen`.

## Decisions

| Topic            | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | By, when           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Direction        | Fase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-14 |
| Corners          | Controls 8px (small 6, large 10), checkbox 5, sheets and cards 12, dialogs 16. Inner corner = outer − padding. 4px reads as square and is not used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-14 |
| Checked and "on" | Indigo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-14 |
| Field edge       | Hairline with an Indigo focus halo. Faint for low vision; a stronger edge is one recipe change in `depth.css` if that becomes a problem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | default, accepted  |
| Press            | Scale to 0.98 with the shadow collapsing. No keycap lip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | default, accepted  |
| Control size     | **Compact is the default** (32px controls, 15px labels). Size stays a setting: `data-density="comfortable"` on any element gives 36px controls with 16px labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-14 |
| Icons            | Hugeicons free set (`@hugeicons/react` + `@hugeicons/core-free-icons`), stroke pinned to 1.5px at every size, `currentColor`. No comparison with Phosphor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-13 |
| Status colours   | Full set: danger, warning, success, info, each as text colour, soft wash and solid fill. Always with words and an icon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-13 |
| Animation        | CSS transitions with spring easings for almost everything; Motion (`motion/react`) only for gestures and content swaps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Claude, 2026-11-13 |
| Feel             | "Industrial" means crisp edges and bevels on rounded forms, not square corners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-13 |
| Date picking     | Our calendar everywhere, on a phone too. The browser's date input was built beside it and dropped: it looks different in every browser.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-14 |
| Selection        | What is chosen in a calendar is one raised shape, filled through and joined over weeks, and it glides to a new selection on the `seat` spring instead of jumping. Confirmed in its last form after the glitches of the first morph were gone.                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-14 |
| Times            | A time is typed or picked from a list a quarter of an hour apart, which typing narrows; the time the field holds carries the disc. With a date, the times stand under the calendar as small time fields ("Von … bis …") and the sheet stays open until "Fertig". 24 hours by default, 12 with AM and PM on request.                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-14 |
| Touch            | Controls keep their size and look under a finger. Whatever is smaller than 44px gets an invisible target of that size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-14 |
| Number steppers  | One on each side of the value (− 3 +), the value centred between them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-14 |
| Meter fill       | The text colour: a measurement is not a choice. `tone="accent"` makes it Indigo where a view is about that one meter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-14 |
| Dragged parts    | A slider's thumb has inertia: it stretches along its way and swings back when it stops, and the fill's cap deforms with it. A progress bar does not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-14 |
| Segmented thumb  | It has weight in both shapes, the square control included (`inertia`, on by default): it reaches for the pointer, its tail comes after it on a trip, it squashes as it lands, and it can be pulled to another segment.                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-15 |
| Round segmented  | A pill with a mark before each label (`shape="round"`). Its thumb wears the raised Fase, not Clerk's soft cushion, and lies flush in the trough: a pixel inside, so the two outlines are one line. It travels on `settle`; next to `glide` the difference was too small to see.                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-15 |
| Site chrome      | A navigation menu with panels instead of tab-like links with marks, and a quiet footer in columns instead of one on Indigo: he called the first versions ugly. The ask on Indigo is a block of its own above the footer.                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-15 |
| Code face        | Blatt: a white sheet with a hairline and no shadow, its header on the well. On Ink it is the black slab, on an Indigo page a deeper Indigo. Chosen over a recessed well (Mulde) and Ink on every ground.                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-15 |
| Code colours     | Farbig: keywords Indigo, strings green, numbers amber, functions and attributes blue, types teal, tags rose, comments muted. Each hue holds 4.5:1 on every face and on the marked and changed lines. Chosen over Ruhig (one warm hue).                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-15 |
| Copying code     | The copy symbol gives way to a drawn tick, and the tooltip says „Kopiert". No word appears beside the button. When the browser refuses the clipboard, the code is selected instead.                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-15 |
| Closing ask      | `Cta` is the joint (Fuge): a block in a button's recipe with its lower right corner cut away, and the actions seated in the cut on the page's ground. One or two actions, the second quieter; only the buttons are links, never the block. Its tone is the ask (default), the key or the raised face. `CtaMessage` (Brief) is the other form, a letter already begun. The sentence (Satz) and the key (Taste) were dropped for now.                                                                                                                                                                                             | Justin, 2026-11-15 |
| Callout          | Kante: flat on the page, a 2px edge in its tone on the left, its kind in words and an icon on the first line. Chosen over a washed box like `Alert` (Fläche) and a rule on top (Kopf).                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-15 |
| Section links    | A link symbol after the heading's last word, shown while the heading is pointed at or the link has the keyboard. Chosen over a `#` in the margin and the whole heading as the link.                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-15 |
| Current page     | In a `SideNav` the page the reader is on stands on the tint, like an entry of the `NavigationMenu`. Chosen over the mark closed to a disc before it and a 2px Ink rail.                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-15 |
| Current subpage  | In a `SideNav` the subpage being read takes the hairline in the text colour, as the `TableOfContents` marks its section; its parent stays open without the tint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-16 |
| Contents mark    | A hairline runs along a `TableOfContents`; a 2px piece of it in the text colour stands by the section being read and glides to the next. Chosen over a gliding Indigo disc and weight alone.                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-15 |
| Site bar         | `SiteHeader` floats at every width, like Clerk's: a frosted face (the ground at 85% with a blur) with a light edge and a short shadow, 8px off the window's top and sides, what stands in it on the content's edges. Clerk's graded blur up to the window's edge was tried and dropped: Safari sampled it and painted the status bar white. It replaces the flat panel, because Safari 26 tints its status bar from a bar that touches the top edge.                                                                                                                                                                            | Justin, 2026-11-16 |
| Phone menu       | Over the whole window on the page's ground, square to it: the bar's top row with the close button where the menu button was, the places in groups (a few large ones, a longer list in two columns of small ones), the next step at its foot. It replaces the sheet from the right, whose rounded corners and short height looked odd against Safari's bars.                                                                                                                                                                                                                                                                     | Justin, 2026-11-16 |
| Ask on a phone   | Below 42rem a `Cta` has no cut: its actions stand inside the block at its foot, one over the other at its full width. The cut left a stub of the block beside the buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16 |
| Long tab rows    | A row of tabs stays one row: it scrolls sideways, its edges fade where more tabs wait, and the current tab is brought into view. Chosen over a second line and over a segmented control on a phone.                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-16 |
| Phone spacing    | Two sections stand 96px apart on a phone (`py-12`), 192px from `sm` up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-16 |
| Section seams    | Zunge: a website's sections lie on each other as plates, every other one on the well (`bg-well`). Between two stands a `Seam`. The plate above has a hairline edge, a shade inside it and a short soft shadow (`depth-seam`). Across the content column its edge dips down as a tongue or rises as a notch, set per seam by hand. It replaces the 2px rule that opened each section. The closing `Cta` gets none. Chosen over the edge alone (Fuge), a 3px thickness under the edge (Kante), a tongue 430px wide, all seams the same way, and plain alternation. A light line on the lower plate (Stufe) did not show on Paper. | Justin, 2026-11-16 |
| Rule ends        | Every 2px rule (`Table`, `Accordion`, `ParameterList`, `PageHeader` with `rule`, `Separator` `rule`) is a straight line with round ends, drawn into the place of a top border (`internal/rule.ts`). It replaces the square ends, and the table's rule that its scrolling box bent down at the corners.                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-16 |
| Edge fades       | What scrolls inside itself fades at the edge where more waits, never cut hard: code, a row of tabs, a wide table (sideways) and the side columns of a docs page (at their foot, and at the top once scrolled). The fade is 40px and moves on `settle`. A table's rule stays whole above its fading columns.                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-16 |
| Copy page        | A docs page is handed on as Markdown by a `CopyPage` at the end of the row above its title: one raised fitting with the copy and a chevron. It rocks on the pressed key, confirms a copy with the drawn tick, and its menu repeats the copy with a line ("Als Markdown, für eine KI") and opens the Markdown in a new tab. The line names KI (AI), not a language model.                                                                                                                                                                                                                                                        | Justin, 2026-11-16 |

## Colour

Four grounds, switched with `data-theme` on any element (`.dark` aliases Ink): **Paper** is the
default app surface, **Tint** carries someone else's words (a quote, generated text), **Ink** is
the system's own voice (tooltips, toasts) and the dark theme, **Indigo** is the ask. Components
never branch on the ground; every difference flows through the `--lf-*` variables in
`src/styles/grounds.css`.

- **Indigo** marks focus, the caret and selection, links, checked and "on" states, the current
  tab, and the one `ask` button per view. It is never used on an icon or a heading.
- **Ink** is the committed action (`primary` button) and all text.
- **Status** colours are a UI-only extension. Each hue is the accent's lightness and chroma
  turned to its hue, so they sit beside Indigo. Info reuses Indigo and Tint.
- Every text and ground pair a component can form is asserted against WCAG in
  `src/styles/tokens.test.ts` (4.5:1 for text, about 3:1 for the kit's structural line).
- **Disabled** parts lose every shadow and gloss (they cannot move) and use the `disabled`
  tokens. No opacity tricks: the label stays readable.
- A **sheet** (menu, popover) keeps the ground's text colours, so its face is never white on
  Indigo: there it is a deeper Indigo.
- The **switch thumb** takes the colour that reads on its track: light when off, the accent's
  "on" colour when on (dark on Ink, where the accent is a light violet).

## Type

One family, Sofia Sans, in four weights: 400 body, 500 control labels and display, 600 heads and
errors, 700 only for `<b>`. JetBrains Mono only for strings a machine reads (IBAN, URL, code).

Sofia Sans is small on its em (x-height 488/1000): 16px of it reads like about 14px of Inter. So
the kit's document scale is the UI scale: `text-xs` 12, `text-sm` 13.5, `text-base` 16, `text-lg`
20, `text-xl` 24, `text-2xl` 36, `text-3xl` 54. Display sizes are tracked negatively, body sizes
not at all.

- **Density.** Control sizes are variables, not constants, so the choice stays open:

  | Density             | Controls (sm / md / lg) | Control and field labels | Checkbox, radio | Switch  |
  | ------------------- | ----------------------- | ------------------------ | --------------- | ------- |
  | `compact` (default) | 26 / 32 / 40px          | 15px (`text-control`)    | 16px            | 32 × 18 |
  | `comfortable`       | 28 / 36 / 44px          | 16px (`text-base`)       | 18px            | 36 × 20 |

  Set `data-density` on `<html>` or on any subtree. The values are variables in
  `src/styles/density.css`; components read them and never hard-code a control height.
  `text-control` is the one size that follows the density, for control and field labels and for
  a label standing next to a checkbox or switch. Reading text stays on the scale above; helper
  and error text is 13.5px in both.

- Sentence case everywhere. No capitals, no positive tracking, no uppercase labels above titles.
- Labels say what happens ("Angebot senden"), titles are sentences with a full stop.
- A placeholder is an example in italics ("z. B. Schreinerei Huber"), never a label.
- `tabular-nums` only where digits change in place or sit in a numeric column.
- Code is JetBrains Mono at 13px on a 22px line, ligatures off and tabs two wide. Inline `Code`
  is 0.84em of the sentence around it, so it keeps its size and breaks with it.
- Input text follows the density (15px compact, 16px comfortable) but is always 16px on touch
  devices (`pointer: coarse`), so iOS never zooms on focus.
- Sample copy is German first; "Auftragsbestätigung herunterladen" is the width stress test.

## Motion

One spring table (`src/motion/springs.ts`) feeds CSS (`spring-*` utilities, generated by
`bun run gen:motion`) and Motion.

| Spring    | Duration / bounce | For                                                                |
| --------- | ----------------- | ------------------------------------------------------------------ |
| `snap`    | 120ms / 0         | press down, hover, pointer focus                                   |
| `settle`  | 240ms / 0         | the default: popups entering, panels opening, an error showing     |
| `seat`    | 280ms / 0.22      | a small part seating: a check, a switch thumb, a button release    |
| `glide`   | 320ms / 0         | a mark travelling inside its container: tab highlight, thumb       |
| `sheet`   | 360ms / 0         | a dialog or toast arriving                                         |
| `leave`   | 160ms / 0         | every exit                                                         |
| `throw`   | 400ms / 0.15      | releasing a drag with its velocity (Motion only)                   |
| `recoil`  | 360ms / 0.3       | parts pushed together and let go: a pill's marks (transforms only) |
| `rebound` | 300ms / 0.5       | a stretched slider thumb coming to rest: its swing is the squash   |

- Everything a person triggers is a transition, never a keyframe animation, so it can be reversed
  mid-flight.
- **The mark travels.** Selection is one element that moves (tab highlight, segment thumb, switch
  thumb), not two that fade. A dot or a radio goes from **ring to disc**: open means possible,
  filled means chosen.
- A part that travels inside a container never bounces: it would poke through the wall. Bounce is
  for small parts seating in place, for things that were thrown, and for parts that were pushed
  together and are let go where the container leaves room for the swing (`recoil`: the marks of
  a `CopyPill` fan back out into the gap before its key).
- Popups grow out of their trigger (`--transform-origin`). Exits are shorter than entrances and
  do not travel.
- Keyboard focus, menu highlight, error colours and page load do not animate.
- `box-shadow` transitions only on small controls. Under reduced motion only opacity changes.
- Travelling parts are placed from measured offsets and moved with a CSS spring, not with a
  scale-based layout animation: that distorts shadows and breaks under CSS `zoom`.
- **What moves is a transform.** `translate` and `scale` are animated without laying the page
  out again; a width, an inset or a padding is laid out on every frame, which showed as a stutter
  on a 120Hz phone. A slider's thumb, fill and caps, and the fills of `Progress` and `Meter`, are
  all placed by `translate`.
- **What follows a finger eases on a plain bezier.** Safari can only run a curve off its main
  thread if it is a bezier that stays between 0 and 1, and an iPhone holds the main thread at 60
  frames a second. A slider's chase is therefore the `snap` spring written as a bezier
  (`--slider-chase`; a test keeps the two together). Springs with bounce cannot be written that
  way and run at 60 there, which is fine for a state change.
- **Inertia** (`src/motion/inertia.ts`): a dragged thumb is stretched by how fast it travels,
  trailing side lagging, and comes back on `rebound`. Decided once per move, drawn by CSS. A
  slider's thumb gives up to 6px; the thumb of a segmented control, five to eight times as long,
  gives by a share of its length (15% at a normal pull, a fifth at the most), or the same pull
  would not show on it. A part in a trough never lags through the wall behind it.
- **The segmented thumb** travels as two edges: the leading one sets off at once, the tail comes
  after (a stretch that follows the way it has to go, 30% at the most) and is let go so that the
  squash lands with it. The stretch grows on the trip's own curve, a frame after it: on the
  faster chase, an iPhone showed the tail of a thumb leaving the last segment past the trough's
  end. Over another segment a mouse makes it reach: its near edge goes a few
  pixels towards the pointer, its far edge half as far. Pulled, it stands under the finger on
  every frame, with no transition in between: on an iPhone a transition retargeted on every move
  stalled and then lurched. Its width follows its middle: over a segment's middle it is that
  segment's width, between two middles as far between their widths. (Switched at the border,
  even eased, it read as a snap.) It is dropped on the nearest segment; held, it gives like every
  fitting. Turning round is
  always a transition: the edge that holds still is a `translate`, not a `transform-origin`.
  It travels on `settle`, so the leading edge lands sooner and the tail arrives when a `glide`
  would have. Justin compared the two on his phone (2026-11-15) and could barely tell them
  apart, so what was built stays. A thumb without weight (`inertia={false}`) keeps `glide`.
- **What the thumb covers is chosen.** The labels of a segmented control are drawn a second time
  inside the thumb, in the colour of the choice, and stand still while it passes: a letter half
  under the thumb is half dark, and a label darkens as the thumb arrives, not when it is
  clicked. On the trough every mark is a ring; the disc closes in the thumb. The second set of
  labels is moved back by exactly what the thumb moves, and its stretch undone exactly: the
  thumb's shape and its inverse are worked out from the same eased numbers (registered custom
  properties) in the same frame. Eased apart, as first built, the copy drifted up to 4px from
  the labels under it and wiggled as the thumb passed.
- **A shape that re-forms** is the one motion CSS cannot run: a calendar's selection is a
  polygon, and blending two polygons point by point crosses itself on the way. Its four numbers
  ride the `seat` spring by hand instead (`src/motion/spring-step.ts`) and the outline is drawn
  from them every frame, so it is a proper shape at every instant. Nothing is laid out and React
  does not render while it moves.
- Three keyframe animations exist, for what runs without anyone's doing: the spinner, the
  indeterminate progress fill, and its breathing under reduced motion.

## Icons

`<Icon icon={…} />` is the only way icons enter. 14px in small controls, 16px in default ones,
18px in large ones; stroke 1.5px at every size; the text colour of their context. The few marks
that sit inside controls at 10 to 12px (tick, dash, chevron, close) are drawn in
`src/internal/glyphs.tsx`, because library icons blur at that size.

## What exists

Every component belongs to one of the four matters, and takes its treatment from it.

| Matter  | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel   | `Text`, `Heading`, `Link`, `Separator`, `Badge`, `Alert`, `Avatar`, `Icon`, `Spinner`, `Field`, `Fieldset`, `Form`, `Table`, `Ground`, `Wordmark`, `Logomark`, `Code`, `CodeBlock`, `CodeBlockLive`, `CodeTabs`, `Container`, `Section`, `PageHeader`, `SiteFooter`, `Prose`, `AnchorHeading`, `Callout`, `Quote`, `Breadcrumbs`, `SideNav`, `TableOfContents`, `Pager`, `ParameterList`, `ReferenceEntry`, `Figure`, `DocsLayout`; `Accordion` and `Collapsible` are structure by line; `Seam` is the edge between two sections' plates, the one panel with a shadow |
| Fitting | `Button`, `CopyPill` (its key and its marks), `CopyPage` (its two keys; its menu is a sheet), `SegmentedControl`, `Tabs`, `Select` (its trigger), `Kbd`, the thumbs of a `Switch` and a `Slider`, what is chosen in a `Calendar`, the block of a `Cta`                                                                                                                                                                                                                                                                                                                |
| Socket  | `Input`, `InputGroup`, `Textarea`, `NumberField`, `Combobox`, `DateField`, `DateRangeField`, `TimeField`, `Checkbox`, `CheckboxGroup`, `Radio`, `Switch`; the troughs of `Slider`, `Progress` and `Meter`                                                                                                                                                                                                                                                                                                                                                             |
| Sheet   | `Menu`, `Select` (its list), `Popover`, `Tooltip`, `Dialog`, `AlertDialog`, `Drawer`, `Toast`, `NavigationMenu` (its panel), the bar of a `SiteHeader` (frosted, `depth-bar`); `Card` and `CtaMessage` are resting sheets                                                                                                                                                                                                                                                                                                                                             |

- **Select** has a raised trigger, not a field: it is pressed, not typed into. In its list only
  the chosen option carries the mark (a disc); the rings are left out to keep long lists calm.
  Options may carry an `icon` and a `detail` (`items: [{ value, label, icon, detail }]`). The
  icon stands before the label; the detail is a quieter second fact at the right edge, with
  tabular digits (a price, a unit, a code). Both are muted, and both show in the trigger as well.
  Every option has an icon, or none does. When space runs out the label gives way, not the detail.
- **Textarea** keeps its resize grip clear of the rounded corner: its right and bottom padding
  are transparent borders, and browsers draw the grip (and the scrollbar) inside the border. In
  Chromium and Safari the grip itself is ours, two short strokes; elsewhere it is the browser's.
- **Tooltip and Toast** are the system's own voice and speak on Ink on every ground.
- **Dialogs** rise 8px into place and leave by fading. An `AlertDialog` has no close button and
  puts the focus on the answer that changes nothing.
- **Toasts** stack bottom right, newest in front. One enters from below, leaves by fading where it
  is, and one that was swiped away keeps going.
- **Avatar** is a rounded square in the text colour, never a circle.
- **Fields with something beside the text** (`InputGroup`, `NumberField`, `Combobox`, the date
  and time fields) are one socket: the wrapper wears the field and the input inside goes bare.
  A press anywhere on it lands in the input.
- **Link** keeps link semantics and an underline; `quiet` takes the colour around it. A link is
  never drawn as a button: style an `<a>` with `buttonVariants()` for that.
- **Table** is a real table under a 2px rule, hairlines between rows, no stripes and no card.
  Numbers stand right in tabular digits. It scrolls inside itself when it is too wide, and its
  edges fade where more columns wait while the rule above stays whole. A table of
  sentences (`content="text"`) starts every cell at the top of its row. On a phone a table of two
  or three columns of text can stack (`stack`): each row becomes a block under its first cell,
  every other cell named by its column, and the roles stay written out so it is still a table to
  assistive tech.
- **Dates and times** are typed the German way and read when the field is left ("30.11.",
  "301126", "14.–30.11.", "9 Uhr", "930"); they show text and submit ISO values. Text that cannot
  be read stays to be corrected, and the field says why at once. `DateField` and
  `DateRangeField` open the `Calendar`; `time` adds a time of day, set under the calendar in a
  small `TimeField`. `TimeField` is typed or picked from the times of the day; `hourCycle={12}`
  writes them with AM and PM.
- **Calendar**: today wears the ring, what is chosen is one raised Indigo shape. A range is
  filled through and joined where it runs on into the next week; two weeks that share no column
  stay two pieces. The days stand 2px apart and today's ring is drawn inside the day, so a ring
  never touches the selection beside it.
- **Slider** is a long switch: a raised thumb in a trough that fills up to it and ends in a round
  cap. It follows one finger at a time.
- **Progress** fills in Indigo and glides; **Meter** measures in the text colour.
- **Drawer** is a sheet from the bottom or a side that can be pushed back with a finger.
- **A website** is built from five panels. `Container` gives the page its width: 72rem of
  content, or 48rem for running text, with a gutter of 20px on a phone and 32px above it.
  `Section` gives a part of the page its air. `PageHeader` opens the page or a section: nothing
  stands above the title, the one `display` title belongs to the page's opening, every section
  after it opens under the 2px rule, and everything is set left. On a phone both titles step down
  one size.
- **Seam** is where two sections of a website meet when they are plates rather than parts of one
  page (a landing page; a docs page keeps its rules). The sections alternate between the ground
  and the well. The plate above lies on the one below, with the edge and the short shadow of a
  raised part. Across the content column its edge dips down as a tongue or rises as a notch,
  chosen per seam. A section after a seam has no rule. Seams take no room: they are drawn into the
  sections' padding, and on a phone the shape shrinks to 70%.
- **SiteHeader** is a bar that floats over the page while it is read: a frosted face with a
  light edge and a short shadow (`depth-bar`), 8px off the window's top and sides, what stands in
  it on the content's edges. It holds the way home, a `NavigationMenu` and the next step. Below
  `lg` the menu opens
  over the whole window on the page's ground: the bar's top row with the close button where the
  menu button was (`brand`), the places in groups, and the next step at the foot (`actions`).
- **Safari's bars.** Safari 26 colours its status bar from what it finds about 4px below the
  window's top edge: inside a fixed or sticky element, it paints that element's colour, or samples
  its pixels once. Both its bars take the colour of whatever covers them. So nothing pinned
  reaches the top 8px, not even a decoration inside the bar (a graded blur up to the edge turned
  the status bar white), and the page shows behind the status bar; what covers the window (the menu, the scrim
  of a dialog or drawer) is as tall as the window with the bars collapsed (`h-lvh`), so neither
  bar keeps a light strip. Content that must stay reachable above the toolbar is padded by
  `100lvh − 100dvh`. No `viewport-fit=cover`, no `env()` insets for this.
- **NavigationMenu** is a row of quiet entries: no face and no shadow, only the hover wash. An
  entry with pages behind it carries a chevron and opens a panel when it is pointed at or pressed.
  One sheet serves the whole row: it glides to the next entry and takes its size, and the content
  arrives from the side it was approached from. Each page in a panel is a title and one line that
  says what is there. The sheet's size is the one place where width and height are animated: it
  has to take the measure of what it holds.
- **SiteFooter** is the floor of the page: a quiet strip one step off the ground, under a
  hairline. What the site is about stands beside columns of links, each under its name, and who
  made it stands in the last row. Links in a column show their underline under the pointer: there
  the place says that it is a link.
- **CodeBlock** is highlighted on the server (Shiki, with the JavaScript regex engine), so no
  highlighter reaches the browser; its colours are the `--lf-code-*` tokens in `code.css`. A
  file has its name and a symbol in the header; a shell one-liner is one row with a muted `$`.
  Marked lines get a tint and the accent along the edge, added and removed lines a wash and a
  `+` or `−` sign, so colour never carries it alone. Long code folds, long lines scroll with a
  fade on the side that has more. A copy takes the code as it stands after a diff.
- **CopyPage** hands a docs page on as Markdown, for an AI. It is one raised fitting with two
  keys, the copy and a chevron, at the end of the row above the page's title. It moves as one
  part: it lifts under the pointer and goes down under a press, and only the pressed key takes
  the inner shade, so it rocks on that key while the other keeps its gloss. A copy is confirmed
  in the key as in a code block (the symbol shrinks away, the tick draws itself, `copy.css`). The
  chevron turns over while its menu is open; the menu's rows carry a tile with their symbol and
  a line on what they do: the copy again, and the Markdown to look at in a new tab. The Markdown
  is fetched when a pointer or the keyboard reaches the fitting, so the copy is immediate.
- **CodeTabs** is one block with several versions of the same code (bun, npm, pnpm). The tabs
  sit in its header with their marks, the highlight glides, and blocks with the same `group`
  keep the reader's choice in step and remember it.
- **CodeBlockLive** is the same block for code that is put together in the browser: a
  configuration built from the reader's choices. `CodeBlock` highlights where it renders, which
  in a client component would send the highlighter and its grammars along. Here the app hands
  over its lines as runs with one of the block's ten roles, and no highlighter is imported.
  The header of either block takes a `mark` in place of its symbol: the logo of the product the
  code is for.
- **Cta** closes a page, once. Its cut follows its buttons, its inner corner as round as theirs,
  and the block is as deep below its text as above it wherever the text keeps clear of the cut.
  Below 42rem there is no cut: the buttons stand inside the block at its foot, one over the other
  at its full width. Where its two actions lead to different kinds
  of place, each carries an `icon` before its words, and one that leaves the site points its
  arrow out (`arrow="out"`). **CtaMessage** sends to an `action` from where it stands, keeps the
  typed text if sending fails, and says so in place with a tick.
- **Documentation** is read down a long page and searched with the browser, so everything in it
  is a panel: flat, open, structured by line. `DocsLayout` sets three columns inside the site's
  width, so they line up with the bar and the footer: the pages of the set (`SideNav`, from
  `lg`), the text (about 90 characters a line), the page's sections (`TableOfContents`, from
  `xl`). Both side columns stay in view below the bar; on a phone the pages go into the bar's
  menu and the sections fold above the text. `Breadcrumbs` stand above the title in place of a
  label, which the system does not set.
- **Prose** carries what a Markdown renderer hands over. It sets the rhythm between blocks (a
  heading has much air above and little below; code, tables, callouts and figures keep more
  room) and the look of plain paragraphs, lists, quotes, rules and links. A library component
  inside keeps its own look: the prose only styles an element no component stands around.
- **AnchorHeading** offers its section's address as a link symbol after its last word, shown
  while the heading is pointed at or the link has the keyboard. **Callout** is the static sibling
  of `Alert`: a note in the page's reading order, flat, with a 2px edge in its tone and its kind
  in words and an icon. **Quote** is someone else's words on Tint, as wide as the text, its first
  corner tight as a message's; with `copy` its key copies the words, for sentences to type to an
  assistant.
- **SideNav** marks the page being read with the tint, as the `NavigationMenu` marks an entry; a
  long page shows its sections under it, and a page with subpages shows them while the reader is
  on it or on one of them (`open`): the subpage being read takes the hairline in the text colour,
  as in the `TableOfContents`, and its parent keeps no tint. **TableOfContents** runs a hairline along its entries,
  and a 2px piece of it in the text colour stands by the section being read and glides to the
  next as the page scrolls. A press holds it on the pressed entry until the page has settled, so
  it does not sweep over every section on the way. **Pager** ends a page that is one of a
  sequence: the page before and after, each a block that washes under the pointer, its arrow
  leading.
- **ReferenceEntry** is one entry of a reference (a function, a command, a tool): its name in
  code as an anchored heading, its title in words, its kind as badges, then the description and
  a **ParameterList**: name, type and whether it is required on the left, what it means on the
  right, under the 2px rule; a long union type breaks after its bars. **Figure** holds a picture
  that belongs to the text, on a `FigureFrame` sheet when it is drawn on its own ground, with a
  caption that says what it shows.

Whole screens built from these are the `Patterns` stories (sign in, settings, quotes, specimen,
site, docs): judge a change to a recipe there, not on a single component.

## Logo

`Wordmark` and `Logomark` draw the kit's outlines (`src/components/logo/logo-paths.ts`, copied
from it; a checksum test fails if someone edits them by hand). The rules are the kit's:

- Two parts that never stand side by side: the word "Lanfermann.dev" with its dot in the
  accent, and the symbol, the mitre, where the word does not fit.
- Both take their colours from the ground: dark with an Indigo dot on Paper and Tint, light with
  a lavender dot on Ink, all white on Indigo. On Indigo the symbol is `tone="mono"`.
- Clear space: the height of the capital L around the wordmark, one stem around the symbol.
  Smallest size 16px. The symbol's seam is closed below 48px.
- Never recoloured, outlined, rotated, boxed, shadowed or set in a font instead.
- Favicon, app icon and avatar are files, on their Ink tile: `@lanfermann/ui/brand/*`.

## Touch

A touch pointer (`pointer: coarse`) changes nothing you can see. Controls keep their size; a
control smaller than 44px gets an invisible target of that size (`touch-target`,
`src/styles/touch.css`). Two things do grow, because a target cannot help them: text in a field
is 16px, or iOS zooms in on focus, and the days of a calendar are 40px, because they stand edge
to edge. `data-pointer="coarse"` on an element turns the targets on without a touch device; the
`Foundations/Touch` board outlines them.

Every pattern and overlay holds at 390px without scrolling sideways. Look at a change on a real
phone before calling it done: `bun run storybook:phone` serves the built workshop on the local
network, with a plain list of stories at `/stories`.

## Engines

The story tests pass in Chromium, WebKit and Firefox, and the captures of all three are compared
by eye (`VISUAL_BROWSER=chrome,webkit,firefox`). What differs, and is accepted:

- The textarea's resize grip is ours in Chromium and Safari and the browser's in Firefox.
- Safari runs springs with bounce on its main thread, at 60 frames a second on an iPhone (see
  Motion). Everything that follows a finger is built so that it does not depend on that.

## Departures from the kit

- Shadows, gradients and raised cards exist here; the kit bans them on slides and paper.
- Corners are rounder (8px on controls; the kit uses 0 to 4px).
- Status colours exist; the kit says severity in words only.
- Checked states use the accent many times per screen; the kit allows one accent per slide.
- Icons are Hugeicons; the kit's deck pictograms are Phosphor Bold.

These are not yet written back into the kit (`lanfermann-design`, the artifact).

## How decisions get made here

Look-and-feel questions are settled by looking: build the options as switches, show them side by
side at real size, and let Justin pick. Options must differ visibly at 1x, and every board is
checked at a normal window width before it is shown.
