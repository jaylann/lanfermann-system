import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * Running text that arrives as markup: a page rendered from Markdown, an article from an editor.
 * It sets the rhythm between blocks (a heading belongs to what follows it; code, tables and
 * callouts keep a little more room) and gives plain paragraphs, lists, quotes, rules, links and
 * inline code their look, so a renderer only has to map what needs a component of its own.
 *
 * Library components inside keep their own look: map headings to `AnchorHeading`, code to
 * `CodeBlock` and `Code`, tables to `Table`, alerts to `Callout`. The measure is the caller's:
 * put the prose in a `Container size="text"` or a docs column. `not-prose` on an element takes
 * it out. The styles live in `src/styles/prose.css`.
 */
export function Prose({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="prose" className={cn("prose min-w-0", className)} {...props} />;
}
