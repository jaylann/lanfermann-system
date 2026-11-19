"use client";

import { ArrowUp02Icon, Attachment01Icon } from "@hugeicons/core-free-icons";
import {
  Children,
  type ClipboardEvent,
  type ComponentProps,
  createContext,
  type DragEvent,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { AttachmentVariantContext } from "@/components/attachment/attachment";
import { Button } from "@/components/button/button";
import { ChipGroup } from "@/components/chip/chip-group";
import { type FileRejection, sortFiles } from "@/components/file-upload/files";
import { Grow } from "@/components/grow/grow";
import { Icon } from "@/components/icon/icon";
import { useScrollEdges } from "@/components/scroll-fade/use-scroll-edges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip/tooltip";
import { fieldShellGrowing, focusFieldControl } from "@/internal/field";
import { StopGlyph } from "@/internal/glyphs";
import { cn } from "@/lib/cn";

import { promptKey, TOUCH_ONLY } from "./keys";

type PromptContextValue = {
  value: string;
  setValue: (value: string) => void;
  running: boolean;
  disabled: boolean;
  canSend: boolean;
  touchOnly: boolean;
  textareaId: string;
  send: () => void;
  stop: () => void;
  addFiles: (files: readonly File[]) => void;
  accept?: string;
  /** The prompt's attachments say how many there are, and how the last is taken away. */
  setAttachments: (count: number, removeLast: (() => void) | undefined) => void;
  removeLast: () => boolean;
  focusText: () => void;
};

const PromptContext = createContext<PromptContextValue | null>(null);

function usePrompt(part: string) {
  const context = useContext(PromptContext);
  if (!context) throw new Error(`${part} belongs inside a PromptInput.`);
  return context;
}

function subscribeTouch(notify: () => void) {
  const query = window.matchMedia(TOUCH_ONLY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** Whether the screen is only touched (no mouse, no trackpad). False on the server. */
function useTouchOnly() {
  return useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(TOUCH_ONLY).matches,
    () => false,
  );
}

export type PromptInputProps = Omit<
  ComponentProps<"form">,
  "onSubmit" | "defaultValue" | "onChange"
> & {
  /** The text (controlled). */
  value?: string;
  /** The text at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * Sends the prompt: called with the text, trimmed. The field is emptied at once; when the
   * promise rejects, the text comes back if nothing new was typed.
   */
  onSubmit?: (text: string) => void | Promise<void>;
  /** An answer is being written: the send key is the stop key. The field stays open. */
  running?: boolean;
  /** Halts the answer being written. */
  onStop?: () => void;
  /** Files that were chosen, dropped or pasted and are of a kind and size it takes. */
  onFilesAdded?: (files: File[]) => void;
  /** Files it did not take, each with its reason. */
  onReject?: (rejections: FileRejection[]) => void;
  /** As on a file input: `.pdf,image/*`. */
  accept?: string;
  /** The largest size a file may have, in bytes. */
  maxSize?: number;
  disabled?: boolean;
};

/**
 * The field a prompt to an assistant is written in: one socket that holds the text, the files
 * attached to it, the attach key and the send key, so the halo goes around all of it. Put a
 * `PromptInputAttachments`, a `PromptInputTextarea` and `PromptInputActions` (with a
 * `PromptInputAttach` and a `PromptInputSubmit`) inside.
 *
 * The text stands on top and the keys in a row of their own under it, the paper clip at the
 * left and send at the right, where there is room for more keys (Justin, 2026-11-19).
 *
 * Enter sends and Shift+Enter breaks the line; on a screen that is only touched, Enter breaks
 * the line and the key sends. A word being composed (Japanese, Chinese) is never sent. While
 * an answer is written (`running`) the send key is the stop key, in the same place, and the
 * field stays open, so the next prompt can be written; Enter waits.
 *
 * The field grows with its text up to about ten lines and then scrolls; its height follows on
 * `settle`, and the line being typed is readable from its first frame. Files come by the attach
 * key, by a drop on the field (it wears the halo while one hangs over it) and by paste. It
 * sorts them by kind and size and hands them on; it does not upload.
 */
export function PromptInput({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  running = false,
  onStop,
  onFilesAdded,
  onReject,
  accept,
  maxSize,
  disabled = false,
  className,
  children,
  ...props
}: PromptInputProps) {
  const [own, setOwn] = useState(defaultValue);
  const value = valueProp ?? own;
  const setValue = (next: string) => {
    setOwn(next);
    onValueChange?.(next);
  };
  const [attachments, setAttachmentCount] = useState(0);
  const removeLastRef = useRef<(() => void) | undefined>(undefined);
  const setAttachments = useCallback((count: number, removeLast: (() => void) | undefined) => {
    setAttachmentCount(count);
    removeLastRef.current = removeLast;
  }, []);
  const [dragging, setDragging] = useState(false);
  const drags = useRef(0);
  const touchOnly = useTouchOnly();
  const textareaId = useId();
  const canSend = !disabled && (value.trim() !== "" || attachments > 0);

  const focusText = () => document.getElementById(textareaId)?.focus();

  const send = () => {
    if (running || !canSend) return;
    const sent = value;
    setValue("");
    const result = onSubmit?.(sent.trim());
    if (result instanceof Promise) {
      result.catch(() => {
        // Not sent: what was typed comes back, unless something new has been typed since.
        setOwn((now) => {
          if (now !== "") return now;
          onValueChange?.(sent);
          return sent;
        });
      });
    }
  };

  const addFiles = (files: readonly File[]) => {
    if (disabled || files.length === 0) return;
    const { accepted, rejected } = sortFiles(files, { accept, maxSize, multiple: true });
    if (accepted.length > 0) onFilesAdded?.(accepted);
    if (rejected.length > 0) onReject?.(rejected);
  };

  const context: PromptContextValue = {
    value,
    setValue,
    running,
    disabled,
    canSend,
    touchOnly,
    textareaId,
    send,
    stop: () => onStop?.(),
    addFiles,
    accept,
    setAttachments,
    removeLast: () => {
      if (!removeLastRef.current) return false;
      removeLastRef.current();
      return true;
    },
    focusText,
  };

  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  return (
    <PromptContext value={context}>
      <form
        data-slot="prompt-input"
        data-running={running ? "" : undefined}
        data-dragging={dragging ? "" : undefined}
        className={cn("w-full min-w-0", className)}
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        // A file let go over the field is taken; the browser must never open it instead. A
        // count of enters and leaves, so moving over the keys inside does not flicker the halo.
        onDragEnter={(event) => {
          if (!hasFiles(event) || disabled) return;
          event.preventDefault();
          drags.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          if (!hasFiles(event)) return;
          drags.current = Math.max(0, drags.current - 1);
          if (drags.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          drags.current = 0;
          setDragging(false);
          addFiles([...event.dataTransfer.files]);
          focusText();
        }}
        {...props}
      >
        <Grow
          data-slot="prompt-input-field"
          // The field eases to a new height with its text held at its foot: the line being
          // typed is there from its first frame, and only the top edge moves.
          className={cn(
            fieldShellGrowing,
            "flex flex-col justify-end rounded-xl [--field-pad:0.75rem] [--field-radius:var(--radius-xl)]",
            "in-data-dragging:depth-field-focus",
          )}
          // A grid (its areas are in assistant.css); as a utility, so it beats Grow's own box.
          contentClassName="grid p-1"
          onMouseDown={focusFieldControl}
        >
          {children}
        </Grow>
      </form>
    </PromptContext>
  );
}

export type PromptInputTextareaProps = Omit<
  ComponentProps<"textarea">,
  "value" | "defaultValue" | "id"
> & {
  /** The name of the field for assistive tech, where no label stands beside it. */
  label?: string;
};

/** The text and its look, the same for the field and for the copy it is measured by. */
const textLook =
  "col-start-1 row-start-1 min-w-0 px-2 py-2 text-control leading-6 break-words whitespace-pre-wrap pointer-coarse:text-base";

/**
 * The text of the prompt. It grows with what is written, measured from a copy of the text laid
 * out beside it, so it grows the same in every browser, up to about ten lines; then it scrolls
 * and fades at its top where more stands above.
 */
export function PromptInputTextarea({
  label = "Nachricht an die KI",
  className,
  onKeyDown,
  onPaste,
  placeholder,
  ...props
}: PromptInputTextareaProps) {
  const prompt = usePrompt("PromptInputTextarea");
  const area = useRef<HTMLTextAreaElement>(null);
  useScrollEdges(area, "y");

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Backspace" && prompt.value === "" && !event.repeat) {
      if (prompt.removeLast()) event.preventDefault();
      return;
    }
    const outcome = promptKey(event.nativeEvent, {
      touchOnly: prompt.touchOnly,
      running: prompt.running,
    });
    if (outcome === "type") return;
    event.preventDefault();
    if (outcome === "send") prompt.send();
  };

  const paste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(event);
    if (event.defaultPrevented) return;
    const files = [...event.clipboardData.files];
    // Text is pasted as text; only files are taken from it.
    if (files.length === 0) return;
    event.preventDefault();
    prompt.addFiles(files);
  };

  return (
    <div data-slot="prompt-input-text" className="grid min-w-0 [grid-area:text]">
      <textarea
        ref={area}
        id={prompt.textareaId}
        data-slot="prompt-input-textarea"
        data-field-control=""
        data-disabled={prompt.disabled ? "" : undefined}
        data-scroll-fade="y"
        data-fade-edges="start"
        aria-label={label}
        rows={1}
        value={prompt.value}
        disabled={prompt.disabled}
        placeholder={placeholder}
        enterKeyHint={prompt.touchOnly ? "enter" : "send"}
        onChange={(event) => prompt.setValue(event.target.value)}
        onKeyDown={keyDown}
        onPaste={paste}
        className={cn(
          textLook,
          "h-full resize-none overflow-y-auto bg-transparent text-fg",
          "placeholder:text-fg-muted placeholder:italic focus:outline-hidden",
          "data-disabled:text-on-disabled",
          className,
        )}
        {...props}
      />
      {/*
        The copy the field is measured by: the same text in the same look, unseen. Its height,
        up to the limit, is the field's; a last empty line needs a character to have a height.
      */}
      <div
        aria-hidden
        data-slot="prompt-input-measure"
        className={cn(textLook, "invisible max-h-60 overflow-hidden text-fg")}
      >
        {prompt.value || placeholder || " "}
        {"​"}
      </div>
    </div>
  );
}

