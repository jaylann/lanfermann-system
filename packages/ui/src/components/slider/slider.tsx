"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { type CSSProperties, type RefObject, useEffect, useRef } from "react";

import { gaugeLabel, gaugeRoot, gaugeValue, troughTrack } from "@/internal/trough";
import { cn, mergeClassName } from "@/lib/cn";
import { INERTIA_RELEASE_MS, type Motion, restingMotion, trackMotion } from "@/motion/inertia";

type SliderState = SliderPrimitive.Root.State;

/** Custom properties as an inline style. */
const vars = (properties: Record<`--${string}`, string | number>) => properties as CSSProperties;

/** Where thumb `index` stands: 0 at the lowest value, 1 at the highest. */
function place(state: SliderState, index: number) {
  const span = state.max - state.min;
  const value = state.values[index] ?? state.min;
  return span > 0 ? Math.min(1, Math.max(0, (value - state.min) / span)) : 0;
}

/** The deformation of thumb `index`, as it is kept on the control (see `useThumbInertia`). */
const body = (index: number, size: string) =>
  vars({
    "--size": size,
    "--s": `var(--thumb-${index}-s, 1)`,
    "--d": `var(--thumb-${index}-d, 1)`,
  });

/** What travels (see `slider-travels`): gliding to a new value, chasing a dragged pointer. */
const travels = "slider-travels";

export type SliderProps<Value extends number | readonly number[] = number | readonly number[]> =
  Omit<SliderPrimitive.Root.Props<Value>, "orientation">;

/**
 * A value picked by feel from a range, where the exact number matters less than the place: a
 * discount, an opacity, a price span. Where the number matters, use a `NumberField`.
 *
 * It is a long switch: a raised thumb runs in a sunken trough that fills with Indigo up to it.
 * An array as value (`defaultValue={[20, 60]}`) makes a range with two thumbs. Horizontal only.
 *
 * Name it with a `SliderLabel`, or with an `aria-label` on the `SliderThumb` when there is no
 * visible label; in a range, name both thumbs ("Mindestpreis", "Höchstpreis").
 *
 * It follows one finger at a time: while a thumb is dragged, a second finger is ignored.
 */
export function Slider<Value extends number | readonly number[]>({
  className,
  thumbAlignment = "edge",
  ...props
}: SliderProps<Value>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      // `edge`: the thumb stops inside the trough instead of poking through its wall. The
      // places in src/styles/slider.css assume it.
      thumbAlignment={thumbAlignment}
      className={mergeClassName(["group/slider", gaugeRoot], className)}
      {...props}
    />
  );
}

/** Says what is being set. */
export function SliderLabel({ className, ...props }: SliderPrimitive.Label.Props) {
  return (
    <SliderPrimitive.Label
      data-slot="slider-label"
      className={mergeClassName(
        [gaugeLabel, "group-data-disabled/slider:text-on-disabled"],
        className,
      )}
      {...props}
    />
  );
}

/** The value as text, formatted by the slider's `format` and `locale`; a range shows both ends. */
export function SliderValue({ className, ...props }: SliderPrimitive.Value.Props) {
  return (
    <SliderPrimitive.Value
      data-slot="slider-value"
      className={mergeClassName(
        [gaugeValue, "group-data-disabled/slider:text-on-disabled"],
        className,
      )}
      {...props}
    />
  );
}

/**
 * One finger at a time. Base UI follows every pointer that moves while a thumb is dragged, so a
 * second finger on the screen throws the thumb back and forth between the two. Here the pointer
 * that began the drag owns it: until it lifts, the others do not reach the slider.
 *
 * The listeners sit on the window, in the capture phase, because that is the one place before
 * Base UI's own (on the control and on the document).
 *
 * The price, for as long as a thumb is held: another finger's moves and its lifting reach
 * nothing else on the page either, and two sliders pulled at the same moment still disturb each
 * other (Base UI's listeners take any pointer). Both would need Base UI to tell pointers apart.
 */
