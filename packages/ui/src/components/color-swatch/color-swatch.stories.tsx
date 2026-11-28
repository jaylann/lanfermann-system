import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { Button } from "@/components/button/button";
import { Radio, RadioGroup } from "@/components/radio/radio";
import { LocaleProvider } from "@/locale/locale";

import { ColorSwatch, ColorSwatchGroup, type ColorSwatchGroupProps } from "./color-swatch";

const meta = {
  title: "Components/ColorSwatch",
  component: ColorSwatchGroup,
  parameters: {
    visual: {
      viewport: { width: 380, height: 120 },
      target: '[data-slot="color-swatch"]:not([data-checked])',
      motion: [
        { name: "choose", click: '[data-slot="color-swatch"]:nth-of-type(4)', frames: 8 },
        { name: "hover", hover: '[data-slot="color-swatch"]:nth-of-type(3)', frames: 6 },
      ],
    },
  },
} satisfies Meta<typeof ColorSwatchGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The colours a code can be printed in: from white, which needs its edge, to black. */
const palette = [
  { color: "#13121c", label: "Tinte" },
  { color: "#5b4fcf", label: "Indigo" },
  { color: "#0f6e6e", label: "Petrol" },
  { color: "#9c1f3d", label: "Weinrot" },
  { color: "#2f6b3c", label: "Waldgrün" },
  { color: "#f2c230", label: "Senfgelb" },
  { color: "#ffffff", label: "Weiß" },
  { color: "#000000", label: "Schwarz" },
];

function Palette(props: ColorSwatchGroupProps) {
  return (
    <ColorSwatchGroup aria-label="Farbe des Codes" defaultValue="#5b4fcf" {...props}>
      {palette.map((entry) => (
        <ColorSwatch key={entry.color} color={entry.color} label={entry.label} />
      ))}
    </ColorSwatchGroup>
  );
}

/**
 * One colour out of a palette. Each disc lies flat in a socket ring; the chosen one fills it,
 * rises into a fitting of its own colour and carries a tick, dark on a light colour and white
 * on a dark one.
 */
export const Default: Story = { render: (args) => <Palette {...args} /> };

/** Chosen: a light colour, so the tick is dark, and white, which keeps its edge on Paper. */
export const LightChosen: Story = {
  parameters: { visual: { motion: [] } },
  render: (args) => <Palette {...args} defaultValue="#ffffff" />,
};

/**
 * Beside a `Radio` and a `Button`: the ones that are not chosen lie in their sockets as a
 * radio's empty socket does, and only the chosen one stands raised like the key.
 */
export const BesideControls: Story = {
  parameters: {
    visual: {
      viewport: { width: 640, height: 110 },
      motion: [{ name: "choose", click: '[data-slot="color-swatch"]:nth-of-type(4)', frames: 8 }],
    },
  },
  render: () => (
    <div className="flex items-center gap-6">
      <Palette />
      <RadioGroup defaultValue="svg" aria-label="Format" className="flex-row items-center gap-4">
        <label className="flex items-center gap-2 text-control text-fg-body">
          <Radio value="svg" />
          SVG
        </label>
        <label className="flex items-center gap-2 text-control text-fg-body">
          <Radio value="png" />
          PNG
        </label>
      </RadioGroup>
      <Button>Herunterladen</Button>
    </div>
  ),
};

/** Small, medium and large follow the density, as every control does. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 440, height: 220 }, motion: [] } },
  render: (args) => (
    <div className="flex flex-col gap-5">
      <Palette {...args} size="sm" aria-label="Farbe des Codes, klein" />
      <Palette {...args} size="md" aria-label="Farbe des Codes, mittel" />
      <Palette {...args} size="lg" aria-label="Farbe des Codes, groß" />
    </div>
  ),
};

/** Disabled, a swatch lies flat and small in its ring and keeps its colour: that is content. */
export const Disabled: Story = {
  parameters: { visual: { motion: [] } },
  render: (args) => <Palette {...args} disabled />,
};

/**
 * Colours of the system, given as custom properties. They change with the ground, so the tick
 * is derived by the browser; `tone` says it where the colour is known.
 */
