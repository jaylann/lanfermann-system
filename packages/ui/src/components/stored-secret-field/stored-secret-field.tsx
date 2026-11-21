"use client";

import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import { type ComponentProps, useEffect, useRef, useState } from "react";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Input, type InputProps } from "@/components/input/input";
import { InputGroup, InputGroupAddon } from "@/components/input-group/input-group";
import type { FieldSize } from "@/internal/field";
import { RevealKey, secretSymbolSize, swapSettle, useSwap } from "@/internal/reveal-key";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

/** How many discs stand before the ending: the length is nobody's business. */
const MASK_DISCS = 8;

export type StoredSecretFieldProps = Omit<
  InputProps,
  "value" | "defaultValue" | "readOnly" | "type" | "size"
> & {
  /**
   * The last characters of the stored secret, as the server keeps them to tell it by: `"4f2a"`.
   * Without it nothing is stored yet, and the field takes a first one.
   */
  ending?: string;
  /** Whether a new secret is being typed in place of the stored one (controlled). */
  replacing?: boolean;
  /** Whether it is at first. */
  defaultReplacing?: boolean;
  onReplacingChange?: (replacing: boolean) => void;
  /** The size of the field, from the density. */
  size?: FieldSize;
  /** That a secret is stored, as assistive tech hears it: „Gesetzt“. */
  storedLabel?: string;
  /** Before its ending, as assistive tech hears it: „endet auf“. */
  endingLabel?: string;
  /** The key that begins a new one: „Ersetzen“. */
  replaceLabel?: string;
  /** The same key while a new one is typed: „Abbrechen“. */
  cancelLabel?: string;
  /** The key with the eye while what is typed is hidden, and its tooltip. */
  revealLabel?: string;
  /** Its tooltip while what is typed is shown. */
  hideLabel?: string;
  /** Classes for the field as a whole, e.g. its width. */
  className?: string;
};

/**
 * A secret the server keeps and never hands back: the signing secret of a webhook, the password
 * of a mail server, a key to another service. The field shows that one is stored and how it ends,
 * as a `SecretField` hides a value but with the end kept: „••••••••4f2a“ (assistive tech hears
 * „Gesetzt, endet auf 4f2a“). „Ersetzen“ turns it into an empty field for a new one, typed or
 * pasted behind discs that the eye shows. „Abbrechen“ or Escape keeps the stored one.
 *
 * It is write-only: under its `name` a form receives the new secret while one is typed, and
 * nothing while the stored one stands, so the server keeps what it has. A secret that has just
 * been made and must be copied once is a `SecretField`.
 *
 * Label it with a `FieldLabel` („Signatur-Secret“) and say in a `FieldDescription` what a new one
 * changes („Anfragen mit dem alten werden danach abgelehnt.“).
 */
