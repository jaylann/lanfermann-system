import {
  Delete02Icon,
  Folder01Icon,
  FolderAddIcon,
  InboxIcon,
  Link01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { Card } from "@/components/card/card";
import { ContextMenuContent } from "@/components/context-menu/context-menu";
import { EditableName } from "@/components/editable-name/editable-name";
import {
  FileDropArea,
  ITEMS_TYPE,
  useDropTarget,
  useItemDrag,
} from "@/components/file-drop-area/file-drop-area";
import { Icon } from "@/components/icon/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/menu/menu";
import { Text } from "@/components/text/text";

import { SideNavTree, SideNavTreeItem } from "./side-nav-tree";

const meta = {
  title: "Components/SideNavTree",
  component: SideNavTree,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 320, height: 520 },
      target: '[data-slot="side-nav-tree-link"]:not([aria-current])',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Folder = { id: string; name: string; count: number; sub?: Folder[] };

const FOLDERS: Folder[] = [
  {
    id: "bewerbung",
    name: "Bewerbung",
    count: 31,
    sub: [
      {
        id: "bewerbung/check24",
        name: "Check24",
        count: 12,
        sub: [
          { id: "bewerbung/check24/2026", name: "2026", count: 7 },
          { id: "bewerbung/check24/zweitgespraech", name: "Zweitgespräch", count: 5 },
        ],
      },
      { id: "bewerbung/westend61", name: "Westend61", count: 9 },
    ],
  },
  {
    id: "kunden",
    name: "Kunden",
    count: 54,
    sub: [
      { id: "kunden/kornprobst", name: "Bäckerei Kornprobst", count: 18 },
      { id: "kunden/huber", name: "Schreinerei Huber", count: 22 },
      { id: "kunden/haarscharf", name: "Friseursalon Haarscharf", count: 14 },
    ],
  },
  { id: "vortraege", name: "Vorträge und Workshops im Herbst", count: 1204 },
  { id: "privat", name: "Privat", count: 9 },
];

const number = new Intl.NumberFormat("de-DE");

type RailProps = {
  /** The place that is open. */
  current?: string;
  /** The folders whose subfolders show when the story opens. */
  open?: readonly string[];
  /** Every folder carries its `⋯` and the same entries on a right click. */
  actions?: boolean;
  /** The folder whose name is being changed when the story opens. */
  renaming?: string;
  /** No counts: the names alone. */
  bare?: boolean;
  onRename?: (id: string, name: string) => void;
};

function More({ name, onRename }: { name: string; onRename: () => void }) {
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="quiet" size="sm" iconOnly aria-label={`Mehr zu ${name}`} />}
      >
        <Icon icon={MoreHorizontalIcon} size={16} />
      </MenuTrigger>
      <MenuContent align="end" className="min-w-48">
        <MenuItem onClick={onRename}>
          <Icon icon={PencilEdit02Icon} size={16} className="text-fg-muted" />
          Umbenennen
        </MenuItem>
        <MenuItem>
          <Icon icon={FolderAddIcon} size={16} className="text-fg-muted" />
          Neuer Unterordner
        </MenuItem>
        <MenuItem>
          <Icon icon={Delete02Icon} size={16} className="text-fg-muted" />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

type RowState = {
  current: string;
  setCurrent: (id: string) => void;
  open: readonly string[];
  setOpen: (id: string, open: boolean) => void;
  renaming: string | undefined;
  setRenaming: (id: string | undefined) => void;
  names: Readonly<Record<string, string>>;
  rename: (id: string, name: string) => void;
} & Pick<RailProps, "actions" | "bare">;

/** One folder: a drop target of the area around the rail, if there is one. */
function FolderRow({ folder, state }: { folder: Folder; state: RowState }) {
  const name = state.names[folder.id] ?? folder.name;
  const { dropProps } = useDropTarget({
    id: folder.id,
    label: `In ${name} ablegen`,
    moveLabel: `Nach ${name} verschieben`,
  });
  const editing = state.renaming === folder.id;
  return (
    <SideNavTreeItem
      href={`#${folder.id}`}
      icon={Folder01Icon}
      count={state.bare ? undefined : number.format(folder.count)}
      current={state.current === folder.id}
      onClick={(event) => {
        event.preventDefault();
        state.setCurrent(folder.id);
      }}
      open={folder.sub ? state.open.includes(folder.id) : undefined}
      onOpenChange={(open) => state.setOpen(folder.id, open)}
      actions={
        state.actions ? (
          <More name={name} onRename={() => state.setRenaming(folder.id)} />
        ) : undefined
      }
      contextMenu={
        state.actions ? (
          <ContextMenuContent className="min-w-48">
            <MenuItem onClick={() => state.setRenaming(folder.id)}>
              <Icon icon={PencilEdit02Icon} size={16} className="text-fg-muted" />
              Umbenennen
            </MenuItem>
            <MenuItem>
              <Icon icon={Delete02Icon} size={16} className="text-fg-muted" />
              Löschen
            </MenuItem>
          </ContextMenuContent>
        ) : undefined
      }
      editing={
        editing ? (
          <EditableName
            value={name}
            editing
            onEditingChange={(now) => state.setRenaming(now ? folder.id : undefined)}
            onRename={(next) => {
              state.rename(folder.id, next);
              return undefined;
            }}
            label={`Name von ${name}`}
            className="min-w-0 flex-1"
          />
        ) : undefined
      }
      sub={folder.sub?.map((child) => (
        <FolderRow key={child.id} folder={child} state={state} />
      ))}
      {...dropProps}
    >
      {name}
    </SideNavTreeItem>
  );
}

/** The folder rail of a library of short links: two fixed views, then the folders. */
function Rail({
  current: initial = "kunden/huber",
  open: initiallyOpen = ["kunden"],
  actions,
  renaming: initiallyRenaming,
  bare,
  onRename,
}: RailProps) {
  const [current, setCurrent] = useState(initial);
  const [open, setOpenIds] = useState<readonly string[]>(initiallyOpen);
  const [renaming, setRenaming] = useState(initiallyRenaming);
  const [names, setNames] = useState<Readonly<Record<string, string>>>({});
  const state: RowState = {
    current,
    setCurrent,
    open,
    setOpen: (id, next) =>
      setOpenIds((now) => (next ? [...now, id] : now.filter((each) => each !== id))),
    renaming,
    setRenaming,
    names,
    rename: (id, name) => {
      setNames((now) => ({ ...now, [id]: name }));
      onRename?.(id, name);
    },
    actions,
    bare,
  };
  const fixed = (id: string) => ({
    href: `#${id}`,
    current: current === id,
    onClick: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      setCurrent(id);
    },
  });
  return (
    <SideNavTree aria-label="Ordner" className="w-64">
      <SideNavTreeItem icon={Link01Icon} count={bare ? undefined : "128"} {...fixed("alle")}>
        Alle Links
      </SideNavTreeItem>
      <SideNavTreeItem icon={InboxIcon} count={bare ? undefined : "14"} {...fixed("ohne")}>
        Ohne Ordner
      </SideNavTreeItem>
      {FOLDERS.map((folder) => (
        <FolderRow key={folder.id} folder={folder} state={state} />
      ))}
    </SideNavTree>
  );
}

