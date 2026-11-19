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
- **Cards** are softly raised white sheets with a tinted footer strip.
- **Tabs** are a row of labels with a dot each. A soft grey highlight glides to the current tab
  and its dot closes from ring to filled Indigo disc. A row wider than its place stays one row:
  it scrolls sideways and fades at the side that has more. `TabsPanels` stacks the panels in one
  place, as tall as the tallest, so switching never moves what stands below.
- **Segmented control**: a grey trough with one raised white thumb that glides.

Every recipe lives in `src/styles/depth.css`, per ground. The board to judge a change on is the
story `Patterns/Specimen`.

## Decisions

| Topic                     | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | By, when                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| Direction                 | Fase                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-14                  |
| Corners                   | Controls 8px (small 6, large 10), checkbox 5, sheets and cards 12, dialogs 16. Inner corner = outer − padding. 4px reads as square and is not used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-14                  |
| Checked and "on"          | Indigo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-14                  |
| Field edge                | Hairline with an Indigo focus halo. Faint for low vision; a stronger edge is one recipe change in `depth.css` if that becomes a problem.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | default, accepted                   |
| Press                     | Scale to 0.98 with the shadow collapsing. No keycap lip.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | default, accepted                   |
| Control size              | **Compact is the default** (32px controls, 15px labels). Size stays a setting: `data-density="comfortable"` on any element gives 36px controls with 16px labels.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-14                  |
| Icons                     | Hugeicons free set (`@hugeicons/react` + `@hugeicons/core-free-icons`), stroke pinned to 1.5px at every size, `currentColor`. No comparison with Phosphor.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-13                  |
| Status colours            | Full set: danger, warning, success, info, each as text colour, soft wash and solid fill. Always with words and an icon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-13                  |
| Animation                 | CSS transitions with spring easings for almost everything; Motion (`motion/react`) only for gestures and content swaps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Claude, 2026-11-13                  |
| Feel                      | "Industrial" means crisp edges and bevels on rounded forms, not square corners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-13                  |
| Date picking              | Our calendar everywhere, on a phone too. The browser's date input was built beside it and dropped: it looks different in every browser.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-14                  |
| Selection                 | What is chosen in a calendar is one raised shape, filled through and joined over weeks, and it glides to a new selection on the `seat` spring instead of jumping. Confirmed in its last form after the glitches of the first morph were gone.                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-14                  |
| Times                     | A time is typed or picked from a list a quarter of an hour apart, which typing narrows; the time the field holds carries the disc. With a date, the times stand under the calendar as small time fields ("Von … bis …") and the sheet stays open until "Fertig". 24 hours by default, 12 with AM and PM on request.                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-14                  |
| Touch                     | Controls keep their size and look under a finger. Whatever is smaller than 44px gets an invisible target of that size.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-14                  |
| Number steppers           | One on each side of the value (− 3 +), the value centred between them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-14                  |
| Meter fill                | The text colour: a measurement is not a choice. `tone="accent"` makes it Indigo where a view is about that one meter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-14                  |
| Dragged parts             | A slider's thumb has inertia: it stretches along its way and swings back when it stops, and the fill's cap deforms with it. A progress bar does not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-14                  |
| Segmented thumb           | It has weight in both shapes, the square control included (`inertia`, on by default): it reaches for the pointer, its tail comes after it on a trip, it squashes as it lands, and it can be pulled to another segment.                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-15                  |
| Round segmented           | A pill with a mark before each label (`shape="round"`). Its thumb wears the raised Fase, not Clerk's soft cushion, and lies flush in the trough: a pixel inside, so the two outlines are one line. It travels on `settle`; next to `glide` the difference was too small to see.                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-15                  |
| Site chrome               | A navigation menu with panels instead of tab-like links with marks, and a quiet footer in columns instead of one on Indigo: he called the first versions ugly. The ask on Indigo is a block of its own above the footer.                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-15                  |
| Code face                 | Blatt: a white sheet with a hairline and no shadow, its header on the well. On Ink it is the black slab, on an Indigo page a deeper Indigo. Chosen over a recessed well (Mulde) and Ink on every ground.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-15                  |
| Code colours              | Farbig: keywords Indigo, strings green, numbers amber, functions and attributes blue, types teal, tags rose, comments muted. Each hue holds 4.5:1 on every face and on the marked and changed lines. Chosen over Ruhig (one warm hue).                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-15                  |
| Copying code              | The copy symbol gives way to a drawn tick, and the tooltip says „Kopiert". No word appears beside the button. When the browser refuses the clipboard, the code is selected instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-15                  |
| Closing ask               | `Cta` is the joint (Fuge): a block in a button's recipe with its lower right corner cut away, and the actions seated in the cut on the page's ground. One or two actions, the second quieter; only the buttons are links, never the block. Its tone is the ask (default), the key or the raised face. `CtaMessage` (Brief) is the other form, a letter already begun. The sentence (Satz) and the key (Taste) were dropped for now.                                                                                                                                                                                                                                      | Justin, 2026-11-15                  |
| Callout                   | Kante: flat on the page, a 2px edge in its tone on the left, its kind in words and an icon on the first line. Chosen over a washed box like `Alert` (Fläche) and a rule on top (Kopf).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-15                  |
| Section links             | A link symbol after the heading's last word, shown while the heading is pointed at or the link has the keyboard. Chosen over a `#` in the margin and the whole heading as the link.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-15                  |
| Current page              | In a `SideNav` the page the reader is on stands on the tint, like an entry of the `NavigationMenu`. Chosen over the mark closed to a disc before it and a 2px Ink rail.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-15                  |
| Current subpage           | In a `SideNav` the subpage being read takes the hairline in the text colour, as the `TableOfContents` marks its section; its parent stays open without the tint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Justin, 2026-11-16                  |
| Contents mark             | A hairline runs along a `TableOfContents`; a 2px piece of it in the text colour stands by the section being read and glides to the next. Chosen over a gliding Indigo disc and weight alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-15                  |
| Site bar                  | `SiteHeader` floats at every width, like Clerk's: a frosted face (the ground at 85% with a blur) with a light edge and a short shadow, 8px off the window's top and sides, what stands in it on the content's edges. Clerk's graded blur up to the window's edge was tried and dropped: Safari sampled it and painted the status bar white. It replaces the flat panel, because Safari 26 tints its status bar from a bar that touches the top edge.                                                                                                                                                                                                                     | Justin, 2026-11-16                  |
| Phone menu                | Over the whole window on the page's ground, square to it: the bar's top row with the close button where the menu button was, the places in groups (a few large ones, a longer list in two columns of small ones), the next step at its foot. It replaces the sheet from the right, whose rounded corners and short height looked odd against Safari's bars.                                                                                                                                                                                                                                                                                                              | Justin, 2026-11-16                  |
| Ask on a phone            | Below 42rem a `Cta` has no cut: its actions stand inside the block at its foot, one over the other at its full width. The cut left a stub of the block beside the buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-16                  |
| Long tab rows             | A row of tabs stays one row: it scrolls sideways, its edges fade where more tabs wait, and the current tab is brought into view. Chosen over a second line and over a segmented control on a phone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                  |
| Phone spacing             | Two sections stand 96px apart on a phone (`py-12`), 192px from `sm` up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-16                  |
| Section seams             | Zunge: a website's sections lie on each other as plates, every other one on the well (`bg-well`). Between two stands a `Seam`. The plate above has a hairline edge, a shade inside it and a short soft shadow (`depth-seam`). Across the content column its edge dips down as a tongue or rises as a notch, set per seam by hand. It replaces the 2px rule that opened each section. The closing `Cta` gets none. Chosen over the edge alone (Fuge), a 3px thickness under the edge (Kante), a tongue 430px wide, all seams the same way, and plain alternation. A light line on the lower plate (Stufe) did not show on Paper.                                          | Justin, 2026-11-16                  |
| Rule ends                 | Every 2px rule (`Table`, `Accordion`, `ParameterList`, `Separator` `rule`) is a straight line with round ends, drawn into the place of a top border (`internal/rule.ts`). It replaces the square ends, and the table's rule that its scrolling box bent down at the corners.                                                                                                                                                                                                                                                                                                                                                                                             | Justin, 2026-11-16                  |
| Edge fades                | What scrolls inside itself fades at the edge where more waits, never cut hard: code, a row of tabs, a wide table (sideways) and the side columns of a docs page (at their foot, and at the top once scrolled). The fade is 40px and moves on `settle`. A table's rule stays whole above its fading columns. It is one part now: `ScrollFade`.                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-16                  |
| Copy page                 | A docs page is handed on as Markdown by a `CopyPage` at the end of the row above its title: one raised fitting with the copy and a chevron. It rocks on the pressed key, confirms a copy with the drawn tick, and its menu repeats the copy with a line ("Als Markdown, für eine KI") and opens the Markdown in a new tab. The line names KI (AI), not a language model.                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-16                  |
| Page openings             | No part of its own. `PageHeader` fixed one way to open a page, and pages open differently from site to site: it is a `Heading` with a `Text` under it. The two large sizes of a `Heading` step down one on a phone.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                  |
| Bar height                | The `SiteHeader`'s bar is 48px: 8px around a control, as it keeps 8px from the window. It was 56, which he found too tall; he chose 48 over 52.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-16                  |
| Site pattern              | `Patterns/Site` is a test page for the site parts together, not a template: every site is laid out for itself. Its phone story went.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-16                  |
| Places by share           | A slider's parts ride in lanes moved by a share of their own width, not by a length worked out from the control's width. A percentage stays one in the computed style, so nothing travels on load or when the slider is resized. As lengths (`100cqw`), Firefox corrected them after its first style pass and the thumb of a full slider glided in from a window's width away.                                                                                                                                                                                                                                                                                           | Justin's Firefox, 2026-11-16        |
| One fade                  | The fade of a scrolling box is one mechanism, `ScrollFade` (and `useScrollEdges` for a box that belongs to another part): a table, the docs columns, code and tabs all use it. He asked for it as a part of its own.                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-16                  |
| Actions together          | `ButtonGroup` is one fitting with several keys, the recipe `CopyPage` had for itself: one face, one edge, one shadow, a seam in the edge's colour, and it rocks on the pressed key. Not for choosing a state (`SegmentedControl`).                                                                                                                                                                                                                                                                                                                                                                                                                                       | Claude, 2026-11-16; to be looked at |
| Work in progress          | A line that names work shimmers (`Shimmer`): muted text, a light in the text colour passing through and resting: 2.4s for a pass and its rest, 3em to either side, which he chose from three speeds and three widths. The steps of an assistant are a `Trace`: ring waits, arc works, disc is done, a hairline joins the marks, and a `TraceSummary` stands for the whole. Both marks stay: dots by default, and `marks="symbols"`, where a finished step carries the symbol of its kind; the rail is in both.                                                                                                                                                           | Justin, 2026-11-16                  |
| Theme switch              | `ThemeSwitch` is the control only, in two forms. He thought of it as a select: that is the default, the choice by symbol and name in one button's room. `variant="segmented"` is three symbols in a round trough, without the round shape's marks: the symbol is the mark, and stands in a circle. It holds the choice and reports it; it is not wired to the page.                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-16                  |
| Changing code             | A line that joins a `CodeBlockLive` opens like a fold ("Aufklappen"): its row opens on `settle` and pushes the lines below down while its text fades in and drops 4px into place. Chosen over a flap that swings down from its top edge and a drawer it slides out of. A changed value keeps both styles: it fades in (the default), or with `changeMotion="glow"` also lights up in the accent for a moment.                                                                                                                                                                                                                                                            | Justin, 2026-11-18                  |
| Consent look              | A sheet on the page's ground (light or dark with the page), not Ink. Both answers as raised white keys. In the bottom right corner on a wide window. The first layer's legal facts as three short lines, not prose; they cannot be folded away while „Alle akzeptieren“ stands on that layer (DSK, OH Digitale Dienste, Rn. 53 and 119). Chosen from a board of sheet and Ink, white and dark keys, bottom left and bottom centre.                                                                                                                                                                                                                                       | Justin, 2026-11-18                  |
| Consent words             | The draft stands: „Cookies auf dieser Website.“, the intro, the facts, „Die Einwilligung ist freiwillig …“, „Alle ablehnen“, „Alle akzeptieren“, „Einstellungen“, „Auswahl speichern“. Addressed to nobody, as the voice guide asks of a cookie notice.                                                                                                                                                                                                                                                                                                                                                                                                                  | Justin, 2026-11-18                  |
| Consent motion            | The card rising in, growing into the settings and back, the third key's words turning over, and the switches flipping before it leaves: confirmed as built, on his iPhone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-18                  |
| Embed mark                | A placeholder says what waits there with a mark above its title: a play mark for a video, a location pin for a map, drawn flat in a hairline ring, since it is no key („Inhalt laden“ is).                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-18                  |
| Consent way back          | A „Cookie-Einstellungen“ link among the legal links of every footer; no floating button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-18                  |
| App frame                 | An app's frame is a `Sidebar` beside its pages, inside an `AppShell`. The sidebar is a panel: flat, on the page's ground behind a hairline; `bg-well` as its class makes it a plate of its own, and both are in use. Collapsed it keeps its symbols as a rail (the default) or leaves entirely (`collapse="hidden"`); both stay. On a narrow window it is a drawer from the left.                                                                                                                                                                                                                                                                                        | Justin, 2026-11-18                  |
| Sidebar tint              | The page one is on stands on the tint, and the tint glides to the next page instead of changing place at once. On a subpage it goes down to the subpage and the page above stays in the text colour; on the rail, where subpages are folded away, the page above wears it. Chosen over the tint staying on the page above with the hairline marking the subpage, as a `SideNav` does: a hairline under an untinted page did not read as selected.                                                                                                                                                                                                                        | Justin, 2026-11-18                  |
| Subpages                  | The subpages of a sidebar entry fold open and shut under it and push what stands below. They never appear or vanish in one frame: that made the tint snap. Each may carry a 14px symbol. Places that are needed now and then wait in a menu beside the sidebar (`SidebarMenu`).                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-18                  |
| Symbols under the pointer | A symbol in a sidebar row only darkens under the pointer, and dips under a press. It does not grow: sizing every symbol up so that something happens was rejected. A motion of its own (`iconMotion`) is for a symbol that has one in it: a gear turns, a sheet is picked up by its corner.                                                                                                                                                                                                                                                                                                                                                                              | Justin, 2026-11-18                  |
| Command palette           | `Command` opens on `snap`, grown by a fiftieth and without travel; its sheet follows the height of its results; the page behind is dimmed as behind a dialog. Chosen over opening at once, one fixed height and a light scrim.                                                                                                                                                                                                                                                                                                                                                                                                                                           | Justin, 2026-11-18                  |
| App strings               | The German defaults of the app frame stand as built: „Seitenleiste“ for the sidebar's button, „Befehle“ for the palette, its key hints „Auswählen“, „Bewegen“, „Zurück“ and „Schließen“, and the key names of a `Shortcut` (Strg, Esc, Leertaste, Entf).                                                                                                                                                                                                                                                                                                                                                                                                                 | Justin, 2026-11-18                  |
| Chips                     | A `Chip` is a small raised plug by default and flat like a `Badge` with `variant="flat"`; both stay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-18                  |
| Loading                   | The shapes of a region that is loading (`Skeleton`) breathe together by default. A passing light and standing still stay as variants (`light`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Justin, 2026-11-18                  |
| Empty lists               | The symbol of an `Empty` stands in a small tile by default and bare with `variant="bare"`; both stay.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-18                  |
| Pages of a list           | `Pagination` is numbered by default, the current page on a tint that glides to the next. The compact form („Seite 3 von 12“ and two keys) stays as the variant for a narrow place.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Justin, 2026-11-18                  |
| Selection bar             | An `ActionBar` is a dark sheet by default, on Ink like a toast, and a light one with `ground="paper"`: "it should have both dark and light mode available". Dark on a dark page it was set off by its edge alone.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-18                  |
| List strings              | The German defaults of the list parts stand as built: „ausgewählt“ and „Auswahl aufheben“ in an `ActionBar`, „Seiten“, „Seite 3“, „Seite 3 von 12“, „Vorherige Seite“ and „Nächste Seite“ in a `Pagination`, „Entfernen“ for a chip's key.                                                                                                                                                                                                                                                                                                                                                                                                                               | Justin, 2026-11-18                  |
| Avatars                   | Round: "I would like avatars to be round". Before, a rounded square. In a stack the cut follows the circle in front, and a presence dot on the edge has its gap cut out of the avatar behind as well.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Justin, 2026-11-19                  |
| Figures in a row          | Both stay: "both are important". A `StatGroup` is a row with hairlines between the figures; on an app's page it stands in one `Card` (see Cards on an app's page), on the ground under the 2px rule. `variant="cards"` puts each figure on a card of its own.                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-19                  |
| A banner leaving          | A closed `Banner` leaves the way it came in: it rises into the top edge and fades on the spring its room closes on. Before, it faded faster than its room closed, and the page rose into an empty gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Justin, 2026-11-19                  |
| Rolling figures           | A `RollingNumber` comes to rest on `settle`, without bounce, over `seat`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Justin, 2026-11-19                  |
| Avatar stack              | One avatar lies a quarter over the next (6, 7, 9 and 12px from small to extra large), over a third; the cut between two and around a presence dot is 2px, over 3px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Justin, 2026-11-19                  |
| Banner place              | A `Banner` is a wash across the full width of the page or its main column, under its top edge, with a faint line at its foot. The strip set into the column with rounded corners was dropped.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Justin, 2026-11-19                  |
| Timeline lead             | Each entry is led by what it is: a person's avatar, the symbol of a system event, the danger mark for a failure, or the plain mark, all in one list ("by kind but also just allowing the normal dots as a kind").                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Justin, 2026-11-19                  |
| Dashboard strings         | The German defaults stand as built: „Hinweis schließen“, the banner's „Hinweis“, „Erledigt“, „Warnung“ and „Fehler“, the presence words „Online“, „Abwesend“ and „Offline“, and a trend's „Gestiegen“, „Gesunken“ and „Unverändert“.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Justin, 2026-11-19                  |
| Tables in an app          | Karte: on an app's page every block stands on a raised `Card`, named by a `CardBar` (its heading and a way to all of it); a `Table` runs to the card's edges on the close rhythm of the first round's Straff, its column names on the well, no 2px rule, its states `Badge`s with a dot. The first round's list was "too spacey" and "feels off"; of the second, Straff under its rule was "best but ... i dont like the overall layout and feeling. Also with the black bar at the top." Chosen over Offen (on the ground, the heading opens the table) and Leiste (the column names in a rounded band). The pages of a site and the docs keep the ground and the rule. | Justin, 2026-11-19                  |
| Cards on an app's page    | Gebündelt: in an app's main area a card keeps its edge and its close shade but not the wide soft shadow (`depth-card` under `app-shell-main`), and the figures of a dashboard share one card with hairlines between them: three cards on the dashboard instead of six. Six lifted cards were "super cardy ... super airy ... soft shadows". A card standing alone (a sign-in form, the site, a plan to choose) keeps its lift. Chosen over the soft cards, the crisp edge alone with a card per figure, and only the list on a card.                                                                                                                                     | Justin, 2026-11-19                  |

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
- **What joins a list later fades in; what is there on load does not.** A step that joins a
  `Trace` rises 4px into place on `settle`, and a mark that appears already done closes from the
  ring into the disc. The steps a list first shows stand still. A `Timeline` stands newest
  first, so an entry that joins it opens its room at the top and fades down into place; what
  stands below moves down with it. A list revealed from `display: none` stands still like one
  that loads (`LiveList`).
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
  on `seat`; its colour eases on `settle`.
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
- **Code that changes shows the change.** In a `CodeBlockLive` the lines are matched to the ones
  before: a line that joins opens its row (`grid-template-rows` from `0fr`) and its text fades
  in, a line that goes fades on `leave` while its row closes, and what a change put into a line
  that stays (a value, a comma) arrives as new. A line that comes back mid-way turns round. A
  block that has just mounted, like the next tab's, does not animate its lines.

