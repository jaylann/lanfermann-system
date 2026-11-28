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
 * the quiet checker, behind the picture only, so the black mark shows in the dark and the white
 * one in the light. The square badge leaves the well beside it plain.
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

/**
 * The checker is the picture's own background, and the picture's box is the picture as drawn:
 * the square badge is square inside the wider well, a JPEG has no checker.
 */
export const CheckerByFormat: Story = {
  render: () => (
    <div className="flex gap-4">
      <WithSize src={STICKER} name="abzeichen_rund.png" />
      <WithSize src={PHOTO} name="ofen.jpg" />
    </div>
  ),
  play: async ({ canvas }) => {
    const png = canvas.getByRole("img", { name: "abzeichen_rund.png" });
    const jpeg = canvas.getByRole("img", { name: "ofen.jpg" });
    await waitFor(() => expect(png).toHaveAttribute("data-loaded"));
    await expect(getComputedStyle(png).backgroundImage).toContain("conic-gradient");
    await expect(getComputedStyle(jpeg).backgroundImage).toBe("none");

    const box = png.getBoundingClientRect();
    const well = png.parentElement?.getBoundingClientRect();
    await expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
    await expect(box.width).toBeLessThan((well?.width ?? 0) - 20);
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

// One empty page: enough for a browser's viewer to open, and for one that has none to show
// what stands behind the frame.
const PDF =
  "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDIwMF0+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9GCg==";

/**
 * A PDF opens in the browser's own viewer. The frame has no face of its own: while the viewer
 * loads, and in a browser that draws none inside a page, its symbol and type stand there
 * instead of an empty box.
 */
export const Pdf: Story = {
  parameters: { visual: { viewport: { width: 480, height: 420 } } },
  render: () => (
    <MediaPreview
      src={PDF}
      name="Angebot_Kowalski_Herbst.pdf"
      type="application/pdf"
      pdf="frame"
      className="h-80 w-96"
    />
  ),
};

/**
 * On a touch device (`auto`), or where asked for, there is no frame at all: the symbol, the
 * type and a link that opens the file in a new tab.
 */
export const PdfLink: Story = {
  parameters: {
    visual: { viewport: { width: 390, height: 300 }, target: '[data-slot="link"]' },
  },
  render: () => (
    <MediaPreview
      src={PDF}
      name="Angebot_Kowalski_Herbst.pdf"
      type="application/pdf"
      pdf="link"
      className="h-52 w-full max-w-80"
    />
  ),
};

/** As a test: the link form loads no frame and offers the file in a new tab. */
export const PdfLinkOpens: Story = {
  render: () => <MediaPreview src={PDF} name="Angebot.pdf" type="application/pdf" pdf="link" />,
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /PDF öffnen/ });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("href", PDF);
    await expect(document.querySelector('[data-slot="media-preview-document"]')).toBeNull();
  },
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
