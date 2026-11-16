import type { Meta, StoryObj } from "@storybook/react-vite";

import { Ground, type GroundName } from "@/components/ground/ground";
import { Logomark } from "@/components/logo/logomark";
import { Wordmark } from "@/components/logo/wordmark";

const meta = {
  title: "Foundations/Logo",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Caption({ children }: { children: string }) {
  return <span className="text-sm text-fg-muted">{children}</span>;
}

/**
 * The wordmark in the kit's sizes, named by text height. The full form reads "Lanfermann.dev";
 * the short one, "Lanfermann.", is for where the address does not fit. 16px is the floor.
 */
export const WordmarkSizes: Story = {
  parameters: { visual: { viewport: { width: 520, height: 360 } } },
  render: () => (
    <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-10 gap-y-6">
      {([32, 24, 20, 16] as const).map((size) => (
        <div key={size} className="contents">
          <Caption>{`${size} px`}</Caption>
          <Wordmark size={size} />
          <Wordmark size={size} variant="short" />
        </div>
      ))}
    </div>
  ),
};

/**
 * The symbol, the mitre. Below 48px its two pieces meet; from 48px a seam shows between them.
 * In one colour the seam is wider at every size, because it is all that tells the pieces apart.
 */
export const SymbolSizes: Story = {
  parameters: { visual: { viewport: { width: 620, height: 400 } } },
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-10">
        {[16, 24, 32, 48, 96].map((size) => (
          <div key={size} className="flex flex-col items-start gap-3">
            <Logomark size={size} />
            <Caption>{`${size} px`}</Caption>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-10">
        {[16, 24, 32, 48, 96].map((size) => (
          <div key={size} className="flex flex-col items-start gap-3">
            <Logomark size={size} tone="mono" />
            <Caption>{`${size} px, eine Farbe`}</Caption>
          </div>
        ))}
      </div>
    </div>
  ),
};

const GROUNDS: GroundName[] = ["paper", "tint", "ink", "indigo"];

/**
 * Both on every ground at once. They take the ground's text colour and accent, which gives the
 * kit's versions without choosing one. On Indigo the symbol is the one-colour mitre.
 */
export const OnEveryGround: Story = {
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 880, height: 300 }, clip: "viewport" },
  },
  render: () => (
    <div className="grid grid-cols-4">
      {GROUNDS.map((ground) => (
        <Ground
          key={ground}
          ground={ground}
          className="flex h-[300px] flex-col justify-between p-8"
        >
          <Wordmark size={24} />
          <div className="flex items-end justify-between">
            <Logomark size={48} tone={ground === "indigo" ? "mono" : "duo"} />
            <Caption>{ground}</Caption>
          </div>
        </Ground>
      ))}
    </div>
  ),
};

/**
 * Clear space: the height of the capital L on every side of the wordmark, one stem on every
 * side of the symbol. Nothing else comes inside the dashed lines.
 */
export const ClearSpace: Story = {
  parameters: { visual: { viewport: { width: 620, height: 220 } } },
  render: () => (
    <div className="flex items-center gap-16">
      {/* At 32px text height the capital L is 660/1000 of it: about 21px. */}
      <div className="border border-dashed border-line p-[21px]">
        <Wordmark size={32} />
      </div>
      {/* At 96px the stem is 3/12 of the height: 24px. */}
      <div className="border border-dashed border-line p-6">
        <Logomark size={96} />
      </div>
    </div>
  ),
};
