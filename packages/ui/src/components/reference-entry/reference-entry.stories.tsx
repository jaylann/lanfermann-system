import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/badge/badge";
import { Code } from "@/components/code/code";
import { Link } from "@/components/link/link";
import { Parameter, ParameterList } from "@/components/parameter-list/parameter-list";

import {
  ReferenceEntry,
  ReferenceEntryBody,
  ReferenceEntryHeader,
  ReferenceEntryMeta,
  ReferenceEntryName,
  ReferenceEntryTitle,
} from "./reference-entry";

const meta = {
  title: "Components/ReferenceEntry",
  component: ReferenceEntry,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 640 } },
  },
} satisfies Meta<typeof ReferenceEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One tool of a server's reference: its name in code (the address of the entry), its title in
 * words, its kind as badges, then what it does and what it takes.
 */
export const Default: Story = {
  render: () => (
    <ReferenceEntry aria-labelledby="sevdesk_invoice_cancel">
      <ReferenceEntryHeader>
        <ReferenceEntryName id="sevdesk_invoice_cancel">sevdesk_invoice_cancel</ReferenceEntryName>
        <ReferenceEntryTitle>Rechnung stornieren</ReferenceEntryTitle>
        <ReferenceEntryMeta>
          <Badge tone="warning">Buchen</Badge>
          <Badge>ändert Daten</Badge>
          <Badge>kann nicht rückgängig gemacht werden</Badge>
        </ReferenceEntryMeta>
      </ReferenceEntryHeader>
      <ReferenceEntryBody>
        <p>
          sevDesk legt eine Stornorechnung mit negierten Beträgen an, die das Original ausgleicht.
          Für eine bezahlte Rechnung erstelle stattdessen eine Gutschrift mit{" "}
          <Link href="#">
            <Code>sevdesk_credit_note_create_from_invoice</Code>
          </Link>
          .
        </p>
        <ParameterList aria-label="Argumente">
          <Parameter name="id" type="integer" required>
            Die Id der Rechnung, nicht ihre Nummer.
          </Parameter>
          <Parameter name="dryRun" type="boolean" required={false}>
            Nur eine Vorschau, ohne etwas zu ändern.
          </Parameter>
        </ParameterList>
      </ReferenceEntryBody>
    </ReferenceEntry>
  ),
};
