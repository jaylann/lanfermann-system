import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/button/button";
import { Card, CardContent } from "@/components/card/card";
import {
  PromptInput,
  PromptInputActions,
  PromptInputAttach,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/prompt-input/prompt-input";
import { ReflowGrid, ReflowTile } from "@/components/reflow-grid/reflow-grid";
import { StatChange } from "@/components/stat/stat";
import { StatTab, StatTabsList } from "@/components/stat/stat-tabs";
import { Tabs } from "@/components/tabs/tabs";
import { Text } from "@/components/text/text";

// Boards for looks that are Justin's to pick: the options side by side, the one that is built
// in marked „Standard“. They are not part of the library and are left out of the captures; each
// goes once its pick is recorded in DESIGN.md.
const meta = {
  title: "Lab/Open picks",
  tags: ["visual-skip"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Option({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col">
        <Text className="font-medium text-fg">{name}</Text>
        <Text size="sm" tone="muted">
          {note}
        </Text>
      </div>
      {children}
    </section>
  );
}

/** A composer with a file hanging over it, which is drawn as the caret in it is. */
function FocusedDock({ style }: { style?: CSSProperties }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["%PDF"], "Angebot.pdf", { type: "application/pdf" }));
    box.current
      ?.querySelector("form")
      ?.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: transfer }));
  }, []);
  return (
    <div ref={box} style={style} className="px-2 pb-8">
      <PromptInput surface="dock">
        <PromptInputTextarea placeholder="z. B. Fasse das Angebot für die Bäckerei Kornprobst zusammen" />
        <PromptInputActions>
          <PromptInputAttach />
          <PromptInputSubmit />
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}

/**
 * #121: how a docked `PromptInput` looks with the caret in it (shown here as it looks with a
 * file over it, which is the same recipe). The first one below is how it looks at rest.
 */
export const DockFocus: Story = {
  render: () => (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Option name="In Ruhe" note="Zum Vergleich: das Dock ohne Fokus.">
        <div className="px-2 pb-8">
          <PromptInput surface="dock">
            <PromptInputTextarea placeholder="z. B. Fasse das Angebot für die Bäckerei Kornprobst zusammen" />
            <PromptInputActions>
              <PromptInputAttach />
              <PromptInputSubmit />
            </PromptInputActions>
          </PromptInput>
        </div>
      </Option>
      <Option name="A  Nichts ändert sich" note="Nur der Cursor zeigt, dass geschrieben wird.">
        <FocusedDock
          style={
            {
              "--d-dock-edge": "var(--depth-surface-edge)",
              "--d-dock-halo": "transparent",
            } as CSSProperties
          }
        />
      </Option>
      <Option name="B  Kante im Akzent" note="Ohne Hof: der Schatten des Docks bleibt allein.">
        <FocusedDock style={{ "--d-dock-halo": "transparent" } as CSSProperties} />
      </Option>
      <Option
        name="C  Kante und Hof (Standard)"
        note="Wie jedes Feld mit Fokus, über dem Schatten."
      >
        <FocusedDock />
      </Option>
    </div>
  ),
};

const FIGURES = [
  { id: "klicks", label: "Klicks", value: "1.284", change: "+12 %" },
  { id: "impressionen", label: "Impressionen", value: "31.906", change: "+4 %" },
  { id: "klickrate", label: "Klickrate", value: "4,0 %", change: "+0,3 Punkte" },
  { id: "position", label: "Position", value: "11,4", change: "−1,8" },
] as const;

