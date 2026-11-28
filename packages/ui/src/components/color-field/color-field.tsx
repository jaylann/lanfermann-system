"use client";

import { type CSSProperties, useState } from "react";

import { Icon } from "@/components/icon/icon";
import { InputGroup, InputGroupAddon } from "@/components/input-group/input-group";
import type { FieldSize } from "@/internal/field";
import { statusIcons, statusIconTone } from "@/internal/status-icon";
import { TypedInput, type TypedInputProps, useTypedValue } from "@/internal/typed-input";
import { cn } from "@/lib/cn";
import { contrastRatio, floorContrast, parseHexColor, TEXT_CONTRAST } from "@/lib/color";
import { formatNumber } from "@/lib/format";
import { useLocale } from "@/locale/locale";

export type ColorFieldProps = Omit<
  TypedInputProps,
  "text" | "onTextChange" | "onCommit" | "formValue" | "problem" | "size" | "className"
> & {
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
  /** The colour as `#rrggbb`, or `""` for none (controlled). */
  value?: string;
  /** The colour at first (uncontrolled). */
  defaultValue?: string;
  /** Reports the colour as lower-case `#rrggbb`, `""` when the field is empty or cannot be read. */
  onValueChange?: (value: string) => void;
  /** The size of the field, from the density. */
  size?: FieldSize;
  /**
   * The colour this one has to read against, as `#rrggbb`: a code's background. A line under
   * the field then says the contrast between the two and whether it is enough for text.
   */
  contrastWith?: string;
};

/** Six digits, with or without the `#`: a colour that is whole while it is still being typed. */
const WHOLE = /^#?[0-9a-f]{6}$/i;

/**
 * A colour of one's own, typed as `#rrggbb`: beside a `ColorSwatchGroup` for "or your own", or
 * alone where any colour may be taken. The swatch in front shows the colour as soon as the
 * sixth digit stands, and keeps the last one while the text is not a colour.
 *
 * `#rgb` and a missing `#` are read when the field is left, and written back as lower-case
 * `#rrggbb`; that is also what `name` submits and `onValueChange` reports. Text that is no
 * colour stays in the field to be corrected, the value is empty meanwhile, and a `FieldError`
 * says what is wrong. Label it with a `FieldLabel` or an `aria-label` that says what is coloured.
 */
export function ColorField({
  value,
  defaultValue,
  onValueChange,
  size,
  contrastWith,
  className,
  disabled,
  ...props
}: ColorFieldProps) {
  const { messages, tag } = useLocale();
  const typed = useTypedValue({
    value,
    defaultValue,
    onValueChange,
    show: (color) => parseHexColor(color) ?? color,
    read: (text) => parseHexColor(text) ?? { problem: messages.colorField.invalid },
  });

  // The swatch keeps the last colour that could be read while the text cannot, and while the
  // field is emptied to type another: only a field left empty has no colour.
  const current = parseHexColor(typed.value);
  const [last, setLast] = useState(current);
  if (current !== undefined && current !== last) setLast(current);
  const color = current === undefined && typed.text.trim() === "" ? undefined : last;

  const against = contrastWith === undefined ? undefined : parseHexColor(contrastWith);
  const ratio =
    color === undefined || against === undefined ? undefined : contrastRatio(color, against);
  const enough = ratio !== undefined && ratio >= TEXT_CONTRAST;
  const status = enough ? "success" : "warning";

  return (
    <div data-slot="color-field" className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <InputGroup size={size}>
        <InputGroupAddon>
          <span
            data-slot="color-field-swatch"
            data-empty={color === undefined ? "" : undefined}
            style={color === undefined ? undefined : ({ "--swatch": color } as CSSProperties)}
            // A colour is content: forced colours must not repaint it. Empty, it is a socket.
            className="size-(--check-size) rounded-full bg-(--swatch) inset-ring inset-ring-hairline transition-[background-color] spring-snap forced-color-adjust-none data-empty:bg-surface data-empty:depth-socket data-empty:inset-ring-0"
          />
        </InputGroupAddon>
        <TypedInput
          placeholder={messages.colorField.example("#5b4fcf")}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          text={typed.text}
          onTextChange={(text) => {
            typed.setText(text);
            // A whole colour counts at once: the swatch and whoever listens need not wait for
            // the field to be left. Anything shorter is read when typing ends.
            const whole = WHOLE.test(text) ? parseHexColor(text) : undefined;
            if (whole !== undefined) typed.take(whole);
          }}
          onCommit={typed.commit}
          formValue={typed.value}
          problem={typed.problem}
          disabled={disabled}
          // The digits are set in the mono face; the example in the placeholder is a sentence.
          className="font-mono placeholder:font-sans"
          {...props}
          data-slot="color-field-input"
        />
      </InputGroup>
      {ratio !== undefined && (
        <p
          data-slot="color-field-contrast"
          data-enough={enough ? "" : undefined}
          aria-live="polite"
          className="flex items-start gap-1.5 text-sm text-fg-muted"
        >
          <Icon
            icon={statusIcons[status]}
            size={14}
            className={cn("mt-[0.2rem]", statusIconTone[status])}
          />
          <span>
            {(enough ? messages.colorField.contrastEnough : messages.colorField.contrastLow)(
              formatNumber(floorContrast(ratio), {
                locale: tag,
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }),
            )}
          </span>
        </p>
      )}
    </div>
  );
}
