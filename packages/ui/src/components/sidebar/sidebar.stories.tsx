import {
  Add01Icon,
  Analytics01Icon,
  Calendar03Icon,
  Clock01Icon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  Home01Icon,
  InboxIcon,
  Invoice01Icon,
  Layout01Icon,
  Logout01Icon,
  MoreHorizontalIcon,
  NoteEditIcon,
  Notification01Icon,
  PackageIcon,
  Settings01Icon,
  Store01Icon,
  UserGroupIcon,
  UserIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { expect, screen, waitFor } from "storybook/test";

import {
  AppShell,
  AppShellBar,
  AppShellMain,
  AppShellPage,
} from "@/components/app-shell/app-shell";
import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { BreadcrumbItem, BreadcrumbPage, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/menu/menu";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@/components/page-header/page-header";
import { ShortcutProvider } from "@/components/shortcut/shortcut";

import {
  Sidebar,
  SidebarBrand,
  SidebarButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMenu,
  type SidebarProps,
  SidebarSubItem,
  SidebarTrigger,
} from "./sidebar";

const meta = {
  title: "Components/Sidebar",
  component: Sidebar,
  args: { "aria-label": "Hauptnavigation" },
  parameters: {
    layout: "fullscreen",
    visual: {
      // Wider than the sidebar: the menu of „Mehr“ opens beside it.
      viewport: { width: 520, height: 640 },
      clip: "viewport",
      target: '[data-slot="sidebar-item"]:not([aria-current])',
    },
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const pages = {
  uebersicht: "Übersicht",
  posteingang: "Posteingang",
  angebote: "Angebote",
  rechnungen: "Rechnungen",
  kunden: "Kunden",
  termine: "Termine",
  auswertung: "Auswertung",
  einstellungen: "Einstellungen",
} as const;

type Page = keyof typeof pages;

type Place = { name: string; icon?: IconSvgElement };

/** The pages that have pages of their own under them: one set without symbols, one with. */
const subpages: Partial<Record<Page, readonly Place[]>> = {
  angebote: [{ name: "Entwürfe" }, { name: "Gesendet" }, { name: "Angenommen" }],
  einstellungen: [
    { name: "Betrieb", icon: Store01Icon },
    { name: "Team", icon: UserGroupIcon },
    { name: "Abrechnung", icon: CreditCardIcon },
  ],
};

/** The places that are needed now and then: they wait in a menu beside the sidebar. */
const more: readonly Required<Place>[] = [
  { name: "Vorlagen", icon: Layout01Icon },
  { name: "Artikel", icon: PackageIcon },
  { name: "Zeiterfassung", icon: Clock01Icon },
  { name: "Lieferanten", icon: DeliveryTruck01Icon },
];

const businesses = [
  { value: "huber", name: "Schreinerei Huber", initials: "SH" },
  { value: "weiss", name: "Gärtnerei Weiß", initials: "GW" },
];

type EntriesProps = Partial<SidebarProps> & {
  /** The page the story opens on. */
  start?: Page;
  /** The subpage of that page that is being worked on, if any. */
  subpage?: string;
  /** Whether the last group folds. */
  folds?: boolean;
  /** Whether the menu beside the sidebar is open at first, so it shows in a still picture. */
  moreOpen?: boolean;
  /** The product's mark in the header, in place of the workspace's menu. */
  brand?: boolean;
};

/**
 * The sidebar of a workshop's office: a few places, and where one is kept in state. The story
 * has no router, so a press only changes which page counts as current.
 */
function Entries({
  start = "angebote",
  subpage,
  folds = false,
  moreOpen = false,
  brand = false,
  ...props
}: EntriesProps) {
  const [at, setAt] = useState<{ page: Page | "mehr"; sub?: string }>({
    page: start,
    sub: subpage,
  });
  const [business, setBusiness] = useState("huber");
  const active = businesses.find((entry) => entry.value === business) ?? businesses[0];

  const item = (page: Page) => ({
    href: `#${page}`,
    current: at.page === page && !at.sub,
    open: at.page === page && Boolean(at.sub),
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      setAt({ page });
    },
    children: pages[page],
    sub: subpages[page] && (
      <>
        {subpages[page].map(({ name, icon }) => (
          <SidebarSubItem
            key={name}
            icon={icon}
            href={`#${name}`}
            current={at.page === page && at.sub === name}
            onClick={(event) => {
              event.preventDefault();
              setAt({ page, sub: name });
            }}
          >
            {name}
          </SidebarSubItem>
        ))}
      </>
    ),
  });

  return (
    <Sidebar aria-label="Hauptnavigation" {...props}>
      <SidebarHeader>
        {brand ? (
          <SidebarBrand href="#uebersicht" />
        ) : (
          <>
            <Menu>
              <MenuTrigger
                render={
                  <SidebarButton
                    menu
                    media={
                      <Avatar size="sm">
                        <AvatarFallback>{active?.initials}</AvatarFallback>
                      </Avatar>
                    }
                    className="font-medium text-fg"
                  />
                }
              >
                {active?.name}
              </MenuTrigger>
              <MenuContent className="min-w-56">
                <MenuGroup>
                  <MenuGroupLabel>Betriebe</MenuGroupLabel>
                  <MenuRadioGroup
                    value={business}
                    onValueChange={(value: string) => setBusiness(value)}
                  >
                    {businesses.map((entry) => (
                      <MenuRadioItem key={entry.value} value={entry.value}>
                        {entry.name}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuGroup>
                <MenuSeparator />
                <MenuItem>
                  <Icon icon={Add01Icon} size={16} className="text-fg-muted" />
                  Betrieb hinzufügen
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem icon={Home01Icon} {...item("uebersicht")} />
          <SidebarItem icon={InboxIcon} detail="3" {...item("posteingang")} />
        </SidebarGroup>
        <SidebarGroup title="Arbeit">
          <SidebarItem icon={NoteEditIcon} iconMotion="tilt" detail="12" {...item("angebote")} />
          <SidebarItem icon={Invoice01Icon} iconMotion="tilt" {...item("rechnungen")} />
          <SidebarItem icon={UserMultipleIcon} {...item("kunden")} />
          <SidebarItem icon={Calendar03Icon} {...item("termine")} />
          <SidebarMenu
            icon={MoreHorizontalIcon}
            current={at.page === "mehr"}
            defaultOpen={moreOpen}
            modal={!moreOpen}
            items={more.map(({ name, icon }) => (
              <MenuLinkItem
                key={name}
                href={`#${name}`}
                // The story has no router to take the reader away, so the menu closes itself.
                closeOnClick
                onClick={(event) => {
                  event.preventDefault();
                  setAt({ page: "mehr", sub: name });
                }}
              >
                <Icon icon={icon} size={16} className="text-fg-muted" />
                {name}
              </MenuLinkItem>
            ))}
          >
            Mehr
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup title="Verwaltung" collapsible={folds}>
          <SidebarItem icon={Analytics01Icon} {...item("auswertung")} />
          <SidebarItem icon={Settings01Icon} iconMotion="turn" {...item("einstellungen")} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Menu>
          <MenuTrigger
            render={
              <SidebarButton
                menu
                media={
                  <Avatar size="sm">
                    <AvatarFallback>MH</AvatarFallback>
                  </Avatar>
                }
              />
            }
          >
            Maria Huber
          </MenuTrigger>
          <MenuContent side="top" className="min-w-56">
            <MenuItem>
              <Icon icon={UserIcon} size={16} className="text-fg-muted" />
              Mein Profil
            </MenuItem>
            <MenuItem>
              <Icon icon={Notification01Icon} size={16} className="text-fg-muted" />
              Benachrichtigungen
            </MenuItem>
            <MenuSeparator />
            <MenuItem>
              <Icon icon={Logout01Icon} size={16} className="text-fg-muted" />
              Abmelden
            </MenuItem>
          </MenuContent>
        </Menu>
      </SidebarFooter>
    </Sidebar>
  );
}

/** The page beside the sidebar: enough of it to see that it is pushed, not covered. */
function Page({ children }: { children?: ReactNode }) {
  return (
    <AppShellPage>
      <AppShellBar>
        <SidebarTrigger />
        <Breadcrumbs label="Pfad">
          <BreadcrumbItem>
            <BreadcrumbPage>Angebote</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumbs>
      </AppShellBar>
      <AppShellMain className="flex flex-col gap-2">
        <PageHeader>
          <PageHeaderTitle>Angebote.</PageHeaderTitle>
          <PageHeaderDescription>
            Zwölf Angebote sind offen, drei davon laufen diese Woche ab.
          </PageHeaderDescription>
        </PageHeader>
        {children}
      </AppShellMain>
    </AppShellPage>
  );
}

const shell = { viewport: { width: 900, height: 560 }, clip: "viewport" } as const;

/**
 * The sidebar by itself, on the page „Angebote“, which has pages of its own under it. Press
 * another entry: the tint travels there while the subpages fold away, and „Einstellungen“
 * folds its own open, with a symbol before each subpage. Press a subpage: the tint comes down
 * to it. „Mehr“ opens a menu beside the sidebar; the workspace above and the person below each
 * open one too.
 *
 * The tint's travel is stepped by hand, which a frame strip cannot hold still: the strips show
 * the folding, and the travel is looked at in the running story.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "fold", click: 'a[href="#termine"]', frames: 8 },
        { name: "unfold", click: 'a[href="#einstellungen"]', frames: 8 },
        { name: "popout", click: '[data-slot="sidebar-menu"]', frames: 6 },
      ],
    },
  },
  render: (args) => <Entries {...args} />,
};

/** „Mehr“, open: the places that are needed now and then, each with its symbol. */
export const MenuOpen: Story = {
  render: (args) => <Entries {...args} moreOpen />,
};

/** Inside the shell, beside a page. The button in the bar, or ⌘B, collapses it to its rail. */
export const InShell: Story = {
  parameters: {
    visual: {
      ...shell,
      target: '[data-slot="sidebar-trigger"]',
      motion: [{ name: "collapse", click: '[data-slot="sidebar-trigger"]', frames: 10 }],
    },
  },
  render: (args) => (
    <AppShell>
      <Entries {...args} />
      <Page />
    </AppShell>
  ),
};

/**
 * Collapsed to the rail: the symbols stand where they stood, a hairline is left of each group's
 * name, and an entry names itself beside its symbol.
 */
export const Rail: Story = {
  parameters: {
    visual: {
      ...shell,
      target: '[data-slot="sidebar-item"]:not([aria-current])',
      motion: [
        { name: "expand", click: '[data-slot="sidebar-trigger"]', frames: 10 },
        { name: "name", hover: 'a[href="#kunden"]', frames: 6 },
      ],
    },
  },
  render: (args) => (
    <AppShell defaultSidebarOpen={false}>
      <Entries {...args} />
      <Page />
    </AppShell>
  ),
};

/** `collapse="hidden"`: collapsed, it leaves with its edge and the page has the whole window. */
export const Hidden: Story = {
  parameters: {
    visual: {
      ...shell,
      target: '[data-slot="sidebar-trigger"]',
      motion: [{ name: "leave", click: '[data-slot="sidebar-trigger"]', frames: 10 }],
    },
  },
  render: (args) => (
    <AppShell>
      <Entries {...args} collapse="hidden" />
      <Page />
    </AppShell>
  ),
};

/** A group that folds under its name. The tint goes with the entry it stands on. */
export const Folding: Story = {
  parameters: {
    visual: {
      motion: [{ name: "fold", click: 'button[data-slot="sidebar-group-title"]', frames: 8 }],
    },
  },
  render: (args) => <Entries {...args} start="auswertung" folds />,
};

/**
 * On a subpage, „Team“ under „Einstellungen“: the tint has come down to the subpage, and the
 * page above it stays in the text colour.
 */
export const Subpage: Story = {
  parameters: { visual: { target: '[data-slot="sidebar-sub-item"]:not([aria-current])' } },
  render: (args) => <Entries {...args} start="einstellungen" subpage="Team" />,
};

/** On a subpage, collapsed to the rail: the subpages are folded away, so their page wears the tint. */
export const RailSubpage: Story = {
  parameters: { visual: shell },
  render: (args) => (
    <AppShell defaultSidebarOpen={false}>
      <Entries {...args} start="einstellungen" subpage="Team" />
      <Page />
    </AppShell>
  ),
};

/**
 * The sidebar as a plate of its own beside the page: `bg-well` as its class. The page's ground
 * with a hairline is the default; both are in use.
 */
export const Plate: Story = {
  parameters: { visual: shell },
  render: (args) => (
    <AppShell>
      <Entries {...args} className="bg-well" />
      <Page />
    </AppShell>
  ),
};

/** Presses the trigger once the story stands, so the drawer shows in a still picture. */
function Opened({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')?.click();
  }, []);
  return <div ref={box}>{children}</div>;
}

const phone = { viewport: { width: 390, height: 700 }, clip: "viewport" } as const;

/** On a phone there is no room beside the page: the button opens the sidebar as a drawer. */
export const Phone: Story = {
  parameters: {
    visual: {
      ...phone,
      target: '[data-slot="sidebar-trigger"]',
      motion: [{ name: "open", click: '[data-slot="sidebar-trigger"]', frames: 10 }],
    },
  },
  render: (args) => (
    <AppShell>
      <Entries {...args} />
      <Page />
    </AppShell>
  ),
};

/** The drawer, open. It can be swiped back to the left, or closed by a press beside it. */
export const PhoneOpen: Story = {
  parameters: { visual: phone },
  render: (args) => (
    <Opened>
      <AppShell>
        <Entries {...args} />
        <Page />
      </AppShell>
    </Opened>
  ),
};

/**
 * The product's mark in the header. It starts where the entries' symbols start; collapse the
 * sidebar and the word gives its place to the symbol, which stands in the symbols' column.
 */
export const Brand: Story = {
  parameters: {
    visual: {
      ...shell,
      target: '[data-slot="sidebar-brand"]',
      motion: [{ name: "collapse", click: '[data-slot="sidebar-trigger"]', frames: 10 }],
    },
  },
  render: (args) => (
    <AppShell>
      <Entries {...args} brand />
      <Page />
    </AppShell>
  ),
};

/** On the rail: the symbol over the symbols, and the person below named beside the avatar. */
export const BrandRail: Story = {
  parameters: {
    visual: {
      ...shell,
      motion: [
        { name: "expand", click: '[data-slot="sidebar-trigger"]', frames: 10 },
        { name: "name", hover: '[data-slot="sidebar-button"]', frames: 6 },
      ],
    },
  },
  render: (args) => (
    <AppShell defaultSidebarOpen={false}>
      <Entries {...args} brand />
      <Page />
    </AppShell>
  ),
};

/**
 * In the comfortable density the rows are taller and their symbols start further in; the brand
 * follows, because its inset is the rows' own.
 */
export const BrandComfortable: Story = {
  parameters: { visual: shell },
  render: (args) => (
    <div data-density="comfortable" className="flex gap-6">
      <div className="flex h-[26rem] overflow-hidden rounded-xl border border-hairline">
        <Entries {...args} inline brand aria-label="Ausgeklappt" className="border-r-0" />
      </div>
      <div className="flex h-[26rem] overflow-hidden rounded-xl border border-hairline">
        <Entries {...args} inline collapsed brand aria-label="Eingeklappt" className="border-r-0" />
      </div>
    </div>
  ),
};

/**
 * As a test: the brand is one link with one name whatever the sidebar shows, and on the rail the
 * person's row names itself in a tooltip, which gives way once its menu is open.
 */
export const BrandAndRailNames: Story = {
  parameters: { visual: shell },
  render: (args) => (
    <AppShell defaultSidebarOpen={false}>
      <Entries {...args} brand />
      <Page />
    </AppShell>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole("link", { name: "Lanfermann" })).toHaveLength(1);
    await expect(canvas.queryAllByRole("img", { name: /Lanfermann/ })).toHaveLength(0);
    // Its name begins with the initials on the avatar.
    const person = canvas.getByRole("button", { name: /Maria Huber/ });
    const named = () => document.querySelector('[data-slot="tooltip-content"]');
    await userEvent.tab();
    await userEvent.tab();
    person.focus();
    await waitFor(() => expect(named()).toHaveTextContent("Maria Huber"));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("menu")).toBeVisible());
    await waitFor(() => expect(named()).toBeNull());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    // Under the pointer as well, once the keyboard has left the row.
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.hover(person);
    await waitFor(() => expect(named()).toHaveTextContent("Maria Huber"), { timeout: 3000 });
    await userEvent.unhover(person);
    await userEvent.keyboard("{Escape}");
  },
};

/**
 * A sidebar that is shown rather than used: on a design page, beside the app's own. `inline`
 * leaves the shell around it alone, so collapsing the real sidebar does not collapse the
 * specimen, and it is as tall as its place. `collapsed` shows the rail of the same specimen.
 */
export const Inline: Story = {
  parameters: { visual: { viewport: { width: 1100, height: 640 }, clip: "viewport" } },
  render: (args) => (
    <AppShell>
      <Entries {...args} />
      <Page>
        <div className="mt-4 flex items-stretch gap-4">
          <div className="flex h-[26rem] overflow-hidden rounded-xl border border-hairline">
            <Entries
              {...args}
              inline
              aria-label="Beispiel, ausgeklappt"
              start="rechnungen"
              className="border-r-0"
            />
          </div>
          <div className="flex h-[26rem] overflow-hidden rounded-xl border border-hairline">
            <Entries
              {...args}
              inline
              collapsed
              aria-label="Beispiel, eingeklappt"
              className="border-r-0"
            />
          </div>
        </div>
      </Page>
    </AppShell>
  ),
};

/** As a test: the shell's trigger collapses the app's sidebar and leaves the specimen as it is. */
export const InlineKeepsItsState: Story = {
  parameters: { visual: { viewport: { width: 1100, height: 640 } } },
  render: (args) => (
    <AppShell>
      <Entries {...args} />
      <Page>
        <div className="mt-4 flex h-[26rem]">
          <Entries {...args} inline aria-label="Beispiel" />
        </div>
      </Page>
    </AppShell>
  ),
  play: async ({ canvas, userEvent }) => {
    const [own, specimen] = Array.from(
      document.querySelectorAll<HTMLElement>('[data-slot="sidebar"]:not([data-drawer])'),
    );
    await expect(specimen).toHaveAttribute("data-inline");
    await expect(getComputedStyle(specimen!).position).toBe("relative");
    await userEvent.click(canvas.getByRole("button", { name: "Seitenleiste" }));
    await waitFor(() => expect(own).toHaveAttribute("data-state", "collapsed"));
    await expect(specimen).toHaveAttribute("data-state", "expanded");
    await expect(specimen).not.toHaveAttribute("id");
  },
};

/**
 * The keyboard path, as a test: Tab goes from entry to entry, the current page says so, Strg B
 * collapses the sidebar and an entry of the rail names itself when it takes the focus.
 */
export const Keyboard: Story = {
  parameters: { visual: shell },
  render: (args) => (
    <ShortcutProvider platform="other">
      <AppShell>
        <Entries {...args} />
        <Page />
      </AppShell>
    </ShortcutProvider>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const nav = canvas.getByRole("navigation", { name: "Hauptnavigation" });
    const trigger = canvas.getByRole("button", { name: "Seitenleiste" });
    const sidebar = nav.closest<HTMLElement>('[data-slot="sidebar"]');

    await step("the workspace opens its menu, and Escape gives the focus back", async () => {
      await userEvent.tab();
      const workspace = canvas.getByRole("button", { name: /Schreinerei Huber/ });
      await expect(workspace).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(screen.getByRole("menuitemradio", { name: "Schreinerei Huber" })).toHaveFocus(),
      );
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      await expect(workspace).toHaveFocus();
    });

    await step("Tab walks the entries in order, and the current page says so", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Übersicht" })).toHaveFocus();
      await userEvent.tab();
      await userEvent.tab();
      const current = canvas.getByRole("link", { name: /Angebote/ });
      await expect(current).toHaveFocus();
      await expect(current).toHaveAttribute("aria-current", "page");
    });

    await step("its subpages follow it, and one of them takes the page over", async () => {
      await userEvent.tab();
      const drafts = canvas.getByRole("link", { name: "Entwürfe" });
      await expect(drafts).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(drafts).toHaveAttribute("aria-current", "page");
      // The tint is the subpage's now; the page above only says that one is inside it.
      await expect(drafts).toHaveAttribute("data-current");
      const above = canvas.getByRole("link", { name: /Angebote/ });
      await expect(above).not.toHaveAttribute("aria-current");
      await expect(above).not.toHaveAttribute("data-current");
      await expect(above).toHaveAttribute("data-within");
    });

    await step(
      "Enter on another entry makes it current, and the subpages are out of reach",
      async () => {
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.keyboard("{Enter}");
        await expect(canvas.getByRole("link", { name: "Rechnungen" })).toHaveAttribute(
          "aria-current",
          "page",
        );
        // Folded away they stay in the page, unseen and out of the reach of the keyboard.
        await waitFor(() =>
          expect(canvas.queryByRole("link", { name: "Entwürfe" })).not.toBeInTheDocument(),
        );
      },
    );

    await step("Strg and B collapses the sidebar, and the button says so", async () => {
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await userEvent.keyboard("{Control>}b{/Control}");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    });

    await step("on the rail the entry that has the focus names itself", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Kunden" })).toHaveFocus();
      // The tooltip is a label for the eye: the link keeps its own name for assistive tech.
      await waitFor(() =>
        expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent("Kunden"),
      );
    });

    await step("the same keys bring it back", async () => {
      await userEvent.keyboard("{Control>}b{/Control}");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(sidebar).toHaveAttribute("data-state", "expanded");
    });

    await step("„Mehr“ opens its menu, and a place in it takes the page over", async () => {
      await userEvent.tab();
      await userEvent.tab();
      const moreEntry = canvas.getByRole("button", { name: "Mehr" });
      await expect(moreEntry).toHaveFocus();
      await expect(moreEntry).not.toHaveAttribute("aria-current");
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.getByRole("menuitem", { name: "Vorlagen" })).toHaveFocus());
      await userEvent.keyboard("{ArrowDown}");
      await expect(screen.getByRole("menuitem", { name: "Artikel" })).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      await expect(moreEntry).toHaveFocus();
      // Not a page itself: the current one is among what it holds.
      await expect(moreEntry).toHaveAttribute("aria-current", "true");
      await expect(canvas.getByRole("link", { name: "Rechnungen" })).not.toHaveAttribute(
        "aria-current",
      );
    });
  },
};
