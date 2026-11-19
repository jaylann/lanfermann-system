import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AnchorHeading,
  AppShell,
  AppShellBar,
  AppShellPage,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Badge,
  Banner,
  BreadcrumbItem,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  buttonVariants,
  Calendar,
  Callout,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Chip,
  ChipGroup,
  Code,
  CodeBlock,
  type CodeTab,
  CodeTabs,
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Command,
  CommandContent,
  CommandFooter,
  CommandInput,
  CommandList,
  type CommandSection,
  CommandTrigger,
  ConsentEmbed,
  ConsentSettingsTrigger,
  Cta,
  CtaAction,
  CtaActions,
  CtaText,
  CtaTitle,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DocsLayout,
  DocsLayoutNav,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Empty,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
  Figure,
  FigureCaption,
  FigureFrame,
  Ground,
  type GroundName,
  Heading,
  Input,
  InputGroup,
  InputGroupAddon,
  Kbd,
  Link,
  Loaded,
  Logomark,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
  MenuTrigger,
  Meter,
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  Pager,
  PagerLink,
  Pagination,
  Parameter,
  ParameterList,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  Prose,
  Quote,
  Radio,
  RadioGroup,
  ReferenceEntry,
  ReferenceEntryBody,
  ReferenceEntryHeader,
  ReferenceEntryMeta,
  ReferenceEntryName,
  ReferenceEntryTitle,
  Segment,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Separator,
  Shortcut,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  SidebarMenu,
  SidebarSubItem,
  SidebarTrigger,
  SideNav,
  SideNavGroup,
  SideNavLink,
  SideNavSubLink,
  Skeleton,
  SkeletonGroup,
  Slider,
  SliderControl,
  Spinner,
  Stat,
  StatChange,
  StatGroup,
  StatLabel,
  StatValue,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableOfContents,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  Text,
  Textarea,
  Timeline,
  TimelineGroup,
  TimelineItem,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Wordmark,
} from "@lanfermann/ui";

import { Figures } from "./figures";
import { Inputs } from "./inputs";
import { QuoteForm } from "./quote-form";
import { Selection } from "./selection";

const GROUNDS: GroundName[] = ["paper", "tint", "ink", "indigo"];

const TRADES = [
  { value: "schreinerei", label: "Schreinerei" },
  { value: "baeckerei", label: "Bäckerei" },
  { value: "metzgerei", label: "Metzgerei" },
];

const INSTALL: CodeTab[] = [
  { label: "bun", code: "bun add @lanfermann/ui", language: "sh" },
  { label: "npm", code: "npm install @lanfermann/ui", language: "sh" },
  { label: "pnpm", code: "pnpm add @lanfermann/ui", language: "sh" },
];

// Plain data, so it can cross from this Server Component into the palette.
const COMMANDS: CommandSection[] = [
  {
    value: "Seiten",
    items: [
      { value: "angebote", label: "Angebote", detail: "12 offen" },
      { value: "rechnungen", label: "Rechnungen" },
      { value: "kunden", label: "Kunden", shortcut: "mod+shift+k" },
    ],
  },
];

const GLOBALS = `@import "tailwindcss";
@import "@lanfermann/ui/styles.css";
`;

/**
 * Consumer smoke test: a Server Component that renders every component of the library from its
 * built `dist`, on all four grounds. If a component loses its "use client" directive, a peer is
 * missing, an export is forgotten or a token does not resolve inside a nested ground,
 * `next build` or this page shows it. The workshop for looking at components is Storybook
 * (`bun run storybook`), not this app.
 */
