import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { useLive } from "@/internal/presence";

import { RollingNumber } from "./rolling-number";

const meta = {
  title: "Components/RollingNumber",
  component: RollingNumber,
  parameters: { visual: { viewport: { width: 440, height: 150 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const euro = { style: "currency", currency: "EUR" } as const;
/** German writes a no-break space before the euro sign. */
const NBSP = String.fromCharCode(0xa0);

/** A figure and the keys that change it, as a dashboard would. */
function Counter({
  start,
  steps,
  format,
  after,
}: {
  start: number;
  steps: number[];
  format?: Intl.NumberFormatOptions;
  /** Words after the number, to see them pushed aside when it gains or loses a place. */
  after?: string;
}) {
  const [value, setValue] = useState(start);
  return (
    // A fixed width, so the number grows to the right and does not re-centre.
    <div className="flex w-80 flex-col items-start gap-4">
      <p className="text-2xl font-medium tracking-[-0.017em] text-fg">
        <RollingNumber value={value} format={format} />
        {after && <span className="text-fg-muted"> {after}</span>}
      </p>
      <div className="flex gap-2">
        {steps.map((step) => (
          <Button
            key={step}
            size="sm"
            variant="secondary"
            data-step={step}
            aria-label={step > 0 ? `Um ${step} erhöhen` : `Um ${-step} verringern`}
            onClick={() => setValue((current) => current + step)}
          >
            {step > 0 ? `+${step}` : `−${-step}`}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * How it is written: `format` takes the options of `Intl.NumberFormat`, German by default.
 * Grouping dots, the decimal comma and the signs stand between the columns.
 */
export const Formats: Story = {
  parameters: { visual: { viewport: { width: 520, height: 300 } } },
  render: () => (
    <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-8 gap-y-2 text-control">
      {(
        [
          ["Ganze Zahl", 12_480, undefined],
          ["Euro", 1234.5, euro],
          ["Prozent", 0.125, { style: "percent", minimumFractionDigits: 1 }],
          ["Dezimal", 3.14159, { maximumFractionDigits: 2 }],
          ["Kompakt", 1_234_567, { notation: "compact" }],
          ["Negativ", -320, euro],
        ] as const
      ).map(([term, value, format]) => (
        <div key={term} className="contents">
          <dt className="text-fg-muted">{term}</dt>
          <dd className="text-xl font-medium text-fg">
            <RollingNumber value={value} format={format} />
          </dd>
        </div>
      ))}
    </dl>
  ),
};

/**
 * Each column rolls the way the number moves. +3 from 127 rolls the ones forward through 9 into
 * 0 and the tens up by one; −3 rolls them back.
 */
export const Rolling: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "up", click: '[data-step="1"]' },
        { name: "carry", click: '[data-step="3"]' },
        { name: "down", click: '[data-step="-3"]' },
      ],
    },
  },
  render: () => <Counter start={127} steps={[1, 3, -3]} />,
};

/** A number that gains a place: the new digit and its grouping dot open and fade in. */
export const Gaining: Story = {
  parameters: { visual: { motion: [{ name: "gain", click: '[data-step="1"]' }] } },
  render: () => <Counter start={999} steps={[1]} after="Besuche" />,
};

/** A number that loses a place: the digit and the dot fade, then their places close. */
export const Losing: Story = {
  parameters: { visual: { motion: [{ name: "lose", click: '[data-step="-1"]' }] } },
  render: () => <Counter start={1000} steps={[-1]} after="Besuche" />,
};

/**
 * A change that arrives while the digits still move: they go on from where they are, in the
 * same direction or back.
 */
export const Retarget: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "again", click: '[data-step="8"]', then: { click: '[data-step="8"]', at: 120 } },
        { name: "back", click: '[data-step="8"]', then: { click: '[data-step="-8"]', at: 120 } },
      ],
    },
  },
  render: () => <Counter start={1236} steps={[8, -8]} format={euro} />,
};

/**
 * Tests the contract: nothing moves on load, assistive tech and the clipboard get the written
 * value, and only the columns whose digit changes roll.
 */
export const Contract: Story = {
  render: () => <Counter start={127} steps={[1]} format={euro} />,
  play: async ({ canvasElement, userEvent, step }) => {
    const number = canvasElement.querySelector<HTMLElement>('[data-slot="rolling-number"]')!;
    const written = (amount: string) => `${amount}${NBSP}€`;
    const said = () => number.querySelector(".sr-only")?.textContent;

    await step("Nothing moves when it first shows", async () => {
      await waitFor(() => expect(number.dataset.live).toBe(""));
      await expect(number.getAnimations({ subtree: true })).toHaveLength(0);
    });

    await step("Assistive tech reads the written value, once", async () => {
      await expect(said()).toBe(written("127,00"));
      const columns = number.querySelectorAll('[aria-hidden="true"] [data-slot$="column"]');
      await expect(columns).toHaveLength(5);
    });

    await step("Copying it gives the written value, not the columns", async () => {
      const selection = getSelection()!;
      selection.selectAllChildren(number);
      // Firefox gives the no-break space as a plain one.
      await expect(selection.toString().trim().replace(" ", NBSP)).toBe(written("127,00"));
      selection.removeAllRanges();
    });

    await step("Only the column whose digit changes rolls", async () => {
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-step="1"]')!);
      await waitFor(() => expect(said()).toBe(written("128,00")));
      const rolling = number
        .getAnimations({ subtree: true })
        .filter((animation) => (animation as CSSTransition).transitionProperty === "--roll");
      await expect(rolling).toHaveLength(1);
    });
  },
};

/** Counts what moves in the frame after the number's columns first show. */
function Watched({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const live = useLive();
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const watch = new MutationObserver(() => {
      if (!element.querySelector('[data-slot="rolling-number-place"]')) return;
      watch.disconnect();
      requestAnimationFrame(() => {
        element.dataset.moving = String(element.getAnimations({ subtree: true }).length);
      });
    });
    watch.observe(element, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, []);
  return (
    <div ref={box} data-watch data-live={live ? "" : undefined}>
      {children}
    </div>
  );
}

/**
 * As a test: inside a list that is live already (a chart's axis, a live table) a number that
 * first shows stands still. Its places open only for the number's own changes.
 */
export const InsideALiveBox: Story = {
  render: () => (
    <Watched>
      <RollingNumber value={1234} />
    </Watched>
  ),
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>("[data-watch]");
    await waitFor(() => expect(box?.dataset.moving).toBe("0"));
  },
};
