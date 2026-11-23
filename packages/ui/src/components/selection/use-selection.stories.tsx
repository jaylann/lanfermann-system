import {
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  FolderTransferIcon,
  LinkSquare02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, waitFor } from "storybook/test";

import { ActionBar, ActionBarButton } from "@/components/action-bar/action-bar";
import { kindOf } from "@/components/attachment/kinds";
import { Card, CardBar } from "@/components/card/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import { FileGrid, FileGridSection } from "@/components/file-grid/file-grid";
import { FileKindSymbol } from "@/components/file-kind-symbol/file-kind-symbol";
import { FileTile } from "@/components/file-tile/file-tile";
import { FILES, FOLDERS } from "@/components/file-tile/story-files";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { MenuItem, MenuSeparator } from "@/components/menu/menu";
import { MiddleTruncate } from "@/components/middle-truncate/middle-truncate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";

import { useSelection } from "./use-selection";

const meta = {
  title: "Components/Selection",
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 960, height: 720 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const ENTRIES = [
  ...FOLDERS.map((folder) => ({ ...folder, folder: true })),
  ...FILES.map((file) => ({ ...file, folder: false })),
];
const IDS = ENTRIES.map(({ id }) => id);

function Actions({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <ActionBar open={count > 0} count={count} onClear={onClear} position="absolute">
      <ActionBarButton>
        <Icon icon={Download04Icon} />
        Herunterladen
      </ActionBarButton>
      <ActionBarButton>
        <Icon icon={FolderTransferIcon} />
        Verschieben nach…
      </ActionBarButton>
      <ActionBarButton>
        <Icon icon={Delete02Icon} />
        In den Papierkorb
      </ActionBarButton>
    </ActionBar>
  );
}

/** The grid of a folder, chosen through `useSelection`, with what can be done in an ActionBar. */
function Files({
  initial = [],
  onOpen,
  className = "",
}: {
  initial?: string[];
  onOpen?: (id: string) => void;
  className?: string;
}) {
  const selection = useSelection({ ids: IDS, defaultSelected: initial, layout: "grid", onOpen });
  const tile = (entry: (typeof ENTRIES)[number]) => {
    const { id, folder, ...rest } = entry;
    return (
      <FileTile
        key={id}
        variant={folder ? "folder" : "file"}
        {...rest}
        selected={selection.isSelected(id)}
        {...selection.itemProps(id)}
      />
    );
  };
  return (
    <div className={`relative min-h-[40rem] pb-24 ${className}`}>
      <FileGrid aria-label="Dateien in blogs/building-gbar" {...selection.containerProps}>
        <FileGridSection key="ordner" label="Ordner">
          {ENTRIES.filter(({ folder }) => folder).map(tile)}
        </FileGridSection>
        <FileGridSection key="dateien" label="Dateien">
          {ENTRIES.filter(({ folder }) => !folder).map(tile)}
        </FileGridSection>
      </FileGrid>
      <Actions count={selection.selected.size} onClear={selection.clear} />
    </div>
  );
}

/**
 * Tiles chosen through `useSelection`: a click chooses one, Cmd-click adds one, Shift-click
 * takes a range, a press on a tile's mark adds or takes away that one. The ActionBar rises with
 * the first and counts them.
 */
export const Grid: Story = {
  render: () => <Files initial={["hero", "badge", "angebot"]} />,
};

/** The same in a list: the rows of a `Table` stand on the tint when chosen. */
function List({ initial = [] }: { initial?: string[] }) {
  const selection = useSelection({ ids: IDS, defaultSelected: initial });
  return (
    <div className="relative min-h-[36rem] max-w-2xl pb-24">
      <Card>
        <CardBar>
          <Heading level={2} size="label" id="auswahl-liste">
            blogs/building-gbar
          </Heading>
        </CardBar>
        <Table aria-labelledby="auswahl-liste" {...selection.containerProps}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-full">Name</TableHead>
              <TableHead numeric>Größe und Stand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ENTRIES.map((entry) => (
              <TableRow
                key={entry.id}
                selected={selection.isSelected(entry.id)}
                {...selection.itemProps(entry.id)}
              >
                <TableCell className="w-full max-w-0">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
                    <FileKindSymbol
                      kind={entry.folder ? "folder" : kindOf(entry)}
                      size={14}
                      className="shrink-0 text-fg-muted"
                    />
                    <MiddleTruncate text={entry.name} />
                  </span>
                </TableCell>
                <TableCell numeric>{entry.meta}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Actions count={selection.selected.size} onClear={selection.clear} />
    </div>
  );
}

export const ListView: Story = {
  parameters: { visual: { viewport: { width: 760, height: 640 } } },
  render: () => <List initial={["entwuerfe", "hero", "thumbnail"]} />,
};

const opened = fn();

/** The keyboard path through a grid: one stop for Tab, then the arrows by the real columns. */
export const Keyboard: Story = {
  // Four columns, whatever the size of the test's window.
  render: () => <Files onOpen={opened} className="w-[44rem]" />,
  play: async ({ canvas, userEvent, step }) => {
    opened.mockClear();
    const tile = (name: RegExp) => canvas.getByRole("row", { name });
    const chosen = () =>
      canvas
        .getAllByRole("row")
        .filter((row) => row.getAttribute("aria-selected") === "true")
        .map((row) => row.dataset.selectionItem);

    await step("the grid is one stop for Tab, on its first tile", async () => {
      await userEvent.tab();
      await expect(tile(/badges/)).toHaveFocus();
      await expect(canvas.getByRole("grid")).toHaveAttribute("aria-multiselectable", "true");
    });
    await step("an arrow moves on and chooses where it lands", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(tile(/entwürfe/)).toHaveFocus();
      await expect(chosen()).toEqual(["entwuerfe"]);
    });
    await step("down crosses from the folders into the files, by column", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await expect(tile(/thumbnail/)).toHaveFocus();
      await expect(chosen()).toEqual(["thumbnail"]);
    });
    await step("Shift and an arrow takes the way along", async () => {
      await userEvent.keyboard("{Shift>}{ArrowRight}{ArrowRight}{/Shift}");
      await expect(chosen()).toEqual(["thumbnail", "badge", "logo"]);
    });
    await step("Space takes one away again", async () => {
      await userEvent.keyboard(" ");
      await expect(chosen()).toEqual(["thumbnail", "badge"]);
    });
    await step("Ctrl and A chooses all", async () => {
      await userEvent.keyboard("{Control>}a{/Control}");
      await expect(chosen()).toHaveLength(IDS.length);
      await waitFor(() => expect(canvas.getByText("ausgewählt")).toBeVisible());
    });
    await step("Escape lets go of all of it", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(chosen()).toEqual([]);
    });
    await step("Enter opens the item with the focus", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(opened).toHaveBeenCalledWith("logo");
    });
  },
};

