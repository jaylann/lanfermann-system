import { isValidElement, type ReactNode } from "react";

import {
  maxStep,
  type StepAttributes,
  stepAttributes,
  type StepCounter,
} from "@/slides/step/steps";

export type TagProps = {
  /** One or two words in sentence case. */
  children: ReactNode;
};

/** The hairline box of a tag, with the step it may appear at. Shared by `Tag` and `Tags`. */
function TagBox({ children, step }: { children: ReactNode; step?: StepAttributes }) {
  return (
    <p
      data-slot="slide-tag"
      className="rounded-[2px] border border-line px-4 py-2 text-slide-meta text-fg"
      {...step}
    >
      {children}
    </p>
  );
}

/**
 * A word or two in a hairline box.
 *
 * Set tags in a row `div` with a 16px gap. They name things (trades, tools, places); they are not
 * buttons and never filled.
 */
export function Tag({ children }: TagProps) {
  return <TagBox>{children}</TagBox>;
}

/** A tag of `Tags` that appears at a step. */
type SteppedTag = { label: ReactNode; step?: number };

/** Whether an item of `Tags` is a tag with a step rather than the tag's words themselves. */
function isStepped(item: ReactNode | SteppedTag): item is SteppedTag {
  return (
    typeof item === "object" &&
    item !== null &&
    !isValidElement(item) &&
    !(Symbol.iterator in item) &&
    "label" in item
  );
}

export type TagsProps = {
  /** The tags, one or two words each. Eight at most in a row. A tag written as `{ label, step }` appears at that step of the slide; the others keep their places. */
  items: Array<ReactNode | { label: ReactNode; step?: number }>;
  /** A few words in front of the row that say what the tags are. */
  label?: ReactNode;
};

/**
 * A row of tags with a muted label in front: what varies, what counts, what is included.
 *
 * For a short enumeration that belongs under a table or a diagram and does not deserve rows of
 * its own: the parameters that vary, the kinds of error that are counted. The label is a phrase
 * without a colon. Reveal tags one by one only when each is named as the talk reaches it; a row
 * that is read at a glance stands whole.
 */
export function Tags({ items, label }: TagsProps) {
  return (
    <div data-slot="slide-tags" className="flex flex-wrap items-center gap-4">
      {label != null && <p className="pr-2 text-slide-meta text-fg-muted">{label}</p>}
      {items.map((item, index) =>
        isStepped(item) ? (
          <TagBox key={index} step={stepAttributes(item.step)}>
            {item.label}
          </TagBox>
        ) : (
          <TagBox key={index}>{item}</TagBox>
        ),
      )}
    </div>
  );
}

/** The highest `step` among the tags written as `{ label, step }`. */
Tags.slideSteps = ((props) =>
  maxStep(props.items.filter(isStepped))) satisfies StepCounter<TagsProps>;
