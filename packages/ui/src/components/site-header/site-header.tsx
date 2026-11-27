"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/button/button";
import { useGround, useGroundMode } from "@/components/ground/ground";
import { Icon } from "@/components/icon/icon";
import { useScrollEdges } from "@/components/scroll-fade/use-scroll-edges";
import { cn } from "@/lib/cn";

/**
 * Where the bar stands and how wide it is, shared by the bar and the top row of the open menu so
 * the way home and the menu button do not move when the menu opens. The bar is inset 8px from
 * the window (16px from `sm`) and padded 12px (16px), so what stands in it lines up with the
 * content of a `Container`: 8 + 12 is its 20px gutter on a phone, 16 + 16 its 32px above. At its
 * widest it is the page's 72rem plus its own padding.
 *
 * It is 48px tall: 8px above and below a control, the 8px it keeps from the window's top. (It was
 * 56; Justin found it too tall, 2026-11-16.)
 */
const barFrame =
  "mx-auto flex h-12 w-[calc(100%-1rem)] max-w-[calc(72rem+2rem)] items-center gap-6 px-3 sm:w-[calc(100%-2rem)] sm:px-4";

export type SiteHeaderProps = ComponentProps<"header"> & {
  /** Stays at the top of the window while the page scrolls under it. */
  sticky?: boolean;
};

/**
 * The bar at the top of a website: what this is, where one can go, and the next step. It floats:
 * a frosted face with a light edge, 8px off the window's top and sides, over the page that
 * scrolls under it.
 *
 * Safari 26 colours its status bar from what it finds about 4px below the window's top edge: if
 * that is inside a fixed or sticky element, it paints that element's colour across the bar, or
 * samples its pixels once when it has no plain colour. So nothing of the bar may reach the top
 * 8px, not even a decoration inside it: a graded blur that reached up to the edge made Safari
 * sample the bar and paint the status bar white (Justin's iPhone, 2026-11-16). With nothing
 * there, the page itself shows behind the status bar.
 *
 * Put a `SiteHeaderBrand` first, then a `NavigationMenu` (with `className="max-lg:hidden"`), then
 * `SiteHeaderActions`. On a phone the `NavigationMenu` gives way to a `SiteHeaderMenu`.
 */
export function SiteHeader({ sticky = true, className, children, ...props }: SiteHeaderProps) {
  return (
    <header
      data-slot="site-header"
      className={cn("isolate z-40 mt-2 w-full", sticky ? "sticky top-2" : "relative", className)}
      {...props}
    >
      <div
        data-slot="site-header-bar"
        className={cn(
          barFrame,
          "rounded-xl bg-ground/85 depth-bar backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        {children}
      </div>
    </header>
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export type SiteHeaderBrandProps = useRender.ComponentProps<"a">;

/**
 * Whose site this is, as the way home: a product's mark with its name in type, or the drawn
 * `Wordmark` (then give the link an `aria-label` that says where it leads). For a router's link,
 * pass it as `render`. Pass the same element to the `SiteHeaderMenu` as its `brand`, and it
 * stands in the open menu where it stands in the bar.
 */
export function SiteHeaderBrand({ render, className, ...props }: SiteHeaderBrandProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: {
      ...props,
      "data-slot": "site-header-brand",
      className: cn(
        "inline-flex shrink-0 items-center gap-2.5 rounded-xs text-lg font-semibold whitespace-nowrap text-fg",
        focusRing,
        className,
      ),
    },
  });
}

/** The next step, at the end of the bar: one button, and at most a quiet one beside it. */
export function SiteHeaderActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="site-header-actions"
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    />
  );
}

export type SiteHeaderMenuProps = Pick<
  DialogPrimitive.Root.Props,
  "open" | "defaultOpen" | "onOpenChange" | "modal"
