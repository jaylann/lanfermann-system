import type { Meta, StoryObj } from "@storybook/react-vite";

import { Code } from "@/components/code/code";
import { Link } from "@/components/link/link";

import { Callout } from "./callout";

const meta = {
  title: "Components/Callout",
  component: Callout,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 640, height: 640 } },
  },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The five kinds, each with its word and icon; colour only repeats what they say. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Callout tone="note">
        <p>
          Dies ist ein inoffizielles Community-Projekt. Es ist nicht mit der sevdesk GmbH verbunden.
        </p>
      </Callout>
      <Callout tone="tip">
        <p>Lege einen eigenen Benutzer nur für den Assistenten an.</p>
      </Callout>
      <Callout tone="important">
        <p>
          <Code>commit</Code> und <Code>external</Code> fragen vor jedem Aufruf nach.
        </p>
      </Callout>
      <Callout tone="warning">
        <p>Ein API-Token hat vollen Zugriff auf das ganze Konto. Behandle es wie ein Passwort.</p>
      </Callout>
      <Callout tone="caution">
        <p>Festgeschriebene Rechnungen lassen sich nicht mehr ändern, nur stornieren.</p>
      </Callout>
    </div>
  ),
};

/** A title in place of the word, and a body of two paragraphs with a link. */
export const WithTitle: Story = {
  args: {
    tone: "note",
    title: "Diese Seite gibt es nur auf Englisch",
    children: (
      <>
        <p>Die Architektur beschreibt den Code, und der ist auf Englisch geschrieben.</p>
        <p>
          <Link href="#">Zur englischen Fassung</Link>
        </p>
      </>
    ),
  },
  parameters: { visual: { viewport: { width: 640, height: 200 } } },
};
