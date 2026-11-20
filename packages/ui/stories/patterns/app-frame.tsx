import {
  Add01Icon,
  Analytics01Icon,
  Home01Icon,
  Invoice01Icon,
  Logout01Icon,
  NoteEditIcon,
  Settings01Icon,
  UserIcon,
  UserMultipleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { type MouseEvent, type ReactNode, useState } from "react";

import {
  AppShell,
  AppShellBar,
  AppShellMain,
  AppShellPage,
} from "@/components/app-shell/app-shell";
import { Avatar, AvatarFallback } from "@/components/avatar/avatar";
import { BreadcrumbItem, BreadcrumbPage, Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { Icon, type IconSvgElement } from "@/components/icon/icon";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/menu/menu";
import {
  Sidebar,
  SidebarButton,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from "@/components/sidebar/sidebar";
import { Toaster } from "@/components/toast/toast";

type Place = { id: string; name: string; icon: IconSvgElement; detail?: string };

const work: Place[] = [
  { id: "uebersicht", name: "Übersicht", icon: Home01Icon },
  { id: "angebote", name: "Angebote", icon: NoteEditIcon, detail: "23" },
  { id: "rechnungen", name: "Rechnungen", icon: Invoice01Icon },
  { id: "auswertung", name: "Auswertung", icon: Analytics01Icon },
];
const office: Place[] = [
  { id: "team", name: "Team", icon: UserMultipleIcon },
  { id: "abrechnung", name: "Abrechnung", icon: Wallet01Icon },
  { id: "einstellungen", name: "Einstellungen", icon: Settings01Icon },
];

/**
 * The app around a pattern board: the sidebar of a workshop's account, the bar with the path,
 * and the page. Story code for `Patterns/Dashboard`, `Billing` and `Team`; not a template. The
 * board has no router: where one is is kept in state, so the sidebar answers a click.
 */
export function AppFrame({
  page,
  banner,
  children,
}: {
  /** The id of the page the board shows: `uebersicht`, `abrechnung`, `team`. */
  page: string;
  /** A notice for the whole page, under the bar across the page's column. */
  banner?: ReactNode;
  children: ReactNode;
}) {
  const [at, setAt] = useState(page);
  const all = [...work, ...office];
  const leads = (place: Place) => ({
    href: `#${place.id}`,
    current: at === place.id,
    onClick: (event: MouseEvent) => {
      event.preventDefault();
      setAt(place.id);
    },
  });

  return (
    <AppShell>
      <Sidebar aria-label="Hauptnavigation">
        <SidebarHeader>
          <Menu>
            <MenuTrigger
              render={
                <SidebarButton
                  menu
                  media={
                    <Avatar size="sm">
                      <AvatarFallback>SH</AvatarFallback>
                    </Avatar>
                  }
                  className="font-medium text-fg"
                />
              }
            >
              Schreinerei Huber
            </MenuTrigger>
            <MenuContent className="min-w-56">
              <MenuItem>
                <Icon icon={Add01Icon} size={16} className="text-fg-muted" />
                Betrieb hinzufügen
              </MenuItem>
            </MenuContent>
          </Menu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup title="Arbeit">
            {work.map((place) => (
              <SidebarItem key={place.id} icon={place.icon} detail={place.detail} {...leads(place)}>
                {place.name}
              </SidebarItem>
            ))}
          </SidebarGroup>
          <SidebarGroup title="Verwaltung">
            {office.map((place) => (
              <SidebarItem
                key={place.id}
                icon={place.icon}
                iconMotion={place.id === "einstellungen" ? "turn" : undefined}
                {...leads(place)}
              >
                {place.name}
              </SidebarItem>
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Menu>
            <MenuTrigger
              render={
                <SidebarButton
                  menu
                  media={
                    <Avatar size="sm" presence="online">
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
              <MenuSeparator />
              <MenuItem>
                <Icon icon={Logout01Icon} size={16} className="text-fg-muted" />
                Abmelden
              </MenuItem>
            </MenuContent>
          </Menu>
        </SidebarFooter>
      </Sidebar>

      <AppShellPage>
        <AppShellBar>
          <SidebarTrigger />
          <Breadcrumbs label="Pfad">
            <BreadcrumbItem>
              <BreadcrumbPage>{all.find((place) => place.id === at)?.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumbs>
        </AppShellBar>
        {banner}
        <AppShellMain className="flex flex-col gap-8">{children}</AppShellMain>
      </AppShellPage>
      <Toaster />
    </AppShell>
  );
}
