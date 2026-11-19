import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Attachment, type AttachmentStatus } from "@/components/attachment/attachment";
import { FILES, type StoryFile } from "@/components/attachment/story-files";

import {
  PromptInput,
  PromptInputActions,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
} from "./prompt-input";

const meta = {
  title: "Components/PromptInput",
  component: PromptInput,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 720, height: 220 },
      target: '[data-slot="prompt-input-submit"]',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const sent = fn();
const stopped = fn();
const added = fn();

type PromptFile = StoryFile & { status: AttachmentStatus };

const PLACEHOLDER = "z. B. Fasse das Angebot für die Bäckerei Kornprobst zusammen";

/** A prompt as a product holds it: its files, whether an answer runs. Nothing is sent. */
function Prompt({
  text = "",
  files: initialFiles = [],
  running: initialRunning = false,
  disabled,
}: {
  text?: string;
  files?: PromptFile[];
  running?: boolean;
  disabled?: boolean;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [running, setRunning] = useState(initialRunning);
  const count = useRef(0);
  return (
    <PromptInput
      defaultValue={text}
      running={running}
      disabled={disabled}
      onSubmit={(message) => {
        sent(message);
        setFiles([]);
        setRunning(true);
      }}
      onStop={() => {
        stopped();
        setRunning(false);
      }}
      onFilesAdded={(chosen) => {
        added(chosen.map((file) => file.name));
        const joined = chosen.map((file) => ({
          id: `added-${++count.current}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "uploading" as const,
        }));
        setFiles((all) => [...all, ...joined]);
        // A stand-in for the upload: the files arrive a moment later.
        window.setTimeout(
          () =>
            setFiles((all) =>
              all.map((file) =>
                joined.some(({ id }) => id === file.id) ? { ...file, status: "done" } : file,
              ),
            ),
          900,
        );
      }}
    >
      <PromptInputAttachments>
        {files.map((file) => (
          <Attachment
            key={file.id}
            {...file}
            onRemove={() => setFiles((all) => all.filter(({ id }) => id !== file.id))}
          />
        ))}
      </PromptInputAttachments>
      <PromptInputTextarea placeholder={PLACEHOLDER} />
      <PromptInputActions>
        <PromptInputAttach />
        <PromptInputSubmit />
      </PromptInputActions>
    </PromptInput>
  );
}

const TEXT =
  "Fasse das Angebot für die Bäckerei Kornprobst zusammen. Was kostet es, und bis wann gilt es?";

const WITH_FILES: PromptFile[] = [
  { ...FILES[0]!, status: "done" },
  { ...FILES[1]!, status: "done" },
  { ...FILES[2]!, status: "uploading" },
];

/**
 * An empty prompt: the example in italics, the paper clip, and the send key lying flat until
 * there is something to send.
 */
export const Default: Story = {
  render: () => <Prompt />,
};

/** With text the send key stands up. */
export const WithText: Story = {
  render: () => <Prompt text={TEXT} />,
};

/** Attached files stand above the text as chips; one is still on its way. */
export const Attachments: Story = {
  parameters: { visual: { viewport: { width: 720, height: 260 } } },
  render: () => <Prompt text={TEXT} files={WITH_FILES} />,
};

/**
 * Sent: the text leaves the field, and the send key turns into stop in the same place and size,
 * the arrow shrinking away and the square seating. The field stays open for the next prompt.
 */
export const Running: Story = {
  parameters: {
    visual: {
      motion: [{ name: "send", click: '[data-slot="prompt-input-submit"]', frames: 8 }],
    },
  },
  render: () => <Prompt text={TEXT} />,
};

/** Stopped: the square shrinks away and the arrow seats back. */
export const Stopping: Story = {
  parameters: {
    visual: {
      motion: [{ name: "stop", click: '[data-slot="prompt-input-submit"]', frames: 8 }],
    },
  },
  render: () => <Prompt running />,
};

/**
 * The field grows with its text and pushes what stands below; the line being typed is readable
 * from its first frame, only the top edge eases.
 */
export const Growing: Story = {
  parameters: {
    visual: {
      viewport: { width: 520, height: 260 },
      motion: [
        {
          name: "grow",
          click: '[data-slot="prompt-input-textarea"]',
          // Enough to need a third line.
          type: " und bis wann gilt das Angebot für alle drei Filialen?",
          frames: 8,
        },
      ],
    },
  },
  render: () => (
    <div className="w-[26rem]">
      <Prompt text="Fasse das Angebot für die Bäckerei Kornprobst zusammen. Was kostet es," />
    </div>
  ),
};

/** A file hangs over the field: it wears the halo, the sign that it takes what is let go. */
function HangingOverField() {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const form = box.current?.querySelector("form");
    const transfer = new DataTransfer();
    transfer.items.add(new File(["%PDF"], "Angebot-Kornprobst.pdf", { type: "application/pdf" }));
    form?.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
  }, []);
  return (
    <div ref={box}>
      <Prompt />
    </div>
  );
}

export const HangingOver: Story = {
  render: () => <HangingOverField />,
};

/** Nothing can be written now. */
export const Disabled: Story = {
  render: () => <Prompt disabled />,
};

/** On a phone: Enter breaks the line, the key sends. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 280 } } },
  render: () => <Prompt text={TEXT} files={WITH_FILES} />,
};

/**
 * From the keyboard: Shift+Enter breaks the line, Enter sends; a word being composed is not
 * sent, nor is anything while an answer runs; the stop key stops it; files come by the paper
 * clip and by paste, and Backspace in the empty field takes the last away.
 */
export const Keyboard: Story = {
  render: () => <Prompt />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    sent.mockClear();
    stopped.mockClear();
    added.mockClear();
    const field = canvas.getByRole("textbox", { name: "Nachricht an die KI" });

    await step("Shift+Enter breaks the line, Enter sends", async () => {
      await userEvent.click(field);
      await userEvent.keyboard("Was kostet es?{Shift>}{Enter}{/Shift}Bis wann?");
      await expect(field).toHaveValue("Was kostet es?\nBis wann?");
      await userEvent.keyboard("{Enter}");
      await expect(sent).toHaveBeenCalledWith("Was kostet es?\nBis wann?");
      await expect(field).toHaveValue("");
      await expect(field).toHaveFocus();
    });

    await step("while the answer runs, Enter waits and the key stops it", async () => {
      await userEvent.keyboard("Und netto?{Enter}");
      await expect(sent).toHaveBeenCalledOnce();
      await expect(field).toHaveValue("Und netto?");
      await userEvent.click(canvas.getByRole("button", { name: "Anhalten" }));
      await expect(stopped).toHaveBeenCalledOnce();
      await expect(canvas.getByRole("button", { name: "Senden" })).toBeInTheDocument();
    });

    await step("a word being composed is not sent", async () => {
      field.focus();
      field.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
      );
      await expect(sent).toHaveBeenCalledOnce();
      await userEvent.clear(field);
    });

    await step("files come by the paper clip and by paste", async () => {
      const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
      await userEvent.upload(
        input,
        new File(["%PDF"], "Angebot-Kornprobst.pdf", { type: "application/pdf" }),
      );
      await expect(added).toHaveBeenLastCalledWith(["Angebot-Kornprobst.pdf"]);
      const data = new DataTransfer();
      data.items.add(new File(["png"], "Entwurf-Startseite.png", { type: "image/png" }));
      const paste = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
      // Firefox drops `clipboardData` from the constructor's options.
      Object.defineProperty(paste, "clipboardData", { value: data });
      field.dispatchEvent(paste);
      await expect(added).toHaveBeenLastCalledWith(["Entwurf-Startseite.png"]);
      await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
    });

    await step("Backspace in the empty field takes the last file away", async () => {
      field.focus();
      await userEvent.keyboard("{Backspace}");
      await waitFor(() =>
        expect(
          canvas.queryByRole("button", { name: /Entwurf-Startseite\.png.*entfernen/ }),
        ).toBeNull(),
      );
      await expect(
        canvas.getByRole("button", { name: /Angebot-Kornprobst\.pdf.*entfernen/ }),
      ).toBeInTheDocument();
    });
  },
};