/**
 * Two fixed views and the folders under them, one of them open. „Schreinerei Huber“ is the place
 * being looked at: it stands on the tint. A long name ends before its count.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "unfold", click: '[data-slot="side-nav-tree-toggle"][aria-expanded="false"]' },
      ],
    },
  },
  render: () => <Rail />,
};

/**
 * Three levels deep. Each level is set in by one step, and the symbols of a level stand in one
 * line whether or not their row can fold. A press on a chevron folds a folder shut.
 */
export const Nested: Story = {
  parameters: {
    visual: {
      viewport: { width: 320, height: 620 },
      motion: [{ name: "fold", click: '[data-slot="side-nav-tree-toggle"][aria-expanded="true"]' }],
    },
  },
  render: () => (
    <Rail current="bewerbung/check24/2026" open={["bewerbung", "bewerbung/check24", "kunden"]} />
  ),
};

/**
 * Every folder has a `⋯` with what can be done to it. It takes the count's place under the
 * pointer and with the keyboard in the row; a right click on the row opens the same entries.
 */
export const Actions: Story = {
  parameters: {
    visual: {
      target: 'a[href="#privat"]',
      motion: [{ name: "swap", hover: 'a[href="#privat"]', frames: 6 }],
    },
  },
  render: () => <Rail actions />,
};

