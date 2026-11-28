import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { ColorSwatch, ColorSwatchGroup } from "@/components/color-swatch/color-swatch";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { LocaleProvider } from "@/locale/locale";

import { ColorField } from "./color-field";

const meta = {
  title: "Components/ColorField",
  component: ColorField,
  args: { "aria-label": "Farbe des Codes", className: "w-44" },
  parameters: {
    visual: {
      viewport: { width: 320, height: 120 },
      target: '[data-slot="input-group"]',
    },
  },
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A colour of one's own. The swatch in front shows what the digits mean. */
export const Default: Story = { args: { defaultValue: "#5b4fcf" } };

/**
 * Empty, the swatch is an open socket and the placeholder gives an example. The colour comes
 * into the swatch with the sixth digit.
 */
export const Empty: Story = {
  parameters: {
    visual: {
      motion: [
        { name: "type", click: '[data-slot="color-field-input"]', type: "#0f6e6e", frames: 6 },
      ],
    },
  },
};

/**
 * Text that is no colour stays to be corrected. The swatch keeps the last colour that was one,
 * and the reason is said in words.
 */
export const Invalid: Story = {
  parameters: { visual: { viewport: { width: 420, height: 170 } } },
  render: (args) => (
    <Field invalid className="w-72">
      <FieldLabel>Farbe des Codes</FieldLabel>
      <ColorField {...args} aria-label={undefined} className="w-44" defaultValue="#5b4fcf" />
      <FieldError match>
        Bitte geben Sie eine Farbe als Hex-Wert ein, zum Beispiel #5b4fcf.
      </FieldError>
    </Field>
  ),
};

/** Against a background: the line says the ratio and that text reads on it. */
export const WithContrast: Story = {
  args: { defaultValue: "#5b4fcf", contrastWith: "#ffffff", className: "w-64" },
  parameters: { visual: { viewport: { width: 360, height: 140 } } },
};

/** Too little contrast is said in words and with the warning's symbol, not by colour alone. */
export const ContrastTooLow: Story = {
  args: { defaultValue: "#f2c230", contrastWith: "#ffffff", className: "w-64" },
  parameters: { visual: { viewport: { width: 360, height: 140 } } },
};

export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 320, height: 220 } } },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <ColorField {...args} size="sm" defaultValue="#0f6e6e" aria-label="Farbe, klein" />
      <ColorField {...args} size="md" defaultValue="#5b4fcf" aria-label="Farbe, mittel" />
      <ColorField {...args} size="lg" defaultValue="#9c1f3d" aria-label="Farbe, groß" />
    </div>
  ),
};

export const Disabled: Story = { args: { defaultValue: "#5b4fcf", disabled: true } };

/** In a `Field`: the label says what is coloured, the line below how it reads. */
export const InField: Story = {
  parameters: { visual: { viewport: { width: 400, height: 190 } } },
  render: (args) => (
    <Field className="w-72">
      <FieldLabel>Farbe des Codes</FieldLabel>
      <ColorField
        {...args}
        aria-label={undefined}
        className="w-full"
        defaultValue="#13121c"
        contrastWith="#ffffff"
      />
      <FieldError />
      <FieldDescription>Dunkle Farben liest jede Kamera.</FieldDescription>
    </Field>
  ),
};

const palette = [
  { color: "#13121c", label: "Tinte" },
  { color: "#5b4fcf", label: "Indigo" },
  { color: "#0f6e6e", label: "Petrol" },
  { color: "#9c1f3d", label: "Weinrot" },
  { color: "#2f6b3c", label: "Waldgrün" },
  { color: "#f2c230", label: "Senfgelb" },
];

/**
 * The two parts as a code's foreground is chosen: a palette, or a colour of one's own. A typed
 * colour that is in the palette chooses its swatch; any other leaves the palette without a tick.
 */
function Foreground() {
  const [color, setColor] = useState("#5b4fcf");
  return (
    <div className="flex w-72 flex-col gap-3">
      <span id="vordergrund" className="text-control leading-5 font-medium text-fg">
        Farbe des Codes
      </span>
      <ColorSwatchGroup aria-labelledby="vordergrund" value={color} onValueChange={setColor}>
        {palette.map((entry) => (
          <ColorSwatch key={entry.color} color={entry.color} label={entry.label} />
        ))}
      </ColorSwatchGroup>
      <Field>
        <FieldLabel className="text-sm font-normal text-fg-muted">Oder eine eigene</FieldLabel>
        <ColorField
          value={color}
          onValueChange={(next) => {
            // An unreadable text reports nothing; the code keeps its last colour meanwhile.
            if (next !== "") setColor(next);
          }}
          contrastWith="#ffffff"
        />
        <FieldError />
      </Field>
    </div>
  );
}

