import {
  AiIdeaIcon,
  CodeIcon,
  Hammer01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  News01Icon,
  SmartPhone01Icon,
  Store01Icon,
  WebDesign01Icon,
  WorkflowSquare03Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor } from "storybook/test";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

const meta = {
  title: "Components/NavigationMenu",
  component: NavigationMenu,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 900, height: 420 }, clip: "viewport" },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const services = [
  { href: "#websites", title: "Websites", text: "Für Betriebe, die gefunden werden wollen" },
  { href: "#apps", title: "Apps", text: "Für das Web und für iOS, vom Plan bis zum Start" },
  {
    href: "#programme",
    title: "Programme",
    text: "Für Angebote, Termine und alles, was sich wiederholt",
  },
  { href: "#beratung", title: "Beratung", text: "Wo KI im Betrieb Arbeit abnimmt und wo nicht" },
] as const;

const work = [
  { href: "#open-source", title: "Open Source", text: "Tools, deren Code öffentlich ist" },
  { href: "#artikel", title: "Artikel", text: "Wie sie entstanden sind, zum Nachlesen" },
] as const;

function Example({ open }: { open?: string }) {
  return (
    <div className="flex min-h-[420px] items-start p-6">
      <NavigationMenu aria-label="Hauptnavigation" defaultValue={open}>
        <NavigationMenuList>
          <NavigationMenuItem value="leistungen">
            <NavigationMenuTrigger>Leistungen</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[34rem] grid-cols-2">
                {services.map((page) => (
                  <li key={page.href}>
                    <NavigationMenuLink href={page.href}>
                      <NavigationMenuLinkTitle>{page.title}</NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription>{page.text}</NavigationMenuLinkDescription>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="arbeiten">
            <NavigationMenuTrigger>Arbeiten</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-72">
                {work.map((page) => (
                  <li key={page.href}>
                    <NavigationMenuLink href={page.href}>
                      <NavigationMenuLinkTitle>{page.title}</NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription>{page.text}</NavigationMenuLinkDescription>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink kind="entry" href="#preise">
              Preise
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink kind="entry" href="#ueber-mich">
              Über mich
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

/** A row of quiet entries. Two open a panel, two are plain links that look the same. */
export const Default: Story = {
  parameters: {
    visual: {
      viewport: { width: 900, height: 120 },
      target: '[data-slot="navigation-menu-trigger"]',
    },
  },
  render: () => <Example />,
};

/** A panel in two columns: each row a page, with one line that says what is there. */
export const Open: Story = {
  render: () => <Example open="leistungen" />,
};

/** A short panel takes the width of its list. The sheet is the same one, at another size. */
export const OpenList: Story = {
  render: () => <Example open="arbeiten" />,
};

const servicesWithSymbols = [
  { ...services[0], icon: WebDesign01Icon },
  { ...services[1], icon: SmartPhone01Icon },
  { ...services[2], icon: WorkflowSquare03Icon },
  { ...services[3], icon: AiIdeaIcon },
] as const;

const places = [
  { href: "#open-source", title: "Open Source", icon: CodeIcon },
  { href: "#artikel", title: "Artikel", icon: News01Icon },
  { href: "#kunden", title: "Kunden", icon: Store01Icon },
  { href: "#vortraege", title: "Vorträge", icon: Mortarboard01Icon },
  { href: "#werkzeuge", title: "Werkzeuge", icon: Hammer01Icon },
  { href: "#kontakt", title: "Kontakt", icon: Mail01Icon },
] as const;

function WithSymbols({ open }: { open: string }) {
  return (
    <div className="flex min-h-[460px] items-start p-6">
      <NavigationMenu aria-label="Hauptnavigation" defaultValue={open}>
        <NavigationMenuList>
          <NavigationMenuItem value="leistungen">
            <NavigationMenuTrigger>Leistungen</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-[26rem]">
                {servicesWithSymbols.map((page) => (
                  <li key={page.href}>
                    <NavigationMenuLink href={page.href} icon={page.icon}>
                      <NavigationMenuLinkTitle>{page.title}</NavigationMenuLinkTitle>
                      <NavigationMenuLinkDescription>{page.text}</NavigationMenuLinkDescription>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="arbeiten">
            <NavigationMenuTrigger>Arbeiten</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[26rem] grid-cols-2">
                {places.map((page) => (
                  <li key={page.href}>
                    <NavigationMenuLink href={page.href} icon={page.icon}>
                      <NavigationMenuLinkTitle>{page.title}</NavigationMenuLinkTitle>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink kind="entry" href="#preise">
              Preise
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

/** Pages with their symbols: each in a small tile before its title and line. */
export const WithIcons: Story = {
  parameters: { visual: { viewport: { width: 900, height: 460 } } },
  render: () => <WithSymbols open="leistungen" />,
};

/** Without a line under the titles, the tiles make a compact grid of places. */
export const IconGrid: Story = {
  parameters: { visual: { viewport: { width: 900, height: 340 } } },
  render: () => <WithSymbols open="arbeiten" />,
};

/**
 * The keyboard path, as a test: the row is walked with Tab, Enter opens an entry's panel, its
 * pages are links, and Escape closes it and returns the focus to the entry.
 */
export const Keyboard: Story = {
  render: () => <Example />,
  play: async ({ canvas, userEvent, step }) => {
    const entry = canvas.getByRole("button", { name: "Leistungen" });

    await step("Tab reaches the first entry", async () => {
      await userEvent.tab();
      await expect(entry).toHaveFocus();
    });

    await step("Enter opens its panel, and the pages are links", async () => {
      await userEvent.keyboard("{Enter}");
      const page = await screen.findByRole("link", { name: /Websites/ });
      await expect(page).toHaveAttribute("href", "#websites");
      await expect(entry).toHaveAttribute("aria-expanded", "true");
    });

    await step("Escape closes the panel and the entry keeps the focus", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("link", { name: /Websites/ })).not.toBeInTheDocument(),
      );
      await expect(entry).toHaveFocus();
    });

    await step("The plain links stand in the same row", async () => {
      await expect(canvas.getByRole("link", { name: "Preise" })).toHaveAttribute("href", "#preise");
    });
  },
};
