import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor, within } from "storybook/test";

import { ThemeSwitch } from "./theme-switch";

const meta = {
  title: "Components/ThemeSwitch",
  component: ThemeSwitch,
  parameters: {
    visual: {
      // The select keeps its hidden input in the window's corner: a crop to the content would
      // reach there. The frame has room for the list under the trigger.
      clip: "viewport",
      viewport: { width: 360, height: 300 },
      target: '[data-slot="select-trigger"]',
      motion: [{ name: "open", click: '[data-slot="select-trigger"]', frames: 8 }],
    },
  },
} satisfies Meta<typeof ThemeSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What the round form's captures hover, press and click. */
const segments = {
  clip: "content",
  viewport: { width: 360, height: 120 },
  target: '[data-slot="segment"]:not([data-pressed])',
  motion: [{ name: "switch", click: '[data-slot="segment"]:last-of-type', frames: 8 }],
};

/**
 * As a select: the chosen appearance by symbol and name, in the room of one button. It only
 * holds the choice; changing the page is the app's.
 */
export const Default: Story = {};

/** The list: the three appearances, the chosen one with the disc. */
export const Open: Story = {
  args: { defaultValue: "dark", defaultOpen: true, modal: false },
  parameters: {
    visual: { motion: [{ name: "close", click: '[data-slot="select-trigger"]', frames: 8 }] },
  },
};

/** The small trigger, for a footer or a tight bar. */
export const Small: Story = {
  args: { size: "sm", defaultValue: "light" },
  parameters: { visual: { viewport: { width: 360, height: 120 }, motion: [] } },
};

/**
 * As three symbols in a round trough: as the system says, light, dark. The thumb travels to the
 * chosen one.
 */
export const Segmented: Story = {
  args: { variant: "segmented" },
  parameters: { visual: segments },
};

/** The round form with dark chosen. */
export const SegmentedDark: Story = {
  args: { variant: "segmented", defaultValue: "dark" },
  parameters: { visual: segments },
};

/** The round form with the names written out, for a settings page. */
export const SegmentedWithLabels: Story = {
  args: { variant: "segmented", withLabels: true, defaultValue: "light" },
  parameters: { visual: { ...segments, viewport: { width: 420, height: 120 } } },
};

/**
 * The select's keyboard, as a test: the trigger is named and shows the choice, Enter opens the
 * list, the arrows move along it, and Enter chooses and reports the choice.
 */
export const Keyboard: Story = {
  args: { onValueChange: fn() },
  play: async ({ args, canvas, canvasElement, userEvent, step }) => {
    const trigger = canvas.getByRole("combobox", { name: "Erscheinungsbild" });
    // The list is portalled to the body.
    const page = within(canvasElement.ownerDocument.body);

    await step("The trigger is named and shows the system's appearance", async () => {
      await expect(trigger).toHaveTextContent("System");
    });

    await step("Enter opens the list with the three appearances", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(page.getByRole("option", { name: "Dunkel" })).toBeVisible());
      await expect(page.getAllByRole("option")).toHaveLength(3);
      await expect(args.onValueChange).not.toHaveBeenCalled();
    });

    await step("The arrows move along it, Enter chooses and reports", async () => {
      await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
      await waitFor(() => expect(trigger).toHaveTextContent("Dunkel"));
      await expect(args.onValueChange).toHaveBeenLastCalledWith("dark");
    });
  },
};

/**
 * The round form's keyboard, as a test: every symbol has a name, Tab enters the control, the
 * arrows move along it, and Enter chooses and reports the choice.
 */
export const SegmentedKeyboard: Story = {
  args: { variant: "segmented", onValueChange: fn() },
  play: async ({ args, canvas, userEvent, step }) => {
    const segment = (name: string) => canvas.getByRole("button", { name });

    await step("The control and its three choices are named", async () => {
      await expect(canvas.getByRole("group", { name: "Erscheinungsbild" })).toBeVisible();
      await expect(segment("System")).toHaveAttribute("aria-pressed", "true");
      await expect(segment("Hell")).toHaveAttribute("aria-pressed", "false");
      await expect(segment("Dunkel")).toHaveAttribute("aria-pressed", "false");
    });

    await step("Tab enters it, the arrows move along it and choose nothing", async () => {
      await userEvent.tab();
      await expect(segment("System")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      await expect(segment("Dunkel")).toHaveFocus();
      await expect(args.onValueChange).not.toHaveBeenCalled();
    });

    await step("Enter chooses, and the choice is reported", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(segment("Dunkel")).toHaveAttribute("aria-pressed", "true");
      await expect(segment("System")).toHaveAttribute("aria-pressed", "false");
      await expect(args.onValueChange).toHaveBeenLastCalledWith("dark");
    });
  },
};
