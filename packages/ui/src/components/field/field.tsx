"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { useRef } from "react";

import { Icon } from "@/components/icon/icon";
import { FieldActionsContext, FieldDisabledContext } from "@/internal/field-context";
import { mergeClassName } from "@/lib/cn";

/**
 * Groups one control with its label, description and error, and wires them for assistive tech.
 * Validation, touched/dirty state and server errors come from Base UI's Field and Form.
 */
export function Field({ className, actionsRef, children, ...props }: FieldPrimitive.Root.Props) {
  const own = useRef<FieldPrimitive.Root.Actions | null>(null);
  const actions = actionsRef ?? own;
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={mergeClassName("flex flex-col gap-1.5", className)}
      actionsRef={actions}
      {...props}
    >
      {/* For a control that knows by itself when its text cannot be used: a date field. */}
      <FieldActionsContext value={actions}>
        <FieldDisabledContext value={props.disabled ?? false}>{children}</FieldDisabledContext>
      </FieldActionsContext>
    </FieldPrimitive.Root>
  );
}

/** Says what goes in, in sentence case. No colon, no asterisk. */
export function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={mergeClassName(
        "text-control leading-5 font-medium text-fg data-disabled:text-on-disabled",
        className,
      )}
      {...props}
    />
  );
}

/** One line of help that stays visible. Why we ask, or what format is expected. */
export function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={mergeClassName("text-sm text-fg-muted", className)}
      {...props}
    />
  );
}

/**
 * The error, shown when the field is invalid. A status never relies on colour: it carries an icon
 * and words that start with what to do ("Bitte geben Sie …").
 *
 * It opens by growing (`settle`), so what stands below is pushed down instead of jumping. The
 * negative margin cancels the field's gap while it is closed; the gap lives inside it instead.
 */
export function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={mergeClassName(
        [
          "-mt-1.5 grid grid-rows-[1fr] text-sm font-semibold text-danger",
          "transition-[grid-template-rows,opacity] spring-settle",
          "data-starting-style:grid-rows-[0fr] data-starting-style:opacity-0",
          "data-ending-style:grid-rows-[0fr] data-ending-style:opacity-0 data-ending-style:spring-leave",
        ],
        className,
      )}
      // Base UI supplies the validation message as `children` when the caller passes none.
      render={({ children, ...rest }) => (
        <div {...rest}>
          <div className="flex min-h-0 items-start gap-1.5 overflow-hidden pt-1.5">
            <Icon icon={AlertCircleIcon} size={14} className="mt-[0.2rem]" />
            <span>{children}</span>
          </div>
        </div>
      )}
      {...props}
    />
  );
}