/** The pointer: a click, Cmd-click, Shift-click, and a press on the mark. */
export const Pointer: Story = {
  render: () => <Files onOpen={opened} className="w-[44rem]" />,
  play: async ({ canvas, userEvent, step }) => {
    opened.mockClear();
    const tile = (name: RegExp) => canvas.getByRole("row", { name });
    const chosen = () =>
      canvas
        .getAllByRole("row")
        .filter((row) => row.getAttribute("aria-selected") === "true")
        .map((row) => row.dataset.selectionItem);

    await step("a click chooses one", async () => {
      await userEvent.click(tile(/hero/));
      await expect(chosen()).toEqual(["hero"]);
      await expect(tile(/hero/)).toHaveFocus();
    });
    await step("Shift and a click takes the range from there", async () => {
      await userEvent.keyboard("{Shift>}");
      await userEvent.click(tile(/badge_neu/));
      await userEvent.keyboard("{/Shift}");
      await expect(chosen()).toEqual(["hero", "thumbnail", "badge"]);
    });
    await step("Cmd and a click takes one away", async () => {
      // Cmd, not Ctrl: on a Mac Ctrl and a click is a right click.
      await userEvent.keyboard("{Meta>}");
      await userEvent.click(tile(/thumbnail/));
      await userEvent.keyboard("{/Meta}");
      await expect(chosen()).toEqual(["hero", "badge"]);
    });
    await step("a press on a tile's mark adds it", async () => {
      const mark = tile(/Angebot/).querySelector("[data-selection-toggle]");
      if (!(mark instanceof HTMLElement)) throw new Error("the tile has no mark");
      await userEvent.click(mark);
      await expect(chosen()).toEqual(["hero", "badge", "angebot"]);
    });
    await step("a plain click chooses that one alone", async () => {
      await userEvent.click(tile(/teaser/));
      await expect(chosen()).toEqual(["teaser"]);
    });
    await step("a double click opens it", async () => {
      await userEvent.dblClick(tile(/archiv/));
      await expect(opened).toHaveBeenCalledWith("archiv");
    });
  },
};

