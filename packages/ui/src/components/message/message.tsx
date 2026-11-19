"use client";

import { Alert02Icon, RefreshIcon, ThumbsDownIcon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Button, type ButtonProps } from "@/components/button/button";
import { useConversation } from "@/components/conversation/conversation";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Toggle } from "@/components/toggle/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { type ArriveBy, useArrivingText } from "@/internal/arriving";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";

export type { ArriveBy } from "@/internal/arriving";

/** Who wrote a message: the assistant, or the person using it. */
export type MessageFrom = "assistant" | "user";

/**
 * How the person's own words are set off. `tint`: on the ground's tint, the bubble of a
 * `Quote`. `sheet`: a quiet sheet, white with a hairline edge.
 */
export type MessageVariant = "tint" | "sheet";

type MessageContextValue = { from: MessageFrom; variant: MessageVariant; streaming: boolean };

const MessageContext = createContext<MessageContextValue>({
  from: "assistant",
  variant: "tint",
  streaming: false,
});

export type MessageProps = ComponentProps<"article"> & {
  from: MessageFrom;
  /** The answer is still being written: its text arrives, and its actions wait. */
  streaming?: boolean;
  /** How the person's words are set off (only for `from="user"`). */
  variant?: MessageVariant;
  /** Who wrote it, for assistive tech: „KI“ for the assistant, „Du“ for the person. */
  label?: string;
};

/**
 * One message of a conversation with an assistant. The answer is read, so it is flat prose on
 * the page, with no bubble and no avatar; the person's own words are set off at the right.
 * Put a `MessageContent` inside, and under an answer its `MessageActions`.
 *
 * In a `Conversation`, a message of the person's that joins rises into place, and brings the
 * view back to the foot: whoever sends a prompt wants to see the answer.
 */
