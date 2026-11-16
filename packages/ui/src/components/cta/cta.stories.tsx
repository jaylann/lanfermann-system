import { BookOpen01Icon, GithubIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { Field, FieldError, FieldLabel } from "@/components/field/field";
import { Icon } from "@/components/icon/icon";
import { Input } from "@/components/input/input";
import { Textarea } from "@/components/textarea/textarea";

import {
  Cta,
  CtaAction,
  type CtaActionProps,
  CtaActions,
  CtaMessage,
  CtaText,
  CtaTitle,
  type CtaTone,
} from "./cta";

/*
 * The title and the text are a real closing ask, kept word for word. The field labels and the
 * example are defaults written for these stories.
 */
const title = "Erzähl mir von deinem Produkt.";
const text =
  "Das erste Gespräch kostet nichts. Ich antworte auf jede Nachricht und sage dir auch, wenn es nicht passt.";

const meta = {
  title: "Components/Cta",
  component: Cta,
  parameters: {
    layout: "fullscreen",
    visual: {
      viewport: { width: 1100, height: 360 },
      target: '[data-slot="cta-action"]',
    },
  },
} satisfies Meta<typeof Cta>;

export default meta;
type Story = StoryObj<typeof meta>;

function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[72rem] px-5 py-12 sm:px-8">{children}</div>;
}

function Joint({
  main = "primary",
  two = false,
  tone,
}: {
  main?: CtaActionProps["variant"];
  two?: boolean;
  tone?: CtaTone;
}) {
  return (
    <Cta tone={tone}>
      <CtaTitle>{title}</CtaTitle>
      <CtaText>{text}</CtaText>
      <CtaActions>
        <CtaAction href="#nachricht" variant={main}>
          Nachricht schreiben
        </CtaAction>
        {two && (
          <CtaAction href="#gespraech" variant="secondary">
            Gespräch ausmachen
          </CtaAction>
        )}
      </CtaActions>
    </Cta>
  );
}

/** The last thing on a page: the ask's block, its action seated in the cut. */
export const Default: Story = {
  render: () => (
    <Page>
      <Joint />
    </Page>
  ),
};

/** A second, quieter action beside the first. At most two. */
export const TwoActions: Story = {
  render: () => (
    <Page>
      <Joint two />
    </Page>
  ),
};

/** The first action's colour: the dark key, the Indigo ask, or the white key. */
export const Colours: Story = {
  parameters: { visual: { viewport: { width: 1100, height: 900 } } },
  render: () => (
    <Page>
      <div className="flex flex-col gap-12">
        <Joint main="primary" two />
        <Joint main="ask" two />
        <Joint main="secondary" />
      </div>
    </Page>
  ),
};

/** The block's colour: the ask (the default), the dark key, or the white face. */
export const Tones: Story = {
  parameters: { visual: { viewport: { width: 1100, height: 900 } } },
  render: () => (
    <Page>
      <div className="flex flex-col gap-12">
        <Joint tone="accent" two />
        <Joint tone="key" main="ask" two />
        <Joint tone="raised" two />
      </div>
    </Page>
  ),
};

/**
 * Two actions that lead to different kinds of place each carry a symbol: the mark of the site
 * the first one opens (it leaves this one, so its arrow points out), a book for documentation.
 */
export const Icons: Story = {
  render: () => (
    <Page>
      <Cta>
        <CtaTitle>Der Code ist öffentlich.</CtaTitle>
        <CtaText>Wenn dir etwas auffällt, leg ein Issue an. Ich lese es und antworte.</CtaText>
        <CtaActions>
          <CtaAction href="#code" icon={<Icon icon={GithubIcon} size={18} />} arrow="out">
            Code ansehen
          </CtaAction>
          <CtaAction
            href="#dokumentation"
            variant="secondary"
            icon={<Icon icon={BookOpen01Icon} size={18} />}
          >
            Dokumentation lesen
          </CtaAction>
        </CtaActions>
      </Cta>
    </Page>
  ),
};

/**
 * On a phone there is no cut: the two buttons stand inside the block at its foot, one over the
 * other at its full width.
 */
export const OnAPhone: Story = {
  parameters: { visual: { viewport: { width: 390, height: 560 } } },
  render: () => (
    <Page>
      <Joint two />
    </Page>
  ),
};

function Letter({ action, sent }: { action: (data: FormData) => Promise<void>; sent?: boolean }) {
  return (
    <CtaMessage
      action={action}
      sent={sent}
      recipient="An Justin Lanfermann"
      initials="JL"
      secondAction={
        <CtaAction href="#gespraech" variant="quiet">
          Gespräch ausmachen
        </CtaAction>
      }
      sentText="Ich antworte auf jede Nachricht."
    >
      <CtaTitle>{title}</CtaTitle>
      <CtaText>{text}</CtaText>
      <Field name="vorhaben">
        <FieldLabel>Dein Vorhaben</FieldLabel>
        <Textarea required rows={3} placeholder="z. B. Eine App, mit der Kunden Termine buchen" />
        <FieldError match="valueMissing">
          Bitte beschreib dein Vorhaben in ein paar Worten.
        </FieldError>
      </Field>
      <Field name="email">
        <FieldLabel>E-Mail-Adresse</FieldLabel>
        <Input type="email" required placeholder="z. B. lena@beispiel.de" />
        <FieldError match="valueMissing">Bitte gib eine E-Mail-Adresse ein.</FieldError>
        <FieldError match="typeMismatch">
          Bitte gib eine vollständige E-Mail-Adresse ein.
        </FieldError>
      </Field>
    </CtaMessage>
  );
}

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/** The letter already begun: written and sent from where it stands. */
export const Message: Story = {
  parameters: { visual: { viewport: { width: 800, height: 620 } } },
  render: () => (
    <Page>
      <Letter action={() => wait(900)} />
    </Page>
  ),
};

/** Sent: the sheet says so in place, with a drawn tick, and keeps its height. */
export const MessageSent: Story = {
  parameters: { visual: { viewport: { width: 800, height: 620 } } },
  render: () => (
    <Page>
      <Letter action={() => wait(0)} sent />
    </Page>
  ),
};

/** The keyboard reaches the first action, then the second. */
export const Keyboard: Story = {
  render: () => (
    <Page>
      <Joint two />
    </Page>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Nachricht schreiben" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Gespräch ausmachen" })).toHaveFocus();
  },
};

const send = fn(async () => {
  await wait(50);
});

/** A message is only sent once its fields are filled; then it is sent and confirmed. */
export const MessageKeyboard: Story = {
  render: () => (
    <Page>
      <Letter action={send} />
    </Page>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Nachricht senden" }));
    await expect(send).not.toHaveBeenCalled();
    await userEvent.type(canvas.getByLabelText("Dein Vorhaben"), "Eine App für Terminbuchungen");
    await userEvent.type(canvas.getByLabelText("E-Mail-Adresse"), "lena@beispiel.de");
    await userEvent.click(canvas.getByRole("button", { name: "Nachricht senden" }));
    await waitFor(() => expect(send).toHaveBeenCalledOnce());
    await waitFor(() => expect(canvas.getByText("Die Nachricht wurde gesendet.")).toBeVisible());
  },
};
