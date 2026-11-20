import {
  Image01Icon,
  Link01Icon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";

import { Icon } from "@/components/icon/icon";
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/menu/menu";
import { Toggle } from "@/components/toggle/toggle";
import { ToggleGroup } from "@/components/toggle-group/toggle-group";
import { ChevronDownGlyph } from "@/internal/glyphs";

import {
  Toolbar,
  ToolbarButton,
  ToolbarInput,
  ToolbarLink,
  type ToolbarProps,
  ToolbarSeparator,
} from "./toolbar";

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 640, height: 140 },
      target: '[data-slot="toolbar-button"]',
    },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function TextTools({ defaultOpen, ...props }: ToolbarProps & { defaultOpen?: boolean }) {
  return (
    <Toolbar aria-label="Text formatieren" {...props}>
      <Menu modal={false} defaultOpen={defaultOpen}>
        <MenuTrigger render={<ToolbarButton />}>
          Absatz
          <ChevronDownGlyph width={10} height={10} className="text-fg-muted" />
        </MenuTrigger>
        <MenuContent align="start">
          <MenuRadioGroup defaultValue="paragraph">
            <MenuRadioItem value="paragraph">Absatz</MenuRadioItem>
            <MenuRadioItem value="heading">Überschrift</MenuRadioItem>
            <MenuRadioItem value="subheading">Zwischenüberschrift</MenuRadioItem>
            <MenuRadioItem value="quote">Zitat</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
      <ToolbarSeparator />
      <ToggleGroup multiple size="sm" aria-label="Auszeichnung" defaultValue={["bold"]}>
        <Toggle iconOnly aria-label="Fett" value="bold" shortcut="mod+b">
          <Icon icon={TextBoldIcon} size={14} />
        </Toggle>
        <Toggle iconOnly aria-label="Kursiv" value="italic" shortcut="mod+i">
          <Icon icon={TextItalicIcon} size={14} />
        </Toggle>
        <Toggle iconOnly aria-label="Unterstrichen" value="underline" shortcut="mod+u">
          <Icon icon={TextUnderlineIcon} size={14} />
        </Toggle>
      </ToggleGroup>
      <ToggleGroup size="sm" aria-label="Ausrichtung" defaultValue={["left"]}>
        <Toggle iconOnly aria-label="Linksbündig" value="left" shortcut="mod+shift+l">
          <Icon icon={TextAlignLeftIcon} size={14} />
        </Toggle>
        <Toggle iconOnly aria-label="Zentriert" value="center" shortcut="mod+shift+e">
          <Icon icon={TextAlignCenterIcon} size={14} />
        </Toggle>
        <Toggle iconOnly aria-label="Rechtsbündig" value="right" shortcut="mod+shift+r">
          <Icon icon={TextAlignRightIcon} size={14} />
        </Toggle>
      </ToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton iconOnly aria-label="Link einfügen" shortcut="mod+k">
        <Icon icon={Link01Icon} size={14} />
      </ToolbarButton>
      <ToolbarButton iconOnly aria-label="Bild einfügen" disabled>
        <Icon icon={Image01Icon} size={14} />
      </ToolbarButton>
      <ToolbarLink href="#hilfe" className="ml-auto">
        Hilfe
      </ToolbarLink>
    </Toolbar>
  );
}

/**
 * The keys above a text: a menu, two groups of toggles, two actions and a link. One stop for
 * the Tab key; the arrows move between the controls.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "press", click: '[data-slot="toggle"]:nth-of-type(2)', frames: 6 }],
    },
  },
  render: () => <TextTools />,
};

/** The menu of a key open: the key stays marked while it is. */
export const Open: Story = {
  parameters: { visual: { viewport: { width: 640, height: 260 }, clip: "viewport" } },
  render: () => <TextTools defaultOpen />,
};

/** With a field at its end: the zoom of a view. */
export const WithInput: Story = {
  render: () => (
    <Toolbar aria-label="Ansicht">
      <ToggleGroup size="sm" aria-label="Ausrichtung" defaultValue={["left"]}>
        <Toggle iconOnly aria-label="Linksbündig" value="left">
          <Icon icon={TextAlignLeftIcon} size={14} />
        </Toggle>
        <Toggle iconOnly aria-label="Zentriert" value="center">
          <Icon icon={TextAlignCenterIcon} size={14} />
        </Toggle>
      </ToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton>Zurücksetzen</ToolbarButton>
      <ToolbarInput aria-label="Zoom in Prozent" defaultValue="100" className="ml-auto w-16" />
    </Toolbar>
  ),
};