export function Message({
  from,
  streaming = false,
  variant = "tint",
  label = from === "user" ? "Du" : "KI",
  className,
  children,
  ...props
}: MessageProps) {
  const conversation = useConversation();
  // Read once, when the message mounts: it joined a conversation that was already standing.
  const joined = useRef(conversation?.live ?? false);
  useLayoutEffect(() => {
    if (from === "user" && joined.current) conversation?.toLatest();
    // Only when it joins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <MessageContext value={{ from, variant, streaming }}>
      <article
        data-slot="message"
        data-from={from}
        data-streaming={streaming ? "" : undefined}
        aria-label={label}
        className={cn(
          "flex min-w-0 flex-col",
          from === "user"
            ? [
                "items-end gap-2",
                // The person's words rise into place when they are sent; under reduced motion
                // they only fade.
                "transition-[opacity,translate] spring-settle in-data-live:starting:translate-y-(--motion-enter-offset) in-data-live:starting:opacity-0",
              ]
            : // The steps of the work, the answer, its sources and keys: a little more air.
              "items-start gap-3",
          className,
        )}
        {...props}
      >
        {children}
      </article>
    </MessageContext>
  );
}

export type MessageContentProps = ComponentProps<"div"> & {
  /**
   * How text that is still being written arrives: a few words at a time (`words`), or a line
   * at a time once it is full (`lines`).
   */
  arrive?: ArriveBy;
};

/**
 * What a message says. In an answer it is `Prose`: hand over the rendered Markdown (the
 * elements, not a component that renders the Markdown itself), and while the message is
 * `streaming` what is new fades in, a few words at a time; code and pictures arrive whole.
 * The person's words stand as they were typed, line breaks kept.
 */
export function MessageContent({
  arrive = "words",
  className,
  children,
  ref,
  ...props
}: MessageContentProps) {
  const { from, variant, streaming } = useContext(MessageContext);
  const box = useRef<HTMLDivElement>(null);
  const conversation = useConversation();
  const content = useArrivingText(children, {
    streaming: from === "assistant" && streaming,
    by: arrive,
    box,
  });

  // A finished answer is said once, as a whole.
  const wasStreaming = useRef(streaming);
  useEffect(() => {
    if (wasStreaming.current && !streaming && from === "assistant") {
      const text = box.current?.textContent?.trim();
      if (text) conversation?.announce(text);
    }
    wasStreaming.current = streaming;
  }, [streaming, from, conversation]);

  if (from === "user") {
    return (
      <div
        ref={mergeRefs(box, ref)}
        data-slot="message-content"
        data-variant={variant}
        className={cn(
          "max-w-[min(80%,36rem)] text-base break-words whitespace-pre-wrap text-fg",
          variant === "tint"
            ? // The ground's tint and the quote's bubble, its tight corner towards the person.
              "rounded-2xl rounded-tr-sm bg-tint px-4 py-2.5"
            : "rounded-xl border border-hairline bg-surface px-4 py-2.5",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      ref={mergeRefs(box, ref)}
      data-slot="message-content"
      aria-busy={streaming || undefined}
      className={cn("prose w-full max-w-[42rem] min-w-0", className)}
      {...props}
    >
      {content}
    </div>
  );
}

/**
 * The keys under an answer: copy (`CopyButton`), the verdict (`MessageFeedback`), „Noch
 * einmal“ (`MessageAction`). They are always there, not only under the pointer, so a finger and
 * the keyboard reach them. While the answer is written they wait unseen, and come in together
 * once it is complete; their room is kept, so nothing moves when they do.
 */
export function MessageActions({ className, ...props }: ComponentProps<"div">) {
  const { streaming } = useContext(MessageContext);
  return (
    <div
      data-slot="message-actions"
      inert={streaming}
      className={cn(
        "-ml-1 flex items-center gap-0.5",
        "transition-opacity spring-settle in-data-live:starting:opacity-0",
        streaming && "opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export type MessageActionProps = Omit<
  ButtonProps,
  "iconOnly" | "variant" | "size" | "children" | "aria-label"
> & {
  /** What the key does, as a button says it: its name and its tooltip. */
  label: string;
  icon: IconSvgElement;
};

/**
 * A quiet key under an answer, with a symbol and a tooltip: „Noch einmal“, „Teilen“. Its name
 * is its tooltip, worded like a button.
 */
export function MessageAction({ label, icon, className, ...props }: MessageActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            iconOnly
            size="sm"
            variant="quiet"
            aria-label={label}
            data-slot="message-action"
            className={cn("text-fg-muted hover:text-fg", className)}
            {...props}
          >
            <Icon icon={icon} size={14} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The person's verdict on an answer: good, bad, or none yet. */
export type MessageVerdict = "good" | "bad" | null;

export type MessageFeedbackProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: MessageVerdict;
  defaultValue?: MessageVerdict;
  onValueChange?: (value: MessageVerdict) => void;
  goodLabel?: string;
  badLabel?: string;
};

/**
 * Two keys that stay down, thumbs up and thumbs down: at most one is on, and pressed again it
 * is taken back. The symbol of the key that is turned on seats into it with a small nod.
 */
export function MessageFeedback({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  goodLabel = "Gute Antwort",
  badLabel = "Schlechte Antwort",
  className,
  ...props
}: MessageFeedbackProps) {
  const [own, setOwn] = useState<MessageVerdict>(defaultValue);
  const value = valueProp === undefined ? own : valueProp;
  const live = useLive();
  const choose = (next: MessageVerdict) => {
    setOwn(next);
    onValueChange?.(next);
  };
  const key = (verdict: "good" | "bad", label: string, icon: IconSvgElement) => {
    const on = value === verdict;
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              iconOnly
              size="sm"
              variant="quiet"
              aria-label={label}
              pressed={on}
              onPressedChange={(pressed) => choose(pressed ? verdict : null)}
            >
              {/*
                A new symbol when it is turned on, so it can seat: it nods in from a little
                tilted and small, on `seat`. Only once the row stands: a verdict that is there
                on load does not move.
              */}
              <Icon
                key={on ? "on" : "off"}
                icon={icon}
                size={14}
                data-slot="message-feedback-symbol"
                className={cn(
                  "transition-[scale,rotate] spring-seat",
                  on &&
                    (verdict === "good"
                      ? "in-data-live:motion-safe:starting:scale-75 in-data-live:motion-safe:starting:-rotate-12"
                      : "in-data-live:motion-safe:starting:scale-75 in-data-live:motion-safe:starting:rotate-12"),
                )}
              />
            </Toggle>
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  };
  return (
    <div
      role="group"
      aria-label={`${goodLabel} oder ${badLabel}`}
      data-slot="message-feedback"
      data-live={live ? "" : undefined}
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      {key("good", goodLabel, ThumbsUpIcon)}
      {key("bad", badLabel, ThumbsDownIcon)}
    </div>
  );
}

export type MessageErrorProps = Omit<ComponentProps<"div">, "children"> & {
  /** What happened, as a sentence. */
  children?: ReactNode;
  /** Asks for the answer again. Without it there is no key. */
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * An answer that failed: the danger symbol, what happened in a sentence, and the next step as
 * a key. Nothing shakes and no colour flashes; the words carry it.
 */
export function MessageError({
  children = "Die Antwort ist abgebrochen.",
  onRetry,
  retryLabel = "Noch einmal",
  className,
  ...props
}: MessageErrorProps) {
  return (
    <div
      role="alert"
      data-slot="message-error"
      className={cn("flex items-start gap-2.5 text-control text-fg", className)}
      {...props}
    >
      <Icon icon={Alert02Icon} size={16} className="mt-[0.1875rem] shrink-0 text-danger" />
      <div className="flex min-w-0 flex-col items-start gap-2.5">
        <p className="text-pretty">{children}</p>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            <Icon icon={RefreshIcon} size={14} />
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
