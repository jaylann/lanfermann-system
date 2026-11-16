import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";

import { Alert, AlertDescription, AlertTitle } from "@/components/alert/alert";
import { Button } from "@/components/button/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/field/field";
import { Input } from "@/components/input/input";

import { Form } from "./form";

const meta = {
  title: "Components/Form",
  component: Form,
  parameters: { visual: { viewport: { width: 420, height: 480 } } },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

type Request = { email: string; business: string; code: string };

/** Stands in for the server: it knows one voucher code that has run out. */
async function send(
  request: Request,
): Promise<{ errors?: Partial<Record<keyof Request, string>> }> {
  await new Promise((done) => setTimeout(done, 400));
  if (request.code.trim().toUpperCase() === "HERBST25") {
    return {
      errors: { code: "Dieser Gutscheincode ist abgelaufen. Bitte geben Sie einen anderen ein." },
    };
  }
  return {};
}

function RequestForm(props: { initialErrors?: Partial<Record<keyof Request, string>> }) {
  const [errors, setErrors] = useState(props.initialErrors ?? {});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (values: Request) => {
    setSending(true);
    setSent(false);
    const response = await send(values);
    setErrors(response.errors ?? {});
    setSent(!response.errors);
    setSending(false);
  };
  return (
    <Form<Request> className="w-80" errors={errors} onFormSubmit={(values) => void submit(values)}>
      {/* Checked as soon as it is left: a mistyped address is worth knowing early. */}
      <Field name="email" validationMode="onBlur">
        <FieldLabel>E-Mail-Adresse</FieldLabel>
        <Input type="email" required placeholder="z. B. max@schreinerei-huber.de" />
        <FieldError match="typeMismatch">
          Bitte geben Sie eine vollständige E-Mail-Adresse ein.
        </FieldError>
        <FieldError match="valueMissing">Bitte geben Sie Ihre E-Mail-Adresse ein.</FieldError>
      </Field>
      {/* Required, and silent until the form is sent. */}
      <Field name="business">
        <FieldLabel>Betrieb</FieldLabel>
        <Input required placeholder="z. B. Schreinerei Huber" />
        <FieldError match="valueMissing">Bitte geben Sie den Namen Ihres Betriebs ein.</FieldError>
      </Field>
      {/* Only the server can judge this one: its answer arrives through `errors`. */}
      <Field name="code">
        <FieldLabel>Gutscheincode</FieldLabel>
        <Input defaultValue={props.initialErrors ? "HERBST25" : undefined} autoComplete="off" />
        <FieldError />
        <FieldDescription>Falls Sie einen haben.</FieldDescription>
      </Field>
      <Button type="submit" variant="primary" loading={sending} className="self-start">
        Angebot anfordern
      </Button>
      {sent && (
        <Alert tone="success">
          <AlertTitle>Anfrage gesendet.</AlertTitle>
          <AlertDescription>
            Sie erhalten Ihr Angebot innerhalb von zwei Werktagen.
          </AlertDescription>
        </Alert>
      )}
    </Form>
  );
}

/**
 * Three kinds of checking in one form. The address is checked when its field is left. The
 * business is required but only complains on submit. The voucher code "HERBST25" is rejected
 * by the server, and that error goes away as soon as the code is changed.
 */
export const Default: Story = { render: () => <RequestForm /> };

/** What the server rejected stands under its field, like any other error. */
export const ServerError: Story = {
  render: () => (
    <RequestForm
      initialErrors={{
        code: "Dieser Gutscheincode ist abgelaufen. Bitte geben Sie einen anderen ein.",
      }}
    />
  ),
};

/**
 * As a test: tabbing through a required field raises nothing, submitting does and puts the
 * focus on the first invalid field, and a server error clears when its field is changed.
 */
export const Keyboard: Story = {
  render: () => <RequestForm />,
  play: async ({ canvas, userEvent, step }) => {
    const email = canvas.getByLabelText("E-Mail-Adresse");
    const business = canvas.getByLabelText("Betrieb");
    const code = canvas.getByLabelText("Gutscheincode");
    const submit = canvas.getByRole("button", { name: "Angebot anfordern" });

    await step("Tabbing through the required fields raises no error", async () => {
      await userEvent.tab();
      await expect(email).toHaveFocus();
      await userEvent.tab();
      await userEvent.tab();
      await expect(code).toHaveFocus();
      await expect(canvas.queryByText(/Bitte geben Sie/)).not.toBeInTheDocument();
    });

    await step("A mistyped address is caught when its field is left", async () => {
      await userEvent.type(email, "max@");
      await userEvent.tab();
      await waitFor(() =>
        expect(
          canvas.getByText("Bitte geben Sie eine vollständige E-Mail-Adresse ein."),
        ).toBeVisible(),
      );
      await userEvent.type(email, "schreinerei-huber.de");
      await userEvent.tab();
      await waitFor(() =>
        expect(canvas.queryByText(/vollständige E-Mail-Adresse/)).not.toBeInTheDocument(),
      );
    });

    await step("Submitting names the missing field and puts the focus there", async () => {
      await userEvent.click(submit);
      await waitFor(() =>
        expect(canvas.getByText("Bitte geben Sie den Namen Ihres Betriebs ein.")).toBeVisible(),
      );
      await expect(business).toHaveFocus();
    });

    await step("The server's error stands under its field", async () => {
      await userEvent.type(business, "Schreinerei Huber");
      await userEvent.type(code, "herbst25");
      await userEvent.click(submit);
      await waitFor(() =>
        expect(canvas.getByText(/Dieser Gutscheincode ist abgelaufen/)).toBeVisible(),
      );
      await expect(code).toHaveAttribute("aria-invalid", "true");
    });

    await step("Changing the field clears it, and the next submit goes through", async () => {
      await userEvent.clear(code);
      await waitFor(() =>
        expect(canvas.queryByText(/Dieser Gutscheincode ist abgelaufen/)).not.toBeInTheDocument(),
      );
      await userEvent.click(submit);
      await waitFor(() => expect(canvas.getByText("Anfrage gesendet.")).toBeVisible());
    });
  },
};
