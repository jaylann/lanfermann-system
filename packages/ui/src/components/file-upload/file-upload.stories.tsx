import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Button } from "@/components/button/button";

import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  type FileUploadProps,
  type FileUploadStatus,
  FileUploadZone,
  type FileUploadZoneProps,
} from "./file-upload";
import type { FileRejection } from "./files";

const meta = {
  title: "Components/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "padded",
    visual: {
      viewport: { width: 520, height: 260 },
      target: '[data-slot="file-upload-zone"] [data-slot="button"]',
    },
  },
} satisfies Meta;

export default meta;
// The upload needs a handler, which each story gives in its own markup: no shared `args`.
type Story = StoryObj;

type Upload = {
  id: string;
  name: string;
  size: number;
  status: FileUploadStatus;
  progress?: number;
  error?: string;
};

const MB = 1_000_000;

const FILES: Upload[] = [
  { id: "1", name: "Angebot-2026-0421.pdf", size: 2.4 * MB, status: "done" },
  { id: "2", name: "Grundriss-Werkstatt.png", size: 8.1 * MB, status: "uploading", progress: 0.46 },
  { id: "3", name: "Fotos-Baustelle.zip", size: 34 * MB, status: "waiting" },
  {
    id: "4",
    name: "Leistungsverzeichnis.xlsx",
    size: 0.842 * MB,
    status: "error",
    error: "Die Verbindung wurde unterbrochen.",
  },
];

const reasons: Record<FileRejection["reason"], string> = {
  type: "Dieser Dateityp wird nicht angenommen.",
  size: "Die Datei ist größer als 10 MB.",
  count: "Hier kann nur eine Datei hochgeladen werden.",
};

/** A stand-in for an upload: files join the list and fill up on a clock. Nothing is sent. */
function useUploads(initial: Upload[], autoRun: boolean) {
  const [uploads, setUploads] = useState(initial);
  const count = useRef(initial.length);
  useEffect(() => {
    if (!autoRun) return;
    const clock = setInterval(() => {
      setUploads((all) =>
        all.some((upload) => upload.status === "uploading")
          ? all.map((upload) => {
              if (upload.status !== "uploading") return upload;
              const progress = (upload.progress ?? 0) + 0.12;
              return progress >= 1
                ? { ...upload, status: "done" as const, progress: 1 }
                : { ...upload, progress };
            })
          : all,
      );
    }, 160);
    return () => clearInterval(clock);
  }, [autoRun]);
  return {
    uploads,
    add: (files: Pick<File, "name" | "size">[]) =>
      setUploads((all) => [
        ...all,
        ...files.map((file) => ({
          id: String(++count.current),
          name: file.name,
          size: file.size,
          status: "uploading" as const,
          progress: 0,
        })),
      ]),
    reject: (rejected: FileRejection[]) =>
      setUploads((all) => [
        ...all,
        ...rejected.map(({ file, reason }) => ({
          id: String(++count.current),
          name: file.name,
          size: file.size,
          status: "error" as const,
          error: reasons[reason],
        })),
      ]),
    retry: (id: string) =>
      setUploads((all) =>
        all.map((upload) =>
          upload.id === id
            ? { ...upload, status: "uploading" as const, progress: 0, error: undefined }
            : upload,
        ),
      ),
    remove: (id: string) => setUploads((all) => all.filter((upload) => upload.id !== id)),
    finish: () =>
      setUploads((all) =>
        all.map((upload) =>
          upload.status === "uploading" ? { ...upload, status: "done" as const } : upload,
        ),
      ),
  };
}

type BoardProps = Pick<FileUploadZoneProps, "variant"> &
  Pick<FileUploadProps, "disabled"> & {
    initial?: Upload[];
    /** Whether the clock runs. Off for a picture that must stand still. */
    autoRun?: boolean;
    /** Keys under the list that stand in for a file arriving and an upload finishing. */
    controls?: boolean;
    onAdded?: (files: File[]) => void;
  };

function Board({ initial = [], autoRun = false, controls = false, onAdded, ...props }: BoardProps) {
  const { uploads, add, reject, retry, remove, finish } = useUploads(initial, autoRun);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <FileUpload
        multiple
        accept=".pdf,.png,.jpg,.zip,.xlsx"
        maxSize={10 * MB}
        disabled={props.disabled}
        onFilesAdded={(files) => {
          add(files);
          onAdded?.(files);
        }}
        onReject={reject}
      >
        <FileUploadZone
          variant={props.variant}
          description="PDF, Bild, ZIP oder Excel, höchstens 10 MB je Datei"
        />
        <FileUploadList aria-label="Dateien">
          {uploads.map((upload) => (
            <FileUploadItem
              key={upload.id}
              name={upload.name}
              size={upload.size}
              status={upload.status}
              progress={upload.progress}
              error={upload.error}
              onRetry={upload.status === "error" ? () => retry(upload.id) : undefined}
              onRemove={props.disabled ? undefined : () => remove(upload.id)}
            />
          ))}
        </FileUploadList>
      </FileUpload>
      {controls && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="quiet"
            data-step="add"
            onClick={() => add([{ name: "Lageplan.pdf", size: 3.2 * MB }])}
          >
            Beispieldatei hinzufügen
          </Button>
          <Button size="sm" variant="quiet" data-step="finish" onClick={finish}>
            Upload abschließen
          </Button>
        </div>
      )}
    </div>
  );
}

