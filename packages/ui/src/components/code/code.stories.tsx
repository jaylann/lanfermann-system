import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "@/components/text/text";

import { Code } from "./code";

const meta = {
  title: "Components/Code",
  component: Code,
  parameters: { visual: { viewport: { width: 640, height: 180 } } },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A file name and a prop in running text: the size of the sentence, on the well. */
export const InText: Story = {
  render: () => (
    <div className="flex max-w-[36rem] flex-col gap-3">
      <Text>
        Die Stylesheet-Datei kommt direkt nach Tailwind in <Code>globals.css</Code>. Eine eigene
        Theme-Datei braucht es danach nicht mehr.
      </Text>
      <Text size="lg">
        Ein Knopf, der wartet, zeigt das selbst: <Code>loading</Code> ersetzt die Beschriftung durch
        einen Spinner, und die Breite bleibt.
      </Text>
    </div>
  ),
};

/** In a narrow column a command breaks with the sentence; each piece keeps its own edges. */
export const Breaking: Story = {
  parameters: { visual: { viewport: { width: 320, height: 200 } } },
  render: () => (
    <Text className="w-60">
      Nach der Installation mit <Code>bun add @lanfermann/ui</Code> importiert eine App die
      Komponenten und eine Stylesheet-Datei.
    </Text>
  ),
};
