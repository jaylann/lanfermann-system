"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type TransitionEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  mergePlaces,
  nextRolls,
  numberFormat,
  type ShownPlace,
  toPlaces,
} from "@/internal/number-places";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { useLocale } from "@/locale/locale";

export type RollingNumberProps = Omit<ComponentProps<"span">, "children"> & {
  value: number;
  /** The language the number is written in. German by default: „1.234,50 €“. */
  locale?: Intl.LocalesArgument;
  /**
   * How it is written: `{ style: "currency", currency: "EUR" }`, `{ style: "percent" }`,
   * `{ notation: "compact" }`, a number of decimals. A value that rounds to zero never shows a
   * minus. To keep decimals from coming and going, give `minimumFractionDigits`.
   */
  format?: Intl.NumberFormatOptions;
};

/** The ten digits of a format's numbering system, for the columns, when they are not 0 to 9. */
function digitsOf(format: Intl.NumberFormat): string | undefined {
  const zero = format.formatToParts(0).find((part) => part.type === "integer")?.value ?? "0";
  if (zero === "0") return undefined;
  const code = zero.codePointAt(0) ?? 48;
  const rows = [...Array.from({ length: 10 }, (_, digit) => digit), 0];
  return `"${rows.map((digit) => String.fromCodePoint(code + digit)).join("\\A ")}"`;
}

type Model = {
  value: number;
  text: string;
  unit: string;
  shown: ShownPlace[];
  rolls: Record<string, number>;
  /** Counts the changes of unit: a number that changes its kind is swapped, not rolled. */
  swaps: number;
};

/**
 * A number whose digits roll to a new value instead of being swapped: a total, a count, a price
 * that changes while it is on screen. Each digit is a column of the ten digits moved by
 * `translate`, and every column rolls the way the number moves (9 rolls forward into 0, as on an
 * odometer). Tabular digits keep every column the same width. Grouping dots, the decimal comma,
 * the currency sign and the percent sign stand still between the columns; a place that joins
 * opens and fades in, one that leaves fades and closes, so what stands beside the number slides
 * aside instead of jumping. A change that arrives while the digits still move takes them on
 * from where they are.
 *
 * It does not count up on page load: what shows first is the plain number, and it rolls only
 * when the value changes afterwards. Assistive tech reads the formatted value, not the columns;
 * announce a change with a live region around it where the change is the news. Under reduced
 * motion the digits change at once.
 *
 * German by default; `format` takes `Intl.NumberFormat` options.
 */
export function RollingNumber({
  value,
  locale,
  format,
  className,
  style,
  ref,
  ...props
}: RollingNumberProps) {
  const { tag } = useLocale();
  // Cached by what it is (`lib/format.ts`), so a `format` written inline costs nothing.
  const formatter = numberFormat(locale ?? tag, format);
  const parts = toPlaces(formatter, value);

  // The places follow the value, worked out while rendering (state that follows a prop).
  const [model, setModel] = useState<Model>(() => ({
    value,
    text: parts.text,
    unit: parts.unit,
    shown: mergePlaces([], parts.places),
    rolls: nextRolls({}, parts.places, 0),
    swaps: 0,
  }));
  if (model.value !== value || model.text !== parts.text) {
    const swap = model.unit !== parts.unit;
    setModel({
      value,
      text: parts.text,
      unit: parts.unit,
      shown: mergePlaces(swap ? [] : model.shown, parts.places),
      rolls: swap
        ? nextRolls({}, parts.places, 0)
        : // A place on its way out keeps where its column stood.
          {
            ...model.rolls,
            ...nextRolls(model.rolls, parts.places, Math.sign(value - model.value)),
          },
      swaps: swap ? model.swaps + 1 : model.swaps,
    });
  }

  // The plain number first (as the server wrote it), the columns from the next frame, and only
  // a frame later may a place animate its entrance: what shows on load stands still.
  const columns = useLive();
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!columns) return;
    const frame = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(frame);
  }, [columns]);

  // A place that left is taken out once nothing moves on it any more: when its last transition
  // has ended, or at once if none started (reduced motion closes it without one).
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!model.shown.some((place) => place.leaving)) return;
    const frame = requestAnimationFrame(() => {
      const still = [...(root.current?.querySelectorAll<HTMLElement>("[data-leaving]") ?? [])]
        .filter((element) => element.getAnimations().length === 0)
        .map((element) => element.dataset.key);
      if (still.length > 0) {
        setModel((current) => drop(current, (place) => still.includes(place.key)));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [model.shown]);
  const settled = (event: TransitionEvent<HTMLSpanElement>, key: string) => {
    if (event.target !== event.currentTarget) return;
    if (event.currentTarget.getAnimations().length > 0) return;
    setModel((current) => drop(current, (place) => place.key === key));
  };

  const digits = digitsOf(formatter);
  return (
    <span
      ref={mergeRefs(root, ref)}
      data-slot="rolling-number"
      data-live={live ? "" : undefined}
      className={cn("inline-flex tabular-nums", className)}
      style={digits ? ({ "--rolling-digits": digits, ...style } as CSSProperties) : style}
      {...props}
    >
      <span className="sr-only" suppressHydrationWarning>
        {model.text}
      </span>
      {columns ? (
        <span key={model.swaps} aria-hidden className="inline-flex select-none">
          {model.shown.map((place) => (
            <span
              key={place.key}
              data-slot="rolling-number-place"
              data-key={place.key}
              data-leaving={place.leaving ? "" : undefined}
              onTransitionEnd={(event) => {
                if (place.leaving) settled(event, place.key);
              }}
              onTransitionCancel={(event) => {
                if (place.leaving) settled(event, place.key);
              }}
            >
              {place.kind === "digit" ? (
                <span data-slot="rolling-number-window">
                  <span
                    data-slot="rolling-number-column"
                    style={{ "--roll": model.rolls[place.key] ?? place.digit } as CSSProperties}
                  />
                </span>
              ) : (
                <span data-slot="rolling-number-symbol">{place.text}</span>
              )}
            </span>
          ))}
        </span>
      ) : (
        <span aria-hidden suppressHydrationWarning className="whitespace-pre">
          {model.text}
        </span>
      )}
    </span>
  );
}

/** The model without the leaving places that `which` names, and without their columns. */
function drop(model: Model, which: (place: ShownPlace) => boolean): Model {
  const gone = model.shown.filter((place) => place.leaving && which(place));
  if (gone.length === 0) return model;
  const rolls = { ...model.rolls };
  for (const place of gone) delete rolls[place.key];
  return { ...model, shown: model.shown.filter((place) => !gone.includes(place)), rolls };
}
