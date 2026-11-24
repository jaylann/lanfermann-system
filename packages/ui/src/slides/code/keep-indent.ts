/**
 * A line of code with its leading spaces as no-break spaces. `Code` and `Example` set every
 * line as its own `<p>`, where ordinary spaces at the start of a line collapse and the
 * indentation would be lost.
 */
export function keepIndent(line: string): string {
  return line.replace(/^ +/, (indent) => " ".repeat(indent.length));
}
