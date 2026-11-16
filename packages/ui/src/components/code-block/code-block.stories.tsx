import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn, waitFor } from "storybook/test";

import { CodeBlock } from "./code-block";
import { CodeBlockLive, type CodePiece } from "./code-block-live";
import { copyText } from "./lines";
import { globalsBefore, passRenderer, readme, sendQuote } from "./samples";

const meta = {
  title: "Components/CodeBlock",
  component: CodeBlock,
  args: { code: sendQuote, language: "tsx", title: "send-quote.tsx" },
  parameters: {
    visual: {
      viewport: { width: 760, height: 640 },
      target: '[data-slot="code-copy"] button',
      motion: [{ name: "copy", click: '[data-slot="code-copy"] button', frames: 8 }],
    },
  },
  render: (args) => (
    <div className="w-[min(40rem,calc(100vw-2rem))]">
      <CodeBlock {...args} />
    </div>
  ),
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A file as it is read in documentation: its name above it, a copy button in the header. */
export const File: Story = {};

/** The lines a text talks about: a tint and the accent along the edge. With line numbers. */
export const Marked: Story = { args: { marked: "16-18", lineNumbers: true } };

/** A change: what was removed and what was added, with signs. Copying takes the new version. */
export const Change: Story = {
  args: {
    code: globalsBefore,
    language: "css",
    title: "globals.css",
    removed: 2,
    added: 3,
    lineNumbers: true,
  },
  parameters: { visual: { viewport: { width: 760, height: 280 } } },
};

/** A command on one line: a single row with a prompt. Nothing else to read. */
export const Command: Story = {
  args: { code: "bun add @lanfermann/ui", language: "sh", title: undefined },
  parameters: { visual: { viewport: { width: 760, height: 140 } } },
};

/** Long code shows its first lines; the trigger names what it opens. */
export const Folded: Story = {
  args: { code: passRenderer, language: "swift", title: "PassRenderer.swift", fold: 10 },
  parameters: {
    visual: {
      viewport: { width: 760, height: 520 },
      target: '[data-slot="code-block"] > div:last-child button',
      motion: [
        { name: "open", click: '[aria-expanded="false"]', frames: 8 },
        { name: "copy", click: '[data-slot="code-copy"] button', frames: 8 },
      ],
    },
  },
};

/** A long line scrolls inside the block; the edge fades where more code waits. */
export const LongLines: Story = {
  args: { code: passRenderer, language: "swift", title: "PassRenderer.swift" },
  parameters: { visual: { viewport: { width: 520, height: 820 } } },
  render: (args) => (
    <div className="w-[min(26rem,calc(100vw-2rem))]">
      <CodeBlock {...args} />
    </div>
  ),
};

/** Prose-like code breaks its lines instead of scrolling. */
export const Wrapped: Story = {
  args: { code: readme, language: "md", title: "README.md", wrap: true },
  parameters: { visual: { viewport: { width: 760, height: 260 } } },
};

/** Without a file name there is no header; the copy button floats in the corner. */
export const Untitled: Story = {
  args: { code: sendQuote.split("\n").slice(9, 13).join("\n"), title: undefined },
  parameters: { visual: { viewport: { width: 760, height: 220 } } },
};

/**
 * Two more keys beside the copy, on request: one breaks long lines and puts them back, one
 * saves the file. The copy stays last, where every block has it.
 */
export const Keys: Story = {
  args: { code: readme, language: "md", title: "README.md", wrapToggle: true, download: true },
  parameters: {
    visual: {
      viewport: { width: 760, height: 260 },
      target: '[data-slot="code-wrap"]',
      motion: [{ name: "download", click: '[data-slot="code-download"] button', frames: 8 }],
    },
  },
};

/** The wrap key on: the lines break, and the key keeps its wash while they do. */
export const KeysWrapped: Story = {
  args: { ...Keys.args, wrap: true },
  parameters: { visual: { viewport: { width: 760, height: 260 } } },
};

/** Without a header the keys stand together in the corner, on the block's face. */
export const KeysUntitled: Story = {
  args: {
    code: sendQuote.split("\n").slice(9, 13).join("\n"),
    title: undefined,
    wrapToggle: true,
    download: "send-quote.tsx",
  },
  parameters: { visual: { viewport: { width: 760, height: 220 } } },
};

/**
 * The two keys, as a test: Tab reaches the wrap key first, Enter breaks the lines and says so
 * (`aria-pressed`), the next key saves the file under the block's title, and the copy is last.
 */
export const KeysKeyboard: Story = {
  args: Keys.args,
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const block = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
    const scroller = canvasElement.querySelector<HTMLElement>('[data-slot="code-block-scroll"]')!;
    const wrap = canvas.getByRole("button", { name: "Zeilen umbrechen" });
    // The download goes nowhere; the spy says what would have been saved.
    let saved = "";
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved = this.download;
    });
    try {
      await step("Tab reaches the wrap key, and lines run on", async () => {
        await userEvent.tab();
        await expect(wrap).toHaveFocus();
        await expect(wrap).toHaveAttribute("aria-pressed", "false");
        await expect(block).toHaveAttribute("data-wrap", "off");
        await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
      });

      await step("Enter breaks them, and the key says so", async () => {
        await userEvent.keyboard("{Enter}");
        await expect(wrap).toHaveAttribute("aria-pressed", "true");
        await expect(block).toHaveAttribute("data-wrap", "on");
        await waitFor(() => expect(scroller.scrollWidth).toBe(scroller.clientWidth));
      });

      await step("The next key saves the file under the block's title", async () => {
        await userEvent.tab();
        await expect(canvas.getByRole("button", { name: "Herunterladen" })).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(click).toHaveBeenCalledOnce();
        await expect(saved).toBe("README.md");
        await waitFor(() =>
          expect(canvas.getByText("Die Datei wurde heruntergeladen.")).toBeInTheDocument(),
        );
      });

      await step("The copy is the last key", async () => {
        await userEvent.tab();
        await expect(canvas.getByRole("button", { name: "Code kopieren" })).toHaveFocus();
      });
    } finally {
      click.mockRestore();
    }
  },
};

