import {
  Delete02Icon,
  Edit02Icon,
  Key01Icon,
  MoreHorizontalIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog/alert-dialog";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/context-menu/context-menu";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/menu/menu";
import { OtpField } from "@/components/otp-field/otp-field";
import { SecretField } from "@/components/secret-field/secret-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";

const meta = {
  title: "Patterns/API keys",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 900, height: 620 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Key = {
  id: string;
  name: string;
  start: string;
  created: string;
  used: string;
  live: boolean;
};

const KEYS: Key[] = [
  {
    id: "1",
    name: "Website",
    start: "lf_live_9fK2",
    created: "12.03.2026",
    used: "vor 4 Minuten",
    live: true,
  },
  {
    id: "2",
    name: "Buchhaltung",
    start: "lf_live_Tz4b",
    created: "02.09.2026",
    used: "gestern",
    live: true,
  },
  {
    id: "3",
    name: "Testumgebung",
    start: "lf_test_81Nc",
    created: "18.11.2026",
    used: "noch nie",
    live: false,
  },
];

const NEW_KEY = "lf_live_9fK2mQ7xLr4TzVb81NcYd3Ha";

/** What can be done with a key: one list, for the row's own menu and for the context menu. */
function KeyActions({ onDelete }: { onDelete: () => void }) {
  return (
    <>
      <MenuItem>
        <Icon icon={Edit02Icon} size={16} />
        Umbenennen
      </MenuItem>
      <MenuItem>
        <Icon icon={RefreshIcon} size={16} />
        Schlüssel erneuern
      </MenuItem>
      <MenuSeparator />
      <MenuItem onClick={onDelete}>
        <Icon icon={Delete02Icon} size={16} />
        Löschen
      </MenuItem>
    </>
  );
}

type Shown = "list" | "confirm" | "created" | "delete";

function Keys({ show = "list" }: { show?: Shown }) {
  const [step, setStep] = useState<Shown>(show);
  const [doomed, setDoomed] = useState<Key | undefined>(show === "delete" ? KEYS[2] : undefined);
  const creating = step === "confirm" || step === "created";
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Heading level={1}>API-Schlüssel.</Heading>
          <Text tone="muted">
            Mit einem Schlüssel greifen Ihre eigenen Programme auf den Arbeitsbereich zu.
          </Text>
        </div>
        <Button variant="primary" onClick={() => setStep("confirm")}>
          <Icon icon={Key01Icon} size={16} />
          Schlüssel erstellen
        </Button>
      </div>

      <Table aria-label="API-Schlüssel">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schlüssel</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead>Zuletzt verwendet</TableHead>
            <TableHead>
              <span className="sr-only">Aktionen</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {KEYS.map((key) => (
            <ContextMenu key={key.id}>
              <ContextMenuTrigger
                render={<TableRow interactive className="data-popup-open:bg-hover" />}
              >
                <TableCell>
                  <span className="flex items-center gap-2">
                    {key.name}
                    {!key.live && <Badge>Test</Badge>}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm text-fg-body">{key.start}…</TableCell>
                <TableCell className="tabular-nums">{key.created}</TableCell>
                <TableCell className="text-fg-muted">{key.used}</TableCell>
                <TableCell className="w-0">
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button
                          iconOnly
                          size="sm"
                          variant="quiet"
                          aria-label={`Weitere Aktionen für ${key.name}`}
                        >
                          <Icon icon={MoreHorizontalIcon} size={14} />
                        </Button>
                      }
                    />
                    <MenuContent align="end">
                      <KeyActions onDelete={() => setDoomed(key)} />
                    </MenuContent>
                  </Menu>
                </TableCell>
              </ContextMenuTrigger>
              <ContextMenuContent aria-label={key.name}>
                <KeyActions onDelete={() => setDoomed(key)} />
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </TableBody>
      </Table>

      {/* A new key: first the code that proves who asks, then the key, shown once. */}
      <Dialog open={creating} onOpenChange={(open) => !open && setStep("list")}>
        <DialogContent className="max-w-md">
          {step === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>Bitte bestätigen Sie, dass Sie es sind.</DialogTitle>
                <DialogDescription>
                  Ein Schlüssel öffnet den ganzen Arbeitsbereich. Wir haben einen Code an Ihre
                  Authenticator-App gesendet.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel>Bestätigungscode</FieldLabel>
                  <OtpField fill onValueComplete={() => setStep("created")} />
                  <FieldDescription>Sechs Ziffern, 30 Sekunden gültig.</FieldDescription>
                </Field>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="quiet" />}>Abbrechen</DialogClose>
                <Button variant="primary" onClick={() => setStep("created")}>
                  Bestätigen
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Ihr neuer Schlüssel.</DialogTitle>
                <DialogDescription>
                  Kopieren Sie ihn jetzt und bewahren Sie ihn sicher auf. Wir zeigen ihn kein
                  zweites Mal.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel>Geheimer Schlüssel</FieldLabel>
                  <SecretField value={NEW_KEY} visibleStart={8} />
                  <FieldDescription>Gültig für alle Bereiche, ohne Ablaufdatum.</FieldDescription>
                </Field>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="primary" />}>Fertig</DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={doomed !== undefined}
        onOpenChange={(open) => !open && setDoomed(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schlüssel „{doomed?.name}“ wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Programme, die ihn verwenden, haben sofort keinen Zugriff mehr. Das lässt sich nicht
              rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button />}>Behalten</AlertDialogClose>
            <AlertDialogClose render={<Button variant="danger" />}>
              Schlüssel löschen
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

/**
 * The keys of a workspace: a table, each row with its actions behind a key and, as a shortcut,
 * behind a right click. A test board for the parts together, not a template.
 */
export const List: Story = { render: () => <Keys /> };

/**
 * Before a key is made: the code that proves who asks. Its slots share the dialog's width
 * (`fill`), so the field ends where the text above it does. The last digit moves on by itself.
 */
export const Confirm: Story = { render: () => <Keys show="confirm" /> };

/** The new key, shown once: hidden but for its prefix, with a key to show and one to copy it. */
export const Created: Story = { render: () => <Keys show="created" /> };

/** Deleting a key wants an answer: the consequence in the title, the answers named. */
export const Delete: Story = { render: () => <Keys show="delete" /> };

/** On a phone the table scrolls inside itself and the dialog spans the page. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 760 } } },
  render: () => <Keys show="created" />,
};
