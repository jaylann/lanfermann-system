import type { Meta, StoryObj } from "@storybook/react-vite";

import { AnchorHeading } from "@/components/anchor-heading/anchor-heading";
import { Callout } from "@/components/callout/callout";
import { Code } from "@/components/code/code";
import { CodeBlock } from "@/components/code-block/code-block";
import { Link } from "@/components/link/link";

import { Prose } from "./prose";

const meta = {
  title: "Components/Prose",
  component: Prose,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 760, height: 1500 } },
  },
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A page of docs as a Markdown renderer hands it over: plain paragraphs, lists (one inside
 * another, one with a code block in an item), a rule, emphasis, and the library's own parts
 * where they belong. The rhythm is the prose's; the look of each part is its own.
 */
export const Default: Story = {
  render: () => (
    <Prose className="max-w-[44rem]">
      <p>
        Diese Seite führt dich in etwa zehn Minuten von einem sevDesk-Konto zur ersten Antwort. Der
        Server läuft auf deinem Rechner und wird von deinem Client gestartet. Für mehrere Personen
        lies <Link href="#">Fernzugriff</Link>.
      </p>
      <AnchorHeading id="bevor-du-beginnst">Bevor du beginnst</AnchorHeading>
      <ul>
        <li>
          <strong>sevDesk mit API-Zugang.</strong> Die API ist im Tarif Buchhaltung Pro enthalten.
        </li>
        <li>
          <strong>Ein eigener Benutzer.</strong> Ein API-Token hat vollen Zugriff auf das ganze
          Konto. Lege einen Benutzer nur für den Assistenten an:
          <ul>
            <li>Sein Token kannst du jederzeit zurücksetzen.</li>
            <li>Dein eigenes Login bleibt unberührt.</li>
          </ul>
        </li>
        <li>
          <strong>Node.js 22.12 oder neuer</strong>, das <code>npx</code> mitbringt.
        </li>
      </ul>
      <Callout tone="warning">
        <p>Behandle das Token wie ein Passwort. Es läuft nicht ab.</p>
      </Callout>
      <AnchorHeading id="eintragen">1. Den Server im Client eintragen</AnchorHeading>
      <p>
        Dein Client startet den Server mit <Code>npx -y mcp-server-sevdesk</Code> und übergibt das
        Token in seiner Umgebung. Die meisten Clients nehmen dieses JSON:
      </p>
      <CodeBlock
        language="json"
        code={`{\n  "mcpServers": {\n    "sevdesk": { "command": "npx", "args": ["-y", "mcp-server-sevdesk"] }\n  }\n}`}
      />
      <AnchorHeading id="schluesselbund" level={3}>
        Im Schlüsselbund
      </AnchorHeading>
      <ol>
        <li>
          Speichere das Token einmal:
          <CodeBlock language="sh" code="npx -y mcp-server-sevdesk token set work" />
        </li>
        <li>
          Nenne danach nur noch seinen Namen: <em>work</em>.
        </li>
      </ol>
      <hr />
      <blockquote>
        <p>Ein Zitat ohne eigene Komponente steht an einer Linie.</p>
      </blockquote>
    </Prose>
  ),
};
