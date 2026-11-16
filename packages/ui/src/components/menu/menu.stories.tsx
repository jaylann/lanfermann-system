import {
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { ChevronDownGlyph } from "@/internal/glyphs";

import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "./menu";

const meta = {
  title: "Components/Menu",
  component: Menu,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 380, height: 330 }, clip: "viewport" },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Actions behind one trigger. The sheet grows out of it; the destructive one stands apart. */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "open", click: '[data-slot="menu-trigger"]', frames: 8 }],
    },
  },
  render: () => (
    <Menu>
      <MenuTrigger
        render={
          <Button>
            Angebot
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Angebot 2026-0418</MenuGroupLabel>
          <MenuItem>
            <Icon icon={PencilEdit02Icon} className="text-fg-muted" />
            Bearbeiten
          </MenuItem>
          <MenuItem>
            <Icon icon={Copy01Icon} className="text-fg-muted" />
            Duplizieren
          </MenuItem>
          <MenuItem>
            <Icon icon={Download01Icon} className="text-fg-muted" />
            Als PDF herunterladen
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem className="text-danger">
          <Icon icon={Delete02Icon} />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** The same menu, held open for the screenshots. */
export const Open: Story = {
  ...Default,
  parameters: {},
  render: () => (
    <Menu defaultOpen modal={false}>
      <MenuTrigger
        render={
          <Button>
            Angebot
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Angebot 2026-0418</MenuGroupLabel>
          <MenuItem>
            <Icon icon={PencilEdit02Icon} className="text-fg-muted" />
            Bearbeiten
          </MenuItem>
          <MenuItem>
            <Icon icon={Copy01Icon} className="text-fg-muted" />
            Duplizieren
          </MenuItem>
          <MenuItem disabled>
            <Icon icon={Download01Icon} />
            Als PDF herunterladen
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem className="text-danger">
          <Icon icon={Delete02Icon} />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Options inside a menu: ticks for what is on, the disc for the one that is chosen. */
export const Options: Story = {
  parameters: { visual: { viewport: { width: 520, height: 360 }, clip: "viewport" } },
  render: () => (
    <Menu defaultOpen modal={false}>
      <MenuTrigger
        render={
          <Button>
            Ansicht
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent>
        <MenuGroup>
          <MenuGroupLabel>Spalten</MenuGroupLabel>
          <MenuCheckboxItem defaultChecked>Kunde</MenuCheckboxItem>
          <MenuCheckboxItem defaultChecked>Betrag</MenuCheckboxItem>
          <MenuCheckboxItem>Zuletzt geändert</MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuRadioGroup defaultValue="datum">
          <MenuGroupLabel>Sortieren nach</MenuGroupLabel>
          <MenuRadioItem value="datum">Datum</MenuRadioItem>
          <MenuRadioItem value="betrag">Betrag</MenuRadioItem>
          <MenuRadioItem value="kunde">Kunde</MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>Exportieren</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Als PDF</MenuItem>
            <MenuItem>Als CSV</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  ),
};

/**
 * The keyboard path, as a test: Enter opens the menu on its first item, the arrows move,
 * ArrowRight and ArrowLeft enter and leave the submenu, and Escape closes the menu and hands the
 * focus back to the trigger.
 */
export const Keyboard: Story = {
  render: () => (
    <Menu>
      <MenuTrigger
        render={
          <Button>
            Ansicht
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent>
        <MenuItem>Bearbeiten</MenuItem>
        <MenuItem>Duplizieren</MenuItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>Exportieren</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Als PDF</MenuItem>
            <MenuItem>Als CSV</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Ansicht" });
    const item = (name: string) => screen.getByRole("menuitem", { name });

    await step("Enter opens the menu on its first item", async () => {
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(item("Bearbeiten")).toHaveFocus());
    });

    await step("ArrowDown walks to the submenu, ArrowRight enters it", async () => {
      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      await waitFor(() => expect(item("Exportieren")).toHaveFocus());
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(item("Als PDF")).toHaveFocus());
      await expect(screen.getAllByRole("menu")).toHaveLength(2);
    });

    await step("ArrowLeft leaves the submenu for the item that opened it", async () => {
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(1));
      await expect(item("Exportieren")).toHaveFocus();
    });

    await step("Escape closes the menu and returns the focus", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};
