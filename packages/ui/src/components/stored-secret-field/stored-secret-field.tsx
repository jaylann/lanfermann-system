"use client";

import { SquareLock02Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Input, type InputProps } from "@/components/input/input";
import { InputGroup, InputGroupAddon } from "@/components/input-group/input-group";
import type { FieldSize } from "@/internal/field";
import { RevealKey, secretSymbolSize, swapSettle, useSwap } from "@/internal/reveal-key";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { useLocale } from "@/locale/locale";

/** How many discs stand before the ending: the length is nobody's business. */
const MASK_DISCS = 8;
/** The discs that stand where an ending would, when none is known. */
const UNKNOWN_ENDING_DISCS = 4;

/** How long the tick of a save stands in the Save key before the field turns back, in ms. */
export const SAVED_SHOWN_MS = 900;

export type StoredSecretFieldProps = Omit<
  InputProps,
  "value" | "defaultValue" | "readOnly" | "type" | "size"
> & {
  /**
   * The last characters of the stored secret, as the server keeps them to tell it by: `"4f2a"`.
   * Without it nothing is stored yet, and the field takes a first one.
   */
  ending?: string;
  /**
   * A secret is stored although no ending is known (a server that keeps none for a short value,
   * so the ending does not give away a third of it). The field then shows discs only and says
   * that a secret is set, without "endet auf". Left out, an `ending` alone says it is stored.
   */
  stored?: boolean;
  /** Whether a new secret is being typed in place of the stored one (controlled). */
  replacing?: boolean;
  /** Whether it is at first. */
  defaultReplacing?: boolean;
  onReplacingChange?: (replacing: boolean) => void;
  /** The size of the field, from the density. */
  size?: FieldSize;
  /**
   * The field's own Save key, „Speichern“: it submits the form and stands beside the field
   * while a new secret is typed, making room as it comes and closing it as it goes. Without it
   * the form's own submit button sends the secret.
   */
  saveLabel?: string;
  /** The save is under way: a spinner in the Save key, and what is typed holds still. */
  saving?: boolean;
  /**
   * The save went through. Its Save key draws a tick for a moment (`savedHold`), then leaves,
   * and the field turns back to the stored secret: give it the new `ending` by then.
   */
  saved?: boolean;
  /** That the save went through, as assistive tech hears it: „Gespeichert“. */
  savedLabel?: string;
  /** How long the tick stands before the field turns back, in ms. */
  savedHold?: number;
  /**
   * Something at the field's end, inside it, shown only while a new secret is typed: a key that
   * does something with what is typed (a `StoredSecretFieldKey`). It opens its own room, so the
   * eye glides aside for it. To save the field by itself use `saveLabel`, whose key stands
   * beside the field; this slot is for a form that wants the key inside.
   */
  trailing?: ReactNode;
  /** That a secret is stored, as assistive tech hears it: „Gesetzt“. */
  storedLabel?: string;
  /** Before its ending, as assistive tech hears it: „endet auf“. */
  endingLabel?: string;
  /** The key that begins a new one: „Ersetzen“. */
  replaceLabel?: string;
  /**
   * @deprecated No longer shown: while a new secret is typed the field has no key of its own;
   * Escape, or leaving it empty, keeps the stored one.
   */
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
 * pasted behind discs that the eye shows. Escape, or leaving the field while it is empty, keeps
 * the stored one.
 *
 * It is write-only: under its `name` a form receives the new secret while one is typed, and
 * nothing while the stored one stands, so the server keeps what it has. A secret that has just
 * been made and must be copied once is a `SecretField`.
 *
 * With `saveLabel` it saves itself, one field to a form: the Save key stands beside it once
 * something is typed, spins while `saving`, draws a tick once `saved`, and the field turns back
 * to the stored secret with its new ending. Without it, the form has its own submit button.
 *
 * Label it with a `FieldLabel` („Signatur-Secret“) and say in a `FieldDescription` what a new one
 * changes („Anfragen mit dem alten werden danach abgelehnt.“).
 */
export function StoredSecretField({
  ending,
  replacing: replacingProp,
  stored: storedProp,
  defaultReplacing = false,
  onReplacingChange,
  size = "md",
  saveLabel,
  saving = false,
  saved = false,
  savedLabel,
  savedHold = SAVED_SHOWN_MS,
  trailing,
  storedLabel,
  endingLabel,
  replaceLabel,
  cancelLabel: _cancelLabel,
  revealLabel,
  hideLabel,
  name,
  className,
  ref,
  onKeyDown,
  onChange,
  onBlur,
  ...props
}: StoredSecretFieldProps) {
  const { messages } = useLocale();
  const hasEnding = ending !== undefined && ending !== "";
  const stored = storedProp ?? hasEnding;
  const [own, setOwn] = useState(defaultReplacing);
  const replacing = replacingProp ?? own;
  // Whether something is typed: the Save key stands only then.
  const [filled, setFilled] = useState(false);
  // The moment a save went through: the tick stands, and the new secret with it, until the hold
  // ends and the field turns back.
  const [confirming, setConfirming] = useState(false);
  const [wasSaved, setWasSaved] = useState(saved);
  if (saved !== wasSaved) {
    setWasSaved(saved);
    if (saved) setConfirming(true);
  }
  const typing = !stored || replacing || confirming;
  const [revealed, setRevealed] = useState(false);
  // Two swaps: the whole field turns between the stored secret and a new one, and what is typed
  // turns between discs and characters. The eye fades in with the first only.
  const turn = useSwap();
  const reveal = useSwap();
  const swapping = turn.swapping || reveal.swapping;

  const root = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
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

  // `focus: false` when the reader has already put the focus elsewhere (left the field).
  const setReplacing = (next: boolean, { focus = true } = {}) =>
    turn.swap(() => {
      setOwn(next);
      setRevealed(false);
      setFilled(false);
      onReplacingChange?.(next);
      if (focus) focusAfter.current = next ? "entry" : "key";
    });

  // The hold is over: the Save key leaves and the field turns back to what is stored now. The
  // focus follows only if it was in the field or on the Save key, which can no longer hold it.
  const settle = useEffectEvent(() => {
    const within = root.current?.contains(document.activeElement) ?? false;
    turn.swap(() => {
      setConfirming(false);
      setOwn(false);
      setRevealed(false);
      setFilled(false);
      if (replacing) onReplacingChange?.(false);
      if (within && stored) focusAfter.current = "key";
    });
  });
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(settle, savedHold);
    return () => clearTimeout(timer);
  }, [confirming, savedHold]);

  // What assistive tech reads in the field, whatever it looks like.
  const said = hasEnding
    ? `${storedLabel ?? messages.storedSecretField.stored}, ${endingLabel ?? messages.storedSecretField.ending} ${ending}`
    : (storedLabel ?? messages.storedSecretField.stored);
  const saveShown = typing && (filled || confirming);

  const field = (
    <InputGroup
      ref={group}
      // Left empty, the new one was not wanted: once the focus leaves the field (the eye is
      // inside it), the stored one comes back.
      onBlur={(event) => {
        const to = event.relatedTarget;
        if (!stored || !replacing || saving || confirming) return;
        if (entry.current?.value) return;
        if (to instanceof Node && group.current?.contains(to)) return;
        setReplacing(false, { focus: false });
      }}
      data-slot={saveLabel === undefined ? "stored-secret-field" : undefined}
      data-state={saveLabel === undefined ? (typing ? "typing" : "stored") : undefined}
      size={size}
      className={saveLabel === undefined ? className : "min-w-0 flex-1"}
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
            // While it is sent and confirmed, what was sent holds still.
            readOnly={saving || confirming}
            onChange={(event) => {
              onChange?.(event);
              setFilled(event.currentTarget.value !== "");
            }}
            onBlur={onBlur}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented || !stored || event.key !== "Escape") return;
              if (saving || confirming) return;
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
            revealLabel={revealLabel ?? messages.storedSecretField.reveal}
            hideLabel={hideLabel ?? messages.storedSecretField.hide}
            swapping={turn.swapping}
          />
          {trailing !== undefined && (
            // Its room opens from nothing, as the Save key's does beside the field, so what
            // stands before it glides aside instead of jumping.
            <span
              data-slot="stored-secret-field-trailing"
              data-shown={filled ? "" : undefined}
              inert={!filled}
              className={cn(
                "grid shrink-0 grid-cols-[0fr] transition-[grid-template-columns] delay-75 spring-glide motion-reduce:transition-none",
                "data-shown:grid-cols-[1fr] data-shown:delay-0",
              )}
            >
              <span className="min-w-0 overflow-x-clip">
                <span
                  className={cn(
                    "flex w-max items-center pe-[3px]",
                    "scale-96 opacity-0 transition-[opacity,scale] spring-leave motion-reduce:scale-100",
                    filled && "scale-100 opacity-100 spring-seat",
                  )}
                >
                  {trailing}
                </span>
              </span>
            </span>
          )}
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
                {/* Without an ending the row is as long as one with four characters at its end,
                    so the secrets of a list end on one line whether or not their ending is known. */}
                <span className="text-fg-muted">
                  {"•".repeat(hasEnding ? MASK_DISCS : MASK_DISCS + UNKNOWN_ENDING_DISCS)}
                </span>
                {hasEnding ? ending : null}
              </span>
            </span>
          </span>
        </>
      )}
      {/* Only on the stored secret: while a new one is typed the field keeps its room for it,
          and Escape or leaving it empty is the way back (Justin, 2026-11-23). */}
      {stored && !typing && (
        <Button
          ref={key}
          size="sm"
          variant="quiet"
          data-secret-key="replace"
          onClick={() => setReplacing(true)}
          className={cn(
            "mr-[3px] h-[calc(var(--field-height)-6px)] shrink-0 rounded-[calc(var(--field-radius)-3px)] px-2.5 text-fg-body hover:text-fg",
            // Inside the field there is no room for the usual 2px gap around the outline.
            "focus-visible:outline-offset-0",
          )}
        >
          {replaceLabel ?? messages.storedSecretField.replace}
        </Button>
      )}
    </InputGroup>
  );

  if (saveLabel === undefined) return field;

  return (
    <div
      ref={root}
      data-slot="stored-secret-field"
      data-state={typing ? "typing" : "stored"}
      className={cn("flex min-w-0", className)}
    >
      {field}
      {/* The Save key's room: a column that opens from nothing beside the field, so the field's
          edge glides aside as the key comes, and closes once the key has faded as it goes. It
          clips sideways only; its padding at the end, taken back by the margin, keeps the key's
          shadow and outline inside it. */}
      <div
        data-slot="stored-secret-field-save"
        data-shown={saveShown ? "" : undefined}
        inert={!saveShown}
        className={cn(
          "grid shrink-0 grid-cols-[0fr] transition-[grid-template-columns,margin] delay-75 spring-glide motion-reduce:transition-none",
          "data-shown:-me-2 data-shown:grid-cols-[1fr] data-shown:delay-0",
        )}
      >
        <div className="min-w-0 overflow-x-clip">
          <div
            className={cn(
              "flex w-max ps-2 pe-2",
              "scale-96 opacity-0 transition-[opacity,scale] spring-leave motion-reduce:scale-100",
              saveShown && "scale-100 opacity-100 spring-seat",
            )}
          >
            <Button type="submit" variant="primary" size={size} loading={saving} done={confirming}>
              {saveLabel}
            </Button>
          </div>
        </div>
      </div>
      <span role="status" className="sr-only">
        {confirming ? (savedLabel ?? messages.storedSecretField.saved) : ""}
      </span>
    </div>
  );
}

/**
 * A key that stands inside a `StoredSecretField`, in its `trailing` slot: a small button cut to
 * the field's inside, three pixels from its edge all round, so field and key read as one
 * control. Word it as what it does with the typed secret („Prüfen“, „Speichern“).
 */
export function StoredSecretFieldKey({ className, ...props }: ButtonProps) {
  return (
    <Button
      size="sm"
      data-slot="stored-secret-field-key"
      className={cn(
        "h-[calc(var(--field-height)-6px)] shrink-0 rounded-[calc(var(--field-radius)-3px)] px-2.5",
        // Inside the field there is no room for the usual 2px gap around the outline.
        "focus-visible:outline-offset-0",
        className,
      )}
      {...props}
    />
  );
}
