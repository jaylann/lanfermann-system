import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/accordion/accordion";
import { buttonVariants } from "@/components/button/button-variants";
import { Container } from "@/components/container/container";
import { Ground } from "@/components/ground/ground";
import { Heading } from "@/components/heading/heading";
import { linkVariants } from "@/components/link/link-variants";
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
import { Section } from "@/components/section/section";
import { Separator } from "@/components/separator/separator";
import {
  SiteFooter,
  SiteFooterBrand,
  SiteFooterGroup,
  SiteFooterLegal,
  SiteFooterLink,
  SiteFooterMain,
  SiteFooterNav,
} from "@/components/site-footer/site-footer";
import {
  SiteHeader,
  SiteHeaderActions,
  SiteHeaderBrand,
  SiteHeaderMenu,
  SiteHeaderMenuGroup,
  SiteHeaderMenuLink,
} from "@/components/site-header/site-header";
import { Text } from "@/components/text/text";
import { cn } from "@/lib/cn";

const meta = {
  title: "Patterns/Site",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 1290, height: 2000 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const parts = [
  { href: "#ablauf", title: "Ablauf", text: "Drei Schritte, in dieser Reihenfolge" },
  { href: "#qualitaet", title: "Qualität", text: "Was ein Knopf können muss" },
  { href: "#preis", title: "Preis", text: "Ein fester Preis und ein Liefertermin" },
] as const;

// How this page opens itself and each of its parts: a title, a lead and the next step, set
// left, the title at lines of about 44rem and the lead shorter. Another page does it its way.
const opening = "flex flex-col items-start gap-4";
const titleMeasure = "max-w-[44rem]";
const leadMeasure = "max-w-[34rem] text-pretty";
const nextStep = "flex flex-wrap items-center gap-x-5 gap-y-3 pt-2";

function Page() {
  const brand = (
    <SiteHeaderBrand href="#start" aria-label="Lanfermann, zur Startseite">
      <Wordmark size={20} />
    </SiteHeaderBrand>
  );
  return (
    <>
      <SiteHeader>
        {brand}
        <NavigationMenu aria-label="Hauptnavigation" className="max-lg:hidden">
          <NavigationMenuList>
            <NavigationMenuItem value="zusammenarbeit">
              <NavigationMenuTrigger>Zusammenarbeit</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-80">
                  {parts.map((part) => (
                    <li key={part.href}>
                      <NavigationMenuLink href={part.href}>
                        <NavigationMenuLinkTitle>{part.title}</NavigationMenuLinkTitle>
                        <NavigationMenuLinkDescription>{part.text}</NavigationMenuLinkDescription>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink kind="entry" href="#arbeiten">
                Arbeiten
              </NavigationMenuLink>
            </NavigationMenuItem>
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
              <a href="#kontakt" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Nachricht schreiben
              </a>
            }
          >
            <SiteHeaderMenuGroup title="Zusammenarbeit">
              {parts.map((part) => (
                <SiteHeaderMenuLink key={part.href} href={part.href}>
                  {part.title}
                </SiteHeaderMenuLink>
              ))}
            </SiteHeaderMenuGroup>
          </SiteHeaderMenu>
        </SiteHeaderActions>
      </SiteHeader>

      <main id="start">
        <Section aria-labelledby="titel" className="pt-12 sm:pt-20">
          <Container className={opening}>
            <Heading id="titel" level={1} size="display" className={titleMeasure}>
              Ein Produkt, das am Tag des Starts ruhig läuft.
            </Heading>
            <Text size="lg" className={leadMeasure}>
              Es entsteht für das Web und für iOS, vom Plan bis zum Start. Ich arbeite allein. Das
              spart Besprechungen.
            </Text>
            <div className={nextStep}>
              <a href="#kontakt" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Gespräch ausmachen
              </a>
              <a href="#ablauf" className={linkVariants()}>
                Ablauf ansehen
              </a>
            </div>
          </Container>
        </Section>

        <Section id="ablauf" space="md" aria-labelledby="ablauf-titel">
          <Container className={opening}>
            <Separator variant="rule" className="mb-2" />
            <Heading id="ablauf-titel" size="title" className={titleMeasure}>
              Drei Schritte, in dieser Reihenfolge.
            </Heading>
            <Text size="lg" className={leadMeasure}>
              Du erzählst mir, was du vorhast. Ich nenne dir einen festen Preis und den Tag, an dem
              ich liefere. Erst dann baue ich.
            </Text>
          </Container>
        </Section>

        <Section id="qualitaet" space="md" aria-labelledby="qualitaet-titel">
          <Container className={opening}>
            <Separator variant="rule" className="mb-2" />
            <Heading id="qualitaet-titel" size="title" className={titleMeasure}>
              Ein Knopf antwortet sofort.
            </Heading>
            <Text size="lg" className={leadMeasure}>
              Du drückst, und er gibt im selben Moment nach. Du lässt los, und er kommt zurück. Wenn
              das alles stimmt, bemerkt ihn niemand. Das meine ich mit Qualität.
            </Text>
          </Container>
        </Section>

        <Section id="preis" space="md" aria-labelledby="preis-titel">
          <Container className="flex flex-col gap-6">
            <div className={opening}>
              <Separator variant="rule" className="mb-2" />
              <Heading id="preis-titel" size="title" className={titleMeasure}>
                Was es kostet.
              </Heading>
            </div>
            <Accordion defaultValue={["preis"]} className="max-w-[48rem]">
              <AccordionItem value="preis">
                <AccordionTrigger>Was kostet die Entwicklung?</AccordionTrigger>
                <AccordionPanel>
                  Pakete gibt es nicht. Du bekommst einen festen Preis und einen Liefertermin.
                  Beides steht, bevor ich anfange.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem value="start">
                <AccordionTrigger>
                  Soll ich mit einer App anfangen oder mit einer Website?
                </AccordionTrigger>
                <AccordionPanel>
                  Ich würde mit der Website anfangen. Sie kann alles, was du für den Start brauchst,
                  und kostet etwa ein Drittel so viel wie die App. Die App kann später folgen.
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Container>
        </Section>

        {/* The one ask of the page, on Indigo: a block of its own, above the floor. */}
        <Section id="kontakt" space="md" aria-labelledby="frage">
          <Container>
            <Ground ground="indigo" className={cn("rounded-2xl p-8 sm:p-12", opening)}>
              <Heading id="frage" size="title" className={titleMeasure}>
                Erzähl mir von deinem Produkt.
              </Heading>
              <Text size="lg" className={leadMeasure}>
                Das erste Gespräch kostet nichts. Ich antworte innerhalb von zwei Werktagen und sage
                dir auch, wenn es nicht passt.
              </Text>
              <div className={nextStep}>
                <a
                  href="mailto:justin@lanfermann.dev"
                  className={buttonVariants({ variant: "primary", size: "lg" })}
                >
                  Nachricht schreiben
                </a>
              </div>
            </Ground>
          </Container>
        </Section>
      </main>

      <SiteFooter>
        <SiteFooterMain>
          <SiteFooterBrand>
            <Wordmark size={24} />
            <p>
              Websites, Apps für das Web und für iOS, Programme für Angebote und Terminbuchungen,
              von München aus.
            </p>
          </SiteFooterBrand>
          <SiteFooterNav aria-label="Weitere Seiten">
            <SiteFooterGroup title="Zusammenarbeit">
              {parts.map((part) => (
                <SiteFooterLink key={part.href} href={part.href}>
                  {part.title}
                </SiteFooterLink>
              ))}
            </SiteFooterGroup>
            <SiteFooterGroup title="Lanfermann">
              <SiteFooterLink href="#arbeiten">Arbeiten</SiteFooterLink>
              <SiteFooterLink href="#ueber-mich">Über mich</SiteFooterLink>
            </SiteFooterGroup>
            <SiteFooterGroup title="Rechtliches">
              <SiteFooterLink href="#impressum">Impressum</SiteFooterLink>
              <SiteFooterLink href="#datenschutz">Datenschutz</SiteFooterLink>
            </SiteFooterGroup>
          </SiteFooterNav>
        </SiteFooterMain>
        <SiteFooterLegal>
          <p className="flex flex-wrap justify-between gap-x-8 gap-y-1">
            <span>Justin Lanfermann · Websites, Apps und Programme</span>
            <span>© 2026 Justin Lanfermann, München</span>
          </p>
        </SiteFooterLegal>
      </SiteFooter>
    </>
  );
}

/**
 * A test page, not a template: every site is laid out for itself. It is the one place where the
 * site parts stand together (the bar with its navigation menu, an opening, sections under rules,
 * an ask on Indigo, the quiet floor), so a change to one of them is judged here and its picture
 * is compared with the last one.
 */
export const WholePage: Story = {
  render: () => <Page />,
};
