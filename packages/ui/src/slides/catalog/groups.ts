/**
 * The slide parts by group, in the order the catalog lists them. Every part the entry exports
 * stands here once (a test checks it): adding a part means adding its name.
 */
export const slideGroups = {
  Scaffold: ["Deck", "Slide", "Stage", "Spacer", "Split", "Footer", "Wordmark", "CoBrand", "Forms"],
  Text: ["Title", "Lead", "Body", "Meta", "Source", "Takeaway", "Tag", "Tags"],
  Lists: [
    "List",
    "Columns",
    "Steps",
    "Compare",
    "KeyValue",
    "Agenda",
    "Objections",
    "Tiers",
    "Contacts",
  ],
  Tables: ["Table", "PriceTable"],
  Figures: ["Figure", "FigureRow", "BarList", "ColumnChart"],
  Diagrams: ["Flow", "Diagram", "Stages", "Loop"],
  Proof: [
    "Findings",
    "Marker",
    "Icon",
    "BrowserFrame",
    "PhoneFrame",
    "BeforeAfter",
    "Media",
    "Code",
    "Example",
    "Quote",
    "Profile",
  ],
  "Slide kinds": [
    "CoverSlide",
    "SectionSlide",
    "StatementSlide",
    "ClosingSlide",
    "ReferencesSlide",
  ],
} as const satisfies Record<string, readonly string[]>;
