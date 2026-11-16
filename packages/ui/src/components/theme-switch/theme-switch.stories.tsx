import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { ThemeSwitch } from "./theme-switch";

const meta = {
  title: "Components/ThemeSwitch",
  component: ThemeSwitch,
  parameters: {
    visual: {
      viewport: { width: 360, height: 120 },
      target: '[data-slot="segment"]:not([data-pressed])',
      motion: [{ name: "switch", click: '[data-slot="segment"]:last-of-type', frames: 8 }],
    },
  },
} satisfies Meta<typeof ThemeSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Three symbols in one trough: as the system says, light, dark. The thumb travels to the chosen
 * one. It only holds the choice; changing the page is the app's.
 */
export const Default: Story = {};

/** Dark chosen. */
export const Dark: Story = { args: { defaultValue: "dark" } };

/** With the names written out, for a settings page. */
export const WithLabels: Story = {
  args: { withLabels: true, defaultValue: "light" },
  parameters: { visual: { viewport: { width: 420, height: 120 } } },
};

/**
 * The keyboard, as a test: every symbol has a name, Tab enters the control, the arrows move
 * along it, and Enter chooses and reports the choice.
 */
export const Keyboard: Story = {
  args: { onValueChange: fn() },
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
