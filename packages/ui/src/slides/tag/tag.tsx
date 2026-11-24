import type { ReactNode } from "react";

export type TagProps = {
  /** One or two words in sentence case. */
  children: ReactNode;
};

/**
 * A word or two in a hairline box.
 *
 * Set tags in a row `div` with a 16px gap. They name things (trades, tools, places); they are not
 * buttons and never filled.
 */
export function Tag({ children }: TagProps) {
  return (
    <p
      data-slot="slide-tag"
      className="rounded-[2px] border border-line px-4 py-2 text-slide-meta text-fg"
    >
      {children}
    </p>
  );
}

export type TagsProps = {
  /** The tags, one or two words each. Eight at most in a row. */
  items: ReactNode[];
  /** A few words in front of the row that say what the tags are. */
  label?: ReactNode;
};

/**
 * A row of tags with a muted label in front: what varies, what counts, what is included.
 *
 * For a short enumeration that belongs under a table or a diagram and does not deserve rows of
 * its own: the parameters that vary, the kinds of error that are counted. The label is a phrase
 * without a colon.
 */
export function Tags({ items, label }: TagsProps) {
  return (
    <div data-slot="slide-tags" className="flex flex-wrap items-center gap-4">
      {label != null && <p className="pr-2 text-slide-meta text-fg-muted">{label}</p>}
      {items.map((item, index) => (
        <Tag key={index}>{item}</Tag>
      ))}
    </div>
  );
}
