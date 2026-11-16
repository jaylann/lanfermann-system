import type { Meta, StoryObj } from "@storybook/react-vite";

import { Figure, FigureCaption, FigureFrame } from "./figure";

const meta = {
  title: "Components/Figure",
  component: Figure,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 640, height: 420 } },
  },
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

const steps = ["Client", "Transport", "Prüfung", "Werkzeug", "sevDesk"];

/** A small diagram, drawn in the ground's colours. */
function Chain() {
  return (
    <svg
      viewBox="0 0 520 60"
      width="520"
      height="60"
      role="img"
      aria-label="Client, Transport, Prüfung, Werkzeug, sevDesk"
      className="max-w-full"
    >
      {steps.map((step, i) => (
        <g key={step} transform={`translate(${i * 108} 10)`}>
          <rect width="88" height="40" rx="6" className="fill-surface-quiet stroke-line" />
          <text x="44" y="25" textAnchor="middle" className="fill-fg text-[12px]">
            {step}
          </text>
          {i < steps.length - 1 ? (
            <path d="M88 20h20" className="stroke-line" strokeWidth="1.5" />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/** A drawing on its own sheet, with a caption that says what it shows. */
export const Framed: Story = {
  render: () => (
    <Figure>
      <FigureFrame>
        <Chain />
      </FigureFrame>
      <FigureCaption>Der Weg eines Aufrufs, vom Client bis zu sevDesk.</FigureCaption>
    </Figure>
  ),
};

/** Without the frame, the picture stands on the page. */
export const Plain: Story = {
  render: () => (
    <Figure>
      <Chain />
      <FigureCaption>Der Weg eines Aufrufs, vom Client bis zu sevDesk.</FigureCaption>
    </Figure>
  ),
};
