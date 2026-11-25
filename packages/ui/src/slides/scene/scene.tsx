"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";
import type { IconGlyph } from "@/slides/icon/icons";
import { span } from "@/slides/lib/grid";
import { useSlideStep } from "@/slides/step/step-context";
import type { StepCounter } from "@/slides/step/steps";

import {
  type Camera,
  cameraAt,
  cameraTransform,
  isNear,
  sameCamera,
  type Size,
  TRAVEL_MS,
} from "./camera";
import {
  arrivalDelays,
  type BeatState,
  entryState,
  layoutWorld,
  type PlacedGroup,
  type PlacedNode,
  type PlacedWire,
  sceneBeats,
  type SceneTone,
} from "./world";

export type SceneProps = {
  /**
   * The diagram the camera moves over: define it once as a const of the deck and give the same
   * world to every slide that walks through it, so the audience keeps its bearings.
   *
   * `nodes`: a box each, with an `id` (anything but `"all"`), a `label` of about 14 characters
   * and a `detail` line of about 18 (both 24px; what is longer is cut off), an optional `icon`
   * from `ICONS` or `MARKS` (`{ name: string; color: string | null; path: string; box?: number }`).
   * Place it on the world's grid with `col` and `row` (from 1; a column every 416 units, a row
   * every 144, a node 320 by 112) and `span` / `rows` for a larger one, or in world units with
   * `x`, `y`, `w`, `h`. `tone`: `plain` (default), `quiet` for what stands apart (a person, an
   * outside service), `solid` for what a part of the system hands on (a result, a document),
   * `ghost` (dashed) for something shown in full elsewhere.
   *
   * `groups`: a frame with a `label` (and a muted `detail`) around some nodes, 24 units past
   * them, its label above its top left corner. Groups side by side may take neighbouring
   * columns; a group under another needs a free row above it, where its label stands.
   *
   * `wires`: lines between nodes, by id. They leave the right edge and enter the left edge, so
   * lay the world out to read from left to right; a wire back (to a node further left) runs under
   * the boxes (`via: "above"` over them), and a wire to a node below runs down. `dashed` for what
   * happens only sometimes; `id` names a wire for a beat's `show`. `route`: `curve` (default)
   * draws smooth curves, `elbow` right angles.
   */
  world: {
    nodes: ReadonlyArray<{
      id: string;
      label: string;
      detail?: string;
      icon?: IconGlyph;
      tone?: "plain" | "quiet" | "solid" | "ghost";
      col?: number;
      row?: number;
      span?: number;
      rows?: number;
      x?: number;
      y?: number;
      w?: number;
      h?: number;
    }>;
    groups?: ReadonlyArray<{
      id: string;
      label: string;
      detail?: string;
      nodes: readonly string[];
    }>;
    wires?: ReadonlyArray<{
      from: string;
      to: string;
      id?: string;
      dashed?: boolean;
      via?: "below" | "above";
    }>;
    route?: "curve" | "elbow";
  };
  /**
   * The clicks of the slide: the first beat is how the slide opens, each further beat one click.
   * Each should make a good still picture on its own: the presenter's preview and a PDF of one
   * beat are stills.
   *
   * `view`: where the camera looks: `"all"`, the id of a node or group, several ids (the camera
   * fits them all), or a rectangle `{ x, y, w, h }` in world units. Without one the camera stays
   * where the beat before left it (the first beat looks at `"all"`). The view stands at the top
   * left of the scene (`align`: `"center"` or `"end"` moves it across); what else fits wholly in
   * the scene is drawn too, and what would be cut by its edge is not. A world unit is never drawn
   * larger than a px, and below three quarters of that the nodes lose their text and become
   * blocks: zoom in to read, out to show the shape.
   *
   * `show`: node, group or wire ids that arrive at this beat and stay. What no beat shows is
   * there from the start; a group comes with its first node, a wire when both its ends are there.
   *
   * `highlight`: node or group ids that stand out with an accent edge while the rest dims. Name
   * what the caption talks about, nothing more.
   *
   * `loop`: node ids in order around a cycle; the wires between them (and from the last back to
   * the first) turn into a dashed accent line that marches while the slide is presented, and a
   * mark walks from node to node.
   *
   * `caption`: one or two lines (32px) under the scene that say what this beat shows. Start with
   * the point in `<b>`.
   */
  beats: ReadonlyArray<{
    view?: string | readonly string[] | { x: number; y: number; w: number; h: number };
    align?: "start" | "center" | "end";
    show?: readonly string[];
    highlight?: readonly string[];
    loop?: readonly string[];
    caption?: ReactNode;
  }>;
  /** What the whole world shows, in one or two sentences, for screen readers and exports. */
  alt: string;
  /** Height of the scene in px, 464 by default: room for a two-line title and two caption lines. */
  height?: number;
  /**
   * Where the camera stands when the slide comes on (a view, as in `beats`), when this slide
   * continues the one before on the same world: give the view the slide before ended on, and the
   * camera travels on from there instead of everything arriving anew.
   */
  from?: string | readonly string[] | { x: number; y: number; w: number; h: number };
};

