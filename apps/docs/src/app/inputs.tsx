"use client";

import {
  Button,
  CheckboxCard,
  CheckboxGroup,
  Combobox,
  ComboboxChips,
  ComboboxContent,
  ComboboxItem,
  type ComboboxOption,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  CopyButton,
  Field,
  FieldLabel,
  FileUpload,
  FileUploadItem,
  FileUploadList,
  FileUploadZone,
  MenuItem,
  OtpField,
  RadioCard,
  RadioGroup,
  SecretField,
  Step,
  Steps,
  Toggle,
  ToggleGroup,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from "@lanfermann/ui";
import { useState } from "react";

const LABELS: ComboboxOption[] = [
  { value: "dringend", label: "Dringend" },
  { value: "stammkunde", label: "Stammkunde" },
  { value: "neukunde", label: "Neukunde" },
];

/**
 * The inputs of an app, each once, from the built library: several values in one field, a
 * one-time code, a file, choices as cards, the steps of a set-up, a key that stays hidden, a
 * context menu and a toolbar. A client component: most of them hold state or take functions.
 * The labels carry the ground's name, because the page draws every ground.
 */
export function Inputs({ ground }: { ground: string }) {
  const [files, setFiles] = useState<{ name: string; size: number }[]>([
    { name: "Angebot-2026-0421.pdf", size: 2_400_000 },
  ]);
  return (
    <div className="flex flex-col gap-6">
      <Steps aria-label={`Einrichtung (${ground})`}>
        <Step status="done" title="Konto" href={`#konto-${ground}`} />
        <Step status="current" title="Tarif" />
        <Step status="upcoming" title="Team" />
      </Steps>

      <RadioGroup
        aria-label={`Tarif (${ground})`}
        defaultValue="team"
        className="grid gap-3 sm:grid-cols-2"
      >
        <RadioCard value="solo" title="Solo" detail="12 €" description="Für eine Person." />
        <RadioCard value="team" title="Team" detail="29 €" description="Bis zu zehn Personen." />
      </RadioGroup>

      <CheckboxGroup
        aria-label={`Aufgaben (${ground})`}
        defaultValue={["angebote"]}
        className="grid gap-3 sm:grid-cols-2"
      >
        <CheckboxCard value="angebote" title="Angebote" description="Vorlagen und Freigaben." />
        <CheckboxCard value="rechnungen" title="Rechnungen" description="Mit Zahlungsziel." />
      </CheckboxGroup>

      <Field>
        <FieldLabel>Schlagwörter</FieldLabel>
        <Combobox multiple items={LABELS} locale="de-DE" defaultValue={LABELS.slice(0, 1)}>
          <ComboboxChips placeholder="z. B. Stammkunde" />
          <ComboboxContent>
            {(label: ComboboxOption) => <ComboboxItem key={label.value} value={label} />}
          </ComboboxContent>
        </Combobox>
      </Field>

      <Field>
        <FieldLabel>Bestätigungscode</FieldLabel>
        <OtpField defaultValue="482" />
      </Field>

      <Field>
        <FieldLabel>Geheimer Schlüssel</FieldLabel>
        <SecretField value="lf_live_9fK2mQ7xLr4TzVb81NcYd3Ha" visibleStart={8} />
      </Field>

      <FileUpload
        multiple
        accept=".pdf,.png"
        maxSize={10_000_000}
        onFilesAdded={(added) =>
          setFiles((all) => [
            ...all,
            ...added.map((file) => ({ name: file.name, size: file.size })),
          ])
        }
      >
        <FileUploadZone description="PDF oder PNG, höchstens 10 MB" />
        <FileUploadList aria-label={`Dateien (${ground})`}>
          {files.map((file) => (
            <FileUploadItem
              key={file.name}
              name={file.name}
              size={file.size}
              onRemove={() => setFiles((all) => all.filter((each) => each.name !== file.name))}
            />
          ))}
        </FileUploadList>
      </FileUpload>

      <Toolbar aria-label={`Text formatieren (${ground})`}>
        <ToggleGroup multiple size="sm" aria-label={`Auszeichnung (${ground})`}>
          <Toggle value="bold">Fett</Toggle>
          <Toggle value="italic">Kursiv</Toggle>
        </ToggleGroup>
        <ToolbarSeparator />
        <ToolbarButton>Link einfügen</ToolbarButton>
        <Toggle variant="quiet" size="sm">
          Anheften
        </Toggle>
      </Toolbar>

      <div className="flex flex-wrap items-center gap-4">
        <ContextMenu>
          <ContextMenuTrigger className="rounded-md px-3 py-2 text-control text-fg-body inset-ring inset-ring-hairline">
            Angebot 2026-0421 (Rechtsklick)
          </ContextMenuTrigger>
          <ContextMenuContent aria-label={`Angebot 2026-0421 (${ground})`}>
            <MenuItem>Duplizieren</MenuItem>
            <MenuItem>Archivieren</MenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <CopyButton text="https://portal.lanfermann.dev/einladung/7f3k-92qa" variant="secondary">
          Link kopieren
        </CopyButton>
        <Button variant="quiet">Weiter</Button>
      </div>
    </div>
  );
}
