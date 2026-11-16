/*
 * The choice a reader made in a group of CodeTabs ("bun" over "npm"), shared by every block of
 * the group on the page and remembered for the next visit. Storage can be missing or refuse
 * (a private window, blocked site data): then the choice lives for the page only.
 */

const listeners = new Set<() => void>();
const choices = new Map<string, string>();
const storageKey = (group: string) => `lanfermann.code-tabs.${group}`;

export function readChoice(group: string): string | undefined {
  if (!choices.has(group)) {
    try {
      const stored = window.localStorage.getItem(storageKey(group));
      if (stored) choices.set(group, stored);
    } catch {
      // No storage: the choice is not remembered.
    }
  }
  return choices.get(group);
}

export function writeChoice(group: string, value: string) {
  choices.set(group, value);
  try {
    window.localStorage.setItem(storageKey(group), value);
  } catch {
    // No storage: the choice is not remembered.
  }
  for (const listener of listeners) listener();
}

export function subscribeChoices(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