export const CustomProperties: Story = {
  parameters: { visual: { motion: [] } },
  render: (args) => (
    <ColorSwatchGroup aria-label="Farbe der Linie" defaultValue="accent" {...args}>
      <ColorSwatch value="accent" color="var(--color-accent)" label="Akzent" />
      <ColorSwatch value="text" color="var(--color-fg)" label="Text" />
      <ColorSwatch value="success" color="var(--color-success-solid)" label="Erfolg" />
      <ColorSwatch value="warning" color="var(--color-warning-solid)" label="Warnung" />
      <ColorSwatch value="danger" color="var(--color-danger-solid)" label="Gefahr" tone="dark" />
      <ColorSwatch value="ground" color="var(--color-ground)" label="Grund" />
    </ColorSwatchGroup>
  ),
};

/** Every chosen state at once, for the tick on each colour. */
export const Ticks: Story = {
  parameters: { visual: { viewport: { width: 380, height: 160 }, motion: [] } },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {palette.map((entry) => (
        <ColorSwatchGroup key={entry.color} aria-label={entry.label} defaultValue={entry.color}>
          <ColorSwatch color={entry.color} label={entry.label} />
        </ColorSwatchGroup>
      ))}
    </div>
  ),
};

/** On a phone the swatches keep their size, stand further apart and wrap. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 160 }, motion: [] } },
  render: (args) => (
    <div className="w-56">
      <Palette {...args} />
    </div>
  ),
};

/** What the group reports in the test below. */
const changed = fn();

function Reported() {
  const [value, setValue] = useState("#5b4fcf");
  return (
    <form className="flex flex-col gap-3">
      <Palette
        name="farbe"
        value={value}
        onValueChange={(next) => {
          changed(next);
          setValue(next);
        }}
      />
      <p className="text-sm text-fg-muted">
        Wert: <span data-testid="value">{value}</span>
      </p>
    </form>
  );
}

/**
 * The keyboard path, as a test: the group is one stop, the arrow keys move the choice and wrap,
 * each swatch is named by its colour's name, and a form receives the chosen value.
 */
export const Keyboard: Story = {
  render: () => <Reported />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    changed.mockClear();
    const swatch = (name: string) => canvas.getByRole("radio", { name });

    await step("the palette is a named radio group of named colours", async () => {
      await expect(canvas.getByRole("radiogroup", { name: "Farbe des Codes" })).toBeVisible();
      await expect(canvas.getAllByRole("radio")).toHaveLength(8);
      await expect(swatch("Indigo")).toBeChecked();
    });

    await step("Tab lands on the chosen swatch, the arrows move the choice", async () => {
      await userEvent.tab();
      await expect(swatch("Indigo")).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(swatch("Petrol")).toHaveFocus();
      await expect(swatch("Petrol")).toBeChecked();
      await expect(swatch("Indigo")).not.toBeChecked();
      await expect(changed).toHaveBeenLastCalledWith("#0f6e6e");
    });

    await step("the arrows wrap around the ends", async () => {
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
      await expect(swatch("Schwarz")).toBeChecked();
      await expect(canvas.getByTestId("value")).toHaveTextContent("#000000");
    });

    await step("a form receives the chosen colour under the group's name", async () => {
      const form = canvasElement.querySelector("form");
      await expect(form).not.toBeNull();
      if (form) await expect(new FormData(form).get("farbe")).toBe("#000000");
    });

    await step("a press chooses as well", async () => {
      await userEvent.click(swatch("Weiß"));
      await expect(swatch("Weiß")).toBeChecked();
      await expect(changed).toHaveBeenLastCalledWith("#ffffff");
    });
  },
};

/** Without a name of its own the group takes one from the locale table. */
export const KeyboardEnglish: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <ColorSwatchGroup defaultValue="#5b4fcf">
        <ColorSwatch color="#5b4fcf" label="Indigo" />
        <ColorSwatch color="#13121c" label="Ink" />
      </ColorSwatchGroup>
    </LocaleProvider>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("radiogroup", { name: "Color" })).toBeVisible();
  },
};
