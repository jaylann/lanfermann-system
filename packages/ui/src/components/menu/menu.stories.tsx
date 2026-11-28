import {
  Calendar03Icon,
  Clock01Icon,
  Copy01Icon,
  Csv01Icon,
  Delete02Icon,
  Download01Icon,
  EuroIcon,
  PaintBoardIcon,
  Pdf01Icon,
  PencilEdit02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { expect, screen, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
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
        {/* What destroys stands last, under a line, in the danger tone. */}
        <MenuItem tone="danger" icon={Delete02Icon}>
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
        <MenuItem tone="danger" icon={Delete02Icon}>
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
/**
 * A row that destroys: last, under a line, in the danger tone. Its highlight is the danger wash,
 * under the pointer and from the keyboard alike, so the row warns before it is pressed.
 */
export const Destructive: Story = {
  parameters: {
    visual: {
      viewport: { width: 380, height: 300 },
      clip: "viewport",
      target: '[data-tone="danger"]',
    },
  },
  render: () => (
    <Menu defaultOpen modal={false}>
      <MenuTrigger
        render={
          <Button>
            Datei
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent>
        <MenuItem icon={PencilEdit02Icon}>Umbenennen</MenuItem>
        <MenuItem icon={Copy01Icon}>Adresse kopieren</MenuItem>
        <MenuItem icon={Download01Icon}>Herunterladen</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" icon={Delete02Icon}>
          In den Papierkorb
        </MenuItem>
        <MenuItem tone="danger" icon={Delete02Icon} disabled>
          Endgültig löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Points at the destructive row once the menu stands, so a still picture shows its highlight. */
function PointedAt() {
  useEffect(() => {
    let frame = requestAnimationFrame(function point() {
      const row = document.querySelector('[data-slot="menu-item"][data-tone="danger"]');
      if (!row) {
        frame = requestAnimationFrame(point);
        return;
      }
      for (const type of ["pointermove", "mousemove"])
        row.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: 1, clientY: 1 }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Menu defaultOpen modal={false}>
      <MenuTrigger
        render={
          <Button>
            Datei
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent>
        <MenuItem icon={PencilEdit02Icon}>Umbenennen</MenuItem>
        <MenuItem icon={Download01Icon}>Herunterladen</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" icon={Delete02Icon}>
          In den Papierkorb
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/** The destructive row under the pointer: the danger wash in place of the grey highlight. */
export const DestructiveHighlighted: Story = {
  parameters: { visual: { viewport: { width: 380, height: 250 }, clip: "viewport" } },
  render: () => <PointedAt />,
};

/**
 * A submenu that holds a choice names what is chosen: the `detail` stands muted before the
 * chevron, so the answer is read without opening the submenu.
 */
export const SubmenuDetail: Story = {
  parameters: { visual: { viewport: { width: 380, height: 250 }, clip: "viewport" } },
  render: () => (
    <Menu defaultOpen modal={false}>
      <MenuTrigger
        render={
          <Button>
            Konto
            <ChevronDownGlyph className="text-fg-muted" />
          </Button>
        }
      />
      <MenuContent className="min-w-60">
        <MenuItem icon={UserIcon}>Profil</MenuItem>
        <MenuSub>
          <MenuSubTrigger icon={PaintBoardIcon} detail="Hell">
            Erscheinungsbild
          </MenuSubTrigger>
          <MenuSubContent>
            <MenuRadioGroup defaultValue="hell">
              <MenuRadioItem value="system">System</MenuRadioItem>
              <MenuRadioItem value="hell">Hell</MenuRadioItem>
              <MenuRadioItem value="dunkel">Dunkel</MenuRadioItem>
            </MenuRadioGroup>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  ),
};

/**
 * As a test: the arrow keys reach the destructive row, which carries the tone and the highlight
 * together, and a disabled one is passed over in the danger colour's place.
 */
export const DestructiveKeyboard: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button>Datei</Button>} />
      <MenuContent>
        <MenuItem>Umbenennen</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" icon={Delete02Icon}>
          In den Papierkorb
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Datei" }));
    const row = await screen.findByRole("menuitem", { name: "In den Papierkorb" });
    await expect(row).toHaveAttribute("data-tone", "danger");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(row).toHaveAttribute("data-highlighted"));
    const rest = getComputedStyle(screen.getByRole("menuitem", { name: "Umbenennen" }));
    const danger = getComputedStyle(row);
    await expect(danger.color).not.toBe(rest.color);
    await expect(danger.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await userEvent.keyboard("{Escape}");
  },
};

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
