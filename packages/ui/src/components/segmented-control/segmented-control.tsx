"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import {
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn, mergeClassName } from "@/lib/cn";
import {
  INERTIA_RELEASE_MS,
  leanShape,
  type Motion,
  pillGive,
  restingMotion,
  trackMotion,
  TRAVEL_BUSY_MS,
  TRAVEL_RELEASE_MS,
  travelStretch,
  withinRoom,
} from "@/motion/inertia";

type Shape = "square" | "round";

/**
 * The thumb's recipe, by its shape: the raised Fase, toned for the square trough. The thumb
 * wears it, and so does the seat that stands in for the thumb before it is placed (a `::before`
 * on the chosen segment): both written out, so Tailwind finds them.
 */
const thumbDepth: Record<Shape, string> = {
  square: "depth-raised depth-tone-thumb",
  round: "depth-raised",
};
const seatDepth: Record<Shape, string> = {
  square: "before:depth-raised before:depth-tone-thumb",
  round: "before:depth-raised",
};

/** What a segment has to know of its control. `lens` marks the copy the thumb shows. */
type Track = { shape: Shape; value: string | undefined; lens: boolean; marks: boolean };

const TrackContext = createContext<Track>({
  shape: "square",
  value: undefined,
  lens: false,
  marks: true,
});

/** How far a press on the thumb must travel before it is a drag and not a click, in px. */
const DRAG_SLOP = 4;

type Box = { value: string | null; left: number; width: number };

/**
 * How wide a pulled thumb is with its middle at `middle`: over a segment's middle, that
 * segment's width; between two middles, as far between their widths as it is between them. So
 * the width changes only as the hand moves, and never all at once where it crosses a border.
 */
function widthAt(boxes: Box[], middle: number) {
  const first = boxes[0];
  if (!first) return 0;
  let before = first;
  for (const box of boxes) {
    const from = before.left + before.width / 2;
    const to = box.left + box.width / 2;
    if (middle <= to) {
      if (to === from) return box.width;
      const share = Math.max(0, (middle - from) / (to - from));
      return before.width + (box.width - before.width) * share;
    }
    before = box;
  }
  return before.width;
}

export type SegmentedControlProps = Omit<
  ToggleGroupPrimitive.Props,
  "value" | "defaultValue" | "onValueChange" | "multiple" | "ref"
> & {
  /** The selected segment (controlled). */
  value?: string;
  /** The segment selected at first (uncontrolled). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * `square` sits in the row of controls: corners of a control, the thumb inset in its trough.
   * `round` is a pill whose thumb rides on the trough's full height, each segment with its mark.
   */
  shape?: Shape;
  /**
   * The round shape draws the system's mark before every label: a ring, and the disc where the
   * thumb is. `false` leaves it out, for segments that are a symbol each: the symbol is the
   * mark then. The square shape has no marks.
   */
  marks?: boolean;
  /**
   * The thumb has weight: it can be pulled to another segment, it stretches along its way and
   * squashes as it lands, and it reaches for a mouse that rests over another segment. `false`
   * leaves a thumb that only glides.
   */
  inertia?: boolean;
};

/**
 * A choice between two to five views of the same thing, always with one selected. One raised
 * thumb lives in a sunken trough and TRAVELS to the chosen segment: the mark moves, it does not
 * fade out here and in there. What is chosen is what the thumb covers: the labels are drawn a
 * second time inside it, in the colour of the choice, so a label darkens as the thumb arrives
 * and not before. Keep the labels to plain words and icons: they are rendered twice.
 *
 * The thumb is placed from the pressed segment's measured box and moved with CSS springs
 * (src/styles/segmented.css). That keeps its shadow and corners true (a scale-based layout
 * animation would stretch them) and stays correct under CSS `zoom` and inside transformed
 * parents. Its weight is the slider's, decided in src/motion/inertia.ts once per move and drawn
 * by CSS: nothing renders while it moves.
 */
