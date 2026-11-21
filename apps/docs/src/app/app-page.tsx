"use client";

import {
  Button,
  type DateRange,
  DateRangeField,
  Field,
  FieldDescription,
  FieldLabel,
  formatMoney,
  formatPercent,
  formatRelativeTime,
  lastDays,
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderTitle,
  RelativeTime,
  StoredSecretField,
  Text,
} from "@lanfermann/ui";
import { useState } from "react";

const LOOK_BACK = [lastDays(7), lastDays(28), lastDays(90)];

/**
 * How a page of an app opens, and what such a page writes, from the built library: the header
 * with its range, a stored secret, figures and times in German. A client component: the range
 * and the secret hold state.
 *
 * It is also the check that a page prerendered with `cacheComponents` survives the parts that
 * need the clock: the range's presets and a `RelativeTime` without `now` read it in the browser
 * only, so the build does not refuse the page and nothing differs on hydration.
 */
export function AppPage({ ground }: { ground: string }) {
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderTitle>Auswertung ({ground}).</PageHeaderTitle>
        <PageHeaderDescription>
          {formatMoney(117_074, { maximumFractionDigits: 0 })} im November,{" "}
          {formatPercent(0.18, { signDisplay: "exceptZero" })} zum Vormonat.
        </PageHeaderDescription>
        <PageHeaderActions>
          <DateRangeField
            aria-label={`Zeitraum (${ground})`}
            value={range}
            onValueChange={setRange}
            presets={LOOK_BACK}
            className="w-60"
          />
          <Button variant="primary">Bericht senden</Button>
        </PageHeaderActions>
      </PageHeader>

      <Field>
        <FieldLabel>Signatur-Secret ({ground})</FieldLabel>
        <StoredSecretField ending="7c1e" />
        <FieldDescription>Anfragen mit dem alten Secret werden danach abgelehnt.</FieldDescription>
      </Field>

      <Text tone="muted">
        Zuletzt gespeichert <RelativeTime value="2026-11-21T13:55:00+01:00" />, geprüft{" "}
        <RelativeTime value="2026-11-21T10:30:00+01:00" now="2026-11-21T14:00:00+01:00" />.
      </Text>
      <Text tone="muted">
        {formatRelativeTime("2026-11-20T18:00:00+01:00", { now: "2026-11-21T14:00:00+01:00" })}
      </Text>
    </div>
  );
}
