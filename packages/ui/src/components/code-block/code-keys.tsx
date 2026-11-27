"use client";

import { Download01Icon, TextWrapIcon } from "@hugeicons/core-free-icons";
import { type RefObject, useEffect, useRef, useState } from "react";

import { Button } from "@/components/button/button";
import { Icon } from "@/components/icon/icon";
import { Toggle } from "@/components/toggle/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { COPY_SHOWN_MS, CopyMarks } from "@/internal/copy";
import { cn } from "@/lib/cn";
import { useLocale } from "@/locale/locale";

import { CodeCopy, type CodeCopyLabels } from "./code-copy";

/** The two keys a block of code may carry beside its copy, and their words. */
export type CodeKeyOptions = CodeCopyLabels & {
  /**
   * Adds a key that saves the code as a file: for a whole file a reader will keep (a
   * configuration, a script), not for a snippet. `true` names the file after the block's title;
   * a string is the file's name.
   */
  download?: boolean | string;
  /** The key's name and its tooltip. */
  downloadLabel?: string;
  /** The tooltip once the file is on its way. */
  downloadedLabel?: string;
  /** Read out once: a full sentence. */
  downloadedMessage?: string;
  /**
   * Adds a key that lets the reader break long lines instead of scrolling them sideways, and
   * back. `wrap` says how the block starts.
   */
  wrapToggle?: boolean;
  /** The key's name and its tooltip. It is a toggle: pressed while lines break. */
  wrapLabel?: string;
};

type CodeKeysProps = CodeKeyOptions & {
  /** The text that is copied and saved: the code as it stands after a change. */
  text: string;
  /** The code on screen, for the copy to select when the clipboard is refused. */
  codeRef: RefObject<HTMLElement | null>;
  /** The file's name when `download` is `true`. */
  fileName?: string;
  /** Lines break now, and what to do when the reader asks for the other. */
  wrapped: boolean;
  onWrappedChange: (wrapped: boolean) => void;
  className?: string;
};

/**
 * The keys of a block of code, at the end of its header or in its top corner: line wrap, the
 * download, and last the copy, which every block has and which so keeps its place.
 */
export function CodeKeys({
  text,
  codeRef,
  fileName = "code.txt",
  download,
  downloadLabel,
  downloadedLabel,
  downloadedMessage,
  wrapToggle,
  wrapLabel,
  wrapped,
  onWrappedChange,
  className,
  ...copyLabels
}: CodeKeysProps) {
  const { messages } = useLocale();
  return (
    <div data-slot="code-keys" className={cn("flex items-center gap-0.5", className)}>
      {wrapToggle && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Toggle
                iconOnly
                size="sm"
                variant="quiet"
                aria-label={wrapLabel ?? messages.codeBlock.wrap}
                data-slot="code-wrap"
                pressed={wrapped}
                onPressedChange={onWrappedChange}
              >
                <Icon icon={TextWrapIcon} size={14} />
              </Toggle>
            }
          />
          <TooltipContent>{wrapLabel ?? messages.codeBlock.wrap}</TooltipContent>
        </Tooltip>
      )}
      {download !== undefined && download !== false && (
        <CodeDownload
          text={text}
          fileName={typeof download === "string" ? download : fileName}
          downloadLabel={downloadLabel}
          downloadedLabel={downloadedLabel}
          downloadedMessage={downloadedMessage}
        />
      )}
      <CodeCopy text={text} codeRef={codeRef} {...copyLabels} />
    </div>
  );
}

type CodeDownloadProps = Pick<
  CodeKeyOptions,
  "downloadLabel" | "downloadedLabel" | "downloadedMessage"
> & {
  text: string;
  fileName: string;
};

/**
 * Saves the code as a file, and confirms like the copy beside it: the symbol gives way to a
 * drawn tick (copy.css) and the tooltip says that it worked.
 */
function CodeDownload({
  text,
  fileName,
  downloadLabel,
  downloadedLabel,
  downloadedMessage,
}: CodeDownloadProps) {
  const { messages } = useLocale();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function save() {
    // A file ends with a line break; the copied text does not.
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    // The browser has taken the address by the next task.
    setTimeout(() => URL.revokeObjectURL(url), 0);
    clearTimeout(timer.current);
    setDone(true);
    timer.current = setTimeout(() => setDone(false), COPY_SHOWN_MS);
  }

  return (
    <div data-slot="code-download" className="relative flex items-center">
      <Tooltip>
        <TooltipTrigger
          closeOnClick={false}
          render={
            <Button
              iconOnly
              size="sm"
              variant="quiet"
              aria-label={downloadLabel ?? messages.codeBlock.download}
              onClick={save}
              className="text-fg-muted hover:text-fg"
            >
              <CopyMarks copied={done} icon={Download01Icon} />
            </Button>
          }
        />
        <TooltipContent>
          {done
            ? (downloadedLabel ?? messages.codeBlock.downloaded)
            : (downloadLabel ?? messages.codeBlock.download)}
        </TooltipContent>
      </Tooltip>
      <span role="status" className="sr-only">
        {done ? (downloadedMessage ?? messages.codeBlock.downloadedMessage) : ""}
      </span>
    </div>
  );
}
