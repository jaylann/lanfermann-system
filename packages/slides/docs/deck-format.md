# The deck format

A deck is a folder. What `slides check`, `slides build` and `slides pack` read from it, and
what they refuse, is written down here. The rules are the same for a deck that reaches the tool
as a folder and for one that reaches the library as files in memory.

## The folder

```
handschlag/
  deck.tsx              the deck: its default export is a <Deck> element
  parts/einwand.tsx     further .ts and .tsx files, also in subfolders
  bilder/werkstatt.jpg  pictures: .png, .jpg, .jpeg, .webp, .svg, .avif
```

- `deck.tsx` is the entry. Its default export is a `<Deck title="…">` element from
  `@lanfermann/ui/slides`, written directly or through one `const`.
- Every other `.ts` or `.tsx` file and every picture in the folder belongs to the deck.
- Files of other kinds are left out, and so are entries whose name starts with a dot and
  `node_modules`. A folder may therefore carry a `package.json` and a `tsconfig.json` for its
  editor.
- A symbolic link in the folder is refused. Code has to be UTF-8.

```tsx
import { Deck, Figure, Slide, Spacer, Title } from "@lanfermann/ui/slides";

export default (
  <Deck title="Der digitale Handschlag">
    <Slide id="recherche" notes="Die Zahl stehen lassen. Zwei Sekunden Pause.">
      <Title>Ihre Kunden prüfen Sie, bevor sie anrufen.</Title>
      <Spacer />
      <Figure value="96" unit="%" source="Quelle: BrightLocal 2024">
        aller Verbraucher recherchieren lokale Betriebe online.
      </Figure>
    </Slide>
  </Deck>
);
```

The parts a deck is made of, with their props and an example each, are in the kit's catalog
(`@lanfermann/ui/slides/catalog`).

## The deck and its slides

- `title` is written out: a string, or text with `<br />`. The file's name, its `<title>` and
  the package's manifest are made from it. `lang` is a language tag (`"en"`, `"de-CH"`); a deck
  without one is German.
- One child of `<Deck>` is one slide. Fragments are opened. A child has to be written out as an
  element: slides that are computed (`{items.map(…)}`, `{wide && <Slide />}`) cannot be counted
  or named before the deck runs, so the check refuses them.
- `id` on a slide is what `#/<id>` in an address opens. It is also how the check names a slide.

## Steps

A slide can show its content click by click. What has not appeared yet keeps its place, so
nothing moves when it comes. A print, the PDF and the check show every step.

- `<Step at={1}>` around any block makes it appear at the first press, `at={2}` at the second.
- The parts that list things take `step` on an item instead: `Columns`, `Steps`, `Findings`,
  `List`, `FigureRow`, `BarList`, the boxes of a `Diagram` and more (the catalog names it on
  each). A diagram's connector comes with the later of its two boxes and draws itself.
- A `Scene` is one drawing looked at in beats: each beat names what the camera shows, and each
  beat after the first is a step. Two slides can share a world; the second names the view the
  first ended on as `from`, and the camera travels on.
- The address carries the step: `#/7.1`, `#/ablauf.2`. Stepping back from a slide lands on
  the last step of the one before.
- A part of the deck's own that uses steps inside says how many where it is used
  (`<Aufgabe steps={2}>`, passed on to its `<Slide steps={…}>`): the player counts a slide's
  steps before it draws it, and the check reports a step the slide does not have.
- Motion belongs to the slide being presented, on a screen. `data-motion="none"` on a slide
  keeps it still.

## Notes

What the presenter says on a slide is its `notes` prop. The player shows the notes in the
presenter's console. A file for an audience does not contain them: they are taken out of the
source before it is compiled, and the finished script is searched for their words afterwards.
For that to be certain, four rules hold:

1. Every attribute named `notes` is taken out, in every file, also on a part of the deck's own.
2. Notes are written where they stand: a string, a template without placeholders, or plain
   markup (`notes={<>Erst <b>das</b>, dann das.</>}`). A variable is refused, because its text
   would stay in the file.
3. A spread on an element is allowed for an object that is written out, and for the props of a
   part of the deck's own (`function Aufgabe(props) { return <Slide {...props} />; }`). Any
   other spread could carry notes and is refused.
4. No object has a property named `notes`.

A part of the deck's own that wraps a slide takes its notes where it is used, because the
player reads them from the children of `<Deck>`:

```tsx
function Aufgabe({ id, children }: { id: string; notes?: string; children: ReactNode }) {
  return <Slide id={id}>{children}</Slide>;
}

<Aufgabe id="aufgabe" notes="Zwei Minuten Zeit geben.">
  …
</Aufgabe>;
```

If words of a slide's notes also stand elsewhere in the deck (the same sentence on the slide),
the build for an audience fails and names the notes. Reword one of the two.

## What a deck may import

