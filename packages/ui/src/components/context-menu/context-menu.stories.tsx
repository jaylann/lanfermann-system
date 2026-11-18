import {
  Archive02Icon,
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useEffect, useRef } from "react";
import { expect, fireEvent, screen, waitFor, within } from "storybook/test";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "./context-menu";

const meta = {
  title: "Components/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 640, height: 380 }, clip: "viewport" },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const QUOTES = [
  { id: "2026-0421", customer: "Schreinerei Mustermann", amount: "2.780,00 €" },
  { id: "2026-0418", customer: "Bäckerei Kornprobst", amount: "4.280,00 €" },
  { id: "2026-0412", customer: "Friseursalon Haarscharf", amount: "1.950,00 €" },
];

/** One list of entries, for the row's own menu and for the context menu alike. */
function QuoteActions({ withSub = false }: { withSub?: boolean }) {
  return (
    <>
      <MenuItem>
        <Icon icon={Copy01Icon} size={16} />
        Duplizieren
      </MenuItem>
      {withSub ? (
        <MenuSub>
          <MenuSubTrigger>
            <Icon icon={Share08Icon} size={16} />
            Senden an
          </MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Kundin per E-Mail</MenuItem>
            <MenuItem>Steuerberatung</MenuItem>
            <MenuItem>Mich selbst</MenuItem>
          </MenuSubContent>
        </MenuSub>
      ) : (
        <MenuItem>
          <Icon icon={Share08Icon} size={16} />
          Senden
        </MenuItem>
      )}
      <MenuItem>
        <Icon icon={Archive02Icon} size={16} />
        Archivieren
      </MenuItem>
      <MenuSeparator />
      <MenuItem>
        <Icon icon={Delete02Icon} size={16} />
        Löschen
      </MenuItem>
    </>
  );
}

function Quotes({ withSub = false }: { withSub?: boolean }) {
  return (
    <Table aria-label="Angebote">
      <TableHeader>
        <TableRow>
          <TableHead>Nummer</TableHead>
          <TableHead>Kunde</TableHead>
          <TableHead numeric>Betrag</TableHead>
          <TableHead>
            <span className="sr-only">Aktionen</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {QUOTES.map((quote) => (
          <ContextMenu key={quote.id}>
            <ContextMenuTrigger
              // The row is the area, and stays marked while its menu is open.
              render={<TableRow interactive className="data-popup-open:bg-hover" />}
            >
              <TableCell className="tabular-nums">{quote.id}</TableCell>
              <TableCell>{quote.customer}</TableCell>
              <TableCell numeric>{quote.amount}</TableCell>
              <TableCell className="w-0">
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        iconOnly
                        size="sm"
                        variant="quiet"
                        aria-label={`Weitere Aktionen für Angebot ${quote.id}`}
                      >
                        <Icon icon={MoreHorizontalIcon} size={14} />
                      </Button>
                    }
                  />
                  <MenuContent align="end">
                    <QuoteActions withSub={withSub} />
                  </MenuContent>
                </Menu>
              </TableCell>
            </ContextMenuTrigger>
            <ContextMenuContent aria-label={`Angebot ${quote.id}`}>
              <QuoteActions withSub={withSub} />
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * A right click on a row (a long press on a phone) opens the row's actions where the pointer
 * is. The same actions hang from the key at the end of the row, for the keyboard and for
 * whoever does not know that a right click does something here.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "open", context: '[data-slot="context-menu-trigger"]:nth-of-type(2)', frames: 6 },
      ],
    },
  },
  render: () => <Quotes />,
};

/** The story's stand-in for a right click: it asks for the menu of a row at a point in it. */
function OpenAt({ row, children }: { row: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = box.current?.querySelectorAll<HTMLElement>('[data-slot="context-menu-trigger"]')[
      row
    ];
    if (!area) return;
    const rect = area.getBoundingClientRect();
    area.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 150,
        clientY: rect.top + rect.height / 2,
      }),
    );
  }, [row]);
  return <div ref={box}>{children}</div>;
}

/** Open: the sheet where the pointer was, the row it belongs to still marked. */
export const Open: Story = {
  render: () => (
    <OpenAt row={0}>
      <Quotes />
    </OpenAt>
  ),
};

/** With a second level: it opens beside its row, as in a `Menu`. */
export const WithSubmenu: Story = {
  render: () => <Quotes withSub />,
};

/**
 * As a test: a right click opens the menu at the pointer, the arrow keys and Enter work inside
 * it, Escape closes it, and the same entries are in reach of the keyboard through the row's
 * own menu.
 */
export const Keyboard: Story = {
  render: () => <Quotes />,
  play: async ({ canvas, userEvent, step }) => {
    const row = canvas.getByRole("row", { name: /2026-0418/ });

    await step("a right click opens the menu of that row", async () => {
      await fireEvent.contextMenu(row, { clientX: 220, clientY: 120 });
      const menu = await waitFor(() => screen.getByRole("menu", { name: "Angebot 2026-0418" }));
      await expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);
    });

    await step("the arrow keys move in it, and Escape closes it", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await waitFor(() =>
        expect(screen.getByRole("menuitem", { name: "Duplizieren" })).toHaveAttribute(
          "data-highlighted",
        ),
      );
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    });

    await step("the keyboard reaches the same entries through the row's key", async () => {
      const more = canvas.getByRole("button", { name: "Weitere Aktionen für Angebot 2026-0418" });
      more.focus();
      await userEvent.keyboard("{Enter}");
      const menu = await waitFor(() => screen.getByRole("menu"));
      await expect(within(menu).getAllByRole("menuitem")).toHaveLength(4);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(more).toHaveFocus());
    });
  },
};