> & {
  /** The name of the button that opens it ("Menü öffnen"). */
  label: string;
  /** What the menu is about ("Alle Seiten."). It names the menu for assistive tech; not shown. */
  title: string;
  /** The name of the button that closes it. */
  closeLabel?: string;
  /** The bar's `SiteHeaderBrand`, to stand in the menu's top row where it stands in the bar. */
  brand?: ReactNode;
  /** The bar's next step, at the foot of the menu: a button at full width, a quiet link under it. */
  actions?: ReactNode;
  className?: string;
  /** `SiteHeaderMenuGroup`s, or `SiteHeaderMenuLink`s for a short list. */
  children: ReactNode;
};

/**
 * The places of the `NavigationMenu` on a phone: one button at the end of the bar that opens
 * them over the whole window, on the page's own ground. Its top row repeats the bar, with the
 * close button where the menu button was; the places follow in groups, and the next step stands
 * at the foot. It shows below `lg`, where the `NavigationMenu` is hidden.
 *
 * Safari 26 tints its status bar and its toolbar from what covers them: the menu covers both
 * (`h-lvh`, the window with the browser's bars collapsed), square to the window, so both take
 * the ground's colour and no page shows above or below it. Its content fills the visible window
 * (`lvh` less the toolbar's `lvh − dvh`), so the foot stands above the toolbar.
 */
export function SiteHeaderMenu({
  label,
  title,
  closeLabel = "Menü schließen",
  brand,
  actions,
  className,
  children,
  ...dialog
}: SiteHeaderMenuProps) {
  const ground = useGround();
  const groundMode = useGroundMode();
  const menu = useRef<DialogPrimitive.Root.Actions>(null);
  const sheet = useRef<HTMLDivElement>(null);
  // The open menu, once it is there: whether more places wait below (`data-overflow`).
  const [mounted, setMounted] = useState(false);
  useScrollEdges(sheet, "y", mounted);
  const sheetRef = useCallback((node: HTMLDivElement | null) => {
    sheet.current = node;
    setMounted(node !== null);
  }, []);
  const close = () => menu.current?.close();
  return (
    <DialogPrimitive.Root actionsRef={menu} {...dialog}>
      <DialogPrimitive.Trigger
        render={
          <Button
            iconOnly
            variant="quiet"
            aria-label={label}
            data-slot="site-header-menu-trigger"
            className={cn("lg:hidden", className)}
          />
        }
      >
        <Icon icon={Menu01Icon} size={18} />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          ref={sheetRef}
          // The menu itself takes the focus, so it is announced by its name, and Tab goes from
          // the top row down, as it is read.
          initialFocus={sheet}
          data-slot="site-header-menu-sheet"
          data-theme={ground}
          data-mode={groundMode}
          // Following any link in the menu closes it: a place, the way home, the next step. A
          // link on the same page (an anchor) or a router's link would otherwise leave it open.
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a[href]")) close();
          }}
          // Safari 26 cuts a fixed layer with an opaque background off at the top of its floating
          // toolbar, and paints one that is the least bit see-through to the window's foot. At 99%
          // the menu fills the strip behind the toolbar and its places scroll on under it, as a
          // page's text does; opaque, the strip showed the page (Justin's iPhone, 2026-11-16).
          className={cn(
            "group/menu fixed inset-x-0 top-0 z-50 h-lvh overflow-y-auto overscroll-contain bg-ground/99 text-base text-fg-body outline-hidden",
            "transition-opacity spring-sheet data-starting-style:opacity-0",
            "data-ending-style:opacity-0 data-ending-style:spring-leave",
          )}
        >
          <div className="flex min-h-lvh flex-col pb-[calc(100lvh-100dvh)]">
            <div className="sticky top-0 z-10 bg-ground pt-2">
              <div className={barFrame}>
                {brand}
                <DialogPrimitive.Close
                  render={
                    <Button
                      iconOnly
                      variant="quiet"
                      aria-label={closeLabel}
                      data-slot="site-header-menu-close"
                      className="ml-auto"
                    />
                  }
                >
                  <Icon icon={Cancel01Icon} size={18} />
                </DialogPrimitive.Close>
              </div>
            </div>
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <nav
              data-slot="site-header-menu"
              aria-label={title}
              className={cn(
                "mx-auto w-full max-w-[calc(72rem+4rem)] flex-1 px-5 pt-8 sm:px-8",
                "transition-[opacity,translate] spring-sheet",
                "group-data-starting-style/menu:opacity-0 motion-safe:group-data-starting-style/menu:-translate-y-2",
              )}
            >
              <ul className="flex flex-col divide-y divide-hairline">{children}</ul>
            </nav>
            {actions && (
              <div
                data-slot="site-header-menu-actions"
                className={cn(
                  "mx-auto flex w-full max-w-[calc(72rem+4rem)] flex-col gap-2 px-5 pt-10 pb-6 sm:px-8",
                  "*:w-full *:justify-center",
                  "transition-[opacity,translate] delay-[60ms] spring-sheet",
                  "group-data-starting-style/menu:opacity-0 motion-safe:group-data-starting-style/menu:translate-y-2",
                )}
              >
                {actions}
              </div>
            )}
            {/*
             * While more places wait below, they fade out at the menu's foot, so none is cut in
             * half where Safari's toolbar begins (Justin's iPhone, 2026-11-16). At the end the
             * fade goes, and the foot stands clear.
             */}
            <div
              aria-hidden
              data-slot="site-header-menu-fade"
              className="pointer-events-none sticky bottom-0 -mt-16 h-16 shrink-0 bg-linear-to-b from-transparent to-ground opacity-0 transition-opacity duration-200 ease-out group-data-[overflow~=end]/menu:opacity-100"
            />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// How a group sets its places: one column of large ones, or two of small ones.
