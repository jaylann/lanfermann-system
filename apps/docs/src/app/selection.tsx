"use client";

import { ActionBar, ActionBarButton, Checkbox } from "@lanfermann/ui";
import { useState } from "react";

const QUOTES = ["Schreinerei Mustermann", "Bäckerei Huber"];

/**
 * Rows that can be ticked, and the bar that acts on them. A client component: what is ticked
 * is state, and the bar is told how to take the selection back with a function.
 */
export function Selection() {
  const [selected, setSelected] = useState<readonly string[]>(["Schreinerei Mustermann"]);
  return (
    <div className="relative flex min-h-36 flex-col gap-2 pb-16">
      {QUOTES.map((quote) => (
        <label key={quote} className="flex items-center gap-2.5 text-control text-fg-body">
          <Checkbox
            checked={selected.includes(quote)}
            onCheckedChange={(checked) =>
              setSelected((now) =>
                checked ? [...now, quote] : now.filter((each) => each !== quote),
              )
            }
          />
          {quote}
        </label>
      ))}
      <ActionBar
        position="absolute"
        open={selected.length > 0}
        count={selected.length}
        onClear={() => setSelected([])}
      >
        <ActionBarButton>Senden</ActionBarButton>
        <ActionBarButton>Löschen</ActionBarButton>
      </ActionBar>
    </div>
  );
}
