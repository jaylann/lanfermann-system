import {
  Body,
  ClosingSlide,
  Columns,
  CoverSlide,
  Deck,
  Diagram,
  ICONS,
  Scene,
  type SceneWorld,
  Slide,
  Source,
  Spacer,
  Step,
  Takeaway,
  Title,
} from "@lanfermann/ui/slides";

/**
 * „Vom Suchen zum Auftrag“: a deck that moves. It shows what a slide can do beyond standing
 * still: blocks that appear step by step, a diagram that builds up while its connectors draw
 * themselves, and a scene whose camera travels over one world for two slides. Present it with
 * `slides dev packages/slides/fixtures/motion`; the end-to-end test walks its steps.
 */

/** One world for both scene slides: a customer's way from the search to the next one. */
const weg: SceneWorld = {
  nodes: [
    {
      id: "google",
      label: "Google-Profil",
      detail: "Karte, Zeiten, Fotos",
      icon: ICONS.pin,
      col: 1,
      row: 1,
    },
    {
      id: "bewertungen",
      label: "Bewertungen",
      detail: "4,8 Sterne aus 63",
      icon: ICONS.star,
      col: 1,
      row: 2,
    },
    {
      id: "website",
      label: "Website",
      detail: "Leistungen, Preise",
      icon: ICONS.browser,
      col: 2,
      row: 1,
    },
    {
      id: "referenzen",
      label: "Referenzen",
      detail: "echte Baustellen",
      icon: ICONS.image,
      col: 2,
      row: 2,
    },
    { id: "formular", label: "Formular", detail: "drei Felder", icon: ICONS.mail, col: 3, row: 1 },
    { id: "anruf", label: "Anruf", detail: "Nummer im Kopf", icon: ICONS.phone, col: 3, row: 2 },
    {
      id: "rueckruf",
      label: "Rückruf",
      detail: "am selben Werktag",
      icon: ICONS.call,
      col: 4,
      row: 1,
    },
    {
      id: "termin",
      label: "Termin",
      detail: "online gebucht",
      icon: ICONS.calendar,
      col: 4,
      row: 2,
    },
    {
      id: "angebot",
      label: "Angebot",
      detail: "als PDF am Abend",
      icon: ICONS.file,
      tone: "solid",
      col: 5,
      row: 1,
    },
    {
      id: "nachfrage",
      label: "Nachfrage",
      detail: "eine Woche danach",
      icon: ICONS.chat,
      col: 5,
      row: 2,
    },
    {
      id: "zusage",
      label: "Zusage",
      detail: "per Klick im PDF",
      icon: ICONS.handshake,
      col: 6,
      row: 1,
    },
    { id: "rechnung", label: "Rechnung", detail: "mit Zahllink", icon: ICONS.euro, col: 6, row: 2 },
  ],
  groups: [
    {
      id: "gefunden",
      label: "Gefunden werden",
      nodes: ["google", "bewertungen", "website", "referenzen"],
    },
    { id: "anfrage", label: "Anfrage", nodes: ["formular", "anruf", "rueckruf", "termin"] },
    { id: "abschluss", label: "Abschluss", nodes: ["angebot", "nachfrage", "zusage", "rechnung"] },
  ],
  wires: [
    { from: "google", to: "website" },
    { from: "bewertungen", to: "website" },
    { from: "referenzen", to: "website" },
    { from: "website", to: "formular" },
    { from: "website", to: "anruf" },
    { from: "formular", to: "rueckruf" },
    { from: "anruf", to: "termin" },
    { from: "rueckruf", to: "termin" },
    { from: "rueckruf", to: "angebot" },
    { from: "termin", to: "angebot" },
    { from: "angebot", to: "zusage" },
    { from: "zusage", to: "rechnung" },
    { from: "rechnung", to: "nachfrage" },
    { from: "nachfrage", to: "bewertungen", dashed: true },
  ],
};

