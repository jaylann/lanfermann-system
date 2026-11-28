import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, waitFor } from "storybook/test";

import { MiddleTruncate } from "./middle-truncate";

const meta = {
  title: "Components/MiddleTruncate",
  component: MiddleTruncate,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 560, height: 300 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const NAMES = [
  "Angebot_Kowalski_Herbst.pdf",
  "Backstube_Ofen_Nahaufnahme_bearbeitet_final.jpg",
  "Seminarplan_Wintersemester_2026_Gruppe_B.pdf",
];

/**
 * The same names in three widths: each is cut in its middle, its extension and the last three
 * letters before it kept. A name that fits stands whole.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {["w-40", "w-60", "w-96"].map((width) => (
        <div key={width} className="flex flex-col gap-1 text-control font-medium text-fg">
          {NAMES.map((name) => (
            <div key={name} className={`${width} rounded-xs bg-well px-2 py-1`}>
              <MiddleTruncate text={name} />
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** A ref of the caller's own, which the part fills beside the one it measures with. */
const own = createRef<HTMLSpanElement>();

/** Assistive tech hears the whole name, never the ellipsis. */
export const ReadWhole: Story = {
  render: () => (
    <div className="w-40 text-control" data-testid="box">
      <MiddleTruncate ref={own} text={NAMES[1]!} />
    </div>
  ),
  play: async ({ canvas, step }) => {
    const box = canvas.getByTestId("box");
    await step("what is seen is cut, its end kept", async () => {
      const seen = box.querySelector('[data-slot="middle-truncate"] > [aria-hidden]');
      await waitFor(() => expect(seen?.textContent).toMatch(/^Backstube.*…nal\.jpg$/));
    });
    await step("what is read is whole", async () => {
      await expect(box.querySelector(".sr-only")).toHaveTextContent(NAMES[1]!);
    });
    await step("a ref of the caller's is filled, and the name is still cut", async () => {
      await expect(own.current).toBe(box.querySelector('[data-slot="middle-truncate"]'));
    });
  },
};
