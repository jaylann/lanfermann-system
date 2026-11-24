import {
  Body,
  ClosingSlide,
  CoverSlide,
  Deck,
  ICONS,
  Slide,
  type SlideGround,
  Source,
  Spacer,
  Stage,
  Table,
  Title,
} from "@lanfermann/ui/slides";
import { slidesCatalog } from "@lanfermann/ui/slides/catalog";

const GROUNDS: SlideGround[] = ["paper", "tint", "ink", "indigo"];

/**
 * The slide parts, from the library's second entry (`@lanfermann/ui/slides`) and its stylesheet
 * (`slides.css` in globals.css), rendered by a Server Component: one slide per ground scaled to
 * its place, and a deck as it prints, shown small. A slide keeps its own ground in dark mode: the
 * switch at the top of the page must not change these. The catalog is the third entry, plain
 * data.
 */
export function Slides() {
  return (
    <section className="flex flex-col gap-8 px-6 py-12">
      <div className="mx-auto grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {GROUNDS.map((ground) => (
          <Stage key={ground}>
            <Slide ground={ground} deck="Der digitale Handschlag" page={1}>
              <Title>
                Vertrauen entsteht,
                <br />
                bevor das Telefon klingelt.
              </Title>
              <Spacer />
              <Body>Kunden prüfen einen Betrieb im Netz, bevor sie Kontakt aufnehmen.</Body>
              <Source>Quelle: BrightLocal, Local Consumer Review Survey 2024</Source>
            </Slide>
          </Stage>
        ))}
      </div>
      <div className="mx-auto w-full max-w-3xl overflow-hidden">
        <div className="[zoom:0.2]">
          <Deck title="Der digitale Handschlag">
            <CoverSlide
              id="cover"
              title={
                <>
                  Der digitale
                  <br />
                  Handschlag.
                </>
              }
              audience="Für Münchner Handwerk und Traditionsbetriebe"
              byline="Justin Lanfermann, November 2026"
            />
            <Slide id="befund">
              <Title>Drei von vier Seiten laden zu langsam.</Title>
              <Spacer />
              <Table
                columns={[
                  { key: "betrieb", label: "Betrieb", span: 6 },
                  { key: "mobil", label: "Ladezeit mobil", span: 3, numeric: true },
                  { key: "desktop", label: "Ladezeit Desktop", span: 3, numeric: true },
                ]}
                rows={[
                  { betrieb: "Schreinerei", mobil: "6,8 s", desktop: "2,1 s" },
                  { betrieb: "Bäckerei", mobil: "4,2 s", desktop: "1,6 s" },
                ]}
                highlight={[0, "mobil"]}
              />
              <Source>Messung vom 11.11.2026, je drei Läufe</Source>
            </Slide>
            <ClosingSlide
              id="bitte"
              title="Eine kostenlose Analyse."
              contacts={[["E-Mail", "justin@lanfermann.dev", ICONS.mail]]}
            />
          </Deck>
        </div>
      </div>
      <p className="mx-auto w-full max-w-3xl text-sm text-fg-muted">
        Der Katalog beschreibt {slidesCatalog.length} Bausteine.
      </p>
    </section>
  );
}
