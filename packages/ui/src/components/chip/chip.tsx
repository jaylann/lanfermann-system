import { type ComponentProps, type ReactNode, useId } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { CloseGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";
import { Localized } from "@/locale/localized";

import {
  chipDisabledLook,
  chipFace,
  chipMotion,
  chipRemoveKey,
  chipShape,
  type ChipVariant,
} from "./chip-variants";

export type ChipProps = Omit<ComponentProps<"span">, "children"> & {
  /** What the chip stands for, in a word or two: "Bezahlt", "Schreinerei Huber". */
  children: ReactNode;
  /** A 12px symbol before the text. */
  icon?: IconSvgElement;
  /**
   * Something drawn before the text in place of `icon`: a mark that changes (a file on its way),
   * a small picture. As tall as the chip's text at most.
   */
  lead?: ReactNode;
  /** With it the chip carries a key that takes it away. Remove it from your list here. */
  onRemove?: () => void;
  /**
   * What the key that takes the chip away is called, as one verb. The chip's own text is said
   * before it: "Bezahlt entfernen". Left out, it is the word of the nearest `LocaleProvider`
   * („Entfernen“ without one).
   */
  removeLabel?: string;
  /**
   * The whole name of that key, for a sentence in which the verb does not come last ("Remove
   * report.pdf"). It replaces the chip's text and `removeLabel` in the name.
   */
  removeName?: string;
  /** It cannot be taken away right now, and lies flat. */
  disabled?: boolean;
  /**
   * `plug` (the default): raised, a small fitting. `flat`: a quiet wash with a faint edge, the
   * way a `Badge` is drawn, for a row where raised chips would be too much.
   */
  variant?: ChipVariant;
};

/** The key of the chip beside this one, the next if there is one, that can take the focus. */
function keyBeside(key: HTMLElement) {
  const place = key.closest('[data-slot="chip-place"]');
  const find = (step: "nextElementSibling" | "previousElementSibling") => {
    for (let other = place?.[step]; other; other = other[step]) {
      const found = other.matches("[data-leaving]")
        ? null
        : other.querySelector<HTMLElement>('[data-slot="chip-remove"]');
      if (found) return found;
    }
    return null;
  };
  return find("nextElementSibling") ?? find("previousElementSibling");
}

/**
 * Something that was chosen and can be taken away again: a filter that is applied, a value in
 * a field, a recipient. It is a small fitting seated in its surroundings, a plug: raised, with
 * an edge, but without a shadow of its own. A state that is only read ("Bezahlt" on a row) is
 * a `Badge`, which is flat.
 *
 * Give it `onRemove` and it carries a key that takes it away. Put the chips of a row into a
 * `ChipGroup`: there a chip that leaves fades while the row closes its place, one that joins
 * opens its place first, and the keyboard focus goes to the chip beside the one that left.
 */
export function Chip({
  icon,
  lead,
  onRemove,
  removeLabel,
  removeName,
  disabled = false,
  variant = "plug",
  className,
  children,
  ...props
}: ChipProps) {
  const labelId = useId();
  const removeId = useId();
  const wordId = useId();
  const removable = onRemove !== undefined && !disabled;
  return (
    <span
      data-slot="chip"
      data-variant={variant}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        chipShape,
        chipFace[variant],
        chipDisabledLook,
        chipMotion,
        removable && "pr-0.5",
        className,
      )}
      {...props}
    >
      {lead ?? (icon && <Icon icon={icon} size={12} className="-ml-0.5 text-fg-muted" />)}
      <span id={labelId} data-slot="chip-label" className="truncate">
        {children}
      </span>
      {removable && (
        <button
          type="button"
          id={removeId}
          data-slot="chip-remove"
          aria-label={removeName ?? removeLabel}
          // The chip's text, then the verb: "Bezahlt entfernen". The verb is the caller's
          // label, or the table's word in a hidden element (an attribute cannot follow the
          // provider from a server file). A whole name of the caller's stands alone.
          aria-labelledby={
            removeName === undefined
              ? `${labelId} ${removeLabel === undefined ? wordId : removeId}`
              : undefined
          }
          onClick={(event) => {
            // The key is about to go: hand the focus to the chip beside this one, so the
            // keyboard stays in the row.
            if (event.currentTarget === document.activeElement) {
              keyBeside(event.currentTarget)?.focus();
            }
            onRemove();
          }}
          className={chipRemoveKey}
        >
          {removeLabel === undefined && removeName === undefined && (
            <span id={wordId} hidden>
              <Localized ns="chip" name="remove" />
            </span>
          )}
          <CloseGlyph width={8} height={8} />
        </button>
      )}
    </span>
  );
}