export default function Home() {
  return (
    <TooltipProvider>
      <main className="flex w-full flex-1 flex-col">
        {GROUNDS.map((ground) => (
          <Ground key={ground} ground={ground} className="px-6 py-12">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
              <div className="flex flex-col gap-3">
                <Separator variant="rule" />
                <div className="flex items-center gap-3">
                  <Heading level={2}>{ground}.</Heading>
                  <Badge tone="info">dist</Badge>
                  <Spinner label="Beispiel" />
                </div>
                <Text tone="muted">
                  <code className="font-mono text-sm">@lanfermann/ui</code>, gerendert als Server
                  Component. Suchen mit <Kbd>⌘</Kbd> <Kbd>K</Kbd>.
                </Text>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Angebot senden</Button>
                <Button>Entwurf speichern</Button>
                <Button variant="ask">Analyse anfragen</Button>
                <Button variant="danger">Löschen</Button>
                <Button variant="quiet">Abbrechen</Button>
                <Button loading>Wird gesendet</Button>
                <Button disabled>Gesperrt</Button>
                <a href="#angebot" className={buttonVariants({ variant: "secondary" })}>
                  Als Link
                </a>
              </div>

              {/* The frame of an app, small: the sidebar beside a bar that holds the palette. */}
              <AppShell
                sidebarShortcut={false}
                className="min-h-0 overflow-hidden rounded-xl border border-hairline"
              >
                <Sidebar aria-label={`Navigation (${ground})`} className="static h-64">
                  <SidebarContent>
                    <SidebarGroup title="Arbeit">
                      <SidebarItem
                        href="#angebote"
                        open
                        detail="12"
                        sub={
                          <>
                            <SidebarSubItem href="#entwuerfe" current>
                              Entwürfe
                            </SidebarSubItem>
                            <SidebarSubItem href="#gesendet">Gesendet</SidebarSubItem>
                          </>
                        }
                      >
                        Angebote
                      </SidebarItem>
                      <SidebarItem href="#rechnungen">Rechnungen</SidebarItem>
                      <SidebarItem href="#kunden">Kunden</SidebarItem>
                      <SidebarMenu
                        items={
                          <>
                            <MenuLinkItem href="#vorlagen">Vorlagen</MenuLinkItem>
                            <MenuLinkItem href="#artikel">Artikel</MenuLinkItem>
                          </>
                        }
                      >
                        Mehr
                      </SidebarMenu>
                    </SidebarGroup>
                  </SidebarContent>
                </Sidebar>
                <AppShellPage>
                  <AppShellBar className="static">
                    <SidebarTrigger />
                    <Command items={COMMANDS} shortcut={false} label={`Befehle (${ground})`}>
                      <CommandTrigger render={<Button size="sm" className="ml-auto" />}>
                        Suchen <Shortcut keys="mod+k" />
                      </CommandTrigger>
                      <CommandContent>
                        <CommandInput placeholder="z. B. Angebote" />
                        <CommandList empty="Zu dieser Suche wurde keine Seite gefunden." />
                        <CommandFooter />
                      </CommandContent>
                    </Command>
                  </AppShellBar>
                </AppShellPage>
              </AppShell>

              <Tabs defaultValue="formular">
                <TabsList>
                  <Tab value="formular">Formular</Tab>
                  <Tab value="auswahl">Auswahl</Tab>
                  <Tab value="schichten">Schichten</Tab>
                </TabsList>

                <TabsPanel value="formular">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stammdaten.</CardTitle>
                      <CardDescription>So erscheint Ihr Betrieb auf Angeboten.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarFallback>SM</AvatarFallback>
                        </Avatar>
                        <Text tone="strong" weight="medium">
                          Schreinerei Mustermann
                        </Text>
                      </div>
                      <Field>
                        <FieldLabel>Betrieb</FieldLabel>
                        <Input defaultValue="Schreinerei Mustermann" />
                        <FieldDescription>Der Name auf Ihren Angeboten.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel nativeLabel={false} render={<div />}>
                          Gewerk
                        </FieldLabel>
                        <Select items={TRADES} defaultValue="schreinerei">
                          <SelectTrigger className="w-full" />
                          <SelectContent>
                            {TRADES.map((trade) => (
                              <SelectItem key={trade.value} value={trade.value}>
                                {trade.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel>Über den Betrieb</FieldLabel>
                        <Textarea placeholder="z. B. Küchen und Einbauschränke nach Maß" />
                      </Field>
                    </CardContent>
                    <CardFooter>Zuletzt geändert heute.</CardFooter>
                  </Card>
                </TabsPanel>

                <TabsPanel value="auswahl" className="flex flex-col gap-5">
                  <Fieldset>
                    <FieldsetLegend>Abrechnung</FieldsetLegend>
                    <RadioGroup defaultValue="festpreis" aria-label="Abrechnung">
                      <label className="flex items-center gap-2.5 text-control text-fg-body">
                        <Radio value="festpreis" />
                        Festpreis
                      </label>
                      <label className="flex items-center gap-2.5 text-control text-fg-body">
                        <Radio value="aufwand" />
                        Nach Aufwand
                      </label>
                    </RadioGroup>
                  </Fieldset>
                  <label className="flex items-center gap-2.5 text-control text-fg-body">
                    <Checkbox defaultChecked />
                    Website
                  </label>
                  <label className="flex items-center gap-2.5 text-control text-fg-body">
                    <Switch defaultChecked />
                    Jährlich abrechnen
                  </label>
                  <SegmentedControl defaultValue="jahr" className="self-start">
                    <Segment value="monat">Monatlich</Segment>
                    <Segment value="jahr">Jährlich</Segment>
                  </SegmentedControl>
                </TabsPanel>

                <TabsPanel value="schichten" className="flex flex-wrap items-center gap-3">
                  <Menu>
                    <MenuTrigger render={<Button />}>Menü</MenuTrigger>
                    <MenuContent>
                      <MenuItem>Bearbeiten</MenuItem>
                      <MenuCheckboxItem defaultChecked>Betrag zeigen</MenuCheckboxItem>
                      <MenuSeparator />
                      <MenuItem className="text-danger">Löschen</MenuItem>
                    </MenuContent>
                  </Menu>
                  <Popover>
                    <PopoverTrigger render={<Button />}>Popover</PopoverTrigger>
                    <PopoverContent>
                      <PopoverTitle>Angebot umbenennen.</PopoverTitle>
                      <PopoverDescription>Der Name steht auch auf dem PDF.</PopoverDescription>
                    </PopoverContent>
                  </Popover>
                  <Tooltip>
                    <TooltipTrigger render={<Button />}>Tooltip</TooltipTrigger>
                    <TooltipContent>Spricht auf Ink</TooltipContent>
                  </Tooltip>
                  <Dialog>
                    <DialogTrigger render={<Button />}>Dialog</DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Angebot senden.</DialogTitle>
                        <DialogDescription>Der Kunde erhält es als PDF.</DialogDescription>
                      </DialogHeader>
                      <DialogBody>
                        <Field>
                          <FieldLabel>E-Mail-Adresse</FieldLabel>
                          <Input type="email" defaultValue="max@schreinerei-mustermann.de" />
                        </Field>
                      </DialogBody>
                      <DialogFooter>
                        <DialogClose render={<Button variant="quiet" />}>Abbrechen</DialogClose>
                        <DialogClose render={<Button variant="primary" />}>
                          Jetzt senden
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="danger" />}>
                      Löschen
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Angebot wirklich löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Das lässt sich nicht rückgängig machen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogClose render={<Button />}>Behalten</AlertDialogClose>
                        <AlertDialogClose render={<Button variant="danger" />}>
                          Angebot löschen
                        </AlertDialogClose>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TabsPanel>
              </Tabs>

              {/* Everything added after the first set: each has to render from `dist` too. */}
              <div className="flex flex-wrap items-center gap-6">
                <Wordmark size={20} />
                <Text>
                  Mehr dazu im <Link href="#angebot">Angebot</Link>.
                </Text>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <InputGroup>
                    <Input aria-label="Betrag" defaultValue="2.780,00" className="text-right" />
                    <InputGroupAddon>€</InputGroupAddon>
                  </InputGroup>
                  <NumberField defaultValue={3} min={1} locale="de-DE" className="w-36">
                    <NumberFieldDecrement />
                    <NumberFieldInput aria-label="Anzahl" />
                    <NumberFieldIncrement />
                  </NumberField>
                  <Slider defaultValue={15} aria-label="Rabatt">
                    <SliderControl />
                  </Slider>
                  <Progress value={40} locale="de-DE" aria-label="Angebot wird exportiert" />
                  <Meter value={3} max={5} aria-label="Angebote in diesem Monat" />
                  <Collapsible>
                    <CollapsibleTrigger>Zusammensetzung</CollapsibleTrigger>
                    <CollapsiblePanel>Website 1.900 €, Google-Profil 880 €.</CollapsiblePanel>
                  </Collapsible>
                </div>
                <Calendar
                  mode="range"
                  today="2026-11-14"
                  defaultValue={{ from: "2026-11-19", to: "2026-11-27" }}
                />
              </div>

              <Accordion>
                <AccordionItem value="preis">
                  <AccordionTrigger>Was kostet eine Website?</AccordionTrigger>
                  <AccordionPanel>Ab 1.900 €, je nach Umfang.</AccordionPanel>
                </AccordionItem>
                <AccordionItem value="dauer">
                  <AccordionTrigger>Wie lange dauert es?</AccordionTrigger>
                  <AccordionPanel>In der Regel vier Wochen.</AccordionPanel>
                </AccordionItem>
              </Accordion>

              <Table aria-label="Angebote">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead numeric>Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Schreinerei Mustermann</TableCell>
                    <TableCell>
                      <Badge tone="success">Angenommen</Badge>
                    </TableCell>
                    <TableCell numeric>2.780,00 €</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bäckerei Huber</TableCell>
                    <TableCell>
                      <Badge>Entwurf</Badge>
                    </TableCell>
                    <TableCell numeric>1.900,00 €</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* What stands around a list of records. The pages take their address as a
                  pattern: a function could not be handed in from this Server Component. */}
              <div className="flex flex-col gap-4">
                <ChipGroup aria-label={`Filter (${ground})`}>
                  <Chip>Offen</Chip>
                  <Chip>Seit Oktober</Chip>
                </ChipGroup>
                <Loaded
                  ready
                  skeleton={
                    <SkeletonGroup label="Die Angebote werden gerade geladen.">
                      <Skeleton className="w-40" />
                    </SkeletonGroup>
                  }
                >
                  <Empty size="inline">
                    <EmptyTitle level={3}>
                      Zu diesen Filtern wurde kein Angebot gefunden.
                    </EmptyTitle>
                  </Empty>
                </Loaded>
                <SkeletonGroup label="Die Rechnungen werden gerade geladen." light="still">
                  <Skeleton className="w-48" />
                </SkeletonGroup>
                <Pagination
                  page={3}
                  pages={12}
                  href="#seite-{page}"
                  aria-label={`Seiten (${ground})`}
                />
                <Selection />
              </div>

              {/* The first page after sign-in. Stat, DescriptionList and Timeline are written
                  here, on the server; the stack, the banner and the rolling figure are client
                  parts handed plain data. */}
              <div className="flex flex-col gap-6">
                <Banner
                  tone="warning"
                  title="Ihre Testphase endet in drei Tagen."
                  action={
                    <a href="#tarife" className={buttonVariants({ size: "sm" })}>
                      Tarif wählen
                    </a>
                  }
                >
                  Wählen Sie einen Tarif, damit Ihre Angebote erhalten bleiben.
                </Banner>
                <StatGroup>
                  <Stat>
                    <StatLabel>Offene Angebote</StatLabel>
                    <StatValue>23</StatValue>
                    <StatChange trend="flat" context="zur Vorwoche">
                      ±0
                    </StatChange>
                  </Stat>
                  <Stat>
                    <StatLabel>Stornierungen</StatLabel>
                    <StatValue>4</StatValue>
                    <StatChange trend="up" tone="negative" context="zum Vormonat">
                      +2
                    </StatChange>
                  </Stat>
                </StatGroup>
                <Figures />
                <AvatarGroup
                  label={`Im Team (${ground})`}
                  people={[
                    { name: "Maria Huber", presence: "online" },
                    { name: "Jonas Klein" },
                    { name: "Anna Weber" },
                    { name: "Paul Wagner" },
                    { name: "Mia Becker" },
                  ]}
                />
                <DescriptionList>
                  <DescriptionTerm>Kunde</DescriptionTerm>
                  <DescriptionDetails>Bäckerei Kornprobst, Rosenheim</DescriptionDetails>
                  <DescriptionTerm>Gültig bis</DescriptionTerm>
                  <DescriptionDetails>15. Dezember 2026</DescriptionDetails>
                  <DescriptionTerm>Summe</DescriptionTerm>
                  <DescriptionDetails>4.860,00 € netto</DescriptionDetails>
                </DescriptionList>
                <Timeline>
                  <TimelineGroup label="Heute" dateTime="2026-11-19">
                    <TimelineItem
                      time="14:32"
                      avatar={
                        <Avatar size="sm">
                          <AvatarFallback>AW</AvatarFallback>
                        </Avatar>
                      }
                    >
                      <strong>Anna Weber</strong> hat ein Angebot angenommen.
                    </TimelineItem>
                    <TimelineItem time="11:05" tone="danger">
                      Eine Zahlung ist fehlgeschlagen.
                    </TimelineItem>
                  </TimelineGroup>
                </Timeline>
              </div>

              {/* The inputs of an app. They hold state or take functions, so they stand in a
                  client component of their own. */}
              <Inputs ground={ground} />

              {/* The symbol stands apart from the wordmark above: the two are never side by side. */}
              <div className="flex items-center justify-between gap-6">
                <Drawer>
                  <DrawerTrigger render={<Button />}>Angebot 2026-0421</DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Schreinerei Mustermann.</DrawerTitle>
                      <DrawerDescription>Website und Google-Profil.</DrawerDescription>
                    </DrawerHeader>
                    <DrawerBody>2.780,00 €, gültig bis 30. November.</DrawerBody>
                    <DrawerFooter>
                      <DrawerClose render={<Button variant="quiet" />}>Schließen</DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                <Logomark size={24} tone={ground === "indigo" ? "mono" : "duo"} />
              </div>

              <QuoteForm />

              <Alert tone="warning">
                <AlertTitle>Ihr Tarif endet am 30. November.</AlertTitle>
                <AlertDescription>Verlängern Sie bis dahin.</AlertDescription>
              </Alert>

              {/* Highlighted here, on the server: no highlighter may reach the browser. */}
              <div className="flex flex-col gap-4">
                <CodeTabs items={INSTALL} />
                <Text>
                  Die Stylesheet-Datei kommt direkt nach Tailwind in <Code>globals.css</Code>.
                </Text>
                <CodeBlock code={GLOBALS} language="css" title="globals.css" marked={2} />
              </div>

              {/* A page of documentation: the server-safe parts beside the client ones. */}
              <DocsLayout className="px-0 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)]">
                <DocsLayoutNav className="block">
                  <SideNav aria-label={`Dokumentation (${ground})`}>
                    <SideNavGroup title="Erste Schritte">
                      <SideNavLink href="#">Überblick</SideNavLink>
                      <SideNavLink
                        href="#"
                        current
                        sub={<SideNavSubLink href="#">Claude Desktop</SideNavSubLink>}
                      >
                        Schnellstart
                      </SideNavLink>
                    </SideNavGroup>
                  </SideNav>
                </DocsLayoutNav>
                <div className="flex min-w-0 flex-col gap-6">
                  <Breadcrumbs>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Doku</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>Erste Schritte</BreadcrumbItem>
                  </Breadcrumbs>
                  <TableOfContents
                    items={[
                      { id: `start-${ground}`, label: "Bevor du beginnst" },
                      { id: `tool-${ground}`, label: "Werkzeug" },
                    ]}
                    current={`start-${ground}`}
                  />
                  <Prose>
                    <AnchorHeading id={`start-${ground}`}>Bevor du beginnst</AnchorHeading>
                    <p>Ein API-Token hat vollen Zugriff auf das ganze Konto.</p>
                    <Callout tone="warning">
                      <p>Behandle es wie ein Passwort.</p>
                    </Callout>
                    <Quote copy="Welche Belege sind noch nicht bezahlt?">
                      <p>Welche Belege sind noch nicht bezahlt?</p>
                    </Quote>
                    <ReferenceEntry aria-labelledby={`tool-${ground}`}>
                      <ReferenceEntryHeader>
                        <ReferenceEntryName id={`tool-${ground}`}>
                          sevdesk_invoice_cancel
                        </ReferenceEntryName>
                        <ReferenceEntryTitle>Rechnung stornieren</ReferenceEntryTitle>
                        <ReferenceEntryMeta>
                          <Badge>Buchen</Badge>
                        </ReferenceEntryMeta>
                      </ReferenceEntryHeader>
                      <ReferenceEntryBody>
                        <ParameterList aria-label="Argumente">
                          <Parameter name="id" type="integer" required>
                            Die Id der Rechnung.
                          </Parameter>
                        </ParameterList>
                      </ReferenceEntryBody>
                    </ReferenceEntry>
                    <Figure>
                      <FigureFrame>
                        <Logomark size={48} tone={ground === "indigo" ? "mono" : "duo"} />
                      </FigureFrame>
                      <FigureCaption>Das Zeichen auf seinem Blatt.</FigureCaption>
                    </Figure>
                  </Prose>
                  <Pager>
                    <PagerLink direction="previous" href="#" title="Überblick" />
                    <PagerLink direction="next" href="#" title="Clients" />
                  </Pager>
                </div>
              </DocsLayout>

              {/* The closing ask comes last, once. */}
              <Cta>
                <CtaTitle>Erzähl mir von deinem Produkt.</CtaTitle>
                <CtaText>
                  Das erste Gespräch kostet nichts. Ich antworte auf jede Nachricht und sage dir
                  auch, wenn es nicht passt.
                </CtaText>
                <CtaActions>
                  <CtaAction href="#nachricht">Nachricht schreiben</CtaAction>
                  <CtaAction href="#gespraech" variant="secondary">
                    Gespräch ausmachen
                  </CtaAction>
                </CtaActions>
              </Cta>
            </div>
          </Ground>
        ))}
      </main>
      {/* Consent: a video that loads only with consent, and the way back to the settings. */}
      <footer className="flex flex-col gap-6 border-t border-line px-6 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <ConsentEmbed service="youtube">
            <iframe
              src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ"
              title="Big Buck Bunny"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </ConsentEmbed>
          <p className="flex gap-6 text-sm text-fg-muted">
            <a href="#impressum">Impressum</a>
            <a href="#datenschutz">Datenschutzerklärung</a>
            <ConsentSettingsTrigger />
          </p>
        </div>
      </footer>
      <Toaster />
    </TooltipProvider>
  );
}
