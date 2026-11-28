import { Logout01Icon, PaintBoardIcon, UserIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/menu/menu";

import { ThemeMenuItems, useThemeNames } from "./theme-menu";
import { type Theme, THEME_STORAGE_KEY } from "./theme-mode";
import { ThemeSwitch } from "./theme-switch";
import { useTheme } from "./use-theme";

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

function AccountMenu({ open = false }: { open?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  const names = useThemeNames();
  return (
    <Menu defaultOpen={open} modal={!open}>
      <MenuTrigger render={<Button>Konto</Button>} />
      <MenuContent className="min-w-60">
        <MenuItem icon={UserIcon}>Profil</MenuItem>
        <MenuSub defaultOpen={open}>
          <MenuSubTrigger icon={PaintBoardIcon} detail={names[theme]}>
            Erscheinungsbild
          </MenuSubTrigger>
          <MenuSubContent>
            <ThemeMenuItems value={theme} onValueChange={setTheme} />
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuItem icon={Logout01Icon}>Abmelden</MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * The same choice as rows of a menu (`ThemeMenuItems`): in an account menu the appearance is one
 * setting among others. Its row names the chosen one, and the submenu holds the three with their
 * symbols, the chosen one carrying the disc.
 */
export const InMenu: Story = {
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 560, height: 260 }, target: undefined, motion: [] },
  },
  render: () => <AccountMenu open />,
};

/** As a test: choosing a row in the submenu changes the appearance and what the row names. */
export const InMenuKeyboard: Story = {
  render: () => <AccountMenu />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Konto" }));
    const row = await screen.findByRole("menuitem", { name: /Erscheinungsbild/ });
    await expect(row).toHaveTextContent("Hell");
    row.focus();
    await userEvent.keyboard("{ArrowRight}");
    const dark = await screen.findByRole("menuitemradio", { name: "Dunkel" });
    await expect(screen.getByRole("menuitemradio", { name: "Hell" })).toBeChecked();
    await userEvent.click(dark);
    await waitFor(() => expect(row).toHaveTextContent("Dunkel"));
    await userEvent.keyboard("{Escape}{Escape}");
  },
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

// Instant, not the fade: a view transition inside the story runner's frame closes the page in
// Playwright's headless Chromium (CI), and the whole run dies with it.
function WiredSwitch() {
  const { theme, setTheme } = useTheme({ transition: "instant" });
  return <ThemeSwitch variant="segmented" withLabels value={theme} onValueChange={setTheme} />;
}

/**
 * Wired to the page with `useTheme`, as a test: a choice turns the page and is kept for the next
 * visit, in storage for `ThemeScript` and in a cookie for a server.
 */
export const WithThePage: Story = {
  args: { variant: "segmented" },
  render: () => <WiredSwitch />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const before = root.getAttribute("data-mode");
    try {
      await step("Dunkel turns the page dark and keeps the choice", async () => {
        await userEvent.click(canvas.getByRole("button", { name: "Dunkel" }));
        await waitFor(() => expect(root).toHaveAttribute("data-mode", "dark"));
        await expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
        await expect(document.cookie).toContain(`${THEME_STORAGE_KEY}=dark`);
      });

      await step("Hell turns it light again", async () => {
        await userEvent.click(canvas.getByRole("button", { name: "Hell" }));
        await waitFor(() => expect(root).toHaveAttribute("data-mode", "light"));
        await expect(canvas.getByRole("button", { name: "Hell" })).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      });
    } finally {
      // Leave the workshop as the toolbar had it.
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.cookie = `${THEME_STORAGE_KEY}=; path=/; max-age=0`;
      if (before === null) root.removeAttribute("data-mode");
      else root.setAttribute("data-mode", before);
    }
  },
};
