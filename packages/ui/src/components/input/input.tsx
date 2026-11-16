"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { useContext } from "react";

import { bareControl, fieldFace, fieldText } from "@/internal/field";
import { FieldShellContext } from "@/internal/field-context";
import { mergeClassName } from "@/lib/cn";

/**
 * A socket for typed values: a white field with a hairline edge. Focus turns the edge Indigo and
 * opens a soft halo (part of the depth recipe, so there is no outline). Text follows the density
 * but is always 16px on touch devices, so iOS never zooms on focus. Inside a `Field` it picks up
 * the label, description and validity.
 */
const inputVariants = cva(
  [
    "w-full min-w-0",
    fieldFace,
    fieldText,
    // The halo is the focus indicator; `outline-hidden` keeps a real outline for forced colours.
    "focus:depth-field-focus focus:outline-hidden",
    "data-invalid:depth-field-invalid data-invalid:focus:depth-field-invalid",
    "data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled",
  ],
  {
    variants: {
      size: {
        sm: "h-(--control-sm) rounded-sm px-(--field-pad-sm)",
        md: "h-(--control-md) rounded-md px-(--field-pad-md)",
        lg: "h-(--control-lg) rounded-lg px-(--field-pad-lg)",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type InputProps = Omit<InputPrimitive.Props, "size"> & VariantProps<typeof inputVariants>;

/**
 * A placeholder is an example in italics ("z. B. Schreinerei Huber"), never a label.
 *
 * Inside an `InputGroup` the group wears the field and sets the size; the input goes bare.
 */
export function Input({ className, size, ...props }: InputProps) {
  const bare = useContext(FieldShellContext);
  return (
    <InputPrimitive
      data-slot="input"
      data-size={bare ? undefined : (size ?? "md")}
      data-field-control={bare ? "" : undefined}
      className={mergeClassName(bare ? bareControl : inputVariants({ size }), className)}
      {...props}
    />
  );
}
