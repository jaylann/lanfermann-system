import {
  Analytics01Icon,
  Calendar03Icon,
  Home01Icon,
  InboxIcon,
  Invoice01Icon,
  NoteEditIcon,
  Settings01Icon,
  UnfoldMoreIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { expect, waitFor } from "storybook/test";

import {
  AppShell,
  AppShellBar,
  AppShellMain,
  AppShellPage,
} from "@/components/app-shell/app-shell";
import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { BreadcrumbItem, BreadcrumbPage, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Heading } from "@/components/heading/heading";
import { Icon } from "@/components/icon/icon";
import { ShortcutProvider } from "@/components/shortcut/shortcut";
import { Text } from "@/components/text/text";

import {
  Sidebar,
  SidebarButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
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
      viewport: { width: 300, height: 600 },
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

type EntriesProps = Partial<SidebarProps> & {
  /** The page the story opens on. */
  start?: Page;
  /** The subpage of „Einstellungen“ that is being worked on, if any. */
  subpage?: string;
  /** Whether the last group folds. */
  folds?: boolean;
};

/** The sidebar of a workshop's office: a few places, and the page one is on kept in state. */
function Entries({ start = "angebote", subpage, folds = false, ...props }: EntriesProps) {
  const [current, setCurrent] = useState<Page>(start);
  const item = (page: Page) => ({
    href: `#${page}`,
    current: current === page && !subpage,
    // The story has no router: the press only changes which page counts as current.
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      setCurrent(page);
    },
    children: pages[page],
  });
  return (
    <Sidebar aria-label="Hauptnavigation" {...props}>
      <SidebarHeader>
        <SidebarButton
          media={
            <Avatar size="sm">
              <AvatarFallback>SH</AvatarFallback>
            </Avatar>
          }
          detail={<Icon icon={UnfoldMoreIcon} size={14} />}
          className="font-medium text-fg"
        >
          Schreinerei Huber
        </SidebarButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem icon={Home01Icon} {...item("uebersicht")} />
          <SidebarItem icon={InboxIcon} detail="3" {...item("posteingang")} />
        </SidebarGroup>
        <SidebarGroup title="Arbeit">
          <SidebarItem icon={NoteEditIcon} detail="12" {...item("angebote")} />
          <SidebarItem icon={Invoice01Icon} {...item("rechnungen")} />
          <SidebarItem icon={UserMultipleIcon} {...item("kunden")} />
          <SidebarItem icon={Calendar03Icon} {...item("termine")} />
        </SidebarGroup>
        <SidebarGroup title="Verwaltung" collapsible={folds}>
          <SidebarItem icon={Analytics01Icon} {...item("auswertung")} />
          <SidebarItem
            icon={Settings01Icon}
            {...item("einstellungen")}
            open={Boolean(subpage)}
            sub={
              <>
                {["Betrieb", "Team", "Abrechnung"].map((name) => (
                  <SidebarSubItem key={name} href={`#${name}`} current={subpage === name}>
                    {name}
                  </SidebarSubItem>
                ))}
              </>
            }
          />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarButton
          media={
            <Avatar size="sm">
              <AvatarFallback>MH</AvatarFallback>
            </Avatar>
          }
        >
          Maria Huber
        </SidebarButton>
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
        <Heading level={1} size="section">
          Angebote.
        </Heading>
        <Text tone="muted">Zwölf Angebote sind offen, drei davon laufen diese Woche ab.</Text>
        {children}
      </AppShellMain>
    </AppShellPage>
  );
}

const shell = { viewport: { width: 900, height: 560 }, clip: "viewport" } as const;

/**
 * The sidebar by itself, on the page „Angebote“. Press another entry: the tint travels there.
 */
export const Default: Story = {
  parameters: {
    visual: {
      motion: [{ name: "travel", click: 'a[href="#termine"]', frames: 8 }],
    },
  },
  render: (args) => <Entries {...args} />,
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
 * On a subpage, „Team“ under „Einstellungen“: the subpage takes the hairline in the text
 * colour, and its parent stands open without the tint.
 */
export const Subpage: Story = {
  render: (args) => <Entries {...args} start="einstellungen" subpage="Team" />,
};

/** To compare: `travel={false}`, the tint changes its place at once. Nothing moves. */
export const Instant: Story = {
  render: (args) => <Entries {...args} travel={false} />,
};

/** To compare: the sidebar as a plate of its own (`bg-well`) instead of the page's ground. */
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

    await step("Tab walks the entries in order, after the workspace", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: /Schreinerei Huber/ })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Übersicht" })).toHaveFocus();
      await userEvent.tab();
      await userEvent.tab();
      const current = canvas.getByRole("link", { name: /Angebote/ });
      await expect(current).toHaveFocus();
      await expect(current).toHaveAttribute("aria-current", "page");
    });

    await step("Enter on another entry makes it the current one", async () => {
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("link", { name: "Rechnungen" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(canvas.getByRole("link", { name: /Angebote/ })).not.toHaveAttribute(
        "aria-current",
      );
    });

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
  },
};
