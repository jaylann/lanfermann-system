"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { useScrollEdges } from "@/components/scroll-fade/use-scroll-edges";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { useLocale } from "@/locale/locale";
import { atRest, type Moving, springForce, stepSpring } from "@/motion/spring-step";
import { springs } from "@/motion/springs";

import { aboveFoot, AT_FOOT, footOf, glideFrom, movesUp } from "./stick";

/** What the parts inside a conversation may ask of it. */
export type ConversationApi = {
  /** Back to the newest message, and keep to the foot again. */
  toLatest: () => void;
  /** Says a finished answer once, politely, to assistive tech. */
  announce: (text: string) => void;
  /** Whether the conversation has stood for a frame: what joins after that may move. */
  live: boolean;
};

const ConversationContext = createContext<ConversationApi | null>(null);

/** The conversation around a part, if there is one. */
export function useConversation(): ConversationApi | null {
  return useContext(ConversationContext);
}

type Engine = { toLatest: (focus: boolean) => void };

/** Between the scroller, its key and the root: not for the parts inside. */
type Shared = {
  /** The scroller hands over how to lead it back; the call gives back how to take that away. */
  register: (engine: Engine) => () => void;
  engine: RefObject<Engine | null>;
  away: boolean;
  setAway: (away: boolean) => void;
};

const SharedContext = createContext<Shared | null>(null);

export type ConversationProps = ComponentProps<"div">;

/**
 * A conversation with an assistant: the messages in a scroller that keeps to its foot while an
 * answer is written, and the key that leads back there. Put a `ConversationContent` inside with
 * the `Message`s, and a `ConversationLatest` after it. Give the conversation its height (`h-full`
 * in a column, `flex-1`); the prompt stands below it, outside.
 *
 * At the foot, what joins is followed: the view glides down with the answer as it grows. The
 * reader who scrolls up, presses a scroll key or opens a fold inside an answer is left where
 * they are, and the key „Neueste“ appears; it leads back and keeps to the foot again, and so
 * does sending a prompt. A finished answer is announced once, not word by word.
 */
export function Conversation({ className, children, ...props }: ConversationProps) {
  const engine = useRef<Engine | null>(null);
  const [away, setAway] = useState(false);
  const [said, setSaid] = useState("");
  const live = useLive();
  // The same words twice in a row would leave the region as it is, and nothing would be said:
  // the second time they end in a space, which changes the region and is not read.
  const announce = useCallback(
    (text: string) => setSaid((before) => (before === text ? `${text}\u00A0` : text)),
    [],
  );
  const api = useMemo<ConversationApi>(
    () => ({ toLatest: () => engine.current?.toLatest(false), announce, live }),
    [announce, live],
  );
  const register = useCallback((next: Engine) => {
    engine.current = next;
    return () => {
      if (engine.current === next) engine.current = null;
    };
  }, []);
  const shared = useMemo<Shared>(() => ({ register, engine, away, setAway }), [register, away]);
  return (
    <ConversationContext value={api}>
      <SharedContext value={shared}>
        <div
          data-slot="conversation"
          className={cn(
            "relative flex min-h-0 flex-col",
            // The scroller's mask would cut its own outline: the ring is drawn here.
            "rounded-sm has-[[data-slot=conversation-scroller]:focus-visible]:outline-2 has-[[data-slot=conversation-scroller]:focus-visible]:outline-offset-2 has-[[data-slot=conversation-scroller]:focus-visible]:outline-accent",
            className,
          )}
          {...props}
        >
          {children}
          <div data-slot="conversation-announcer" role="status" className="sr-only">
            {said}
          </div>
        </div>
      </SharedContext>
    </ConversationContext>
  );
}

export type ConversationContentProps = ComponentProps<"div"> & {
  /** The name of the scrolling region for assistive tech. */
  label?: string;
};

/**
 * The messages, in a box that scrolls. `className` lays out what it holds (the column's width,
 * its padding, the room between messages); the box itself fills the conversation.
 */
