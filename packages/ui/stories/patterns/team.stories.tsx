import { UserAdd01Icon, UserRemove01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { AvatarGroup } from "@/components/avatar-group/avatar-group";
import type { AvatarPerson, Presence } from "@/components/avatar-group/people";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { Input } from "@/components/input/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table/table";
import { Text } from "@/components/text/text";
import { Timeline, TimelineGroup, TimelineItem } from "@/components/timeline/timeline";
import { toast } from "@/components/toast/toast";

import { AppFrame } from "./app-frame";

const meta = {
  title: "Patterns/Team",
  parameters: {
    layout: "fullscreen",
    visual: {
      viewport: { width: 1180, height: 820 },
      clip: "viewport",
      motion: [{ name: "invite", click: '[data-slot="dialog-trigger"]' }],
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ROLES = [
  { value: "inhaber", label: "Inhaberin" },
  { value: "verwaltung", label: "Verwaltung" },
  { value: "mitarbeit", label: "Mitarbeit" },
];

type Member = {
  name: string;
  email: string;
  role: string;
  presence?: Presence;
  seen: string;
  invited?: boolean;
};

const START: Member[] = [
  {
    name: "Maria Huber",
    email: "maria@schreinerei-huber.de",
    role: "inhaber",
    presence: "online",
    seen: "Jetzt",
  },
  {
    name: "Jonas Klein",
    email: "jonas@schreinerei-huber.de",
    role: "verwaltung",
    presence: "away",
    seen: "Vor 20 Minuten",
  },
  {
    name: "Anna Weber",
    email: "anna@schreinerei-huber.de",
    role: "mitarbeit",
    presence: "offline",
    seen: "Gestern",
  },
  {
    name: "Paul Wagner",
    email: "paul@schreinerei-huber.de",
    role: "mitarbeit",
    presence: "offline",
    seen: "Am 12. November",
  },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2);

/**
 * Who works in the account: the team at a glance, each member with a role that can be changed
 * in place, and an invitation in a dialog. An invitation that is sent joins the table and the
 * list of changes. A test board for the parts together, not a template for a page.
 */
function Board() {
  const [members, setMembers] = useState(START);
  const [changes, setChanges] = useState<{ who: string; what: string; time: string }[]>([]);
  const people: AvatarPerson[] = members.map((member) => ({
    name: member.name,
    presence: member.presence,
  }));

  const [inviting, setInviting] = useState(false);
  const invite = ({ email, role }: { email: string; role?: string }) => {
    const name = email.split("@")[0]!.replace(/^./, (first) => first.toLocaleUpperCase());
    setInviting(false);
    setMembers((now) => [
      ...now,
      { name, email, role: role ?? "mitarbeit", seen: "Noch nie", invited: true },
    ]);
    setChanges((now) => [
      { who: "Maria Huber", what: `hat ${email} eingeladen.`, time: "15:12" },
      ...now,
    ]);
    toast({ title: "Einladung gesendet.", description: email, tone: "success" });
  };

  return (
    <AppFrame page="team">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-col gap-2">
          <Heading level={1} size="section">
            Team.
          </Heading>
          <div className="flex items-center gap-3">
            <AvatarGroup people={people} label="Im Team" />
            <Text tone="muted">
              {members.length} Personen,{" "}
              {members.filter((member) => member.presence === "online").length} gerade online
            </Text>
          </div>
        </div>
        <Dialog open={inviting} onOpenChange={setInviting}>
          <DialogTrigger render={<Button variant="primary" />}>
            <Icon icon={UserAdd01Icon} />
            Einladen
          </DialogTrigger>
          <DialogContent>
            <Form<{ email: string; role?: string }> onFormSubmit={invite} className="gap-0">
              <DialogHeader>
                <DialogTitle>Ins Team einladen.</DialogTitle>
                <DialogDescription>
                  Die Person erhält eine E-Mail mit einem Link, über den sie ihr Konto anlegt.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <Field name="email">
                  <FieldLabel>E-Mail-Adresse</FieldLabel>
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@schreinerei-huber.de"
                    required
                  />
                </Field>
                <Field name="role">
                  <FieldLabel>Rolle</FieldLabel>
                  <Select items={ROLES} name="role" defaultValue="mitarbeit">
                    <SelectTrigger className="w-full" />
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Die Rolle lässt sich später ändern.</FieldDescription>
                </Field>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="quiet" />}>Abbrechen</DialogClose>
                <Button type="submit" variant="primary">
                  Einladung senden
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-x-10 gap-y-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <Table aria-label="Mitglieder">
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Zuletzt aktiv</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Entfernen</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.email}>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="md" presence={member.presence}>
                      <AvatarFallback>{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2 font-medium text-fg">
                        <span className="truncate">{member.name}</span>
                        {member.invited && <Badge tone="info">Eingeladen</Badge>}
                      </span>
                      <span className="truncate text-sm text-fg-muted">{member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    items={ROLES}
                    value={member.role}
                    onValueChange={(role) => {
                      if (typeof role !== "string") return;
                      setMembers((now) =>
                        now.map((each) => (each.email === member.email ? { ...each, role } : each)),
                      );
                      toast({
                        title: `${member.name} ist jetzt ${ROLES.find((each) => each.value === role)?.label}.`,
                      });
                    }}
                    disabled={member.role === "inhaber"}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={`Rolle von ${member.name}`}
                      className="w-36"
                    />
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="whitespace-nowrap text-fg-muted">{member.seen}</TableCell>
                <TableCell className="w-0">
                  <Button
                    size="sm"
                    variant="quiet"
                    iconOnly
                    disabled={member.role === "inhaber"}
                    aria-label={`${member.name} aus dem Team entfernen`}
                    onClick={() => {
                      setMembers((now) => now.filter((each) => each.email !== member.email));
                      setChanges((now) => [
                        { who: "Maria Huber", what: `hat ${member.name} entfernt.`, time: "15:14" },
                        ...now,
                      ]);
                    }}
                  >
                    <Icon icon={UserRemove01Icon} size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <section aria-labelledby="aenderungen" className="flex min-w-0 flex-col gap-3">
          <Heading level={2} size="label" id="aenderungen">
            Änderungen
          </Heading>
          <Timeline>
            <TimelineGroup label="Heute" dateTime="2026-11-19">
              {changes.map((change, index) => (
                <TimelineItem
                  key={`${index}-${change.what}`}
                  time={change.time}
                  avatar={
                    <Avatar size="sm">
                      <AvatarFallback>MH</AvatarFallback>
                    </Avatar>
                  }
                >
                  <strong>{change.who}</strong> {change.what}
                </TimelineItem>
              ))}
              <TimelineItem
                time="09:12"
                avatar={
                  <Avatar size="sm">
                    <AvatarFallback>JK</AvatarFallback>
                  </Avatar>
                }
              >
                <strong>Jonas Klein</strong> hat die Rolle Verwaltung bekommen.
              </TimelineItem>
            </TimelineGroup>
            <TimelineGroup label="Am 12. November" dateTime="2026-11-12">
              <TimelineItem time="10:40" icon={UserAdd01Icon}>
                <strong>Paul Wagner</strong> ist dem Team beigetreten.
              </TimelineItem>
            </TimelineGroup>
          </Timeline>
        </section>
      </div>
    </AppFrame>
  );
}

export const Team: Story = { render: () => <Board /> };

/** On a phone: the table scrolls sideways inside its fade; the page does not. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 1200 }, motion: [] } },
  render: () => <Board />,
};