export default (
  <Deck title="Vom Suchen zum Auftrag">
    <CoverSlide
      id="cover"
      notes="Begrüßung. Heute geht es um den Weg, den ein Kunde nimmt, bevor er anruft."
      title={
        <>
          Vom Suchen
          <br />
          zum Auftrag.
        </>
      }
      lead="Der Weg eines Kunden, Station für Station."
      audience="Für Münchner Handwerk und Traditionsbetriebe"
      byline="Justin Lanfermann, November 2026"
    />

    <Slide
      id="rueckruf"
      notes="Erst der Befund. Klick: was es kostet. Klick: was wir daraus machen."
    >
      <Title>Ein Rückruf am selben Tag entscheidet.</Title>
      <Body>
        {/* A name of the deck's own. The kit's steps are `data-slides-at`: this is none. */}
        <span data-step={3}>Wer eine Anfrage schickt,</span> hat meist drei Betriebe angeschrieben.
      </Body>
      <Step at={1}>
        <Body>Den Auftrag bekommt, wer sich zuerst meldet, nicht wer am günstigsten ist.</Body>
      </Step>
      <Spacer />
      <Step at={2}>
        <Takeaway>Die Anfrage landet auf dem Smartphone, der Rückruf im Kalender.</Takeaway>
      </Step>
    </Slide>

    <Slide
      id="leistungen"
      notes="Drei Dinge, eins nach dem anderen. Bei jedem kurz stehen bleiben."
    >
      <Title>Drei Dinge, die ich dafür einrichte.</Title>
      <Spacer />
      <Columns
        items={[
          { title: "Formular", text: "Drei Felder, auf jeder Seite, auch mobil." },
          {
            title: "Rückruf",
            text: "Die Anfrage kommt als Nachricht, mit einem Vorschlag für die Zeit.",
            step: 1,
          },
          { title: "Angebot", text: "Aus einer Vorlage, am selben Abend als PDF.", step: 2 },
        ]}
      />
    </Slide>

    <Slide
      id="ablauf"
      notes="Das Bild baut sich auf: erst die zwei Quellen, dann die Anfrage, dann Rückruf und Termin."
    >
      <Title>Aus einer Anfrage wird ein Termin.</Title>
      <Spacer />
      <Diagram
        alt="Website und Google-Profil führen zur Anfrage, die Anfrage über den Rückruf zum Termin"
        nodes={[
          {
            id: "website",
            col: 1,
            row: 1,
            icon: ICONS.browser,
            title: "Website",
            text: "Formular auf jeder Seite",
            step: 1,
          },
          {
            id: "profil",
            col: 1,
            row: 2,
            icon: ICONS.pin,
            title: "Google-Profil",
            text: "Anruf und Route",
            step: 1,
          },
          {
            id: "anfrage",
            col: 5,
            row: 1,
            span: 4,
            rows: 2,
            tone: "accent",
            icon: ICONS.mail,
            title: "Anfrage",
            text: "landet in einem Postfach",
            step: 2,
          },
          {
            id: "rueckruf",
            col: 10,
            row: 1,
            icon: ICONS.call,
            title: "Rückruf",
            text: "am selben Tag",
            step: 3,
          },
          {
            id: "termin",
            col: 10,
            row: 2,
            icon: ICONS.calendar,
            title: "Termin",
            text: "vor Ort beim Kunden",
            step: 4,
          },
        ]}
        edges={[
          { from: "website", to: "anfrage" },
          { from: "profil", to: "anfrage" },
          { from: "anfrage", to: "rueckruf", accent: true },
          { from: "rueckruf", to: "termin" },
          { from: "anfrage", to: "termin", dashed: true, label: "direkt gebucht" },
        ]}
      />
      <Source>Ablauf in einem Malerbetrieb mit drei Mitarbeitern, Oktober 2026</Source>
    </Slide>

    <Slide
      id="weg"
      ground="ink"
      notes="Der ganze Weg. Klick: wir gehen in die erste Station. Klick: die Website trägt alles zusammen."
    >
      <Title>Drei Stationen, ein Weg.</Title>
      <Spacer />
      <Scene
        alt="Der Weg eines Kunden in drei Stationen: gefunden werden, die Anfrage, der Abschluss. Zuerst die Station Gefunden werden mit Google-Profil, Bewertungen, Website und Referenzen."
        world={weg}
        beats={[
          {
            view: "all",
            caption: (
              <>
                <b>Drei Stationen.</b> Gefunden werden, die Anfrage annehmen, den Auftrag
                abschließen.
              </>
            ),
          },
          {
            view: "gefunden",
            caption: (
              <>
                <b>Gefunden werden.</b> Die Suche führt zum Profil, das Profil zur Website.
              </>
            ),
          },
          {
            view: "gefunden",
            highlight: ["website"],
            caption: (
              <>
                <b>Die Website</b> sammelt, was vorher verstreut war: Leistungen, Preise,
                Referenzen.
              </>
            ),
          },
        ]}
      />
    </Slide>

    <Slide
      id="kreis"
      ground="ink"
      notes="Die Kamera wandert weiter zur Anfrage. Klick: der Abschluss. Klick: der Kreis schließt sich, das ist der Punkt des Abends."
    >
      <Title>
        Aus dem Auftrag
        <br />
        wird die nächste Suche.
      </Title>
      <Spacer />
      <Scene
        alt="Die Station Anfrage mit Formular, Anruf, Rückruf und Termin, dann der Abschluss mit Angebot, Zusage und Rechnung, danach die Bitte um eine Bewertung, die zur nächsten Suche führt."
        world={weg}
        from="gefunden"
        beats={[
          {
            view: "anfrage",
            highlight: ["formular", "rueckruf"],
            caption: (
              <>
                <b>Die Anfrage</b> kommt über drei Felder, der Rückruf noch am selben Werktag.
              </>
            ),
          },
          {
            view: "abschluss",
            highlight: ["angebot", "zusage"],
            caption: (
              <>
                <b>Der Abschluss:</b> das Angebot am Abend, die Zusage per Klick.
              </>
            ),
          },
          {
            view: "all",
            loop: [
              "bewertungen",
              "website",
              "formular",
              "rueckruf",
              "angebot",
              "zusage",
              "rechnung",
              "nachfrage",
            ],
            caption: (
              <>
                <b>Der Kreis schließt sich:</b> Nach der Rechnung bittet der Betrieb um eine
                Bewertung, und die nächste Suche findet ihn.
              </>
            ),
          },
        ]}
      />
    </Slide>

    <ClosingSlide
      id="analyse"
      notes="Die Bitte aussprechen. Danach Fragen."
      title={
        <>
          Wo hakt
          <br />
          Ihr Weg?
        </>
      }
      lead="Ich gehe ihn einmal als Kunde und schreibe auf, wo er abbricht."
      contacts={[
        ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
        ["Web", "lanfermann.dev", ICONS.globe],
      ]}
    />
  </Deck>
);
