import { CloudIcon, CreditCardIcon, GithubIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/badge/badge";
import { Icon } from "@/components/icon/icon";

import { IconTile } from "./icon-tile";

const meta = {
  title: "Components/IconTile",
  component: IconTile,
  parameters: { layout: "padded", visual: { viewport: { width: 520, height: 320 } } },
} satisfies Meta<typeof IconTile>;

export default meta;
type Story = StoryObj;

const INTEGRATIONS = [
  { name: "GitHub", line: "Repositories und Deployments", icon: GithubIcon, set: true },
  { name: "Zahlungsdienst", line: "Rechnungen und Abbuchungen", icon: CreditCardIcon, set: true },
  { name: "E-Mail-Versand", line: "Angebote und Erinnerungen", icon: Mail01Icon, set: false },
  { name: "Dateiablage", line: "Bilder und Dokumente", icon: CloudIcon, set: false },
];

/** The symbol of an integration in a list: one plate per row, the name and a line beside it. */
export const Default: Story = {
  render: () => (
    <ul className="flex w-full max-w-md flex-col">
      {INTEGRATIONS.map((entry) => (
        <li
          key={entry.name}
          className="flex items-center gap-3 border-b border-hairline py-3 last:border-b-0"
        >
          <IconTile>
            <Icon icon={entry.icon} size={20} />
          </IconTile>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-control font-medium text-fg">{entry.name}</span>
            <span className="text-sm text-fg-muted">{entry.line}</span>
          </span>
          <Badge tone={entry.set ? "success" : "neutral"}>
            {entry.set ? "Verbunden" : "Nicht verbunden"}
          </Badge>
        </li>
      ))}
    </ul>
  ),
};

/** The two sizes. */
export const Sizes: Story = {
  parameters: { visual: { viewport: { width: 520, height: 140 } } },
  render: () => (
    <div className="flex items-center gap-4">
      <IconTile>
        <Icon icon={GithubIcon} size={20} />
      </IconTile>
      <IconTile size="sm">
        <Icon icon={GithubIcon} size={18} />
      </IconTile>
    </div>
  ),
};
