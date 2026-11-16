import "@fontsource-variable/sofia-sans/wght.css";
import "@fontsource-variable/sofia-sans/wght-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./preview.css";

import type { Decorator, Preview } from "@storybook/react-vite";

const GROUNDS = ["paper", "tint", "ink", "indigo"] as const;
const DENSITIES = ["compact", "comfortable"] as const;

/**
 * Applies the toolbar globals to <html>, not to a wrapper: Base UI portals popups to <body>, so a
 * wrapper attribute would leave every popup on Paper and at the default density.
 *
 * `data-visual` hands the story's `parameters.visual` to scripts/visual/capture.ts.
 */
const withGlobals: Decorator = (Story, context) => {
  const root = document.documentElement;
  const globals = context.globals as { ground?: string; density?: string };
  root.dataset.theme = globals.ground ?? "paper";
  root.dataset.density = globals.density ?? "compact";
  root.dataset.visual = JSON.stringify(context.parameters.visual ?? {});
  return (
    <div className="isolate">
      <Story />
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    ground: {
      description: "Ground (who is speaking)",
      toolbar: { title: "Ground", icon: "contrast", items: [...GROUNDS], dynamicTitle: true },
    },
    density: {
      description: "Density (control size)",
      toolbar: { title: "Density", icon: "ruler", items: [...DENSITIES], dynamicTitle: true },
    },
  },
  initialGlobals: {
    ground: "paper",
    density: "compact",
  },
  decorators: [withGlobals],
  parameters: {
    layout: "centered",
    // Every story is also a test (`bun run test:stories`): an axe violation fails it.
    a11y: {
      test: "error",
      config: {
        rules: [
          // Base UI brackets an open popup with focus guards: hidden, focusable spans that hand
          // focus back into the popup. They are the one place where "hidden yet focusable" is
          // meant; the rule stays on for everything else. A story that sets its own `rules`
          // replaces this list, so it has to repeat this entry.
          {
            id: "aria-hidden-focus",
            selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])',
          },
          // In Safari the same guards carry `role="button"` (so VoiceOver can step onto them)
          // and no name: they are not commands a person runs. Buttons, links and menu items
          // of ours still need their name.
          {
            id: "aria-command-name",
            selector:
              '[role="link"]:not([data-base-ui-focus-guard]), [role="button"]:not([data-base-ui-focus-guard]), [role="menuitem"]:not([data-base-ui-focus-guard])',
          },
        ],
      },
    },
    options: {
      storySort: {
        order: ["Foundations", "Components", "Patterns", "Lab"],
      },
    },
  },
};

export default preview;
