# Motion

The spring table is `packages/ui/src/motion/springs.ts`. `bun run gen:motion` writes
`src/styles/motion.generated.css` (`spring-<name>` utilities) from it; a test fails when the two
drift. Never edit the generated file. The table and its uses: `packages/ui/DESIGN.md`.

- State changes and popups are **CSS transitions** with a `spring-*` utility:
  `transition-[translate] spring-glide`. They can be reversed mid-flight; keyframe animations
  cannot. The only keyframes are for what runs by itself: the spinner, the indeterminate
  progress fill and its breathing under reduced motion (`motion.css`).
- **Animate `translate`, `scale` and `opacity`, not `width`, `height`, insets or padding.** A
  layout property is laid out on every frame and stutters on a 120Hz phone. A fill is a bar
  pushed out of its trough (`troughFill`), a thumb a box moved by `translate` (`slider.css`).
  Height is the exception where content below has to be pushed (a panel, an error, a line that
  joins a `CodeBlockLive`, which opens its row with `grid-template-rows` from `0fr`). Part way,
  a row of `f fr` is only f² of its content's height while its container is f: clip on the
  container and let the content overflow the row.
- What follows a finger eases on a bezier that stays within 0 and 1 (`--slider-chase`), not on
  a `linear()` spring: Safari runs only such a curve off its main thread.
- On an iPhone, a transition that is retargeted on every touch move can stall: each move
  restarts it from where the move before had started it. Measured on the segmented thumb, it
  stood still while the finger moved and lurched after it. A part held by a finger is
  therefore written on every move with no transition (`follow` in `segmented-control.tsx`).
  Its stretch and release still spring. Desktop WebKit does not show this; check on the phone.
- The resting class carries the release spring; hover and press bring a faster one:
  `spring-seat hover:spring-snap active:spring-snap`.
- Enter and exit of Base UI parts: `data-starting-style:` for the first frame,
  `data-ending-style:` while closing, `data-instant:transition-none`. Exits use `spring-leave`
  and only fade; they do not travel or scale back.
- A part that travels inside a container (segment thumb, tab highlight) uses `spring-glide`,
  which has no bounce. Bounce (`seat`) is for small parts settling in place. The one exception:
  a segment thumb with weight sets off on `settle`, also without bounce, and its tail arrives
  when a glide would have. (Justin, 2026-11-15: no difference he could see.)
- Place a travelling part from measured `offsetLeft` / `offsetWidth` (or the CSS variables Base
  UI provides, e.g. `--active-tab-left`) and move it with `translate`. No scale-based layout
  animation: it distorts shadows and breaks under CSS `zoom`.
- Import Motion only through `src/motion/motion.tsx`, and only for gestures (drag, swipe with
  velocity) or content swaps. So far nothing needs it.
- A spring stepped by hand (`src/motion/spring-step.ts`) is for the two cases CSS cannot run: a
  shape that is rebuilt from numbers every frame (the calendar's selection), and a mark whose
  goal moves while it travels (the tint of a `Sidebar`, whose entries slide while subpages fold:
  `src/internal/travelling-mark.ts`). Write only custom properties from it, never layout, and
  never render React per frame.
- Inertia on a dragged part: `src/motion/inertia.ts` decides the stretch once per move, CSS
  draws it and brings it back on `spring-rebound`.
- Reduced motion: scale and travel go to zero through `--motion-enter-scale`,
  `--motion-enter-offset` and `--motion-press-scale` (`motion.css`); opacity may still change.
- Every animated component declares its transitions in `parameters.visual.motion`, and the frame
  strip is looked at: the midpoint must look intentional, and nothing may leave its container.
