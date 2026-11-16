import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Slider, SliderControl, SliderLabel, SliderThumb, SliderValue } from "./slider";

const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    visual: { viewport: { width: 440, height: 130 }, target: '[data-slot="slider-thumb"]' },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const percent = { style: "percent", maximumFractionDigits: 0 } as const;
const euro = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const;

/** A long switch: the thumb runs in the trough, and the trough fills with Indigo up to it. */
export const Default: Story = {
  parameters: {
    visual: {
      target: '[data-slot="slider-thumb"]',
      motion: [{ name: "press", press: '[data-slot="slider-thumb"]', frames: 6 }],
    },
  },
  render: () => (
    <Slider
      defaultValue={0.15}
      max={0.5}
      step={0.01}
      format={percent}
      locale="de-DE"
      className="w-[340px]"
    >
      <SliderLabel>Rabatt</SliderLabel>
      <SliderValue />
      <SliderControl />
    </Slider>
  ),
};

/** An array as value makes a range. Each thumb has its own name. */
export const Range: Story = {
  render: () => (
    <Slider
      defaultValue={[1500, 4000]}
      min={0}
      max={6000}
      step={100}
      format={euro}
      locale="de-DE"
      className="w-[340px]"
    >
      <SliderLabel>Budget</SliderLabel>
      <SliderValue />
      <SliderControl>
        <SliderThumb index={0} aria-label="Mindestens" />
        <SliderThumb index={1} aria-label="Höchstens" />
      </SliderControl>
    </Slider>
  ),
};

/** At both ends the thumb stops inside the trough, with the same gap it keeps above and below. */
export const Ends: Story = {
  parameters: { visual: { viewport: { width: 440, height: 170 } } },
  render: () => (
    <div className="flex w-[340px] flex-col gap-2">
      <Slider defaultValue={0}>
        <SliderControl>
          <SliderThumb aria-label="Deckkraft, leer" />
        </SliderControl>
      </Slider>
      <Slider defaultValue={100}>
        <SliderControl>
          <SliderThumb aria-label="Deckkraft, voll" />
        </SliderControl>
      </Slider>
    </div>
  ),
};

/** Without a visible label, the thumb carries the name. */
export const Bare: Story = {
  parameters: { visual: { viewport: { width: 440, height: 90 } } },
  render: () => (
    <Slider defaultValue={60} className="w-[340px]">
      <SliderControl>
        <SliderThumb aria-label="Lautstärke" />
      </SliderControl>
    </Slider>
  ),
};

/** Disabled, it still shows where it stands, without colour and without depth. */
export const Disabled: Story = {
  render: () => (
    <Slider
      defaultValue={0.15}
      max={0.5}
      step={0.01}
      format={percent}
      locale="de-DE"
      disabled
      className="w-[340px]"
    >
      <SliderLabel>Rabatt</SliderLabel>
      <SliderValue />
      <SliderControl />
    </Slider>
  ),
};

/**
 * The keyboard path, as a test: the thumb is the Tab stop, the arrows step, Shift and Page keys
 * take the large step, Home and End go to the ends, and the value is announced as it is shown.
 */
export const Keyboard: Story = {
  render: () => (
    <Slider defaultValue={20} step={5} largeStep={20} className="w-[340px]">
      <SliderLabel>Deckkraft</SliderLabel>
      <SliderValue />
      <SliderControl />
    </Slider>
  ),
  play: async ({ canvas, userEvent, step }) => {
    const slider = canvas.getByRole("slider", { name: "Deckkraft" });

    await step("Tab lands on the thumb", async () => {
      await userEvent.tab();
      await expect(slider).toHaveFocus();
      await expect(slider).toHaveAttribute("aria-valuenow", "20");
    });

    await step("The arrows step by 5", async () => {
      await userEvent.keyboard("{ArrowRight}");
      await expect(slider).toHaveAttribute("aria-valuenow", "25");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      await expect(slider).toHaveAttribute("aria-valuenow", "15");
    });

    await step("PageUp takes the large step", async () => {
      await userEvent.keyboard("{PageUp}");
      await expect(slider).toHaveAttribute("aria-valuenow", "35");
    });

    await step("End and Home go to the ends, and the text follows", async () => {
      await userEvent.keyboard("{End}");
      await expect(slider).toHaveAttribute("aria-valuenow", "100");
      await expect(canvas.getByText("100")).toBeVisible();
      await userEvent.keyboard("{Home}");
      await expect(slider).toHaveAttribute("aria-valuenow", "0");
    });
  },
};
