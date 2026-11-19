"use client";

import { Button, RollingNumber, Stat, StatChange, StatLabel, StatValue } from "@lanfermann/ui";
import { useState } from "react";

/**
 * A figure that changes on the page: its digits roll. A client component, since the figure is
 * state; the `Stat` around it is server-safe and comes along.
 */
export function Figures() {
  const [revenue, setRevenue] = useState(12_480);
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <Stat>
        <StatLabel>Umsatz im November</StatLabel>
        <StatValue>
          <RollingNumber value={revenue} format={{ style: "currency", currency: "EUR" }} />
        </StatValue>
        <StatChange trend="up" tone="positive" context="zum Vormonat">
          +12 %
        </StatChange>
      </Stat>
      <Button size="sm" onClick={() => setRevenue((now) => now + 1_860)}>
        Zahlung eingegangen
      </Button>
    </div>
  );
}