/** The names alone, without counts: the `⋯` still has its room at the end of a long name. */
export const WithoutCounts: Story = { render: () => <Rail actions bare /> };

/** A folder being renamed: its name is a field in the row, with the name selected. */
export const Renaming: Story = { render: () => <Rail actions renaming="kunden/kornprobst" /> };

/** On a touch screen there is no pointer to bring the `⋯` out: it always shows, beside the count. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 520 } } },
  render: () => <Rail actions />,
};

const LINKS = [
  { id: "l1", slug: "lnf.to/huber-angebot", title: "Angebot Küche Huber" },
  { id: "l2", slug: "lnf.to/kornprobst-flyer", title: "Flyer Herbstaktion" },
  { id: "l3", slug: "lnf.to/haarscharf-termin", title: "Terminbuchung Haarscharf" },
  { id: "l4", slug: "lnf.to/vortrag-tum", title: "Folien zum Vortrag an der TUM" },
];

const linksWord = (count: number) => (count === 1 ? "1 Link" : `${count} Links`);

/** `useItemDrag` needs the area around it, so the rows live in a child of the area. */
function LinkRows() {
  const { itemProps } = useItemDrag({ itemsFor: (id) => [id], label: linksWord });
  return (
    <Card className="min-w-0 flex-1">
      <ul className="flex flex-col divide-y divide-hairline">
        {LINKS.map((link) => (
          <li
            key={link.id}
            data-link={link.id}
            className="flex cursor-grab flex-col px-5 py-2.5"
            {...itemProps(link.id)}
          >
            <Text className="truncate font-medium text-fg">{link.title}</Text>
            <Text size="sm" tone="muted" mono className="truncate">
              {link.slug}
            </Text>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** A library's page: the rail takes its rows, dragged onto a folder, and takes no files at all. */
function Library({
  onItems = () => {},
  children,
}: {
  onItems?: (ids: string[], target: string) => void;
  children?: ReactNode;
}) {
  return (
    <FileDropArea accept="items" onItems={onItems} className="flex items-start gap-6">
      <Rail current="alle" />
      <LinkRows />
      {children}
    </FileDropArea>
  );
}

/** Lets items hang over an element, as a drag that began on a row does. */
function hangItemsOver(element: Element, ids: readonly string[]): DataTransfer {
  const transfer = new DataTransfer();
  transfer.setData(ITEMS_TYPE, JSON.stringify(ids));
  element.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
  element.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: transfer }));
  return transfer;
}

function HangingOver({ over }: { over: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = box.current?.querySelector(over);
    if (element) hangItemsOver(element, ["l1", "l2"]);
  }, [over]);
  return (
    <div ref={box}>
      <Library />
    </div>
  );
}

const libraryParameters = { visual: { viewport: { width: 760, height: 520 } } };

/**
 * A row is dragged over a folder of the rail: the folder takes the tint and the halo, and the
 * area says where the links will go. The area is one for items only (`accept="items"`).
 */
export const DropOver: Story = {
  parameters: libraryParameters,
  render: () => <HangingOver over='[data-drop-target="kunden"]' />,
};

/**
 * The keyboard path, as a test: Tab walks the links, the chevrons and the keys; a chevron says
 * what it folds and whether it is open; the `⋯` of a row shows while the keyboard is in it.
 */
export const Keyboard: Story = {
  render: () => <Rail actions />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    await step("the open place says so", async () => {
      await expect(canvas.getByRole("link", { name: /Schreinerei Huber/ })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    await step("Tab walks links, chevrons and keys in the order they stand", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: /Alle Links/ })).toHaveFocus();
      await userEvent.tab();
      await userEvent.tab();
      const chevron = canvas.getByRole("button", { name: "Unterordner Bewerbung" });
      await expect(chevron).toHaveFocus();
      await expect(chevron).toHaveAttribute("aria-expanded", "false");
    });

    await step("Enter on a chevron unfolds the folder, and again folds it", async () => {
      await userEvent.keyboard("{Enter}");
      // The folder opens from nothing: its rows are there at once and seen a moment later.
      await waitFor(() => expect(canvas.getByRole("link", { name: /Westend61/ })).toBeVisible());
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(canvas.queryByRole("link", { name: /Westend61/ })).toBeNull());
    });

    await step("with the keyboard in a row, its key shows in the count's place", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: /Bewerbung/ })).toHaveFocus();
      const row = canvas.getByRole("link", { name: /Bewerbung/ }).parentElement!;
      const actions = row.querySelector<HTMLElement>('[data-slot="side-nav-tree-actions"]')!;
      const count = row.querySelector<HTMLElement>('[data-slot="side-nav-tree-count"]')!;
      await waitFor(async () => {
        await expect(getComputedStyle(actions).opacity).toBe("1");
        await expect(getComputedStyle(count).opacity).toBe("0");
      });
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Mehr zu Bewerbung" })).toHaveFocus();
    });

    await step("a press on a place opens it", async () => {
      await userEvent.click(canvas.getByRole("link", { name: /Privat/ }));
      await expect(canvas.getByRole("link", { name: /Privat/ })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(
        canvasElement.querySelectorAll('[data-slot="side-nav-tree-link"][aria-current]'),
      ).toHaveLength(1);
    });
  },
};

