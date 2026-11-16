/*
 * The face a block of code stands on: a white sheet under a hairline with its header on the
 * well, and in the dark (Ink) the black slab with its header lifted. Picked by Justin on
 * 2026-11-15 from Mulde, Blatt and Ink (see DESIGN.md): Blatt, with Ink as its dark version. The
 * colours are `--lf-code-face` and `--lf-code-head` (src/styles/code.css), so every ground is
 * right without a branch here. Server-safe: CodeBlock, CodeTabs and their frames all read it.
 */

/** The block around the code: corners of a sheet, a hairline, and the type of a machine's text. */
export const codeRoot = [
  "relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-hairline bg-code-face",
  "font-mono text-[0.8125rem] leading-[1.375rem] text-code-text [--code-pad-x:1rem]",
  // The fold's fade ends in the face.
  "[--code-face:var(--lf-code-face)]",
  // The scroll region inside takes the focus; its edge mask would cut an outline, so the block
  // draws it.
  "has-[[data-slot=code-block-scroll]:focus-visible]:outline-2",
  "has-[[data-slot=code-block-scroll]:focus-visible]:outline-offset-2",
  "has-[[data-slot=code-block-scroll]:focus-visible]:outline-accent",
];

/** The strip at the top: the file's symbol and name, or the tabs, and the copy button. */
export const codeHead =
  "flex min-h-10 shrink-0 items-center gap-2 border-b border-hairline bg-code-head py-1.5 pr-1.5 pl-(--code-pad-x) font-sans text-fg-muted";
