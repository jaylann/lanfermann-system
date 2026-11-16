import type { Meta, StoryObj } from "@storybook/react-vite";

import { linkVariants } from "@/components/link/link-variants";

const meta = {
  title: "Foundations/Grounds",
  parameters: { layout: "padded", visual: { viewport: { width: 860, height: 560 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const surfaces = [
  ["ground", "bg-ground"],
  ["surface", "bg-surface"],
  ["surface-quiet", "bg-surface-quiet"],
  ["raised", "bg-raised"],
  ["sheet", "bg-sheet"],
  ["tint", "bg-tint"],
  ["key", "bg-key"],
  ["accent", "bg-accent"],
] as const;

const lines = [
  ["rule · 2px", "border-t-2 border-rule"],
  ["line · 1px, 3:1", "border-t border-line"],
  ["hairline · 1px", "border-t border-hairline"],
] as const;

const statuses = [
  [
    "danger",
    "text-danger",
    "bg-danger-soft",
    "bg-danger-solid text-on-danger",
    "Zahlung fehlgeschlagen",
  ],
  [
    "warning",
    "text-warning",
    "bg-warning-soft",
    "bg-warning-solid text-on-warning",
    "Angebot läuft morgen ab",
  ],
  [
    "success",
    "text-success",
    "bg-success-soft",
    "bg-success-solid text-on-success",
    "Rechnung bezahlt",
  ],
  ["info", "text-info", "bg-info-soft", "bg-info-solid text-on-info", "Neue Version verfügbar"],
] as const;

/** Use the Ground switch in the toolbar: every token changes, no component does. */
export const Tokens: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <div className="grid grid-cols-4 gap-4">
        {surfaces.map(([name, cls]) => (
          <div key={name} className="flex flex-col gap-2">
            <div className={`h-14 rounded-md ring-1 ring-hairline ${cls}`} />
            <p className="text-sm text-fg-muted">{name}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-fg">text</p>
          <p className="text-fg-body">text-body, the running copy</p>
          <p className="text-sm text-fg-muted">text-muted, what may be skipped</p>
          <p className={linkVariants()}>accent, a link</p>
        </div>
        <div className="col-span-2 flex flex-col justify-between gap-4">
          {lines.map(([name, cls]) => (
            <div key={name} className={`pt-1.5 ${cls}`}>
              <p className="text-sm text-fg-muted">{name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/** A UI-only extension of the kit. A status always arrives with words; colour never carries it alone. */
export const Status: Story = {
  parameters: { visual: { viewport: { width: 860, height: 320 } } },
  render: () => (
    <div className="grid w-full max-w-3xl grid-cols-[6rem_1fr_1fr_1fr] items-center gap-x-6 gap-y-3">
      {statuses.map(([name, text, soft, solid, sample]) => (
        <div key={name} className="contents">
          <p className="text-sm text-fg-muted">{name}</p>
          <p className={`text-sm font-semibold ${text}`}>{sample}</p>
          <p className={`rounded-sm px-2.5 py-1 text-sm font-medium ${soft} ${text}`}>{sample}</p>
          <p className={`rounded-sm px-2.5 py-1 text-sm font-medium ${solid}`}>{sample}</p>
        </div>
      ))}
    </div>
  ),
};

/** Grounds nest: each region resolves its own tokens, including depth. */
export const Nested: Story = {
  parameters: { visual: { viewport: { width: 860, height: 420 } } },
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      {(["tint", "ink", "indigo"] as const).map((ground) => (
        <div key={ground} data-theme={ground} className="flex items-center gap-6 rounded-xl p-5">
          <p className="w-40 font-semibold text-fg">{ground} inside the page</p>
          <div className="flex h-9 items-center rounded-md bg-raised depth-raised px-4 font-medium text-fg">
            neutral
          </div>
          <div className="flex h-9 items-center rounded-md bg-key depth-raised px-4 font-medium text-on-key depth-tone-key">
            key
          </div>
          <div className="flex h-9 w-40 items-center rounded-md bg-surface px-3 text-fg depth-field">
            Feld
          </div>
          <p className="text-sm text-fg-muted">muted</p>
        </div>
      ))}
    </div>
  ),
};