export function StoredSecretField({
  ending,
  replacing: replacingProp,
  defaultReplacing = false,
  onReplacingChange,
  size = "md",
  storedLabel = "Gesetzt",
  endingLabel = "endet auf",
  replaceLabel = "Ersetzen",
  cancelLabel = "Abbrechen",
  revealLabel = "Anzeigen",
  hideLabel = "Verbergen",
  name,
  className,
  ref,
  onKeyDown,
  ...props
}: StoredSecretFieldProps) {
  const stored = ending !== undefined && ending !== "";
  const [own, setOwn] = useState(defaultReplacing);
  const replacing = replacingProp ?? own;
  const typing = !stored || replacing;
  const [revealed, setRevealed] = useState(false);
  // Two swaps: the whole field turns between the stored secret and a new one, and what is typed
  // turns between discs and characters. The eye fades in with the first only.
  const turn = useSwap();
  const reveal = useSwap();
  const swapping = turn.swapping || reveal.swapping;

  const entry = useRef<HTMLInputElement>(null);
  const key = useRef<HTMLButtonElement>(null);
  // Where the focus goes once a change the reader asked for has been drawn: into the new field,
  // or back to the key when the stored secret returns.
  const focusAfter = useRef<"entry" | "key" | null>(null);
  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    (target === "entry" ? entry : key).current?.focus();
  });

  const setReplacing = (next: boolean) =>
    turn.swap(() => {
      setOwn(next);
      setRevealed(false);
      onReplacingChange?.(next);
      focusAfter.current = next ? "entry" : "key";
    });

  // What assistive tech reads in the field, whatever it looks like.
  const said = `${storedLabel}, ${endingLabel} ${ending ?? ""}`;

  return (
    <InputGroup
      data-slot="stored-secret-field"
      data-state={typing ? "typing" : "stored"}
      size={size}
      className={className}
    >
      {typing ? (
        <>
          <Input
            key="entry"
            ref={mergeRefs(entry, ref)}
            name={name}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            // Not a password: no manager should offer to keep it or fill it in.
            data-1p-ignore=""
            data-lpignore="true"
            data-bwignore=""
            data-swapping={swapping ? "" : undefined}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented || !stored || event.key !== "Escape") return;
              event.preventDefault();
              setReplacing(false);
            }}
            className={cn(
              // What is typed is read by a machine; a placeholder is an example, as in any field.
              "font-mono placeholder:font-sans",
              // Discs drawn by the browser over what is typed, without making it a password.
              !revealed && "[-webkit-text-security:disc]",
              swapSettle,
            )}
            {...props}
          />
          <RevealKey
            revealed={revealed}
            onRevealedChange={(next) => reveal.swap(() => setRevealed(next))}
            size={size}
            revealLabel={revealLabel}
            hideLabel={hideLabel}
            swapping={turn.swapping}
          />
        </>
      ) : (
        <>
          <InputGroupAddon data-swapping={turn.swapping ? "" : undefined} className={swapSettle}>
            <Icon icon={SquareLock02Icon} size={secretSymbolSize[size]} />
          </InputGroupAddon>
          {/* The discs stand over the field's own text, which only assistive tech reads: it
              hears that a secret is stored and how it ends, not a row of discs. The field stays
              a stop for Tab: there the label and what is stored are heard before the key. */}
          <span className="relative flex h-full min-w-0 flex-1">
            <Input
              key="stored"
              ref={ref}
              readOnly
              value={said}
              className="pr-2 pl-2 text-transparent caret-transparent selection:bg-transparent"
              {...props}
              // The field's name must not carry these words to the server: the input that is
              // seen has none, and the one that holds the name sends nothing (`Form` leaves it
              // out of `onFormSubmit`, a posted form skips it as disabled).
              render={({ name: fieldName, ...visible }: ComponentProps<"input">) => (
                <>
                  <input {...visible} />
                  <input
                    type="hidden"
                    data-form-value=""
                    data-form-absent=""
                    name={fieldName}
                    value=""
                    disabled
                  />
                </>
              )}
            />
            <span
              aria-hidden
              data-slot="stored-secret-field-shown"
              data-swapping={swapping ? "" : undefined}
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center pr-2 pl-2",
                swapSettle,
              )}
            >
              {/* A SecretField's discs with the end kept instead of the start, chosen over the
                  words „Gesetzt, endet auf …4f2a“ (Justin, 2026-11-21). */}
              <span className="min-w-0 truncate font-mono text-fg">
                <span className="text-fg-muted">{"•".repeat(MASK_DISCS)}</span>
                {ending}
              </span>
            </span>
          </span>
        </>
      )}
      {stored && (
        <Button
          ref={key}
          size="sm"
          variant="quiet"
          resize
          data-secret-key="replace"
          onClick={() => setReplacing(!replacing)}
          className={cn(
            "mr-[3px] h-[calc(var(--field-height)-6px)] shrink-0 rounded-[calc(var(--field-radius)-3px)] px-2.5 text-fg-body hover:text-fg",
            // Inside the field there is no room for the usual 2px gap around the outline.
            "focus-visible:outline-offset-0",
          )}
        >
          {replacing ? cancelLabel : replaceLabel}
        </Button>
      )}
    </InputGroup>
  );
}
