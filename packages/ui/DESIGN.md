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

| Matter  | What it is                                              | Treatment                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel   | ground and content                                      | Flat. A 2px rule with round ends opens a block, 1px lines divide rows. A website's sections are plates, with a `Seam` between them. On an app's page a block stands on a `Card` instead, named by its `CardBar`. |
| Fitting | anything pressed: buttons, thumbs, segments             | Glossy face, 1px edge, light top edge, soft shadow. Goes down when pressed.                                                                                                                                      |
| Socket  | anything that takes a value: fields, checkboxes, tracks | Let in: a shaded top edge inside and a hairline or rim.                                                                                                                                                          |
| Sheet   | anything temporary: menu, popover, dialog, toast        | Flat face, hairline edge, long shadow. Tooltips and toasts speak on Ink.                                                                                                                                         |

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
- **Cards** are softly raised white sheets with a tinted footer strip. What is handled (a
  choice, a prompt to copy) stands on a card cut like a fitting instead: `bevel` (Fase) or
  `gloss` (Glanz).
- **Tabs** are a row of labels with a dot each. A soft grey highlight glides to the current tab
  and its dot closes from ring to filled Indigo disc. A row wider than its place stays one row:
  it scrolls sideways and fades at the side that has more. `TabsPanels` stacks the panels in one
  place, as tall as the tallest, so switching never moves what stands below.
- **Segmented control**: a grey trough with one raised white thumb that glides.

Every recipe lives in `src/styles/depth.css`, per ground. The board to judge a change on is the
story `Patterns/Specimen`.

## Decisions

