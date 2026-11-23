/**
 * For stories only (not exported): what a website's folder of assets holds (blog pictures,
 * badges, logos, documents), with pictures drawn inline so the stories need no network.
 */

const svg = (width: number, height: number, body: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  );

/** The hero of a blog post about a bar's new site: dusk over the counter. */
export const HERO = svg(
  1600,
  900,
  '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2766"/><stop offset="1" stop-color="#d98b5f"/></linearGradient></defs><rect width="1600" height="900" fill="url(#s)"/><circle cx="1180" cy="520" r="150" fill="#f2c27b"/><path d="M0 640 Q400 520 800 620 T1600 600 V900 H0Z" fill="#3b2a3e"/><rect x="0" y="720" width="1600" height="180" fill="#1f1726"/><rect x="180" y="610" width="220" height="110" rx="8" fill="#5a3d4f"/><rect x="460" y="560" width="70" height="160" rx="6" fill="#8a5a52"/>',
);

/** The small picture of the same post, for the list of posts. */
export const THUMBNAIL = svg(
  800,
  600,
  '<rect width="800" height="600" fill="#ece6dc"/><rect x="80" y="120" width="420" height="300" rx="18" fill="#5f50d0"/><rect x="130" y="180" width="220" height="26" rx="13" fill="#ffffff"/><rect x="130" y="230" width="300" height="16" rx="8" fill="#c9c2f5"/><rect x="130" y="260" width="260" height="16" rx="8" fill="#c9c2f5"/><circle cx="620" cy="300" r="110" fill="#d98b5f"/><circle cx="620" cy="300" r="70" fill="#f2c27b"/>',
);

/** A badge for a post's list: round, with a star. */
export const BADGE = svg(
  512,
  512,
  '<rect width="512" height="512" fill="#ffffff"/><circle cx="256" cy="256" r="200" fill="#1f8a5b"/><circle cx="256" cy="256" r="168" fill="none" stroke="#ffffff" stroke-width="10"/><path d="M256 150 L284 222 L360 224 L300 270 L322 344 L256 300 L190 344 L212 270 L152 224 L228 222Z" fill="#ffffff"/>',
);

/** The bar's logo, drawn for a light page. */
export const LOGO = svg(
  640,
  240,
  '<rect width="640" height="240" fill="#ffffff"/><rect x="60" y="70" width="100" height="100" rx="20" fill="#13121c"/><path d="M85 145 L110 95 L135 145Z" fill="#f2c27b"/><rect x="190" y="88" width="300" height="30" rx="6" fill="#13121c"/><rect x="190" y="132" width="190" height="20" rx="5" fill="#8a8697"/>',
);

/** A photo from the kitchen, upright. */
export const PHOTO = svg(
  900,
  1200,
  '<rect width="900" height="1200" fill="#3a2b22"/><rect x="0" y="760" width="900" height="440" fill="#6b4a36"/><ellipse cx="450" cy="780" rx="330" ry="90" fill="#c9a27a"/><ellipse cx="450" cy="740" rx="260" ry="120" fill="#e8c48f"/><circle cx="370" cy="700" r="40" fill="#b5532f"/><circle cx="520" cy="720" r="34" fill="#b5532f"/><rect x="120" y="140" width="660" height="420" rx="30" fill="#251b15"/><rect x="170" y="200" width="560" height="300" rx="20" fill="#e07b39"/>',
);

/** One entry of a folder as a story shows it. */
export type StoryEntry = {
  id: string;
  name: string;
  type?: string;
  src?: string;
  meta: string;
};

export const FOLDERS: StoryEntry[] = [
  { id: "badges", name: "badges", meta: "6 Dateien" },
  { id: "entwuerfe", name: "entwürfe", meta: "3 Dateien" },
  { id: "archiv", name: "archiv 2025", meta: "18 Dateien" },
];

export const FILES: StoryEntry[] = [
  { id: "hero", name: "hero.webp", type: "image/webp", src: HERO, meta: "184 KB · gestern" },
  {
    id: "thumbnail",
    name: "thumbnail.webp",
    type: "image/webp",
    src: THUMBNAIL,
    meta: "42 KB · gestern",
  },
  { id: "badge", name: "badge_neu.webp", type: "image/webp", src: BADGE, meta: "12 KB · 14.11." },
  { id: "logo", name: "building-gbar.svg", type: "image/svg+xml", src: LOGO, meta: "3 KB · 2.11." },
  {
    id: "angebot",
    name: "Angebot_Kowalski_Herbst.pdf",
    type: "application/pdf",
    meta: "2,4 MB · vor 3 Tagen",
  },
  {
    id: "preise",
    name: "Preise_Getraenke_2027.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    meta: "84 KB · 12.11.",
  },
  {
    id: "ofen",
    name: "Backstube_Ofen_Nahaufnahme_bearbeitet_final.jpg",
    type: "image/jpeg",
    src: PHOTO,
    meta: "4,8 MB · 9.11.",
  },
  { id: "teaser", name: "teaser.mp4", type: "video/mp4", meta: "18,2 MB · 1.11." },
];

/** A file that is being added: its own picture, read from the disk before it is stored. */
export const ARRIVING: StoryEntry = {
  id: "eingang",
  name: "eingang_abends.webp",
  type: "image/webp",
  src: THUMBNAIL,
  meta: "1,1 von 2,6 MB",
};
