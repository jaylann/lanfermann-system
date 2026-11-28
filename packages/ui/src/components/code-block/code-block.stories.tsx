import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, spyOn, waitFor } from "storybook/test";

import { Segment, SegmentedControl } from "@/components/segmented-control/segmented-control";
import { Switch } from "@/components/switch/switch";

import { CodeBlock } from "./code-block";
import { CodeBlockLive, type CodeBlockLiveProps, type CodePiece } from "./code-block-live";
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

/** An empty title is no title, as a test: no header, and the code keeps its name. */
export const EmptyTitle: Story = {
  args: { ...Untitled.args, title: "" },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector('[data-slot="code-block-header"]')).toBeNull();
    await expect(canvas.getByRole("group", { name: "Code" })).toBeInTheDocument();
  },
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

type Reach = "lesen" | "entwerfen" | "senden";
type PortalChoice = { reach: Reach; dryRun: boolean; log: boolean };

const reaches: { value: Reach; label: string; allow?: string }[] = [
  { value: "lesen", label: "Lesen" },
  { value: "entwerfen", label: "Entwerfen", allow: "read,draft" },
  { value: "senden", label: "Senden", allow: "read,draft,send" },
];

/** A line of JSON in the block's roles: keys, strings, numbers and the punctuation between. */
function colourJson(line: string): CodePiece[] {
  const pieces: CodePiece[] = [];
  for (const [, space, text, colon, mark, word] of line.matchAll(
    /(\s+)|("(?:[^"\\]|\\.)*")(\s*:)?|([{}[\],:])|([^\s{}[\],:"]+)/g,
  )) {
    if (space) pieces.push({ text: space });
    else if (text) {
      pieces.push({ text, role: colon ? "attribute" : "string" });
      if (colon) pieces.push({ text: colon, role: "punct" });
    } else if (mark) pieces.push({ text: mark, role: "punct" });
    else if (word) pieces.push({ text: word, role: "number" });
  }
  return pieces;
}

/** The configuration a reader's choices make, with the lines their choices put there. */
function portalConfig({ reach, dryRun, log }: PortalChoice) {
  const env: Record<string, string> = { PORTAL_TOKEN: "<dein Token>" };
  const allow = reaches.find((entry) => entry.value === reach)?.allow;
  if (allow) env.PORTAL_ALLOW = allow;
  if (dryRun) env.PORTAL_DRY_RUN = "1";
  if (log) env.PORTAL_LOG = "/var/log/portal.jsonl";
  const text = JSON.stringify(
    { mcpServers: { kundenportal: { command: "npx", args: ["-y", "kundenportal-mcp"], env } } },
    null,
    2,
  ).replace(/\[\n\s+("[^"]*"),\n\s+("[^"]*")\n\s+\]/, "[$1, $2]");
  const lines = text.split("\n");
  return {
    lines: lines.map(colourJson),
    marked: lines.flatMap((line, index) =>
      /PORTAL_(ALLOW|DRY_RUN|LOG)/.test(line) ? [index + 1] : [],
    ),
  };
}

/** The reader's choices: how far the assistant may go, a dry run, a log. */
function PortalChoices({
  choice,
  onChange,
}: {
  choice: PortalChoice;
  onChange: (choice: PortalChoice) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-sans">
      <SegmentedControl
        shape="round"
        aria-label="Reichweite"
        value={choice.reach}
        onValueChange={(reach) => onChange({ ...choice, reach: reach as Reach })}
      >
        {reaches.map((entry) => (
          <Segment key={entry.value} value={entry.value}>
            {entry.label}
          </Segment>
        ))}
      </SegmentedControl>
      <label data-setting="dry-run" className="flex items-center gap-3 text-control text-fg">
        <Switch
          checked={choice.dryRun}
          onCheckedChange={(dryRun) => onChange({ ...choice, dryRun })}
        />
        Probelauf
      </label>
      <label data-setting="log" className="flex items-center gap-3 text-control text-fg">
        <Switch checked={choice.log} onCheckedChange={(log) => onChange({ ...choice, log })} />
        Protokoll
      </label>
    </div>
  );
}

const firstChoice: PortalChoice = { reach: "entwerfen", dryRun: false, log: true };

/** The three things a choice does to the code: a line joins, a line goes, a value changes. */
const changes = [
  { name: "join", click: '[data-setting="dry-run"] [data-slot="switch"]', frames: 8 },
  { name: "leave", click: '[data-setting="log"] [data-slot="switch"]', frames: 8 },
  { name: "change", click: '[data-slot="segment"][data-value="senden"]', frames: 8 },
];

