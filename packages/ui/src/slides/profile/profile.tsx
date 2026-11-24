import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Split } from "@/slides/split/split";

export type ProfileProps = {
  /** The portrait file. Without it a placeholder stands in. */
  src?: string;
  /** Who the portrait shows. */
  alt?: string;
  /** Up to four pairs of label and fact. */
  facts?: Array<[ReactNode, ReactNode]>;
};

/**
 * A portrait beside three facts, under a title that is the person's name.
 *
 * One profile slide per deck, early or just before the ask. The slide's title is the name, its
 * lead the role. The portrait is a rectangle in a hairline frame, in colour, looking into the
 * slide; never a circle. Facts are things a client can check: where, since when, for whom.
 */
export function Profile({ src, alt = "", facts = [] }: ProfileProps) {
  // The root is the `Split`'s: the portrait on four columns, the facts on eight.
  return (
    <Split ratio="4|8" align="end">
      <div
        // The portrait's frame is always light: its tokens are Paper's on every ground.
        data-slide-ground="paper"
        className={cn(
          "flex h-[480px] slide-span-4 items-center justify-center overflow-hidden rounded-[4px] border border-line",
          src ? "bg-surface" : "bg-slide-placeholder",
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="h-[478px] w-[510px] object-cover" />
        ) : (
          <p className="text-slide-meta text-fg-muted">Porträt</p>
        )}
      </div>
      <dl className="flex flex-col">
        {facts.map(([label, fact], index) => (
          <div
            key={index}
            className="grid grid-cols-[224px_1fr] items-baseline gap-16 border-t border-line py-6 first:border-t-2 first:border-rule"
          >
            <dt className="text-slide-meta text-fg-muted">{label}</dt>
            <dd className="text-slide-body text-fg-body">{fact}</dd>
          </div>
        ))}
      </dl>
    </Split>
  );
}