export function ConversationContent({
  label,
  className,
  children,
  ref,
  ...props
}: ConversationContentProps) {
  const { messages } = useLocale();
  const shared = useContext(SharedContext);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const live = useLive();
  useScrollEdges(scroller, "y");

  // Both are stable: a state setter and a callback made once.
  const report = shared?.setAway;
  const register = shared?.register;

  useLayoutEffect(() => {
    const box = scroller.current;
    const inner = content.current;
    if (!box || !inner) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const force = springForce(springs.settle);
    const setAway = (away: boolean) => report?.(away);

    /** Whether the view keeps to the foot as what it holds grows. */
    let following = true;
    let frame = 0;
    let moving: Moving | null = null;
    let lastFrame = 0;
    /** Where the view was last put by this code, so the scroll it causes is not the reader's. */
    let written = Number.NaN;
    /** A finger is on the screen: nothing is written under it. */
    let touching = false;

    const write = (top: number) => {
      box.scrollTop = top;
      written = box.scrollTop;
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      moving = null;
    };
    const step = (now: number) => {
      frame = 0;
      if (!following || touching) {
        moving = null;
        return;
      }
      const goal = footOf(box);
      const seconds = lastFrame ? (now - lastFrame) / 1000 : 1 / 60;
      lastFrame = now;
      moving = stepSpring(moving ?? { value: box.scrollTop, velocity: 0 }, goal, force, seconds);
      if (atRest(moving, goal, 0.5)) {
        write(goal);
        moving = null;
        return;
      }
      write(moving.value);
      frame = requestAnimationFrame(step);
    };
    /** Follows the foot on `settle`, from where the view is or already moves. */
    const glide = () => {
      if (!following || touching) return;
      if (reduced.matches) {
        write(footOf(box));
        return;
      }
      if (frame || aboveFoot(box) < 0.5) return;
      lastFrame = 0;
      frame = requestAnimationFrame(step);
    };
    /**
     * While the view keeps to the foot, the browser must not anchor it to a line further up
     * (it would move the view when something above changes size, and that move would read as
     * the reader's). Left alone, the reader keeps the browser's anchoring: what they read stays
     * put when an answer above opens a fold.
     */
    const keep = (next: boolean) => {
      following = next;
      box.style.overflowAnchor = next ? "none" : "";
    };
    const leave = () => {
      if (!following) return;
      keep(false);
      stop();
      setAway(aboveFoot(box) > AT_FOOT);
    };

    // A conversation opens at its foot, without motion.
    keep(true);
    write(footOf(box));

    const onScroll = () => {
      // The scroll this code caused.
      if (Math.abs(box.scrollTop - written) < 1) return;
      written = Number.NaN;
      if (aboveFoot(box) <= AT_FOOT) {
        // Back at the foot, by the reader's own hand: keep to it again.
        if (!following) {
          keep(true);
          setAway(false);
        }
        return;
      }
      // Anything else that moved the view (a wheel, a finger, the scroll bar, a link to an
      // entry further up) leaves the reader where they went.
      if (following) {
        keep(false);
        stop();
      }
      setAway(true);
    };
    // Where everything is in view there is no further up: a wheel or a key that asks for it
    // moves nothing, and the view still follows once an answer outgrows the box.
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0 && footOf(box) > 0) leave();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (movesUp(event) && footOf(box) > 0) leave();
    };
    const onTouchStart = () => {
      touching = true;
      stop();
    };
    const onTouchEnd = () => {
      touching = false;
      glide();
    };
    // Opening a fold inside an answer (a step of a trace, the sources) keeps the reader with it:
    // what opens is not pulled away from under the pointer. The key of a menu or another popup
    // (`aria-haspopup`) opens nothing in the page, and leaves the view following.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[aria-expanded="false"]:not([aria-haspopup]), summary')) leave();
    };

    // An observer first reports the size it starts with. What changed by then (a font that
    // arrived) is part of opening, which does not move: the view is put at the foot at once.
    let opened = false;
    let height = 0;
    const grown = new ResizeObserver(() => {
      const shorter = inner.offsetHeight < height;
      height = inner.offsetHeight;
      if (!opened) {
        opened = true;
        if (following) write(footOf(box));
        return;
      }
      if (following) glide();
      else if (shorter && aboveFoot(box) <= AT_FOOT) {
        // A fold that closes again brings the reader back to the foot without a scroll: as
        // when they scroll there, the view keeps to it again.
        keep(true);
        setAway(false);
      } else setAway(aboveFoot(box) > AT_FOOT);
    });
    grown.observe(inner);
    // The box itself changed: the phone's keyboard, the prompt below growing. The foot stays
    // where it is on every frame, so nothing is glided.
    const resized = new ResizeObserver(() => {
      if (following && !touching) {
        stop();
        write(footOf(box));
      }
    });
    resized.observe(box);

    box.addEventListener("scroll", onScroll, { passive: true });
    box.addEventListener("wheel", onWheel, { passive: true });
    box.addEventListener("keydown", onKeyDown);
    box.addEventListener("touchstart", onTouchStart, { passive: true });
    box.addEventListener("touchend", onTouchEnd);
    box.addEventListener("touchcancel", onTouchEnd);
    inner.addEventListener("click", onClick, { capture: true });

    const unregister = register?.({
      toLatest: (focus) => {
        keep(true);
        setAway(false);
        if (focus) box.focus({ preventScroll: true });
        if (reduced.matches) {
          write(footOf(box));
          return;
        }
        // From far up the view jumps closer first, and glides the rest.
        const from = glideFrom(box);
        if (Math.abs(from - box.scrollTop) >= 1) {
          stop();
          write(from);
        }
        glide();
      },
    });

    return () => {
      unregister?.();
      stop();
      grown.disconnect();
      resized.disconnect();
      box.removeEventListener("scroll", onScroll);
      box.removeEventListener("wheel", onWheel);
      box.removeEventListener("keydown", onKeyDown);
      box.removeEventListener("touchstart", onTouchStart);
      box.removeEventListener("touchend", onTouchEnd);
      box.removeEventListener("touchcancel", onTouchEnd);
      inner.removeEventListener("click", onClick, { capture: true });
    };
  }, [report, register]);

  return (
    <div
      ref={scroller}
      data-slot="conversation-scroller"
      data-scroll-fade="y"
      // While it follows the foot, only the top fades: a fade at the foot would come and go
      // with every piece of an answer.
      data-fade-edges={shared?.away ? undefined : "start"}
      role="region"
      aria-label={label ?? messages.conversation.label}
      // A region that scrolls must be reachable from the keyboard.
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-hidden"
    >
      <div
        ref={mergeRefs(content, ref)}
        data-slot="conversation-content"
        data-live={live ? "" : undefined}
        className={cn("flex flex-col gap-8", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export type ConversationLatestProps = Omit<ComponentProps<"span">, "children"> & {
  /** The key's words. */
  label?: string;
};

/**
 * The key that leads back to the newest message. It stands centred above the conversation's
 * foot and only while the reader has left it: it rises in on `settle` and leaves by fading.
 * Pressed, the view glides back down (from far up it jumps closer first), keeps to the foot
 * again, and the keyboard focus goes to the conversation.
 */
export function ConversationLatest({ label, className, ...props }: ConversationLatestProps) {
  const { messages } = useLocale();
  const shared = useContext(SharedContext);
  const shown = shared?.away ?? false;
  return (
    <div
      data-slot="conversation-latest-place"
      className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"
    >
      <span
        data-slot="conversation-latest"
        data-shown={shown ? "" : undefined}
        inert={!shown}
        className={cn("pointer-events-auto", className)}
        {...props}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={() => shared?.engine.current?.toLatest(true)}
        >
          <Icon icon={ArrowDown01Icon} size={14} />
          {label ?? messages.conversation.latest}
        </Button>
      </span>
    </div>
  );
}
