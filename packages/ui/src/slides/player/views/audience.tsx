"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowShrink01Icon,
  FullScreenIcon,
} from "@hugeicons/core-free-icons";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { Icon } from "@/components/icon/icon";
import { actionOfIntent, intentOfClick } from "@/slides/player/actions";
import { DeckSlide } from "@/slides/player/deck-slide";
import { useEmbed } from "@/slides/player/embed";
import {
  type PlayerStart,
  useActivity,
  useFullscreen,
  useHash,
  useKeys,
  usePlayerState,
  useReady,
} from "@/slides/player/hooks";
import { intentOfSwipe, type PlayerIntent } from "@/slides/player/input";
import { fill } from "@/slides/player/labels";
import {
  HEARTBEAT,
  isNewer,
  isRemoteIntent,
  openerWindow,
  openLink,
  type RemoteIntent,
  SILENCE,
} from "@/slides/player/sync";
import { Stage } from "@/slides/stage/stage";

import { barLink, iconButton, type ViewProps } from "./chrome";

/** The bar leaves this long after the last input, in ms. */
const IDLE = 2500;
/** A press that travelled further than this, in px, was a drag (a selection), not a click. */
const CLICK_SLOP = 4;
/** What a click on the slide is aimed at itself, and so does not step the deck. */
const INTERACTIVE = "a[href], button, input, select, textarea, summary, [contenteditable]";

type AudienceViewProps = ViewProps & {
  /** The address of the deck as a PDF, for the link in the bar. */
  pdf?: string;
  /** The session of a presenter's window this one follows. Without it the window moves itself. */
  session?: string;
  start?: PlayerStart;
  now: () => number;
  /** Whether the address follows the slide, and moves it. */
  hash: boolean;
  /** In a frame: the framing page is told where the deck is and may move it (see embed.ts). */
  embedded: boolean;
};

/**
 * What the audience sees: the current slide, as large as the window allows, and a small bar of
 * controls that leaves when nobody is at them. Keys, a clicker, a swipe and a click on either
 * half of the slide step the deck. There are no transitions between slides.
 *
 * In a session (the second window of a presenter) it shows what the presenter's window says and
 * sends its own keys there instead of moving. In a frame there is no session and no full screen:
 * the framing page is told where the deck is and moves it (embed.ts).
 */
