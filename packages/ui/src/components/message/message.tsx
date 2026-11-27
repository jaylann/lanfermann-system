"use client";

import { Alert02Icon, RefreshIcon, ThumbsDownIcon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip/tooltip";
import { useArrivingText } from "@/internal/arriving";
import { useLive } from "@/internal/presence";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { useLocale } from "@/locale/locale";

/** Who wrote a message: the assistant, or the person using it. */
export type MessageFrom = "assistant" | "user";

type MessageContextValue = { from: MessageFrom; streaming: boolean };

const MessageContext = createContext<MessageContextValue>({
  from: "assistant",
  streaming: false,
});

export type MessageProps = ComponentProps<"article"> & {
  from: MessageFrom;
  /** The answer is still being written: its text arrives, and its actions wait. */
  streaming?: boolean;
  /** Who wrote it, for assistive tech: „KI“ for the assistant, „Du“ for the person. */
  label?: string;
};

/**
 * One message of a conversation with an assistant. The answer is read, so it is flat prose on
 * the page, with no bubble and no avatar; the person's own words are someone else's to the
 * page, so they stand on the tint at the right, in the bubble of a `Quote` (Justin,
 * 2026-11-19). Put a `MessageContent` inside, and under an answer its `MessageActions`.
 *
 * In a `Conversation`, a message of the person's that joins rises into place, and brings the
 * view back to the foot: whoever sends a prompt wants to see the answer.
 */
export function Message({
  from,
  streaming = false,
  label,
  className,
  children,
  ...props
}: MessageProps) {
  const { messages } = useLocale();
  const conversation = useConversation();
  // Read once, when the message mounts: it joined a conversation that was already standing.
  const joined = useRef(conversation?.live ?? false);
  useLayoutEffect(() => {
    if (from === "user" && joined.current) conversation?.toLatest();
    // Only when it joins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <MessageContext value={{ from, streaming }}>
      <article
        data-slot="message"
        data-from={from}
        data-streaming={streaming ? "" : undefined}
        aria-label={label ?? (from === "user" ? messages.message.user : messages.message.assistant)}
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

export type MessageContentProps = ComponentProps<"div">;

/**
 * What a message says. In an answer it is `Prose`: hand over the rendered Markdown (the
 * elements, not a component that renders the Markdown itself), and while the message is
 * `streaming` what is new fades in, a few words at a time; code and pictures arrive whole.
 * The person's words stand as they were typed, line breaks kept.
 */
export function MessageContent({ className, children, ref, ...props }: MessageContentProps) {
  const { from, streaming } = useContext(MessageContext);
  const box = useRef<HTMLDivElement>(null);
  const conversation = useConversation();
  const content = useArrivingText(children, {
    streaming: from === "assistant" && streaming,
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
        className={cn(
          "max-w-[min(80%,36rem)] text-base break-words whitespace-pre-wrap text-fg",
          // The ground's tint and the quote's bubble, its tight corner towards the person.
          "rounded-2xl rounded-tr-sm bg-tint px-4 py-2.5",
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
    // Once one key has said its name, its neighbours say theirs as the pointer reaches them.
    <TooltipProvider>
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
    </TooltipProvider>
  );
}

export type MessageActionProps = Omit<
  ButtonProps,
  "iconOnly" | "variant" | "size" | "children" | "aria-label"
> & {
  /** What the key does, as a button says it: its name and its tooltip. */
  label: string;
  icon: IconSvgElement;
  /**
   * A motion that is in the symbol: `turn` for a circling arrow („Noch einmal“), which turns a
   * little under the pointer and once round when pressed. Every other symbol only darkens.
   */
  iconMotion?: "turn";
};

/**
 * A quiet key under an answer, with a symbol and a tooltip: „Noch einmal“, „Teilen“. Its name
 * is its tooltip, worded like a button.
 */
export function MessageAction({
  label,
  icon,
  iconMotion,
  className,
  onClick,
  ...props
}: MessageActionProps) {
  // How often it has been pressed: each press turns the arrow once more round, the same way.
  const [turns, setTurns] = useState(0);
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
            className={cn("group/action text-fg-muted hover:text-fg", className)}
            onClick={(event) => {
              if (iconMotion === "turn") setTurns((count) => count + 1);
              onClick?.(event);
            }}
            {...props}
          >
            <Icon
              icon={icon}
              size={14}
              style={iconMotion === "turn" ? ({ "--turns": turns } as CSSProperties) : undefined}
              className={cn(
                iconMotion === "turn" &&
                  "motion-safe:rotate-[calc(var(--turns)*360deg)] motion-safe:transition-[rotate] motion-safe:spring-glide motion-safe:group-hover/action:rotate-[calc(var(--turns)*360deg+40deg)]",
              )}
            />
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
 * is taken back. The thumb that is on is drawn in the text colour, without the grey square of a
 * quiet key that is down; the other stays muted (Justin, 2026-11-20). Its symbol nods into it,
 * tilted and small at first; one that is taken back, or gives way to the other, tilts back the
 * other way and settles. A verdict that is there on load does not move.
 */
export function MessageFeedback({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  goodLabel,
  badLabel,
  className,
  ...props
}: MessageFeedbackProps) {
  const { messages } = useLocale();
  const [own, setOwn] = useState<MessageVerdict>(defaultValue);
  const value = valueProp === undefined ? own : valueProp;
  const live = useLive();
  const choose = (next: MessageVerdict) => {
    setOwn(next);
    onValueChange?.(next);
  };
  const key = (verdict: "good" | "bad", label: string, icon: IconSvgElement) => {
    const on = value === verdict;
    // Up nods up and back (anticlockwise first), down nods down: each the way its thumb points.
    const lean = verdict === "good" ? -1 : 1;
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
              className="data-pressed:bg-transparent data-pressed:hover:bg-hover"
            >
              {/*
                A new symbol on every change, so it can seat: turned on, it nods in from tilted
                and small; taken back, it tilts back the other way and settles. Both on `seat`,
                and only once the row stands.
              */}
              <Icon
                key={on ? "on" : "off"}
                icon={icon}
                size={14}
                data-slot="message-feedback-symbol"
                style={{ "--lean": lean } as CSSProperties}
                className={cn(
                  "transition-[scale,rotate,translate] spring-seat",
                  on
                    ? "in-data-live:motion-safe:starting:translate-y-[calc(var(--lean)*1.5px)] in-data-live:motion-safe:starting:scale-75 in-data-live:motion-safe:starting:rotate-[calc(var(--lean)*14deg)]"
                    : "in-data-live:motion-safe:starting:scale-90 in-data-live:motion-safe:starting:rotate-[calc(var(--lean)*-8deg)]",
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
      aria-label={messages.message.either(
        goodLabel ?? messages.message.good,
        badLabel ?? messages.message.bad,
      )}
      data-slot="message-feedback"
      data-live={live ? "" : undefined}
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    >
      {key("good", goodLabel ?? messages.message.good, ThumbsUpIcon)}
      {key("bad", badLabel ?? messages.message.bad, ThumbsDownIcon)}
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
  children,
  onRetry,
  retryLabel,
  className,
  ...props
}: MessageErrorProps) {
  const { messages } = useLocale();
  return (
    <div
      role="alert"
      data-slot="message-error"
      className={cn("flex items-start gap-2.5 text-control text-fg", className)}
      {...props}
    >
      <Icon icon={Alert02Icon} size={16} className="mt-[0.1875rem] shrink-0 text-danger" />
      <div className="flex min-w-0 flex-col items-start gap-2.5">
        <p className="text-pretty">{children ?? messages.message.stopped}</p>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            <Icon icon={RefreshIcon} size={14} />
            {retryLabel ?? messages.message.retry}
          </Button>
        )}
      </div>
    </div>
  );
}
