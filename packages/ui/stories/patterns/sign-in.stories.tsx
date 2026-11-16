import { Mail01Icon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/button/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card/card";
import { Checkbox } from "@/components/checkbox/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/field/field";
import { Form } from "@/components/form/form";
import { Icon } from "@/components/icon/icon";
import { Input } from "@/components/input/input";
import { Link } from "@/components/link/link";
import { Wordmark } from "@/components/logo/wordmark";
import { Separator } from "@/components/separator/separator";

const meta = {
  title: "Patterns/Sign in",
  parameters: {
    layout: "fullscreen",
    visual: { viewport: { width: 520, height: 720 }, clip: "viewport" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Credentials = { email: string; password: string; remember?: boolean };

const WRONG_PASSWORD = "Das Passwort stimmt nicht. Bitte geben Sie es erneut ein.";

/** Stands in for the server: one password is right. */
async function signIn(values: Credentials): Promise<{ password?: string }> {
  await new Promise((done) => setTimeout(done, 400));
  return values.password === "werkstatt-2026" ? {} : { password: WRONG_PASSWORD };
}

function SignInCard() {
  // The story opens on the answer to a first, failed attempt.
  const [errors, setErrors] = useState<{ password?: string }>({ password: WRONG_PASSWORD });
  const [pending, setPending] = useState(false);
  const submit = async (values: Credentials) => {
    setPending(true);
    setErrors(await signIn(values));
    setPending(false);
  };
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Bei Lanfermann anmelden.</CardTitle>
        <CardDescription>Willkommen zurück.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form<Credentials> errors={errors} onFormSubmit={(values) => void submit(values)}>
          <Field name="email">
            <FieldLabel>E-Mail-Adresse</FieldLabel>
            <Input
              type="email"
              required
              autoComplete="email"
              defaultValue="max@schreinerei-mustermann.de"
            />
            <FieldError match="valueMissing">Bitte geben Sie Ihre E-Mail-Adresse ein.</FieldError>
            <FieldError match="typeMismatch">
              Bitte geben Sie eine vollständige E-Mail-Adresse ein.
            </FieldError>
          </Field>
          {/* Its own check and the server's answer share one error line. */}
          <Field
            name="password"
            validate={(value) => (value ? null : "Bitte geben Sie Ihr Passwort ein.")}
          >
            <FieldLabel>Passwort</FieldLabel>
            <Input
              type="password"
              aria-required
              autoComplete="current-password"
              defaultValue="geheim"
            />
            <FieldError />
          </Field>
          <label className="flex items-center gap-2.5 text-control text-fg-body">
            <Checkbox name="remember" defaultChecked />
            Angemeldet bleiben
          </label>
          <Button type="submit" variant="primary" loading={pending}>
            Anmelden
          </Button>
          <div className="flex items-center gap-3 text-sm text-fg-muted">
            <Separator className="flex-1" />
            oder
            <Separator className="flex-1" />
          </div>
          <Button>
            <Icon icon={Mail01Icon} />
            Link per E-Mail senden
          </Button>
        </Form>
      </CardContent>
      <CardFooter>
        Noch kein Konto?
        <Link href="#registrieren">Registrieren</Link>
      </CardFooter>
    </Card>
  );
}

/**
 * The wordmark, then one card with one committed action. The second route is quieter, the third
 * is a link. The form submits through `Form`: the wrong password is the server's answer, shown
 * under its field.
 */
export const SignIn: Story = {
  render: () => (
    <div className="flex min-h-[720px] flex-col items-center justify-center gap-8 p-6">
      {/* The wordmark stands alone above the card, with more than its clear space around it. */}
      <Wordmark size={24} />
      <SignInCard />
    </div>
  ),
};
