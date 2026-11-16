# Visual verification

Every visual change to `packages/ui` is judged in pictures before it is reported or committed.
Design intent and decisions: `packages/ui/DESIGN.md`.

## The loop

```bash
cd packages/ui
bun run build-storybook                      # static build, about 20 s
VISUAL_BROWSER=chrome node scripts/visual/capture.ts shots --static storybook-static --only <name>
```

Then Read the PNGs it lists (`.visual/sheets/*.png`, or one shot under `.visual/shots/<story-id>/`).

- Modes: `shots` (default), `states` (rest, hover, keyboard focus, pressed), `motion` (frame
  strips of what a story declares in `parameters.visual.motion`), `all`.
- `--grounds paper,ink` is the default; `--grounds all` adds tint and indigo.
- `--viewport 1290x1100` overrides the story's viewport. **Check every board at a normal window
  width before showing it to anyone**: a layout that only works at 1500px is broken.
- `--scale 3` for edge and shadow detail, `--smoke` to render everything and fail on errors,
  `--verbose` to see where a run hangs, `--url http://127.0.0.1:6006` to shoot the dev server.
- Stories steer the capture with `parameters.visual` (`viewport`, `clip`, `target`, `motion`).

## Beyond one browser at one size

- Engines: `VISUAL_BROWSER=chrome,webkit,firefox` puts the three side by side on one sheet.
  Judge by eye: text is drawn differently in each, so a pixel diff says nothing across them.
- Phone: `--touch` (390x844 with a coarse pointer) or `--device "iPhone 14"` with WebKit.
  Nothing may scroll sideways.
- A real phone: `bun run storybook:phone` serves `storybook-static` on the local network, with a
  plain list of stories at `/stories` and, with `--report`, the phone's errors in the terminal.
  The dev server is too slow for a phone. Anything that follows a finger is judged there.
- Regression: `bun run visual:check` draws every story in the pinned container and compares it
  with `visual-baseline/`; `bun run visual:baseline` accepts a meant change. Both need Docker.
- `scripts/visual/compare.ts --baseline <dir> --current <dir>` diffs any two capture folders.

## Environment facts (macOS sandbox)

- The capture script and `bun run build` (next/font downloads) must run **outside the sandbox**:
  Chrome cannot launch inside it and Next's font fetcher ignores the sandbox proxy. Use system
  Chrome (`VISUAL_BROWSER=chrome`); the cached Playwright browser is the wrong revision.
- `bun add` / `bun install` and git hooks inside the sandbox need
  `BUN_TMPDIR="$TMPDIR" BUN_INSTALL_CACHE_DIR="$TMPDIR/bun-cache"`.
- A Storybook dev server started inside the sandbox (`bun run storybook`, background) serves fine
  on `http://127.0.0.1:6006` but **does not watch files**. Stop and restart it after changes
  before asking someone to look.
- Run heavy commands one at a time (builds, captures): the machine runs out of memory otherwise.

## Rules of thumb

- Options offered for a taste decision must differ visibly at 1x; magnify detail boards.
- Tailwind v4: `outline-none` also hides a later `focus-visible:outline-*`. Do not put it on
  focusable parts.
- A travelling part (thumb, highlight) is placed from measured `offsetLeft` / `offsetWidth` and
  moved with a CSS spring. Scale-based layout animation distorts shadows and breaks under `zoom`.
- Popups portal to `<body>`: stories and apps set `data-theme` on `<html>`, not on a wrapper.
