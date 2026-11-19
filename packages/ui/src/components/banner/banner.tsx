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
import { useLive } from "@/internal/live";
import { statusIcons, statusIconTone } from "@/internal/status-icon";
import { cn } from "@/lib/cn";

export type BannerTone = "info" | "success" | "warning" | "danger";

const wash: Record<BannerTone, string> = {
  info: "bg-info-soft",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
};

/** The faint edge in the status colour: under a strip across the page, around one in a column. */
const edge: Record<"bleed" | "inset", Record<BannerTone, string>> = {
  bleed: {
    info: "shadow-[inset_0_-1px_0] shadow-info/20",
    success: "shadow-[inset_0_-1px_0] shadow-success/25",
    warning: "shadow-[inset_0_-1px_0] shadow-warning/30",
    danger: "shadow-[inset_0_-1px_0] shadow-danger/25",
  },
  inset: {
    info: "rounded-lg inset-ring inset-ring-info/20",
    success: "rounded-lg inset-ring inset-ring-success/25",
    warning: "rounded-lg inset-ring inset-ring-warning/30",
    danger: "rounded-lg inset-ring inset-ring-danger/25",
  },
};

const defaultToneLabels: Record<BannerTone, string> = {
  info: "Hinweis",
  success: "Erledigt",
  warning: "Warnung",
  danger: "Fehler",
};

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
   * `bleed` is a wash across the full width of the page or of the main column, under its top
   * edge. `inset` is a strip set into the column, with rounded corners.
   */
  layout?: "bleed" | "inset";
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
 * A strip in the status wash with the status symbol, a sentence, an optional action and a close
 * key. The title says what is the case, the text what to do. A banner that is there when the
 * page loads stands still; one that arrives later pushes the page down and is announced. Closed,
 * it fades and the page follows it up in the same motion.
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
  closeLabel = "Hinweis schließen",
  layout = "bleed",
  finalFocus,
  toneLabels,
  className,
  ...props
}: BannerProps) {
  const [chosen, setChosen] = useState(defaultOpen);
  const shown = open ?? chosen;
  // What has been closed stays drawn until it has faded and its room has closed.
  const [drawn, setDrawn] = useState(shown);
  if (shown && !drawn) setDrawn(true);
  const leaving = drawn && !shown;
  const live = useLive();
  const grow = useRef<HTMLDivElement>(null);
  const labels = { ...defaultToneLabels, ...toneLabels };

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
      ref={grow}
      // Polite, and assertive for danger: only what arrives after the page has loaded is said.
      role={tone === "danger" ? "alert" : "status"}
      data-slot="banner"
      data-tone={tone}
      data-layout={layout}
      data-live={live ? "" : undefined}
      onTransitionEnd={settled}
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
              "flex items-start gap-3 py-2.5 ps-4 pe-2.5 text-control text-fg-body",
              wash[tone],
              edge[layout][tone],
              layout === "bleed" && "sm:ps-6 sm:pe-4",
              // Arriving after load it comes down from the top edge as the page makes room.
              "transition-[opacity,translate] spring-settle",
              "in-data-live:starting:-translate-y-(--motion-enter-offset) in-data-live:starting:opacity-0",
              "data-leaving:opacity-0 data-leaving:spring-leave",
              "forced-colors:outline",
            )}
          >
            <Icon
              icon={statusIcons[tone]}
              size={18}
              className={cn("mt-px shrink-0", statusIconTone[tone])}
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <p data-slot="banner-text" className="min-w-0 flex-[1_1_18rem] text-pretty">
                <span className="sr-only">{labels[tone]}: </span>
                <span data-slot="banner-title" className="font-semibold text-fg">
                  {title}
                </span>
                {children !== undefined && <> {children}</>}
              </p>
              {action !== undefined && (
                <div data-slot="banner-action" className="-my-0.5 shrink-0">
                  {action}
                </div>
              )}
            </div>
            {dismissible && (
              <Button
                data-slot="banner-close"
                iconOnly
                size="sm"
                variant="quiet"
                aria-label={closeLabel}
                onClick={close}
                className="-my-0.5 text-fg-muted"
              >
                <CloseGlyph />
              </Button>
            )}
          </div>
        </div>
      )}
    </Grow>
  );
}
