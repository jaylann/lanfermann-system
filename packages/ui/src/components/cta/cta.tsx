"use client";

import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Button } from "@/components/button/button";
import { buttonVariants } from "@/components/button/button-variants";
import { Form } from "@/components/form/form";
import { Heading } from "@/components/heading/heading";
import { Text } from "@/components/text/text";
import { ActionArrow } from "@/internal/arrow";
import { TickGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

/*
 * The closing ask of a page, in the two forms Justin kept (Lab/Cta, 2026-11-15):
 *
 *   Cta         the joint: the ask's block, bevelled like the `ask` button, with its lower right
 *               corner cut away and the actions seated in the cut, on the page's own ground
 *   CtaMessage  the letter already begun: a resting sheet with the first lines of a message,
 *               sent from where it stands and confirmed in place
 *
 * Both take CtaTitle and CtaText; a Cta takes CtaActions with at most two CtaAction.
 */

type Kind = "joint" | "message";
const KindContext = createContext<Kind>("joint");

/**
 * The colours a Cta's block can take: a fitting's tones from depth.css, so its edge, light, shade
 * and shadow follow the face on every ground. Its fill is the block's own token, not the key's:
 * a slab that large in a key's colour glares in dark mode.
 *   accent  the ask: Indigo on Paper, the light violet on Ink, white on an Indigo page, and the
 *           deeper Indigo of the Indigo ground in dark mode
 *   key     the committed key: charcoal, a Paper face on Ink, a plate of Ink in dark mode
 *   raised  the neutral fitting: a white face (a deeper Indigo on an Indigo page)
 */
const tones = {
  accent: { knobs: "depth-tone-accent", fill: "bg-ask-block", text: "text-on-ask-block" },
  key: { knobs: "depth-tone-key-block", fill: "bg-key-block", text: "text-on-key-block" },
  raised: { knobs: "", fill: "bg-raised", text: "text-fg" },
} as const;
export type CtaTone = keyof typeof tones;
const ToneContext = createContext<CtaTone>("accent");
const SeatContext = createContext<((element: HTMLDivElement | null) => void) | null>(null);

/** Room between the block and what is seated in its cut, in px. */
const GAP = 10;
/** The block's own corners, and the bend where the cut meets its edges, in px. */
const OUTER = 20;
const BEND = 14;

/** The measures of the block and of the cut in its lower right corner, in px. */
type Notch = { w: number; h: number; nw: number; nh: number; k: number };

/**
 * The block's outline with the cut, as one path. `grow` lays it 1px further out (the edge), `dy`
 * moves it down or up (the light and the shade). It is drawn in a box 1px larger on every side,
 * so the edge has room.
 */
function outline({ w, h, nw, nh, k }: Notch, grow = 0, dy = 0) {
  const x0 = 1 - grow;
  const y0 = 1 - grow + dy;
  const x1 = 1 + w + grow;
  const y1 = 1 + h + grow + dy;
  const r = OUTER + grow;
  // Nothing seated in a corner (a narrow block, its actions inside it): a plain rounded block.
  if (nw <= 0 || nh <= 0) {
    return [
      `M${x0 + r} ${y0}`,
      `H${x1 - r}`,
      `A${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
      `V${y1 - r}`,
      `A${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
      `H${x0 + r}`,
      `A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
      `V${y0 + r}`,
      `A${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
      "Z",
    ].join(" ");
  }
  const c = Math.min(BEND, nh / 2, nw / 2) + grow;
  const kk = k - grow;
  const nx = x1 - nw;
  const ny = y1 - nh;
  return [
    `M${x0 + r} ${y0}`,
    `H${x1 - r}`,
    `A${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V${ny - c}`,
    `A${c} ${c} 0 0 1 ${x1 - c} ${ny}`,
    `H${nx + kk}`,
    `A${kk} ${kk} 0 0 0 ${nx} ${ny + kk}`,
    `V${y1 - c}`,
    `A${c} ${c} 0 0 1 ${nx - c} ${y1}`,
    `H${x0 + r}`,
    `A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V${y0 + r}`,
    `A${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    "Z",
  ].join(" ");
}

/**
 * The block's face, cut to the outline in the Fase recipe of a raised part, each layer clipped
 * to the shape as the calendar's selection is:
 *   edge   the outline grown by a pixel, in the fill's own darker hue, under everything
 *   face   the accent with its gloss
 *   light  a pixel along every edge that faces up: the shape, less itself moved down by one
 *   shade  the same along every edge that faces down, the cut's top among them
 * and a short contact shadow under all of it, which follows the outline (`drop-shadow`). Every
 * colour is a knob of the block's tone (`depth-tone-*`, the neutral surface without one), so
 * every ground is right. The knobs do not inherit, so every layer carries the tone itself.
 */
function JointFace({ notch, tone }: { notch: Notch; tone: CtaTone }) {
  const { knobs, fill } = tones[tone];
  const face = outline(notch);
  const clip = (d: string): CSSProperties => ({ clipPath: `path("${d}")` });
  const strip = (dy: number): CSSProperties => ({
    clipPath: `path(evenodd, "${face} ${outline(notch, 0, dy)}")`,
  });
  return (
    <div
      aria-hidden
      data-slot="cta-face"
      className={cn(
        "absolute -inset-px -z-10",
        "[filter:drop-shadow(0_1px_2px_var(--d-contact,var(--depth-surface-contact)))_drop-shadow(0_6px_14px_var(--d-ambient,var(--depth-surface-ambient)))]",
        knobs,
      )}
    >
      <div
        className={cn("absolute inset-0 bg-[var(--d-edge,var(--depth-surface-edge))]", knobs)}
        style={clip(outline(notch, 1))}
      />
      <div
        className={cn(
          "absolute inset-0 [background-image:var(--d-face,var(--depth-surface-face))]",
          fill,
          knobs,
        )}
        style={clip(face)}
      />
      <div className="absolute inset-0" style={clip(face)}>
        <div
          className={cn("absolute inset-0 bg-[var(--d-hi,var(--depth-surface-hi))]", knobs)}
          style={strip(1)}
        />
        <div
          className={cn("absolute inset-0 bg-[var(--d-lo,var(--depth-surface-lo))]", knobs)}
          style={strip(-1)}
        />
      </div>
    </div>
  );
}

export type CtaProps = ComponentProps<"div"> & {
  /** The block's colour: the ask (`accent`, the default), the dark key, or the white face. */
  tone?: CtaTone;
};

/**
 * The closing ask of a page, as a joint: a block in a button's recipe (by default the `ask`'s:
 * Indigo on Paper, the light violet on Ink, white on an Indigo page; or `tone` `key` or
 * `raised`) whose lower right corner is cut away, with
 * the actions seated in the cut on the page's own ground. The cut's inner corner is concentric
 * with the first button in it, so block and buttons read as two parts of one joint. Where the
 * block is narrow (below 42rem, a phone) there is no cut: the buttons stand inside the block at
 * its foot, one over the other at its full width.
 *
 * Put it last on a page, above the footer, once. Word the title as what to send („Erzähl mir von
 * deinem Produkt."), the text as what happens next. One action, or two: the second is quieter.
 */
export function Cta({ tone = "accent", className, children, ...props }: CtaProps) {
  const block = useRef<HTMLDivElement>(null);
  const [seat, setSeat] = useState<HTMLDivElement | null>(null);
  const [notch, setNotch] = useState<Notch | null>(null);
  // Whether the text keeps clear of the cut. Then the block is as deep below its text as above
  // it, and the buttons sit up in the corner; otherwise the text stops above the cut.
  const [clear, setClear] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const outer = block.current;
    if (!outer || !seat) return;
    const measure = () => {
      // A narrow block has no cut: its actions stand inside it, in the flow, one over the other
      // at its full width (CtaActions below 42rem). Justin, 2026-11-16: on a phone the cut left
      // a stub of the block beside the buttons.
      if (getComputedStyle(seat).position === "static") {
        setNotch({ w: outer.offsetWidth, h: outer.offsetHeight, nw: 0, nh: 0, k: 0 });
        setClear(true);
        return;
      }
      // The cut takes the measure of everything seated in it; its inner corner follows the
      // button in its upper left corner, as round as the others.
      const first = seat.firstElementChild as HTMLElement | null;
      const radius = first
        ? Number.parseFloat(getComputedStyle(first).borderTopLeftRadius) || 0
        : 0;
      const next = {
        w: outer.offsetWidth,
        h: outer.offsetHeight,
        nw: seat.offsetWidth + GAP,
        nh: seat.offsetHeight + GAP,
        k: radius + GAP,
      };
      setNotch(next);
      // Where the cut would begin if the block were as deep below its text as above it, and
      // whether any line of the text would reach into it. Lines are read as they are set, so a
      // short last line beside the cut keeps the block even. Layout pixels throughout: the
      // client rects are divided by the block's scale, should a transform or zoom act on it.
      const box = outer.getBoundingClientRect();
      const scale = box.width / outer.offsetWidth || 1;
      const top = Number.parseFloat(getComputedStyle(outer).paddingTop) || 0;
      let bottom = 0;
      const lines: DOMRect[] = [];
      const range = document.createRange();
      for (const child of outer.children) {
        if (child === seat || child.getAttribute("data-slot") === "cta-face") continue;
        const element = child as HTMLElement;
        bottom = Math.max(bottom, element.offsetTop + element.offsetHeight);
        range.selectNodeContents(element);
        lines.push(...range.getClientRects());
      }
      const cutTop = bottom + top - next.nh;
      const cutLeft = next.w - next.nw - 2 * GAP;
      setClear(
        lines.every(
          (line) =>
            (line.bottom - box.top) / scale <= cutTop || (line.right - box.left) / scale <= cutLeft,
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(seat);
    return () => observer.disconnect();
  }, [seat]);

  return (
    <KindContext value="joint">
      <ToneContext value={tone}>
        <SeatContext value={setSeat}>
          <div
            ref={block}
            data-slot="cta"
            data-tone={tone}
            className={cn(
              "@container relative isolate flex flex-col gap-3 px-7 pt-7 sm:px-10 sm:pt-8",
              tones[tone].text,
              // As deep below the text as above it where the text keeps clear of the cut; where
              // the cut would reach under the text, the text stops above it. Before the first
              // measure, the block's width is the guess; a narrow one has no cut to stop above.
              clear === null
                ? "pb-[calc(var(--cta-notch,3.5rem)+1.25rem)] @max-2xl:pb-7 @max-2xl:sm:pb-8 @4xl:pb-7 @4xl:sm:pb-8"
                : clear
                  ? "pb-7 sm:pb-8"
                  : "pb-[calc(var(--cta-notch,3.5rem)+1.25rem)]",
              // Until the outline is measured, a plain block holds the colour, so the text never
              // stands on the page's ground.
              !notch && ["rounded-[20px]", tones[tone].fill],
              className,
            )}
            style={{ "--cta-notch": notch ? `${notch.nh}px` : undefined } as CSSProperties}
            {...props}
          >
            {notch && <JointFace notch={notch} tone={tone} />}
            {children}
          </div>
        </SeatContext>
      </ToneContext>
    </KindContext>
  );
}

/** The title: a sentence with a full stop that says what to send. */
export function CtaTitle({ className, ...props }: ComponentProps<"h2">) {
  const kind = useContext(KindContext);
  const tone = useContext(ToneContext);
  return (
    <Heading
      data-slot="cta-title"
      level={2}
      size={kind === "joint" ? "title" : "sub"}
      className={cn(
        "max-w-[40rem]",
        kind === "joint" ? [tones[tone].text, "max-sm:text-xl"] : "text-fg",
        className,
      )}
      {...props}
    />
  );
}

/** One or two sentences: that the first conversation costs nothing, that he answers. */
export function CtaText({ className, ...props }: ComponentProps<"p">) {
  const kind = useContext(KindContext);
  const tone = useContext(ToneContext);
  return (
    <Text
      data-slot="cta-text"
      size={kind === "joint" ? "lg" : "base"}
      className={cn(
        "max-w-[34rem] text-pretty",
        kind === "joint" ? tones[tone].text : "-mt-3 text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The actions of a Cta, seated in its cut: the first at the outer edge, a second, quieter one
 * beside it. Where the block is narrower than 42rem there is no cut: they stand inside the block
 * at its foot, one over the other at its full width.
 */
export function CtaActions({ className, ...props }: ComponentProps<"div">) {
  const seat = useContext(SeatContext);
  return (
    <div
      ref={seat ?? undefined}
      data-slot="cta-actions"
      className={cn(
        "flex flex-col gap-2.5 @max-2xl:mt-3 @2xl:absolute @2xl:right-0 @2xl:bottom-0 @2xl:flex-row-reverse",
        className,
      )}
      {...props}
    />
  );
}

export type CtaActionProps = ComponentProps<"a"> & {
  /**
   * The colour of the action. The first is `primary` (the dark key) by default, or `ask`
   * (Indigo) where the page wants it; a second action is `secondary`, or `quiet` in a message.
   */
  variant?: "primary" | "ask" | "secondary" | "quiet";
  /**
   * A symbol before the words that says where the action leads: the mark of the site it opens,
   * a book for documentation. An `Icon` or a mark of your own, at 18px in a Cta.
   */
  icon?: ReactNode;
  /**
   * The arrow after the words. The first action has one by default; `out` is for an action
   * that leaves the site, `false` takes it away.
   */
  arrow?: "right" | "out" | false;
};

/**
 * One action of a Cta or a CtaMessage: a link that looks like a button. The first carries the
 * arrow, which grows from a chevron when it is pointed at. Word it as what happens
 * („Nachricht schreiben"). Where two actions lead to different kinds of place, give each its
 * `icon`, so they are told apart before they are read.
 */
export function CtaAction({
  variant = "primary",
  icon,
  arrow,
  className,
  children,
  ...props
}: CtaActionProps) {
  const kind = useContext(KindContext);
  const leads = variant === "primary" || variant === "ask";
  const direction = arrow ?? (leads ? "right" : false);
  return (
    <a
      data-slot="cta-action"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size: kind === "joint" ? "lg" : "md" }), className)}
      {...props}
    >
      {icon}
      {children}
      {direction && <ActionArrow direction={direction} size={kind === "joint" ? 18 : 16} />}
    </a>
  );
}

export type CtaMessageProps = Omit<ComponentProps<"div">, "onSubmit"> & {
  /**
   * Sends the message: called with the form's data once every field is valid. Throw (or reject)
   * when it was not sent; the sheet then says so and keeps what was typed.
   */
  action: (data: FormData) => Promise<void> | void;
  /** Whom the message goes to, at the foot of the sheet: „An Justin Lanfermann". */
  recipient: ReactNode;
  /** The recipient's initials, in the avatar beside the name. */
  initials?: string;
  /** The send key. */
  sendLabel?: string;
  /** A second, quieter way, beside the send key: a CtaAction with `variant="quiet"`. */
  secondAction?: ReactNode;
  /** What the sheet says once the message was sent: the title, then one sentence. */
  sentTitle?: string;
  sentText?: string;
  /** What it says when the message was not sent. */
  failedText?: string;
  /** Shows the sent state from the start, for a page that already knows. */
  sent?: boolean;
};

/**
 * The closing ask as a letter already begun: a resting sheet with the title, the first fields
 * of a message (pass `Field`s as children, with their `name`s), whom it goes to, and the send
 * key. Sent, the sheet says so in place, with a drawn tick, and keeps its height. Not sent, it
 * says so above the key and keeps what was typed.
 *
 * For a contact page, or wherever the first step can happen on the page itself.
 */
export function CtaMessage({
  action,
  recipient,
  initials,
  sendLabel = "Nachricht senden",
  secondAction,
  sentTitle = "Die Nachricht wurde gesendet.",
  sentText,
  failedText = "Die Nachricht wurde nicht gesendet. Bitte versuche es noch einmal.",
  sent: sentProp = false,
  className,
  children,
  ...props
}: CtaMessageProps) {
  const [state, setState] = useState<"draft" | "sent" | "failed">(sentProp ? "sent" : "draft");
  const [pending, startTransition] = useTransition();
  const sent = state === "sent";

  // Sent by hand, not as the form's `action`: React empties a form after its action has run,
  // and a message that was not sent must keep what was typed.
  function send(form: HTMLFormElement) {
    const data = new FormData(form);
    startTransition(async () => {
      try {
        await action(data);
        setState("sent");
      } catch {
        setState("failed");
      }
    });
  }

  return (
    <KindContext value="message">
      <div
        data-slot="cta-message"
        className={cn(
          "flex w-full max-w-[42rem] flex-col overflow-hidden rounded-xl bg-surface depth-card",
          className,
        )}
        {...props}
      >
        <Form
          className="gap-0"
          onFormSubmit={(_values, details) => send(details.event.target as HTMLFormElement)}
        >
          <div className="grid *:col-start-1 *:row-start-1">
            <div
              aria-hidden={sent}
              inert={sent}
              className={cn(
                "flex flex-col gap-4 p-6 transition-opacity spring-settle",
                sent && "opacity-0 spring-leave",
              )}
            >
              {children}
            </div>
            <div
              aria-hidden={!sent}
              inert={!sent}
              role="status"
              className={cn(
                "flex flex-col items-center justify-center gap-2 px-6 text-center opacity-0 transition-opacity spring-leave",
                sent && "opacity-100 spring-settle",
              )}
            >
              <span className="mb-1 grid size-10 place-items-center rounded-full bg-success-soft text-success">
                <TickGlyph
                  width={18}
                  height={18}
                  strokeWidth={1.5}
                  className={cn(
                    "transition-[stroke-dashoffset] delay-150 duration-300 ease-out [stroke-dasharray:1] [stroke-dashoffset:1]",
                    sent && "[stroke-dashoffset:0]",
                  )}
                />
              </span>
              {sent && (
                <>
                  <p className="text-lg font-semibold text-fg">{sentTitle}</p>
                  {sentText && <p className="text-fg-muted">{sentText}</p>}
                </>
              )}
            </div>
          </div>
          <div
            data-slot="cta-message-footer"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-well px-6 py-3 text-sm text-fg-muted"
          >
            <span className="flex items-center gap-2.5">
              {initials && (
                <Avatar size="sm">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              )}
              {recipient}
            </span>
            <span className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {state === "failed" && (
                <span role="alert" className="basis-full text-right text-danger">
                  {failedText}
                </span>
              )}
              {/* Once sent there is nothing left to do here: the actions go. */}
              {!sent && secondAction}
              {!sent && (
                <Button type="submit" variant="primary" loading={pending}>
                  {sendLabel}
                  <ActionArrow size={16} />
                </Button>
              )}
            </span>
          </div>
        </Form>
      </div>
    </KindContext>
  );
}
