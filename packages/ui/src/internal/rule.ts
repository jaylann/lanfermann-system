/**
 * The 2px rule that opens a block (`Table`, `Accordion`, `ParameterList`, a `PageHeader` with
 * `rule`): a straight line with round ends. The box keeps a transparent 2px top border, so it is
 * laid out exactly as with `border-t-2`, and the line is drawn into that border as `::before`.
 * A border cannot round its own ends: with a radius it bends down at the corners instead.
 *
 * The box becomes positioned, and must not clip its top edge. Server-safe.
 */
export const ruleTop = [
  "relative border-t-2 border-t-transparent",
  "before:absolute before:inset-x-0 before:-top-0.5 before:h-0.5 before:rounded-full before:bg-rule",
  "forced-colors:before:bg-[color:CanvasText]",
].join(" ");
