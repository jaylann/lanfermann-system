import type { Meta, StoryObj } from "@storybook/react-vite";
import { spring } from "motion";
import { useState } from "react";

import { linkVariants } from "@/components/link/link-variants";
import { cn } from "@/lib/cn";
import { type SpringName, springNames, springs } from "@/motion/springs";

const meta = {
  title: "Foundations/Motion",
  parameters: { layout: "padded", visual: { viewport: { width: 860, height: 640 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const purpose: Record<SpringName, string> = {
  snap: "press down, hover",
  settle: "popups entering, panels",
  seat: "ring to disc, check, thumb",
  glide: "tab rule, segment thumb",
  sheet: "dialog, toast entering",
  leave: "every exit",
  throw: "releasing a drag",
  recoil: "parts let go: a pill's marks",
  rebound: "a stretched thumb coming to rest",
};

// Tailwind only generates classes it can read as literals.
const springClass: Record<SpringName, string> = {
  snap: "spring-snap",
  settle: "spring-settle",
  seat: "spring-seat",
  glide: "spring-glide",
  sheet: "spring-sheet",
  leave: "spring-leave",
  throw: "spring-throw",
  recoil: "spring-recoil",
  rebound: "spring-rebound",
};

/** Position over 600ms, sampled from the same generator Motion animates with. */
function curve(name: SpringName) {
  const { visualDuration, bounce } = springs[name];
  const generator = spring(visualDuration, bounce);
  const points: string[] = [];
  for (let t = 0; t <= 600; t += 10) {
    const { value } = generator.next(t);
    points.push(`${(t / 600) * 200},${48 - Number(value) * 36}`);
  }
  return points.join(" ");
}

/** One table for CSS and JavaScript. Bounce only on small parts and on things that were thrown. */
export const Springs: Story = {
  render: function Render() {
    const [on, setOn] = useState(false);
    return (
      <div className="flex w-full max-w-3xl flex-col">
        <button
          type="button"
          data-slot="toggle"
          onClick={() => setOn((value) => !value)}
          className={cn("mb-4 self-start text-sm", linkVariants())}
        >
          Alle auslösen
        </button>
        {springNames.map((name, index) => (
          <div
            key={name}
            className={cn(
              "grid grid-cols-[4.5rem_10rem_200px_1fr] items-center gap-6 border-t py-3",
              index === 0 ? "border-t-2 border-rule" : "border-line",
            )}
          >
            <p className="font-semibold text-fg">{name}</p>
            <p className="text-sm text-fg-muted">
              {springs[name].visualDuration * 1000}ms · bounce {springs[name].bounce}
              <br />
              {purpose[name]}
            </p>
            <svg
              width="200"
              height="56"
              viewBox="0 0 200 56"
              aria-hidden
              className="overflow-visible"
            >
              <line x1="0" y1="12" x2="200" y2="12" className="stroke-hairline" strokeWidth="1" />
              <line x1="0" y1="48" x2="200" y2="48" className="stroke-line" strokeWidth="1" />
              <polyline points={curve(name)} fill="none" className="stroke-fg" strokeWidth="2" />
            </svg>
            <div className="@container relative h-5 rounded-full bg-surface-quiet depth-socket">
              <div
                className={cn(
                  // Moved by `translate`, as every travelling part is: no layout per frame.
                  "absolute top-0.5 left-0.5 size-4 rounded-full bg-key transition-[translate]",
                  springClass[name],
                  on && "translate-x-[calc(100cqw-1.25rem)]",
                )}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    visual: {
      viewport: { width: 860, height: 640 },
      motion: [{ name: "all", click: "[data-slot=toggle]", frames: 9 }],
    },
  },
};