/**
 * The entries of a file's menu, one list for the right click and for the menu behind a key
 * (`ContextMenu` cannot be opened from the keyboard).
 */
function FileMenuEntries() {
  return (
    <>
      <MenuItem icon={LinkSquare02Icon}>Öffnen</MenuItem>
      <MenuItem icon={Copy01Icon}>Adresse kopieren</MenuItem>
      <MenuItem icon={PencilEdit02Icon}>Umbenennen</MenuItem>
      <MenuItem icon={FolderTransferIcon}>Verschieben nach…</MenuItem>
      <MenuSeparator />
      <MenuItem icon={Delete02Icon} className="text-danger">
        In den Papierkorb
      </MenuItem>
    </>
  );
}

/** Tiles whose own menu opens on a right click or a long press, choosing the tile it is about. */
function FilesWithMenus() {
  const selection = useSelection({ ids: IDS, layout: "grid" });
  const tile = (entry: (typeof ENTRIES)[number]) => {
    const { id, folder, ...rest } = entry;
    return (
      <ContextMenu
        key={id}
        // A right click on a tile that is not chosen chooses it, as a file manager does, so
        // the menu is about what is chosen.
        onOpenChange={(open) => {
          if (open && !selection.isSelected(id)) selection.select([id]);
        }}
      >
        <ContextMenuTrigger
          render={
            <FileTile
              variant={folder ? "folder" : "file"}
              {...rest}
              selected={selection.isSelected(id)}
              {...selection.itemProps(id)}
            />
          }
        />
        <ContextMenuContent>
          <FileMenuEntries />
        </ContextMenuContent>
      </ContextMenu>
    );
  };
  return (
    <div className="w-[44rem]">
      <FileGrid aria-label="Dateien in blogs/building-gbar" {...selection.containerProps}>
        <FileGridSection key="ordner" label="Ordner">
          {ENTRIES.filter(({ folder }) => folder).map(tile)}
        </FileGridSection>
        <FileGridSection key="dateien" label="Dateien">
          {ENTRIES.filter(({ folder }) => !folder).map(tile)}
        </FileGridSection>
      </FileGrid>
    </div>
  );
}

/**
 * A tile's menu on a right click (a long press on a phone): the trigger renders the tile, so
 * the tile takes its handlers and ref and keeps choosing, its mark and dragging. While the menu
 * is open the tile shows its mark; a right click on a tile that is not chosen chooses it.
 */
export const WithMenu: Story = {
  render: () => <FilesWithMenus />,
  play: async ({ canvas, userEvent, step }) => {
    // Found before the menu opens: an open menu hides the page from assistive tech.
    const thumbnail = canvas.getByRole("row", { name: /thumbnail/ });
    const hero = canvas.getByRole("row", { name: /hero/ });
    await step("a right click opens the tile's menu and chooses the tile", async () => {
      await userEvent.pointer({ keys: "[MouseRight]", target: thumbnail });
      await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeInTheDocument());
      const entries = [...document.querySelectorAll('[role="menuitem"]')].map(
        (entry) => entry.textContent,
      );
      await expect(entries).toEqual([
        "Öffnen",
        "Adresse kopieren",
        "Umbenennen",
        "Verschieben nach…",
        "In den Papierkorb",
      ]);
      await expect(thumbnail).toHaveAttribute("data-popup-open");
      await expect(thumbnail).toHaveAttribute("aria-selected", "true");
    });
    await step("Escape closes it, and a click still chooses as before", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
      await userEvent.click(hero);
      await expect(hero).toHaveAttribute("aria-selected", "true");
      await expect(thumbnail).toHaveAttribute("aria-selected", "false");
    });
  },
};