## Icons

`<Icon icon={…} />` is the only way icons enter. 14px in small controls, 16px in default ones,
18px in large ones; stroke 1.5px at every size; the text colour of their context. The few marks
that sit inside controls at 10 to 12px (tick, dash, chevron, close) are drawn in
`src/internal/glyphs.tsx`, because library icons blur at that size.

## What exists

Every component belongs to one of the four matters, and takes its treatment from it.

| Matter  | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel   | `Text`, `Heading`, `Link`, `Separator`, `Badge`, `Alert`, `Avatar`, `Icon`, `Spinner`, `Field`, `Fieldset`, `Form`, `Table`, `Ground`, `Wordmark`, `Logomark`, `Code`, `CodeBlock`, `CodeBlockLive`, `CodeTabs`, `Container`, `Section`, `SiteFooter`, `Prose`, `AnchorHeading`, `Callout`, `Quote`, `Breadcrumbs`, `SideNav`, `TableOfContents`, `Pager`, `ParameterList`, `ReferenceEntry`, `Figure`, `DocsLayout`, `ScrollFade`, `Shimmer`, `Trace`, `Grow`, `Sidebar`, `AppShell`, `Empty`, `Skeleton`, `Pagination`, `Stat`, `RollingNumber`, `AvatarGroup`, `DescriptionList`, `Banner`, `Timeline`; `Accordion` and `Collapsible` are structure by line; `Seam` is the edge between two sections' plates, the one panel with a shadow |
| Fitting | `Button`, `ButtonGroup` (one fitting, several keys), `CopyPill` (its key and its marks), `CopyPage` (a `ButtonGroup` of two keys; its menu is a sheet), `SegmentedControl`, `ThemeSwitch`, `Tabs`, `Select` (its trigger), `Kbd`, `Shortcut` (its keys), `Chip` (a plug), the thumbs of a `Switch` and a `Slider`, what is chosen in a `Calendar`, the block of a `Cta`                                                                                                                                                                                                                                                                                                                                                                      |
| Socket  | `Input`, `InputGroup`, `Textarea`, `NumberField`, `Combobox`, `DateField`, `DateRangeField`, `TimeField`, `Checkbox`, `CheckboxGroup`, `Radio`, `Switch`; the troughs of `Slider`, `Progress` and `Meter`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Sheet   | `Menu`, `Select` (its list), `Popover`, `HoverCard`, `Tooltip`, `Dialog`, `AlertDialog`, `Drawer`, `Toast`, `Command`, `ActionBar`, `NavigationMenu` (its panel), the consent banner, the bar of a `SiteHeader` (frosted, `depth-bar`); `Card` and `CtaMessage` are resting sheets                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

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
- **Code keys.** Beside its copy a block can carry two more keys, on request: `download` saves
  the code as a file under the block's title and confirms like the copy, with the drawn tick;
  `wrapToggle` lets the reader break long lines and put them back, and keeps its wash while
  they break. The copy stays last, where every block has it. Without a header the keys stand
  together in the corner.
- **ButtonGroup** holds actions that belong together as one fitting with several keys: an
  action and the menu of its other forms, a few steps on the same thing, a pair of arrows. The
  keys have no face of their own: the fitting's gloss shows through, a wash marks the key
  under the pointer, and a press shades only that key while the whole fitting goes down, so it
  rocks on it. What divides two keys is a seam, the fitting's own edge drawn once more. The
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
  control only and changes nothing by itself.
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
  Beside a sidebar it stands in the page's own column (`position="sticky"`).
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

Whole screens built from these are the `Patterns` stories (sign in, settings, quotes, specimen,
site, docs, app, dashboard, billing, team): judge a change to a recipe there, not on a single
component.

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
