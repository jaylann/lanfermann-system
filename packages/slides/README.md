# @lanfermann/slides

Starts, checks, previews, builds and packs a slide deck written with
[`@lanfermann/ui/slides`](https://www.npmjs.com/package/@lanfermann/ui). A deck is a folder
with a `deck.tsx`; what comes out is one HTML file that runs from a disk without a network.

```bash
bun add -d @lanfermann/slides        # or: npm i -D @lanfermann/slides
```

Node 22 or later. The layout check and the PDF also need `playwright-core` and a Chrome on the
machine; nothing is downloaded.

## A deck

```tsx
// handschlag/deck.tsx
import { Deck, Slide, Spacer, Title } from "@lanfermann/ui/slides";

export default (
  <Deck title="Der digitale Handschlag">
    <Slide id="recherche" notes="Die Zahl stehen lassen. Zwei Sekunden Pause.">
      <Title>Ihre Kunden prüfen Sie, bevor sie anrufen.</Title>
      <Spacer />
    </Slide>
  </Deck>
);
```

One child of `<Deck>` is one slide, and `notes` on a slide is what the presenter says. A deck
imports React, `@lanfermann/ui/slides` and its own files, and nothing else. The whole format,
with the rules for notes and pictures and every code the check prints, is in
[docs/deck-format.md](docs/deck-format.md).

## The commands

```
slides init <dir> [--template blank] [--title <text>] [--lang <tag>] [--force]
slides check <dir> [--no-browser] [--json]
slides dev <dir> [--port 4173] [--audience]
slides build <dir> (--audience | --presenter) [--pdf] [--out <dir>]
slides pack <dir> [--out <file>] [--json]
slides unpack <file> <dir> [--force]
```

- **`init`** writes a new deck from the blank template: a `deck.tsx` with a cover and a closing
  slide, English placeholder text and notes, and the folders `parts/`, `data/` and `images/`,
  each with an `index.ts` that says what goes there (a deck holds only code and pictures, so an
  empty folder would not reach a package). `--title` is the deck's title, `Untitled deck` by
  default; `--lang` its language, `en` by default.
- **`check`** reads the source (imports, names, notes, classes, pictures), checks the types
  against the kit's, compiles the deck, and draws it in a headless Chrome to measure every
  slide: a part beyond the content box, a box that cuts off its text, a title on too many lines,
  a slide that throws. It prints one line per finding, with its file, line and column, and
  exits 1 on any error. `--json` prints an object with `ok`, `diagnostics` and `report` and
  nothing else. Without a browser the layout is left unchecked, with one warning.

  ```
  deck.tsx:2:20 error import "lodash" is not allowed (import-not-allowed)
  check failed: 1 slide, 1 error, 0 warnings
  ```

- **`dev`** serves the presenter's view on `127.0.0.1` and builds again when a file changes.
  `--audience` serves what an audience gets.
- **`build`** writes `<slug>.html` for an audience or `<slug>.presenter.html`, into
  `./slides-out` unless `--out` names another folder. `--pdf` also writes `<slug>.pdf`, one
  page per slide, and the audience's file links it. A deck with an error is not built.
- **`pack`** writes the deck's source as one JSON file for the hub, `<slug>.deck.json`.
  `--json` prints `{ file, bytes, sha256 }` of the written file and nothing else, for a script
  that uploads it: `file` is the absolute path, `sha256` the hash of its bytes in hex.
- **`unpack`** writes a package back to a folder, pictures included. Packing that folder again
  gives the same bytes.

`init` and `unpack` write only into a folder that is empty or not there yet. `--force` writes
into one that is not empty: a file of the same name is replaced, every other file stays.

`SLIDES_BROWSER` picks another browser than the system's Chrome: a channel (`chromium`,
`msedge`) or the path of a program.

### What an audience gets

The file for an audience holds no notes. They are taken out of the source before it is
compiled, never hidden in the page, and the finished script is searched for their words. A
deck whose notes cannot be left out for certain (notes from a variable, a spread that could
carry them) gets no file at all.

Every built file carries a Content Security Policy that lets it load nothing: its inline
script and style are allowed by their hashes, pictures and fonts only as data.

## The library

The command line only maps arguments. Everything it does is exported, and a server can use it
on files it holds in memory:

```ts
import { bundleDeck, deckCsp, deckHtml, typecheckDeck } from "@lanfermann/slides";

const files = { "deck.tsx": source };
const errors = await typecheckDeck({ files, entry: "deck.tsx" });
const bundle = await bundleDeck({ files, entry: "deck.tsx", stripNotes: true });
if (bundle.js !== undefined && errors.length === 0) {
  const options = { mode: "audience", title: "Der digitale Handschlag", lang: "de" } as const;
  const html = await deckHtml(bundle.js, { ...options, csp: deckCsp(bundle.js, options) });
}
```

- **`bundleDeck({ files, entry, stripNotes? })`** compiles a deck to one script. It returns
  `{ ok, js?, kitVersion, errors }` and never throws for what is wrong with a deck: an import
  outside the allowlist is an error of kind `import`, code that does not parse one of kind
  `syntax`, notes that cannot be left out one of kind `notes`. `kitVersion` is the version of
  `@lanfermann/ui` whose player the script needs.
- **`typecheckDeck({ files, entry })`** checks the types against the kit's declarations and
  returns errors of kind `type`. It is separate, so that `bundleDeck` stays fast. The compiler
  reads the deck from memory and, of the machine, only its own library files, React's types
  and the kit's declarations. A `/// <reference … />` in a deck is not followed: both functions
  refuse it with an error of kind `import` (`reference-not-allowed`). No message names a path
  of the machine.
- **`deckHtml(js, { mode, title, lang, pdfUrl?, csp?, assets? })`** makes the one file, with the
  player's script, styles and fonts inline. `mode` is `audience`, `presenter`, `print` or
  `check`. `csp` is written as a `<meta>` when given. `assets` maps the name a picture has in
  the script (an address, or `./bilder/werkstatt.jpg` for a file of the deck) to where the page
  finds it: a data URL, an absolute `https:` address, or a path on the page's own origin (`/…`,
  `./…`, `../…`). Any other value is a `TypeError`. The command line passes data URLs, so its
  files load nothing; a file with addresses or paths is for a server that publishes the
  pictures beside the page. The layout check and the PDF open a file without a network: hand
  them data URLs.
- **`deckCsp(js, options)`** is the strict policy for exactly the file `deckHtml` makes from the
  same input. Pictures are allowed as data, from `'self'` when an asset is a path, and from the
  origin of each `https:` asset, and from nowhere else.

- **`deckTemplate("blank", { title, lang? })`** is the deck `slides init` writes, as files in
  memory (`{ entry, files, images }`), so a server seeds a new deck from the same template.
  `lang` is `en` by default. It throws a `TemplateError` for a title without a word or a
  language that is no tag.

Further exports are what the commands are made of: `readDeckDir`, `writeDeckDir`,
`analyzeDeck`, `checkDeck`, `buildDeck`, `measureDeck`, `renderPdf`, `packDeck`, `parsePackage`,
`startDevServer`.

In a page that drives a built file, wait for `window.__slidesReady === true` before a
screenshot or `page.pdf()`. With a strict policy on the page, hand Playwright a function for
that and not a line of text: text is run with `eval`, which the policy refuses.

## License

MIT. The fonts and libraries inside the player keep their own licences; every built file
carries their notices at its end.
