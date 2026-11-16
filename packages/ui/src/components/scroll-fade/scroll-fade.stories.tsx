import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef } from "react";
import { expect, waitFor } from "storybook/test";

import { Badge } from "@/components/badge/badge";
import { Link } from "@/components/link/link";

import { ScrollFade, type ScrollFadeProps } from "./scroll-fade";

const meta = {
  title: "Components/ScrollFade",
  component: ScrollFade,
  parameters: {
    visual: { viewport: { width: 440, height: 330 } },
  },
} satisfies Meta<typeof ScrollFade>;

export default meta;
type Story = StoryObj<typeof meta>;

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

const INVOICES = [
  { id: "RE-2026-118", customer: "Schreinerei Huber", amount: 2380 },
  { id: "RE-2026-117", customer: "Bäckerei Kornprobst", amount: 4165 },
  { id: "RE-2026-116", customer: "Friseursalon Haarscharf", amount: 892.5 },
  { id: "RE-2026-115", customer: "Brauerei Giesinger Hof", amount: 6902 },
  { id: "RE-2026-114", customer: "Metzgerei Obermaier", amount: 1547 },
  { id: "RE-2026-113", customer: "Blumen Seidl", amount: 714 },
  { id: "RE-2026-112", customer: "Café Fräulein Grüneis", amount: 3094 },
  { id: "RE-2026-111", customer: "Zimmerei Lechner", amount: 5236 },
  { id: "RE-2026-110", customer: "Optik Sonnleitner", amount: 1309 },
];

const TOPICS = [
  "Angebote",
  "Rechnungen",
  "Mahnungen",
  "Terminbuchung",
  "Zahlungsabgleich",
  "Auftragsbestätigung",
  "Lieferscheine",
  "Gutschriften",
];

/** The box around the scrolling one: the face and the edge stay whole while the list fades. */
function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="w-80 rounded-xl bg-surface inset-ring inset-ring-hairline">{children}</div>
  );
}

function Invoices({ count = INVOICES.length, ...props }: ScrollFadeProps & { count?: number }) {
  return (
    <Sheet>
      <ScrollFade className="max-h-56" {...props}>
        <ul className="divide-y divide-hairline px-4">
          {INVOICES.slice(0, count).map((invoice) => (
            <li key={invoice.id} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="flex min-w-0 flex-col">
                <Link href={`#${invoice.id}`} variant="quiet" className="font-medium text-fg">
                  {invoice.customer}
                </Link>
                <span className="font-mono text-sm text-fg-muted">{invoice.id}</span>
              </span>
              <span className="text-fg-body tabular-nums">{euro.format(invoice.amount)}</span>
            </li>
          ))}
        </ul>
      </ScrollFade>
    </Sheet>
  );
}

/** A list longer than its box: it fades at its foot, where more rows wait. */
export const List: Story = {
  render: () => <Invoices />,
};

/** Brings the box to the middle of its way once it is laid out: rows wait at both ends. */
function ScrolledToMiddle({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current?.querySelector<HTMLElement>('[data-slot="scroll-fade"]');
    if (!box) return;
    // The pictures of this story are compared, so the place must not depend on when the web
    // font arrives. With scroll anchoring, a font that came after the scroll moved the list by
    // a pixel (the first line's box changes with the font, and the browser holds on to it).
    box.style.overflowAnchor = "none";
    const observer = new ResizeObserver(() => {
      box.scrollTop = Math.floor((box.scrollHeight - box.clientHeight) / 2);
      box.scrollLeft = Math.floor((box.scrollWidth - box.clientWidth) / 2);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}

/** Scrolled to the middle, both edges fade. The sheet's own edge stays whole. */
export const Scrolled: Story = {
  render: () => (
    <ScrolledToMiddle>
      <Invoices />
    </ScrolledToMiddle>
  ),
};

/** What fits is not faded: the box looks like any other. */
export const Fits: Story = {
  render: () => <Invoices count={3} />,
};

/** A row that is wider than its place scrolls sideways and fades at the side that has more. */
export const Row: Story = {
  parameters: { visual: { viewport: { width: 440, height: 140 } } },
  render: () => (
    <ScrollFade
      axis="x"
      role="group"
      aria-label="Themen"
      tabIndex={0}
      className="w-80 [scrollbar-width:none] rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <ul className="flex w-max gap-2">
        {TOPICS.map((topic) => (
          <li key={topic}>
            <Badge>{topic}</Badge>
          </li>
        ))}
      </ul>
    </ScrollFade>
  ),
};

/** How deep the fade is: 16px, the 40px it has by itself, and 96px. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 1080, height: 330 } } },
  render: () => (
    <div className="flex items-start gap-6">
      <Invoices size="1rem" />
      <Invoices />
      <Invoices size="6rem" />
    </div>
  ),
};

/** Only the end fades: for a list under a heading that stays where it is. */
export const EndOnly: Story = {
  render: () => (
    <ScrolledToMiddle>
      <Invoices edges="end" />
    </ScrolledToMiddle>
  ),
};

/**
 * The keyboard, as a test: the links inside are the tab stops, the one that takes the focus is
 * brought clear of the fade, and the box says at which of its ends more waits.
 */
export const Keyboard: Story = {
  render: () => <Invoices />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-fade"]')!;

    await step("At the top only the foot has more", async () => {
      await waitFor(() => expect(box).toHaveAttribute("data-overflow", "end"));
    });

    await step("Tab walks the links, and the box follows the focus", async () => {
      for (const invoice of INVOICES.slice(0, 6)) {
        await userEvent.tab();
        await expect(canvas.getByRole("link", { name: invoice.customer })).toHaveFocus();
      }
      await waitFor(() => expect(box).toHaveAttribute("data-overflow", "start end"));
    });

    await step("The focused link stands clear of the fade at the foot", async () => {
      const link = canvas.getByRole("link", { name: INVOICES[5]!.customer });
      const fade = 40;
      await waitFor(() =>
        expect(link.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          box.getBoundingClientRect().bottom - fade + 1,
        ),
      );
    });

    await step("At the last link only the top has more", async () => {
      for (let step = 6; step < INVOICES.length; step++) await userEvent.tab();
      await expect(canvas.getByRole("link", { name: INVOICES.at(-1)!.customer })).toHaveFocus();
      await waitFor(() => expect(box).toHaveAttribute("data-overflow", "start"));
    });
  },
};
