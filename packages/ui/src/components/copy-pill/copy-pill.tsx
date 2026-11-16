"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import {
  Children,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { buttonVariants } from "@/components/button/button-variants";
import { Icon } from "@/components/icon/icon";
import { TickGlyph } from "@/internal/glyphs";
import { useReducedMotion } from "@/internal/reduced-motion";
import { cn } from "@/lib/cn";
import { restingMotion, trackMotion } from "@/motion/inertia";
import { springs } from "@/motion/springs";

/** How long a copy stays confirmed, in ms. */
const CONFIRM_MS = 2000;
/**
 * How long the pointer has to rest on the pill before it opens, in ms. Long enough that a pass
 * over it does nothing, short enough that nobody feels a wait (90 was felt).
 */
const OPEN_MS = 40;
/** How long after the pointer left the pill closes, in ms: leaving for a moment does nothing. */
const CLOSE_MS = 60;
/** How long after the mark before it a mark sets off when the stack moves, in ms. */
const FOLLOW_MS = 20;
/** How long the mark that goes to the back stays stretched before it is let go, in ms. */
const STRETCH_MS = 180;

export type CopyPillProps = Omit<
  ComponentProps<"button">,
  "children" | "onClick" | "type" | "aria-label"
> & {
  /** What goes to the clipboard. */
  text: string;
  /** Its first line, shown when the pill opens. Without it the pill stays closed. */
  preview?: string;
  /** The key, and the name of the control: the thing, then the action ("Prompt kopieren"). */
  label: string;
  /** What is announced once it is copied ("Prompt kopiert."). */
  copied: string;
  /** `lg` where the pill is the main action of a view. */
  size?: "md" | "lg";
  /** Seconds between two turns of the marks; `false` lets them stand. */
  turnEvery?: number | false;
  /** Called once the text has reached the clipboard. */
  onCopied?: () => void;
  /** The marks of what the text is for: one `CopyPillMark` each. */
  children?: ReactNode;
};

/**
 * A text to hand on (a prompt for an agent, a command, a link) as one fitting: a trough that
 * holds the marks of where it goes, each a plug seated in it, and the key that copies it. The
 * whole fitting is the button: a press anywhere in it copies.
 *
 * The marks lie on each other like a fanned stack, the first on top. They take turns: the one on
 * top goes to the back, the others close up one after another. Under a pointer that rests on it,
 * or with the keyboard's focus on it, the pill opens: the stack gathers to one plug, the trough
 * shows the first line of what will be copied, and the key keeps only its symbol. A copy is
 * confirmed in the key, by the tick drawing itself; there is no toast.
 *
 * Word the key as the thing, then the action ("Prompt kopieren"). Say beside the pill what the
 * text is for; the marks alone are decoration to assistive tech.
 *
 * Motion. Opening waits a moment for the pointer to rest and closing for it to stay away, so a
 * pass over the pill does not make it flicker. Everything that sets the pill's width (the room
 * for the stack, the preview, the key) moves on one spring, `glide`, in both directions: on
 * different curves their sum, the pill's outer edge, would shrink too far and come back. So the
 * container never swings. What swings is inside it: let go, each mark comes back on `recoil`,
 * one after another, past its place once into the gap before the key. The mark that goes to the
 * back has the slider thumb's inertia: its speed stretches it along the way, and it comes to
 * rest on `rebound`. Under reduced motion the marks stand still and nothing travels.
 *
 * The opening changes the pill's width, which is laid out and not a transform. That is the
 * exception to the system's rule, and it holds because the pill only opens under a pointer or
 * the keyboard: never on a phone, where a laid-out width stutters.
 */
