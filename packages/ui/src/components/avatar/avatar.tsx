"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties } from "react";

import { defaultPresenceLabels, type Presence } from "@/components/avatar-group/people";
import { avatarGeometry, cutMask } from "@/internal/avatar-cut";
import { PresenceDot } from "@/internal/presence-dot";
import { mergeClassName } from "@/lib/cn";

const avatarVariants = cva(
  // Round: a person is not a part of the machine (Justin, 2026-11-19; before, a rounded square).
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-fg font-semibold text-ground select-none forced-colors:outline",
  {
    variants: {
      size: {
        sm: "size-6 text-[0.625rem]",
        md: "size-7 text-xs",
        lg: "size-9 text-sm",
        xl: "size-12 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** The width of the gap a presence dot is cut out of the avatar with, in pixels. */
const DOT_GAP = 2;

export type AvatarProps = AvatarPrimitive.Root.Props &
  VariantProps<typeof avatarVariants> & {
    /**
     * Whether the person is there: a dot on the edge at the bottom end, cut out of the avatar
     * with a gap, so it reads on every ground. It is said in words as well (`presenceLabel`).
     */
    presence?: Presence;
    /** The word assistive tech hears for the presence. „Online“, „Abwesend“, „Offline“. */
    presenceLabel?: string;
  };

/**
 * A person or a business, as a circle. Put an `AvatarImage` and an `AvatarFallback` with one or
 * two initials inside; the initials show until the picture has loaded, or if there is none.
 * Several people at once are an `AvatarGroup`.
 */
export function Avatar({ className, size, presence, presenceLabel, style, ...props }: AvatarProps) {
  const root = (cut?: string, cutRtl?: string) => {
    const vars = { "--avatar-cut": cut, "--avatar-cut-rtl": cutRtl } as CSSProperties;
    return (
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-cut={cut ? "" : undefined}
        style={
          !cut
            ? style
            : typeof style === "function"
              ? (state) => ({ ...vars, ...style(state) })
              : { ...vars, ...style }
        }
        className={mergeClassName(avatarVariants({ size }), className)}
        {...props}
      />
    );
  };
  if (!presence) return root();

  const geometry = avatarGeometry[size ?? "md"];
  const cut = { size: geometry.size, gap: DOT_GAP, dot: geometry.dot };
  return (
    <span data-slot="avatar-place" className="relative inline-flex shrink-0">
      {root(cutMask(cut), cutMask({ ...cut, rtl: true }))}
      <PresenceDot slot="avatar-presence" presence={presence} diameter={geometry.dot} />
      <span className="sr-only">{presenceLabel ?? defaultPresenceLabels[presence]}</span>
    </span>
  );
}

export function AvatarImage({ className, alt = "", ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      // The name stands next to the avatar almost everywhere, so the picture is decorative.
      alt={alt}
      className={mergeClassName("size-full object-cover", className)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={mergeClassName("flex size-full items-center justify-center", className)}
      {...props}
    />
  );
}
