"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Menu, MenuContent, MenuLinkItem, MenuTrigger } from "@/components/menu/menu";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

/** A place folded into the ellipsis: its name and where it leads. */
export type BreadcrumbFold = {
  label: ReactNode;
  href: string;
  /** A router's link to render the entry with, as a `MenuLinkItem` takes it. */
  render?: ReactElement;
};

export type BreadcrumbEllipsisProps = Omit<ComponentProps<typeof Menu>, "children"> & {
  /** The places folded away, from the outside in. */
  items: readonly BreadcrumbFold[];
  /** The name of the key for assistive tech. */
  label?: string;
  className?: string;
};

/**
 * The places in the middle of a long trail, folded into „…“: a key that opens a `Menu` of them,
 * from the outside in, each a link. Put it in a `BreadcrumbItem` where the folded places stood
 * and keep the first place and the last one or two written out („Dateien › … ›
 * building-gbar“); on a phone the last one alone may stay („… › building-gbar“). Which places
 * fold is the page's to decide. A link of the trail can take a drop (`useDropTarget`); the
 * folded ones are reached through the menu instead.
 */
export function BreadcrumbEllipsis({ items, label, className, ...props }: BreadcrumbEllipsisProps) {
  const { messages } = useLocale();
  return (
    <Menu {...props}>
      <MenuTrigger
        data-slot="breadcrumb-ellipsis"
        aria-label={label ?? messages.breadcrumbs.more}
        className={cn(
          "touch-target relative -mx-1 inline-flex h-5 items-center rounded-xs px-1 leading-none text-fg-muted",
          "transition-colors spring-snap hover:bg-hover hover:text-fg data-popup-open:bg-hover data-popup-open:text-fg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          className,
        )}
      >
        …
      </MenuTrigger>
      <MenuContent>
        {items.map((item) => (
          <MenuLinkItem key={item.href} href={item.href} render={item.render}>
            {item.label}
          </MenuLinkItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
