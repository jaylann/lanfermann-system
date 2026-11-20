import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/button/button";
import { Card, CardContent, CardFooter } from "@/components/card/card";
import { CheckboxCard } from "@/components/checkbox-card/checkbox-card";
import { CheckboxGroup } from "@/components/checkbox-group/checkbox-group";
import {
  Combobox,
  ComboboxChips,
  ComboboxContent,
  ComboboxItem,
  type ComboboxOption,
} from "@/components/combobox/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/field/field";
import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  FileUploadZone,
} from "@/components/file-upload/file-upload";
import { Grow } from "@/components/grow/grow";
import { Heading } from "@/components/heading/heading";
import { RadioGroup } from "@/components/radio/radio";
import { RadioCard } from "@/components/radio-card/radio-card";
import { Step, Steps } from "@/components/steps/steps";
import { Text } from "@/components/text/text";

const meta = {
  title: "Patterns/Onboarding",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 900, height: 760 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = [
  { title: "Tarif", question: "Welcher Tarif passt zu Ihrem Betrieb?" },
  { title: "Aufgaben", question: "Wofür nutzen Sie den Arbeitsbereich?" },
  { title: "Team", question: "Wer arbeitet mit?" },
  { title: "Logo", question: "Ihr Logo für Angebote und Rechnungen." },
];

type Person = ComboboxOption & { detail: string };

const PEOPLE: Person[] = [
  { value: "m.huber", label: "Maria Huber", detail: "Büro" },
  { value: "j.wagner", label: "Jonas Wagner", detail: "Werkstatt" },
  { value: "s.obermaier", label: "Sophie Obermaier", detail: "Buchhaltung" },
  { value: "t.sedlmayr", label: "Tobias Sedlmayr", detail: "Montage" },
  { value: "l.kornprobst", label: "Lena Kornprobst", detail: "Ausbildung" },
];

const statusAt = (index: number, current: number) =>
  index < current ? "done" : index === current ? "current" : "upcoming";

/** The body of one step. Each keeps what was entered while the others are shown. */
function StepBody({ step }: { step: number }) {
  const [team, setTeam] = useState<Person[]>(PEOPLE.slice(0, 2));
  const [people, setPeople] = useState(PEOPLE);
  const [logo, setLogo] = useState<{ name: string; size: number } | undefined>(undefined);
  if (step === 0) {
    return (
      <RadioGroup aria-label="Tarif" defaultValue="team" className="gap-3">
        <RadioCard
          value="solo"
          title="Solo"
          detail="12 € im Monat"
          description="Für eine Person. Angebote, Rechnungen und ein Postfach."
        />
        <RadioCard
          value="team"
          title="Team"
          detail="29 € im Monat"
          description="Bis zu zehn Personen, gemeinsame Vorlagen und Freigaben."
        />
        <RadioCard
          value="betrieb"
          title="Betrieb"
          detail="79 € im Monat"
          description="Beliebig viele Personen, mehrere Standorte und DATEV-Export."
        />
      </RadioGroup>
    );
  }
  if (step === 1) {
    return (
      <CheckboxGroup
        aria-label="Aufgaben"
        defaultValue={["angebote", "rechnungen"]}
        className="grid gap-3 sm:grid-cols-2"
      >
        <CheckboxCard
          value="angebote"
          title="Angebote schreiben"
          description="Vorlagen, Positionen und die Freigabe durch die Kundin."
        />
        <CheckboxCard
          value="rechnungen"
          title="Rechnungen stellen"
          description="Aus einem Angebot, mit Zahlungsziel und Mahnung."
        />
        <CheckboxCard
          value="zeiten"
          title="Zeiten erfassen"
          description="Stunden je Auftrag, als Grundlage für die Rechnung."
        />
        <CheckboxCard
          value="belege"
          title="Belege sammeln"
          description="Quittungen fotografieren und der Steuerberatung übergeben."
        />
      </CheckboxGroup>
    );
  }
  if (step === 2) {
    return (
      <Field>
        <FieldLabel>Einladen</FieldLabel>
        <Combobox
          multiple
          items={people}
          locale="de-DE"
          value={team}
          onValueChange={setTeam}
          onCreate={(address) => {
            const person = { value: address, label: address, detail: "Neu" };
            setPeople((all) => [...all, person]);
            return person;
          }}
          createLabel={(address) => `„${address}“ einladen`}
        >
          <ComboboxChips placeholder="z. B. maria@schreinerei-huber.de" />
          <ComboboxContent empty="Niemand gefunden.">
            {(person: Person) => <ComboboxItem key={person.value} value={person} />}
          </ComboboxContent>
        </Combobox>
        <FieldDescription>
          Alle bekommen eine E-Mail mit einem Link. Sie können das auch später tun.
        </FieldDescription>
      </Field>
    );
  }
  return (
    <FileUpload
      accept=".png,.jpg,.jpeg,.svg"
      maxSize={2_000_000}
      onFilesAdded={([file]) => file && setLogo({ name: file.name, size: file.size })}
    >
      <FileUploadZone
        title="Logo hierher ziehen"
        description="PNG, JPG oder SVG, höchstens 2 MB"
        buttonLabel="Datei auswählen"
      />
      <FileUploadList aria-label="Logo">
        {logo && (
          <FileUploadItem
            key={logo.name}
            name={logo.name}
            size={logo.size}
            onRemove={() => setLogo(undefined)}
          />
        )}
      </FileUploadList>
    </FileUpload>
  );
}

function SetUp({ start = 0 }: { start?: number }) {
  const [step, setStep] = useState(start);
  const last = step === STEPS.length - 1;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2">
        <Heading level={1}>Arbeitsbereich einrichten.</Heading>
        <Text tone="muted">Vier Schritte, etwa zwei Minuten. Alles lässt sich später ändern.</Text>
      </div>

      <Steps aria-label="Einrichtung">
        {STEPS.map((entry, index) => (
          <Step key={entry.title} status={statusAt(index, step)} title={entry.title} />
        ))}
      </Steps>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <Heading level={2} size="sub">
            {STEPS[step]?.question}
          </Heading>
          {/* The card follows the height of the step it shows. The cards of a step cast shadows
              and wear an edge outside their box: the block keeps room for them, so nothing is
              cut while it moves. */}
          <Grow className="-my-5" contentClassName="py-5">
            <StepBody step={step} />
          </Grow>
        </CardContent>
        <CardFooter className="flex justify-between gap-2 px-6 py-4">
          <Button variant="quiet" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Zurück
          </Button>
          <Button
            variant="primary"
            data-step="next"
            onClick={() => setStep(last ? step : step + 1)}
          >
            {last ? "Einrichtung abschließen" : "Weiter"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

/**
 * A set-up in four steps: where one stands above, the question of the step in a card, the way
 * on and back at its foot. Press "Weiter": the mark closes, the line fills, and the card eases
 * to the height of the next step. A test board for the parts together, not a template.
 */
export const Onboarding: Story = {
  parameters: {
    visual: {
      target: '[data-step="next"]',
      motion: [{ name: "next", click: '[data-step="next"]', frames: 8 }],
    },
  },
  render: () => <SetUp />,
};

/** The second step: several answers may be chosen. */
export const Tasks: Story = { render: () => <SetUp start={1} /> };

/** The third step: people from a list, or an address that is not in it yet. */
export const Team: Story = { render: () => <SetUp start={2} /> };

/** The last step: one file, dropped or chosen. */
export const Logo: Story = { render: () => <SetUp start={3} /> };

/** On a phone only the current step is named, and the cards stand one under the other. */
export const Phone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 844 } } },
  render: () => <SetUp start={1} />,
};
