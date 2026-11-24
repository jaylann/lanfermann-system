import { Deck, Slide, type SlideGround, Spacer, Stage } from "@lanfermann/ui/slides";

const GROUNDS: SlideGround[] = ["paper", "tint", "ink", "indigo"];

/**
 * The slide parts, from the library's second entry (`@lanfermann/ui/slides`) and its stylesheet
 * (`slides.css` in globals.css), rendered by a Server Component: one slide per ground scaled to
 * its place, and a deck as it prints, shown small. A slide keeps its own ground in dark mode: the
 * switch at the top of the page must not change these.
 */
export function Slides() {
  return (
    <section className="flex flex-col gap-8 px-6 py-12">
      <div className="mx-auto grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {GROUNDS.map((ground) => (
          <Stage key={ground}>
            <Slide ground={ground} deck="Der digitale Handschlag" page={1}>
              <h2 className="slide-span-10 text-slide-title font-medium text-fg">
                Vertrauen entsteht,
                <br />
                bevor das Telefon klingelt.
              </h2>
              <Spacer />
              <p className="slide-span-6">
                Kunden prüfen einen Betrieb im Netz, bevor sie Kontakt aufnehmen.
              </p>
            </Slide>
          </Stage>
        ))}
      </div>
      <div className="mx-auto w-full max-w-3xl overflow-hidden">
        <div className="[zoom:0.2]">
          <Deck title="Der digitale Handschlag">
            <Slide id="anfang" ground="ink">
              <h2 className="slide-span-12 text-slide-statement font-medium text-fg">
                Der erste Eindruck entsteht im Netz.
              </h2>
              <Spacer />
            </Slide>
            <Slide id="bitte" ground="indigo">
              <h2 className="slide-span-12 text-slide-statement font-medium text-fg">
                Schreiben Sie mir, ich sehe es mir an.
              </h2>
              <Spacer />
            </Slide>
          </Deck>
        </div>
      </div>
    </section>
  );
}