/** The settings a server's docs show: a TOML file, an environment file, a Windows shell. */
export const Configuration: Story = {
  args: { code: "" },
  render: () => (
    <div className="flex flex-col gap-4">
      <CodeBlock
        language="toml"
        title="fly.toml"
        code={`app = "sevdesk-mcp"\nprimary_region = "fra"\n\n[http_service]\n  internal_port = 8080\n  force_https = true`}
      />
      <CodeBlock
        language="env"
        title=".env"
        code={`# Nur Entwürfe, kein Buchen\nSEVDESK_ALLOW=read,write\nSEVDESK_DRY_RUN=1`}
      />
      <CodeBlock
        language="powershell"
        title="PowerShell"
        code={`$env:SEVDESK_API_TOKEN = "<dein Token>"\nnpx -y mcp-server-sevdesk`}
      />
    </div>
  ),
  parameters: { visual: { viewport: { width: 760, height: 560 } } },
};

/** A configuration as an app would colour it itself: keys, strings and the punctuation between. */
const key = (text: string): CodePiece => ({ text, role: "attribute" });
const string = (text: string): CodePiece => ({ text, role: "string" });
const punct = (text: string): CodePiece => ({ text, role: "punct" });
const liveConfig: CodePiece[][] = [
  [punct("{")],
  [{ text: "  " }, key('"mcpServers"'), punct(": {")],
  [{ text: "    " }, key('"kundenportal"'), punct(": {")],
  [{ text: "      " }, key('"command"'), punct(": "), string('"npx"'), punct(",")],
  [
    { text: "      " },
    key('"args"'),
    punct(": ["),
    string('"-y"'),
    punct(", "),
    string('"kundenportal-mcp"'),
    punct("],"),
  ],
  [{ text: "      " }, key('"env"'), punct(": {")],
  [{ text: "        " }, key('"PORTAL_SCHREIBEN"'), punct(": "), string('"entwuerfe"')],
  [{ text: "      " }, punct("}")],
  [{ text: "    " }, punct("}")],
  [{ text: "  " }, punct("}")],
  [punct("}")],
];

/**
 * Code put together in the browser (`CodeBlockLive`): the app colours the lines itself, so no
 * highlighter travels. The line the reader's choice put there is marked.
 */
export const Live: Story = {
  render: () => (
    <div className="w-[min(40rem,calc(100vw-2rem))]">
      <CodeBlockLive lines={liveConfig} title="claude_desktop_config.json" marked={7} />
    </div>
  ),
};

/**
 * The keyboard reaches the copy button, then the code, which scrolls under the arrow keys. A
 * copy of a change takes the new version, and is said aloud.
 */
export const Keyboard: Story = {
  args: Change.args,
  play: async ({ canvas, userEvent }) => {
    // The clipboard writes nowhere; the spy says what would have been copied.
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    try {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Code kopieren" })).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(write).toHaveBeenCalledOnce();
      await expect(write).toHaveBeenCalledWith(copyText(globalsBefore, 2));
      await waitFor(() =>
        expect(canvas.getByRole("status")).toHaveTextContent("Der Code wurde kopiert."),
      );
      await userEvent.tab();
      await expect(canvas.getByRole("group", { name: "globals.css" })).toHaveFocus();
    } finally {
      write.mockRestore();
    }
  },
};