/** One over the other: the tools beside a drawing. The arrows then go up and down. */
export const Vertical: Story = {
  parameters: { visual: { viewport: { width: 640, height: 220 } } },
  render: () => (
    <Toolbar aria-label="Werkzeuge" orientation="vertical" className="w-fit">
      <ToolbarButton iconOnly aria-label="Link einfügen">
        <Icon icon={Link01Icon} size={14} />
      </ToolbarButton>
      <ToolbarButton iconOnly aria-label="Bild einfügen">
        <Icon icon={Image01Icon} size={14} />
      </ToolbarButton>
      <ToolbarSeparator />
      <Toggle variant="quiet" size="sm" iconOnly aria-label="Fett">
        <Icon icon={TextBoldIcon} size={14} />
      </Toggle>
    </Toolbar>
  ),
};

/**
 * The names of the symbol keys, as a test: each says its name and its shortcut in a tooltip,
 * and once one has shown, the next opens as the pointer reaches it.
 */
export const Tooltips: Story = {
  render: () => <TextTools />,
  play: async ({ canvas, userEvent, step }) => {
    // The tooltip that says this name (its shortcut follows the name in the same box).
    const content = (name: string) =>
      [...document.querySelectorAll<HTMLElement>('[data-slot="tooltip-content"]')].find((each) =>
        each.textContent?.startsWith(name),
      );
    // The first waits out the tooltip's delay, which leaves little of `waitFor`'s own second.
    const tip = (name: string) =>
      waitFor(() => expect(content(name)).toBeVisible(), { timeout: 2500 });

    await step("A toggle in a group says its name and its shortcut", async () => {
      await userEvent.hover(canvas.getByRole("button", { name: "Fett" }));
      await tip("Fett");
      await expect(content("Fett")?.querySelector('[data-slot="shortcut"]')).not.toBeNull();
    });

    await step("Its neighbour, and a plain key, say theirs", async () => {
      await userEvent.hover(canvas.getByRole("button", { name: "Kursiv" }));
      await tip("Kursiv");
      await userEvent.hover(canvas.getByRole("button", { name: "Link einfügen" }));
      await tip("Link einfügen");
    });

    await step("A key with words needs no tooltip", async () => {
      await userEvent.hover(canvas.getByRole("button", { name: "Absatz" }));
      await waitFor(
        () => expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull(),
        { timeout: 2500 },
      );
    });
  },
};

/**
 * The keyboard path, as a test: Tab reaches the bar once, the arrows walk through every
 * control (a disabled one included, which says that it is), a menu opens from its key, and Tab
 * leaves the bar in one step.
 */
export const Keyboard: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TextTools />
      <button type="button" className="w-fit text-control text-fg">
        Danach
      </button>
    </div>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const key = (name: string) => canvas.getByRole("button", { name });

    await step("Tab reaches the bar once, the arrows move through its controls", async () => {
      await userEvent.tab();
      await expect(key("Absatz")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(key("Fett")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      await expect(key("Linksbündig")).toHaveFocus();
    });

    await step("a toggle in the bar is pressed with Space", async () => {
      await userEvent.keyboard("{ArrowRight} ");
      await expect(key("Zentriert")).toHaveAttribute("aria-pressed", "true");
      await expect(key("Linksbündig")).toHaveAttribute("aria-pressed", "false");
    });

    await step("a disabled key stays in reach and says so", async () => {
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      await expect(key("Bild einfügen")).toHaveFocus();
      await expect(key("Bild einfügen")).toHaveAttribute("aria-disabled", "true");
      await userEvent.keyboard("{ArrowRight}");
      await expect(canvas.getByRole("link", { name: "Hilfe" })).toHaveFocus();
    });

    await step(
      "past the last control the arrows come round to the first, whose menu opens",
      async () => {
        await userEvent.keyboard("{ArrowRight}");
        await expect(key("Absatz")).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await waitFor(() => expect(screen.getByRole("menu")).toBeVisible());
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(key("Absatz")).toHaveFocus());
      },
    );

    await step("Tab leaves the bar in one step", async () => {
      await userEvent.tab();
      await expect(key("Danach")).toHaveFocus();
    });
  },
};
