import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";
import { ChipGroup } from "@/components/chip/chip-group";
import { Message, MessageContent } from "@/components/message/message";

import { Attachment, type AttachmentStatus, MessageAttachments } from "./attachment";
import { FILES, KINDS, LONG_NAMES, type StoryFile } from "./story-files";

const meta = {
  title: "Components/Attachment",
  component: Attachment,
  parameters: {
    layout: "padded",
    visual: { viewport: { width: 720, height: 360 } },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Chips({ files, status }: { files: StoryFile[]; status?: AttachmentStatus }) {
  return (
    <ChipGroup aria-label="Anhänge">
      {files.map((file) => (
        <Attachment key={file.id} variant="chip" status={status} {...file} onRemove={() => {}} />
      ))}
    </ChipGroup>
  );
}

function Tiles({ files, status }: { files: StoryFile[]; status?: AttachmentStatus }) {
  return (
    <MessageAttachments>
      {files.map((file) => (
        <Attachment key={file.id} status={status} {...file} />
      ))}
    </MessageAttachments>
  );
}

/**
 * Every kind of file, as the chip it is in a prompt and the tile it is in a message: the symbol
 * says what it is, the size is muted in tabular digits.
 */
export const Kinds: Story = {
  parameters: { visual: { viewport: { width: 860, height: 420 } } },
  render: () => (
    <div className="flex flex-col gap-8">
      <Chips files={KINDS} />
      <Tiles files={KINDS.filter(({ id }) => id !== "image")} />
    </div>
  ),
};

/** A picture shows itself: small in its chip, as itself in a message, its edge a hairline. */
export const Pictures: Story = {
  parameters: { visual: { viewport: { width: 720, height: 320 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Chips files={FILES} />
      <Tiles files={FILES.filter(({ type }) => type.startsWith("image/"))} />
    </div>
  ),
};

/** Files sent with a question stand above it at the right, as tiles. */
export const InAMessage: Story = {
  parameters: { visual: { viewport: { width: 720, height: 380 } } },
  render: () => (
    <div className="flex flex-col">
      <Message from="user">
        <MessageAttachments>
          {FILES.map((file) => (
            <Attachment key={file.id} {...file} />
          ))}
        </MessageAttachments>
        <MessageContent>Passt der Entwurf zum Angebot? Bitte prüfe die Preise.</MessageContent>
      </Message>
    </div>
  ),
};

/** A file on its way, then arrived: „Fertig“ lets it arrive, the arc gives way to its symbol. */
function Arriving() {
  const [status, setStatus] = useState<AttachmentStatus>("uploading");
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex gap-2">
        <Button size="sm" data-step="finish" onClick={() => setStatus("done")}>
          Fertig
        </Button>
        <Button size="sm" variant="quiet" onClick={() => setStatus("uploading")}>
          Noch einmal
        </Button>
      </div>
      <ChipGroup aria-label="Anhänge">
        <Attachment variant="chip" status={status} {...FILES[0]!} onRemove={() => {}} />
      </ChipGroup>
      <Tiles files={[FILES[0]!]} status={status} />
    </div>
  );
}

/** On its way, a file carries the system's arc; once it has arrived, its symbol comes back. */
export const Uploading: Story = {
  parameters: {
    visual: {
      viewport: { width: 520, height: 260 },
      target: '[data-step="finish"]',
      motion: [{ name: "arrive", click: '[data-step="finish"]', frames: 6 }],
    },
  },
  render: () => <Arriving />,
};

/** A file that did not arrive says so in words; in a tile, also why. */
export const Failed: Story = {
  parameters: { visual: { viewport: { width: 620, height: 220 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Chips files={[FILES[0]!]} status="error" />
      <MessageAttachments>
        <Attachment {...FILES[0]!} status="error" error="Die Verbindung wurde unterbrochen." />
      </MessageAttachments>
    </div>
  ),
};

/** A long name is cut in its middle: the end of it and the extension stay. */
export const LongNames: Story = {
  parameters: { visual: { viewport: { width: 720, height: 260 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Chips files={LONG_NAMES} />
      <Tiles files={LONG_NAMES.map((file) => ({ ...file, type: "" }))} />
    </div>
  ),
};

/** On a phone the chips wrap and the tiles take the width they have. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 520 } } },
  render: () => (
    <div className="flex flex-col gap-6">
      <Chips files={FILES} />
      <Tiles files={KINDS.slice(0, 3)} />
    </div>
  ),
};

/** Taking files away: each key is named after its file, and the focus goes to the one beside. */
function Removable() {
  const [files, setFiles] = useState(FILES);
  return (
    <ChipGroup aria-label="Anhänge">
      {files.map((file) => (
        <Attachment
          key={file.id}
          variant="chip"
          {...file}
          onRemove={() => setFiles((all) => all.filter(({ id }) => id !== file.id))}
        />
      ))}
    </ChipGroup>
  );
}

export const Keyboard: Story = {
  render: () => <Removable />,
  play: async ({ canvas, userEvent, step }) => {
    await step("each remove key names its file", async () => {
      await userEvent.tab();
      await expect(
        canvas.getByRole("button", { name: /Angebot-Kornprobst\.pdf.*entfernen/ }),
      ).toHaveFocus();
    });
    await step("a removed file hands the focus to the one beside it", async () => {
      await userEvent.keyboard("{Enter}");
      await waitFor(() =>
        expect(
          canvas.getByRole("button", { name: /Entwurf-Startseite\.png.*entfernen/ }),
        ).toHaveFocus(),
      );
      await waitFor(() =>
        expect(canvas.queryByRole("button", { name: /Angebot-Kornprobst/ })).toBeNull(),
      );
    });
  },
};