export function AudienceView({
  entries,
  labels,
  lang,
  pdf,
  session: givenSession,
  start,
  now,
  hash,
  embedded,
}: AudienceViewProps) {
  // A frame cannot reach a presenter's window: its page relays instead.
  const session = embedded ? undefined : givenSession;
  const [state, dispatch] = usePlayerState(entries.length, start);
  const ids = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const { available, active: filled, toggle } = useFullscreen();
  const shown = useActivity(IDLE);
  const root = useRef<HTMLDivElement>(null);
  const remote = useRef<((intent: RemoteIntent) => void) | null>(null);
  useReady(root);

  useEffect(() => {
    if (!session) return;
    let last: number | null = null;
    let heard = performance.now();
    // Counted from the time, so a window that was reloaded is still newer than its earlier self.
    let seq = Date.now();
    const link = openLink({
      session,
      peer: openerWindow,
      onMessage(message) {
        if (message.type !== "state") return;
        heard = performance.now();
        if (!isNewer(message.seq, last)) return;
        last = message.seq;
        dispatch({ type: "sync", index: message.index, blackout: message.blackout });
      },
    });
    remote.current = (intent) => {
      seq += 1;
      link.send({ type: "intent", seq, intent });
    };
    link.send({ type: "hello" });
    // A presenter that was reloaded has forgotten this window: say hello again when it is quiet.
    const timer = window.setInterval(() => {
      if (performance.now() - heard > SILENCE) link.send({ type: "hello" });
    }, HEARTBEAT);
    return () => {
      window.clearInterval(timer);
      remote.current = null;
      link.close();
    };
  }, [session, dispatch]);

  const act = useCallback(
    (intent: PlayerIntent) => {
      if (intent === "fullscreen") {
        // A frame may not ask for the full screen; its page has the window.
        if (!embedded) toggle();
        return;
      }
      if (session) {
        if (isRemoteIntent(intent)) remote.current?.(intent);
        return;
      }
      // The grid is the console's.
      if (intent === "grid") return;
      const action = actionOfIntent(intent, now());
      if (action) dispatch(action);
    },
    [session, embedded, toggle, now, dispatch],
  );
  useKeys(act);

  const go = useCallback((index: number) => dispatch({ type: "go", index }), [dispatch]);
  useHash(state.index, ids, go, hash && !session);

  useEmbed({
    enabled: embedded,
    ids,
    index: state.index,
    blackout: state.blackout,
    onCommand(command) {
      if (command.type === "intent") act(command.intent);
      else if (command.blackout === undefined) go(command.index);
      else dispatch({ type: "sync", index: command.index, blackout: command.blackout });
    },
  });

  // The window around the slide takes the slide's ground, so the bands beside a slide that does
  // not fill the window are its own colour. Read from what is drawn: a slide kind knows its
  // ground without being told.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const ground = element.querySelector("[data-slide-ground]")?.getAttribute("data-slide-ground");
    element.setAttribute("data-slide-ground", ground ?? "paper");
  }, [state.index, state.blackout, entries]);

  const press = useRef<{ x: number; y: number; type: string } | null>(null);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;
    press.current = { x: event.clientX, y: event.clientY, type: event.pointerType };
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const from = press.current;
    press.current = null;
    if (!from) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    if (from.type === "touch") {
      const intent = intentOfSwipe(dx, dy);
      if (intent) act(intent);
      return;
    }
    // A click steps with a mouse only: a finger taps to bring the controls, a pen draws.
    if (from.type !== "mouse" || event.button !== 0) return;
    if (Math.hypot(dx, dy) > CLICK_SLOP) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
    const box = event.currentTarget.getBoundingClientRect();
    act(intentOfClick(event.clientX, box.left, box.width));
  };

  const entry = entries[state.index];
  const page = state.index + 1;
  const count = entries.length;

  return (
    <div
      ref={root}
      data-slot="player"
      data-mode="audience"
      lang={lang}
      className="relative h-dvh w-dvw overflow-hidden bg-ground font-sans"
    >
      {state.blackout ? (
        <div
          data-slot="player-blackout"
          role="img"
          aria-label={labels.blackScreen}
          className="absolute inset-0"
        />
      ) : (
        <Stage
          className="aspect-auto h-full touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            press.current = null;
          }}
        >
          {entry && <DeckSlide entry={entry} index={state.index} errorLabel={labels.slideError} />}
        </Stage>
      )}

      <div
        data-slot="player-controls"
        data-theme="ink"
        data-shown={shown ? "" : undefined}
        role="toolbar"
        aria-label={labels.controls}
        className="pointer-events-none absolute top-4 right-4 flex items-center gap-1 rounded-xl border border-line p-1 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100 data-shown:pointer-events-auto data-shown:opacity-100"
      >
        <button
          type="button"
          className={iconButton}
          aria-label={labels.previous}
          aria-disabled={state.index === 0 ? true : undefined}
          onClick={() => act("previous")}
        >
          <Icon icon={ArrowLeft01Icon} size={18} />
        </button>
        <p className="min-w-16 px-1 text-center text-sm font-medium text-fg tabular-nums">
          <span aria-hidden="true">{fill(labels.position, { page, count })}</span>
          <span className="sr-only">{fill(labels.slide, { page, count })}</span>
        </p>
        <button
          type="button"
          className={iconButton}
          aria-label={labels.next}
          aria-disabled={page === count ? true : undefined}
          onClick={() => act("next")}
        >
          <Icon icon={ArrowRight01Icon} size={18} />
        </button>
        {available && !embedded && (
          <button
            type="button"
            className={iconButton}
            aria-label={filled ? labels.exitFullscreen : labels.fullscreen}
            aria-keyshortcuts="F"
            onClick={toggle}
          >
            <Icon icon={filled ? ArrowShrink01Icon : FullScreenIcon} size={18} />
          </button>
        )}
        {pdf != null && (
          <>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
            <a href={pdf} download className={barLink}>
              {labels.pdf}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
