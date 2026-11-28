import {
  Alert02Icon,
  AlertCircleIcon,
  AlertDiamondIcon,
  Idea01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import type { ComponentProps, ReactNode } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { cn } from "@/lib/cn";
import { Localized } from "@/locale/localized";

/** The five kinds of a GitHub alert (`> [!NOTE]` …), which is where most callouts come from. */
export type CalloutTone = "note" | "tip" | "important" | "warning" | "caution";

type ToneSpec = {
  icon: IconSvgElement;
  /** The word that opens it when no title is given. */
  edge: string;
  title: string;
  iconColor: string;
};

// Indigo is never spent on an icon or a title: "important" says it with the edge alone.
const tones: Record<CalloutTone, ToneSpec> = {
  note: {
    icon: InformationCircleIcon,
    edge: "border-line",
    title: "text-fg",
    iconColor: "text-fg-muted",
  },
  tip: {
    icon: Idea01Icon,
    edge: "border-success",
    title: "text-success",
    iconColor: "text-success",
  },
  important: {
    icon: AlertDiamondIcon,
    edge: "border-accent",
    title: "text-fg",
    iconColor: "text-fg",
  },
  warning: {
    icon: Alert02Icon,
    edge: "border-warning",
    title: "text-warning",
    iconColor: "text-warning",
  },
  caution: {
    icon: AlertCircleIcon,
    edge: "border-danger",
    title: "text-danger",
    iconColor: "text-danger",
  },
};

export type CalloutProps = Omit<ComponentProps<"div">, "title"> & {
  tone?: CalloutTone;
  /** Replaces the tone's word ("Hinweis", "Warnung") as the first line. */
  title?: ReactNode;
  /** Replaces the tone's icon. A callout always has one: colour alone never carries its kind. */
  icon?: IconSvgElement;
};

/**
 * A remark set apart from the text it belongs to: a note, a tip, something important, a warning,
 * a caution. It is part of the page and is read in order, so it is a note to assistive tech, not
 * a live message; for what happens now (a form that failed), use `Alert`.
 *
 * It stays text: flat on the page, set apart by a 2px edge in its tone on the left, its kind in
 * words and an icon on the first line. The body is one or a few short paragraphs. Keep it rare:
 * a page where every other block is a callout has none.
 */
export function Callout({
  tone = "note",
  title,
  icon,
  className,
  children,
  ...props
}: CalloutProps) {
  const spec = tones[tone];
  return (
    <div
      role="note"
      data-slot="callout"
      data-tone={tone}
      className={cn(
        "flex flex-col gap-1 border-l-2 py-0.5 pl-4 text-base text-fg-body forced-colors:border-[CanvasText]",
        spec.edge,
        className,
      )}
      {...props}
    >
      <p
        data-slot="callout-title"
        className={cn("flex items-center gap-2 font-semibold", spec.title)}
      >
        <Icon icon={icon ?? spec.icon} size={18} className={cn("shrink-0", spec.iconColor)} />
        {title ?? <Localized ns="callout" name={tone} />}
      </p>
      <div data-slot="callout-body" className="flex flex-col gap-2 text-pretty">
        {children}
      </div>
    </div>
  );
}
