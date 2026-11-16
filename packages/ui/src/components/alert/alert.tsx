import {
  Alert02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { cn } from "@/lib/cn";

const alertVariants = cva(
  // Flat: an alert is read. A soft wash and a faint edge in the status colour.
  "grid grid-cols-[auto_1fr] items-start gap-x-3 rounded-lg px-4 py-3 text-base text-fg-body inset-ring forced-colors:outline",
  {
    variants: {
      tone: {
        neutral: "bg-surface-quiet inset-ring-hairline",
        info: "bg-info-soft inset-ring-info/20",
        success: "bg-success-soft inset-ring-success/25",
        warning: "bg-warning-soft inset-ring-warning/30",
        danger: "bg-danger-soft inset-ring-danger/25",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type Tone = NonNullable<VariantProps<typeof alertVariants>["tone"]>;

const icons: Record<Tone, IconSvgElement> = {
  neutral: InformationCircleIcon,
  info: InformationCircleIcon,
  success: CheckmarkCircle02Icon,
  warning: Alert02Icon,
  danger: AlertCircleIcon,
};

// Indigo is never spent on an icon: the info icon stays in the text colour.
const iconTone: Record<Tone, string> = {
  neutral: "text-fg-muted",
  info: "text-fg",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export type AlertProps = ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Replaces the tone's icon. An alert always has one: colour alone never carries a status. */
    icon?: IconSvgElement;
  };

/**
 * A message that belongs to the page, not to a moment: a plan that ends, a form that could not
 * be sent. Say what happened in the title and what to do in the description. It is announced
 * politely (`role="status"`); pass `role="alert"` only when the person must act now.
 */
export function Alert({ className, tone, icon, children, ...props }: AlertProps) {
  const resolved = tone ?? "neutral";
  return (
    <div
      data-slot="alert"
      data-tone={resolved}
      role="status"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <Icon
        icon={icon ?? icons[resolved]}
        size={18}
        className={cn("mt-[3px]", iconTone[resolved])}
      />
      <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...props }: ComponentProps<"p">) {
  return (
    <p data-slot="alert-title" className={cn("font-semibold text-fg", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="alert-description" className={cn("text-fg-body", className)} {...props} />;
}