/** The keys of the prompt: attach, send, and whatever else belongs there. */
export function PromptInputActions({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="prompt-input-actions" className={cn(className)} {...props} />;
}

/** A quiet key inside the field, cut concentric to its corner. */
const innerKey = "rounded-[calc(var(--field-radius)-4px)]";

export type PromptInputAttachProps = Omit<
  ComponentProps<"button">,
  "children" | "onClick" | "type"
> & {
  label?: string;
};

/**
 * The paper clip: opens the file picker. What is chosen is sorted like a drop and handed to
 * `onFilesAdded`; the same file can be chosen again.
 */
export function PromptInputAttach({ label = "Datei anhängen", className }: PromptInputAttachProps) {
  const prompt = usePrompt("PromptInputAttach");
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              iconOnly
              variant="quiet"
              aria-label={label}
              data-slot="prompt-input-attach"
              disabled={prompt.disabled}
              onClick={() => input.current?.click()}
              className={cn(innerKey, "text-fg-muted hover:text-fg", className)}
            >
              <Icon icon={Attachment01Icon} size={16} />
            </Button>
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        accept={prompt.accept}
        data-slot="prompt-input-file"
        onChange={(event) => {
          prompt.addFiles([...(event.target.files ?? [])]);
          // So the same file can be chosen again.
          event.target.value = "";
          prompt.focusText();
        }}
      />
    </>
  );
}

