"use client";

import {
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { advancePieces, type PieceEnds, staggerDelays } from "./arriving-pieces";
import { useReducedMotion } from "./reduced-motion";

/**
 * Pieces of one look fade in this far apart at most, and all within this span (ms). Fading in
 * by words was chosen over a line at a time, once it is full (Justin, 2026-11-19).
 */
const WORD_STEP = 40;
const SPAN = 240;
/** How long a fade on `settle` takes in CSS, after its delay (motion.generated.css). */
const FADE = 500;

/** Elements whose text arrives whole: code, pictures, formulas, form controls. */
const whole = new Set(["pre", "svg", "math", "script", "style", "textarea", "select"]);

/**
 * A component that draws its children as text and may be looked into, although its children
 * are a plain string: a link, inline code. Other components with a string for children (a
 * Markdown renderer that is handed the source) are left whole.
 */
export type CarriesText = { carriesText?: boolean };

/**
 * The look of a piece. `data-arriving` is never rendered: the engine sets it on a new piece
 * before it is painted and takes it away when its fade begins.
 */
const pieceLook = "transition-opacity spring-settle data-arriving:opacity-0";

type Visit = (text: string, path: string) => ReactNode;

/** The caller's tree with each string handed to `visit`; everything else as it was. */
function walk(node: ReactNode, path: string, visit: Visit): ReactNode {
  if (typeof node === "string") return visit(node, path);
  if (typeof node === "number" || typeof node === "bigint") return visit(String(node), path);
  if (Array.isArray(node)) {
    return (node as ReactNode[]).map((child, index) => walk(child, `${path}.${index}`, visit));
  }
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<{ children?: ReactNode }>;
  const { type } = element;
  const children = element.props.children;
  if (children === undefined || children === null || typeof children === "boolean") return node;
  if (typeof children === "function") return node;
  if (typeof type === "string") {
    if (whole.has(type)) return node;
  } else if (type !== Fragment && typeof children === "string") {
    if (!(type as CarriesText).carriesText) return node;
  }
  if (Array.isArray(children)) {
    const walked = (children as ReactNode[]).map((child, index) =>
      walk(child, `${path}.${index}`, visit),
    );
    return cloneElement(element, undefined, ...walked);
  }
  return cloneElement(element, undefined, walk(children, `${path}.0`, visit));
}

/** Every string of a tree by its place in it, in reading order. */
function textsOf(children: ReactNode) {
  const texts = new Map<string, string>();
  void walk(children, "t", (text, path) => {
    texts.set(path, text);
    return null;
  });
  return texts;
}

/** One string as it is shown: where its pieces end, and the look in which each was born. */
type Shown = { ends: PieceEnds; born: readonly number[] };

/** What the text looks like now, and from what it was worked out. */
type Look = {
  source: ReactNode;
  streaming: boolean;
  /** Counts the looks; a piece born in one is new in it. 0 is what stood when it appeared. */
  generation: number;
  texts: ReadonlyMap<string, Shown>;
};

/** The first look: everything there is shown at once. */
function firstLook(children: ReactNode, streaming: boolean): Look {
  const texts = new Map<string, Shown>();
  for (const [path, text] of textsOf(children)) {
    texts.set(path, text.length > 0 ? { ends: [text.length], born: [0] } : { ends: [], born: [] });
  }
  return { source: children, streaming, generation: 0, texts };
}

/** The next look: what is new since the last one becomes pieces of this one. */
function nextLook(before: Look, children: ReactNode, streaming: boolean): Look {
  const generation = before.generation + 1;
  const strings = textsOf(children);
  const last = [...strings.keys()].at(-1);
  const texts = new Map<string, Shown>();
  for (const [path, text] of strings) {
    const old = before.texts.get(path) ?? { ends: [], born: [] };
    const { ends, fresh } = advancePieces(old.ends, text, {
      // Only the last string can still be in the middle of a word.
      complete: !streaming || path !== last,
    });
    const born = [...old.born.slice(0, fresh), ...ends.slice(fresh).map(() => generation)];
    texts.set(path, { ends, born });
  }
  return { source: children, streaming, generation, texts };
}

/** The caller's tree with its strings cut into the pieces of a look. */
function draw(children: ReactNode, look: Look): ReactNode {
  return walk(children, "t", (text, path) => {
    const shown = look.texts.get(path);
    if (!shown) return text;
    let start = 0;
    return (
      <Fragment key={path}>
        {shown.ends.map((end, index) => {
          const piece = (
            <span
              key={index}
              data-slot="message-piece"
              data-born={shown.born[index]}
              className={pieceLook}
            >
              {text.slice(start, end)}
            </span>
          );
          start = end;
          return piece;
        })}
      </Fragment>
    );
  });
}

/**
 * Text that is still being written, faded in piece by piece. It takes the tree the caller has
 * rendered (paragraphs, lists, links, from Markdown or not) and cuts each string in it into
 * pieces of a few words; a piece that is new since the last render fades in on `settle`, a few
 * pieces 40ms apart and a burst pressed into 240ms. Nothing travels: the words are being read.
 *
 * What a component draws from its props, or as HTML, arrives whole; so does code. Hand over
 * the rendered elements, not a component that renders the Markdown itself: from the outside
 * its text cannot be seen.
 *
 * What the text holds when it mounts is there at once. Once `streaming` is over and the last
 * piece has faded in, the pieces go and the caller's tree is rendered as it is. Under reduced
 * motion there are no pieces at all.
 */
export function useArrivingText(
  children: ReactNode,
  { streaming, box }: { streaming: boolean; box: RefObject<HTMLElement | null> },
): ReactNode {
  const reduced = useReducedMotion();
  // A text that is complete when it mounts needs none of this.
  const [plain, setPlain] = useState(!streaming);
  const [look, setLook] = useState(() => firstLook(children, streaming));
  // State that follows the props, worked out while rendering as React asks.
  if (streaming && plain) {
    setPlain(false);
    setLook(firstLook(children, streaming));
  } else if (!plain && (look.source !== children || look.streaming !== streaming)) {
    setLook(nextLook(look, children, streaming));
  }
  const active = !plain && !reduced;

  /** The last look whose new pieces were set off. */
  const handled = useRef(0);
  useLayoutEffect(() => {
    const root = box.current;
    // The text began again (a new answer in the same message): its count starts over.
    if (look.generation < handled.current) handled.current = look.generation;
    if (!active || !root || handled.current >= look.generation) return;
    const since = handled.current;
    handled.current = look.generation;

    // New pieces stand at nothing before anyone sees them.
    const fresh = [...root.querySelectorAll<HTMLElement>("[data-born]")].filter(
      (piece) => Number(piece.dataset.born) > since,
    );
    if (fresh.length === 0) return;
    for (const piece of fresh) piece.setAttribute("data-arriving", "");
    // Lay the page out once, so they have stood at nothing and their fade has a start.
    void root.offsetHeight;
    const delays = staggerDelays(fresh.length, WORD_STEP, SPAN);
    fresh.forEach((piece, index) => {
      piece.style.transitionDelay = `${delays[index] ?? 0}ms`;
      piece.removeAttribute("data-arriving");
    });
  }, [active, look, box]);

  // Once the text is complete and its last pieces have faded in, the pieces go.
  useEffect(() => {
    if (streaming || plain) return;
    const timer = window.setTimeout(() => setPlain(true), SPAN + FADE + 100);
    return () => window.clearTimeout(timer);
  }, [streaming, plain]);

  return active ? draw(children, look) : children;
}
