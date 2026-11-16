import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "./text";

const meta = {
  title: "Components/Text",
  component: Text,
  parameters: { layout: "padded", visual: { viewport: { width: 640, height: 420 } } },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Text size="lg">
        Wir bauen Websites für Handwerksbetriebe, die Anfragen bringen statt nur gut auszusehen.
      </Text>
      <Text>
        Sie erhalten ein Angebot mit Festpreis. Darin steht, was wir bauen, bis wann, und was es
        kostet. Nichts davon ändert sich, ohne dass Sie zustimmen.
      </Text>
      <Text size="sm" tone="muted">
        Zuletzt geändert am 12. November 2026 von Max Mustermann.
      </Text>
      <Text size="xs" tone="muted">
        Alle Preise zuzüglich 19 % Umsatzsteuer.
      </Text>
      <Text mono size="sm">
        DE89 3704 0044 0532 0130 00
      </Text>
      <Text numeric weight="semibold" tone="strong">
        4.280,00 €
      </Text>
    </div>
  ),
};
