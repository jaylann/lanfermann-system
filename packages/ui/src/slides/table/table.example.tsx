import { Slide } from "@/slides/slide/slide";
import { Source } from "@/slides/source/source";
import { Spacer } from "@/slides/spacer/spacer";
import { Table } from "@/slides/table/table";
import { Title } from "@/slides/title/title";

/** A measured table: four runs, the one the title is about in the accent, the method under it. */
export function TableExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={6}>
      <Title>Erst das größere Modell trifft zuverlässig.</Title>
      <Spacer />
      <Table
        highlight={[3, "score"]}
        columns={[
          { key: "model", label: "Modell", span: 4 },
          { key: "task", label: "Aufgabe", span: 3 },
          { key: "score", label: "Richtig", span: 2, numeric: true },
          { key: "quant", label: "Quantisierung", span: 3, mono: true },
        ]}
        rows={[
          { model: "Qwen 3.5, 0,8 Mrd.", task: "Notizen", score: "9 von 20", quant: "Q4_K_M" },
          { model: "Qwen 3.5, 4 Mrd.", task: "Notizen", score: "16 von 20", quant: "Q4_K_M" },
          { model: "Qwen 3.5, 0,8 Mrd.", task: "Belege", score: "4 von 20", quant: "Q4_K_M" },
          { model: "Qwen 3.5, 4 Mrd.", task: "Belege", score: "18 von 20", quant: "Q4_K_M" },
        ]}
      />
      <Source>Messung vom 28.10.2026, ohne Training, MacBook M2 Pro, je 20 Aufgaben</Source>
    </Slide>
  );
}
