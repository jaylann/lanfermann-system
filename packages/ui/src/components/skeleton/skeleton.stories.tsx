import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";

import { Loaded } from "./loaded";
import { Skeleton, SkeletonGroup, type SkeletonGroupProps } from "./skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 520, height: 300 } },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

const quotes = [
  { initials: "SH", name: "Schreinerei Huber", what: "Einbauschrank, Eiche", sum: "4.280 €" },
  { initials: "BS", name: "Bäckerei Sonnleitner", what: "Ladentheke", sum: "12.900 €" },
  { initials: "GW", name: "Gärtnerei Weiß", what: "Hochbeete, Lärche", sum: "1.640 €" },
];

/** How long each row's name, its second line and its sum will be, about. */
const widths = [
  { name: "w-36", what: "w-28", sum: "w-14" },
  { name: "w-44", what: "w-20", sum: "w-16" },
  { name: "w-32", what: "w-32", sum: "w-14" },
];

const row = "flex items-center gap-3 border-b border-hairline py-3 last:border-b-0";

/** The rows as they will be, drawn in shapes: an avatar, two lines, a state, a sum. */
function Shapes(props: Partial<SkeletonGroupProps>) {
  return (
    <SkeletonGroup label="Die Angebote werden gerade geladen." {...props}>
      {widths.map(({ name, what, sum }) => (
        <div key={name + what} className={row}>
          <Skeleton shape="block" className="size-7 rounded-sm" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Skeleton className={`text-control ${name}`} />
            <Skeleton className={`text-sm ${what}`} />
          </div>
          <Skeleton shape="block" className="h-[1.375rem] w-16 rounded-sm" />
          <Skeleton className={`text-control ${sum}`} />
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** The same rows, arrived. They stand exactly where their shapes stood. */
function Rows() {
  return (
    <div>
      {quotes.map((quote) => (
        <div key={quote.name} className={row}>
          <Avatar>
            <AvatarFallback>{quote.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-control font-medium text-fg">{quote.name}</span>
            <span className="text-sm text-fg-muted">{quote.what}</span>
          </div>
          <Badge tone="info">Gesendet</Badge>
          <span className="text-control text-fg tabular-nums">{quote.sum}</span>
        </div>
      ))}
    </div>
  );
}

/** A list that is loading. All its shapes breathe together, because the region does. */
export const Default: Story = {
  render: () => <Shapes />,
};

/** What arrives, for comparison: every line and block stands where its shape stood. */
export const Arrived: Story = {
  render: () => <Rows />,
};

/** To compare: `light="passing"`, a light runs through all shapes at the same moment. */
export const Passing: Story = {
  render: () => <Shapes light="passing" />,
};

/** To compare: `light="still"`, nothing moves. */
export const Still: Story = {
  render: () => <Shapes light="still" />,
};

/** A list behind `Loaded`, with a button that loads it again and takes as long as it is told. */
function Reloading({ takes }: { takes: number }) {
  const [ready, setReady] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <div className="flex flex-col gap-3">
      <Button
        size="sm"
        className="self-start"
        onClick={() => {
          clearTimeout(timer.current);
          setReady(false);
          timer.current = setTimeout(() => setReady(true), takes);
        }}
      >
        Angebote neu laden
      </Button>
      <Loaded ready={ready} skeleton={<Shapes />}>
        <Rows />
      </Loaded>
    </div>
  );
}

/**
 * `Loaded` around a list. Press the button: the answer takes a second, so the shapes show
 * after a fifth of it, stay, and the rows fade in over them.
 */
export const Arriving: Story = {
  // No motion strip: the wait breathes for as long as it lasts, and a strip needs an end.
  parameters: { visual: { viewport: { width: 520, height: 340 } } },
  render: () => <Reloading takes={1000} />,
};

/** An answer that takes a tenth of a second: the skeleton never shows. */
export const Fast: Story = {
  tags: ["visual-skip"],
  render: () => <Reloading takes={100} />,
};

const opacity = (element: Element | null) =>
  element ? Number(getComputedStyle(element).opacity) : undefined;

/**
 * The timing, as a test: a slow answer shows the shapes and says what is waited for; a fast
 * one never lets them be seen.
 */
export const Timing: Story = {
  render: () => <Reloading takes={600} />,
  play: async ({ canvas, userEvent, step }) => {
    const reload = canvas.getByRole("button", { name: "Angebote neu laden" });

    await step(
      "a slow answer: the region says what it waits for, then the rows are back",
      async () => {
        await userEvent.click(reload);
        const waiting = canvas.getByRole("status");
        await expect(waiting).toHaveTextContent("Die Angebote werden gerade geladen.");
        await expect(waiting).toHaveAttribute("aria-busy", "true");
        await expect(canvas.queryByText("Schreinerei Huber")).not.toBeInTheDocument();
        // Not yet: it waits a fifth of a second before it shows itself.
        await expect(opacity(waiting)).toBeLessThan(0.5);
        await waitFor(() => expect(opacity(canvas.queryByRole("status"))).toBe(1));
        await waitFor(() => expect(canvas.getByText("Schreinerei Huber")).toBeVisible(), {
          timeout: 2000,
        });
        await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
      },
    );
  },
};

/** The fast answer, as a test: the rows are back before the shapes could show. */
export const TimingFast: Story = {
  render: () => <Reloading takes={60} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Angebote neu laden" }));
    let seen = 0;
    const watch = setInterval(() => {
      seen = Math.max(seen, opacity(canvas.queryByRole("status")) ?? 0);
    }, 10);
    await waitFor(() => expect(canvas.getByText("Schreinerei Huber")).toBeVisible());
    clearInterval(watch);
    await expect(seen).toBe(0);
  },
};