function LiveConfigurator(props: Pick<CodeBlockLiveProps, "changeMotion">) {
  const [choice, setChoice] = useState(firstChoice);
  return (
    <div className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-6">
      <PortalChoices choice={choice} onChange={setChoice} />
      <CodeBlockLive {...portalConfig(choice)} title="claude_desktop_config.json" {...props} />
      <p className="font-sans text-sm text-fg-muted">
        Einfügen und den Client neu starten. Das Token liest der Server aus seiner Umgebung.
      </p>
    </div>
  );
}

/**
 * Code that changes under the reader's hand. A line their choice adds opens like a fold: its row
 * opens, the lines below make room and its text fades in. A line it takes out fades and its row
 * closes; a value it changes shows the new part. The text below the block moves with it.
 */
export const LiveChanges: Story = {
  args: { code: "" },
  render: () => <LiveConfigurator />,
  parameters: { visual: { viewport: { width: 760, height: 560 }, motion: changes } },
};

const changeMotions = [
  { value: "fade", label: "Einblenden" },
  { value: "glow", label: "Aufleuchten" },
] as const;

/**
 * The two ways a changed value shows, driven by one set of choices: it fades in, or it also
 * lights up for a moment, for a change the reader should not miss.
 */
export const ChangeMotions: Story = {
  args: { code: "" },
  render: function Render() {
    const [choice, setChoice] = useState(firstChoice);
    const config = portalConfig(choice);
    return (
      <div className="flex w-[min(60rem,calc(100vw-2rem))] flex-col gap-8">
        <PortalChoices choice={choice} onChange={setChoice} />
        <div className="grid items-start gap-6 md:grid-cols-2">
          {changeMotions.map((motion) => (
            <figure key={motion.value} className="flex min-w-0 flex-col gap-3">
              <figcaption className="font-sans text-sm text-fg-muted">{motion.label}</figcaption>
              <CodeBlockLive
                {...config}
                title="claude_desktop_config.json"
                changeMotion={motion.value}
              />
            </figure>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    visual: {
      viewport: { width: 1040, height: 560 },
      motion: changes.filter((change) => change.name === "change"),
    },
  },
};

/**
 * What a change does to the lines as the reader sees and copies them: the line a choice adds is
 * there at once, the one it takes out is hidden from assistive tech while it closes and gone
 * once it has, and nothing on its way out is ever copied. A choice undone mid-way leaves the
 * lines as they were.
 */
export const LiveChangesTest: Story = {
  args: { code: "" },
  render: () => <LiveConfigurator />,
  play: async ({ canvas, canvasElement, step, userEvent }) => {
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const block = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
    const lines = () => [...block.querySelectorAll<HTMLElement>('[data-slot="code-block-line"]')];
    const shown = () => lines().filter((line) => line.dataset.motion !== "leave");
    const text = () =>
      shown()
        .map((line) => line.textContent)
        .join("\n");
    const dryRun = canvasElement.querySelector<HTMLElement>(
      '[data-setting="dry-run"] [data-slot="switch"]',
    )!;
    const log = canvasElement.querySelector<HTMLElement>(
      '[data-setting="log"] [data-slot="switch"]',
    )!;
    const before = text();
    try {
      await step("A line the choice adds is there at once", async () => {
        await userEvent.click(dryRun);
        await waitFor(() => expect(text()).toContain('"PORTAL_DRY_RUN": "1"'));
        await expect(text()).toBe(
          portalConfig({ ...firstChoice, dryRun: true })
            .lines.map((line) => line.map((piece) => piece.text).join(""))
            .join("\n"),
        );
      });

      await step("A line the choice takes out closes, hidden, and then is gone", async () => {
        await userEvent.click(log);
        const leaving = await waitFor(() => {
          const line = block.querySelector<HTMLElement>('[data-motion="leave"]');
          if (!line) throw new Error("no closing line");
          return line;
        });
        await expect(leaving).toHaveAttribute("aria-hidden", "true");
        await expect(leaving).toHaveTextContent("PORTAL_LOG");
        await userEvent.click(canvas.getByRole("button", { name: "Code kopieren" }));
        await expect(write).toHaveBeenLastCalledWith(
          expect.not.stringContaining("PORTAL_LOG") as string,
        );
        await waitFor(() => expect(block.querySelector('[data-motion="leave"]')).toBeNull(), {
          timeout: 2000,
        });
      });

      await step("Choices undone at once leave the lines as they were", async () => {
        await userEvent.click(log);
        await userEvent.click(dryRun);
        await userEvent.click(dryRun);
        await userEvent.click(dryRun);
        await waitFor(() => expect(block.querySelector('[data-motion="leave"]')).toBeNull(), {
          timeout: 2000,
        });
        await expect(text()).toBe(before);
        await expect(lines()).toHaveLength(before.split("\n").length);
      });
    } finally {
      write.mockRestore();
    }
  },
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
