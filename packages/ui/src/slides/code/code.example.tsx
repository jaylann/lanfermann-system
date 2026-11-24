import { Code } from "@/slides/code/code";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** A tool call as literal code: six lines in the mono face, the one that matters in the accent. */
export function CodeExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={12}>
      <Title>
        Das Modell ruft ein Werkzeug auf,
        <br />
        statt zu antworten.
      </Title>
      <Spacer />
      <Code
        highlight={1}
        caption="Antwort auf „Setz Milch auf die Einkaufsliste“, Qwen 3.5 mit 4 Mrd. Parametern"
        code={[
          "{",
          '  "tool": "update",',
          '  "notiz": "Einkaufsliste",',
          '  "ordner": "Haushalt",',
          '  "anhang": "Milch"',
          "}",
        ].join("\n")}
      />
    </Slide>
  );
}