export function SegmentedControl({
  value: valueProp,
  defaultValue,
  onValueChange,
  shape = "square",
  marks = true,
  inertia = true,
  className,
  children,
  ...props
}: SegmentedControlProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const trackRef = useRef<HTMLDivElement>(null);
  // The first placement must not animate, or the thumb would slide in from the left edge.
  const [placed, setPlaced] = useState(false);
  const lastLeft = useRef<number | undefined>(undefined);
  const release = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leanFrame = useRef(0);
  /** Until then (ms) the thumb is on its way to a choice and does not lean. */
  const busyUntil = useRef(0);
  /** The choice that follows was made by dropping the thumb: it is not stretched again. */
  const dropped = useRef(false);
  const drag = useRef<{
    pointer: number;
    /** Where the pointer went down, and where the thumb's middle stood then. */
    startX: number;
    startMiddle: number;
    /** Viewport pixels per layout pixel when it was grabbed (`zoomOf`). */
    zoom: number;
    /** Every segment's box, read once when the thumb is grabbed: a pull measures nothing. */
    boxes: Box[];
    /** The thumb's box now, and the segment it would be dropped on. */
    left: number;
    width: number;
    over: number;
    moved: boolean;
    motion: Motion;
  } | null>(null);

  function choose(next: string) {
    setInner(next);
    onValueChange?.(next);
  }

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pressed = () =>
      track.querySelector<HTMLElement>('[data-slot="segment"][data-pressed]') ?? undefined;
    /*
     * Reads first, then writes, and nothing read in between. A read lays the page out, and with
     * that the browser starts the transitions of whatever was written before it, on the curve
     * that holds at that instant: a thumb that still followed a pointer would set off on the
     * chase.
     */
    const place = () => {
      const segment = pressed();
      // offsetLeft/offsetWidth are layout pixels: unaffected by zoom and transforms.
      const box = segment && { left: segment.offsetLeft, width: segment.offsetWidth };
      const size = { width: track.offsetWidth, height: track.offsetHeight };
      // The lens lays the labels out a second time: it needs the track's own size for that.
      track.style.setProperty("--track-width", String(size.width));
      track.style.setProperty("--track-height", String(size.height));
      if (!box) return undefined;
      track.style.setProperty("--thumb-left", String(box.left));
      track.style.setProperty("--thumb-width", String(box.width));
      return box;
    };

    const before = lastLeft.current;
    const wasDropped = dropped.current;
    dropped.current = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A choice travels at the thumb's own pace, not a pointer's: unless a hand let go of it.
    if (!wasDropped) delete track.dataset.following;
    const box = place();
    const now = box?.left;
    // A choice takes back what the thumb reached for (`reach`) and drops a reach still waiting
    // for its frame: that one was measured from the segment chosen before. Also before the first
    // frame, when the thumb does not travel yet: a test's pointer events, which come at x = 0,
    // left it leaning towards the page's edge for good. A trip below sets its own shape.
    cancelAnimationFrame(leanFrame.current);
    track.style.setProperty("--thumb-lean", "0");
    track.style.setProperty("--thumb-s", "1");
    delete track.dataset.moving;
    if (
      inertia &&
      box &&
      now !== undefined &&
      before !== undefined &&
      now !== before &&
      track.hasAttribute("data-placed") &&
      !reduced
    ) {
      busyUntil.current = performance.now() + TRAVEL_BUSY_MS;
      if (!wasDropped) {
        // Set off: stretched along the way, its leading edge holding, and let go so that the
        // rebound's squash lands with it. The stretch grows at the thumb's own pace
        // (`data-travelling`), so its tail only ever moves the way the thumb goes.
        track.style.setProperty("--thumb-hold", now > before ? "1" : "-1");
        track.style.setProperty("--thumb-s", travelStretch(now - before, box.width).toFixed(3));
        track.dataset.moving = "";
        track.dataset.travelling = "";
        clearTimeout(release.current);
        release.current = setTimeout(() => {
          delete track.dataset.moving;
          delete track.dataset.travelling;
          track.style.setProperty("--thumb-s", "1");
        }, TRAVEL_RELEASE_MS);
      }
    }
    lastLeft.current = now;

    const frame = requestAnimationFrame(() => setPlaced(true));
    // Labels change width when the web font arrives or the container resizes. The thumb then
    // takes its new place at once: only a choice travels, a layout does not.
    // An observer also reports every box once when it starts watching it. That report, on a
    // choice, finds the thumb already sent to its place and must leave its glide alone: only a
    // place that is really off moves it.
    let settle = 0;
    const observer = new ResizeObserver(() => {
      const segment = pressed();
      if (!segment || drag.current?.moved) return;
      if (
        track.style.getPropertyValue("--thumb-left") === String(segment.offsetLeft) &&
        track.style.getPropertyValue("--thumb-width") === String(segment.offsetWidth) &&
        track.style.getPropertyValue("--track-width") === String(track.offsetWidth)
      ) {
        return;
      }
      track.dataset.settling = "";
      lastLeft.current = place()?.left;
      cancelAnimationFrame(settle);
      settle = requestAnimationFrame(() => {
        settle = requestAnimationFrame(() => delete track.dataset.settling);
      });
    });
    observer.observe(track);
    for (const each of track.querySelectorAll('[data-slot="segment"]')) observer.observe(each);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(settle);
      observer.disconnect();
    };
  }, [value, inertia]);

  useEffect(
    () => () => {
      clearTimeout(release.current);
      cancelAnimationFrame(leanFrame.current);
    },
    [],
  );

  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * How many viewport pixels one of the track's layout pixels takes: more than 1 under a zoomed
   * ancestor or a scaled one. Pointer positions are viewport pixels and the places written onto
   * the track are layout pixels, so a pointer's way is divided by this before it is used.
   */
  function zoomOf(track: HTMLElement) {
    const drawn = track.getBoundingClientRect().width;
    return drawn > 0 && track.offsetWidth > 0 ? drawn / track.offsetWidth : 1;
  }

  /** The first and the last place the thumb can stand at, as offsets in the track. */
  function walls(track: HTMLElement) {
    const segments = track.querySelectorAll<HTMLElement>('[data-slot="segment"]');
    const first = segments[0];
    const last = segments[segments.length - 1];
    if (!first || !last) return undefined;
    return { start: first.offsetLeft, end: last.offsetLeft + last.offsetWidth };
  }

  /*
   * Anticipation: a resting thumb reaches for a pointer over another segment: its near edge
   * goes a few px towards it, its far edge half as far. `x` is where the pointer is, in the
   * viewport. Written straight onto the track.
   */
  function reach(track: HTMLElement, x: number) {
    const segment = track.querySelector<HTMLElement>('[data-slot="segment"][data-pressed]');
    const wall = walls(track);
    if (!segment || !wall || performance.now() < busyUntil.current || still()) return;
    const box = segment.getBoundingClientRect();
    const offset =
      (x < box.left ? x - box.left : x > box.right ? x - box.right : 0) / zoomOf(track);
    const room =
      offset > 0
        ? wall.end - segment.offsetLeft - segment.offsetWidth
        : segment.offsetLeft - wall.start;
    const shape = leanShape(offset, segment.offsetWidth, room);
    track.dataset.following = "";
    track.dataset.moving = "";
    track.style.setProperty("--thumb-lean", shape.shift.toFixed(2));
    track.style.setProperty("--thumb-s", shape.stretch.toFixed(3));
    if (shape.stretch !== 1) track.style.setProperty("--thumb-hold", String(shape.hold));
  }

  // A mouse over the track: once per frame.
  function lean(event: PointerEvent<HTMLDivElement>) {
    if (!inertia || event.pointerType !== "mouse" || drag.current) return;
    const track = event.currentTarget;
    const x = event.clientX;
    cancelAnimationFrame(leanFrame.current);
    leanFrame.current = requestAnimationFrame(() => reach(track, x));
  }

  function stand(event: PointerEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    cancelAnimationFrame(leanFrame.current);
    // On its way or in a hand, the thumb's shape is not the lean's to take back.
    if (!inertia || drag.current?.moved || performance.now() < busyUntil.current) return;
    track.style.setProperty("--thumb-lean", "0");
    track.style.setProperty("--thumb-s", "1");
  }

  /*
   * Pulling the thumb: a press on the chosen segment holds it (it gives a little), and one that
   * travels further than a few px picks it up. It follows the pointer inside the trough,
   * stretched by its speed as the slider's thumb is, takes the width of the segment it is over,
   * and is dropped on that one: the segment whose middle is nearest.
   */
  function grab(event: PointerEvent<HTMLDivElement>) {
    if (!inertia || event.button !== 0) return;
    const track = event.currentTarget;
    const segment = (event.target as Element).closest<HTMLElement>('[data-slot="segment"]');
    if (!segment) return;
    if (!segment.hasAttribute("data-pressed")) {
      // A press on another segment: the thumb reaches for it before it sets off. A finger has
      // no hover, so this is all the anticipation a touch screen gets.
      reach(track, event.clientX);
      return;
    }
    const segments = [...track.querySelectorAll<HTMLElement>('[data-slot="segment"]')];
    const left = segment.offsetLeft;
    const width = segment.offsetWidth;
    try {
      track.setPointerCapture(event.pointerId);
    } catch {
      // A pointer that is gone already cannot be captured. The pull then ends where it lets go
      // inside the track, or with the first move that finds no button down (see `pull`).
    }
    track.dataset.moving = "";
    delete track.dataset.travelling;
    track.dataset.grabbed = "";
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      startMiddle: left + width / 2,
      zoom: zoomOf(track),
      boxes: segments.map((each) => ({
        value: each.getAttribute("data-value"),
        left: each.offsetLeft,
        width: each.offsetWidth,
      })),
      left,
      width,
      over: segments.indexOf(segment),
      moved: false,
      motion: restingMotion(left + width / 2, event.timeStamp),
    };
  }

  function pull(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    if (!held || held.pointer !== event.pointerId) return lean(event);
    const track = event.currentTarget;
    // Let go outside the track without our knowing (the pointer was not captured): drop it.
    if (event.buttons === 0 && !track.hasPointerCapture(event.pointerId)) return drop(event);
    const dx = (event.clientX - held.startX) / held.zoom;
    if (!held.moved && Math.abs(dx) < DRAG_SLOP) return;
    if (!held.moved) {
      held.moved = true;
      cancelAnimationFrame(leanFrame.current);
      track.style.setProperty("--thumb-lean", "0");
      track.style.setProperty("--thumb-s", "1");
      track.dataset.following = "";
      track.dataset.dragging = "";
    }
    const first = held.boxes[0];
    const last = held.boxes[held.boxes.length - 1];
    if (!first || !last) return;
    // The segment under its middle: where it would be dropped. One that is only just nearer
    // does not take over yet, so a hand resting on the border does not change its mind.
    const wish = held.startMiddle + dx;
    const away = (index: number) => {
      const box = held.boxes[index];
      return box ? Math.abs(box.left + box.width / 2 - wish) : Number.POSITIVE_INFINITY;
    };
    let over = held.over;
    held.boxes.forEach((_, index) => {
      if (away(index) + DRAG_SLOP < away(over)) over = index;
    });
    held.over = over;
    /*
     * It stands where the hand has it, written on every move without a transition: the hand is
     * the curve. A transition retargeted on every move stalls on iOS: measured on an iPhone,
     * each move restarted it from where the move before had started it, so the thumb stood
     * still while the finger moved and lurched after it when a frame came without a move.
     */
    const width = widthAt(held.boxes, wish);
    const left = Math.min(Math.max(wish - width / 2, first.left), last.left + last.width - width);
    held.left = left;
    held.width = width;
    track.style.setProperty("--thumb-width", width.toFixed(2));
    track.style.setProperty("--thumb-left", left.toFixed(2));
    if (still()) return;
    // Its speed is its middle's: the left edge also moves when the width changes.
    held.motion = trackMotion(
      held.motion,
      left + width / 2,
      event.timeStamp,
      width,
      pillGive(width),
    );
    // The tail lags behind, but not through the wall it came from.
    const room =
      held.motion.direction > 0 ? left - first.left : last.left + last.width - left - width;
    track.dataset.moving = "";
    track.style.setProperty("--thumb-hold", String(held.motion.direction));
    track.style.setProperty("--thumb-s", withinRoom(held.motion.stretch, room, width).toFixed(3));
    clearTimeout(release.current);
    release.current = setTimeout(() => {
      // It stopped in the hand: let go, it swings back as the slider's thumb does.
      delete track.dataset.moving;
      track.style.setProperty("--thumb-s", "1");
      const now = drag.current;
      if (now) now.motion = restingMotion(now.left + now.width / 2, performance.now());
    }, INERTIA_RELEASE_MS);
  }

  function drop(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    if (!held || held.pointer !== event.pointerId) {
      // A finger that pressed another segment has gone: so has what the thumb reached for. (A
      // mouse is still there, and the choice that may follow takes the reach back itself.)
      if (!held && event.pointerType !== "mouse") stand(event);
      return;
    }
    drag.current = null;
    const track = event.currentTarget;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    // Let go: whatever shape it had comes back on the rebound.
    delete track.dataset.grabbed;
    delete track.dataset.moving;
    if (!held.moved) return;
    delete track.dataset.dragging;
    clearTimeout(release.current);
    track.style.setProperty("--thumb-s", "1");
    // It travels the rest of the way from where it was let go, still on the chase: the hand
    // gave it its speed.
    lastLeft.current = held.left;
    busyUntil.current = performance.now() + TRAVEL_BUSY_MS;
    const next = held.boxes[held.over]?.value ?? undefined;
    if (next && next !== value) {
      dropped.current = true;
      choose(next);
    } else {
      const pressed = track.querySelector<HTMLElement>('[data-slot="segment"][data-pressed]');
      if (pressed) {
        track.style.setProperty("--thumb-left", String(pressed.offsetLeft));
        track.style.setProperty("--thumb-width", String(pressed.offsetWidth));
      }
      lastLeft.current = pressed?.offsetLeft;
    }
  }

  const round = shape === "round";
  const track = useMemo<Track>(() => ({ shape, value, lens: false, marks }), [shape, value, marks]);
  const lens = useMemo<Track>(() => ({ shape, value, lens: true, marks }), [shape, value, marks]);
  return (
    <ToggleGroupPrimitive
      ref={trackRef}
      data-slot="segmented-control"
      data-shape={shape}
      data-weight={inertia ? "" : undefined}
      data-placed={placed ? "" : undefined}
      value={value === undefined ? [] : [value]}
      onValueChange={(next) => {
        // A segmented control never ends up with nothing selected.
        const picked = next[0];
        if (picked === undefined) return;
        choose(picked);
      }}
      onPointerDown={grab}
      onPointerMove={pull}
      onPointerUp={drop}
      onPointerCancel={drop}
      onPointerLeave={stand}
      className={mergeClassName(
        [
          // `isolate`: the labels lie under the thumb (`-z-1`) without leaving the trough.
          "group/track relative isolate inline-flex h-(--control-md) items-center bg-trough depth-trough",
          round ? "rounded-full" : "gap-0.5 rounded-md p-[3px]",
          // A sideways pull on a touch screen is the thumb's, not the page's.
          inertia && "touch-pan-y data-dragging:cursor-grabbing",
        ],
        className,
      )}
      {...props}
    >
      <span
        data-slot="segment-thumb"
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0",
          // The round thumb rides on the trough's full height and throws its shadow past it.
          // Around the square one 3px of trough show: its own 1px edge plus a 2px gap.
          round ? "top-0 bottom-0" : "top-[3px] bottom-[3px]",
          value === undefined && "hidden",
        )}
      >
        <span
          data-slot="segment-thumb-face"
          className={cn(
            "absolute inset-(--thumb-fit) overflow-hidden rounded-(--thumb-radius) bg-raised",
            thumbDepth[shape],
            // Held, it is pushed down a little: it touches the trough and throws no shadow.
            "group-data-grabbed/track:depth-plug",
          )}
        >
          {/* The labels once more, in the colour of the choice: see segmented.css. */}
          <span data-slot="segment-lens" inert className="absolute inset-0">
            <span
              data-slot="segment-lens-labels"
              className={cn(
                "absolute left-[calc(var(--thumb-fit)*-1)] inline-flex h-[calc(var(--track-height)*1px)] w-[calc(var(--track-width)*1px)] items-center",
                round
                  ? "top-[calc(var(--thumb-fit)*-1)]"
                  : "top-[calc(-3px-var(--thumb-fit))] gap-0.5 p-[3px]",
              )}
            >
              <TrackContext value={lens}>{children}</TrackContext>
            </span>
          </span>
        </span>
      </span>
      <TrackContext value={track}>{children}</TrackContext>
    </ToggleGroupPrimitive>
  );
}

