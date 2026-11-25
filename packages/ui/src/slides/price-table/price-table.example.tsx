import { PriceTable } from "@/slides/price-table/price-table";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/**
 * An offer with VAT: two positions, then net, tax and the sum. The space before every euro sign
 * and before the per cent sign is the narrow no-break space (U+202F), not a plain one.
 */
export function PriceTableExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={8}>
      <Title>Ein Festpreis, in zwei Schritten.</Title>
      <Spacer />
      <PriceTable
        items={[
          {
            title: "Neue Website",
            text: "Konzept, Gestaltung, Umsetzung, fünf Seiten",
            qty: "einmalig",
            price: "3.400,00 €",
          },
          {
            title: "Pflege und Hosting",
            text: "Updates, Sicherung, kleine Änderungen",
            qty: "12 Monate",
            price: "588,00 €",
          },
        ]}
        totals={[
          ["Zwischensumme", "3.988,00 €"],
          ["Umsatzsteuer 19 %", "757,72 €"],
          ["Gesamt", "4.745,72 €"],
        ]}
      />
    </Slide>
  );
}
