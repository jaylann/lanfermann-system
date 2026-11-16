"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { mergeClassName } from "@/lib/cn";

const avatarVariants = cva(
  // A rounded square, never a circle: the kit's shapes are milled, not turned.
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-fg font-semibold text-ground select-none forced-colors:outline",
  {
    variants: {
      size: {
        sm: "size-6 rounded-xs text-xs",
        md: "size-7 rounded-sm text-xs",
        lg: "size-9 rounded-md text-sm",
        xl: "size-12 rounded-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarProps = AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants>;

/**
 * A person or a business, as a rounded square. Put an `AvatarImage` and an `AvatarFallback` with
 * one or two initials inside; the initials show until the picture has loaded, or if there is none.
 */
export function Avatar({ className, size, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={mergeClassName(avatarVariants({ size }), className)}
      {...props}
    />
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