const ColumnsContext = createContext<1 | 2>(1);

export type SiteHeaderMenuGroupProps = Omit<ComponentProps<"li">, "title"> & {
  /** The entry of the `NavigationMenu` these places stand behind ("Dokumentation"). */
  title: ReactNode;
  /**
   * One column of large places (the default), for the few a reader came for; or two columns of
   * small ones, for a longer list that should not push the rest out of view.
   */
  columns?: 1 | 2;
};

/** The places behind one entry of the `NavigationMenu`, under its name. */
export function SiteHeaderMenuGroup({
  title,
  columns = 1,
  className,
  children,
  ...props
}: SiteHeaderMenuGroupProps) {
  const id = useId();
  return (
    <li
      data-slot="site-header-menu-group"
      className={cn("flex flex-col gap-2 py-6 first:pt-0 last:pb-0", className)}
      {...props}
    >
      <p id={id} className="text-sm text-fg-muted">
        {title}
      </p>
      <ul
        aria-labelledby={id}
        className={cn("flex flex-col", columns === 2 && "grid grid-cols-2 gap-x-6")}
      >
        <ColumnsContext value={columns}>{children}</ColumnsContext>
      </ul>
    </li>
  );
}

export type SiteHeaderMenuLinkProps = useRender.ComponentProps<"a"> & {
  /** The page this link leads to is the one the reader is on. */
  current?: boolean;
};

/** One place in the `SiteHeaderMenu`. Following it closes the menu, as every link in it does. */
export function SiteHeaderMenuLink({
  current = false,
  render,
  className,
  children,
  ...props
}: SiteHeaderMenuLinkProps) {
  const columns = useContext(ColumnsContext);
  const link = useRender({
    defaultTagName: "a",
    render,
    props: {
      ...props,
      "data-slot": "site-header-menu-link",
      "aria-current": current ? "page" : undefined,
      className: cn(
        "flex items-center gap-2.5 rounded-xs font-medium",
        columns === 2
          ? "min-h-10 text-base text-fg-body hover:text-fg aria-[current=page]:text-fg"
          : "min-h-11 text-xl text-fg",
        focusRing,
        className,
      ),
      children: (
        <>
          {children}
          {current && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />}
        </>
      ),
    },
  });
  return <li data-slot="site-header-menu-item">{link}</li>;
}
