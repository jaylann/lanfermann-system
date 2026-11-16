"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type { ComponentProps } from "react";

import { mergeClassName } from "@/lib/cn";

export type TextareaProps = Omit<ComponentProps<"textarea">, "className" | "defaultValue"> & {
  className?: FieldPrimitive.Control.Props["className"];
  defaultValue?: string;
  /** Called with the text on every change. */
  onValueChange?: (value: string) => void;
  /**
   * Grows with its content instead of scrolling, up to about twelve lines. Browsers without
   * `field-sizing` keep the fixed height and the resize handle.
   */
  autoGrow?: boolean;
};

/**
 * A socket for more than one line: a message, a note, a description. Same field as `Input`, with
 * the reading line height. It resizes vertically only. Inside a `Field` it picks up the label,
 * description and validity.
 */
export function Textarea({
  className,
  rows = 3,
  autoGrow = false,
  onValueChange,
  ...props
}: TextareaProps) {
  return (
    <FieldPrimitive.Control
      data-slot="textarea"
      // Base UI's field control is an <input> by default; it works the same on a <textarea>.
      render={<textarea rows={rows} />}
      onValueChange={onValueChange}
      className={mergeClassName(
        [
          "block w-full min-w-0 resize-y rounded-md bg-surface text-control leading-normal text-fg depth-field resize-grip pointer-coarse:text-base",
          // The right and bottom padding are transparent BORDERS instead: the browser draws its
          // resize grip (and the scrollbar) inside the border, so both sit 3px in from the edge:
          // just clear of the rounded corner, in every browser. Forced colours would paint a
          // transparent border, hence Canvas.
          "border-r-[3px] border-b-[3px] border-transparent pt-1.5 pr-[calc(var(--field-pad-md)-3px)] pb-[3px] pl-(--field-pad-md) forced-colors:border-[color:Canvas]",
          "min-h-(--control-md)",
          "placeholder:text-fg-muted placeholder:italic",
          "transition-[box-shadow,background-color] spring-snap",
          "focus:depth-field-focus focus:outline-hidden",
          "data-invalid:depth-field-invalid data-invalid:focus:depth-field-invalid",
          "data-disabled:resize-none data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled",
          autoGrow && "field-sizing-content max-h-80 resize-none",
        ],
        className,
      )}
      {...(props as Omit<FieldPrimitive.Control.Props, "className" | "render" | "onValueChange">)}
    />
  );
}
