import { PinIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Card, CardContent } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Sparkline } from "@/components/sparkline/sparkline";
import { StatChange, type StatChangeProps } from "@/components/stat/stat";
import { Text } from "@/components/text/text";
import { Toggle } from "@/components/toggle/toggle";

import { ReflowGrid, ReflowTile } from "./reflow-grid";

const meta = {
  title: "Components/ReflowGrid",
  component: ReflowGrid,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 1040, height: 720 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Figure = {
  id: string;
  name: string;
  value: string;
  change: string;
  trend: StatChangeProps["trend"];
  tone: StatChangeProps["tone"];
  days: readonly number[];
};

const FIGURES: readonly Figure[] = [
  {
    id: "umsatz",
    name: "Umsatz",
    value: "12.480 €",
    change: "+12 %",
    trend: "up",
    tone: "positive",
    days: [31, 34, 33, 38, 41, 40, 46, 44, 49, 52, 51, 57],
  },
  {
    id: "angebote",
    name: "Offene Angebote",
    value: "23",
    change: "±0",
    trend: "flat",
    tone: "neutral",
    days: [22, 24, 23, 23, 21, 22, 24, 25, 23, 22, 23, 23],
  },
  {
    id: "anfragen",
    name: "Neue Anfragen",
    value: "41",
    change: "+7",
    trend: "up",
    tone: "positive",
    days: [4, 6, 5, 8, 7, 9, 8, 11, 10, 12, 11, 14],
  },
  {
    id: "stornierungen",
    name: "Stornierungen",
    value: "4",
    change: "+2",
    trend: "up",
    tone: "negative",
    days: [1, 0, 1, 2, 1, 1, 2, 2, 3, 2, 3, 4],
  },
  {
    id: "bewertungen",
    name: "Bewertungen",
    value: "4,8",
    change: "+0,1",
    trend: "up",
    tone: "positive",
    days: [46, 46, 47, 46, 47, 47, 47, 48, 47, 48, 48, 48],
  },
  {
    id: "besuche",
    name: "Besuche der Website",
    value: "1.906",
    change: "−3 %",
    trend: "down",
    tone: "negative",
    days: [70, 74, 71, 69, 72, 68, 66, 69, 64, 65, 62, 63],
  },
];

function Pin({
  figure,
  pinned,
  onToggle,
}: {
  figure: Figure;
  pinned: boolean;
  onToggle: () => void;
}) {
  return (
    <Toggle
      variant="quiet"
      size="sm"
      iconOnly
      aria-label={`${figure.name} anheften`}
      pressed={pinned}
      onPressedChange={onToggle}
    >
      <Icon icon={PinIcon} size={16} />
    </Toggle>
  );
}

type PinnedProps = {
  /** The figures that are pinned when the story opens, in the order they were pinned. */
  start?: readonly string[];
  /** The columns of the grid, where the story wants other ones than the grid's own. */
  columns?: string;
};

/**
 * A dashboard's pinned figures over the list they are pinned from. The page keeps two lists: what
 * stands in the grid, and which of those are on their way out. A figure that is unpinned stays in
 * the grid as `leaving` and is taken out when its tile says it has left.
 */
function Pinned({ start = ["umsatz", "angebote", "anfragen"], columns }: PinnedProps) {
  const [shown, setShown] = useState<readonly string[]>(start);
  const [leaving, setLeaving] = useState<readonly string[]>([]);
  const pinned = (id: string) => shown.includes(id) && !leaving.includes(id);
  const toggle = (id: string) => {
    if (leaving.includes(id)) setLeaving((now) => now.filter((each) => each !== id));
    else if (shown.includes(id)) setLeaving((now) => [...now, id]);
    else setShown((now) => [...now, id]);
  };
  const left = (id: string) => {
    setShown((now) => now.filter((each) => each !== id));
    setLeaving((now) => now.filter((each) => each !== id));
  };
  const tiles = shown.flatMap((id) => FIGURES.filter((figure) => figure.id === id));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <section aria-labelledby="pinned" className="flex flex-col gap-3">
        <Heading id="pinned" level={2} size="label">
          Angeheftet
        </Heading>
        <ReflowGrid className={columns}>
          {tiles.length === 0 ? (
            <div className="col-span-full flex items-center gap-3 rounded-lg border border-dashed border-line px-5 py-4">
              <Icon icon={PinIcon} size={16} className="text-fg-muted" />
              <Text size="sm" tone="muted">
                Hefte eine Kennzahl an, um sie hier im Blick zu behalten.
              </Text>
            </div>
          ) : (
            tiles.map((figure) => (
              <ReflowTile
                key={figure.id}
                id={figure.id}
                leaving={leaving.includes(figure.id)}
                onLeft={() => left(figure.id)}
              >
                <Card variant="bevel" className="h-full">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <Text size="sm" tone="muted" className="truncate pt-1.5">
                        {figure.name}
                      </Text>
                      <span className="-mt-1 -mr-2">
                        <Pin
                          figure={figure}
                          pinned={pinned(figure.id)}
                          onToggle={() => toggle(figure.id)}
                        />
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <Text
                        as="div"
                        className="text-2xl font-semibold tracking-tight text-fg"
                        numeric
                      >
                        {figure.value}
                      </Text>
                      <StatChange trend={figure.trend} tone={figure.tone}>
                        {figure.change}
                      </StatChange>
                    </div>
                    <Sparkline
                      data={figure.days}
                      variant="area"
                      height={36}
                      drawIn={false}
                      label={`${figure.name} in den letzten zwölf Tagen`}
                    />
                  </CardContent>
                </Card>
              </ReflowTile>
            ))
          )}
        </ReflowGrid>
      </section>
      <section aria-labelledby="all" className="flex flex-col gap-3">
        <Heading id="all" level={2} size="label">
          Alle Kennzahlen
        </Heading>
        <Card>
          <ul className="flex flex-col divide-y divide-hairline">
            {FIGURES.map((figure) => (
              <li key={figure.id} className="flex items-center gap-3 py-2 pr-3 pl-5">
                <Text className="min-w-0 flex-1 truncate text-fg">{figure.name}</Text>
                <Text tone="muted" numeric>
                  {figure.value}
                </Text>
                <span data-pin={figure.id}>
                  <Pin
                    figure={figure}
                    pinned={pinned(figure.id)}
                    onToggle={() => toggle(figure.id)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

const pinOf = (id: string) => `[data-pin="${id}"] [data-slot="toggle"]`;

/**
 * Three figures are pinned. Pin a fourth and it rises into a new row while the list below moves
 * down with the grid; unpin the first and it sinks away, and the others glide up into its place.
 *
 * Only the join is a motion strip: a tile leaves in two steps (it fades, then the page takes it
 * out and the others glide), and a strip holds the first step only.
 */
export const Default: Story = {
  parameters: {
    visual: {
      target: pinOf("stornierungen"),
      motion: [{ name: "join", click: pinOf("stornierungen"), frames: 10 }],
    },
  },
  render: () => <Pinned />,
};

/** Two rows: taking a tile from the first row brings one up from the second, across the grid. */
export const TwoRows: Story = {
  parameters: { visual: { viewport: { width: 1040, height: 860 } } },
  render: () => (
    <Pinned start={["umsatz", "angebote", "anfragen", "stornierungen", "bewertungen"]} />
  ),
};

/** `className` changes the columns: four across on a wide page, for tiles that carry little. */
export const FourColumns: Story = {
  parameters: { visual: { viewport: { width: 1290, height: 860 } } },
  render: () => (
    <Pinned
      start={["umsatz", "angebote", "anfragen", "stornierungen", "bewertungen", "besuche"]}
      columns="lg:grid-cols-4"
    />
  ),
};

/**
 * Nothing is pinned: a hint stands in the grid, which stays in the page so that the first tile
 * still comes in.
 */
export const Empty: Story = {
  parameters: {
    visual: {
      viewport: { width: 1040, height: 560 },
      motion: [{ name: "first", click: pinOf("umsatz"), frames: 10 }],
    },
  },
  render: () => <Pinned start={[]} />,
};

/** On a phone the tiles stand in one column, and a tile that leaves closes the column up. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: () => <Pinned start={["umsatz", "anfragen"]} />,
};

/**
 * As a test: a tile that is unpinned takes no focus while it leaves and is gone once it has
 * faded; pinned again while it is still leaving, it stays; and a press in the middle of a move
 * leaves every tile in its place at the end.
 */
export const Leaving: Story = {
  render: () => <Pinned />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const tiles = () => [
      ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="reflow-tile"]'),
    ];
    const names = () => tiles().map((tile) => tile.dataset.glide);
    const inList = (name: string) =>
      canvasElement.querySelector<HTMLElement>(`[data-pin] [aria-label="${name} anheften"]`)!;

    await step("three tiles stand in the order they were pinned", async () => {
      await expect(names()).toEqual(["umsatz", "angebote", "anfragen"]);
    });

    await step("an unpinned tile is inert at once, and gone once it has faded", async () => {
      await userEvent.click(inList("Umsatz"));
      const tile = tiles().find((each) => each.dataset.glide === "umsatz")!;
      await expect(tile).toHaveAttribute("data-leaving");
      await expect(tile).toHaveAttribute("inert");
      await waitFor(() => expect(names()).toEqual(["angebote", "anfragen"]));
    });

    await step("pinned again while it leaves, a tile stays", async () => {
      await userEvent.click(inList("Neue Anfragen"));
      await userEvent.click(inList("Neue Anfragen"));
      await new Promise((done) => setTimeout(done, 400));
      await expect(names()).toEqual(["angebote", "anfragen"]);
      await expect(inList("Neue Anfragen")).toHaveAttribute("aria-pressed", "true");
    });

    await step("a press in the middle of a move ends with every tile in its place", async () => {
      await userEvent.click(inList("Bewertungen"));
      await userEvent.click(inList("Offene Angebote"));
      await userEvent.click(inList("Umsatz"));
      await waitFor(() => expect(names()).toEqual(["anfragen", "bewertungen", "umsatz"]));
      // Every glide has come home: no tile is left standing off its place.
      await waitFor(
        async () => {
          for (const tile of tiles()) await expect(getComputedStyle(tile).translate).toBe("none");
          await expect(
            canvasElement.querySelector('[data-slot="reflow-grid"]'),
          ).not.toHaveAttribute("data-moving");
        },
        { timeout: 2000 },
      );
      await expect(canvas.getByRole("heading", { name: "Angeheftet" })).toBeVisible();
    });
  },
};
