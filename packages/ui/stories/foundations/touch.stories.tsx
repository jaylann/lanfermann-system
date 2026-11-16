import { Delete02Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/button/button";
import { Checkbox } from "@/components/checkbox/checkbox";
import { Icon } from "@/components/icon/icon";
import { Input } from "@/components/input/input";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/number-field/number-field";
import { Radio, RadioGroup } from "@/components/radio/radio";
import { Segment, SegmentedControl } from "@/components/segmented-control/segmented-control";
import { Slider, SliderControl, SliderThumb } from "@/components/slider/slider";
import { Switch } from "@/components/switch/switch";
import { Tab, Tabs, TabsList } from "@/components/tabs/tabs";

const meta = {
  title: "Foundations/Touch",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const row = "flex items-center gap-2.5 text-control text-fg-body";

/** A handful of the controls a thumb has to hit. */
function Controls({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex items-center gap-2">
        <Button variant="primary">Senden</Button>
        <Button size="sm">Entwurf</Button>
        <Button iconOnly variant="quiet" aria-label={`Löschen (${name})`}>
          <Icon icon={Delete02Icon} />
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <label className={row}>
          <Checkbox defaultChecked />
          Website
        </label>
        <label className={row}>
          <Checkbox />
          Google-Profil
        </label>
      </div>
      <RadioGroup defaultValue="fest" aria-label={`Preis (${name})`}>
        <label className={row}>
          <Radio value="fest" />
          Festpreis
        </label>
        <label className={row}>
          <Radio value="aufwand" />
          Nach Aufwand
        </label>
      </RadioGroup>
      <label className={row}>
        <Switch defaultChecked />
        Jährlich abrechnen
      </label>
      <SegmentedControl defaultValue="monat" aria-label={`Zeitraum (${name})`}>
        <Segment value="monat">Monat</Segment>
        <Segment value="jahr">Jahr</Segment>
      </SegmentedControl>
      <Tabs defaultValue="konto">
        <TabsList>
          <Tab value="konto">Konto</Tab>
          <Tab value="team">Team</Tab>
        </TabsList>
      </Tabs>
      <NumberField defaultValue={3} min={1} className="w-36">
        <NumberFieldDecrement />
        <NumberFieldInput aria-label={`Anzahl (${name})`} />
        <NumberFieldIncrement />
      </NumberField>
      <Input
        defaultValue="Schreinerei Mustermann"
        aria-label={`Betrieb (${name})`}
        className="w-56"
      />
      <Slider defaultValue={40} className="w-56">
        <SliderControl>
          <SliderThumb aria-label={`Rabatt (${name})`} />
        </SliderControl>
      </Slider>
    </div>
  );
}

const columns = [
  { name: "Maus", note: "wie am Schreibtisch", pointer: undefined },
  { name: "Finger", note: "gleiche Größe, unsichtbares 44-px-Ziel", pointer: "coarse" },
] as const;

/**
 * What a touch pointer changes: nothing you can see. Every control keeps its size, and whatever
 * is smaller than 44px gets an invisible target of that size around it (outlined here). On a
 * phone that happens by itself; `data-pointer="coarse"` forces it for the right-hand column, so
 * it can be judged on a desk.
 */
export const Targets: Story = {
  parameters: { visual: { viewport: { width: 640, height: 640 } } },
  render: () => (
    <div className="grid max-w-[600px] grid-cols-2 gap-8">
      {/* Only for this board: show where a press lands. */}
      <style>{`.touch-outline .touch-target::after { outline: 1px dashed var(--lf-accent); outline-offset: -1px; border-radius: 6px; pointer-events: none; }`}</style>
      {columns.map((column) => (
        <section
          key={column.name}
          data-pointer={column.pointer}
          className="touch-outline flex flex-col gap-5"
        >
          <header className="flex flex-col border-t-2 border-rule pt-2">
            <span className="text-control font-medium text-fg">{column.name}</span>
            <span className="text-sm text-fg-muted">{column.note}</span>
          </header>
          <Controls name={column.name} />
        </section>
      ))}
    </div>
  ),
};
