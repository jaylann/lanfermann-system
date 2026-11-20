import {
  Alert02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

import type { IconSvgElement } from "@/components/icon/icon";

/** The status set, with `neutral` for a message that is none of them. */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * The symbol of each status, the same in an `Alert`, a toast and a `Banner`: a status never
 * relies on colour, it always has a symbol and words. Server-safe.
 */
export const statusIcons: Record<StatusTone, IconSvgElement> = {
  neutral: InformationCircleIcon,
  info: InformationCircleIcon,
  success: CheckmarkCircle02Icon,
  warning: Alert02Icon,
  danger: AlertCircleIcon,
};

/** The colour of each status symbol. Indigo is never spent on an icon: info stays in the text colour. */
export const statusIconTone: Record<StatusTone, string> = {
  neutral: "text-fg-muted",
  info: "text-fg",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};
