"use client";

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";

import { useGround } from "@/components/ground/ground";
import { listSheet } from "@/internal/popup";
import { mergeClassName } from "@/lib/cn";

/**
 * The menu of the thing under the pointer: a right click on a row, a long press on a phone. It
 * is a shortcut, never the only way. The keyboard cannot open it, and nobody can see that it is
 * there, so everything in it must also be reachable another way, usually the row's own `Menu`
 * behind a key ("Weitere Aktionen"). Build both from one list of entries.
 *
 * Its rows are the menu's: put `MenuItem`, `MenuSeparator`, `MenuCheckboxItem`, `MenuGroup` and
 * `MenuSub` into the `ContextMenuContent`.
 */
export const ContextMenu = ContextMenuPrimitive.Root;

/**
 * The area the menu belongs to. It is a plain block around its children; make it the thing
 * itself with `render` (a table row, a card). While the menu is open it carries
 * `data-popup-open`, so the thing it is about can stay marked.
 */
export function ContextMenuTrigger(props: ContextMenuPrimitive.Trigger.Props) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

export type ContextMenuContentProps = ContextMenuPrimitive.Popup.Props;

/**
 * The sheet, where the pointer is. It opens many times a day and under the hand, so it only
 * fades in, fast, and does not grow or travel; it leaves like every sheet.
 */
export function ContextMenuContent({ className, ...props }: ContextMenuContentProps) {
  const ground = useGround();
  return (
    <ContextMenuPrimitive.Portal>
      {/* No side and no offsets: they would move the sheet away from the pointer. */}
      <ContextMenuPrimitive.Positioner
        data-slot="context-menu-positioner"
        className="z-50 outline-none"
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          data-theme={ground}
          className={mergeClassName(
            [
              listSheet,
              // No `data-instant` here: Base UI takes every right click for a keyboard press
              // (its event counts no clicks), and the sheet would never fade.
              "min-w-48 transition-opacity spring-snap data-starting-style:opacity-0",
              "data-ending-style:opacity-0 data-ending-style:spring-leave",
            ],
            className,
          )}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}