| Topic                     | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | By, when                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Direction                 | Fase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-14                                     |
| Corners                   | Controls 8px (small 6, large 10), checkbox 5, sheets and cards 12, dialogs 16. Inner corner = outer − padding. 4px reads as square and is not used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-14                                     |
| Checked and "on"          | Indigo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-14                                     |
| Field edge                | Hairline with an Indigo focus halo. Faint for low vision; a stronger edge is one recipe change in `depth.css` if that becomes a problem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | default, accepted                                      |
| Press                     | Scale to 0.98 with the shadow collapsing. No keycap lip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | default, accepted                                      |
| Control size              | **Compact is the default** (32px controls, 15px labels). Size stays a setting: `data-density="comfortable"` on any element gives 36px controls with 16px labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-14                                     |
| Icons                     | Hugeicons free set (`@hugeicons/react` + `@hugeicons/core-free-icons`), stroke pinned to 1.5px at every size, `currentColor`. No comparison with Phosphor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-13                                     |
| Status colours            | Full set: danger, warning, success, info, each as text colour, soft wash and solid fill. Always with words and an icon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-13                                     |
| Animation                 | CSS transitions with spring easings for almost everything; Motion (`motion/react`) only for gestures and content swaps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Claude, 2026-11-13                                     |
| Feel                      | "Industrial" means crisp edges and bevels on rounded forms, not square corners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-13                                     |
| Date picking              | Our calendar everywhere, on a phone too. The browser's date input was built beside it and dropped: it looks different in every browser.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-14                                     |
| Selection                 | What is chosen in a calendar is one raised shape, filled through and joined over weeks, and it glides to a new selection on the `seat` spring instead of jumping. Confirmed in its last form after the glitches of the first morph were gone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-14                                     |
| Times                     | A time is typed or picked from a list a quarter of an hour apart, which typing narrows; the time the field holds carries the disc. With a date, the times stand under the calendar as small time fields ("Von … bis …") and the sheet stays open until "Fertig". 24 hours by default, 12 with AM and PM on request.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-14                                     |
| Touch                     | Controls keep their size and look under a finger. Whatever is smaller than 44px gets an invisible target of that size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-14                                     |
| Number steppers           | One on each side of the value (− 3 +), the value centred between them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-14                                     |
| Meter fill                | The text colour: a measurement is not a choice. `tone="accent"` makes it Indigo where a view is about that one meter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-14                                     |
| Dragged parts             | A slider's thumb has inertia: it stretches along its way and swings back when it stops, and the fill's cap deforms with it. A progress bar does not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-14                                     |
| Segmented thumb           | It has weight in both shapes, the square control included (`inertia`, on by default): it reaches for the pointer, its tail comes after it on a trip, it squashes as it lands, and it can be pulled to another segment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-15                                     |
| Round segmented           | A pill with a mark before each label (`shape="round"`). Its thumb wears the raised Fase, not Clerk's soft cushion, and lies flush in the trough: a pixel inside, so the two outlines are one line. It travels on `settle`; next to `glide` the difference was too small to see.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-15                                     |
| Site chrome               | A navigation menu with panels instead of tab-like links with marks, and a quiet footer in columns instead of one on Indigo: he called the first versions ugly. The ask on Indigo is a block of its own above the footer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-15                                     |
| Code face                 | Blatt: a white sheet with a hairline and no shadow, its header on the well. On Ink it is the black slab, on an Indigo page a deeper Indigo. Chosen over a recessed well (Mulde) and Ink on every ground.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-15                                     |
| Code colours              | Farbig: keywords Indigo, strings green, numbers amber, functions and attributes blue, types teal, tags rose, comments muted. Each hue holds 4.5:1 on every face and on the marked and changed lines. Chosen over Ruhig (one warm hue).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-15                                     |
| Copying code              | The copy symbol gives way to a drawn tick, and the tooltip says „Kopiert". No word appears beside the button. When the browser refuses the clipboard, the code is selected instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-15                                     |
| Closing ask               | `Cta` is the joint (Fuge): a block in a button's recipe with its lower right corner cut away, and the actions seated in the cut on the page's ground. One or two actions, the second quieter; only the buttons are links, never the block. Its tone is the ask (default), the key or the raised face. `CtaMessage` (Brief) is the other form, a letter already begun. The sentence (Satz) and the key (Taste) were dropped for now.                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-15                                     |
| Callout                   | Kante: flat on the page, a 2px edge in its tone on the left, its kind in words and an icon on the first line. Chosen over a washed box like `Alert` (Fläche) and a rule on top (Kopf).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-15                                     |
| Section links             | A link symbol after the heading's last word, shown while the heading is pointed at or the link has the keyboard. Chosen over a `#` in the margin and the whole heading as the link.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-15                                     |
| Current page              | In a `SideNav` the page the reader is on stands on the tint, like an entry of the `NavigationMenu`. Chosen over the mark closed to a disc before it and a 2px Ink rail.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-15                                     |
| Current subpage           | In a `SideNav` the subpage being read takes the hairline in the text colour, as the `TableOfContents` marks its section; its parent stays open without the tint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-16                                     |
| Contents mark             | A hairline runs along a `TableOfContents`; a 2px piece of it in the text colour stands by the section being read and glides to the next. Chosen over a gliding Indigo disc and weight alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Justin, 2026-11-15                                     |
| Site bar                  | `SiteHeader` floats at every width, like Clerk's: a frosted face (the ground at 85% with a blur) with a light edge and a short shadow, 8px off the window's top and sides, what stands in it on the content's edges. Clerk's graded blur up to the window's edge was tried and dropped: Safari sampled it and painted the status bar white. It replaces the flat panel, because Safari 26 tints its status bar from a bar that touches the top edge.                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                                     |
| Phone menu                | Over the whole window on the page's ground, square to it: the bar's top row with the close button where the menu button was, the places in groups (a few large ones, a longer list in two columns of small ones), the next step at its foot. It replaces the sheet from the right, whose rounded corners and short height looked odd against Safari's bars.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-16                                     |
| Ask on a phone            | Below 42rem a `Cta` has no cut: its actions stand inside the block at its foot, one over the other at its full width. The cut left a stub of the block beside the buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-16                                     |
| Long tab rows             | A row of tabs stays one row: it scrolls sideways, its edges fade where more tabs wait, and the current tab is brought into view. Chosen over a second line and over a segmented control on a phone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-16                                     |
| Phone spacing             | Two sections stand 96px apart on a phone (`py-12`), 192px from `sm` up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-16                                     |
| Section seams             | Zunge: a website's sections lie on each other as plates, every other one on the well (`bg-well`). Between two stands a `Seam`. The plate above has a hairline edge, a shade inside it and a short soft shadow (`depth-seam`). Across the content column its edge dips down as a tongue or rises as a notch, set per seam by hand. It replaces the 2px rule that opened each section. The closing `Cta` gets none. Chosen over the edge alone (Fuge), a 3px thickness under the edge (Kante), a tongue 430px wide, all seams the same way, and plain alternation. A light line on the lower plate (Stufe) did not show on Paper.                                                                                                                                                                                                                           | Justin, 2026-11-16                                     |
| Rule ends                 | Every 2px rule (`Table`, `ParameterList`, `Separator` `rule`) is a straight line with round ends, drawn into the place of a top border (`internal/rule.ts`). It replaces the square ends, and the table's rule that its scrolling box bent down at the corners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-16                                     |
| Edge fades                | What scrolls inside itself fades at the edge where more waits, never cut hard: code, a row of tabs, a wide table (sideways) and the side columns of a docs page (at their foot, and at the top once scrolled). The fade is 40px and moves on `settle`. A table's rule stays whole above its fading columns. It is one part now: `ScrollFade`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-16                                     |
| Copy page                 | A docs page is handed on as Markdown by a `CopyPage` at the end of the row above its title: one raised fitting with the copy and a chevron. Only the pressed key goes down, confirms a copy with the drawn tick, and its menu repeats the copy with a line ("Als Markdown, für eine KI") and opens the Markdown in a new tab. The line names KI (AI), not a language model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-16                                     |
| Page openings             | A website's page has no part of its own: the old `PageHeader` fixed one way to open a page, and pages open differently from site to site, so it is a `Heading` with a `Text` under it. The two large sizes of a `Heading` step down one on a phone. An app's page has one: every page of an app opens the same way, so `PageHeader` holds its title, a line and the actions at the right, under the bar that holds the way there.                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-16; app pages 2026-11-21               |
| Bar height                | The `SiteHeader`'s bar is 48px: 8px around a control, as it keeps 8px from the window. It was 56, which he found too tall; he chose 48 over 52.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-16                                     |
| Site pattern              | `Patterns/Site` is a test page for the site parts together, not a template: every site is laid out for itself. Its phone story went.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                                     |
| Places by share           | A slider's parts ride in lanes moved by a share of their own width, not by a length worked out from the control's width. A percentage stays one in the computed style, so nothing travels on load or when the slider is resized. As lengths (`100cqw`), Firefox corrected them after its first style pass and the thumb of a full slider glided in from a window's width away.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin's Firefox, 2026-11-16                           |
| One fade                  | The fade of a scrolling box is one mechanism, `ScrollFade` (and `useScrollEdges` for a box that belongs to another part): a table, the docs columns, code and tabs all use it. He asked for it as a part of its own.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                                     |
| Actions together          | `ButtonGroup` is one fitting with several keys, the recipe `CopyPage` had for itself: one face, one edge, one shadow, a seam in the edge's colour. A press moves only the key that was pressed: "When pressing the button group the entire group moves in. Only the pressed button should." Not for choosing a state (`SegmentedControl`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Claude, 2026-11-16; the press Justin's, 2026-11-20     |
| Work in progress          | A line that names work shimmers (`Shimmer`): muted text, a light in the text colour passing through and resting: 2.4s for a pass and its rest, 3em to either side, which he chose from three speeds and three widths. The steps of an assistant are a `Trace`: ring waits, arc works, disc is done, a hairline joins the marks, and a `TraceSummary` stands for the whole. Both marks stay: dots by default, and `marks="symbols"`, where a finished step carries the symbol of its kind; the rail is in both.                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-16                                     |
| Theme switch              | `ThemeSwitch` is the control only, in two forms. He thought of it as a select: that is the default, the choice by symbol and name in one button's room. `variant="segmented"` is three symbols in a round trough, without the round shape's marks: the symbol is the mark, and stands in a circle. It holds the choice and reports it; since dark mode (2026-11-22) `useTheme` wires it to the page.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                                     |
| Changing code             | A line that joins a `CodeBlockLive` opens like a fold ("Aufklappen"): its row opens on `settle` and pushes the lines below down while its text fades in and drops 4px into place. Chosen over a flap that swings down from its top edge and a drawer it slides out of. A changed value keeps both styles: it fades in (the default), or with `changeMotion="glow"` also lights up in the accent for a moment.                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-18                                     |
| Consent look              | A sheet on the page's ground (light or dark with the page), not Ink. Both answers as raised white keys. In the bottom right corner on a wide window. The first layer's legal facts as three short lines, not prose; they cannot be folded away while „Alle akzeptieren“ stands on that layer (DSK, OH Digitale Dienste, Rn. 53 and 119). Chosen from a board of sheet and Ink, white and dark keys, bottom left and bottom centre.                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-18                                     |
| Consent words             | The draft stands: „Cookies auf dieser Website.“, the intro, the facts, „Die Einwilligung ist freiwillig …“, „Alle ablehnen“, „Alle akzeptieren“, „Einstellungen“, „Auswahl speichern“. Addressed to nobody, as the voice guide asks of a cookie notice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-18                                     |
| Consent motion            | The card rising in, growing into the settings and back, the third key's words turning over, and the switches flipping before it leaves: confirmed as built, on his iPhone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-18                                     |
| Embed mark                | A placeholder says what waits there with a mark above its title: a play mark for a video, a location pin for a map, drawn flat in a hairline ring, since it is no key („Inhalt laden“ is).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-18                                     |
| Consent way back          | A „Cookie-Einstellungen“ link among the legal links of every footer; no floating button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-18                                     |
| App frame                 | An app's frame is a `Sidebar` beside its pages, inside an `AppShell`. The sidebar is a panel: flat, on the page's ground behind a hairline; `bg-well` as its class makes it a plate of its own, and both are in use. Collapsed it keeps its symbols as a rail (the default) or leaves entirely (`collapse="hidden"`); both stay. On a narrow window it is a drawer from the left.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-18                                     |
| Sidebar tint              | The page one is on stands on the tint, and the tint glides to the next page instead of changing place at once. On a subpage it goes down to the subpage and the page above stays in the text colour; on the rail, where subpages are folded away, the page above wears it. Chosen over the tint staying on the page above with the hairline marking the subpage, as a `SideNav` does: a hairline under an untinted page did not read as selected.                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-18                                     |
| Subpages                  | The subpages of a sidebar entry fold open and shut under it and push what stands below. They never appear or vanish in one frame: that made the tint snap. Each may carry a 14px symbol. Places that are needed now and then wait in a menu beside the sidebar (`SidebarMenu`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-18                                     |
| Symbols under the pointer | A symbol in a sidebar row only darkens under the pointer, and dips under a press. It does not grow: sizing every symbol up so that something happens was rejected. A motion of its own (`iconMotion`) is for a symbol that has one in it: a gear turns, a sheet is picked up by its corner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-18                                     |
| Command palette           | `Command` opens on `snap`, grown by a fiftieth and without travel; its sheet follows the height of its results; the page behind is dimmed as behind a dialog. Chosen over opening at once, one fixed height and a light scrim.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-18                                     |
| App strings               | The German defaults of the app frame stand as built: „Seitenleiste“ for the sidebar's button, „Befehle“ for the palette, its key hints „Auswählen“, „Bewegen“, „Zurück“ and „Schließen“, and the key names of a `Shortcut` (Strg, Esc, Leertaste, Entf).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-18                                     |
| Chips                     | A `Chip` is a small raised plug by default and flat like a `Badge` with `variant="flat"`; both stay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-18                                     |
| Loading                   | The shapes of a region that is loading (`Skeleton`) breathe together by default. A passing light and standing still stay as variants (`light`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-18                                     |
| Empty lists               | The symbol of an `Empty` stands in a small tile by default and bare with `variant="bare"`; both stay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-18                                     |
| Pages of a list           | `Pagination` is numbered by default, the current page on a tint that glides to the next. The compact form („Seite 3 von 12“ and two keys) stays as the variant for a narrow place.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-18                                     |
| Selection bar             | An `ActionBar` is a dark sheet by default, on Ink like a toast, and a light one with `ground="paper"`: "it should have both dark and light mode available". Dark on a dark page it was set off by its edge alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-18                                     |
| List strings              | The German defaults of the list parts stand as built: „ausgewählt“ and „Auswahl aufheben“ in an `ActionBar`, „Seiten“, „Seite 3“, „Seite 3 von 12“, „Vorherige Seite“ and „Nächste Seite“ in a `Pagination`, „Entfernen“ for a chip's key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-18                                     |
| Code field in a dialog    | An `OtpField` keeps its own width by default and shares the width of its place with `fill`. In a dialog or a narrow card it is filled: at their own size six slots kept half the line empty, and centred they broke the dialog's left edge. Label and hint stay left.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-19                                     |
| Press on a choice card    | A `RadioCard` or `CheckboxCard` keeps its size and answers with its shadow: a little higher under the pointer, down on the page under a press, while its mark dips to 0.92 as a plain `Radio` or `Checkbox` does. The accent edge of the choice eases in on `settle` as the card comes back up, and leaves on `leave`. The whole card going down to the press scale was "way too heavy" and did not fit (0.98 of a wide sheet is ten pixels, with a bounce back), and an edge that changed at once was too hard: "the focus should appear a bit softly". The press scale is for parts the size of a button.                                                                                                                                                                                                                                               | Justin, 2026-11-19; the form Claude's, to be looked at |
| Chips in a field          | The chips of a multi-select are flat like a `Badge` by default, quiet in the socket. The raised plug of a `Chip` stays as `chipVariant="plug"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-19                                     |
| Code slots                | The slots of an `OtpField` are joined by default: a group of three shares one socket, divided by hairlines. One socket per slot stays as `variant="separate"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-19                                     |
| Chosen card               | A chosen `RadioCard` or `CheckboxCard` wears the accent as its edge and closes its mark, as built. The mark alone stays as `chosen="mark"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-19                                     |
| Checkbox card mark        | A `CheckboxCard` carries the checkbox's own box and tick. The ring that closed to a disc, as on a `RadioCard`, was dropped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-19                                     |
| Card radio                | A `RadioCard`'s mark is the radio's socket with the seated disc, as a `CheckboxCard`'s is the checkbox's: the flat 8px ring of a list looked cheaper beside the checkbox card.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Claude, 2026-11-19; to be looked at                    |
| Steps                     | Numbered by default; dots stay as `marks="dots"`. The marks are a checkbox's: "the kinda 3d bevel like the checkbox". A finished step is the accent plug with its tick, the current one the socket with the accent as its rim, one ahead the empty socket with its number. The names stand centred under their marks, the line between them has round ends, going on is one movement along the line, and where the steps first show they draw themselves in, nothing there at first.                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-19                                     |
| Upload zone               | A `FileUpload`'s zone shows its symbol in a small tile by default; the words alone stay as `variant="plain"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-19                                     |
| Input strings             | The German defaults of the app inputs stand as built: „Dateien hierher ziehen“, „Loslassen, um sie hinzuzufügen“, „Dateien auswählen“, „Noch einmal versuchen“, „entfernen“, the states of a file (Wartet, Wird hochgeladen, Hochgeladen, Fehlgeschlagen) and of a step (Erledigt, Aktueller Schritt, Steht aus), „Anzeigen“ and „Verbergen“, „Kopieren“, „Kopiert“, „Markiert“ and „Nicht kopiert“ with their sentences, „Ziffer 2 von 6“, „Ausgewählt“ with the hint sentence of a multi-select, and „„Dringend“ anlegen“.                                                                                                                                                                                                                                                                                                                              | Justin, 2026-11-19                                     |
| The person's words        | In a conversation the person's own message stands at the right on the ground's tint, in the bubble of a `Quote` with its tight corner towards the person. Chosen over a quiet white sheet with a hairline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-19                                     |
| Send key                  | The keys of a `PromptInput` stand in a row of their own under the text, the paper clip at the left and send at the right, where there is room for more. Chosen over send at the right of the text's last line.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-19                                     |
| Arriving text             | An answer being written fades in a few words at a time, a burst pressed into a quarter of a second. Chosen over a line at a time, once it is full.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-19                                     |
| References                | A reference to a source is a small raised number in the accent, as a footnote is set, tight after its sentence. Chosen over the number in a small raised plug on the line.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-19                                     |
| Assistant strings         | The German defaults of the assistant's parts stand as built: „Nachricht an die KI“, „Senden“ and „Anhalten“, „Datei anhängen“, „Anhänge“, „‹Name› entfernen“, the states of an attachment (Wird hochgeladen, Hochgeladen, Fehlgeschlagen), „Gute Antwort“ and „Schlechte Antwort“, „Noch einmal“, „Die Antwort ist abgebrochen.“, „Neueste“, „Unterhaltung“, „Du“ and „KI“, „Quellen“, „Quelle 1: ‹Titel›“ and „öffnet in einem neuen Tab“.                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-19                                     |
| Avatars                   | Round: "I would like avatars to be round". Before, a rounded square. In a stack the cut follows the circle in front, and a presence dot on the edge has its gap cut out of the avatar behind as well.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-19                                     |
| Figures in a row          | Both stay: "both are important". A `StatGroup` is a row with hairlines between the figures; on an app's page it stands in one `Card` (see Cards on an app's page), on the ground under the 2px rule. `variant="cards"` puts each figure on a card of its own.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-19                                     |
| A banner leaving          | A closed `Banner` leaves the way it came in: it rises into the top edge and fades on the spring its room closes on. Before, it faded faster than its room closed, and the page rose into an empty gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-19                                     |
| Rolling figures           | A `RollingNumber` comes to rest on `settle`, without bounce, over `seat`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-19                                     |
| Avatar stack              | One avatar lies a quarter over the next (6, 7, 9 and 12px from small to extra large), over a third; the cut between two and around a presence dot is 2px, over 3px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-19                                     |
| Banner place              | A `Banner` is a wash across the full width of the page or its main column, under its top edge, with a faint line at its foot. The strip set into the column with rounded corners was dropped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-19                                     |
| Timeline lead             | Each entry is led by what it is: a person's avatar, the symbol of a system event, the danger mark for a failure, or the plain mark, all in one list ("by kind but also just allowing the normal dots as a kind").                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-19                                     |
| Dashboard strings         | The German defaults stand as built: „Hinweis schließen“, the banner's „Hinweis“, „Erledigt“, „Warnung“ and „Fehler“, the presence words „Online“, „Abwesend“ and „Offline“, and a trend's „Gestiegen“, „Gesunken“ and „Unverändert“.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-19                                     |
| Tables in an app          | Karte: on an app's page every block stands on a raised `Card`, named by a `CardBar` (its heading and a way to all of it); a `Table` runs to the card's edges on the close rhythm of the first round's Straff, its column names on the well, no 2px rule, its states `Badge`s with a dot. The first round's list was "too spacey" and "feels off"; of the second, Straff under its rule was "best but ... i dont like the overall layout and feeling. Also with the black bar at the top." Chosen over Offen (on the ground, the heading opens the table) and Leiste (the column names in a rounded band). The pages of a site and the docs keep the ground and the rule.                                                                                                                                                                                  | Justin, 2026-11-19                                     |
| Cards on an app's page    | Gebündelt: in an app's main area a card keeps its edge and its close shade but not the wide soft shadow (`depth-card` under `app-shell-main`), and the figures of a dashboard share one card with hairlines between them: three cards on the dashboard instead of six. Six lifted cards were "super cardy ... super airy ... soft shadows". A card standing alone (a sign-in form, the site, a plan to choose) keeps its lift. Chosen over the soft cards, the crisp edge alone with a card per figure, and only the list on a card.                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-19                                     |
| Card shadow               | A card's wide soft layer reaches 6px down with a 16px blur (too spread out at 12px and 28px). Chosen over that and over 3px and 8px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-20                                     |
| Bevelled card             | A card that is handled is cut like a fitting, the Clerk-like card: `variant="bevel"` (Fase: crisp edge, top light, 1px lip, short shadow) and `variant="gloss"` (Glanz: the same with a face that shines and darkens toward its foot). "Keep both fase and glanz"; Fase is the default bevel. A 2px lip (Lippe) was dropped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Justin, 2026-11-20; Fase as the default Claude's       |
| Choice cards              | `RadioCard` and `CheckboxCard` stand on the bevel. Under the pointer a soft light follows the pointer across the face; nothing lifts and no shadow grows (a wide shadow rising was "odd"). Chosen over a firmer edge and a 1px lift.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-20                                     |
| Action bar cut            | The `ActionBar` is a key that floats (`depth-dock`): a key's face, edge, light and lip over a long, wide shadow, "floating but still a machined piece". Chosen over a shorter and a wider float and over the flat sheet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-20                                     |
| Cut file names            | A long name is cut in its middle with an ellipsis, as a file manager does: „Angebot-Ko…bst.pdf“. Chosen over a cut at its end and over the fade before the extension, which "looks odd". Chips may be flat (`chipVariant="flat"`); the plug stays the default, also in a prompt. The kind symbols of a chip have no letters: at 14px „PDF“ and „XLS“ ran together ("too thick, they kinda explode").                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-20                                     |
| Chosen rows               | No list keeps a column on the left for its mark ("i find myself hating the left space"). His rule: where nothing stands at a row's right, the disc (one choice) or the tick (on or off) stands there; where a detail does, the chosen row stands on the tint, and chosen rows that touch join into one shape with only the outer corners round, easing as they join. Chosen over the tick after the detail in every row, the tint everywhere and the label in the accent.                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-20                                     |
| Symbols in lists          | A menu row can carry a 16px symbol (`icon`) that darkens with the row; a page of a `NavigationMenu` panel its symbol in a raised 36px tile with an 18px symbol, as in Clerk's menus, and the `CopyPage` menu the same tile. Chosen over a flat tile and over 32px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-20                                     |
| Keys under an answer      | The chosen thumb has no grey square, it is drawn in the text colour; a thumb taken back tilts back and settles; the retry arrow turns a little under the pointer and once round when pressed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-20                                     |
| Code halo                 | The halo of an `OtpField` is one rounded piece that glides to the next slot on `snap` ("any way to make the focus on the otp more smooth?"). Chosen over `glide` and over standing on the next slot at once.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Justin, 2026-11-20                                     |
| Toolbar names             | A symbol key in a `Toolbar` says its name and its shortcut in a tooltip, and its neighbours open at once after the first ("toolbar should have tooltips"). The keys under an answer share one wait the same way.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-20                                     |
| Rolling change            | The amount of a `StatChange` rolls like its figure, across zero too ("maybe here should the percentage also animate?").                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-20                                     |
| Accordion                 | Lasche: the row under the pointer takes the wash 2px inside its lines, and the lines on its two sides step aside, so none runs on past the wash's corners. An open row rests unmarked; pointed at, its question's wash squares its lower corners and runs on at half strength behind the answer. A hairline opens the block, not the 2px rule ("the bold black bar"). `quiet` (Linie) stays: no wash, only the chevron answers. The old wash stood a pixel short of lines that ran past its corners and floated over an open answer. Chosen over Fach (the open answer in a well, its question the lid).                                                                                                                                                                                                                                                  | Justin, 2026-11-20                                     |
| Button resize             | A `Button` whose label changes while it is on screen takes `resize`: it eases to the new width on `glide` (no bounce, which would cut into the label) and what stands beside it moves along. The label stays centred and is uncovered from the middle out, its edges fading in the button's padding rather than cut. Off by default, as the `CopyPill`'s words are the only other width that eases.                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-21                                     |
| Chart line                | A single series is drawn in the text colour (Tinte), as a `Meter` measures; `tone="accent"` makes it Indigo for the one chart a view is about. Chosen over Indigo by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-20                                     |
| Chart wash                | The area under a line fades towards the baseline (Verlauf). The even wash (`wash="flat"`) and no area (`variant="line"`) stay: "Verlauf as default. Gleichmäßig and ohne as options".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-20                                     |
| Chart curve               | A line bends through its points without overshooting them (monotone, Weich); straight segments stay as `curve="linear"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-20                                     |
| Reading a chart           | On a dashboard both say the value under the pointer: the figure above rolls to it (`onActiveChange` into a `RollingNumber`) and the readout at the crosshair names the moment and every series. The figure alone (`readout={false}`) and the readout alone stay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-20                                     |
| Chart pointer             | A flat dot with a 2px ring of the ground and a hairline find the moment. A soft band as wide as one point (`crosshair="band"`) stays for points that stand for a stretch of time: "punkt and band makes sense in some contexts". The raised knob was dropped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-20                                     |
| Ranked bars               | All three `BarList` bars stay, each for its place: a wash behind the name (Lasur, the default), a thin bar under name and value (Strich), a `Meter`'s trough (Rinne); the share is a prop. A wash has even 6px corners at both ends, and under the pointer the rest of its row lights flush with it; a thin bar is round at both ends.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-20                                     |
| Series colours            | Gedreht: Indigo, then teal, amber, blue, green and magenta at the accent's lightness and chroma, in an order chosen by search and checked for colour-blind readers (`chart.css`). Chosen over the code colours (Farbig) and Indigo with greys (Ruhig).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-20                                     |
| Chart draw-in             | A chart draws itself in where it first shows: lines are uncovered from left to right, the bars of a list grow one after the other. `drawIn={false}` turns it off. Chosen over standing still.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-20                                     |
| Tracker green             | A good day is the success fill at 80%, a disturbance and an outage at full strength: the news is the exception. Full green was a heavy slab, 70% read greyish. Keeps 3:1 on Paper and Ink.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-21                                     |
| Heatmap hue               | The steps run from the empty trough to Indigo, so "nothing" and "a little" differ by hue; `tone="neutral"` runs to the text colour where Indigo is spent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-21                                     |
| Column colour             | Both stay as themes: a single series of columns takes the text colour like a line by default, `tone="accent"` makes it Indigo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-21                                     |
| Chart words               | The default words stay: „In Ordnung“, „Gestört“, „Ausgefallen“, „Keine Daten“ (Tracker), „Weniger“ / „Mehr“ (Heatmap), „vom Schritt davor“ / „vom ersten Schritt“ (Funnel), „von … · … vom Ziel“ (Bullet), „Veränderung“, „Stand“, „Summe“ (Waterfall); each chart takes its own through props.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-21                                     |
| Axis on new data          | A value axis is as wide as its widest label; when new data changes the labels, its column eases to the new width on `settle` and the plot with it, instead of the chart jumping sideways. Its lines are kept by their place in the order: each glides to its new height and its number rolls (`RollingNumber`); a line the new range has no place for fades where it stood, one it adds fades in where it belongs.                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-21                                     |
| Readout swap              | Where a chart reads separate things in turn (a change of status along a `Tracker`, the columns of a `BarChart`, the steps of a `Waterfall`), the readout swaps its content as a `NavigationMenu` swaps its own: from the side the reader goes to, 70ms after the old one starts to leave, the sheet easing to its new size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-21                                     |
| Waterfall colours         | A gain in the success colour and a loss in the danger colour, since a step of a result means good or bad (`colors="status"`); `colors="quiet"` keeps gains in the text colour and losses in the muted grey, as the option for a page where status colours are spent. Totals follow `tone`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-21                                     |
| Waterfall joins           | A hairline from the side of one column to the side of the next, meeting both at square corners, so the steps read as one staircase ("Stufe"). A line from centre to centre over the round corners looked sloppy; a gap bridge and no line at all were the other options.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-21                                     |
| Tracker without data      | A cell without data is a faint wash of the text colour (`bg-fg/10`), a placeholder a little lighter than any ground. The sunken trough read as holes on Ink; an outline was busy in a 90-day strip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-21                                     |
| App page opening          | `PageHeader`: the title (24px in an `AppShell`, 36px on a page without one), a muted line 4px under it, the actions at the right on the line of the last words, and under the words once the header is narrower than 36rem. A state may stand after the title as a `Badge`. Nothing above the title: the bar holds the way there.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Claude, 2026-11-21; to be looked at                    |
| Range presets             | A `DateRangeField` offers ranges taken with one press (`presets`, `lastDays`): a column at the left of the calendar behind a hairline (above it on a phone), the disc by the one the range is, and the field names it („Letzte 28 Tage“). Chosen over a row of quiet keys above the calendar, which wrapped, and over the two dates in the field.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-21                                     |
| Stored secret             | A secret the server keeps shows as a `SecretField` hides one, with the end kept instead of the start: a lock, „••••••••4f2a“ in mono; assistive tech hears „Gesetzt, endet auf 4f2a“. „Ersetzen“ turns the field empty for a new one, behind discs the eye shows. Chosen over the words „Gesetzt, endet auf …4f2a“.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-21                                     |
| Relative times            | „gerade eben“, minutes, hours within the day, then the days of the calendar („gestern“, „vor 3 Tagen“), and the date from a week on, as a `Timeline` writes it. It changes without motion and has no tooltip; where the exact moment matters, the page writes it out.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Claude, 2026-11-21                                     |
| Page strings              | The German defaults stand as built: „Letzte 7 Tage“ (28, 90), „Schnellauswahl“ for the presets, „Gesetzt, endet auf …“, „Ersetzen“ and „Abbrechen“, „gerade eben“ and „gleich“, and a relative time in lower case also where it starts a table cell („gestern“, „vor 4 Minuten“).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-21                                     |
| Locale                    | A `LocaleProvider` (`de` or `en`) switches every default word and the tag numbers and dates are formatted with (`de-DE`, `en-US`). A label or `locale` prop still wins, and without a provider everything is German as recorded in the rows above. The words are in `src/locale/messages.ts`, one namespace per component, American English in the register of the German. A server-safe part says a default word through a client leaf (`Localized`), and a name that was an attribute through a hidden element it points to (see "Locale, plain parts"); a Server Component can still pass a word from `getMessages(locale)`. The typed date fields read each language's own format (see "Dates in English"). The calendar's week starts on Monday in both. The English wording is as built and waits for Justin's sign-off (#54).                      |
| Dark mode                 | A mode beside the grounds: `data-mode="dark"` on `<html>` turns every ground into its dark counterpart, so a quote, a tooltip or an ask on a dark page is dark too. "As the system says" by default; `ThemeScript` resolves it before the first paint and `useTheme` keeps the reader's choice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-22                                     |
| Dark page                 | A step above the kit's Ink (`#1c1b26`), so the page reads as a room and not as a void. Chosen over Ink (`#13121c`) and over a deeper, almost black one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-22                                     |
| Voice in the dark         | Tooltips, toasts, readouts and the action bar speak as the page does in dark mode: a sheet of the page, set off by its edge and shadow (Gleich). Chosen over Ink lifted a step (Gehoben) and over Ink turned light (Umgekehrt).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-22                                     |
| Tint in the dark          | Barely tinted (`#1c1a29`, Leise). Chosen over a visible violet wash (Violett).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-22                                     |
| Indigo in the dark        | Deeper (`#4a3eb4`), so the ask does not glare beside the dark page. Chosen over Indigo as in light.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-22                                     |
| Turning dark              | The old page fades into the new one on `settle` (a view transition; at once under reduced motion or where the browser has none). Chosen over turning at once.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-22                                     |
| Knob in the dark          | The knob of a switch and a slider stays light with its lip in both states on a dark ground (Hell). A dark knob on the lavender track read as a hole. Turned down: a light knob without the lip, troughs lifted above the page (Licht), and a dark raised knob in the Fase cut.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-22                                     |
| Depth in the dark         | The Fase cut stays: a near-black edge, a light along the top, a gloss. Everything that stands on the page wears the buttons' edge: the site's bar (with a button's gloss, as its face is the page's), cards, bevelled and glossy cards and the key's `Cta` block, where a light ring had read as an outlined box. The same on Ink and on Indigo in both modes, whose cards and bar had the same light ring. Turned down: Clerk's dark (a faint light edge, a weaker top light, no lip) and a flat one (one light hairline and a short shadow).                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-22                                     |
| Dark, refined             | After two reviews of every story in both modes, where Ink's values did not carry a whole dark app: the tint and the status and code line washes are calmer (the info wash is the tint); disabled sinks below the field; the quiet surface (a flat chip, an icon's tile) rises a step above the card, and the site's floor lies a step below the page (`floor`); danger fills a red with weight (`#e45a62`), so an outage reads louder than a disturbance; an avatar is a lifted grey; a `Cta` in the ask's tone takes the deeper Indigo and in the key's tone a plate of Ink with a light of its own; an empty heatmap day and a group's +N are a placeholder a shade above the page; what a calendar holds chosen is a deeper lavender (`selection`); the 2px rule is the body colour; sheet shadows and the scrim are lighter. Light keeps every value. | Claude, 2026-11-22; to be looked at                    |
| File tile face            | A `FileTile` stands on a bevelled card (Fase), a part that is handled; chosen it wears the accent edge. Chosen over the picture flat on the well with the chosen tile on the tint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-23                                     |
| File tile mark            | The mark of a file tile (the checkbox's socket, plug and tick) stands at the top left over the picture. Chosen over the mark before the name in place of the kind's symbol.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-23                                     |
| Folders among files       | A folder is a compact row one line high in the files' columns, its symbol before its name, the mark taking the symbol's place. Chosen over a folder as large as a file's tile.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-23                                     |
| Drop plate                | While files hang over a `FileDropArea`, the plate that says where they go („In building-gbar ablegen“, a folder's own label over a folder) stands in the middle of the area, a raised plate. Chosen over a bar along the area's foot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-23                                     |
| See-through pictures      | A picture that may be see-through (PNG, WebP, SVG, GIF, AVIF, icon; not JPEG) lies on a quiet checker (`checker`, `src/styles/checker.css`) in a `FileTile` and a `MediaPreview`: two tones of the well, the second the ground's text colour as a faint wash (8%, 7% in the dark), squares of 8px. A black logo vanished on the dark well and a white one on the light well, and both variants of a logo (`x.svg`, `x_dark.svg`) are kept side by side, so no fixed background serves. Decided, not a switch. It lies behind the drawn picture only: it is the background of the picture's own box, contained in the well and never larger than the picture's own size, so the well beside it stays plain. Across the whole well (the first version, the same day) it put stripes beside every opaque square badge in a wide tile.                        | Justin, 2026-11-23                                     |
| Secret's own key          | A `StoredSecretField` with `saveLabel` saves itself, the hub's layout taken over: the Save key stands beside the field once something is typed, and the field's edge glides aside to make room for it (`glide`) while the key fades in and seats (`seat`); cleared, the key fades and its room closes. Saving spins in the key at its width; through, the key draws the tick, holds it 900ms, then leaves while the field turns back to the stored secret with its new ending. A refused save leaves the key and what was typed. The tick in the key was chosen over the tick in place of the lock.                                                                                                                                                                                                                                                       | Justin, 2026-11-23                                     |
| No way back in the field  | While a new secret is typed the field has no key of its own: „Abbrechen“ in it was dropped („never while typing“), so the row holds the discs, the eye and Save. Escape, or leaving the field while it is empty, brings the stored one back; the focus stays where the reader put it. Typed text is never thrown away by leaving.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-23                                     |
| Busy and done             | A `Button`'s label and its spinner cross-fade both ways: the label sinks away (0.92, `snap`) as the spinner seats in (`settle`), and when the work ends the spinner fades and the label seats back with the release bounce, instead of being cut. `done` draws the copy tick in the label's place for a moment. For every button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-23                                     |
| Renaming in place         | An `EditableName` is seamless: no edge and no halo of its own, so renaming a chosen tile shows one ring, the tile's, and typing reads as typing into the tile ("too many focus rings. Keep only the outer"). A refused name is underlined in danger under its reason.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-24                                     |
| Toast keys                | A toast's key ("Rückgängig") and its cross stand in the middle of its height, not at its top, where "it looks odd".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-24                                     |
| Search keys give way      | A `SearchField`'s keys and its clearing cross cross-fade where they stand, as „Busy and done“ has it, instead of swapping: "fade out smoothly and animate into the x instead of just instantly swapping".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-24                                     |
| Details beside a choice   | A `DetailPane` opens only with a choice and pushes the content narrower (chosen over a sheet laid over the content's edge): a pane that is always there is "pretty useless" while nothing is chosen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-24                                     |
| Segmented edge            | A `SegmentedControl`'s trough keeps its edge outside its box (`depth-trough-control`), as a field and a key do, so beside a search field of the same height it stands as tall to the eye; inside, it stood 2px shorter and "feels a bit uneven".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-24                                     |
| Marks in a list           | In a list of files the row's picture turns into the selection's mark when pointed at, and every row shows its mark while anything is chosen (`FileThumb`), as the tiles of a grid do.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-24                                     |
| Destructive rows          | A menu row that destroys something has `tone="danger"`: its words and symbol in the danger colour, and the danger wash as its highlight under the pointer and from the keyboard. It stands last, under a line. A disabled one is grey like any other. `Menu` and `ContextMenu` share the row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Claude, 2026-11-27; Justin to confirm                  |
| Links that leave          | `Link external` opens a new tab without a referrer and carries an arrow that points out after its last word. The arrow is whole at rest (it is a fact about the link, not an invitation) and moves a pixel on its way out when pointed at; a word joiner keeps it on the last word's line and the underline ends with the words. The first draft, `ActionArrow`'s chevron that grows a shaft, read as a stray corner beside small text.                                                                                                                                                                                                                                                                                                                                                                                                                   | Claude, 2026-11-27; Justin to confirm                  |
| Overlay edges             | The body of a `Dialog` or `Drawer` is one more box that scrolls inside itself, so it takes the one fade: 40px at the edge where more waits, nothing at rest. `fade={false}` is for a body that must never be masked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Claude, 2026-11-27; Justin to confirm                  |
| Light scope               | A region may fix its own mode: `<Ground mode="light">` stays light on a dark page (and `mode="dark"` dark on a light one), for showing both modes at once. It is the one exception to "dark mode turns every ground"; every light token block answers to it, and a popup opened inside carries it. One level only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Claude, 2026-11-27; Justin to confirm                  |
| Loading files             | A file tile that is still loading has no face and no shadow, only its shapes where the picture, the name and the facts will stand: nothing can be handled yet, and only what moves casts a shadow. A folder loads in whole rows of the grid's own columns. A loading table is a shape only: no region, no name, no stop for Tab.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Claude, 2026-11-27; Justin to confirm                  |
| Several files chosen      | `FileThumbStack` is a hand of up to four pictures in the tile's cut: the first upright on top, each one under it turned 5 degrees further (`fan`). A row (the hub's first form) and a pile are kept as `look` until one is chosen. A file that joins seats in; the rest is a number at the corner.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Claude, 2026-11-27; Justin to confirm                  |
| Sidebar brand             | `SidebarBrand` starts where the entries' symbols start. On the rail the word leaves as the entries' names do and the `Logomark` stands in the symbols' column, a plain crossfade. The two are never seen together, and they are named once.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Claude, 2026-11-27; Justin to confirm                  |
| Unknown ending            | A stored secret whose ending the server does not keep shows twelve discs, as long as eight discs and four characters, so a list of secrets ends on one line. Assistive tech hears „Gesetzt“ alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Claude, 2026-11-27; Justin to confirm                  |
| PDF preview               | A PDF's symbol and type stand behind its frame, which has no face: a browser that draws no viewer leaves the symbol instead of an empty box. On a touch device there is no frame at all but a link that opens the file in a new tab.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Claude, 2026-11-27; Justin to confirm                  |
| Accordion in a card       | Straight in a `Card` the card holds it as it holds a `Table`: the lines run to the card's edges and stay, the text stands on the card's 20px, and a wash is the whole row between its lines (square, clipped by the card's corners), not the 2px-inset rounded one, which would stop short of the edge its lines reach. The card's edge, the line under a `CardBar` and the line over a `CardFooter` open and close the block; no second line. The focus ring stands inside the row. A list row (`media`, `description`, `trailing` on `AccordionTrigger`, as props because the row's shape is fixed) is 12px above and below a 40px plate; its answer starts under the title, and its state moves under the description in a row narrower than 24rem. In a `CardContent` it is the block it is on a page.                                                | Claude, 2026-11-28; Justin to confirm                  |
| A name that wraps         | A title of several lines (`EditableName multiline`) is changed as it stands: the text itself becomes editable as plain text, so its lines, size and place are the same at rest and open (the pictures are identical to the pixel in Chromium and WebKit), and it only gains a caret. A field sized by a mirror was built beside it and came close (the same lines; two device pixels at the text's left edge differed in Chromium at 2x, none in WebKit); it was dropped because it is two boxes that have to agree, where this is one text. A value that may be missing reads what a press does in its place, muted („Titel hinzufügen“), and that placeholder is the key that begins the change; the same words stay in the field while it is empty.                                                                                                    | Claude, 2026-11-28; Justin to confirm                  |
| Dates in English          | Under `en` the date fields read and write American dates, month first: 11/30/2026, typed also as 11/30, 11-30-2026 or 113026, a range with a dash, a hyphen or "to". A date with dots is not read there: it is day first almost everywhere, and the field never guesses which number is the day; its message names the format instead, with an example from the same formatter the reader uses. A time stays on the field's own clock (`hourCycle`, 24 hours by default), the week starts on Monday in both languages, and a day's name for assistive tech says "November 18", not "18th", so it holds the number that is seen. This replaces the sentence of the Locale row that the fields read German formats in both languages.                                                                                                                       | Claude, 2026-11-28; Justin to confirm                  |
| Locale, plain parts       | A server-safe part with no label of its own now follows the provider for a name that was an attribute as well: the table's word stands in a hidden element inside the part and names it through `aria-labelledby` (`AnchorHeading`, `Breadcrumbs`, `Pager`, `Chip`, `FileThumbStack`), so nothing shows and nothing is copied or found with the text; a label of the caller's stays the attribute it was. A changed code line's sign takes its word from a CSS string its scroll region sets. `Bullet` and `Funnel` write their figures through a client leaf in the provider's tag. `Combobox` and `Command` sort in the provider's tag, and in the machine's without one. A chart's own words are a `words` prop (`labels` is taken in `Dumbbell`). An attachment's key is „… entfernen“ and "Remove report.pdf".                                       | Claude, 2026-11-28; Justin to confirm                  |

## Colour

Four grounds, switched with `data-theme` on any element (`.dark` aliases Ink): **Paper** is the
default app surface, **Tint** carries someone else's words (a quote, generated text), **Ink** is
the system's own voice (tooltips, toasts) and a dark section, **Indigo** is the ask. Components
never branch on the ground; every difference flows through the `--lf-*` variables in
`src/styles/grounds.css`.

**Mode** is the other axis: `data-mode="dark"` on `<html>` turns every ground into its dark
counterpart. The ground still says who is speaking; the mode says how light the room is.

| Ground | Light mode          | Dark mode                                                        |
| ------ | ------------------- | ---------------------------------------------------------------- |
| Paper  | `#fbfbfd`           | `#1c1b26`, a step above the kit's Ink: a room, not a void        |
| Tint   | lavender `#edeafc`  | barely tinted `#1c1a29`                                          |
| Ink    | the kit's `#13121c` | the page's own values: a tooltip or toast is a sheet of the page |
| Indigo | `#5f50d0`           | deeper `#4a3eb4`, so the ask does not glare beside the dark page |

In dark mode Paper, Tint and Ink take Ink's recipes for depth, status, code and charts (light
from above on a dark face, near-black edges and shadows, the key inverted to a light face);
Indigo keeps its own. `ThemeScript` resolves "as the system says" before the first paint,
`useTheme` keeps the reader's choice and fades the old page into the new one when it changes.
The token test checks contrast and completeness on all eight ground and mode pairs.

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
- The **switch thumb** takes the colour that reads on its track (`thumb`, `thumb-on`): white on
  a light ground, light with its lip in both states on a dark one, Indigo on Indigo's white
  track. A dark knob on the lavender track read as a hole.

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
- **A fold unfolds.** The answer of an `Accordion` and the content of a `Collapsible` come down
  4px with the opening edge while they fade in (`disclosureUnfold`); closing only fades. Their
  chevron leans 1.5px the way it points while its row is pointed at (`--motion-lean`) and turns
  on `seat`. Both go to zero under reduced motion. A `Sidebar`'s subpages do not unfold: its tint
  measures them while they move.
- Keyboard focus, menu highlight, error colours and page load do not animate. The page loads
  that do are a `Steps`, which draws itself in where it first shows (Justin, 2026-11-19), and a
  chart, whose lines are uncovered from left to right and whose bars grow in (Justin,
  2026-11-20).
- **Typing does not wait.** What the keyboard does many times in a row is never waited for: a
  digit of an `OtpField` is readable in its first frame and only its seating springs. Its one
  halo glides to the next slot on `snap`, the fastest spring, so it is there before the next
  digit is (Justin, 2026-11-20: hopping looked hard; chosen over the slower `glide`). How often
  a motion is seen decides how much of it there is: a
  `ContextMenu`, opened all day and under the hand, only fades in on `snap`; a step that is
  finished or a file that arrives is rare and may take `settle`.
- `box-shadow` transitions only on small controls. Under reduced motion only opacity changes.
- Travelling parts are placed from measured offsets and moved with a CSS spring, not with a
  scale-based layout animation: that distorts shadows and breaks under CSS `zoom`. The offsets
  are written as plain numbers of layout pixels and made lengths where they are used
  (`calc(var(--thumb-left) * 1px)`): under `zoom` every engine treated a length in a custom
  property its own way, and Firefox drew the segmented thumb 1.4 times too wide.
- **What moves is a transform.** `translate` and `scale` are animated without laying the page
  out again; a width, an inset or a padding is laid out on every frame, which showed as a stutter
  on a 120Hz phone. A slider's thumb, fill and caps, and the fills of `Progress` and `Meter`, are
  all placed by `translate`.
- **A place is a share, not a length.** Where a part's place depends on its container's width,
  it is a percentage of a box that has that width (a slider's lanes), never a length worked out
  from it (`cqw`). A percentage is the same computed value at every width, so it changes only
  when the value does: nothing travels on load or on resize. Firefox works a container length
  out against the window first and corrects it, and that correction started the transition.
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
- **A shape that re-forms** is a motion CSS cannot run: a calendar's selection is a
  polygon, and blending two polygons point by point crosses itself on the way. Its four numbers
  ride the `seat` spring by hand instead (`src/motion/spring-step.ts`) and the outline is drawn
  from them every frame, so it is a proper shape at every instant. Nothing is laid out and React
  does not render while it moves.
- **A mark whose goal moves** is the other. The tint of a `Sidebar` travels to an entry that is
  itself sliding, because the subpages of the entry it left fold away under it. A transition
  would be given a new goal on every frame and never arrive. The tint rides the `glide` spring
  by hand instead (`src/internal/travelling-mark.ts`) and heads for where its entry will come
  to rest, so it does not run past an entry that comes towards it. It writes four custom
  properties, never layout, and it stays inside its list while the list narrows to the rail.
- Four keyframe animations exist, for what runs without anyone's doing: the spinner, the
  indeterminate progress fill, the breathing of both under reduced motion, and the shimmer of a
  line of text that names work in progress. The shimmer is a paint, not a transform (the text is
  filled with a gradient that is pushed through it), so it is for one line, never for a block.
  A fifth runs once: the draw-in of a `Steps` (`steps.css`). Every step carries it whatever its
  state, so a step that is finished later is not drawn in again; its transitions do that. The
  draw-in of a chart is the sixth (`chart.css`): it only uncovers marks that already stand
  where they belong, so nothing jumps when it ends.
- **What joins a list later fades in; what is there on load does not.** A step that joins a
  `Trace` rises 4px into place on `settle`, and a mark that appears already done closes from the
  ring into the disc. The steps a list first shows stand still. A `Timeline` stands newest
  first, so an entry that joins it opens its room at the top and fades down into place; what
  stands below moves down with it. A list revealed from `display: none` stands still like one
  that loads (`LiveList`).
- **A grid closes up by gliding.** In a `FileGrid` and a `TableBody live` a tile or a row that
  joins fades in at its place on `settle` while what follows glides aside; one that is taken
  away fades on `leave`, and once it looks gone the rest glide into its place on `glide`,
  without bounce or scale. They move by a transform from where they were seen (`Glide`, read
  before React writes the change and played after it), so nothing is laid out while they move,
  and a glide that is still running is taken up from where it stands. What React only moves (a
  new sort) glides and does not fade in again. Under reduced motion they stand in their new
  places at once; the fades stay. The box's own height changes at once.
- **A figure rolls.** A `RollingNumber` moves each digit as a column of the ten digits, and every
  column rolls the way the number moves: 9 goes forward into 0 like an odometer, and a change
  that arrives mid-roll is a new goal for the same transition. The column's position is a
  registered number that only grows while the number grows (`--roll`, shown modulo ten), so no
  column ever rolls back through the digits to wrap. The window fades at its top and bottom
  edge in the empty room above and below the digits; a digit at rest is untouched (measured
  pixel-identical in three engines). A digit or a grouping dot that joins opens its place as it
  fades in, one that leaves fades and then closes: the one width that moves besides a chip's
  place, because the words beside the number have to be pushed, which a transform cannot do.
  A digit comes to rest on `settle`: one that bounced would show its neighbour for a moment.
  Page load shows the plain number.
- **A trend turns.** The arrow of a `StatChange` is one glyph turned per trend (up, flat, down)
  on `seat`; its colour eases on `settle`. Its amount rolls like the figure above it (a
  `RollingNumber` in percent), across zero too: the sign is a place of its own, so „+12 %“
  becoming „−3 %“ rolls instead of being swapped (Justin, 2026-11-20).
- **A notice for the page pushes it.** A `Banner` that arrives after load eases the page down
  through its own `Grow` and comes in 4px from the top edge; one that is there on load stands
  still. Closed, it leaves the way it came: it rises 4px into the top edge and fades on `settle`,
  the spring its room closes on. The one exit that travels, because the page travels with it: a
  faster fade left the room empty while the page was still rising into it (Justin, 2026-11-19).
- **What arrives pushes, it does not jump.** Where content below has to make room (a step that
  joins, an answer that arrives, the next tab's panel), the block around the change eases to its
  new height on `settle` (`Grow`), the one place besides an opening panel where height moves.
  It does not ease a height that a panel inside is already animating, a change of width, or
  anything under reduced motion.
- **A key makes room.** A key that joins a row beside a field (the Save key of a
  `StoredSecretField`) opens its place as a column from `0fr` on `glide`, so the field's edge
  glides aside, while the key fades in and seats from 0.96 on `seat`; leaving, it fades on
  `leave` and its place closes a moment later (`placeInRow`'s order). The place clips sideways
  only, with room at its end for the key's shadow and outline.
- **Words that are written arrive.** An answer being written fades in a few words at a time and
  never travels; a burst is pressed together, never queued. A conversation follows its foot
  while the reader is there, and leaves the reader alone once they have left it.
- **Code that changes shows the change.** In a `CodeBlockLive` the lines are matched to the ones
  before: a line that joins opens its row (`grid-template-rows` from `0fr`) and its text fades
  in, a line that goes fades on `leave` while its row closes, and what a change put into a line
  that stays (a value, a comma) arrives as new. A line that comes back mid-way turns round. A
  block that has just mounted, like the next tab's, does not animate its lines.

## Charts

A chart is read, so it is a panel: flat, no shadow or gloss on any mark. On an app's page it
stands on a `Card` under a `CardBar`, like a table, with the figure it explains above it (a
`Stat`). The rules, and why:

- **The data is the loudest ink.** Horizontal hairlines only (three to five, solid; a dashed line
  means "not final"), no vertical grid, no axis line but a zero below the axis. Lines are 2px
  with round joins; labels `text-xs`, muted, tabular digits; text never wears a series colour,
  the colour stands beside it as a short line or a swatch.
- **A place is a share.** The marks are drawn in a square of 1000 units that the SVG stretches
  over the plot (`preserveAspectRatio="none"`, strokes `non-scaling-stroke`, so a line stays 2px
  at any width; the monotone curve survives the stretch). Labels, dots, the crosshair and the
  readout are HTML in lanes: a layer the size of the plot moved by `translate` in percent of
  itself, anchored at its bottom right corner so it never adds to a page's scroll room
  (`internal/chart/lane.ts`). The server draws the final picture; nothing is measured on load,
  nothing jumps on resize or under `zoom`. The time axis drops its finer marks by its own width
  (container queries on each mark's level), the coarser ones stay in place.
- **Scrub, don't hunt.** The pointer anywhere in the plot's height finds the nearest moment; one
  readout on Ink lists every series there, the value first and the name after (a legend the
  other way round). It hops from point to point on the slider's chase; under a finger it is
  written on every move (`touch-action: pan-y`: a vertical swipe still scrolls the page). The
  keyboard walks the points with the arrows and each point is said; a hidden table carries
  every value, so the readout only adds.
- **Colour by job.** One series is the text colour (or Indigo with `tone="accent"`); several take
  the series colours in their fixed order and keep them when one is hidden; a period to compare
  with is the muted grey; status colours only where a series means good or bad. Six series at
  most: more is a table.
- **Motion is a state change.** New data re-forms the lines on `settle` (stepped by hand, as a
  path's `d` does not transition in Safari); bars are fills pushed by `translate`; rows that
  change rank glide (FLIP). A chart draws itself in once where it first shows.
- **The time is the calendar's.** Marks stand on whole hours, the 1st, 5th, 10th … of a month,
  quarters and years in local time, so summer time and short months do not shift them; where
  a mark turns into the next unit it names it (midnight its day, January its year).
- `BarList` ranks things by an amount along one baseline, one colour for every bar (their
  length says how much). Its rows are links where they lead somewhere.
- `BarChart` puts amounts by category in columns from one baseline, side by side or stacked as
  parts of a whole (a 2px gap of the ground between two parts, never an outline); a column is
  a fill pushed by `translate` and rises in on first show. The category under the pointer is a
  soft band; the readout of a stack adds the sum.
- `Sparkline` is the trend under a `Stat`'s figure or in a table cell: no axes, no readout, the
  latest value a dot. Plain markup; its wash is a mask, so it needs no id.
- `SegmentedBar` is one whole in parts, thin beside the figures that name them, tall where it
  stands alone with each share printed in its part where it fits (never cut). Each part is the
  whole bar cut down by `clip-path`, so a change moves the cuts and lays out nothing. Pointing
  at a part quiets the others. It replaces a donut: a length reads more exactly than an angle.
- `Tracker` is a strip of days, hours or runs, each a cell in its status colour, the status
  always in words in the readout and the list. Where the status changes on the way along the
  strip, its readout swaps the status as a `NavigationMenu`'s sheet swaps its content: the new
  one arrives from the side the reader goes to, a moment after the old one has begun to leave,
  and the sheet eases to its new size. `Heatmap` is a year of days in weeks, a one-hue ramp
  from the empty trough; on a phone it scrolls sideways from its newest week.
- `Funnel` is a flow and what it loses: a row per step with its count and the share kept from
  the step before; its bar is its share of the first step, and the faint bar behind it the
  step before, so the loss is the gap between the two.
- `Bullet` is goals and where they stand: a thin bar for the value, a tick across it for the
  goal, quiet bands behind for poor, fair and good, and the figures in words („38.400 € von
  50.000 € · 77 % vom Ziel“). Each row keeps its own scale; narrow, the figures go under the
  name. The scale runs 4px inside the track's round ends, so the value's cap sits in the
  track's end, centred on the same point; each band ends round, as the track does (Justin,
  2026-11-21).
- `Waterfall` is how a result is built from gains and losses: each step a column floating from
  the running sum, a total standing from zero, a hairline carrying the sum from the side of
  one to the side of the next. Under each column its name and its change with the sign; a name
  too long for its band is hyphenated by the language's rules. A floating column is cut down
  by `clip-path`. A column that stands on zero is square there; every other corner is round,
  except where a hairline meets it: there it is square, so columns and hairlines read as one
  staircase. The hairline lies on the side of the column it leads to, its edge on the sum, and
  where it passes the column it leaves on the far side, that column reaches its other edge, so
  it is flush with both (Justin, 2026-11-21).
- Where a chart reads separate things one after another (the columns of a `BarChart`, the
  steps of a `Waterfall`, a change of status along a `Tracker`), its readout swaps its content
  as the `Tracker`'s does; a line read point by point changes its words in place.
- `Dumbbell` is before and after per row: two dots on one shared axis joined by a line, the
  before in the muted grey, the after in the text colour, and the change written at the row's
  end with its sign („+8 %“), so its direction is never told by colour alone.

## Numbers and time

Every number and moment is written from one place (`src/lib/format.ts`), so a table cell, a
chart, a `RollingNumber` and a sentence say the same value the same way.

- **German by default**, in any part and helper that writes one: „1.234,50 €“, „38 %“,
  „12. Nov.“. `locale` changes it. Under a `LocaleProvider` the parts take its tag (`en-US` for English)
  where no `locale` is passed; the helpers themselves stay German unless told.
- **Never „-0“.** A value that rounds to zero has no minus (`signDisplay: "negative"`).
- **A percent is a share**: `formatPercent(0.38)` is „38 %“. A change carries its sign
  (`signDisplay: "exceptZero"`, „+12 %“), as a `StatChange` says it.
- **Money has cents** where one amount is read (a price, a row of an invoice); a dashboard's
  figures are whole euros (`maximumFractionDigits: 0`).
- **When something happened** is said as people say it (`RelativeTime`,
  `formatRelativeTime`): „gerade eben“, „vor 5 Minuten“, hours within the day, then the days
  of the calendar („gestern“ is yesterday, not 24 hours ago), and from a week on the date, as a
  `Timeline` writes it. It keeps up on one clock for the whole page and changes without motion.
- **A date written out** (`formatDate`) has its day, the short month and the year: „30. Nov.
  2026“, „Nov 30, 2026“ in English, „30. Nov. 2026, 14:05“ with `withTime`. A date without a
  time (`"2026-11-30"`) is a day of the calendar and stays that day in every time zone; a
  moment is written in the reader's zone unless `timeZone` names one, which a page rendered on
  a server does.
- **The server has no clock.** A page rendered ahead of time cannot read the time, and does
  not know the reader's day or zone. What depends on today (`RelativeTime`, the presets of a
  range, the ring of a `Calendar`) is worked out in the browser, unless the page passes the
  moment (`now`, `today`). Without it, the server writes the moment itself („21. Nov. 2026,
  14:05“) in Berlin time, the browser's first render says the same, and the words follow once
  it has started.

## Icons

`<Icon icon={…} />` is the only way icons enter. 14px in small controls, 16px in default ones,
18px in large ones; stroke 1.5px at every size; the text colour of their context. The few marks
that sit inside controls at 10 to 12px (tick, dash, chevron, close) are drawn in
`src/internal/glyphs.tsx`, because library icons blur at that size.

## What exists

Every component belongs to one of the four matters, and takes its treatment from it.

| Matter  | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Panel   | `Text`, `Heading`, `Link`, `Separator`, `Badge`, `Alert`, `Avatar`, `Icon`, `Spinner`, `Field`, `Fieldset`, `Form`, `Table`, `Ground`, `Wordmark`, `Logomark`, `Code`, `CodeBlock`, `CodeBlockLive`, `CodeTabs`, `Container`, `Section`, `SiteFooter`, `Prose`, `AnchorHeading`, `Callout`, `Quote`, `Breadcrumbs`, `SideNav`, `TableOfContents`, `Pager`, `ParameterList`, `ReferenceEntry`, `Figure`, `DocsLayout`, `ScrollFade`, `Shimmer`, `Trace`, `Grow`, `Sidebar`, `AppShell`, `PageHeader`, `Empty`, `Skeleton`, `Pagination`, `Stat`, `RollingNumber`, `RelativeTime`, `AvatarGroup`, `DescriptionList`, `DescriptionGrid`, `DetailPane`, `Banner`, `Timeline`, `Steps` (its marks are a checkbox's sockets and plugs), `Toolbar` (the tray its keys stand in), the rows of a `FileUpload`, `Message`, `Conversation`, `Sources` (its card is a sheet), an `Attachment` in a message, `FileGrid`, `FileKindSymbol`, `FileThumb` (its mark is a socket), `MiddleTruncate`, the charts `TimeSeriesChart`, `BarList`, `BarChart`, `Sparkline`, `SegmentedBar`, `Tracker`, `Heatmap`, `Funnel`, `Bullet`, `Waterfall` and `Dumbbell` (see Charts); `Accordion` and `Collapsible` are structure by line; `Seam` is the edge between two sections' plates, the one panel with a shadow |
| Fitting | `Button`, `ButtonGroup` (one fitting, several keys), `CopyPill` (its key and its marks), `CopyPage` (a `ButtonGroup` of two keys; its menu is a sheet), `SegmentedControl`, `ThemeSwitch`, `Tabs`, `Select` (its trigger), `Kbd`, `Shortcut` (its keys), `Chip` (a plug), `Toggle`, `ToggleGroup` (one fitting whose keys stay down), `CopyButton`, `RadioCard` and `CheckboxCard` (a bevelled card whose mark takes the press), a `Card` with `variant="bevel"` or `"gloss"`, the `ActionBar` (a fitting that floats, `depth-dock`), an `Attachment` in a prompt (a chip), a `FileTile` (a bevelled card), the thumbs of a `Switch` and a `Slider`, what is chosen in a `Calendar`, the block of a `Cta`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Socket  | `Input`, `InputGroup`, `SearchField`, `CopyField` (a socket that is pressed as a whole), `Textarea`, `NumberField`, `Combobox`, `DateField`, `DateRangeField`, `TimeField`, `OtpField`, `SecretField`, `StoredSecretField`, `PromptInput`, `Checkbox`, `CheckboxGroup`, `Radio`, `Switch`, the zone of a `FileUpload`; the troughs of `Slider`, `Progress` and `Meter`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Sheet   | `Menu`, `ContextMenu`, `Select` (its list), `Popover`, `HoverCard`, `Tooltip`, `Dialog`, `AlertDialog`, `Drawer`, `Toast`, `Command`, `NavigationMenu` (its panel), the consent banner, the bar of a `SiteHeader` (frosted, `depth-bar`); `Card` and `CtaMessage` are resting sheets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

- **Select** has a raised trigger, not a field: it is pressed, not typed into. In its list no
  column is kept on the left for a mark: an option's words start where its group's label does.
  The chosen option carries the disc at the right end, the rings left out to keep long lists
  calm; where the options have a detail at the right, the chosen one stands on the tint instead
  (see "Chosen rows" below; a `Combobox`, a `Menu` and the times of a `TimeField` do the same).
  Options may carry an `icon` and a `detail` (`items: [{ value, label, icon, detail }]`). The
  icon stands before the label; the detail is a quieter second fact at the right edge, with
  tabular digits (a price, a unit, a code). Both are muted, and both show in the trigger as well.
  Every option has an icon, or none does. When space runs out the label gives way, not the detail.
- **Chosen rows** of every list (a `Select`, a `Combobox`, a `Menu`, the times of a
  `TimeField`) follow one rule, by what stands at a row's right end. Nothing: the mark stands
  there, the disc for one choice, the tick for what is on or off. A detail (a price, a place):
  the chosen row stands on the tint instead, as the current page of a `Sidebar` does, because a
  mark after the detail would be a third column. The tint fades in and out on `settle` while
  the highlight under the pointer stays instant, and chosen rows that touch are one shape: only
  the block's outer corners are round, and a corner eases square or round as a neighbour is
  taken or given up. A row of a menu may carry a 16px symbol (`icon`) that darkens with it.
- **Textarea** keeps its resize grip clear of the rounded corner: its right and bottom padding
  are transparent borders, and browsers draw the grip (and the scrollbar) inside the border. In
  Chromium and Safari the grip itself is ours, two short strokes; elsewhere it is the browser's.
- **Tooltip and Toast** are the system's own voice and speak on Ink on every ground. In dark
  mode Ink speaks as the page does, so they are sheets of the page, set off by edge and shadow.
- **Dialogs** rise 8px into place and leave by fading. An `AlertDialog` has no close button and
  puts the focus on the answer that changes nothing.
- **Toasts** stack bottom right, newest in front. One enters from below, leaves by fading where it
  is, and one that was swiped away keeps going. Its key and its cross stand in the middle of its
  height; the tone's icon stays with the title.
- **Consent** is a card in the bottom right corner (spanning the width on a phone) that does not
  take the page away: no scrim, nothing inert, Escape and a click elsewhere are no answer. It is
  a sheet on the page's ground, white on a light page and dark on a dark one. „Alle ablehnen“
  and „Alle akzeptieren“ stand side by side as two identical raised white keys, the law's
  requirement and the look's; „Einstellungen“ is a quiet third key under them. The first layer
  states what the law asks for there as three short facts (Zwecke, Empfänger, Profile) between
  hairlines. The settings are the same card grown taller (`Grow`): the views swap in place, the
  arriving one slides in from its side after the leaving one has faded, and the row of answers
  never moves; the third key turns into „Auswahl speichern“ where it stands. Answering in the
  settings flips the switches one after another before the card leaves, so the reader sees what
  was stored. The way back is a link among the legal links of every footer.
- **Avatar** is a circle in the text colour: a person is not a part of the machine.
- **Fields with something beside the text** (`InputGroup`, `NumberField`, `Combobox`, the date
  and time fields) are one socket: the wrapper wears the field and the input inside goes bare.
  A press anywhere on it lands in the input.
- **Link** keeps link semantics and an underline; `quiet` takes the colour around it. A link is
  never drawn as a button: style an `<a>` with `buttonVariants()` for that.
- **Table** is a real table, hairlines between rows, no stripes. In an app it stands straight in
  a `Card` under a `CardBar` that names it (its heading, and „Alle Angebote“ at the end): the
  card's edge holds it, the column names stand on the well, the outer cells keep the card's
  20px, and the last row has no line under it. Elsewhere (a reference, the docs) a 2px rule
  opens it. Rows of data are set close: 15px text with 8px above and below, a row at least a
  large control high, what stands inline (a badge, avatars, a checkbox) centred on the text,
  figures in the text colour, rows selected one after another one wash. A state in a column is a
  `Badge` with a dot (`dot`): the neutral badge carries the word, the dot the hue, so a column of
  states is quieter than the names. Numbers stand right in tabular digits. It scrolls inside itself when it is too wide, and its
  edges fade where more columns wait while the rule above stays whole. A table of
  sentences (`content="text"`) starts every cell at the top of its row. On a phone a table of two
  or three columns of text can stack (`stack`): each row becomes a block under its first cell,
  every other cell named by its column, and the roles stay written out so it is still a table to
  assistive tech. Rows that come and go while it is read (a file browser's list) take
  `TableBody live`: they join and leave as the tiles of a `FileGrid` do.
- **Dates and times** are typed the German way and read when the field is left ("30.11.",
  "301126", "14.–30.11.", "9 Uhr", "930"); they show text and submit ISO values. Text that cannot
  be read stays to be corrected, and the field says why at once. `DateField` and
  `DateRangeField` open the `Calendar`; `time` adds a time of day, set under the calendar in a
  small `TimeField`. `TimeField` is typed or picked from the times of the day; `hourCycle={12}`
  writes them with AM and PM. On a dashboard a `DateRangeField` carries `presets`
  (`lastDays(7)`, 28, 90), worked out from today: a column of rows at the left of the calendar
  with the chosen-row disc, taken with one press, and the field names the range it is („Letzte
  28 Tage“) and reads the name back when it is typed. A range that runs through today opens
  the calendar on today's month. Under a `LocaleProvider` with `en` the two date fields are
  typed and written the American way, month first ("11/30/2026", "11/30", "11/14 to 11/30"),
  and `lastDays` is named "Last 28 days"; the clock stays the field's own.
- **Calendar**: today wears the ring, what is chosen is one raised Indigo shape. A range is
  filled through and joined where it runs on into the next week; two weeks that share no column
  stay two pieces. The days stand 2px apart and today's ring is drawn inside the day, so a ring
  never touches the selection beside it.
- **Slider** is a long switch: a raised thumb in a trough that fills up to it and ends in a round
  cap. It follows one finger at a time.
- **Progress** fills in Indigo and glides; **Meter** measures in the text colour.
- **Drawer** is a sheet from the bottom or a side that can be pushed back with a finger.
- **A website** is built from four panels. `Container` gives the page its width: 72rem of
  content, or 48rem for running text, with a gutter of 20px on a phone and 32px above it.
  `Section` gives a part of the page its air. What opens a page or a section has no part of its
  own, because every site opens differently: it is a `Heading` with a `Text` under it. The habit
  stays: nothing stands above the title, the one `display` title belongs to the page's opening,
  every section after it opens under the 2px rule (a `Separator`), and everything is set left.
  On a phone the two large sizes of a `Heading` step down one.
- **Seam** is where two sections of a website meet when they are plates rather than parts of one
  page (a landing page; a docs page keeps its rules). The sections alternate between the ground
  and the well. The plate above lies on the one below, with the edge and the short shadow of a
  raised part. Across the content column its edge dips down as a tongue or rises as a notch,
  chosen per seam. A section after a seam has no rule. Seams take no room: they are drawn into the
  sections' padding, and on a phone the shape shrinks to 70%.
- **SiteHeader** is a bar that floats over the page while it is read: a frosted face with a
  light edge and a short shadow (`depth-bar`), 8px off the window's top and sides and 48px tall
  (8px around a control), what stands in it on the content's edges. It holds the way home, a `NavigationMenu` and the next step. Below
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
  `100lvh − 100dvh`. No `viewport-fit=cover`, no `env()` insets for this. A card pinned to the
  window's foot is the same case from below: a fixed layer there, most of the window wide, brought
  the shrunk toolbar back in its colour (the consent card, white). Safari passes over what a fixed
  layer holds in absolute position, so the fixed part is an empty line of no height and the card
  stands on it (`consentAnchor`; confirmed on Justin's iPhone, 2026-11-18).
- **NavigationMenu** is a row of quiet entries: no face and no shadow, only the hover wash. An
  entry with pages behind it carries a chevron and opens a panel when it is pointed at or pressed.
  One sheet serves the whole row: it glides to the next entry and takes its size, and the content
  arrives from the side it was approached from. Each page in a panel is a title and one line that
  says what is there; with an `icon` its symbol stands before them in a small raised tile (36px,
  an 18px symbol, as in Clerk's menus), and without the line the tiles make a compact grid of
  places. The `CopyPage` menu's rows wear the same tile. The sheet's size is the one place where width and height are animated: it
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
  keys, the copy and a chevron, at the end of the row above the page's title. It lifts under the
  pointer as one part; a press moves only the pressed key, which takes the inner shade and goes
  down while the other keeps its gloss and its place. A copy is confirmed
  in the key as in a code block (the symbol shrinks away, the tick draws itself, `copy.css`). The
  chevron turns over while its menu is open; the menu's rows carry a tile with their symbol and
  a line on what they do: the copy again, and the Markdown to look at in a new tab. The Markdown
  is fetched when a pointer or the keyboard reaches the fitting, so the copy is immediate.
- **Code keys.** Beside its copy a block can carry two more keys, on request: `download` saves
  the code as a file under the block's title and confirms like the copy, with the drawn tick;
  `wrapToggle` lets the reader break long lines and put them back, and keeps its wash while
  they break. The copy stays last, where every block has it. Without a header the keys stand
  together in the corner.
- **ButtonGroup** holds actions that belong together as one fitting with several keys: an
  action and the menu of its other forms, a few steps on the same thing, a pair of arrows. The
  keys have no face of their own: the fitting's gloss shows through, a wash marks the key
  under the pointer, and a press moves only that key: it takes the inner shade and goes down to
  the press scale while the fitting stays still. What divides two keys is a seam, the fitting's
  own edge drawn once more. The
  first and last key take the fitting's corners; with the keyboard on it a key rounds all four,
  so its ring closes around that key alone. It comes in the neutral face, the committed key and
  the ask. A `Button` or a `SelectTrigger` inside becomes a key and takes the group's size.
- **Grow** is a block whose height follows what it holds: when a step joins, an answer arrives
  or a panel is swapped, it eases to the new height and what stands below moves with it. It
  goes around the part that changes, one per part and never one inside another; at rest it is
  a plain block that clips nothing.
- **HoverCard** shows what stands behind a link before it is followed: a sheet that grows out
  of the link and hangs from its start. It opens under a pointer that rests on the link, or
  with the keyboard on it, never on a touch screen, and assistive tech does not go through it:
  whatever it shows also stands where the link leads.
- **ScrollFade** is a box that scrolls inside itself and fades at the edge where more waits:
  an axis, the edges that may fade, the depth of the fade (40px). It is a mask, so it works on
  every ground; a face and a border belong on a box around it. What takes the keyboard focus
  inside is scrolled clear of the fade.
- **Shimmer** is a line of text that names work in progress. The text is muted and the light
  that passes through it is the ground's text colour, so it is a sign of life and not a glare;
  between two passes the line rests. Under reduced motion it breathes like the spinner.
- **Trace** is what an assistant is doing, step by step. It is read, so it is flat: lines with
  the system's mark in front and a hairline joining the marks. The ring waits, the spinner's
  arc works (it is the ring before it has closed), the disc is done; a step that failed
  carries the danger symbol and says so in words. With `marks="symbols"` a finished step
  carries the symbol of its kind in place of the disc (a search, a file, a mail), and it comes
  in softly where the arc was. The line being worked on shimmers, a second, quieter fact
  follows the title (how long, how many), and a step with more to say opens under its line.
  **TraceSummary** is one line for the whole of it ("Arbeitet", then "In 14 Sekunden
  erledigt"): open while the work goes on, closed once it is done, and from the moment the
  reader opens or closes it, as they left it.
- **ThemeSwitch** is the choice between the system's appearance, light and dark, in two forms:
  a `Select` that shows the chosen one by symbol and name (the default, for a bar or a footer),
  and three symbols in the trough of a round `SegmentedControl` with its travelling thumb
  (`variant="segmented"`; `withLabels` writes the names out for a settings page). It is the
  control only: `useTheme` keeps the choice (storage and a cookie) and turns the page, and
  `ThemeScript` in the `<head>` sets the mode before the first paint.
- **CodeTabs** is one block with several versions of the same code (bun, npm, pnpm). The tabs
  sit in its header with their marks, the highlight glides, and blocks with the same `group`
  keep the reader's choice in step and remember it.
- **CodeBlockLive** is the same block for code that is put together in the browser: a
  configuration built from the reader's choices. `CodeBlock` highlights where it renders, which
  in a client component would send the highlighter and its grammars along. Here the app hands
  over its lines as runs with one of the block's ten roles, and no highlighter is imported.
  When the reader's choice changes the code, a new line opens like a fold, a gone one closes,
  and a changed value fades in or, with `changeMotion="glow"`, lights up for a moment.
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
- **A docs set is written down once.** A product describes its pages as data (`DocsNav`: groups,
  pages, subpages), and `findDocsPage` works out where a page stands: its group, the trail above
  it, the pages before and after. The `SideNav`, the menu on a phone, the `Breadcrumbs` and the
  `Pager` are four views of that one description (`Patterns/Docs` shows the wiring). The parts
  that only draw links (`SideNav`, `Breadcrumbs`, `Pager`) are plain markup and send no script:
  they take a router's link through `render` without Base UI's hook (`internal/render-as.ts`).
  What does run in the browser on a docs page is what has to: the bar's menu, the section mark of
  the `TableOfContents` (one read per frame while the page scrolls), the fades, and the copies.
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
- **Sidebar** is the navigation of an app, beside its pages in an **AppShell**: the places one
  works in, in groups, each a row with a 16px symbol, its name, and a count or a shortcut at
  its end. It is read and leads somewhere, so it is flat. Collapsing takes away what stands to
  the right of the symbols, which do not move by a pixel; on the rail an entry names itself in
  a tooltip, the first after the wait and its neighbours at once. The shell keeps whether it is
  open, a `SidebarTrigger` or ⌘B changes it, and a product that keeps the state in a cookie has
  the server draw the right width, so nothing moves on load. Subpages fold under their page,
  a `SidebarMenu` opens more places beside the sidebar, and the workspace and the person above
  and below are rows that open a `Menu` (`SidebarButton`). On a narrow window the same content
  is a drawer from the left that can be swiped back.
- **PageHeader** opens a page of an app, under the `AppShellBar` that holds the way there: the
  title as the page's `<h1>` (24px; 36px on a page without the shell), one muted line 4px
  under it, and the page's actions at the right, standing on the line of the last words. A
  state may follow the title as a `Badge`; the line can carry an `AvatarGroup` before its
  words. Narrower than 36rem by its own width, beside an open sidebar as on a phone, the
  actions go under the words. Nothing stands above the title, and what filters the page stands
  under it. It is plain markup and sends no script. A website keeps opening with a `Heading`
  and a `Text`.
- **Command** is the palette that reaches every page and action from the keyboard (⌘K): a sheet
  in the upper third of the window with a bare field, the entries in sections with a symbol and
  a shortcut or a quiet detail, and a foot that names the keys. It matches by what a word is
  built from ("gart" finds „Gärtnerei“) and by keywords. An entry that ends in an ellipsis
  opens a second list in the same sheet: its name stands before the text as what was chosen,
  and Backspace in the empty field goes back. Nothing found is one sentence, without a button.
- **Shortcut** draws a shortcut in the keys of the reader's keyboard (⌘K on Apple devices,
  Strg K elsewhere) and reads the same on the server and in the browser until it has looked,
  so nothing jumps on load. `useShortcut` listens for one, and keeps out of the way while
  someone types in a field.
- **Chip** is something that was chosen and can be taken away again: an applied filter, a value
  in a field, a recipient. It is a plug, raised with an edge and without a shadow of its own;
  a state that is only read is a `Badge`. Its key is named after it ("Bezahlt entfernen") and
  has a finger's target. In a **ChipGroup** a chip that leaves fades while the row closes its
  place, one that joins opens its place first, and the keyboard focus goes to the chip beside
  the one that left.
- **Empty** stands where a list or a page has nothing in it yet: a symbol, the fact said to the
  reader, what will appear here, and the first step. A search that found nothing is one
  sentence that names what was looked for, without a button.
- **Skeleton** is the shape of content on its way: a line as tall as its text, a block with the
  corners of what it stands for, so nothing shifts when the content arrives. The shapes of a
  region share one light (`SkeletonGroup`). **Loaded** shows them only when the wait is longer
  than 200ms, keeps them for at least 350ms once shown, and fades the content in over them; an
  answer that is fast never flashes a skeleton.
- **Pagination** is the pages of a long list, as links. The row has the same number of places
  on every page, so the arrows stay under the pointer, and the tint glides from number to
  number. An arrow that leads nowhere keeps its place and the keyboard focus and says so. The
  line beside it ("21 bis 40 von 248 Angeboten") is the caller's.
- **ActionBar** is what can be done with the rows that are ticked in a list. It rises at the
  foot with the first row and leaves with the last, counts them with digits that roll, and
  never takes the focus as it appears. It is one stop for Tab, the arrows move inside it, and
  Escape or its cross takes the selection back and returns the focus to where it came from.
  Beside a sidebar it stands in the page's own column (`position="sticky"`). It is cut like a
  key that floats (`depth-dock`): a key's glossy face, edge, top light and lip, over a long, wide
  shadow, so it reads as a machined part above the list rather than a sheet.
- **Stat** is a figure: what it is (small, muted), the figure (24px, tabular digits, never
  broken over two lines) and how it changed. Several stand in a **StatGroup**: one row with
  hairlines only between the figures (the grid clips the ones before the first of each line),
  two by two on a phone. On an app's page the row stands in one `Card`, the figures sharing it;
  on the ground the 2px rule opens it. `cards` puts each figure on a card of its own. The change (`StatChange`) is an arrow, the amount in the colour of its
  tone and what it is compared with; whether up is good is the caller's `tone`, and assistive
  tech hears „Gestiegen“ or „Gesunken“ first. A `Meter` after the figure is usage against a
  limit.
- **AvatarGroup** is several people as one stack, the first in front. The gap between two is
  cut out of the one underneath (an SVG mask made for the avatar's own box), never a ring in
  the ground's colour, so the stack is right on any ground, a washed row or a picture; the cut
  is the circle in front grown by the gap, so what is seen of the one underneath is a clean
  crescent. The initials of an avatar that lies under another stand in the middle of what is
  seen of it. More people than fit are a „+3“ disc, quieter. One tooltip names each avatar and
  moves along the stack without waiting again; the group has one name for assistive tech with
  everyone in it. A presence dot (on an `Avatar` alone as well) stands on the edge at the bottom
  end and is cut out the same way: a disc for there, the ring alone for not there, and always
  said in words. It stands half outside its avatar, so the one underneath has its gap cut out
  as well.
- **DescriptionList** is the facts of one record: a real `<dl>`, the label muted in a column of
  its own, hairlines between rows, the 2px rule above (left out inside a `Card`). It goes to two
  columns by its own width, not the window's, so it stacks in a narrow card as on a phone.
  `ParameterList` stays the parameters of an API.
- **Banner** is a notice for the whole page (a trial that ends, a payment that failed,
  maintenance tonight); `Alert` stays the message inside a page's content. A strip in the
  status wash across the full width of the page or its main column, its title what is the case
  and its text what to do, with one action and a close key. The symbol, the first line, the
  action and the close key share one axis, the middle of the first line; narrower than 32rem the
  action goes under the sentence. However it closes, the focus that was in it goes to the page's
  `<main>`.
- **Timeline** is what happened lately on `Trace`'s rail and marks, newest first, grouped by
  day: a sentence and its `<time>`, led by what the entry is: the avatar of the person who
  acted, the symbol of a system event, the danger mark for a failure, or the plain mark. The
  lead is an avatar's width for every entry, so the rail runs straight through a list that
  mixes them. Its list is markup with one small client part that
  tells load from later (`LiveList`): a gate in CSS alone did not move in Chrome, which takes a
  transition's length from a property's value before animations.
- **A multi-select** is a `Combobox multiple` whose field is a `ComboboxChips`: every chosen
  option is a chip in the socket, flat like a `Badge` (a raised plug with
  `chipVariant="plug"`), with the input after the last one. Empty, the input asks only for the
  caret's room, so it takes a line of its own once what is typed no longer fits. Backspace in
  the empty input takes the last chip and Arrow left walks into them. A chip that joins seats into
  its place, one that leaves fades while its neighbours close up, and when the chips need
  another line the socket itself eases to its new height (`Grow`), so what stands below is
  pushed. The list stays open after a choice and the typed text goes, so several values are
  taken in a row. With `onCreate` a last row offers to make what was typed („Dringend“
  anlegen).
- **OtpField** is a one-time code: a slot per character, in threes, the way a code is read
  out, with a short line between the groups. The slots of a group share one socket divided by
  hairlines (`variant="separate"` gives each its own). The slot being typed wears the field's
  halo: one rounded piece that glides from slot to slot on `snap`, across the line between the
  groups, so it is there before the next digit is (separate sockets each open their own). A
  digit is drawn over its input, so it can seat into the slot, and is readable from
  its first frame. A pasted code, or one the phone offers from a message, fills every slot, the
  digits seating one after the other. A wrong code is said in words under the field; every
  socket takes the danger edge and only the slot being typed opens the halo. Nothing shakes. The
  slots keep their own size; with `fill` they share the width of their place, which is how
  the field stands in a dialog.
- **FileUpload** takes files and does not upload them: it sorts them by kind and size,
  reports them, and shows the progress it is given. Its zone is a socket, cut like a field;
  while a file hangs over it, it takes the halo, the sign that it will take what is let go.
  There is no dashed border. A real file input stands behind its button. Each file is a row:
  the system's mark in front as a `Trace` draws it (the ring waits, the arc works, the disc is
  done), the name, the size in tabular digits, and while it is on its way a thin bar under the
  name. A row without a bar is as tall as an arrived one, whatever its state. A failure says
  why in words, with the danger symbol and „Noch einmal versuchen“. Every change of a row's
  height is a fold of its own, so changes that come together add up instead of the list
  chasing its height: the bar opens when the upload begins and, once the file has arrived, is
  seen full for a moment and then folds; tried again, the reason fades and folds while the bar
  opens. What folds fades first and what opens is open before its words come in, so nothing
  is cut through while it can be read. A row that joins opens its place and fades in; one that
  is removed fades and its place folds shut, and it leaves as it last looked. The list stays in
  the upload while it is empty: it takes no room then and opens with its first file.
- **RadioCard** and **CheckboxCard** are a choice whose options need a sentence each: a plan,
  an answer in a set-up. The card is the control's label, so the whole of it is the target: a
  bevelled card (`depth-bevel`) that keeps its size and place. Its mark is the plain
  control's: the radio's socket that takes the disc, the checkbox's that takes the plug and
  tick. Under the pointer a soft light follows the pointer across its face; edge and shadow
  stay. Under a press it goes down on the page and its mark dips, as a plain `Radio` or
  `Checkbox` does. On release it comes back up
  while the accent edge of the choice eases in and the mark seats, so the three read as one
  move; the edge of the card that was given up fades faster. A sheet this
  wide is never scaled: at the press scale it moved by ten pixels. The title names the control
  and the sentence describes it.
- **Steps** is where one stands in a set-up of a few steps. Its marks are a checkbox's, with
  each step's number: an empty socket is ahead, the socket with the accent as its rim (one 2px
  outline, no larger than the socket) is where one stands, and a finished step is the accent
  plug with its tick. Each name stands centred under its mark. A line 2px high with round ends
  joins the marks, 8px clear of each; behind a finished step it is filled in the text colour,
  a bar pushed out of its trough by `translate`. Going on is one movement along the line: the
  plug seats and its tick draws, then the line draws on, and the next mark takes its rim as
  the line arrives; going back runs it the other way. Where the steps first show they draw
  themselves in: nothing at first, then step after step seats in with its name, its tick and
  the line on to the next. `marks="dots"` keeps the system's flat marks (ring, the heavier
  ring, disc) for a quieter place. In a row that is too narrow for every name only the current
  step is written out, centred under its own mark. A finished step may be a link back. It is
  plain markup and sends no script.
- **SecretField** is a value machines read and people must not read over a shoulder: an API
  key, a webhook's secret. It stands in a field in mono behind discs until the key with the
  eye is pressed; hidden, the value is not in the page, and a prefix may stay readable. The
  eye gives way to the struck eye as the copy symbol gives way to the tick, and the value
  settles out of a short blur, the one kind of place a blur is used (the fields of a secret).
  **StoredSecretField** is a secret the server keeps and never hands back (a webhook's signing
  secret, a mail server's password): a lock, the discs of a hidden value with its end kept
  („••••••••4f2a“, in mono; assistive tech hears „Gesetzt, endet auf 4f2a“), and „Ersetzen“.
  A press turns the same socket into an empty field with the focus, where
  a new one is typed behind discs the eye shows (drawn by the browser, so no password manager
  takes it for a password). It has no key of its own then: Escape, or leaving it empty, goes
  back. Nothing changes height. With `saveLabel` it saves itself: the Save key makes room
  beside the field once something is typed, spins while `saving`, draws the tick once `saved`,
  and leaves as the field turns back with its new ending. It is write-only: under its name a form gets the new secret while one is
  typed, and nothing at all otherwise, so the server keeps what it has. **CopyButton** is the copy
  confirmation as a key of its own: the symbol shrinks away, the tick draws itself, the
  tooltip says „Kopiert“, and when the browser refuses the clipboard, what was to be copied is
  selected instead.
- **ContextMenu** is the menu of the thing under the pointer, with the rows of a `Menu`. It
  opens where the pointer is and only fades in, fast: it opens often and under the hand, so it
  neither grows nor travels. The keyboard cannot open it and nobody can see that it is there,
  so everything in it also hangs from a key of the row ("Weitere Aktionen").
- **Toggle** is a key that stays down: raised, it rests in the pressed recipe without the
  press scale; quiet, it keeps the wash and its symbol stays dark. A **ToggleGroup** is one
  fitting like a `ButtonGroup`, and every key that is on keeps the inner shade of a press. It
  is for keys that are on each by itself (bold, italic) or for a choice that may be none; one
  choice out of a few views stays a `SegmentedControl`. A **Toolbar** is a flat tray of such
  keys: one stop for Tab, the arrows between its controls. A key in it that shows only a
  symbol says its name in a tooltip, with its shortcut after it („Fett ⌘ B“); once one has
  shown, its neighbours open at once.

- **Message** is one message of a conversation with an assistant. The answer is read, so it is
  prose on the page: no bubble, no avatar, about 42rem wide. The person's own words are set off
  at the right, as wide as they are, in the bubble of a `Quote` with its tight corner towards
  the person. Under a finished answer stand its keys, always and not only under the pointer:
  copy, the verdict (thumbs up and down, at most one on, drawn in the text colour without the
  grey square of a key that is down; the symbol of the one turned on nods into its key on
  `seat`, and one taken back tilts back and settles), „Noch einmal“ (its arrow turns a little
  under the pointer and once round when pressed, `iconMotion="turn"`). While the answer is
  written they wait unseen in their
  room and come in together once it is complete, so nothing moves. A failed answer says what
  happened and offers the next step as a key; nothing shakes and no colour flashes.
- **Text that arrives** fades in a few words at a time while it is written: what is new since
  the last render is cut into pieces of up to three words, a few pieces 40ms apart, a burst
  pressed into a quarter of a second instead of queuing, so a fast model never leaves the text
  behind. Nothing travels, since the words are being read; a word still being written is held
  back until it is whole, so no word fades in two halves. It works on the elements a Markdown
  renderer hands over (a component that renders the Markdown itself cannot be looked into); code
  and pictures arrive whole. What a message holds when it mounts is there at once, and once the
  answer is complete the pieces go. Under reduced motion it appears at once. The finished
  answer is said once to assistive tech, as a whole, never word by word.
- **Conversation** is the scroller of the messages. It opens at its foot without motion and,
  while the reader is there, follows the answer as it grows, on the `settle` spring stepped by
  hand (a goal that moves on every frame). The reader who scrolls up, presses a key that reads
  further up, or opens a fold inside an answer is left where they are, and the key „Neueste“
  rises in above the foot; it leads back (from far up it jumps closer first and glides the
  rest), and so does sending a prompt. Only the top fades while it follows, or the foot's fade
  would come and go with every piece of an answer. While it follows, the browser's scroll
  anchoring is off, or a line further up changing its size would move the view as if the
  reader had.
- **PromptInput** is the field a prompt is written in: one socket holding the files, the text
  and the keys, so its halo goes around all of it. The send key is the committed key; with
  nothing to send it lies flat and stands up with the first word. While an answer is written it
  is the stop key in the same place and size: the arrow shrinks away and the square seats, and
  the field stays open for the next prompt. Enter sends and Shift+Enter breaks the line; on a
  screen that is only touched Enter breaks the line and the key sends; a word being composed
  (Japanese, Chinese) is never sent, and Enter waits while an answer runs. The field grows with
  its text up to about ten lines and then scrolls with a fade at its top; its height follows on
  `settle` with the text held at its foot, so the line being typed is readable from its first
  frame and only the top edge moves. It is measured from a copy of the text, so it grows the
  same in every browser. Files come by the paper clip, a drop (the field wears the halo while
  one hangs over it) and a paste; Backspace in the empty field takes the last one away.
- **Attachment** is a file attached to a prompt or shown in a message. In a prompt it is a chip
  (a plug, or flat with `chipVariant="flat"`): the symbol of its kind (a sheet with what it
  holds, without the letters of a type, which ran together at 14px; a picture shows itself,
  small), the name, the size in tabular digits, the remove key. In a message it is a flat tile,
  read, and a picture is the picture itself with a hairline inside its edge. On its way it
  carries the system's arc where its symbol stands, and the symbol comes back where the arc
  was. A long name is cut in its middle as a file manager cuts it, exactly, with an ellipsis:
  „Angebot-Ko…bst.pdf“, the extension and the last three letters kept (`MiddleTruncate`). A
  failure is said in words, in a tile with the reason.
- **FileGrid** is the view of a folder in a file browser: tiles in as many columns as fit, in
  sections that each start on a row of their own (the folders, „Ordner“, then the files,
  „Dateien“) and share the grid's columns. It measures its columns and says how many. A
  **FileTile** is handled, so it stands on a bevelled card: a file's picture contained on the
  well inside it, never larger than its own size (a 32px favicon stays 32px), loaded when it
  comes near and faded in, or the symbol of its kind (`FileKindSymbol`, with the letters of its
  type from 16px on), under it the name cut in its middle and one line of facts („84 KB ·
  gestern“). A picture that may be see-through (PNG, WebP, SVG, GIF, AVIF, icon) lies on the
  quiet `checker`, behind the picture only and fading in with it, so a black logo shows in the
  dark and a white one in the light. A folder is a compact row in the files'
  columns, its symbol before its name. Chosen, a tile wears the accent edge and its mark, the
  checkbox's plug and tick at the top left over the picture (on a folder in its symbol's
  place), closes; the mark shows under the pointer and on every tile while any is chosen. On
  its way a file shows its own picture with a bar across its foot, seen full for a moment once
  it has arrived; a failure says why over the picture, with „Noch einmal versuchen“. Nothing
  changes a tile's size. A folder that would take what hangs over it wears the field's halo.
  For assistive tech the grid is a grid whose rows are the tiles. A tile's menu is a
  `ContextMenu` whose trigger renders the tile; while it is open the tile shows its mark, as
  under the pointer, and a row of a table stays washed.
- **Choosing several** (`useSelection`) works as a file manager does, for the tiles of a
  `FileGrid` and the rows of a `Table` alike. A click chooses one, Cmd or Ctrl and a click adds
  or takes away one, Shift and a click takes the range from the last one chosen, a press on a
  tile's mark adds or takes away that one, and a double click opens it. The box is one stop for
  Tab; the arrows move through it and what they land on is chosen, so an inspector follows. In
  a grid up and down go by the columns it really has, found from where the tiles stand, so they
  also cross from the folders into the files. Shift and an arrow takes the way along, Cmd or
  Ctrl and an arrow moves without choosing, Space adds or takes away, Cmd or Ctrl and A takes
  all, Enter opens, Escape lets go of all, and with nothing chosen leaves Escape to the page.
  Keys in a field inside an item stay the field's. What is chosen rises in an `ActionBar`.
- **FileDropArea** takes files where they are let go: a card of a file browser, dropped from the
  system or pasted while the focus is inside it. While files hang over it, it takes the field's
  halo on `snap` and a plate fades in in its middle that says where they will go („In
  building-gbar ablegen“); there is no dashed border and nothing shakes. A folder's tile or a
  link of the trail inside it is a target of its own (`useDropTarget`): over one it wins,
  wears the halo itself, and the plate names it. Items dragged inside it (`useItemDrag`) carry
  the chosen ids and show how many under the pointer („3 Dateien“); a folder does not take a
  drag of itself, and the area itself takes no items, as they would stay where they are.
  Dragging has no keyboard path, so a page offers the same through its keys. `FileUploadZone`
  counts its enters and leaves the same way (`useDragDepth`).
- **MediaPreview** shows what a file holds in an inspector: a picture contained on the well,
  fading in once loaded and reporting its own size (one that may be see-through lies on the
  quiet `checker`, behind the picture only, as on a file tile), a video or audio with the
  browser's own controls and only its length loaded, a PDF in the browser's viewer (its symbol
  and type behind the frame, which has no face, so a browser without a viewer shows them and no
  empty box; on a touch device a link that opens it in a new tab instead of a frame), and for
  anything else the kind's symbol, large, with its type. **EditableName** changes a name where
  it stands (a tile, a row, an inspector): a seamless field in the name's place, in the name's
  own type, with no edge or halo of its own (what holds it shows it is worked on: a chosen
  tile's ring), only the base name selected. Enter takes it, Escape keeps the old one, the focus
  leaving takes it too, and a refused name stays with its reason under it and a danger
  underline; nothing shakes. A value that may be missing (`allowEmpty`, a link's title) can be
  cleared, and its `placeholder` then stands in its place, muted, as the key that begins the
  change. A title that wraps (`multiline`) is the text itself made editable, so no word moves
  as changing begins; a line break cannot get into it.
- **DetailPane** opens beside content when something in it is chosen (a file, a row): its
  column widens on `settle` and pushes the content narrower, the pane sliding in with the edge
  and fading in; closing, it narrows on `leave` and fades, still showing what it showed. It
  clips only while it moves. The one place besides a fold where a layout size is animated, as
  the content has to be pushed; nothing is covered. On a narrow window the details are a
  `Drawer` instead. **DescriptionGrid** is the few facts of one thing in such a pane: label over
  value, two to a row, no lines.
- **SearchField** filters what stands below it as it is typed: the search symbol in front, at
  its end the keys that reach it while it is empty, then the key that clears it once something
  is typed. The two give way to each other where they stand, as a button's label and spinner
  do: the keys sink away (0.92, `snap`), the cross seats in (`settle`). What was found is counted
  before the cross, in the first frame. Escape clears, pressed again leaves the field; the keys
  do nothing while it has the focus, so a second ⌘F reaches the browser's find. **CopyField** is
  a value to hand on as it stands (an address, a line of Markdown): mono in a socket, cut in its
  middle so its end stays, the whole field the key (the pointing hand, not the copy cursor's
  plus); the copy confirms with the drawn tick. **FileThumb** is a row's small picture in a list
  of files, the image or its kind's symbol; pointed at, with the keyboard on its row, while the
  row is chosen and while anything in the list is chosen, it gives its place to the selection's
  mark, as a tile shows its own, and a press on the mark adds the row or takes it away. A
  picture in a format that may be see-through lies on the checker (finer here), and one that
  does not load gives way to the symbol. **FileThumbStack** is several chosen files as one small
  hand of pictures in the tile's cut, the first upright and the rest turned under it, with a
  number at its corner for what does not fit; a file that joins seats in (`seat`).
  **BreadcrumbEllipsis** folds the middle of a long trail into „…“, a key that opens a `Menu` of
  the folded places as links; a link of the trail that takes a drop wears the field's halo.
- **Loading files**: `FileTileSkeleton` is a tile's shapes without its face, from the measures
  the tile itself is built from (`file-tile-shape.ts`); `FileGridSkeleton` lays them in the
  grid's own columns and shows whole rows at any width (the rows that are not shown have no
  height, so no script counts columns). `FileThumbSkeleton` is a row's square, and
  `TableSkeleton` a table as a shape only: no region, no name, no stop for Tab, so a
  `SkeletonGroup` around it is the one thing that is announced. `SkeletonGroup as="span"` stands
  where a `div` may not, as in the line under a page's title.
- **IconTile** is a small flat plate for a symbol, the one `EmptyMedia` stands its symbol on:
  the mark of an integration in a list, a kind beside its name.
- **Sources** keeps an answer's numbered references and their list together, so every number
  leads somewhere. A reference is a small link in tabular digits after its sentence, leading to
  its entry in the list under the answer; one card serves every reference of the answer, opens
  on the first after a moment and moves to a neighbour at once, and shows the site, the title
  and a line or two of the text. The entry a reference led to stands on the tint. A number
  without its source is said in the console and stands without a link: a model may name a
  source it never gave, and the answer must stay readable.

Whole screens built from these are the `Patterns` stories (sign in, settings, quotes, specimen,
site, docs, app, dashboard, billing, team, onboarding, API keys, assistant): judge a change to a
recipe there, not on a single component.

## Slides

A slide is print, not interface. The parts in `@lanfermann/ui/slides` are the kit itself, not its
interactive layer: nothing on a slide is pressed, so nothing is raised, and the rules above about
depth and motion do not apply (a slide moves only as "Steps and motion" below says). What applies
instead is the kit's own rule book, ported from the **Lanfermann Freelance** artifact (the
inventory is in issue #85). Values live in `src/styles/slides.css`.

**The ten rules.**

1. No claim without its proof. Every figure, chart and finding carries its source line.
2. A title is a sentence. It names the result, ends in a full stop, starts top left and is broken
   by hand at a clause boundary.
3. The ground says who is speaking. Paper: evidence. Tint: someone else's words. Ink: the claim.
   Indigo: the ask, once, at the end.
4. One accent a slide. It marks the one datum the title is about, or the numbered markers. Never
   a word in a title, a label, a unit, a line or an icon. On Indigo the accent is white, so
   nothing is highlighted there.
5. Sofia Sans in four weights; JetBrains Mono only for literal code. Sentence case everywhere.
6. Seven sizes: 24, 32, 48, 72, 108, 162 and 243px. Nothing smaller and nothing in between. Text
   that does not fit is a second slide, never smaller type.
7. Rules instead of boxes. A 2px rule opens a block, 1px lines separate its rows. Only
   screenshots, photos and code stand in a frame. No cards, shadows, gradients or emoji.
8. Twelve columns of 80px with 64px gutters inside 128px margins. The title stands on the top
   margin, the evidence on the bottom margin, and the space between them stays empty.
9. Markers tie a screenshot to its findings. Page numbers and steps in time count. Nothing else
   is numbered.
10. German first: „deutsche Anführungszeichen“, a narrow space before a unit (`96 %`), `7,2` and
    `3.400`, dates as `11.11.2026`, and no dashes (a range is „11.11. bis 12.12.“, an aside takes
    a comma or a colon).

**Canvas.** 1920 by 1080px, always. A slide is drawn in px and scaled as a whole (`Stage`), so a
line breaks in the same place on a phone, a projector and in the PDF. Padding is `128 128 160`,
blocks are 32px apart (48 on the cover and the closing slide), flow content ends at y 920, and
the footer row (wordmark, deck title, page number) is pinned 64px above the foot. A span of `n`
columns is `n × 80 + (n − 1) × 64` px (`slide-span-<n>`): a title is ten columns wide (1376), a
paragraph of body copy six at most (800), a split is 4|8, 5|7, 6|6, 7|5 or 8|4.

**Three frames** cover every content slide. Stack: the title, a `Spacer`, wide evidence. Split:
the title, a `Spacer`, the evidence beside its reading. Statement: one sentence on Ink. Nothing
is centred but the numeral in a marker.

**Type.** `text-slide-meta` 24 (source lines, labels, the footer), `text-slide-body` 32 (and row
heads at 600), `text-slide-lead` 48, `text-slide-title` 72, `text-slide-statement` 108,
`text-slide-cover` 162, `text-slide-figure` 243, `text-slide-code` 24 in the mono face. Display
sizes are tracked negatively, text sizes not at all. 400 text, 500 display, 600 row heads and the
highlighted datum, 700 the wordmark and `<b>`. Italic appears in one place, a customer's
objection. A 72px title has two lines of about 40 characters, a 108px statement three of about
26, a 162px cover two of about 16.

**Grounds of their own.** A slide carries `data-slide-ground`, not `data-theme`. Dark mode turns
every `data-theme` into its dark counterpart, and a deck has to be the same picture on a dark
page as on a light one, on a projector and on paper. So `slides.css` holds the kit's ten colours
per ground once more, under an attribute no mode reaches (a test keeps them equal to the light
blocks of `grounds.css`). Ink on a slide is the kit's `#13121c`, not the dark page's `#1c1b26`.
A part that is always light, such as a screenshot's frame, sets the attribute on itself.

**No shadows, for a second reason.** The canonical output of a deck is a PDF, and Chromium's PDF
drops blurred shadows or draws them as bitmaps. Radii are 4px on media frames and code blocks,
2px on tags and placeholder blocks, 36px on the phone's frame (with its 12px bezel the one drawn
device), 50% on markers and discs, and 0 everywhere else. Indigo
prints mid grey: nothing depends on colour alone.

**Forms** are the kit's one ornament: large discs and rings cropped by the slide's edge, in nine
fixed compositions, tone on tone with one small disc in the accent. One composition a slide, of
the content slides about every third and only those with room, and never the same on two
neighbouring slides. No text may run under a form. No forms on a slide with a table, a chart, a
diagram, a screenshot, code or a list of more than four rows.

**A deck** runs: cover on Ink; an agenda only from fifteen slides; content on Paper, with Tint
for objections and quotes; one or two statements on Ink; the profile; the closing ask on Indigo,
not „Vielen Dank“; then the appendix behind a section slide „Anhang.“, with „Quellen.“ last.
There are no transitions between slides; a slide may build in steps (below).

**Steps and motion.** A slide is still a picture, and it reads as one in a print, a preview and
the check. Three things move, and only while a deck is presented live:

- _A step._ A slide may hold back what the presenter says in turn and show it click by click. A
  part that lists things takes a `step` on each item; anything else is wrapped in `Step`
  (`<Step at={1}>…</Step>`). What appears is there from the start and keeps its place, only
  unseen, so nothing reflows when it shows: it fades in and rises 16px. Three steps a slide at
  most, as a rule of thumb. The title and the evidence it names stand from the start; a step is
  for the second and third thought, never for suspense. How many steps a slide has is read from
  its parts without drawing it; a deck's own component that uses steps inside names them where
  it is used (`steps={2}`), which `Slide` and the slide kinds accept as well.
- _The entrance._ When a slide comes on, its blocks rise 24px and fade in, once, staggered by
  120ms three deep, and the circles of its forms grow from 60% one after the other. The footer
  row stands in the same place on every slide, so it does not move. A slide with
  `data-motion="none"` comes on standing still.
- _A connector._ In a diagram that builds up, a solid connector draws itself from its start to
  its end in 600ms once its box has begun to arrive, a checkpoint on it as the line passes, the
  arrowhead last. A dashed one fades in, since its dashes are the dash array.
- _A scene's camera_, on a scene slide only. `Scene` is one drawing (a world of boxes on a grid,
  in groups, joined by wires) that a slide looks at in beats: each beat names the view, what is
  lit, and one caption at the foot. The camera flies there in 900ms, eased in and out, zooming
  evenly in the logarithm so that a move in and a move out feel the same. Line weights, group
  labels and the text of a box keep their size on screen at every zoom; below three quarters of
  full size a box is a block without text. What a view does not hold whole is not drawn; what
  it holds but does not mean is dimmed. A beat can name a loop, which is marked by a dashed
  line that marches and a mark that walks from box to box. Two slides can look at the same
  world: the second names where the first ended (`from`) and the camera travels on, where a new
  drawing would arrive from nothing. The camera is flown by script, since CSS cannot ease a
  zoom in the logarithm; everything else is a transition. Under reduced motion it cuts.

Open, Justin's to judge: wires as the S-curve of the deck they come from or as the right
angles of `Diagram` (`route`, stories `Paper` and `Elbow`); lit boxes with an accent edge and
the rest dimmed, against the rule of one accent a slide; the loop's weight.

Everything else stands still. The motion keeps to one curve, the kit's
`cubic-bezier(0.16, 0.84, 0.2, 1)`, which leaves fast and settles long, and to `translate`,
`scale` and `opacity`. Its values are custom properties on the slide (`--slide-ease`,
`--slide-step-duration` 500ms, `--slide-enter-duration` 700ms, `--slide-forms-duration` 900ms,
and their staggers), so a deck can tune them in one place. All of it sits behind
`data-slides-live`, which only the player sets, on a box around the slide it presents: a
preview, a tile of the grid, the presenter's next slide, a print, the check and a capture show
the end state. Under reduced motion nothing travels or grows: a step and an entrance only fade.
In print every step is shown and nothing moves. The numbers are taken from a deck that was
animated by hand, and are yet to be judged on a projector.

**Names.** The slide parts keep the kit's names (`Title`, `Table`, `Steps`, `Figure`, …), although
the library's main entry has parts of the same name. They are different things for a different
medium, a deck imports from `@lanfermann/ui/slides` only, and the names are the ones decks are
already written in.

**The player** (`@lanfermann/ui/slides/player`) is the one interactive corner of the slide kit,
and it is interface, not slide: its controls use the library's tokens and its UI type scale, not
the slide sizes. It stays flat all the same (no depth, no shadow, no transition), because it
stands beside slides and must not look more important than they do. Both the audience's bar and
the presenter's console are on Ink, whatever the page's ground: a console is read in a dark room
beside a bright slide. The console is built like a slide: a 2px rule opens each block (the
current slide, the next one, the notes, the two clocks), a 1px line parts the buttons from them,
and the one accent marks what is on (the black screen, the current tile of the grid). Slides
shown in it stand in a 1px frame, as a screenshot does, so an Ink slide has an edge on the Ink
console. The current slide is as large as the window allows in both directions and is never
letterboxed, so its edges stand on its block's rule. The audience's bar sits at the top right,
away from the footer row, and leaves after 2.5 seconds without input. Slides change at once,
without a transition between them: the old slide is gone in one frame, and only the new one's
own blocks rise in ("Steps and motion"). The player's own words are in
`src/slides/player/labels.ts`; like every interface string, their wording is Justin's to decide.

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
- Dark mode exists; the kit has four grounds and no mode.

These are not yet written back into the kit (`lanfermann-design`, the artifact). None of them
reaches a slide: the parts in `@lanfermann/ui/slides` follow the kit (see "Slides").

## How decisions get made here

Look-and-feel questions are settled by looking: build the options as switches, show them side by
side at real size, and let Justin pick. Options must differ visibly at 1x, and every board is
checked at a normal window width before it is shown.
