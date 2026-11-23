import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import {
  BADGE,
  HERO,
  LOGO,
  MARK,
  MARK_DARK,
  PHOTO,
  STICKER,
} from "@/components/file-tile/story-files";

import { MediaPreview, type NaturalSize } from "./media-preview";

const meta = {
  title: "Components/MediaPreview",
  component: MediaPreview,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 960, height: 360 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** A picture with its size under it, as an inspector writes it among the facts. */
function WithSize({ src, name }: { src: string; name: string }) {
  const [size, setSize] = useState<NaturalSize | null>(null);
  return (
    <figure className="flex w-72 flex-col gap-2">
      <MediaPreview src={src} name={name} onNaturalSize={setSize} className="h-52" />
      <figcaption className="text-sm text-fg-muted tabular-nums" data-testid={`size-${name}`}>
        {name}
        {size ? ` · ${size.width} × ${size.height} px` : ""}
      </figcaption>
    </figure>
  );
}

/**
 * Pictures of every shape are contained on the well, whole, and fade in once loaded; the size
 * under each is what the picture reported.
 */
export const Pictures: Story = {
  render: () => (
    <div className="flex gap-4">
      <WithSize src={HERO} name="hero.webp" />
      <WithSize src={PHOTO} name="ofen.jpg" />
      <WithSize src={BADGE} name="badge_neu.webp" />
    </div>
  ),
};

/** A logo drawn for a light page, whole on the well. */
export const Logo: Story = {
  parameters: { visual: { viewport: { width: 480, height: 260 } } },
  render: () => <MediaPreview src={LOGO} name="building-gbar.svg" className="h-40 w-80" />,
};

/**
 * A picture that may be see-through (an SVG for a light page, its `_dark` twin, a PNG) lies on
 * the quiet checker across the well, so the black mark shows in the dark and the white one in
 * the light.
 */
export const Transparent: Story = {
  render: () => (
    <div className="flex gap-4">
      <WithSize src={MARK} name="gbar-zeichen.svg" />
      <WithSize src={MARK_DARK} name="gbar-zeichen_dark.svg" />
      <WithSize src={STICKER} name="abzeichen_rund.png" />
    </div>
  ),
};

/** The checker comes with a see-through picture once it has loaded; a JPEG has none. */
export const CheckerByFormat: Story = {
  render: () => (
    <div className="flex gap-4">
      <WithSize src={STICKER} name="abzeichen_rund.png" />
      <WithSize src={PHOTO} name="ofen.jpg" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [png, jpeg] = canvasElement.querySelectorAll('[data-slot="media-preview"]');
    await waitFor(() =>
      expect(png?.querySelector('[data-slot="media-preview-checker"]')).toHaveAttribute(
        "data-loaded",
      ),
    );
    await expect(jpeg?.querySelector('[data-slot="media-preview-checker"]')).toBeNull();
  },
};

/** What has no picture of its own shows the symbol of its kind, large, with its type. */
export const Others: Story = {
  render: () => (
    <div className="flex gap-4">
      {[
        { name: "Preise_Getraenke_2027.xlsx", type: "" },
        { name: "Fotos-Backstube.zip", type: "application/zip" },
        { name: "Schriften.woff2", type: "" },
      ].map((file) => (
        <MediaPreview key={file.name} src="#" {...file} className="h-52 w-64" />
      ))}
    </div>
  ),
};

/**
 * A video and a piece of audio play with the browser's own controls; only their length loads
 * until they are played. (The stories carry no media, so the controls stand empty.)
 */
export const Media: Story = {
  // The browser's controls draw a loading mark of their own that moves: no still of them is
  // the same twice.
  parameters: { visual: { skip: true } },
  render: () => (
    <div className="flex gap-4">
      <MediaPreview src="#" name="teaser.mp4" type="video/mp4" className="h-52 w-80" />
      <MediaPreview src="#" name="jingle_herbst.mp3" type="audio/mpeg" className="h-52 w-80" />
    </div>
  ),
};

/** A picture that cannot be loaded gives its place to the symbol. */
export const Broken: Story = {
  parameters: { visual: { viewport: { width: 480, height: 300 } } },
  render: () => (
    <MediaPreview src="data:image/webp;base64,AAAA" name="hero_alt.webp" className="h-52 w-72" />
  ),
};

/** A picture reports its own size once it has loaded. */
export const Size: Story = {
  render: () => <WithSize src={HERO} name="hero.webp" />,
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByTestId("size-hero.webp")).toHaveTextContent("1600 × 900 px"),
    );
    await expect(canvas.getByRole("img", { name: "hero.webp" })).toHaveAttribute("data-loaded");
  },
};
