import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn } from "storybook/test";

import { type CodeTab, CodeTabs } from "./code-tabs";
import { install } from "./samples";

/** The same command for each package manager: the case CodeTabs is for. */
const items: CodeTab[] = [...install];

/** A second block that offers the same three tabs, so the two can keep in step. */
const run: CodeTab[] = [
  { label: "bun", code: "bun run dev", language: "sh" },
  { label: "npm", code: "npm run dev", language: "sh" },
  { label: "pnpm", code: "pnpm dev", language: "sh" },
];

const meta = {
  title: "Components/CodeTabs",
  component: CodeTabs,
  args: { items },
  parameters: {
    visual: {
      viewport: { width: 760, height: 180 },
      target: '[data-slot="code-tab"]:not([data-active])',
      motion: [{ name: "switch", click: '[data-slot="code-tab"]:nth-of-type(3)', frames: 8 }],
    },
  },
  render: (args) => (
    <div className="w-[min(40rem,calc(100vw-2rem))]">
      <CodeTabs {...args} />
    </div>
  ),
} satisfies Meta<typeof CodeTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One command, a tab for each package manager. The highlight glides to the chosen one. */
export const Install: Story = {};

/**
 * Blocks in one `group` share the reader's choice: picking pnpm in one shows pnpm in both, and
 * the choice is remembered for the next visit.
 */
export const Grouped: Story = {
  parameters: { visual: { viewport: { width: 760, height: 320 } } },
  render: (args) => (
    <div className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-4">
      <CodeTabs {...args} group="story-grouped" />
      <CodeTabs items={run} group="story-grouped" />
    </div>
  ),
};

/**
 * The keyboard reaches the chosen tab; the arrow keys move between the tabs and Enter picks
 * one. Copy then takes the version that is shown, and the code after it is the next stop.
 */
export const Keyboard: Story = {
  play: async ({ canvas, userEvent }) => {
    // The clipboard writes nowhere; the spy says what would have been copied.
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.tab();
      await expect(canvas.getByRole("tab", { name: "bun" })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("tab", { name: "npm" })).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("tab", { name: "npm" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Code kopieren" })).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(write).toHaveBeenCalledOnce();
      await expect(write).toHaveBeenCalledWith("npm install @lanfermann/ui");
      await userEvent.tab();
      await expect(canvas.getByRole("group", { name: "Code: npm" })).toHaveFocus();
    } finally {
      write.mockRestore();
    }
  },
};

/**
 * A `defaultValue` that no tab has, as a test: the block shows its first tab, not none, so the
 * code on screen is the code the copy takes.
 */
export const UnknownDefault: Story = {
  args: { defaultValue: "yarn" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: "bun" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("group", { name: "Code: bun" })).toHaveTextContent(
      "bun add @lanfermann/ui",
    );
  },
};
