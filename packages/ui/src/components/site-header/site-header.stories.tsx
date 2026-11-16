import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, waitFor, within } from "storybook/test";

import { buttonVariants } from "@/components/button/button-variants";
import { Wordmark } from "@/components/logo/wordmark";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuLinkDescription,
  NavigationMenuLinkTitle,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/navigation-menu/navigation-menu";

import {
  SiteHeader,
  SiteHeaderActions,
  SiteHeaderBrand,
  SiteHeaderMenu,
  SiteHeaderMenuGroup,
  SiteHeaderMenuLink,
} from "./site-header";

const meta = {
  title: "Components/SiteHeader",
  component: SiteHeader,
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 200 }, clip: "viewport" },
  },
} satisfies Meta<typeof SiteHeader>;

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

const more = [
  { href: "#preise", title: "Preise" },
  { href: "#ueber-mich", title: "Über mich" },
] as const;

type ExampleProps = {
  /** Shows the row and the menu button together, whatever the window's width. */
  everything?: boolean;
  menuOpen?: boolean;
  panelOpen?: boolean;
};

function Example({ everything = false, menuOpen = false, panelOpen = false }: ExampleProps) {
  const brand = (
    <SiteHeaderBrand href="#start" aria-label="Lanfermann, zur Startseite">
      <Wordmark size={20} />
    </SiteHeaderBrand>
  );
  return (
    <div className={panelOpen ? "min-h-[340px]" : "min-h-[200px]"}>
      <SiteHeader>
        {brand}
        <NavigationMenu
          aria-label="Hauptnavigation"
          className={everything ? undefined : "max-lg:hidden"}
          defaultValue={panelOpen ? "leistungen" : undefined}
        >
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
            {more.map((page) => (
              <NavigationMenuItem key={page.href}>
                <NavigationMenuLink kind="entry" href={page.href}>
                  {page.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <SiteHeaderActions>
          <a href="#kontakt" className={buttonVariants({ variant: "primary" })}>
            Nachricht schreiben
          </a>
          <SiteHeaderMenu
            label="Menü öffnen"
            title="Alle Seiten."
            closeLabel="Menü schließen"
            brand={brand}
            actions={
              <>
                <a href="#kontakt" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Nachricht schreiben
                </a>
                <a href="#arbeiten" className={buttonVariants({ variant: "quiet", size: "lg" })}>
                  Arbeiten ansehen
                </a>
              </>
            }
            className={everything ? "lg:inline-flex" : undefined}
            defaultOpen={menuOpen}
            modal={menuOpen ? false : undefined}
          >
            <SiteHeaderMenuGroup title="Leistungen">
              {services.map((page) => (
                <SiteHeaderMenuLink
                  key={page.href}
                  href={page.href}
                  // The test follows a place; the address of the test page has to stay.
                  onClick={everything ? (event) => event.preventDefault() : undefined}
                >
                  {page.title}
                </SiteHeaderMenuLink>
              ))}
            </SiteHeaderMenuGroup>
            <SiteHeaderMenuGroup title="Lanfermann" columns={2}>
              {more.map((page) => (
                <SiteHeaderMenuLink key={page.href} href={page.href}>
                  {page.title}
                </SiteHeaderMenuLink>
              ))}
            </SiteHeaderMenuGroup>
          </SiteHeaderMenu>
        </SiteHeaderActions>
      </SiteHeader>
      <p className="mx-auto max-w-[76rem] px-5 pt-10 text-fg-muted sm:px-8">
        Die Seite beginnt unter der Leiste; was in ihr steht, steht auf der Kante des Inhalts.
      </p>
    </div>
  );
}

/** A frosted bar 8px off the window: the way home, a row of quiet entries, and the next step. */
export const Default: Story = {
  parameters: { visual: { target: '[data-slot="navigation-menu-trigger"]' } },
  render: () => <Example />,
};

/** An entry's panel: one sheet under the row, with the pages behind that entry. */
export const PanelOpen: Story = {
  parameters: { visual: { viewport: { width: 1290, height: 340 }, clip: "viewport" } },
  render: () => <Example panelOpen />,
};

/** The page passes under the bar: its face is frosted, its edge and shadow keep it apart. */
export const OverThePage: Story = {
  parameters: { visual: { viewport: { width: 1290, height: 200 }, clip: "viewport" } },
  render: () => (
    <div className="min-h-[200px]">
      <SiteHeader>
        <SiteHeaderBrand href="#start" aria-label="Lanfermann, zur Startseite">
          <Wordmark size={20} />
        </SiteHeaderBrand>
        <SiteHeaderActions>
          <a href="#kontakt" className={buttonVariants({ variant: "primary" })}>
            Nachricht schreiben
          </a>
        </SiteHeaderActions>
      </SiteHeader>
      <div className="mx-auto -mt-12 max-w-[76rem] px-8 text-3xl font-medium text-fg">
        Ein Absatz, der unter der Leiste durchläuft.
      </div>
    </div>
  ),
};

/** Below `lg` the row gives way to one button at the end of the bar. */
export const OnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 200 }, clip: "viewport" } },
  render: () => <Example />,
};

/**
 * The places over the whole window, on the page's ground: the bar's top row with the close
 * button where the menu button was, the groups, the next step at the foot. Following one closes it.
 */
export const MenuOpen: Story = {
  parameters: { visual: { viewport: { width: 390, height: 700 }, clip: "viewport" } },
  render: () => <Example menuOpen />,
};

/**
 * The keyboard path, as a test: the way home, the row, the next step, then the menu, which
 * opens as a sheet, keeps the focus and gives it back when a place is followed.
 */
export const Keyboard: Story = {
  render: () => <Example everything />,
  play: async ({ canvas, userEvent, step }) => {
    const nav = within(canvas.getByRole("navigation", { name: "Hauptnavigation" }));
    const trigger = canvas.getByRole("button", { name: "Menü öffnen" });

    await step("Tab goes from the way home along the row", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Lanfermann, zur Startseite" })).toHaveFocus();
      await userEvent.tab();
      await expect(nav.getByRole("button", { name: "Leistungen" })).toHaveFocus();
      for (const page of more) {
        await userEvent.tab();
        await expect(nav.getByRole("link", { name: page.title })).toHaveFocus();
      }
    });

    await step("Then the next step and the menu button", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("link", { name: "Nachricht schreiben" })).toHaveFocus();
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
    });

    await step("Enter opens the menu, which takes the focus", async () => {
      await userEvent.keyboard("{Enter}");
      const sheet = await screen.findByRole("dialog", { name: "Alle Seiten." });
      await waitFor(() => expect(sheet).toHaveFocus());
    });

    await step("Tab goes along its top row, then into the places", async () => {
      const sheet = within(screen.getByRole("dialog", { name: "Alle Seiten." }));
      await userEvent.tab();
      await expect(sheet.getByRole("link", { name: "Lanfermann, zur Startseite" })).toHaveFocus();
      await userEvent.tab();
      await expect(sheet.getByRole("button", { name: "Menü schließen" })).toHaveFocus();
      await userEvent.tab();
      await expect(sheet.getByRole("link", { name: "Websites" })).toHaveFocus();
    });

    await step("Following a place closes the sheet and returns the focus", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};
