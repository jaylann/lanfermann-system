import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import { Heading } from "@/components/heading/heading";
import { Input } from "@/components/input/input";
import { Link } from "@/components/link/link";
import { Separator } from "@/components/separator/separator";
import { Text } from "@/components/text/text";

import { Ground, type GroundProps } from "./ground";

const meta = {
  title: "Components/Ground",
  component: Ground,
  parameters: {
    layout: "padded",
    // Every ground here is named by its story, so it is drawn once. (A light brand's ground
    // rides on Paper, which turns dark with the page: in a dark page it wants the light scope.)
    visual: { viewport: { width: 1180, height: 760 }, grounds: ["paper"] },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

type Brand = Pick<GroundProps, "ground" | "background" | "foreground" | "accent"> & {
  name: string;
};

/** Colours a customer may bring: what their pages, their mails and their QR codes stand on. */
const BRANDS: Brand[] = [
  { name: "NeatPass, hell", ground: "paper", background: "#ffffff", foreground: "#0b2a6b" },
  { name: "NeatPass, dunkel", ground: "ink", background: "#0b2a6b", foreground: "#ffffff" },
  {
    name: "Bäckerei Kornprobst",
    ground: "paper",
    background: "#fbf3e4",
    foreground: "#3b2613",
    accent: "#a8451c",
  },
  {
    name: "Gärtnerei Weiß",
    ground: "ink",
    background: "#143d2b",
    foreground: "#f4efe1",
    accent: "#f2c14e",
  },
];

/**
 * What a surface has to carry: a title, body and muted text, a rule, a field with its label and
 * hint, the three keys and a link. Everything in it takes its colours from the ground alone.
 */
function Specimen({ name, id }: { name: string; id: string }) {
  return (
    <div className="flex h-full flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <Text size="sm" tone="muted">
          {name}
        </Text>
        <Heading level={2} size="sub">
          Ihr Termin ist bestätigt.
        </Heading>
        <Text>
          Wir sehen uns am Donnerstag, 3. Dezember, um 14:30 Uhr. Bringen Sie bitte die Maße der
          Küche mit.
        </Text>
        <Text size="sm" tone="muted">
          Absagen können Sie bis 24 Stunden vorher, ohne Kosten.
        </Text>
      </div>
      <Separator />
      <Field>
        <FieldLabel>E-Mail für die Erinnerung</FieldLabel>
        <Input id={`${id}-mail`} defaultValue="maria@schreinerei-huber.de" />
        <FieldDescription>Wir schreiben einmal, am Tag davor.</FieldDescription>
      </Field>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Button variant="primary">Zum Kalender</Button>
        <Button>Verschieben</Button>
        <Button variant="quiet">Absagen</Button>
        <Link href={`#${id}-anfahrt`} className="ml-auto">
          Anfahrt
        </Link>
      </div>
    </div>
  );
}

const slug = (name: string) => name.toLowerCase().replaceAll(/[^a-z]+/g, "-");

/**
 * Four grounds in colours of their own, each from a background and a foreground (two of them
 * with an accent): text, lines, washes, surfaces and the focus ring are derived, the same way on
 * a light pair and a dark one.
 */
export const Custom: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {BRANDS.map(({ name, ...brand }) => (
        <Ground key={name} {...brand} className="rounded-xl">
          <Specimen name={name} id={slug(name)} />
        </Ground>
      ))}
    </div>
  ),
};

/**
 * The kit's own Paper and Ink beside the same two colours handed in as a custom ground: what is
 * derived should stand close to what was drawn by hand.
 */
export const BesideTheKit: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Ground ground="paper" className="rounded-xl">
        <Specimen name="Paper, wie gezeichnet" id="paper" />
      </Ground>
      <Ground ground="paper" background="#fbfbfd" foreground="#13121c" className="rounded-xl">
        <Specimen name="Paper, aus zwei Farben" id="paper-custom" />
      </Ground>
      <Ground ground="ink" className="rounded-xl">
        <Specimen name="Ink, wie gezeichnet" id="ink" />
      </Ground>
      <Ground ground="ink" background="#13121c" foreground="#fbfbfd" className="rounded-xl">
        <Specimen name="Ink, aus zwei Farben" id="ink-custom" />
      </Ground>
    </div>
  ),
};

/** A preview as an app shows it: the customer's page on their own ground, inside the app's. */
export const Preview: Story = {
  parameters: { visual: { viewport: { width: 560, height: 520 } } },
  render: () => (
    <div className="flex flex-col gap-3">
      <Text size="sm" tone="muted">
        Vorschau der Bestätigungsseite
      </Text>
      <Ground
        ground="paper"
        background="#fbf3e4"
        foreground="#3b2613"
        accent="#a8451c"
        className="rounded-xl"
      >
        <Specimen name="Bäckerei Kornprobst" id="vorschau" />
      </Ground>
    </div>
  ),
};

/**
 * As a test: the region wears the colours it was given, what is derived follows them, the focus
 * ring is the accent, and a kit ground nested inside is itself again.
 */
export const CustomColours: Story = {
  render: () => (
    <Ground
      ground="ink"
      background="#143d2b"
      foreground="#f4efe1"
      accent="#f2c14e"
      data-testid="custom"
      className="flex flex-col gap-4 rounded-xl p-6"
    >
      <Text data-testid="body">Text auf dem eigenen Grund.</Text>
      <Text tone="muted" data-testid="muted">
        Leiser Text.
      </Text>
      <Button data-testid="key" variant="quiet">
        Taste
      </Button>
      <Ground ground="paper" data-testid="nested" className="rounded-md p-3">
        <Text data-testid="nested-text">Wieder Paper.</Text>
      </Ground>
    </Ground>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const colour = (element: HTMLElement, property: string) =>
      getComputedStyle(element).getPropertyValue(property);
    const ground = canvas.getByTestId("custom");

    await step("the region is painted in the colours it was given", async () => {
      await expect(colour(ground, "background-color")).toBe("rgb(20, 61, 43)");
      await expect(colour(ground, "--lf-text")).toBe("#f4efe1");
      await expect(colour(ground, "--lf-accent")).toBe("#f2c14e");
    });

    await step("muted text is mixed from the two, between them", async () => {
      const muted = colour(canvas.getByTestId("muted"), "color");
      await expect(muted).not.toBe(colour(ground, "background-color"));
      await expect(muted).not.toBe("rgb(244, 239, 225)");
      await expect(muted).toMatch(/^(oklab|color|rgb)\(/);
    });

    await step("the focus ring is the brand's accent", async () => {
      await userEvent.tab();
      const key = canvas.getByTestId("key");
      await expect(key).toHaveFocus();
      await expect(colour(key, "outline-color")).toBe("rgb(242, 193, 78)");
    });

    await step("a kit ground inside is itself again", async () => {
      await expect(colour(canvas.getByTestId("nested"), "background-color")).toBe(
        "rgb(251, 251, 253)",
      );
    });
  },
};