function useSinglePointer(control: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = control.current;
    if (!element) return;
    let owner: number | null = null;

    const inside = (target: EventTarget | null) =>
      target instanceof Node && element.contains(target);
    // Another slider keeps its own pointer: leave that one alone.
    const elsewhere = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest('[data-slot="slider-control"]') !== null &&
      !element.contains(target);
    const foreign = (event: PointerEvent) =>
      owner !== null && event.pointerId !== owner && element.hasAttribute("data-dragging");

    const down = (event: PointerEvent) => {
      if (!inside(event.target)) return;
      if (foreign(event)) event.stopPropagation();
      else owner = event.pointerId;
    };
    const move = (event: PointerEvent) => {
      if (foreign(event) && !elsewhere(event.target)) event.stopPropagation();
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId === owner) owner = null;
      else if (foreign(event) && !elsewhere(event.target)) event.stopPropagation();
    };
    // Base UI listens to touches as well: a second one on the slider would take the drag over.
    const touch = (event: TouchEvent) => {
      const here = [...event.touches].filter((finger) => inside(finger.target));
      if (inside(event.target) && here.length > 1) event.stopPropagation();
    };

    const options = { capture: true } as const;
    window.addEventListener("pointerdown", down, options);
    window.addEventListener("pointermove", move, options);
    window.addEventListener("pointerup", up, options);
    window.addEventListener("pointercancel", up, options);
    window.addEventListener("touchstart", touch, options);
    return () => {
      window.removeEventListener("pointerdown", down, options);
      window.removeEventListener("pointermove", move, options);
      window.removeEventListener("pointerup", up, options);
      window.removeEventListener("pointercancel", up, options);
      window.removeEventListener("touchstart", touch, options);
    };
  }, [control]);
}

/**
 * Gives the thumbs inertia. Each time a thumb has moved, how fast it travels decides how far it
 * is stretched (`trackMotion`); that goes to the control as `--thumb-<index>-s` and
 * `--thumb-<index>-d`, which the thumb's face and the cap of the fill both read
 * (`slider-body`). A moment after the last move they are let go and rebound.
 *
 * It runs once per move, not once per frame, and reads no layout: the width of the control is
 * kept by a `ResizeObserver`. The drawing between two moves is the compositor's.
 */
