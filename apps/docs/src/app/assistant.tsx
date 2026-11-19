"use client";

import {
  Attachment,
  Conversation,
  ConversationContent,
  ConversationLatest,
  CopyButton,
  Message,
  MessageActions,
  MessageAttachments,
  MessageContent,
  MessageFeedback,
  PromptInput,
  PromptInputActions,
  PromptInputAttach,
  PromptInputAttachments,
  PromptInputSubmit,
  PromptInputTextarea,
  SourceList,
  SourceReference,
  Sources,
} from "@lanfermann/ui";
import { useState } from "react";

const SOURCES = [
  {
    title: "Angebot 2026-0421: Website für die Bäckerei Kornprobst",
    url: "https://angebote.lanfermann.dev/2026-0421",
    site: "Angebote",
    excerpt: "Gültig bis 15. Dezember 2026. Alle Preise netto.",
  },
];

/**
 * The parts of an assistant, once per ground: a conversation with a question and its sourced
 * answer, and the prompt under it. They hold state and take functions, so they stand in a
 * client component of their own.
 */
export function Assistant({ ground }: { ground: string }) {
  const [running, setRunning] = useState(false);
  const [files, setFiles] = useState([
    { id: "1", name: "Angebot-Kornprobst.pdf", size: 2_400_000, type: "application/pdf" },
  ]);
  return (
    <div className="flex flex-col gap-4">
      <Conversation className="h-80">
        <ConversationContent label={`Unterhaltung (${ground})`} className="pb-4">
          <Message from="user">
            <MessageAttachments>
              <Attachment name="Entwurf-Startseite.pdf" size={1_200_000} type="application/pdf" />
            </MessageAttachments>
            <MessageContent>Bis wann gilt das Angebot für die Bäckerei Kornprobst?</MessageContent>
          </Message>
          <Message from="assistant">
            <Sources items={SOURCES}>
              <MessageContent>
                <p>
                  Das Angebot gilt bis zum 15. Dezember 2026.
                  <SourceReference n={1} />
                </p>
              </MessageContent>
              <SourceList />
            </Sources>
            <MessageActions>
              <CopyButton
                text="Das Angebot gilt bis zum 15. Dezember 2026."
                size="sm"
                copyLabel="Antwort kopieren"
              />
              <MessageFeedback />
            </MessageActions>
          </Message>
        </ConversationContent>
        <ConversationLatest />
      </Conversation>
      <PromptInput
        running={running}
        onSubmit={() => setRunning(true)}
        onStop={() => setRunning(false)}
        onFilesAdded={(added) =>
          setFiles((all) => [
            ...all,
            ...added.map((file, index) => ({
              id: `${all.length + index + 1}`,
              name: file.name,
              size: file.size,
              type: file.type,
            })),
          ])
        }
      >
        <PromptInputAttachments label={`Anhänge (${ground})`}>
          {files.map((file) => (
            <Attachment
              key={file.id}
              {...file}
              onRemove={() => setFiles((all) => all.filter(({ id }) => id !== file.id))}
            />
          ))}
        </PromptInputAttachments>
        <PromptInputTextarea label={`Nachricht an die KI (${ground})`} />
        <PromptInputActions>
          <PromptInputAttach />
          <PromptInputSubmit />
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
