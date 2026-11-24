import { Children, type CSSProperties, isValidElement, type ReactNode } from "react";

/**
 * Steps: what a slide shows click by click.
 *
 * A slide has `steps` of them (0: it shows everything at once). At step `n` everything marked
 * with a step up to `n` is shown; what is marked higher is there, takes its place, and cannot be
 * seen yet. So nothing moves when a step is taken, it only appears.
 *
 * Two things carry a step through a slide:
 *
 * - **CSS, for plain markup.** A part marks an element with `stepAttributes(at)`: `data-step`
 *   and the custom property `--step-at`. Whoever shows the slide step by step sets
 *   `--slide-step` on an element around it (the player does, on the box of each slide), and
 *   `slides.css` works out from the two whether the element is shown. Without `--slide-step`
 *   everything is shown: a plain `Deck`, a print and the check see the whole slide.
 * - **Context, for a part that draws by step** (a scene's camera): `useSlideStep()` in
 *   `step-context.tsx`.
 *
 * How many steps a slide has is read from its element without drawing it (`countSteps`): the
 * player has to know before the slide is on screen, to step back into its last step.
 */

/** What marks an element as belonging to a step. Spread it onto the element. */
export type StepAttributes = {
  "data-step"?: number;
  style?: CSSProperties;
};

/**
 * The attributes of an element that appears at step `at`. Nothing for no step, 0 or less: such an
 * element is there from the start. A caller with a style of its own merges the two:
 * `style={{ ...step.style, width }}`.
 */
export function stepAttributes(at: number | undefined): StepAttributes {
  if (at === undefined || !Number.isFinite(at) || at <= 0) return {};
  const step = Math.trunc(at);
  // A custom property: not in React's style type.
  return { "data-step": step, style: { "--step-at": step } as CSSProperties };
}

/** The highest step among items that may each carry one, e.g. the columns of a `Columns`. */
export function maxStep(
  items: readonly ({ step?: number } | null | undefined)[] | undefined,
): number {
  let highest = 0;
  for (const item of items ?? []) {
    const at = item?.step;
    if (at !== undefined && Number.isFinite(at)) highest = Math.max(highest, Math.trunc(at));
  }
  return highest;
}

/**
 * A part says how many steps its props ask for with a static function of this name, so the count
 * can be read from an element without drawing it: `Columns.slideSteps = (props) =>
 * maxStep(props.items)`. A part without steps has none.
 */
export type StepCounter<Props> = (props: Props) => number;

type Counting = { slideSteps?: StepCounter<Record<string, unknown>> };

function counterOf(type: unknown): Counting["slideSteps"] {
  if (typeof type !== "function" && (typeof type !== "object" || type === null)) return undefined;
  const counter = (type as Counting).slideSteps;
  return typeof counter === "function" ? counter : undefined;
}

/**
 * How many steps what is written here asks for: the highest step of any element in the tree.
 * An element says so itself (`data-step` on plain markup, a part's `slideSteps`); the tree is
 * followed through `children` only, so what a deck's own component draws inside is not seen. Such
 * a component takes `steps` where it is used (see `flattenSlides`).
 */
export function countSteps(node: ReactNode): number {
  let highest = 0;
  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement<Record<string, unknown>>(child)) return;
      const { props } = child;
      const marked = props["data-step"];
      if (typeof marked === "number" && Number.isFinite(marked))
        highest = Math.max(highest, marked);
      const counted = counterOf(child.type)?.(props);
      if (counted !== undefined && Number.isFinite(counted)) highest = Math.max(highest, counted);
      visit(props.children as ReactNode);
    });
  };
  visit(node);
  return Math.max(0, Math.trunc(highest));
}

/**
 * The steps of one slide's element: `steps` where it is written on the element (a deck's own
 * wrapper has to say), otherwise what its element and its children ask for.
 */
export function stepsOfSlide(element: ReactNode): number {
  if (!isValidElement<{ steps?: unknown }>(element)) return 0;
  const { steps } = element.props;
  if (typeof steps === "number" && Number.isFinite(steps)) return Math.max(0, Math.trunc(steps));
  return countSteps(element);
}
