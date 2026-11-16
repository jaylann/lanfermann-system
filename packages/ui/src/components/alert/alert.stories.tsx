import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, AlertDescription, AlertTitle } from "./alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "padded", visual: { viewport: { width: 620, height: 560 } } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What happened in the title, what to do in the description. */
export const Tones: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Alert>
        <AlertTitle>Ihr Angebot ist als Entwurf gespeichert.</AlertTitle>
        <AlertDescription>Nur Sie können es sehen, bis Sie es senden.</AlertDescription>
      </Alert>
      <Alert tone="info">
        <AlertTitle>Die Analyse dauert etwa zwei Werktage.</AlertTitle>
        <AlertDescription>Wir melden uns per E-Mail, sobald sie fertig ist.</AlertDescription>
      </Alert>
      <Alert tone="success">
        <AlertTitle>Die Rechnung ist bezahlt.</AlertTitle>
        <AlertDescription>Der Beleg liegt in Ihren Dokumenten.</AlertDescription>
      </Alert>
      <Alert tone="warning">
        <AlertTitle>Ihr Tarif endet am 30. November.</AlertTitle>
        <AlertDescription>
          Verlängern Sie bis dahin, damit Ihre Website online bleibt.
        </AlertDescription>
      </Alert>
      <Alert tone="danger" role="alert">
        <AlertTitle>Das Angebot konnte nicht gesendet werden.</AlertTitle>
        <AlertDescription>Prüfen Sie die E-Mail-Adresse und senden Sie es erneut.</AlertDescription>
      </Alert>
    </div>
  ),
};
