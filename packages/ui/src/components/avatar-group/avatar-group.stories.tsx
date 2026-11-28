import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Card } from "@/components/card/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";

import { AvatarGroup } from "./avatar-group";
import type { AvatarPerson } from "./people";

const meta = {
  title: "Components/AvatarGroup",
  component: AvatarGroup,
  parameters: { visual: { viewport: { width: 420, height: 140 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** A small portrait drawn inline, so the stories need no network. */
function portrait(skin: string, hair: string, shirt: string) {
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#d8d2c4"/><path d="M12 22c0-9 5-15 12-15s12 6 12 15v4H12z" fill="${hair}"/><circle cx="24" cy="21" r="9" fill="${skin}"/><path d="M6 48c2-11 9-16 18-16s16 5 18 16z" fill="${shirt}"/></svg>`,
    )
  );
}

const team: AvatarPerson[] = [
  { name: "Anna Weber", src: portrait("#e7b98f", "#4a3226", "#5f50d0"), presence: "online" },
  { name: "Jonas Klein", src: portrait("#c98e65", "#1f1a17", "#2f6f5e") },
  { name: "Lena Fischer" },
  { name: "Paul Wagner", src: portrait("#f0c9a4", "#b5793d", "#8a3b3b") },
  { name: "Mia Becker" },
  { name: "Tom Richter" },
  { name: "Sophie Hoffmann" },
];

/** Three people and the rest as a number, at each size. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 420, height: 220 } } },
  render: () => (
    <div className="flex flex-col items-start gap-5">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <AvatarGroup key={size} size={size} people={team} label={`Team (${size})`} />
      ))}
    </div>
  ),
};

/** Everyone who fits: without a `max` smaller than the team, there is no number. */
export const Few: Story = {
  render: () => <AvatarGroup people={team.slice(0, 3)} label="Bearbeitet von" />,
};

/**
 * Whether someone is there: a dot cut out of the edge, the ring alone when they are away from
 * their desk for good. The words are in the tooltip and in what assistive tech hears.
 */
export const Presence: Story = {
  render: () => (
    <AvatarGroup
      size="lg"
      max={5}
      label="Im Dokument"
      people={[
        { name: "Anna Weber", presence: "online" },
        { name: "Jonas Klein", presence: "away" },
        { name: "Lena Fischer", presence: "offline" },
        { name: "Paul Wagner", presence: "online" },
      ]}
    />
  ),
};

/**
 * The cut is a hole, not a ring in the ground's colour: on a washed table row and over a
 * picture, what lies under the stack shows through the gap.
 */
export const OnRow: Story = {
  parameters: { visual: { viewport: { width: 640, height: 300 } } },
  render: () => (
    <div className="flex w-[min(560px,calc(100vw-2rem))] flex-col gap-6">
      <Card>
        <Table aria-label="Angebote">
          <TableHeader>
            <TableRow>
              <TableHead>Angebot</TableHead>
              <TableHead>Bearbeitet von</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow selected>
              <TableCell>Einbauschrank Flur</TableCell>
              <TableCell>
                <AvatarGroup people={team.slice(0, 5)} size="sm" label="Bearbeitet von" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Küchenfronten Eiche</TableCell>
              <TableCell>
                <AvatarGroup people={team.slice(2, 4)} size="sm" label="Bearbeitet von" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      <div
        className="flex h-24 items-end rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, #f1c27d 0%, #e07a5f 35%, #3d405b 70%, #81b29a 100%)",
        }}
      >
        <AvatarGroup people={team} size="lg" label="Auf dem Bild" />
      </div>
    </div>
  ),
};

/** One person alone with the same dot. */
export const Single: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["sm", "md", "lg", "xl"] as const).map((size, index) => (
        <Avatar
          key={size}
          size={size}
          presence={(["online", "away", "offline", "online"] as const)[index]}
        >
          <AvatarFallback>AW</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

/**
 * Tests what the stack says: one name for the whole group, a tooltip for each avatar and one
 * for the rest, and that the pointer finds the avatar it is over where two overlap.
 */
export const Names: Story = {
  render: () => <AvatarGroup people={team} label="Team" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("img");

    await step("The group is named once, with everyone in it", async () => {
      await expect(group).toHaveAccessibleName(
        "Team: Anna Weber (online), Jonas Klein, Lena Fischer, Paul Wagner, Mia Becker, Tom Richter und Sophie Hoffmann",
      );
    });

    const items = canvasElement.querySelectorAll<HTMLElement>('[data-slot="avatar-group-item"]');

    await step("Where two overlap, the one in front takes the pointer", async () => {
      const second = items[1]!.getBoundingClientRect();
      const front = document.elementFromPoint(second.left + 2, second.top + second.height / 2);
      await expect(items[0]!.contains(front)).toBe(true);
    });

    await step("Each avatar names itself in a tooltip, the last tile the rest", async () => {
      await userEvent.hover(items[1]!);
      await waitFor(() => expect(document.body).toHaveTextContent("Jonas Klein"));
      await userEvent.hover(items[3]!);
      await waitFor(() =>
        expect(
          document.querySelector('[data-slot="tooltip-content"]')?.textContent ?? "",
        ).toContain("Paul Wagner, Mia Becker, Tom Richter und Sophie Hoffmann"),
      );
    });
  },
};

/** Tests a group with nobody in it yet: it is no image without a name. */
export const Nobody: Story = {
  render: () => <AvatarGroup people={[]} label="Bearbeitet von" />,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('[data-slot="avatar-group"]');
    await expect(group).not.toHaveAttribute("role");
    await expect(group).not.toHaveAttribute("aria-label");
  },
};
