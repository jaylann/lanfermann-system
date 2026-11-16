import { Download01Icon, Mail01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { Button } from "@/components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card/card";
import { Checkbox } from "@/components/checkbox/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Icon } from "@/components/icon/icon";
import { Input } from "@/components/input/input";
import { Link } from "@/components/link/link";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/menu/menu";
import { Radio, RadioGroup } from "@/components/radio/radio";
import { Segment, SegmentedControl } from "@/components/segmented-control/segmented-control";
import { Switch } from "@/components/switch/switch";
import { Tab, Tabs, TabsList } from "@/components/tabs/tabs";
import { ChevronDownGlyph } from "@/internal/glyphs";

/**
 * Every archetype on one screen, the way they meet in a real product. This is the board the
 * system is judged on: change a recipe in src/styles/depth.css and look here first.
 */
const meta = {
  title: "Patterns/Specimen",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Account({ initials, name, role }: { initials: string; name: string; role?: string }) {
  return (
    <>
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <span className="flex flex-col leading-tight">
        <span>{name}</span>
        {role && <span className="text-sm text-fg-muted">{role}</span>}
      </span>
    </>
  );
}

export const Specimen: Story = {
  parameters: { visual: { viewport: { width: 1040, height: 980 }, clip: "viewport" } },
  render: () => (
    <div className="grid min-h-[980px] w-full max-w-[1040px] grid-cols-[minmax(0,1fr)] items-start gap-12 p-6 lg:grid-cols-[380px_1fr] lg:p-12">
      <Card>
        <CardHeader>
          <CardTitle>Bei Lanfermann anmelden.</CardTitle>
          <CardDescription>Willkommen zurück.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>E-Mail-Adresse</FieldLabel>
            <Input type="email" defaultValue="max@schreinerei-mustermann.de" />
          </Field>
          <Field invalid>
            <FieldLabel>Passwort</FieldLabel>
            <Input type="password" defaultValue="geheim" />
            <FieldError match>Das Passwort stimmt nicht. Bitte geben Sie es erneut ein.</FieldError>
          </Field>
          <Field>
            <FieldLabel>Betrieb</FieldLabel>
            <Input placeholder="z. B. Schreinerei Huber" />
            <FieldDescription>So erscheint Ihr Name auf Angeboten.</FieldDescription>
          </Field>
          <label className="flex items-center gap-2.5 text-control text-fg-body">
            <Checkbox defaultChecked />
            Angemeldet bleiben
          </label>
          <Button variant="primary">Weiter</Button>
          <Button>
            <Icon icon={Mail01Icon} />
            Link per E-Mail senden
          </Button>
        </CardContent>
        <CardFooter>
          Noch kein Konto?
          <Link href="#registrieren">Registrieren</Link>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-8">
        <Tabs defaultValue="konto">
          <TabsList>
            <Tab value="konto">Konto</Tab>
            <Tab value="team">Team</Tab>
            <Tab value="abrechnung">Abrechnung</Tab>
            <Tab value="sicherheit">Sicherheit</Tab>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Angebot senden</Button>
          <Button>Entwurf speichern</Button>
          <Button variant="quiet">Abbrechen</Button>
          <Button variant="ask">Analyse anfragen</Button>
          <Button variant="danger">Löschen</Button>
          <Button disabled>Gesperrt</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">
            <Icon icon={PencilEdit02Icon} size={14} />
            Bearbeiten
          </Button>
          <Button size="sm" variant="primary">
            Senden
          </Button>
          <Button variant="primary">
            <Icon icon={Download01Icon} />
            Auftragsbestätigung herunterladen
          </Button>
          <Button size="lg" variant="ask">
            Kostenlose Analyse anfragen
          </Button>
        </div>

        <div className="flex flex-col items-start gap-4">
          <SegmentedControl defaultValue="jahr">
            <Segment value="monat">Monatlich</Segment>
            <Segment value="jahr">Jährlich</Segment>
            <Segment value="einmalig">Einmalig</Segment>
          </SegmentedControl>
          <div className="flex items-center gap-8">
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Switch defaultChecked />
              Jährlich abrechnen
            </label>
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Switch />
              Newsletter
            </label>
          </div>
        </div>

        <div className="grid gap-10 border-t-2 border-rule pt-5 sm:grid-cols-2">
          <RadioGroup defaultValue="festpreis">
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Radio value="festpreis" />
              Festpreis
            </label>
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Radio value="aufwand" />
              Nach Aufwand
            </label>
            <label className="flex items-center gap-2.5 text-control text-on-disabled">
              <Radio value="abo" disabled />
              Im Abo
            </label>
          </RadioGroup>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Checkbox defaultChecked />
              Website
            </label>
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Checkbox />
              Google-Profil
            </label>
            <label className="flex items-center gap-2.5 text-control text-fg-body">
              <Checkbox indeterminate />
              Automatisierung
            </label>
          </div>
        </div>

        <div>
          <Menu defaultOpen modal={false}>
            <MenuTrigger
              render={
                <Button>
                  <Account initials="JL" name="Persönliches Konto" />
                  <ChevronDownGlyph className="text-fg-muted" />
                </Button>
              }
            />
            <MenuContent className="w-72">
              <MenuItem>
                <Account initials="JL" name="Persönliches Konto" />
              </MenuItem>
              <MenuItem>
                <Account initials="SM" name="Schreinerei Mustermann" role="Mitglied" />
              </MenuItem>
              <MenuItem>
                <Account initials="BK" name="Bäckerei Kornprobst" role="Inhaber" />
              </MenuItem>
              <MenuSeparator />
              <MenuItem className="text-fg-muted">Organisation anlegen</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
    </div>
  ),
};

/** The same parts, close: this is the board to compare edges, light and corners on. */
export const CloseUp: Story = {
  parameters: { layout: "centered", visual: { viewport: { width: 470, height: 330 } } },
  render: () => (
    <div className="flex w-[410px] max-w-[calc(100vw-2rem)] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="primary">Angebot senden</Button>
        <Button>Speichern</Button>
        <Button variant="ask">Anfragen</Button>
      </div>
      <Input aria-label="Betrieb" defaultValue="Schreinerei Mustermann" />
      <div className="flex items-center gap-5">
        <Checkbox aria-label="Website" defaultChecked />
        <Checkbox aria-label="Google-Profil" />
        <RadioGroup defaultValue="a" aria-label="Abrechnung" className="flex-row gap-5">
          <Radio aria-label="Festpreis" value="a" />
          <Radio aria-label="Nach Aufwand" value="b" />
        </RadioGroup>
        <Switch aria-label="Jährlich abrechnen" defaultChecked />
        <Switch aria-label="Newsletter" />
      </div>
      <div className="flex items-center gap-4">
        <SegmentedControl defaultValue="jahr">
          <Segment value="monat">Monatlich</Segment>
          <Segment value="jahr">Jährlich</Segment>
        </SegmentedControl>
        <Button size="sm">
          <Icon icon={PencilEdit02Icon} size={14} />
          Bearbeiten
        </Button>
      </div>
    </div>
  ),
};
