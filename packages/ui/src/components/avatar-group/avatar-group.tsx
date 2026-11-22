"use client";

import { type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import {
  AVATAR_GAP,
  avatarGeometry,
  avatarOverlap,
  type AvatarSize,
  cutMask,
} from "@/internal/avatar-cut";
import { PresenceDot } from "@/internal/presence-dot";
import { cn } from "@/lib/cn";

import {
  type AvatarPerson,
  defaultPresenceLabels,
  initialsOf,
  listOf,
  personLabel,
  type Presence,
} from "./people";

export type AvatarGroupProps = Omit<ComponentProps<"div">, "children"> & {
  /** Everyone, in the order of importance: the first stands in front. */
  people: readonly AvatarPerson[];
  /**
   * How many tiles the stack has room for, the „+3“ tile included. Default 4: three people
   * and the rest as a number.
   */
  max?: number;
  size?: AvatarSize;
  /**
   * What the group is, before the names, for assistive tech: „Bearbeitet von“. The names follow
   * it; without it they stand alone.
   */
  label?: string;
  presenceLabels?: Partial<Record<Presence, string>>;
  /** The language the names are joined in: „Anna, Jonas und Lena“. */
  locale?: Intl.LocalesArgument;
};

/**
 * Several people at once, as one stack of overlapping `Avatar`s: who is in a team, who works on
 * a record, who has seen it. The first stands in front. Between two the gap is cut out of the
 * one underneath, following the one in front at a constant distance, so the stack is right on
 * every ground, on a washed table row and over a picture. More people than fit become a „+3“
 * tile of the same shape.
 *
 * Each avatar names itself in a tooltip under the pointer (one tooltip, which moves along the
 * stack without waiting again), the „+3“ tile names the rest, and assistive tech hears the whole
 * group as one sentence. A presence dot carries its words in both.
 */
export function AvatarGroup({
  people,
  max = 4,
  size = "md",
  label,
  presenceLabels,
  locale = "de-DE",
  className,
  style,
  ...props
}: AvatarGroupProps) {
  const words = { ...defaultPresenceLabels, ...presenceLabels };
  const room = Math.max(1, max);
  const front = people.length > room ? people.slice(0, room - 1) : people;
  const rest = people.slice(front.length);

  const geometry = avatarGeometry[size];
  const gap = AVATAR_GAP;
  const over = avatarOverlap[size];
  const step = geometry.size - over;
  /**
   * The mask of a tile: cut by the one in front (and by its dot, which stands half outside it,
   * over this one), and around its own dot.
   */
  const cut = (index: number, dot: boolean) => {
    const before = index > 0 ? front[index - 1] : undefined;
    const options = {
      size: geometry.size,
      gap,
      step: index > 0 ? step : undefined,
      dot: dot ? geometry.dot : undefined,
      frontDot: before?.presence ? geometry.dot : undefined,
    };
    const mask = cutMask(options);
    if (!mask) return undefined;
    return {
      "data-cut": "",
      style: {
        "--avatar-cut": mask,
        "--avatar-cut-rtl": cutMask({ ...options, rtl: true }),
      } as CSSProperties,
    };
  };

  const everyone = listOf(
    people.map((person) => personLabel(person, words)),
    locale,
  );
  // Initials and the number stand in the middle of what is seen of a tile, not of the tile:
  // the part under the one in front would otherwise hide their first letter.
  const centred = (first: boolean) => (first ? undefined : "ps-(--avatar-hidden)");
  const tiles: { key: string; tip: ReactNode; content: ReactNode }[] = front.map(
    (person, index) => ({
      key: `${index}:${person.name}`,
      tip: personLabel(person, words),
      content: (
        <>
          <Avatar size={size} {...cut(index, person.presence !== undefined)}>
            {person.src && <AvatarImage src={person.src} />}
            <AvatarFallback className={centred(index === 0)}>
              {person.initials ?? initialsOf(person.name)}
            </AvatarFallback>
          </Avatar>
          {person.presence && (
            <PresenceDot
              slot="avatar-group-presence"
              presence={person.presence}
              diameter={geometry.dot}
            />
          )}
        </>
      ),
    }),
  );
  if (rest.length > 0) {
    tiles.push({
      key: "rest",
      tip: listOf(
        rest.map((person) => personLabel(person, words)),
        locale,
      ),
      content: (
        <span
          data-slot="avatar-group-more"
          {...cut(tiles.length, false)}
          // The same shape as an avatar, quieter: it stands for people, it is not one.
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-placeholder font-semibold text-fg tabular-nums select-none forced-colors:outline",
            centred(tiles.length === 0),
            size === "sm" && "size-6 text-[0.625rem]",
            size === "md" && "size-7 text-xs",
            size === "lg" && "size-9 text-sm",
            size === "xl" && "size-12 text-base",
          )}
        >
          +{rest.length}
        </span>
      ),
    });
  }

  return (
    <div
      role="img"
      aria-label={label ? `${label}: ${everyone}` : everyone}
      data-slot="avatar-group"
      data-size={size}
      style={
        {
          "--avatar-step": `${-over / 16}rem`,
          "--avatar-hidden": `${(over + gap) / 16}rem`,
          ...style,
        } as CSSProperties
      }
      // `isolate`: the stacking below stays inside the group.
      className={cn("isolate inline-flex items-center", className)}
      {...props}
    >
      <Tooltip>
        {({ payload }) => (
          <>
            {tiles.map((tile, index) => (
              <TooltipTrigger
                key={tile.key}
                payload={tile.tip}
                render={<span />}
                data-slot="avatar-group-item"
                // The first lies on top: hit-testing ignores the masks, so the order decides
                // which avatar the pointer is over where two overlap.
                style={{ zIndex: tiles.length - index }}
                className="relative inline-flex shrink-0 not-first:ms-(--avatar-step)"
              >
                {tile.content}
              </TooltipTrigger>
            ))}
            <TooltipContent>{payload as ReactNode}</TooltipContent>
          </>
        )}
      </Tooltip>
    </div>
  );
}