export function CopyPill({
  text,
  preview,
  label,
  copied: copiedLabel,
  size = "md",
  turnEvery = 5,
  onCopied,
  className,
  style,
  children,
  ...props
}: CopyPillProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);
  const stack = useRef<HTMLSpanElement>(null);
  const words = useRef<HTMLSpanElement>(null);
  const marks = Children.toArray(children);
  const count = marks.length;

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied?.();
    } catch {
      // No clipboard (an insecure context, a denied permission): nothing is claimed.
    }
  };

  // Open or not is decided here and not by `:hover`, so it can wait: for the pointer to rest
  // before it opens, and for it to stay away before it closes.
  const [open, setOpen] = useState(false);
  const intent = useRef(0);
  const want = (next: boolean, wait: number) => {
    window.clearTimeout(intent.current);
    intent.current = window.setTimeout(() => setOpen(next), wait);
  };
  useEffect(() => () => window.clearTimeout(intent.current), []);

  // The key's words give up their width when the pill opens. Measured, that width is a length
  // and moves evenly with the other widths; a fraction of a grid track would not.
  useLayoutEffect(() => {
    const element = words.current;
    const target = button.current;
    if (!element || !target) return;
    // offsetWidth is layout pixels (unaffected by zoom) and rounded: one more keeps the last
    // letter whole.
    const measure = () => target.style.setProperty("--words", `${element.offsetWidth + 1}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [label]);

  // How often the marks have taken turns, and the one that went to the back last with how much
  // its speed stretches it (1 once it is let go).
  const turns = useRef(0);
  const [turn, setTurn] = useState(0);
  const [thrown, setThrown] = useState<{ index: number; stretch: number } | null>(null);
  useEffect(() => {
    if (reduced || turnEvery === false || count < 2) return;
    let release = 0;
    const timer = window.setInterval(() => {
      const top = turns.current % count;
      turns.current += 1;
      setTurn(turns.current);

      // The stack is wider than one mark by the way the top mark has to go. How fast that is
      // on its spring decides how far it stretches, exactly as for a slider's thumb.
      const row = stack.current;
      const first = row?.firstElementChild;
      if (!row || !(first instanceof HTMLElement)) return;
      const length = first.offsetWidth;
      const way = row.offsetWidth - length;
      const { stretch } = trackMotion(
        restingMotion(0, 0),
        way,
        springs.recoil.visualDuration * 1000,
        length,
      );
      setThrown({ index: top, stretch });
      window.clearTimeout(release);
      release = window.setTimeout(
        () => setThrown((was) => (was ? { ...was, stretch: 1 } : was)),
        STRETCH_MS,
      );
    }, turnEvery * 1000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(release);
    };
  }, [reduced, turnEvery, count]);

  return (
    <span data-slot="copy-pill" className={cn("inline-flex max-w-full", className)}>
      <button
        ref={button}
        type="button"
        data-slot="copy-pill-button"
        data-open={preview && open ? "" : undefined}
        // Its name is the words on the key; the preview is its description, not part of the name.
        aria-describedby={preview ? id : undefined}
        onClick={() => void copy()}
        // Only a pointer that can hover opens it; a finger's tap copies.
        onPointerEnter={(event) => event.pointerType !== "touch" && want(true, OPEN_MS)}
        onPointerLeave={() => want(false, CLOSE_MS)}
        onFocus={(event) => event.currentTarget.matches(":focus-visible") && want(true, 0)}
        onBlur={() => want(false, 0)}
        style={{ "--count": count, ...style } as CSSProperties}
        className={cn(
          "group/pill relative inline-flex max-w-full cursor-pointer items-center rounded-full bg-trough p-1 text-left select-none",
          // The trough's inner shadow lies over what it holds, as in every sunken track.
          "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:depth-trough",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          // A mark is as tall as a control; the next one stands out from under it by 0.6 of that.
          size === "lg"
            ? "[--pad:var(--control-pad-lg)] [--plug:var(--control-lg)]"
            : "[--pad:var(--control-pad-md)] [--plug:var(--control-md)]",
          "[--step:calc(var(--plug)*0.6)]",
          // Open, the stack is one plug with the edges of the others behind it.
          "sm:data-open:[--step:3px]",
        )}
        {...props}
      >
        {count > 0 ? (
          <span
            ref={stack}
            aria-hidden
            data-slot="copy-pill-marks"
            className="relative isolate mr-3 h-(--plug) w-[calc(var(--plug)+var(--step)*(var(--count)-1))] shrink-0 transition-[width] spring-glide motion-reduce:transition-none"
          >
            {marks.map((mark, index) => {
              // Its place in the stack: 0 lies on top, at the left.
              const place = (((index - turn) % count) + count) % count;
              const stretch = thrown?.index === index ? thrown.stretch : 1;
              return (
                <span
                  key={index}
                  data-moving={stretch !== 1 ? "" : undefined}
                  // Let go it recoils to its place; gathered in, it glides.
                  className="group/mark absolute top-0 left-0 size-(--plug) transition-[translate] spring-recoil motion-reduce:transition-none sm:group-data-open/pill:spring-glide"
                  style={
                    {
                      translate: `calc(var(--step) * ${place}) 0`,
                      zIndex: count - place,
                      // They follow one another, the first without a wait; the one sent to the
                      // back sets off at once.
                      transitionDelay:
                        stretch !== 1 ? "0ms" : `${Math.max(0, place - 1) * FOLLOW_MS}ms`,
                      "--s": stretch,
                    } as CSSProperties
                  }
                >
                  {mark}
                </span>
              );
            })}
          </span>
        ) : null}

        {preview ? (
          // Always in the page, as the button's description (a description may point at
          // what is hidden from the name); it only opens to the eye.
          <span
            id={id}
            aria-hidden
            data-slot="copy-pill-preview"
            className="grid grid-cols-[0fr] transition-[grid-template-columns] spring-glide motion-reduce:transition-none max-sm:hidden sm:group-data-open/pill:grid-cols-[1fr]"
          >
            <span className="min-w-0 overflow-hidden">
              <span className="block max-w-[26rem] truncate pr-3 font-mono text-sm whitespace-nowrap text-fg-body">
                {preview}
              </span>
            </span>
          </span>
        ) : null}

        {/*
         * The key: it looks and answers like a button, the fitting is the button. Its face keeps
         * the button's own springs; what changes its width is one layer inside, on `glide`.
         */}
        <span
          data-slot="copy-pill-key"
          className={cn(
            buttonVariants({ variant: "primary", size }),
            "rounded-full px-0",
            "group-hover/pill:bg-key-hover group-hover/pill:depth-raised-hover",
            "group-active/pill:scale-(--motion-press-scale) group-active/pill:bg-key-pressed group-active/pill:depth-pressed group-active/pill:spring-snap",
          )}
        >
          {/*
           * Open, the trough shows the text itself, so the key gives up its words and is as wide
           * as it is tall: the padding that centres the 16px symbol.
           */}
          <span className="flex items-center gap-2 px-(--pad) transition-[padding,gap] spring-glide motion-reduce:transition-none sm:group-data-open/pill:gap-0 sm:group-data-open/pill:px-[calc((var(--plug)-1rem)/2)]">
            <span className="relative flex size-4 shrink-0">
              <Icon
                icon={Copy01Icon}
                size={16}
                data-off={copied ? "" : undefined}
                className="absolute inset-0 transition-[opacity,scale] spring-leave data-off:scale-75 data-off:opacity-0"
              />
              {/* The checkbox's tick, a size larger at the same weight: it draws itself in. */}
              <TickGlyph
                width={22}
                height={22}
                strokeWidth={(1.75 * 12) / 22}
                data-on={copied ? "" : undefined}
                className="absolute top-1/2 left-1/2 -translate-1/2 opacity-0 transition-[stroke-dashoffset,opacity] duration-200 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] data-on:opacity-100 data-on:[stroke-dashoffset:0]"
              />
            </span>
            <span className="w-[var(--words,auto)] overflow-hidden whitespace-nowrap transition-[width] spring-glide motion-reduce:transition-none sm:group-data-open/pill:w-0">
              <span ref={words} className="inline-block">
                {label}
              </span>
            </span>
          </span>
        </span>
      </button>
      {/* Outside the button: what is inside one is presentation to assistive tech. */}
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </span>
  );
}

/**
 * One mark in the pill: a plug seated in the trough, holding a logo or an icon at half its
 * height. It is decoration; say in words beside the pill what the text is for.
 */
export function CopyPillMark({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="copy-pill-mark"
      className={cn(
        "flex size-full origin-right items-center justify-center rounded-full bg-raised depth-plug *:size-[calc(var(--plug)/2)]",
        // Inertia, as the slider's thumb has it: sent to the back, the mark is a little longer
        // and thinner along its way (`--s`), and let go it swings back on `rebound`.
        "[scale:var(--s,1)_calc(1-(var(--s,1)-1)*0.3)] transition-[scale] spring-rebound group-data-moving/mark:spring-snap motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