export const WithSwatches: Story = {
  parameters: {
    visual: {
      viewport: { width: 400, height: 240 },
      target: '[data-slot="color-swatch"]:not([data-checked])',
      motion: [{ name: "pick", click: '[data-slot="color-swatch"]:nth-of-type(6)', frames: 8 }],
    },
  },
  render: () => <Foreground />,
};

/** On a phone the text is 16px, so iOS does not zoom, and the two parts keep one column. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 260 } } },
  render: () => <Foreground />,
};

function Reported() {
  const [value, setValue] = useState("#5b4fcf");
  return (
    <Field className="w-72">
      <FieldLabel>Farbe des Codes</FieldLabel>
      <ColorField value={value} onValueChange={setValue} contrastWith="#ffffff" />
      <FieldError />
      <FieldDescription>
        Wert: <span data-testid="value">{value === "" ? "leer" : value}</span>
      </FieldDescription>
    </Field>
  );
}

/**
 * As a test: a whole colour is reported while it is typed; a short one is read and written out
 * when the field is left; text that is no colour is flagged, explained and reported as empty,
 * and the swatch keeps the last colour.
 */
export const Keyboard: Story = {
  render: () => <Reported />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const input = canvas.getByLabelText("Farbe des Codes");
    const value = canvas.getByTestId("value");
    const swatch = () =>
      canvasElement
        .querySelector<HTMLElement>('[data-slot="color-field-swatch"]')
        ?.style.getPropertyValue("--swatch");
    const contrast = () => canvasElement.querySelector('[data-slot="color-field-contrast"]');

    await step("the colour stands in the field with its contrast", async () => {
      await expect(input).toHaveValue("#5b4fcf");
      await expect(swatch()).toBe("#5b4fcf");
      await expect(contrast()).toHaveTextContent("Kontrast 6,0 : 1, reicht für Text");
    });

    await step("a whole colour counts with its sixth digit, as typed", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "#F2C230");
      await expect(value).toHaveTextContent("#f2c230");
      await expect(input).toHaveValue("#F2C230");
      await expect(swatch()).toBe("#f2c230");
      await expect(contrast()).toHaveTextContent("Kontrast 1,6 : 1, zu wenig für Text");
    });

    await step("leaving the field writes it in lower case", async () => {
      await userEvent.tab();
      await expect(input).toHaveValue("#f2c230");
    });

    await step("three digits without # are read when typing ends", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "0AF");
      await expect(value).toHaveTextContent("#f2c230");
      await userEvent.keyboard("{Enter}");
      await expect(input).toHaveValue("#00aaff");
      await expect(value).toHaveTextContent("#00aaff");
    });

    await step("text that is no colour is flagged and explained; the swatch stays", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "blau{Enter}");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveValue("blau");
      await expect(value).toHaveTextContent("leer");
      await expect(swatch()).toBe("#00aaff");
      await waitFor(() =>
        expect(canvas.getByText(/Bitte geben Sie eine Farbe als Hex-Wert ein/)).toBeVisible(),
      );
    });

    await step("a colour takes the error away again", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "13121c");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(value).toHaveTextContent("#13121c");
      await waitFor(() =>
        expect(canvas.queryByText(/Bitte geben Sie eine Farbe/)).not.toBeInTheDocument(),
      );
    });

    await step("an emptied field reports nothing and shows an open socket", async () => {
      await userEvent.clear(input);
      await userEvent.tab();
      await expect(value).toHaveTextContent("leer");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(contrast()).toBeNull();
    });
  },
};

/** In English the ratio is written with a point and without spaces. */
export const KeyboardEnglish: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <ColorField aria-label="Code color" defaultValue="#767676" contrastWith="#ffffff" />
    </LocaleProvider>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const contrast = () => canvasElement.querySelector('[data-slot="color-field-contrast"]');
    await expect(contrast()).toHaveTextContent("Contrast 4.5:1, enough for text");
    const input = canvas.getByLabelText("Code color");
    await userEvent.clear(input);
    // Emptied to type another colour, the field keeps the line of the last one.
    await expect(contrast()).toHaveTextContent("Contrast 4.5:1, enough for text");
    await userEvent.type(input, "#777777");
    await expect(contrast()).toHaveTextContent("Contrast 4.4:1, too low for text");
  },
};
