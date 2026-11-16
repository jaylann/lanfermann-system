import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundations/Type",
  parameters: { layout: "padded", visual: { viewport: { width: 880, height: 900 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const scale = [
  {
    cls: "text-3xl font-medium text-fg",
    name: "display · 54 / 500",
    sample: "Drei Stellen kosten Sie heute Anfragen.",
  },
  {
    cls: "text-2xl font-medium text-fg",
    name: "page title · 36 / 500",
    sample: "Angebot 2026-014.",
  },
  {
    cls: "text-xl font-semibold text-fg",
    name: "section heading · 24 / 600",
    sample: "Eine kostenlose Analyse Ihrer Website.",
  },
  {
    cls: "text-lg text-fg-body",
    name: "lead · 20 / 400",
    sample: "Ich schaue mir an, was Sie haben und wo die Lücken sind.",
  },
  {
    cls: "text-base text-fg-body",
    name: "body · 16 / 400",
    sample: "Ich habe mir Ihre Website aus der Sicht eines Kunden angesehen.",
  },
  {
    cls: "text-base font-medium text-fg",
    name: "control label · 16 / 500",
    sample: "Auftragsbestätigung herunterladen",
  },
  {
    cls: "text-base font-semibold text-fg",
    name: "row head · 16 / 600",
    sample: "Schreinerei Mustermann",
  },
  {
    cls: "text-sm text-fg-muted",
    name: "helper · 13.5 / 400",
    sample: "Quelle: BrightLocal, Local Consumer Review Survey 2024",
  },
  {
    cls: "text-sm font-semibold text-danger",
    name: "error · 13.5 / 600",
    sample: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  },
  { cls: "text-xs text-fg-muted", name: "micro · 12 / 400", sample: "Justin Lanfermann, München" },
  {
    cls: "font-mono text-[0.8125rem] leading-normal text-fg-body",
    name: "code · 13 mono",
    sample: "DE00 0000 0000 0000 0000 00",
  },
];

/** The kit's document scale is the UI scale. Sentence case, no capitals, no positive tracking. */
export const Scale: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col">
      {scale.map((row, index) => (
        <div
          key={row.name}
          className={
            index === 0
              ? "grid grid-cols-[11rem_1fr] items-baseline gap-6 border-t-2 border-rule py-4"
              : "grid grid-cols-[11rem_1fr] items-baseline gap-6 border-t border-line py-4"
          }
        >
          <p className="text-sm text-fg-muted">{row.name}</p>
          <p className={row.cls}>{row.sample}</p>
        </div>
      ))}
    </div>
  ),
};

/** Proportional figures by default; tabular only where digits change in place. Real italics. */
export const Details: Story = {
  parameters: { visual: { viewport: { width: 880, height: 420 } } },
  render: () => (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-x-16 gap-y-8">
      <div className="flex flex-col gap-2 border-t-2 border-rule pt-4">
        <p className="text-sm text-fg-muted">Proportional</p>
        <p className="text-xl font-medium text-fg">3.400,00 € · 11.11.2026</p>
        <p className="text-sm text-fg-muted">Tabular</p>
        <p className="text-xl font-medium text-fg tabular-nums">3.400,00 € · 11.11.2026</p>
      </div>
      <div className="flex flex-col gap-2 border-t-2 border-rule pt-4">
        <p className="text-sm text-fg-muted">Weights 400 · 500 · 600 · 700</p>
        <p className="text-xl text-fg">
          <span className="font-normal">Handwerk </span>
          <span className="font-medium">Handwerk </span>
          <span className="font-semibold">Handwerk </span>
          <span className="font-bold">Handwerk</span>
        </p>
        <p className="text-sm text-fg-muted">Italic, for someone else’s words</p>
        <p className="text-xl text-fg italic">„Wir leben von Empfehlungen.“</p>
      </div>
    </div>
  ),
};
