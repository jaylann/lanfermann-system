import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Card } from "@/components/card/card";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Kbd } from "@/components/kbd/kbd";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/menu/menu";
import { Segment, SegmentedControl } from "@/components/segmented-control/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { toast, Toaster } from "@/components/toast/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip/tooltip";

const meta = {
  title: "Patterns/Quotes",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 980, height: 620 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const QUOTES = [
  {
    id: "2026-0421",
    initials: "SM",
    customer: "Schreinerei Mustermann",
    subject: "Website und Google-Profil",
    amount: "2.780,00 €",
    state: ["Entwurf", "neutral"],
  },
  {
    id: "2026-0418",
    initials: "BK",
    customer: "Bäckerei Kornprobst",
    subject: "Website, Bestellformular",
    amount: "4.280,00 €",
    state: ["Gesendet", "info"],
  },
  {
    id: "2026-0412",
    initials: "FH",
    customer: "Friseursalon Haarscharf",
    subject: "Terminbuchung",
    amount: "1.950,00 €",
    state: ["Angenommen", "success"],
  },
  {
    id: "2026-0397",
    initials: "EW",
    customer: "Elektro Wagner",
    subject: "Website, monatliche Pflege",
    amount: "3.120,00 €",
    state: ["Überfällig", "danger"],
  },
] as const;

/**
 * A list people work in every day, as a `Table`. Rows are divided by lines, not boxed; the only
 * raised things are the ones a hand operates. Icon buttons carry tooltips, and an action answers
 * with a toast.
 */
export const Quotes: Story = {
  render: () => (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex flex-col gap-4">
            <Heading level={1}>Ihre Angebote.</Heading>
            <SegmentedControl defaultValue="alle">
              <Segment value="alle">Alle</Segment>
              <Segment value="offen">Offen</Segment>
              <Segment value="angenommen">Angenommen</Segment>
            </SegmentedControl>
          </div>
          <Button variant="primary">
            <Icon icon={Add01Icon} />
            Neues Angebot
            <span className="flex gap-1">
              <Kbd>N</Kbd>
            </span>
          </Button>
        </div>

        <Card>
          <Table aria-label="Angebote" className="min-w-[38rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Status</TableHead>
                <TableHead numeric>Betrag</TableHead>
                <TableHead>
                  <span className="sr-only">Aktionen</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {QUOTES.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar size="lg">
                        <AvatarFallback>{quote.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-fg">{quote.customer}</span>
                        <span className="truncate text-sm text-fg-muted">
                          {quote.subject} · <span className="font-mono text-xs">{quote.id}</span>
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge dot tone={quote.state[1]}>
                      {quote.state[0]}
                    </Badge>
                  </TableCell>
                  <TableCell numeric className="font-medium text-fg">
                    {quote.amount}
                  </TableCell>
                  <TableCell className="w-0">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button iconOnly variant="quiet" aria-label="Bearbeiten">
                              <Icon icon={PencilEdit02Icon} />
                            </Button>
                          }
                        />
                        <TooltipContent>Bearbeiten</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              iconOnly
                              variant="quiet"
                              aria-label="Als PDF herunterladen"
                              onClick={() =>
                                toast({
                                  title: "PDF erstellt.",
                                  description: `Angebot ${quote.id}`,
                                })
                              }
                            >
                              <Icon icon={Download01Icon} />
                            </Button>
                          }
                        />
                        <TooltipContent>Als PDF herunterladen</TooltipContent>
                      </Tooltip>
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button iconOnly variant="quiet" aria-label="Weitere Aktionen">
                              <Icon icon={MoreHorizontalIcon} />
                            </Button>
                          }
                        />
                        <MenuContent align="end">
                          <MenuItem
                            onClick={() =>
                              toast({
                                title: "Angebot dupliziert.",
                                tone: "success",
                                action: { label: "Rückgängig", onClick: () => undefined },
                              })
                            }
                          >
                            <Icon icon={Copy01Icon} className="text-fg-muted" />
                            Duplizieren
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem className="text-danger">
                            <Icon icon={Delete02Icon} />
                            Löschen
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Toaster />
      </div>
    </TooltipProvider>
  ),
};
