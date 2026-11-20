/**
 * For stories only (not exported): files a person attaches to a prompt, and a picture drawn
 * inline so the stories need no network.
 */

const MB = 1_000_000;

/** A draft of a bakery's start page, as a small picture. */
export const DRAFT_PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><rect width="320" height="220" fill="#f4ede3"/><rect width="320" height="34" fill="#3b2a1e"/><circle cx="22" cy="17" r="7" fill="#e9c58b"/><rect x="38" y="13" width="64" height="8" rx="4" fill="#e9c58b"/><rect x="196" y="13" width="28" height="8" rx="4" fill="#cdb79a"/><rect x="232" y="13" width="28" height="8" rx="4" fill="#cdb79a"/><rect x="268" y="11" width="38" height="12" rx="6" fill="#e9c58b"/><rect x="20" y="58" width="150" height="14" rx="7" fill="#3b2a1e"/><rect x="20" y="80" width="120" height="14" rx="7" fill="#3b2a1e"/><rect x="20" y="106" width="130" height="7" rx="3.5" fill="#a08c74"/><rect x="20" y="119" width="110" height="7" rx="3.5" fill="#a08c74"/><rect x="20" y="140" width="72" height="20" rx="10" fill="#5f50d0"/><rect x="186" y="52" width="116" height="116" rx="12" fill="#d9a066"/><circle cx="244" cy="110" r="38" fill="#f4ede3"/><circle cx="244" cy="110" r="28" fill="#c0703c"/><rect x="20" y="184" width="86" height="20" rx="6" fill="#e6dccd"/><rect x="117" y="184" width="86" height="20" rx="6" fill="#e6dccd"/><rect x="214" y="184" width="86" height="20" rx="6" fill="#e6dccd"/></svg>',
  );

export type StoryFile = { id: string; name: string; size: number; type: string; src?: string };

export const FILES: StoryFile[] = [
  { id: "1", name: "Angebot-Kornprobst.pdf", size: 2.4 * MB, type: "application/pdf" },
  {
    id: "2",
    name: "Entwurf-Startseite.png",
    size: 1.2 * MB,
    type: "image/png",
    src: DRAFT_PICTURE,
  },
  {
    id: "3",
    name: "Preisliste-Torten.xlsx",
    size: 0.084 * MB,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
];

export const KINDS: StoryFile[] = [
  { id: "pdf", name: "Angebot-Kornprobst.pdf", size: 2.4 * MB, type: "application/pdf" },
  { id: "image", name: "Filiale-Marktplatz.jpg", size: 3.1 * MB, type: "image/jpeg" },
  { id: "sheet", name: "Preisliste-Torten.xlsx", size: 0.084 * MB, type: "" },
  { id: "csv", name: "Bestellungen-November.csv", size: 0.012 * MB, type: "text/csv" },
  { id: "document", name: "Leistungsbeschreibung.docx", size: 0.21 * MB, type: "" },
  { id: "archive", name: "Fotos-Backstube.zip", size: 34 * MB, type: "application/zip" },
  { id: "file", name: "Schriften.woff2", size: 0.046 * MB, type: "" },
];

export const LONG_NAMES: StoryFile[] = [
  {
    id: "long-1",
    name: "Angebot Bäckerei Kornprobst – Website, Bestellformular und Pflege (überarbeitet) v12.pdf",
    size: 2.6 * MB,
    type: "application/pdf",
  },
  {
    id: "long-2",
    name: "IMG_20261114_073211_HDR_Backstube_Ofen_bearbeitet_bearbeitet.HEIC",
    size: 4.8 * MB,
    type: "image/heic",
  },
];
