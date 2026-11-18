import { type ComponentProps, type ReactNode, useId } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { CloseGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

export type ChipProps = Omit<ComponentProps<"span">, "children"> & {
  /** What the chip stands for, in a word or two: "Bezahlt", "Schreinerei Huber". */
  children: ReactNode;
  /** A 12px symbol before the text. */
  icon?: IconSvgElement;
  /** With it the chip carries a key that takes it away. Remove it from your list here. */
  onRemove?: () => void;
  /**
   * What the key that takes the chip away is called, as one verb. The chip's own text is said
   * before it: "Bezahlt entfernen".
   */
  removeLabel?: string;
  /** It cannot be taken away right now, and lies flat. */
  disabled?: boolean;
  /**
   * `plug` (the default): raised, a small fitting. `flat`: a quiet wash with a faint edge, the
   * way a `Badge` is drawn, for a row where raised chips would be too much.
   */
  variant?: "plug" | "flat";
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
  onRemove,
  removeLabel = "Entfernen",
  disabled = false,
  variant = "plug",
  className,
  children,
  ...props
}: ChipProps) {
  const labelId = useId();
  const removeId = useId();
  const removable = onRemove !== undefined && !disabled;
  return (
    <span
      data-slot="chip"
      data-variant={variant}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        // As wide as its text. Where a chip may be too long for its row, give it a `max-w-*`:
        // the text then ends in an ellipsis.
        "inline-flex h-[1.375rem] w-max items-center gap-1 rounded-sm px-2 align-middle text-sm font-medium whitespace-nowrap",
        variant === "plug"
          ? "bg-raised depth-plug text-fg"
          : "bg-surface-quiet text-fg-body inset-ring inset-ring-current/15 forced-colors:outline",
        "data-disabled:bg-disabled data-disabled:depth-flat data-disabled:text-on-disabled",
        // In a row that is live (`ChipGroup`) it seats into its place once that has begun to
        // open, and leaves by fading before the place closes: an exit does not scale back.
        "transition-[opacity,scale] delay-75 spring-seat in-data-live:starting:scale-90 in-data-live:starting:opacity-0",
        "in-data-leaving:opacity-0 in-data-leaving:delay-0 in-data-leaving:spring-leave",
        removable && "pr-0.5",
        className,
      )}
      {...props}
    >
      {icon && <Icon icon={icon} size={12} className="-ml-0.5 text-fg-muted" />}
      <span id={labelId} data-slot="chip-label" className="truncate">
        {children}
      </span>
      {removable && (
        <button
          type="button"
          id={removeId}
          data-slot="chip-remove"
          aria-label={removeLabel}
          // The chip's text, then the verb: "Bezahlt entfernen".
          aria-labelledby={`${labelId} ${removeId}`}
          onClick={(event) => {
            // The key is about to go: hand the focus to the chip beside this one, so the
            // keyboard stays in the row.
            if (event.currentTarget === document.activeElement) {
              keyBeside(event.currentTarget)?.focus();
            }
            onRemove();
          }}
          className={cn(
            "touch-target relative flex size-[1.125rem] shrink-0 items-center justify-center rounded-xs text-fg-muted select-none",
            "hover:bg-hover hover:text-fg",
            "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent",
          )}
        >
          <CloseGlyph width={8} height={8} />
        </button>
      )}
    </span>
  );
}