/**
 * Renaming, as a test: the field stands in the row with the name in it, Enter takes the new
 * name, and the row is a link again.
 */
export const Rename: Story = {
  args: { onRename: fn() },
  render: (args: RailProps) => <Rail actions renaming="privat" {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Name von Privat" });
    await userEvent.clear(field);
    await userEvent.type(field, "Familie{Enter}");
    await expect((args as RailProps).onRename).toHaveBeenCalledWith("privat", "Familie");
    await waitFor(() => expect(canvas.getByRole("link", { name: /Familie/ })).toBeVisible());
  },
};

/**
 * Dropping, as a test: items let go over a folder are reported with the folder; a folder wears
 * the halo only while they hang over it; and files from the system are none of the area's
 * business: nothing lights up, and their drop is left to the browser.
 */
export const Drop: Story = {
  parameters: libraryParameters,
  args: { onItems: fn() },
  render: (args: { onItems?: (ids: string[], target: string) => void }) => (
    <Library onItems={args.onItems} />
  ),
  play: async ({ args, canvasElement, step }) => {
    const { onItems } = args as { onItems: ReturnType<typeof fn> };
    const folder = canvasElement.querySelector<HTMLElement>('[data-drop-target="kunden"]')!;
    const area = canvasElement.querySelector<HTMLElement>('[data-slot="file-drop-area"]')!;

    await step("items over a folder light it up, and the drop is reported", async () => {
      const transfer = hangItemsOver(folder, ["l1", "l3"]);
      await waitFor(() => expect(folder).toHaveAttribute("data-drop-over"));
      folder.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
      await waitFor(() => expect(onItems).toHaveBeenCalledWith(["l1", "l3"], "kunden"));
      await waitFor(() => expect(folder).not.toHaveAttribute("data-drop-over"));
    });

    await step(
      "files are left alone: no halo, no plate, and the drop is the browser's",
      async () => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["x"], "angebot.pdf", { type: "application/pdf" }));
        const enter = new DragEvent("dragenter", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        });
        folder.dispatchEvent(enter);
        const drop = new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: transfer,
        });
        folder.dispatchEvent(drop);
        await expect(enter.defaultPrevented).toBe(false);
        await expect(drop.defaultPrevented).toBe(false);
        await expect(folder).not.toHaveAttribute("data-drop-over");
        await expect(area).not.toHaveAttribute("data-dragging");
        await expect(area.querySelector('[data-slot="file-drop-area-plate"]')).not.toHaveAttribute(
          "data-shown",
        );
        await expect(onItems).toHaveBeenCalledTimes(1);
      },
    );
  },
};
