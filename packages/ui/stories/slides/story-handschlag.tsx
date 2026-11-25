import type { ReactElement } from "react";

import {
  BrowserFrame,
  ClosingSlide,
  Columns,
  CoverSlide,
  Deck,
  type DeckProps,
  Figure,
  FigureRow,
  Findings,
  ICONS,
  Objections,
  Slide,
  Source,
  Spacer,
  Split,
  StatementSlide,
  Steps,
  Tiers,
  Title,
} from "@/slides";

/**
 * „Der digitale Handschlag“: the deck the kit was proven on, rebuilt from the slide parts. Ten
 * slides in the order the kit prescribes: cover on Ink, evidence on Paper, the claim on Ink,
 * objections on Tint, the offer, the ask on Indigo. Every slide carries what the presenter says.
 *
 * It is the sample deck of the workshop, of the player and of the command-line tool.
 */
export const handschlag: ReactElement<DeckProps> = (
  <Deck title="Der digitale Handschlag">
    <CoverSlide
      id="cover"
      notes="Begrüßung. Wer ich bin, in einem Satz. Dann die Frage in den Raum: Wann haben Sie zuletzt einen Betrieb gegoogelt, bevor Sie angerufen haben?"
      title={
        <>
          Der digitale
          <br />
          Handschlag.
        </>
      }
      lead={
        <>
          Warum Ihre nächsten 100 Kunden Sie googeln,
          <br />
          bevor Sie sie je treffen.
        </>
      }
      audience="Für Münchner Handwerk und Traditionsbetriebe"
      byline="Justin Lanfermann, November 2026"
    />

    <Slide
      id="recherche"
      notes="Die Zahl stehen lassen. Zwei Sekunden Pause. Dann: Das gilt auch für den Betrieb, der seit vierzig Jahren von Empfehlungen lebt."
    >
      <Title>
        Ihre Kunden prüfen Sie,
        <br />
        bevor sie anrufen.
      </Title>
      <Spacer />
      <Figure
        value="96"
        unit="%"
        align="end"
        source="Quelle: BrightLocal, Local Consumer Review Survey 2024"
      >
        aller Verbraucher recherchieren lokale Betriebe online, bevor sie Kontakt aufnehmen.
      </Figure>
    </Slide>

    <Slide
      id="erster-eindruck"
      notes="Drei Zahlen, eine Aussage: Es geht schnell, und es passiert auf dem Smartphone. Bei 0,05 Sekunden kurz erklären, dass das ein Laborwert ist."
    >
      <Title>
        Der erste Eindruck entsteht online,
        <br />
        und er entsteht schnell.
      </Title>
      <Spacer />
      <FigureRow
        items={[
          {
            value: "96",
            unit: "%",
            label: "recherchieren lokale Betriebe online, bevor sie Kontakt aufnehmen.",
            source: "BrightLocal 2024",
            highlight: true,
          },
          {
            value: "0,05",
            unit: "Sek.",
            label: "genügen für ein erstes Urteil über eine Website.",
            source: "Lindgaard et al. 2006",
          },
          {
            value: "53",
            unit: "%",
            label: "verlassen eine mobile Seite, die länger als drei Sekunden lädt.",
            source: "Google 2016",
          },
        ]}
      />
    </Slide>

    <StatementSlide
      id="vertrauen"
      notes="Der Satz des Abends. Langsam sprechen. Danach direkt weiter zur Beispielseite."
    >
      Vertrauen entsteht,
      <br />
      bevor das Telefon klingelt.
    </StatementSlide>

    <Slide
      id="befunde"
      notes="Die Beispielseite ist erfunden, die drei Befunde sehe ich in fast jeder Analyse. Bei Befund 2 das eigene Smartphone zeigen."
    >
      <Title>Drei Stellen kosten Sie heute Anfragen.</Title>
      <Spacer />
      <Split ratio="7|5" align="stretch">
        <BrowserFrame
          url="ihr-betrieb.de"
          alt="Startseite eines Betriebs mit drei markierten Stellen"
          markers={[
            { n: 1, x: 776, y: 76 },
            { n: 2, x: 448, y: 212 },
            { n: 3, x: 96, y: 412 },
          ]}
        />
        <Findings
          items={[
            {
              title: "Die Telefonnummer fehlt im Kopf.",
              text: "Wer mobil sucht, will sofort anrufen.",
            },
            {
              title: "Das Startbild lädt unkomprimiert.",
              text: "Auf dem Smartphone bleibt die Seite lange leer.",
            },
            {
              title: "Kein Weg zur Terminanfrage.",
              text: "Es gibt kein Formular und keine Öffnungszeiten.",
            },
          ]}
        />
      </Split>
      <Source>Analyse vom 11.11.2026, Smartphone und Desktop</Source>
    </Slide>

    <Slide
      id="einwaende"
      ground="tint"
      notes="Die Einwände vorlesen, wie sie fallen. Nicht widerlegen, sondern weiterführen. Beim dritten nachfragen, wer das kennt."
    >
      <Title>Was ich in fast jedem Gespräch höre.</Title>
      <Spacer />
      <Objections
        items={[
          {
            quote: "„Wir leben von Empfehlungen.“",
            answer:
              "Auch wer empfohlen wird, wird gesucht. Die Empfehlung endet auf Ihrer Website.",
          },
          {
            quote: "„Wir haben doch schon eine Seite.“",
            answer: "Die Frage ist, ob sie auf dem Smartphone in drei Sekunden sagt, was Sie tun.",
          },
          {
            quote: "„Dafür haben wir keine Zeit.“",
            answer: "Ich brauche von Ihnen zwei Stunden: ein Gespräch und eine Freigabe.",
          },
        ]}
      />
    </Slide>

    <Slide
      id="leistungen"
      notes="Kurz halten. Die meisten brauchen nur das Erste, einige das Zweite. Automatisierung nur erwähnen, wenn jemand nach Terminen fragt."
    >
      <Title>Drei Dinge, die ich für Betriebe übernehme.</Title>
      <Spacer />
      <Columns
        items={[
          {
            title: "Website",
            text: "Eine schnelle, klare Seite, die Anfragen bringt und auf dem Smartphone funktioniert.",
          },
          {
            title: "Sichtbarkeit",
            text: "Ihr Google-Profil, Ihre Bewertungen und die lokale Suche.",
          },
          {
            title: "Automatisierung",
            text: "Terminanfragen, Angebote und Rückrufe, die ohne Zettelwirtschaft laufen.",
          },
        ]}
      />
    </Slide>

    <Slide
      id="ablauf"
      notes="Vier Wochen sind realistisch, wenn Texte und Fotos in Woche 2 da sind. Das offen sagen."
    >
      <Title>
        In vier Wochen von der Analyse
        <br />
        zur neuen Seite.
      </Title>
      <Spacer />
      <Steps
        items={[
          {
            when: "Woche 1",
            title: "Analyse",
            text: "Ich prüfe Ihre Seite und drei Mitbewerber.",
          },
          {
            when: "Woche 2",
            title: "Entwurf",
            text: "Sie sehen die Startseite mit Ihren Texten und Fotos.",
          },
          {
            when: "Woche 3",
            title: "Umsetzung",
            text: "Alle Seiten entstehen, Sie geben frei.",
          },
          {
            when: "Woche 4",
            title: "Start",
            text: "Die Seite geht live, das Google-Profil zieht mit.",
          },
        ]}
      />
    </Slide>

    <Slide
      id="angebote"
      notes="Festpreise nennen und stehen lassen. Die Empfehlung begründen: neue Gestaltung lohnt sich, wenn die alte Seite älter als fünf Jahre ist."
    >
      <Title>Drei Wege, je nachdem, wo Sie stehen.</Title>
      <Spacer />
      <Tiers
        items={[
          {
            name: "Auffrischung",
            price: "1.900 €",
            unit: "einmalig",
            text: "Ihre Seite bleibt, sie wird schnell und mobil.",
            includes: [
              "Ladezeit und Mobilansicht",
              "Telefon und Anfrage im Kopf",
              "Google-Profil eingerichtet",
            ],
          },
          {
            name: "Neue Website",
            price: "3.400 €",
            unit: "einmalig",
            text: "Meine Empfehlung.",
            includes: [
              "Alles aus der Auffrischung",
              "Neue Gestaltung, fünf Seiten",
              "Texte und Fotos vor Ort",
            ],
            recommended: true,
          },
          {
            name: "Website mit Abläufen",
            price: "5.800 €",
            unit: "einmalig",
            text: "Wenn Anfragen heute auf Zetteln landen.",
            includes: [
              "Alles aus der neuen Website",
              "Terminanfrage mit Kalender",
              "Angebote aus einer Vorlage",
            ],
          },
        ]}
      />
    </Slide>

    <ClosingSlide
      id="analyse"
      notes="Die Bitte aussprechen, nicht nur zeigen. Visitenkarten liegen am Ausgang. Danach Fragen."
      title={
        <>
          Eine kostenlose
          <br />
          Analyse.
        </>
      }
      lead={
        <>
          Ich schaue mir an, was Sie haben, was die Konkurrenz macht
          <br />
          und wo die Lücken sind. Unverbindlich.
        </>
      }
      contacts={[
        ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
        ["Web", "lanfermann.dev", ICONS.globe],
        ["Vor Ort", "München, direkt bei Ihnen", ICONS.pin],
      ]}
    />
  </Deck>
);