function useThumbInertia(anchor: RefObject<HTMLElement | null>, places: number[]) {
  const motions = useRef<Motion[]>([]);
  const metrics = useRef({ travel: 0, thumb: 0, rtl: false });
  const release = useRef<ReturnType<typeof setTimeout>>(undefined);
  const key = places.join(" ");

  useEffect(() => {
    const control = anchor.current?.closest<HTMLElement>('[data-slot="slider-control"]');
    const thumb = control?.querySelector<HTMLElement>('[data-slot="slider-thumb"]');
    if (!control || !thumb) return;
    const measure = () => {
      metrics.current = {
        thumb: thumb.offsetWidth,
        travel: Math.max(0, control.clientWidth - thumb.offsetWidth),
        rtl: getComputedStyle(control).direction === "rtl",
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(control);
    return () => {
      observer.disconnect();
      clearTimeout(release.current);
    };
  }, [anchor]);

  useEffect(() => {
    const control = anchor.current?.closest<HTMLElement>('[data-slot="slider-control"]');
    if (!control) return;
    const { travel, thumb, rtl } = metrics.current;
    const now = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let moved = false;
    key.split(" ").forEach((place, index) => {
      const x = Number(place) * travel * (rtl ? -1 : 1);
      const before = motions.current[index];
      const next = before ? trackMotion(before, x, now, thumb) : restingMotion(x, now);
      motions.current[index] = next;
      if (!before || next.x === before.x || still) return;
      control.style.setProperty(`--thumb-${index}-s`, next.stretch.toFixed(3));
      control.style.setProperty(`--thumb-${index}-d`, String(next.direction));
      moved = true;
    });
    if (!moved) return;
    // While it moves the stretch follows quickly; let go, it rebounds (see `slider-body`).
    control.setAttribute("data-moving", "");
    clearTimeout(release.current);
    release.current = setTimeout(() => {
      control.removeAttribute("data-moving");
      key.split(" ").forEach((_, index) => control.style.removeProperty(`--thumb-${index}-s`));
    }, INERTIA_RELEASE_MS);
  }, [anchor, key]);
}

/**
 * The fill and the caps that hold the thumbs. The fill is the bar; each thumb stands in a round
 * cap of the fill's colour, as wide as the trough is tall, which keeps the gap to the thumb
 * that the trough's wall keeps too. The cap deforms with its thumb.
 */
function SliderFill({ state }: { state: SliderState }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const places = state.values.map((_, index) => place(state, index));
  useThumbInertia(anchor, places);

  const range = places.length > 1;
  const last = places[places.length - 1] ?? 0;
  // A thumb's centre, from the start of the trough.
  const centre = (at: number) => `calc(var(--switch-h) / 2 + ${at} * var(--slider-travel))`;
  const colour = state.disabled ? "bg-on-disabled" : "bg-accent forced-colors:bg-[Highlight]";

  return (
    <span
      ref={anchor}
      data-slot="slider-indicator"
      aria-hidden
      className={cn(
        "absolute inset-0 transition-opacity spring-snap",
        // At the lowest value nothing is filled: the thumb stands in the empty trough, like a
        // switch that is off.
        !range && last <= 0 && "opacity-0",
      )}
    >
      <span
        className={cn("slider-fill-window", travels)}
        style={vars({
          "--fill-start": range ? centre(places[0] ?? 0) : "0px",
          "--fill-end": centre(last),
        })}
      >
        <span className={cn("slider-fill-bar", colour, travels)} />
      </span>
      {places.map((at, index) => (
        <span
          key={index}
          className={cn("slider-at size-(--switch-h)", travels)}
          style={vars({ "--p": at })}
        >
          <span
            data-slot="slider-cap"
            className={cn(
              "slider-body block h-full w-[calc(100%+var(--held,0px))] rounded-full [--squash:0]",
              colour,
              state.dragging && state.activeThumbIndex === index && "[--held:3px]",
            )}
            style={body(index, "var(--switch-h)")}
          />
        </span>
      ))}
    </span>
  );
}

export type SliderControlProps = SliderPrimitive.Control.Props;

/**
 * The part that is pressed and dragged: as tall as a control, with the trough in its middle.
 * Without children it holds one thumb; pass `SliderThumb`s to name them or to make a range.
 */
export function SliderControl({ className, children, ref, ...props }: SliderControlProps) {
  const control = useRef<HTMLDivElement>(null);
  useSinglePointer(control);
  return (
    <SliderPrimitive.Control
      ref={(node) => {
        control.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      data-slot="slider-control"
      className={mergeClassName(
        // 2px narrower than the trough on each side: that is the gap the thumb keeps to the wall.
        "slider-geometry touch-target relative col-span-2 mx-0.5 flex h-(--control-md) touch-none items-center select-none data-disabled:pointer-events-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="h-(--switch-h) w-full">
        <span
          data-slot="slider-trough"
          className={cn(
            "absolute -inset-x-0.5 top-0 h-(--switch-h)",
            troughTrack,
            "group-data-disabled/slider:bg-disabled group-data-disabled/slider:after:depth-flat",
          )}
        >
          {/* Base UI's indicator sizes itself by width; ours is drawn from the same state. */}
          <SliderPrimitive.Indicator render={(_, state) => <SliderFill state={state} />} />
        </span>
        {children ?? <SliderThumb />}
      </SliderPrimitive.Track>
    </SliderPrimitive.Control>
  );
}

export type SliderThumbProps = Omit<SliderPrimitive.Thumb.Props, "render" | "children">;

/**
 * The thumb, raised like the switch's, and it behaves like it: held, it widens into a short pill
 * and lifts; let go, it seats back. Under the pointer it chases on the short spring, which
 * smooths the steps of a coarse slider; moved by the keyboard or from outside, it glides. In a
 * range, give each its `index`.
 *
 * It has inertia: pulled fast, its trailing side lags and it stretches along the way; when it
 * stops, it swings back past its shape for a moment and settles.
 *
 * Like the switch's thumb it takes the colour that reads on what it stands on: the fill's
 * counterpart while it is held by the fill, the plain thumb colour in the empty trough.
 *
 * Two elements: Base UI's thumb is the invisible box that is pressed and holds the input; what
 * is seen is the face beside it, placed from the same value and moved by transforms only.
 */
export function SliderThumb({ className, index = 0, ...props }: SliderThumbProps) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      index={index}
      className={mergeClassName("size-(--slider-thumb) rounded-full", className)}
      {...props}
      render={(thumbProps, state) => {
        const held = state.dragging && state.activeThumbIndex === index;
        const onFill = state.values.length > 1 || place(state, 0) > 0;
        return (
          <>
            <div {...thumbProps} />
            <span
              aria-hidden
              data-slot="slider-thumb-rider"
              className={cn(
                "pointer-events-none slider-at size-(--slider-thumb) rounded-full",
                travels,
                // The thumb right before it (`+`): in a range a `peer` would also match the
                // first thumb from the second face.
                "[[data-slot=slider-thumb]:has(:focus-visible)+&]:outline-2 [[data-slot=slider-thumb]:has(:focus-visible)+&]:outline-offset-2 [[data-slot=slider-thumb]:has(:focus-visible)+&]:outline-accent",
                "[[data-slot=slider-thumb]:hover+&]:*:depth-raised-hover",
              )}
              style={vars({
                "--p": place(state, index),
                "--thumb-face": onFill ? "var(--color-on-accent)" : "var(--color-thumb)",
              })}
            >
              <span
                data-slot="slider-thumb-face"
                className={cn(
                  "slider-body block h-full w-[calc(100%+var(--held,0px))] rounded-full bg-(--thumb-face) depth-raised depth-tone-thumb",
                  held && "depth-raised-hover [--held:3px]",
                  state.disabled && "bg-raised depth-flat",
                )}
                style={body(index, "var(--slider-thumb)")}
              />
            </span>
          </>
        );
      }}
    />
  );
}