function Figures({ list }: { list?: string }) {
  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="impressionen">
          <StatTabsList aria-label="Kennzahl" className={list}>
            {FIGURES.map((figure) => (
              <StatTab
                key={figure.id}
                value={figure.id}
                label={figure.label}
                change={
                  <StatChange
                    render={<span />}
                    trend={figure.id === "position" ? "down" : "up"}
                    tone="positive"
                  >
                    {figure.change}
                  </StatChange>
                }
              >
                {figure.value}
              </StatTab>
            ))}
          </StatTabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** #123: what marks the chosen figure of `StatTabsList`. Press a figure to see it travel. */
export const StatTabsActive: Story = {
  render: () => (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Option name="A  Waschung (Standard)" note="Wie die Tabs: eine leise Fläche, die gleitet.">
        <Figures />
      </Option>
      <Option name="B  Erhabene Karte" note="Die gewählte Kennzahl steht als Taste auf der Karte.">
        <Figures list="*:data-[slot=stat-tabs-indicator]:bg-raised *:data-[slot=stat-tabs-indicator]:depth-raised" />
      </Option>
      <Option
        name="C  Linie im Akzent"
        note="Keine Fläche: eine Linie unter der Kennzahl, in der Farbe des Diagramms."
      >
        <Figures list="*:data-[slot=stat-tabs-indicator]:rounded-none *:data-[slot=stat-tabs-indicator]:border-b-2 *:data-[slot=stat-tabs-indicator]:border-accent *:data-[slot=stat-tabs-indicator]:bg-transparent" />
      </Option>
    </div>
  ),
};

const TILES = ["Umsatz", "Offene Angebote", "Neue Anfragen", "Stornierungen", "Bewertungen"];

const onGlide = {
  transitionDuration: "var(--transition-duration-spring-glide)",
  transitionTimingFunction: "var(--ease-spring-glide)",
} as CSSProperties;
const tileOnGlide =
  "[transition:opacity_var(--transition-duration-spring-settle)_var(--ease-spring-settle),translate_var(--transition-duration-spring-glide)_var(--ease-spring-glide),scale_var(--transition-duration-spring-settle)_var(--ease-spring-settle),transform_var(--transition-duration-spring-settle)_var(--ease-spring-settle)]";
const fadeOnly = "data-leaving:scale-100 data-leaving:[transform:none]";

function Tiles({
  shown,
  leaving,
  onLeft,
  grid,
  tile,
}: {
  shown: readonly string[];
  leaving: readonly string[];
  onLeft: (name: string) => void;
  grid?: CSSProperties;
  tile?: string;
}) {
  return (
    <ReflowGrid style={grid} className="sm:grid-cols-3 lg:grid-cols-3">
      {shown.map((name) => (
        <ReflowTile
          key={name}
          id={name}
          leaving={leaving.includes(name)}
          onLeft={() => onLeft(name)}
          className={tile}
        >
          <Card variant="bevel" className="h-full">
            <CardContent className="flex min-h-20 flex-col gap-1">
              <Text size="sm" tone="muted">
                {name}
              </Text>
            </CardContent>
          </Card>
        </ReflowTile>
      ))}
    </ReflowGrid>
  );
}

function Reflows() {
  const [shown, setShown] = useState<readonly string[]>(TILES.slice(0, 4));
  const [leaving, setLeaving] = useState<readonly string[]>([]);
  // Each of the three grids says when a tile has left; the first to say so takes it out of all.
  const left = (name: string) => {
    setShown((now) => now.filter((each) => each !== name));
    setLeaving((now) => now.filter((each) => each !== name));
  };
  const toggle = (name: string) => {
    if (leaving.includes(name)) setLeaving((now) => now.filter((each) => each !== name));
    else if (shown.includes(name)) setLeaving((now) => [...now, name]);
    else setShown((now) => [...now, name]);
  };
  const tiles = { shown, leaving, onLeft: left };
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {TILES.map((name) => (
          <Button key={name} size="sm" onClick={() => toggle(name)}>
            {shown.includes(name) && !leaving.includes(name) ? `${name} lösen` : `${name} anheften`}
          </Button>
        ))}
      </div>
      <Option
        name="A  Auf settle, sinkt und blasst (Standard)"
        note="Wie im Hub: Kacheln und Höhe kommen zusammen an."
      >
        <Tiles {...tiles} />
      </Option>
      <Option name="B  Auf glide" note="Wie das FileGrid: etwas länger, weicher im Auslauf.">
        <Tiles {...tiles} grid={onGlide} tile={tileOnGlide} />
      </Option>
      <Option name="C  Auf settle, blasst nur" note="Wie Popups gehen: ohne Sinken und Schrumpfen.">
        <Tiles {...tiles} tile={fadeOnly} />
      </Option>
    </div>
  );
}

/**
 * #112: the spring the tiles of a `ReflowGrid` move on, and how a tile leaves. The keys act on
 * all three grids at once.
 */
export const ReflowMotion: Story = { render: () => <Reflows /> };
