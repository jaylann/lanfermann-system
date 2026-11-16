import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, AlertDescription, AlertTitle } from "@/components/alert/alert";
import { Badge } from "@/components/badge/badge";
import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Fieldset, FieldsetLegend } from "@/components/fieldset/fieldset";
import { Form } from "@/components/form/form";
import { Heading } from "@/components/heading/heading";
import { Input } from "@/components/input/input";
import { Radio, RadioGroup } from "@/components/radio/radio";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select/select";
import { Separator } from "@/components/separator/separator";
import { Switch } from "@/components/switch/switch";
import { Tab, Tabs, TabsList, TabsPanel } from "@/components/tabs/tabs";
import { Text } from "@/components/text/text";
import { Textarea } from "@/components/textarea/textarea";
import { toast, Toaster } from "@/components/toast/toast";

const meta = {
  title: "Patterns/Settings",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 860, height: 1180 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const TRADES = [
  { value: "schreinerei", label: "Schreinerei" },
  { value: "baeckerei", label: "Bäckerei" },
  { value: "metzgerei", label: "Metzgerei" },
  { value: "friseur", label: "Friseursalon" },
];

function Setting({ title, hint, on }: { title: string; hint: string; on?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-6 py-3">
      <span className="flex flex-col">
        <span className="text-control font-medium text-fg">{title}</span>
        <span className="text-sm text-fg-muted">{hint}</span>
      </span>
      <Switch defaultChecked={on} />
    </label>
  );
}

/**
 * A page of settings without a single box: a rule opens each block, lines divide its rows, and
 * only the things a hand operates are raised. The block is one `Form`: saving answers with a
 * toast, "Verwerfen" resets the fields.
 */
export const Settings: Story = {
  render: () => (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Heading level={1}>Einstellungen.</Heading>
          <Badge tone="success">Tarif Werkstatt</Badge>
        </div>
        <Text tone="muted">Schreinerei Mustermann, Rosenheim</Text>
      </div>

      <Tabs defaultValue="betrieb" className="gap-8">
        <TabsList>
          <Tab value="betrieb">Betrieb</Tab>
          <Tab value="team">Team</Tab>
          <Tab value="abrechnung">Abrechnung</Tab>
          <Tab value="benachrichtigungen">Benachrichtigungen</Tab>
        </TabsList>

        <TabsPanel value="betrieb">
          <Form className="gap-10" onFormSubmit={() => void toast("Änderungen gespeichert.")}>
            <Alert tone="warning">
              <AlertTitle>Ihr Tarif endet am 30. November.</AlertTitle>
              <AlertDescription>
                Verlängern Sie bis dahin, damit Ihre Website online bleibt.
              </AlertDescription>
            </Alert>

            <section className="flex flex-col gap-5">
              <Separator variant="rule" />
              <Heading level={2}>Stammdaten.</Heading>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="business">
                  <FieldLabel>Betrieb</FieldLabel>
                  <Input required defaultValue="Schreinerei Mustermann" />
                  <FieldError match="valueMissing">
                    Bitte geben Sie den Namen Ihres Betriebs ein.
                  </FieldError>
                  <FieldDescription>So erscheint Ihr Name auf Angeboten.</FieldDescription>
                </Field>
                <Field name="trade">
                  <FieldLabel nativeLabel={false} render={<div />}>
                    Gewerk
                  </FieldLabel>
                  <Select items={TRADES} defaultValue="schreinerei">
                    <SelectTrigger className="w-full" />
                    <SelectContent>
                      {TRADES.map((trade) => (
                        <SelectItem key={trade.value} value={trade.value}>
                          {trade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field name="about">
                <FieldLabel>Über den Betrieb</FieldLabel>
                <Textarea
                  autoGrow
                  defaultValue="Wir sind eine Schreinerei mit acht Leuten in Rosenheim und bauen Küchen, Einbauschränke und Treppen nach Maß."
                />
                <FieldDescription>Steht auf Ihrer Website unter „Über uns“.</FieldDescription>
              </Field>
            </section>

            <section className="flex flex-col gap-5">
              <Separator variant="rule" />
              <Heading level={2}>Angebote.</Heading>
              <Fieldset>
                <FieldsetLegend className="text-control font-medium">Abrechnung</FieldsetLegend>
                <RadioGroup
                  defaultValue="festpreis"
                  aria-label="Abrechnung"
                  className="flex-row flex-wrap gap-x-6"
                >
                  <label className="flex items-center gap-2.5 text-control text-fg-body">
                    <Radio value="festpreis" />
                    Festpreis
                  </label>
                  <label className="flex items-center gap-2.5 text-control text-fg-body">
                    <Radio value="aufwand" />
                    Nach Aufwand
                  </label>
                </RadioGroup>
              </Fieldset>
              <div className="flex flex-col">
                <Separator />
                <Setting
                  on
                  title="Angebote online annehmen"
                  hint="Kunden bestätigen per Link statt per Unterschrift."
                />
                <Separator />
                <Setting
                  title="Erinnerung nach sieben Tagen"
                  hint="Wir fragen einmal nach, wenn ein Angebot offen bleibt."
                />
                <Separator />
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Button type="reset" variant="quiet">
                Verwerfen
              </Button>
              <Button type="submit" variant="primary">
                Änderungen speichern
              </Button>
            </div>
          </Form>
        </TabsPanel>
      </Tabs>
      <Toaster />
    </div>
  ),
};
