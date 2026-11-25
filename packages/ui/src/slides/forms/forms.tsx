export type FormsProps = {
  /** The composition. Discs: `rise` (cover), `edge` (statement, figure and text slides), `corner` (content slides with room), `set` (closing). Rings: `arc` (section opener), `halo` (half ring on the right edge), `orbit` (two thin rings around the top right corner), `drop` (half ring hanging from the top edge), `bend` (quarter ring for content slides with room). */
  name?: "rise" | "edge" | "corner" | "set" | "arc" | "halo" | "orbit" | "drop" | "bend";
};

/** The nine compositions by name. */
export type FormsName = NonNullable<FormsProps["name"]>;

/** The role a circle has in its composition; the ground decides its colour (slides.css). */
type FormRole = "large" | "tone" | "second" | "nest" | "dot" | "spark";

/**
 * One circle on the 1920 by 1080 canvas: centre x, centre y, radius, role and, for a ring, the
 * radius of its hollow.
 */
type Form = readonly [cx: number, cy: number, r: number, role: FormRole, hollow?: number];

const compositions: Record<FormsName, readonly Form[]> = {
  rise: [
    [1920, 1080, 576, "large"],
    [1920, 1080, 288, "tone"],
    [1496, 0, 216, "second"],
    [1640, 800, 32, "dot"],
    [1352, 344, 28, "spark"],
  ],
  edge: [
    [1920, 600, 360, "large"],
    [1920, 600, 180, "tone"],
    [1740, 420, 28, "dot"],
  ],
  corner: [
    [1920, 0, 416, "large"],
    [1920, 0, 208, "tone"],
    [1712, 208, 28, "dot"],
  ],
  set: [
    [1920, 0, 432, "large"],
    [1920, 0, 216, "tone"],
    [1560, 540, 80, "second"],
    [1708, 212, 28, "dot"],
  ],
  arc: [
    [1920, 0, 648, "large", 432],
    [1716, 204, 120, "second"],
    [1368, 440, 28, "spark"],
  ],
  halo: [
    [1920, 580, 384, "large", 256],
    [1800, 530, 92, "nest"],
    [1476, 812, 28, "spark"],
  ],
  orbit: [
    [1920, 0, 744, "large", 672],
    [1920, 0, 480, "tone", 408],
    [1340, 406, 60, "second"],
    [1712, 392, 28, "spark"],
  ],
  drop: [
    [1500, 0, 360, "large", 240],
    [1548, 108, 84, "nest"],
    [1836, 420, 28, "spark"],
  ],
  bend: [
    [1920, 0, 416, "large", 280],
    [1808, 104, 84, "nest"],
    [1632, 384, 28, "dot"],
  ],
};

/** A disc is filled, a ring is a stroke as wide as the ring: one class of each per role. */
const paint: Record<FormRole, { fill: string; stroke: string }> = {
  large: { fill: "fill-slide-form-large", stroke: "stroke-slide-form-large" },
  tone: { fill: "fill-slide-form-tone", stroke: "stroke-slide-form-tone" },
  second: { fill: "fill-slide-form-second", stroke: "stroke-slide-form-second" },
  nest: { fill: "fill-slide-form-nest", stroke: "stroke-slide-form-nest" },
  dot: { fill: "fill-slide-form-dot", stroke: "stroke-slide-form-dot" },
  spark: { fill: "fill-slide-form-spark", stroke: "stroke-slide-form-spark" },
};

/**
 * The kit's ornament: large discs and rings cropped by the slide's edge, in nine fixed
 * compositions, as a backdrop.
 *
 * Every form is a disc or a ring whose centre sits on a corner or an edge of the slide, so the
 * slide crops it to a quarter or a half; one or two small discs complete the composition. A ring
 * carries a disc nested in its hollow. There are nine compositions and no others: do not move,
 * resize, rotate, recolour or add forms, and never use two on one slide. `Slide` draws one when
 * given `forms`; the cover, section, statement and closing slides bring their own and take
 * another through their `forms` prop. On Paper and Tint the large form is tone on tone, so it
 * never competes with the evidence; on Ink and Indigo it takes full colour.
 *
 * Where each belongs: a cover takes `rise`; `drop` when a title line is longer than 16 characters
 * (it leaves the lower half free); `orbit` as the other look, for title lines of 14 characters at
 * most. Section openers take the rings in turn, `arc`, `halo`, `orbit`, so each part of a deck
 * opens with its own picture. A statement takes `edge`, a second statement in the same deck
 * `halo`. The closing slide takes `set`, or `drop`. A content slide with room takes `corner` or
 * `bend` when its evidence starts below y 432, and `edge` or `halo` when it ends left of x 1536;
 * neighbouring slides never repeat a composition.
 *
 * A form is a backdrop: it comes first in the slide's markup, and no text or block may run under
 * it. So: no forms on a slide with a table, a chart, a diagram, a screenshot, code or more than
 * four rows. No patterns, tiles, grids of dots, rings around numbers or shapes above columns: the
 * forms are the only ornament.
 */
export function Forms({ name = "corner" }: FormsProps) {
  const forms = compositions[name];
  return (
    <div
      data-slot="slide-forms"
      data-bleed=""
      // Where the forms stand, for a check that no text runs under one: "cx,cy,r,hollow;…".
      data-forms={forms
        .map(([cx, cy, r, , hollow]) => [cx, cy, r, hollow ?? 0].join(","))
        .join(";")}
      className="absolute top-0 left-0 flex h-[1080px] w-[1920px]"
    >
      <svg aria-hidden="true" width={1920} height={1080} viewBox="0 0 1920 1080">
        {forms.map(([cx, cy, r, role, hollow], index) =>
          hollow === undefined ? (
            <circle key={index} cx={cx} cy={cy} r={r} className={paint[role].fill} />
          ) : (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={(r + hollow) / 2}
              fill="none"
              strokeWidth={r - hollow}
              className={paint[role].stroke}
            />
          ),
        )}
      </svg>
    </div>
  );
}
