import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const meta = {
  title: "Foundations/Depth",
  parameters: { layout: "padded", visual: { viewport: { width: 860, height: 820 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-center gap-6 border-t border-line py-5 first:border-t-2 first:border-rule">
      <p className="text-sm text-fg-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-5">{children}</div>
    </div>
  );
}

function Block({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-(--control-md) min-w-28 items-center justify-center rounded-md px-4 text-control font-medium",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Only what moves casts a shadow. Fittings are raised under a gloss and press down, sockets are
 * let in, cards rise softly, sheets float. Every recipe here is one `depth-*` utility from
 * src/styles/depth.css.
 */
export const Recipes: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col">
      <Row label="Fitting, neutral">
        <Block className="bg-raised depth-raised text-fg">rest</Block>
        <Block className="bg-raised depth-raised-hover text-fg">hover</Block>
        <Block className="bg-raised-pressed depth-pressed text-fg">pressed</Block>
        <Block className="bg-disabled depth-flat text-on-disabled">disabled</Block>
      </Row>
      <Row label="Fitting, key">
        <Block className="bg-key depth-raised text-on-key depth-tone-key">rest</Block>
        <Block className="bg-key-hover depth-raised-hover text-on-key depth-tone-key">hover</Block>
        <Block className="bg-key-pressed depth-pressed text-on-key depth-tone-key">pressed</Block>
      </Row>
      <Row label="Fitting, ask">
        <Block className="bg-accent depth-raised text-on-accent depth-tone-accent">rest</Block>
        <Block className="bg-accent-hover depth-raised-hover text-on-accent depth-tone-accent">
          hover
        </Block>
        <Block className="bg-accent-pressed depth-pressed text-on-accent depth-tone-accent">
          pressed
        </Block>
      </Row>
      <Row label="Fitting, danger">
        <Block className="bg-danger-solid depth-raised text-on-danger depth-tone-danger">
          rest
        </Block>
        <Block className="bg-danger-solid depth-pressed text-on-danger depth-tone-danger">
          pressed
        </Block>
      </Row>
      <Row label="Socket and plug">
        <div className="size-4 rounded-xs bg-surface depth-socket" />
        <div className="size-4 rounded-xs bg-accent depth-plug depth-tone-accent" />
        <div className="size-4 rounded-full bg-surface depth-socket" />
      </Row>
      <Row label="Trough and thumb">
        <div className="flex h-[18px] w-8 items-center rounded-full bg-trough px-0.5 depth-trough">
          <div className="size-3.5 rounded-full bg-thumb depth-raised depth-tone-thumb" />
        </div>
        <div className="flex h-[18px] w-8 items-center justify-end rounded-full bg-accent px-0.5 depth-trough">
          <div className="size-3.5 rounded-full bg-on-accent depth-raised depth-tone-thumb" />
        </div>
        <div className="flex h-8 w-44 items-center rounded-md bg-trough p-0.5 depth-trough">
          <div className="h-7 w-20 rounded-[calc(var(--radius-md)-2px)] bg-raised depth-raised depth-tone-thumb" />
        </div>
      </Row>
      <Row label="Field">
        <Block className="w-44 justify-start bg-surface font-normal text-fg depth-field">
          rest
        </Block>
        <Block className="w-44 justify-start bg-surface font-normal text-fg depth-field-focus">
          focus
        </Block>
        <Block className="w-44 justify-start bg-surface font-normal text-fg depth-field-invalid">
          invalid
        </Block>
      </Row>
      <Row label="Card">
        <div className="flex w-64 flex-col rounded-xl bg-surface depth-card">
          <div className="px-5 py-4 text-fg">Jährlich abrechnen</div>
          <div className="rounded-b-xl border-t border-hairline bg-well px-5 py-2.5 text-sm text-fg-muted">
            Nächste Rechnung am 1. Dezember
          </div>
        </div>
      </Row>
    </div>
  ),
};

/** Sheets float above the panel on a long, violet-shifted shadow. */
export const Sheets: Story = {
  parameters: { visual: { viewport: { width: 860, height: 420 } } },
  render: () => (
    <div className="flex w-full max-w-3xl items-start gap-12 p-10">
      <div className="flex w-56 flex-col rounded-xl bg-sheet p-1 text-fg depth-floating">
        <div className="rounded-[calc(var(--radius-xl)-4px)] bg-hover px-3 py-2">
          Persönliches Konto
        </div>
        <div className="px-3 py-2">Schreinerei Mustermann</div>
        <div className="mx-3 border-t border-hairline" />
        <div className="px-3 py-2 text-fg-muted">Organisation anlegen</div>
      </div>
      <div className="flex w-72 flex-col gap-2 rounded-2xl bg-sheet p-6 depth-overlay">
        <p className="text-lg font-semibold text-fg">Angebot wirklich löschen?</p>
        <p className="text-fg-body">Das lässt sich nicht rückgängig machen.</p>
      </div>
    </div>
  ),
};