export type SegmentProps = Omit<TogglePrimitive.Props, "value"> & {
  value: string;
  children?: ReactNode;
};

/** A segment's box and text: shared by the button and its copy in the lens, so both lay out alike. */
const segmentBox = {
  square:
    "h-[calc(var(--control-md)-6px)] rounded-[calc(var(--radius-md)-3px)] px-(--field-pad-md)",
  round: "h-full rounded-full pr-3.5 pl-3",
};
const segmentText =
  "inline-flex items-center justify-center text-control font-medium whitespace-nowrap select-none";

export function Segment({ value, className, children, ...props }: SegmentProps) {
  const track = useContext(TrackContext);
  const round = track.shape === "round";
  const marked = round && track.marks;

  if (track.lens) {
    // What the thumb shows of this segment: the same box, the colour of the choice. On the
    // trough every mark is a ring; the disc closes here, as the thumb arrives.
    return (
      <span
        data-slot="segment-copy"
        data-pressed={track.value === value ? "" : undefined}
        className={cn(
          "group",
          segmentText,
          segmentBox[track.shape],
          "text-fg",
          typeof className === "string" && className,
        )}
      >
        <span
          data-slot="segment-label"
          className={cn("inline-flex items-center", marked && "gap-1.5")}
        >
          {marked && (
            <span
              data-slot="segment-mark"
              className="mark group-data-pressed:mark-on group-data-pressed:delay-(--segment-seat)"
            />
          )}
          {children}
        </span>
      </span>
    );
  }

  return (
    <TogglePrimitive
      data-slot="segment"
      data-value={value}
      value={value}
      className={mergeClassName(
        [
          "group touch-target relative",
          segmentText,
          segmentBox[track.shape],
          // Three steps: at rest, under the pointer, pressed. The fourth, chosen, is the lens's:
          // the chosen segment itself stays quiet, or it would show dark where a pulled thumb
          // has left it.
          "text-fg-muted transition-colors duration-150 ease-out",
          "not-data-pressed:hover:text-fg-body not-data-pressed:active:text-fg",
          // Until the thumb is placed (the page came from a server and no script ran yet), the
          // chosen segment wears it itself: a seat of the same recipe, and its own dark label.
          "group-not-data-placed/track:data-pressed:text-fg",
          "before:absolute before:inset-(--thumb-fit) before:-z-2 before:hidden before:rounded-(--thumb-radius) before:bg-raised",
          "group-not-data-placed/track:data-pressed:before:block",
          seatDepth[track.shape],
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
        ],
        className,
      )}
      {...props}
    >
      {/* Under the thumb (`-z-1`), so the lens covers it; the focus ring stays on top. */}
      <span
        data-slot="segment-label"
        className={cn("relative -z-1 inline-flex items-center", marked && "gap-1.5")}
      >
        {marked && (
          <span
            data-slot="segment-mark"
            aria-hidden
            className="mark group-hover:[--mark-ring:var(--lf-text-muted)] group-not-data-placed/track:group-data-pressed:mark-on"
          />
        )}
        {children}
      </span>
    </TogglePrimitive>
  );
}
