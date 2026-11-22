"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn, mergeClassName } from "@/lib/cn";

export type SwitchProps = SwitchPrimitive.Root.Props;

/**
 * For a setting that takes effect at once. A raised thumb runs in a sunken track: it travels on
 * `seat`, stretches a little while held, and the track fills with Indigo when on. The thumb takes
 * the colour that reads on the track it is on, so it stays visible on every ground.
 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={mergeClassName(
        [
          "group touch-target relative inline-flex h-(--switch-h) w-(--switch-w) shrink-0 items-center rounded-full bg-trough px-0.5 depth-trough",
          "transition-[background-color,box-shadow] duration-150 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "data-checked:bg-accent forced-colors:data-checked:bg-[color:Highlight]",
          "data-disabled:pointer-events-none data-disabled:bg-disabled data-disabled:depth-flat",
        ],
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // 2px of track show around the thumb; it travels the track's width minus its height.
          "block size-[calc(var(--switch-h)-4px)] rounded-full bg-thumb depth-raised depth-tone-thumb",
          "transition-[translate,width,background-color] spring-seat",
          "group-active:w-[calc(var(--switch-h)-1px)]",
          "data-checked:translate-x-[calc(var(--switch-w)-var(--switch-h))] data-checked:bg-thumb-on",
          "data-checked:group-active:translate-x-[calc(var(--switch-w)-var(--switch-h)-3px)]",
          // Disabled, on or off: a dim knob, which wins over the colour of its state.
          "group-data-disabled:bg-thumb-disabled group-data-disabled:depth-flat group-data-disabled:data-checked:bg-thumb-disabled",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
