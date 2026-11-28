"use client";

import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  type TransitionEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { Grow } from "@/components/grow/grow";
import { Icon } from "@/components/icon/icon";
import { CloseGlyph } from "@/internal/glyphs";
import { useLive } from "@/internal/presence";
import { statusIcons, statusIconTone } from "@/internal/status-icon";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import { useLocale } from "@/locale/locale";

export type BannerTone = "info" | "success" | "warning" | "danger";

const wash: Record<BannerTone, string> = {
  info: "bg-info-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

/** The faint edge in the status colour under the strip. */
const edge: Record<BannerTone, string> = {
  info: "shadow-[inset_0_-1px_0] shadow-info/20",
  success: "shadow-[inset_0_-1px_0] shadow-success/25",
  warning: "shadow-[inset_0_-1px_0] shadow-warning/30",
  danger: "shadow-[inset_0_-1px_0] shadow-danger/25",
};

/**
 * A small control that takes the room of one line of the strip's text, standing out above and
 * below it by the same amount, so its middle is the middle of the line. (`1lh` is read where
 * this is set: on a box in the strip's text size, not on the button.) The action repeats it
 * under a container query.
 */
const oneLine = "-my-[calc((var(--control-sm)-1lh)/2)]";

export type BannerProps = Omit<ComponentProps<"div">, "title"> & {
  tone?: BannerTone;
  /** What is the case, as a sentence: „Ihre Testphase endet in drei Tagen.“ */
  title: ReactNode;
  /** What to do about it: „Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.“ */
  children?: ReactNode;
  /** One thing to do, at the end of the strip: a `Button size="sm"`, or a link styled as one. */
  action?: ReactNode;
  /** Whether it shows (controlled). */
  open?: boolean;
  /** Whether it shows at first. Default: it does. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether it has a close key. A notice that stays true until it is acted on has none. */
  dismissible?: boolean;
  /** The name of the close key. */
  closeLabel?: string;
  /**
   * Where the focus goes when the close key is pressed and the banner leaves. By default the
   * page's `<main>`, so a keyboard user is not dropped at the start of the document.
   */
  finalFocus?: RefObject<HTMLElement | null>;
  /** The word assistive tech hears before the title, where the symbol says it to the eye. */
  toneLabels?: Partial<Record<BannerTone, string>>;
};

/**
 * A notice for the whole page: the trial ends in three days, a payment failed, maintenance
 * tonight. For a message inside a page's content, use an `Alert`.
 *
 * A strip in the status wash across the full width of the page or of its main column, under its
 * top edge, with the status symbol, a sentence, an optional action and a close key. Put it first
 * in that column, not inside the content's padding. The title says what is the case, the text
 * what to do. A banner that is there when the
 * page loads stands still; one that arrives later pushes the page down and is announced. Closed,
 * it leaves the way it came: it rises into the top edge as it fades, and the page follows it up.
 */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  open,
  defaultOpen = true,
  onOpenChange,
  dismissible = true,
  closeLabel,
  finalFocus,
  toneLabels,
  className,
  onTransitionEnd,
  ref,
  ...props
}: BannerProps) {
  const { messages } = useLocale();
  const [chosen, setChosen] = useState(defaultOpen);
  const shown = open ?? chosen;
  // What has been closed stays drawn until it has faded and its room has closed.
  const [drawn, setDrawn] = useState(shown);
  if (shown && !drawn) setDrawn(true);
  const leaving = drawn && !shown;
  const live = useLive();
  const grow = useRef<HTMLDivElement>(null);
  const labels = { ...messages.banner.tone, ...toneLabels };

  const close = () => {
    setChosen(false);
    onOpenChange?.(false);
  };

  // However it was closed (its key, its own action, the page), what had the focus in it is
  // about to go: hand the focus on before it does, so it is not dropped at the top of the page.
  // Before paint: the strip turns inert in this commit, and the browser would blur it first.
  useLayoutEffect(() => {
    const box = grow.current;
    if (!leaving || !box?.contains(document.activeElement)) return;
    const target = finalFocus?.current ?? box.closest("main") ?? document.querySelector("main");
    if (!target) return;
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
    target.focus({ preventScroll: true });
  }, [leaving, finalFocus]);

  // Gone once nothing moves any more: the room has closed, or it never moved (reduced motion).
  const settled = (event: TransitionEvent<HTMLElement>) => {
    if (!leaving || event.target !== event.currentTarget) return;
    if (grow.current?.dataset.moving !== undefined) return;
    setDrawn(false);
  };

  return (
    <Grow
      // The caller's ref as well as ours: taking its place would leave the banner without the
      // box it hands the focus on from, and closing would drop the focus.
      ref={mergeRefs(grow, ref)}
      // Polite, and assertive for danger: only what arrives after the page has loaded is said.
      role={tone === "danger" ? "alert" : "status"}
      data-slot="banner"
      data-tone={tone}
      data-live={live ? "" : undefined}
      // The caller's handler is called as well; it must not take the place of the one that
      // takes the closed strip out of the page.
      onTransitionEnd={(event) => {
        onTransitionEnd?.(event);
        settled(event);
      }}
      className={className}
      {...props}
    >
      {drawn && (
        // Leaving, the box takes no room: the `Grow` eases its height to nothing while the strip,
        // still drawn inside it, fades.
        // Under reduced motion the page does not ease up, so the strip is not left to fade over
        // what now stands where it was.
        <div data-slot="banner-place" className={cn(leaving && "h-0 motion-reduce:overflow-clip")}>
          <div
            data-slot="banner-strip"
            data-leaving={leaving ? "" : undefined}
            inert={leaving}
            onTransitionEnd={settled}
            className={cn(
              "flex items-start gap-3 py-2.5 ps-4 pe-2.5 text-control text-fg-body sm:ps-6 sm:pe-4",
              wash[tone],
              edge[tone],
              // Arriving after load it comes down from the top edge as the page makes room, and it
              // leaves the same way back, on the same spring as the room closing: a quicker fade
              // left the room empty while the page was still rising into it (Justin, 2026-11-19).
              "transition-[opacity,translate] spring-settle",
              "in-data-live:starting:-translate-y-(--motion-enter-offset) in-data-live:starting:opacity-0",
              "data-leaving:-translate-y-(--motion-enter-offset) data-leaving:opacity-0",
              "forced-colors:outline",
            )}
          >
            {/* Symbol, first line, action and close key share one axis: the middle of the first
                line. A sentence that wraps runs on below it; nothing is centred on the block. */}
            <span className="flex h-lh shrink-0 items-center">
              <Icon icon={statusIcons[tone]} size={18} className={statusIconTone[tone]} />
            </span>
            {/* Narrower than 32rem, the action goes under the sentence rather than beside one
                that wraps into a column of its own. */}
            <div className="@container/banner flex min-w-0 flex-1 flex-wrap items-start gap-x-4 gap-y-2.5">
              <p
                data-slot="banner-text"
                className="min-w-0 flex-[1_1_18rem] text-pretty @max-lg/banner:basis-full"
              >
                <span className="sr-only">{labels[tone]}: </span>
                <span data-slot="banner-title" className="font-semibold text-fg">
                  {title}
                </span>
                {children !== undefined && <> {children}</>}
              </p>
              {action !== undefined && (
                // Beside the sentence it keeps to the first line; under it, it takes its full
                // height, so the strip's padding below it is as wide as above the sentence.
                <div
                  data-slot="banner-action"
                  className="shrink-0 @lg/banner:-my-[calc((var(--control-sm)-1lh)/2)]"
                >
                  {action}
                </div>
              )}
            </div>
            {dismissible && (
              <div className={cn("shrink-0", oneLine)}>
                <Button
                  data-slot="banner-close"
                  iconOnly
                  size="sm"
                  variant="quiet"
                  aria-label={closeLabel ?? messages.banner.close}
                  onClick={close}
                  className="text-fg-muted"
                >
                  <CloseGlyph />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Grow>
  );
}