/** The scene is as wide as the slide's content: twelve columns. */
const WIDTH = span(12);
// 792px of content, less a two-line title (153), two gaps (64), the 24px above the caption and
// two caption lines (87).
const DEFAULT_HEIGHT = 464;

// What arrives rises 18px and fades in, 0.55s after its delay on the reference's `--ease`
// (cubic-bezier(.16, .84, .2, 1): it settles quickly); what leaves the box fades out. Only where
// the slide is presented; under reduced motion nothing rises. (Class names are written out
// whole: Tailwind finds them in the source.)
const ARRIVE = cn(
  "data-[state=absent]:opacity-0 data-[state=away]:opacity-0",
  "data-[state=absent]:translate-y-[calc(18px/var(--scene-z))] motion-reduce:data-[state=absent]:translate-y-0",
  "in-data-slides-live:transition-[opacity,translate] in-data-slides-live:duration-[550ms]",
  "in-data-slides-live:delay-(--scene-delay) in-data-slides-live:ease-[cubic-bezier(.16,.84,.2,1)]",
);

// Dimming and lighting up: 0.35s, as the reference's cards and frames.
const CHANGE =
  "in-data-slides-live:transition-[opacity,background-color,border-color,color] in-data-slides-live:duration-[350ms]";

// A node's fill and edge by tone, at rest and standing out. Zoomed out (`data-zoom="far"` on the
// world) a node is a filled block; the walking mark of a loop (`data-pulse`) fills it in the
// accent.
const CARD: Record<SceneTone, { rest: string; lit: string }> = {
  plain: {
    rest: "border-line bg-surface in-data-[zoom=far]:bg-line",
    lit: "border-accent bg-surface in-data-[zoom=far]:bg-accent",
  },
  quiet: {
    rest: "border-surface-quiet bg-surface-quiet in-data-[zoom=far]:border-line in-data-[zoom=far]:bg-line",
    lit: "border-accent bg-surface-quiet in-data-[zoom=far]:bg-accent",
  },
  solid: { rest: "border-fg bg-fg", lit: "border-accent bg-accent" },
  ghost: { rest: "border-dashed border-line", lit: "border-dashed border-accent" },
};
const PULSE = "data-pulse:border-accent data-pulse:bg-accent";

const LABEL: Record<SceneTone, { rest: string; lit: string }> = {
  plain: { rest: "font-semibold text-fg", lit: "font-semibold text-fg" },
  quiet: { rest: "font-semibold text-fg", lit: "font-semibold text-fg" },
  solid: { rest: "font-semibold text-ground", lit: "font-semibold text-ground" },
  ghost: { rest: "text-fg-body", lit: "text-fg-body" },
};
const DETAIL: Record<SceneTone, { rest: string; lit: string }> = {
  plain: { rest: "text-fg-muted", lit: "text-fg-muted" },
  quiet: { rest: "text-fg-muted", lit: "text-fg-muted" },
  solid: { rest: "text-ground opacity-70", lit: "text-ground opacity-80" },
  ghost: { rest: "text-fg-muted", lit: "text-fg-muted" },
};