export type PromptInputSubmitProps = {
  sendLabel?: string;
  stopLabel?: string;
  className?: string;
};

/**
 * The send key, the committed key of the prompt. With nothing to send it lies flat and stands
 * up with the first word. While an answer is written it is the stop key, in the same place and
 * size: the arrow shrinks away and the square seats. Pressing it keeps the keyboard in the text.
 */
export function PromptInputSubmit({
  sendLabel = "Senden",
  stopLabel = "Anhalten",
  className,
}: PromptInputSubmitProps) {
  const prompt = usePrompt("PromptInputSubmit");
  const label = prompt.running ? stopLabel : sendLabel;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            iconOnly
            variant="primary"
            aria-label={label}
            data-slot="prompt-input-submit"
            type={prompt.running ? "button" : "submit"}
            disabled={!prompt.running && !prompt.canSend}
            focusableWhenDisabled
            onClick={prompt.running ? prompt.stop : undefined}
            // The press does not take the keyboard from the text, so a phone's keyboard stays.
            onMouseDown={(event) => {
              if (document.activeElement?.id === prompt.textareaId) event.preventDefault();
            }}
            className={cn(innerKey, className)}
          >
            <span className="grid place-items-center *:col-start-1 *:row-start-1">
              <Icon icon={ArrowUp02Icon} size={16} data-slot="prompt-input-send-symbol" />
              <StopGlyph width={12} height={12} data-slot="prompt-input-stop-symbol" />
            </span>
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type PromptInputAttachmentsProps = Omit<ComponentProps<"div">, "children"> & {
  /** `Attachment`s, each with a `key`: they are chips here. */
  children?: ReactElement | ReactElement[] | false | null;
  label?: string;
};

/**
 * The files attached to the prompt, as chips above the text. One that joins opens its place
 * and seats; one taken away fades while its place closes. Backspace in the empty text takes the
 * last one away. Empty, the row takes no room.
 */
export function PromptInputAttachments({
  label = "Anhänge",
  className,
  children,
  ...props
}: PromptInputAttachmentsProps) {
  const prompt = usePrompt("PromptInputAttachments");
  const items = useMemo(
    () =>
      Children.toArray(children).filter(isValidElement) as ReactElement<{
        onRemove?: () => void;
      }>[],
    [children],
  );
  const last = items.at(-1)?.props.onRemove;
  const { setAttachments } = prompt;
  // Before the browser paints, so the send key stands up with the first file.
  useLayoutEffect(() => setAttachments(items.length, last), [setAttachments, items.length, last]);
  useLayoutEffect(() => () => setAttachments(0, undefined), [setAttachments]);
  return (
    <AttachmentVariantContext value="chip">
      <ChipGroup
        aria-label={label}
        data-slot="prompt-input-attachments"
        className={cn("px-1 pt-1 pb-0.5 empty:hidden", className)}
        {...props}
      >
        {items}
      </ChipGroup>
    </AttachmentVariantContext>
  );
}
