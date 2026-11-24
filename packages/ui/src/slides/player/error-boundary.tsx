"use client";

import { Component, type ReactNode } from "react";

type SlideErrorBoundaryProps = {
  /** The line above the error's message. */
  label: string;
  children: ReactNode;
};

type SlideErrorBoundaryState = { message: string | null };

/**
 * Keeps one slide's failure to itself: a slide that throws while it is drawn is replaced by a
 * plain note of the canvas's size, and the deck goes on. The check mode reads the note
 * (`data-slot="player-slide-error"`) and reports it as a `render-error`.
 */
export class SlideErrorBoundary extends Component<
  SlideErrorBoundaryProps,
  SlideErrorBoundaryState
> {
  override state: SlideErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): SlideErrorBoundaryState {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  override render(): ReactNode {
    const { message } = this.state;
    if (message === null) return this.props.children;
    return (
      // On the canvas, so in px like a slide; it prints as a page of its own.
      <section
        data-slot="player-slide-error"
        data-slide-ground="paper"
        role="alert"
        className="flex h-[1080px] w-[1920px] shrink-0 break-after-page flex-col justify-end gap-[32px] bg-ground p-[128px] font-sans text-fg-body"
      >
        <p className="text-slide-lead text-fg">{this.props.label}</p>
        <p data-slot="player-slide-error-message" className="font-mono text-slide-code">
          {message}
        </p>
      </section>
    );
  }
}
