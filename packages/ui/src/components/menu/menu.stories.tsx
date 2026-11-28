import {
  Calendar03Icon,
  Clock01Icon,
  Copy01Icon,
  Csv01Icon,
  Delete02Icon,
  Download01Icon,
  EuroIcon,
  Pdf01Icon,
  PencilEdit02Icon,
  UserIcon,
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
          <MenuItem icon={PencilEdit02Icon}>Bearbeiten</MenuItem>
          <MenuItem icon={Copy01Icon}>Duplizieren</MenuItem>
          <MenuItem icon={Download01Icon}>Als PDF herunterladen</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        {/* In the danger colour, its symbol too: given as a child, it takes the row's colour. */}
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
          <MenuItem icon={PencilEdit02Icon}>Bearbeiten</MenuItem>
          <MenuItem icon={Copy01Icon}>Duplizieren</MenuItem>
          <MenuItem icon={Download01Icon} disabled>
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

/**
 * Options inside a menu. Every row's words start at its left edge, the group labels' too; what
 * is on or chosen carries its mark at the right end.
 */
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

/** The same options, each with its symbol before its words. */
export const OptionsWithIcons: Story = {
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
          <MenuCheckboxItem icon={UserIcon} defaultChecked>
            Kunde
          </MenuCheckboxItem>
          <MenuCheckboxItem icon={EuroIcon} defaultChecked>
            Betrag
          </MenuCheckboxItem>
          <MenuCheckboxItem icon={Clock01Icon}>Zuletzt geändert</MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuRadioGroup defaultValue="datum">
          <MenuGroupLabel>Sortieren nach</MenuGroupLabel>
          <MenuRadioItem icon={Calendar03Icon} value="datum">
            Datum
          </MenuRadioItem>
          <MenuRadioItem icon={EuroIcon} value="betrag">
            Betrag
          </MenuRadioItem>
          <MenuRadioItem icon={UserIcon} value="kunde">
            Kunde
          </MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger icon={Download01Icon}>Exportieren</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem icon={Pdf01Icon}>Als PDF</MenuItem>
            <MenuItem icon={Csv01Icon}>Als CSV</MenuItem>
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

/**
 * Where a submenu opens, as a test: beside its row at the end of the line unless it is told a
 * side, and then on that side. Neither word reaches the sheet's element.
 */
export const SubmenuSide: Story = {
  render: () => (
    // In the middle of the window, so there is room for a sheet on either side.
    <div className="flex justify-center">
      <Menu>
        <MenuTrigger render={<Button>Ansicht</Button>} />
        <MenuContent>
          <MenuSub>
            <MenuSubTrigger>Exportieren</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Als PDF</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger>Teilen</MenuSubTrigger>
            <MenuSubContent side="left" align="end">
              <MenuItem>Per E-Mail</MenuItem>
            </MenuSubContent>
          </MenuSub>
        </MenuContent>
      </Menu>
    </div>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const item = (name: string) => screen.getByRole("menuitem", { name });
    /** The sheet a row stands in, and the part that places it. */
    const sheetOf = (name: string) => {
      const sheet = item(name).closest<HTMLElement>('[data-slot="menu-content"]');
      return { sheet, place: sheet?.closest<HTMLElement>('[data-slot="menu-positioner"]') };
    };

    await step("left alone, it opens at the end of its row, level with it", async () => {
      canvas.getByRole("button", { name: "Ansicht" }).focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(item("Exportieren")).toHaveFocus());
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(item("Als PDF")).toHaveFocus());
      await expect(sheetOf("Als PDF").place).toHaveAttribute("data-side", "inline-end");
      await expect(sheetOf("Als PDF").place).toHaveAttribute("data-align", "start");
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(item("Exportieren")).toHaveFocus());
    });

    await step("told a side and an alignment, it takes them", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() => expect(item("Teilen")).toHaveFocus());
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(item("Per E-Mail")).toHaveFocus());
      const { sheet, place } = sheetOf("Per E-Mail");
      await expect(place).toHaveAttribute("data-side", "left");
      await expect(place).toHaveAttribute("data-align", "end");
      await expect(sheet).not.toHaveAttribute("side");
      await expect(sheet).not.toHaveAttribute("align");
    });

    await step("ArrowLeft leaves it, and Escape closes the menu", async () => {
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => expect(item("Teilen")).toHaveFocus());
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    });
  },
};
