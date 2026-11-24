import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Card, CardContent } from "@/components/card/card";
import { FileGrid, FileGridSection } from "@/components/file-grid/file-grid";
import { FileTile } from "@/components/file-tile/file-tile";
import { FILES } from "@/components/file-tile/story-files";
import { Heading } from "@/components/heading/heading";
import { Text } from "@/components/text/text";

import { DetailPane, DetailPaneLayout } from "./detail-pane";

const meta = {
  title: "Components/DetailPane",
  component: DetailPaneLayout,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 1100, height: 520 },
      motion: [{ name: "open", click: '[data-slot="file-tile"]', frames: 10 }],
    },
  },
} satisfies Meta<typeof DetailPaneLayout>;

export default meta;
type Story = StoryObj;

/** A folder of files: a press on a tile chooses it and opens the pane, a second press closes it. */
function Folder({ initial }: { initial?: string }) {
  const [chosen, setChosen] = useState<string | undefined>(initial);
  const file = FILES.find((entry) => entry.id === chosen);
  return (
    <DetailPaneLayout open={file !== undefined}>
      <Card>
        <CardContent>
          <FileGrid aria-label="Dateien in kunden/huber">
            <FileGridSection>
              {FILES.slice(0, 6).map(({ id, ...entry }) => (
                <FileTile
                  key={id}
                  {...entry}
                  selected={chosen === id}
                  onClick={() => setChosen(chosen === id ? undefined : id)}
                />
              ))}
            </FileGridSection>
          </FileGrid>
        </CardContent>
      </Card>
      <DetailPane aria-label="Details">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <Heading level={2} size="sub" className="break-words">
              {file?.name}
            </Heading>
            <Text size="sm">Geändert am 31. März, 2 KB.</Text>
          </CardContent>
        </Card>
      </DetailPane>
    </DetailPaneLayout>
  );
}

/** Nothing chosen: the folder has the whole width. Press a tile to open the pane. */
export const Closed: Story = { render: () => <Folder /> };

/** One file chosen: the pane stands beside the folder, which is narrower by it. */
export const Open: Story = { render: () => <Folder initial={FILES[1]!.id} /> };

/** The pane opens with a choice and closes with the last one taken back, out of reach then. */
export const Choosing: Story = {
  render: () => <Folder />,
  play: async ({ canvasElement, userEvent }) => {
    const pane = canvasElement.querySelector<HTMLElement>('[data-slot="detail-pane"]');
    const tile = canvasElement.querySelector<HTMLElement>('[data-slot="file-tile"]');
    if (!pane || !tile) throw new Error("the story has no pane or no tile");
    await expect(pane).toHaveAttribute("inert");
    await userEvent.click(tile);
    await waitFor(() => expect(pane).not.toHaveAttribute("inert"));
    await expect(pane).toHaveTextContent(FILES[0]!.name);
    await userEvent.click(tile);
    await waitFor(() => expect(pane).toHaveAttribute("inert"));
    // While it leaves it still shows what it showed.
    await expect(pane).toHaveTextContent(FILES[0]!.name);
  },
};