- `react` (types and `Fragment` are all a deck needs from it)
- `@lanfermann/ui/slides`
- its own files, by a relative path that stays inside the folder: `./parts/einwand`,
  `../bilder/werkstatt.jpg`

Nothing else: no other package, no `node:` module, no address, no `require`, no `import()`.
This holds for an import nothing uses and for one only a type uses as well.

A deck also does not use `fetch`, `XMLHttpRequest`, `WebSocket`, `eval` or `new Function`. The
built file would not let them work anyway: its policy allows no connection and no text run as
code.

## Classes

A `className` in a deck takes the class names the kit's stylesheet defines, which are listed in
`@lanfermann/ui/slides/player/classes.json`. Any other class has no style in the built file,
so the check reports it. A `className` that is computed cannot be checked and gets a warning.

## Pictures

```tsx
import werkstatt from "./bilder/werkstatt.jpg";

<Media src={werkstatt} alt="Die Werkstatt in Sendling" caption="Werkstatt, November 2026" />;
```

An import of a picture gives the picture's name: its path from the deck's folder with `./` in
front (`./bilder/werkstatt.jpg`), whichever file imports it. A deck may write that name by hand
instead of importing it. In the built file each name is replaced by the picture as a data URL,
so the file still loads nothing.

A picture may weigh 2 MB (2 000 000 bytes), all pictures of a deck together 12 MB.

## What the check says

`slides check` prints one line per finding, `file:line:column severity message (code)`, and
exits 1 when one of them is an error.

| Code                                                                 | Meaning                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `import-not-allowed`                                                 | An import of anything but React, the kit and the deck's files        |
| `import-outside-deck`                                                | A relative import that leaves the folder                             |
| `import-not-found`                                                   | A relative import that names no file of the deck                     |
| `unsupported-file`                                                   | A file, or an import of one, that is neither code nor a picture      |
| `dynamic-import`, `require`                                          | `import()` or `require`                                              |
| `forbidden-global`                                                   | `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `new Function`       |
| `no-default-deck`                                                    | No `deck.tsx`, or its default export is not a `<Deck>` element       |
| `deck-prop-not-literal`                                              | A title or a language that is not written out, or a spread on `Deck` |
| `slides-not-static`                                                  | A child of `<Deck>` that is computed                                 |
| `notes-not-literal`, `spread-on-slide`, `notes-property`             | Notes that could not be left out for certain (rules 2 to 4)          |
| `notes-in-audience-build`                                            | Words of a slide's notes that also stand elsewhere in the deck       |
| `notes-ignored` (warning)                                            | Notes on an element that is no child of `<Deck>`: never shown        |
| `unknown-class`                                                      | A class the kit does not have                                        |
| `class-not-checked` (warning)                                        | A `className` that is computed                                       |
| `asset-too-large`                                                    | A picture over 2 MB, or pictures over 12 MB together                 |
| `ts1005`, `ts2322`, …                                                | What the TypeScript compiler says, `strict`, against the kit's types |
| `bundle`                                                             | What the bundler says about code it cannot compile                   |
| `layout-overflow`                                                    | A part that reaches beyond the content box or the canvas             |
| `layout-clipped`                                                     | A box that cuts off its own text                                     |
| `layout-wrap`                                                        | A text on more lines than it may take                                |
| `render-error`, `structure`, `font-missing`                          | A slide that threw, a child that is not one slide, a face not loaded |
| `browser-not-found` (warning; an error when a browser was asked for) | The layout was not checked: no Chrome, or no `playwright-core`       |

The layout is measured by the player's check mode in a headless Chrome, from a file opened
without a network. It needs `playwright-core` and a Chrome on the machine; nothing is
downloaded. `SLIDES_BROWSER` picks another browser: a channel (`chrome`, `chromium`, `msedge`)
or the path of a program.

## The package

`slides pack` writes the deck's source as one JSON document for the hub:

```json
{
  "format": "lanfermann.deck",
  "version": 1,
  "manifest": {
    "title": "Der digitale Handschlag",
    "slug": "der-digitale-handschlag",
    "lang": "de",
    "kit": "0.12.0",
    "slides": 10,
    "createdWith": "@lanfermann/slides 0.1.0"
  },
  "files": [
    {
      "path": "deck.tsx",
      "encoding": "utf8",
      "sha256": "…",
      "bytes": 9120,
      "content": "…"
    }
  ]
}
```

- Code is `utf8`, a picture `base64`. `sha256` (hex) and `bytes` are those of the file's bytes.
- The files are sorted by path, and the package holds no time: the same deck packs to the same
  bytes.
- `slug` is the title in lower case, with the German umlauts written out (ä is ae, ß is ss),
  other accents dropped, and everything else that is no letter or digit as one hyphen.
- `kit` is the version of `@lanfermann/ui` the deck was packed against.

`parsePackage` reads a package back and checks all of it: the format and its version, every
path (relative, forward slashes, no step up, named once, a kind a deck holds), every size and
hash, the weight of the pictures, and that `deck.tsx` is there.