/** A dimmed wire, beside what stands out. */
const WIRE_DIM = 0.2;

/** A line weight that stays the same on screen whatever the camera's scale. */
const onScreen = (px: number) => `calc(${px}px / var(--scene-z))`;

/** The state a node, group or wire is drawn in: shown, there but outside the box, not there yet. */
function stateOf(state: BeatState, id: string): "shown" | "away" | "absent" {
  if (state.visible.has(id)) return "shown";
  return state.present.has(id) ? "away" : "absent";
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Writes a camera onto the world's layer, as the render does, between renders. */
function placeWorld(layer: HTMLElement, camera: Camera) {
  layer.style.transform = cameraTransform(camera);
  layer.style.setProperty("--scene-z", String(camera.scale));
  layer.dataset.zoom = isNear(camera.scale) ? "near" : "far";
}

/** A pictogram in the accent, a mark in its product's colour, on the node's own text otherwise. */
function SceneIcon({ icon, tone, lit }: { icon: IconGlyph; tone: SceneTone; lit: boolean }) {
  const box = icon.box ?? 24;
  const own = icon.color !== null && icon.color !== "accent" ? icon.color : undefined;
  const fill =
    own !== undefined
      ? undefined
      : tone === "solid"
        ? lit
          ? "fill-on-accent"
          : "fill-ground"
        : icon.color === "accent"
          ? "fill-accent"
          : "fill-fg";
  return (
    <svg
      aria-hidden="true"
      width={24}
      height={24}
      viewBox={`0 0 ${box} ${box}`}
      className={cn("flex-none", fill, own === undefined && "in-data-pulse:fill-on-accent")}
    >
      <path d={icon.path} style={own === undefined ? undefined : { fill: own }} />
    </svg>
  );
}

function SceneNodeView({
  placed,
  state,
  delay,
}: {
  placed: PlacedNode;
  state: BeatState;
  delay: number;
}) {
  const { node, rect } = placed;
  const tone = node.tone ?? "plain";
  const lit = state.highlight.has(placed.id);
  const look = lit ? "lit" : "rest";
  return (
    <div
      data-slot="slide-scene-node"
      data-state={stateOf(state, placed.id)}
      className={cn("absolute", ARRIVE)}
      style={
        {
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          "--scene-delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      <div
        data-node={placed.id}
        data-dim={state.focus && !lit ? "" : undefined}
        className={cn("absolute inset-0 data-dim:opacity-45", CARD[tone][look], PULSE, CHANGE)}
        style={{ borderWidth: onScreen(lit ? 2 : 1), borderRadius: onScreen(4) }}
      >
        {/* The text stays 24px on screen: a box at the camera's scale, scaled back by 1/scale. */}
        <div
          className="absolute top-0 left-0 flex origin-top-left flex-col justify-center gap-2 px-4 in-data-slides-live:transition-opacity in-data-slides-live:duration-[250ms] in-data-[zoom=far]:opacity-0"
          style={{
            width: "calc(100% * var(--scene-z))",
            height: "calc(100% * var(--scene-z))",
            scale: "calc(1 / var(--scene-z))",
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {node.icon ? <SceneIcon icon={node.icon} tone={tone} lit={lit} /> : null}
            <p
              className={cn(
                "min-w-0 truncate text-slide-meta in-data-pulse:text-ground",
                LABEL[tone][look],
              )}
            >
              {node.label}
            </p>
          </div>
          {node.detail !== undefined ? (
            <p
              className={cn(
                "truncate text-slide-meta in-data-pulse:text-ground",
                DETAIL[tone][look],
              )}
            >
              {node.detail}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SceneGroupView({
  placed,
  state,
  delay,
}: {
  placed: PlacedGroup;
  state: BeatState;
  delay: number;
}) {
  const { group, rect } = placed;
  const lit = state.highlight.has(placed.id);
  return (
    <div
      data-slot="slide-scene-group"
      data-state={stateOf(state, placed.id)}
      className={cn("absolute", ARRIVE)}
      style={
        {
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          "--scene-delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      <div
        data-dim={state.focus && !lit ? "" : undefined}
        className={cn(
          "absolute inset-0 data-dim:opacity-50",
          lit ? "border-accent" : "border-line",
          CHANGE,
        )}
        style={{ borderWidth: onScreen(lit ? 2 : 1), borderRadius: onScreen(4) }}
      >
        {/* The label stands above the frame's corner, 24px on screen, 8px above the edge. */}
        <p
          className="absolute top-0 left-0 flex origin-bottom-left items-baseline gap-3 pb-2 text-slide-meta whitespace-nowrap"
          style={{ translate: "0 -100%", scale: "calc(1 / var(--scene-z))" }}
        >
          <span className="font-semibold text-fg">{group.label}</span>
          {group.detail !== undefined ? (
            <span className="text-fg-muted">{group.detail}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function SceneWireView({
  placed,
  state,
  delay,
}: {
  placed: PlacedWire;
  state: BeatState;
  delay: number;
}) {
  const { key, wire, d } = placed;
  const present = state.present.has(key);
  const shown = state.visible.has(key);
  const lit = state.highlight.has(key);
  const looping = state.loopWires.has(key);
  const opacity = !shown || looping ? 0 : state.focus && !lit ? WIRE_DIM : 1;
  const stroke = lit ? "stroke-accent" : "stroke-line";
  const timing = { "--scene-delay": `${delay}ms` } as CSSProperties;
  return (
    <>
      {wire.dashed ? (
        // A dashed wire cannot draw itself (its dashes are its pattern): it fades in instead.
        <path
          data-slot="slide-scene-wire"
          d={d}
          className={cn(
            stroke,
            "in-data-slides-live:[transition:opacity_.6s_ease_var(--scene-delay),stroke_.35s]",
          )}
          style={{
            ...timing,
            opacity: present ? opacity : 0,
            strokeWidth: onScreen(2),
            strokeDasharray: `${onScreen(8)} ${onScreen(8)}`,
          }}
        />
      ) : (
        // Drawn by its dash: one dash as long as the path, pushed off it until the wire is there.
        <path
          data-slot="slide-scene-wire"
          d={d}
          pathLength={1}
          className={cn(
            stroke,
            "in-data-slides-live:[transition:opacity_.35s,stroke_.35s]",
            "in-data-slides-live:motion-safe:[transition:stroke-dashoffset_.6s_ease_var(--scene-delay),opacity_.35s,stroke_.35s]",
          )}
          style={{
            ...timing,
            opacity,
            strokeWidth: onScreen(2),
            strokeDasharray: 1,
            strokeDashoffset: present ? 0 : 1,
          }}
        />
      )}
      {/* The same wire as part of a loop: a dashed accent line that marches while presented. */}
      <path
        data-slot="slide-scene-loop"
        data-wire={key}
        d={d}
        className="stroke-accent in-data-slides-live:transition-opacity in-data-slides-live:duration-[350ms]"
        style={{
          opacity: looping && shown ? 1 : 0,
          strokeWidth: onScreen(3),
          strokeDasharray: `${onScreen(9)} ${onScreen(7)}`,
        }}
      />
    </>
  );
}

/** The beat at a step: the last one where nobody steps. */
function beatAt(step: number, count: number): number {
  if (!Number.isFinite(step)) return count - 1;
  return Math.min(count - 1, Math.max(0, Math.trunc(step)));
}

function stateAt(states: readonly BeatState[], index: number): BeatState {
  const state = states[index];
  if (!state) throw new Error(`Scene: no beat ${index}.`);
  return state;
}

/**
 * One large diagram that a camera moves over, beat by beat: the part for a system the talk walks
 * through (how an inquiry becomes an appointment, what happens behind a website), where the
 * audience should see the whole, then each part close up, and never lose its place.
 *
 * Each click is a beat: the camera travels to what the beat looks at (0.9 seconds, eased in and
 * out), what the beat brings in arrives (boxes rise in column by column, wires draw themselves
 * once both their ends are there), what the beat talks about stands out and the rest dims, and
 * the caption under the scene changes. Nothing outside the current beat is removed, only dimmed
 * or left outside the picture, so the world stays one place. Without a presenter (a plain `Deck`,
 * the print, the check) the scene shows its last beat, standing still; the presenter's preview
 * and a PDF of one beat show that beat, standing still.
 *
 * When not. Anything that fits one still diagram is a `Diagram`; a sequence of steps without a
 * place is `Steps` or `Flow`. A scene is for one world that several slides (or many beats) share:
 * define the world once and give it to each slide, with `from` on the slides that continue the one
 * before. At most about eight beats on a slide, and every beat gets a caption.
 *
 * How. Lay the world out left to right on its grid, nodes of one kind the same size, groups side
 * by side. Open each slide wide (`"all"` or a group), then go close. The
 * title says what the whole slide shows; the captions say what each beat adds. The world is one
 * picture for screen readers (`alt`); the captions are read as text.
 */
export function Scene({ world, beats, alt, height = DEFAULT_HEIGHT, from }: SceneProps) {
  const { step, live } = useSlideStep();
  const box = useMemo<Size>(() => ({ w: WIDTH, h: height }), [height]);
  const layout = useMemo(() => layoutWorld(world), [world]);
  const states = useMemo(() => sceneBeats(layout, beats, box), [layout, beats, box]);
  const beat = beatAt(step, states.length);

  // A presented slide that opens on its first beat starts one frame before it (`entryState`), so
  // that what the first beat brings in can arrive. Everywhere else the beat is drawn at once.
  const [entered, setEntered] = useState(() => !(live && beat === 0));
  useEffect(() => {
    if (entered) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [entered]);

  const shownAt = entered ? beat : -1;
  const entry = useMemo(
    () => entryState(layout, stateAt(states, 0), from, box),
    [layout, states, from, box],
  );
  const state = shownAt === -1 ? entry : stateAt(states, shownAt);

  // The beat drawn before this one: what arrives now is what was not there then.
  const [drawn, setDrawn] = useState(shownAt);
  const [before, setBefore] = useState(shownAt);
  if (drawn !== shownAt) {
    setBefore(drawn);
    setDrawn(shownAt);
  }
  const delays = useMemo(() => {
    if (!live) return new Map<string, number>();
    const earlier = before === -1 ? entry : stateAt(states, before);
    return arrivalDelays(layout, earlier.present, state.present);
  }, [live, before, entry, states, layout, state]);
  const delayOf = (id: string) => delays.get(id) ?? 0;

  // The camera. The render places the world where the beat puts it; while presented, this
  // effect then flies it there from where it stands, writing the layer on every frame.
  const layer = useRef<HTMLDivElement>(null);
  const onScreenNow = useRef<Camera>(state.camera);
  const { x, y, scale } = state.camera;
  useLayoutEffect(() => {
    const element = layer.current;
    if (!element) return;
    const target = { x, y, scale };
    const start = onScreenNow.current;
    if (!live || reducedMotion() || sameCamera(start, target)) {
      onScreenNow.current = target;
      placeWorld(element, target);
      return;
    }
    const begun = performance.now();
    let frame = 0;
    const fly = (now: number) => {
      const camera = cameraAt(start, target, box, (now - begun) / TRAVEL_MS);
      onScreenNow.current = camera;
      placeWorld(element, camera);
      if (now - begun < TRAVEL_MS) frame = requestAnimationFrame(fly);
    };
    // Before the first paint: the render has just placed the world at the target.
    placeWorld(element, start);
    frame = requestAnimationFrame(fly);
    return () => cancelAnimationFrame(frame);
  }, [x, y, scale, live, box]);

  // A loop, while presented: once the camera has arrived its wires march (1.2s for 16px, as in
  // the reference) and a mark walks its nodes, 0.42s a node and 1.1s after the last.
  const loopKey = state.loop.join("\n");
  const loopWiresKey = [...state.loopWires].filter((key) => state.visible.has(key)).join("\n");
  useEffect(() => {
    const element = layer.current;
    if (!element || !live || loopKey === "" || reducedMotion()) return;
    const find = <T extends Element>(attribute: string, id: string) =>
      element.querySelector<T>(`[${attribute}="${CSS.escape(id)}"]`);
    const nodes = loopKey.split("\n").map((id) => find<HTMLElement>("data-node", id));
    const paths =
      loopWiresKey === ""
        ? []
        : loopWiresKey.split("\n").map((key) => find<SVGPathElement>("data-wire", key));
    const marching: Animation[] = [];
    let timer = 0;
    let walked = 0;
    const walk = () => {
      nodes.forEach((node, index) =>
        node?.toggleAttribute("data-pulse", index === walked % nodes.length),
      );
      walked += 1;
      timer = window.setTimeout(walk, walked % nodes.length === 0 ? 1100 : 420);
    };
    const start = window.setTimeout(() => {
      for (const path of paths) {
        const march = path?.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -16 / scale }], {
          duration: 1200,
          iterations: Infinity,
          easing: "linear",
        });
        if (march) marching.push(march);
      }
      walk();
    }, TRAVEL_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer);
      for (const animation of marching) animation.cancel();
      for (const node of nodes) node?.removeAttribute("data-pulse");
    };
  }, [live, loopKey, loopWiresKey, scale]);

  const { bounds } = layout;
  const captions = beats.some((plan) => plan.caption != null);

  return (
    <div data-slot="slide-scene" className="flex flex-none flex-col gap-6" style={{ width: WIDTH }}>
      <div
        data-slot="slide-scene-view"
        // The view shows a part of the world on purpose: the check does not call that cut off.
        data-crop=""
        role="img"
        aria-label={alt}
        className="relative flex-none overflow-hidden"
        style={{ width: WIDTH, height }}
      >
        <div
          ref={layer}
          data-slot="slide-scene-world"
          data-zoom={isNear(scale) ? "near" : "far"}
          className="absolute top-0 left-0 origin-top-left"
          style={
            {
              transform: cameraTransform(state.camera),
              "--scene-z": String(scale),
            } as CSSProperties
          }
        >
          {layout.groups.map((placed) => (
            <SceneGroupView
              key={placed.id}
              placed={placed}
              state={state}
              delay={delayOf(placed.id)}
            />
          ))}
          <svg
            data-slot="slide-scene-wires"
            aria-hidden="true"
            width={bounds.w}
            height={bounds.h}
            viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
            fill="none"
            className="absolute overflow-visible"
            style={{ left: bounds.x, top: bounds.y }}
          >
            {layout.wires.map((placed) => (
              <SceneWireView
                key={placed.key}
                placed={placed}
                state={state}
                delay={delayOf(placed.key)}
              />
            ))}
          </svg>
          {layout.nodes.map((placed) => (
            <SceneNodeView
              key={placed.id}
              placed={placed}
              state={state}
              delay={delayOf(placed.id)}
            />
          ))}
        </div>
      </div>
      {captions ? (
        <div data-slot="slide-scene-captions" className="grid slide-span-10">
          {beats.map((plan, index) => (
            <p
              key={index}
              data-slot="slide-scene-caption"
              data-lines="2"
              aria-hidden={index === beat ? undefined : true}
              className={cn(
                "col-start-1 row-start-1 text-slide-body text-fg-body",
                index === beat ? "visible opacity-100" : "invisible opacity-0",
                "in-data-slides-live:[transition:opacity_.35s_ease,visibility_.35s]",
              )}
            >
              {plan.caption}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

Scene.slideSteps = ((props) =>
  Math.max(0, props.beats.length - 1)) satisfies StepCounter<SceneProps>;