/** Nothing added yet: the zone, cut like a field, with its button. */
export const Default: Story = {
  render: () => <Board autoRun />,
};

/**
 * `variant="plain"`: the words and the button alone, for a lower zone where the tile would
 * stand out too much: one of several in a form, or in a narrow card.
 */
export const Plain: Story = {
  parameters: { visual: { viewport: { width: 520, height: 210 } } },
  render: () => <Board variant="plain" autoRun />,
};

/** The story's stand-in for a file held over the zone. */
function Hanging({ variant }: Pick<FileUploadZoneProps, "variant">) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zone = box.current?.querySelector('[data-slot="file-upload-zone"]');
    const data = new DataTransfer();
    data.items.add(new File(["x"], "Lageplan.pdf", { type: "application/pdf" }));
    zone?.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: data }));
  }, []);
  return (
    <div ref={box}>
      <Board variant={variant} />
    </div>
  );
}

/** A file hangs over the zone: it takes the field's halo and says what letting go will do. */
export const HangingOver: Story = {
  render: () => <Hanging />,
};

/** One row per state: arrived, on its way, waiting, failed. */
export const WithFiles: Story = {
  parameters: { visual: { viewport: { width: 520, height: 500 } } },
  render: () => <Board initial={FILES} />,
};

/**
 * A file joins the list: its row fades in and the list grows. When it has arrived, its bar
 * folds away and its mark closes from the arc into the disc.
 */
export const Uploading: Story = {
  parameters: {
    visual: {
      viewport: { width: 520, height: 470 },
      motion: [
        { name: "join", click: '[data-step="add"]', frames: 8 },
        { name: "done", click: '[data-step="finish"]', frames: 8 },
        {
          name: "leave",
          click: '[data-slot="file-upload-place"]:first-child [data-slot="file-upload-remove"]',
          frames: 8,
        },
      ],
    },
  },
  render: () => <Board initial={FILES.slice(0, 2)} controls />,
};

/** Nothing can be added right now: the zone lies flat, and the rows have no keys. */
export const Disabled: Story = {
  parameters: { visual: { viewport: { width: 520, height: 330 } } },
  render: () => <Board disabled initial={FILES.slice(0, 1)} />,
};

/** On a phone the zone is as wide as the page; a long name ends in an ellipsis. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 520 } } },
  render: () => <Board initial={FILES} />,
};

/** What the upload reports in the test below. */
const added = fn();

/**
 * Lets what a step has set moving come to rest before the next one starts. The test runs in
 * the open workshop too, where its steps piled up into one burst of motion.
 */
const settle = () => new Promise((done) => setTimeout(done, 600));

/**
 * As a test: the button is reached with Tab, a chosen file joins the list and arrives, a file
 * that is too large is turned away with its reason, a failed one can be tried again, and
 * removing a row hands the focus to the next.
 */
export const Keyboard: Story = {
  render: () => <Board initial={FILES.slice(3)} autoRun onAdded={added} />,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    added.mockClear();
    const input = canvasElement.querySelector<HTMLInputElement>('[data-slot="file-upload-input"]')!;
    const rows = () =>
      [
        ...canvasElement.querySelectorAll('[data-slot="file-upload-place"]:not([data-leaving])'),
      ].map((row) => row.querySelector('[data-slot="file-upload-name"]')?.textContent);

    await step("Tab reaches the button that opens the file dialog", async () => {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Dateien auswählen" })).toHaveFocus();
      await expect(input).toHaveAttribute("type", "file");
    });

    await step("a chosen file joins the list and arrives", async () => {
      const file = new File(["%PDF"], "Lageplan.pdf", { type: "application/pdf" });
      await userEvent.upload(input, file);
      await expect(added).toHaveBeenCalledWith([file]);
      await waitFor(() => expect(rows()).toContain("Wird hochgeladen: Lageplan.pdf"));
      await waitFor(() => expect(rows()).toContain("Hochgeladen: Lageplan.pdf"), {
        timeout: 4000,
      });
      await settle();
    });

    await step("a file that is too large is turned away, in words", async () => {
      const large = new File([new Uint8Array(11 * MB)], "Film.zip", { type: "application/zip" });
      await userEvent.upload(input, large);
      await waitFor(() => expect(rows()).toContain("Fehlgeschlagen: Film.zip"));
      // The row fades in: it is there at once and visible a moment later.
      await waitFor(() =>
        expect(canvas.getByText("Die Datei ist größer als 10 MB.")).toBeVisible(),
      );
      await expect(added).toHaveBeenCalledTimes(1);
      await settle();
    });

    await step("a failed file can be tried again", async () => {
      const retry = canvas.getAllByRole("button", { name: "Noch einmal versuchen" })[0]!;
      await userEvent.click(retry);
      await waitFor(() => expect(rows()).toContain("Wird hochgeladen: Leistungsverzeichnis.xlsx"));
      await settle();
    });

    await step("removing a row hands the focus to the one beside it", async () => {
      const first = canvas.getByRole("button", { name: "Leistungsverzeichnis.xlsx entfernen" });
      first.focus();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("button", { name: "Lageplan.pdf entfernen" })).toHaveFocus();
      await waitFor(() => expect(rows()).toHaveLength(2));
    });
  },
};
