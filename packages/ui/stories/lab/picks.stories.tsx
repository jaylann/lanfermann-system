import { Home01Icon, InboxIcon, NoteEditIcon } from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";

import { kindOf } from "@/components/attachment/kinds";
import { Button } from "@/components/button/button";
import { FileThumb } from "@/components/file-thumb/file-thumb";
import { FileTile } from "@/components/file-tile/file-tile";
import { FileTileSkeleton } from "@/components/file-tile/file-tile-skeleton";
import { FILES, SEE_THROUGH } from "@/components/file-tile/story-files";
import { ScrollFade } from "@/components/scroll-fade/scroll-fade";
import {
  Sidebar,
  SidebarBrand,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
} from "@/components/sidebar/sidebar";
import { SkeletonGroup } from "@/components/skeleton/skeleton";

// Boards for looks that are decided by eye: each shows the options of one pick side by side, at
// real size. The default of the library is named first. They are not parts to copy from.
const meta = {
  title: "Lab/Picks",
  parameters: { layout: "padded", visual: { viewport: { width: 1000, height: 420 } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const caption = "text-sm text-fg-muted";

const ROWS = [
  "Typ",
  "Größe",
  "Maße",
  "Hochgeladen",
  "Von",
  "Ordner",
  "Aufrufe",
  "Zuletzt geöffnet",
  "Sichtbarkeit",
  "Prüfsumme",
];

function Scrolled({ size }: { size: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Part way down, so both edges fade.
    if (box.current) box.current.scrollTop = 90;
  }, []);
  return (
    <figure className="flex w-64 flex-col gap-2">
      <ScrollFade
        ref={box}
        axis="y"
        size={size}
        tabIndex={0}
        aria-label={`Liste mit ${size} Blende`}
        role="region"
        className="h-56 rounded-xl bg-sheet px-5 depth-floating"
      >
        {ROWS.map((row) => (
          <div key={row} className="border-b border-hairline py-2.5 text-control text-fg-muted">
            {row}
          </div>
        ))}
      </ScrollFade>
      <figcaption className={caption}>{size}</figcaption>
    </figure>
  );
}

/**
 * How long the fade of a scrolling sheet is: 40px is the library's one length (tabs, tables,
 * code, and now the body of a dialog or drawer); 32 and 24 beside it.
 */
export const FadeLength: Story = {
  parameters: { visual: { viewport: { width: 900, height: 340 } } },
  render: () => (
    <div className="flex gap-8 p-2">
      <Scrolled size="2.5rem" />
      <Scrolled size="2rem" />
      <Scrolled size="1.5rem" />
    </div>
  ),
};

const sample = FILES[0]!;

/**
 * The face of a file tile that is still loading, beside a loaded one: bare shapes (the default,
 * nothing can be handled yet), and the tile's face without its shadow (`face="flat"`).
 */
export const LoadingTileFace: Story = {
  parameters: { visual: { viewport: { width: 760, height: 300 } } },
  render: () => (
    <SkeletonGroup label="Die Dateien werden geladen." light="still">
      <div className="grid grid-cols-[repeat(3,11rem)] gap-x-6 gap-y-2 p-2">
        <FileTile name={sample.name} type={sample.type} src={sample.src} meta={sample.meta} />
        <FileTileSkeleton />
        <FileTileSkeleton face="flat" />
        <span className={caption}>geladen</span>
        <span className={caption}>bare shapes</span>
        <span className={caption}>face=&quot;flat&quot;</span>
      </div>
    </SkeletonGroup>
  ),
};

function BrandSpecimen({ motion, collapsed }: { motion: "fade" | "seat"; collapsed: boolean }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-44 w-60 overflow-hidden rounded-xl border border-hairline">
        <Sidebar
          inline
          collapsed={collapsed}
          aria-label={`Beispiel ${motion}`}
          className="border-r-0"
        >
          <SidebarHeader>
            <SidebarBrand href="#start" motion={motion} />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarItem icon={Home01Icon} href="#uebersicht" current>
                Übersicht
              </SidebarItem>
              <SidebarItem icon={InboxIcon} href="#posteingang">
                Posteingang
              </SidebarItem>
              <SidebarItem icon={NoteEditIcon} href="#angebote">
                Angebote
              </SidebarItem>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>
      <figcaption className={caption}>motion=&quot;{motion}&quot;</figcaption>
    </figure>
  );
}

function BrandMotions() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-2">
      <Button
        data-testid="toggle"
        className="self-start"
        onClick={() => setCollapsed((now) => !now)}
      >
        {collapsed ? "Ausklappen" : "Einklappen"}
      </Button>
      <div className="flex gap-8">
        <BrandSpecimen motion="fade" collapsed={collapsed} />
        <BrandSpecimen motion="seat" collapsed={collapsed} />
      </div>
    </div>
  );
}

/**
 * How the symbol arrives when the sidebar collapses: a plain crossfade with the labels (the
 * default), or seating into place. Press the key and watch both at once.
 */
export const BrandMotion: Story = {
  parameters: {
    visual: {
      viewport: { width: 700, height: 340 },
      motion: [{ name: "collapse", click: '[data-testid="toggle"]', frames: 10 }],
    },
  },
  render: () => <BrandMotions />,
};

/**
 * A see-through picture as a row's thumbnail: filling the square (`cover`, the default) or
 * whole inside it (`contain`), on Paper and where the well is dark.
 */
export const ThumbFit: Story = {
  parameters: { visual: { viewport: { width: 620, height: 260 } } },
  render: () => (
    <div className="grid grid-cols-[6rem_repeat(4,2.5rem)] items-center gap-x-4 gap-y-4 p-2">
      {(["cover", "contain"] as const).map((fit) => (
        <div key={fit} className="contents">
          <span className={caption}>{fit}</span>
          {[...SEE_THROUGH.slice(0, 3), FILES[0]!].map((entry) => (
            <FileThumb
              key={entry.id}
              kind={kindOf(entry)}
              src={entry.src}
              name={entry.name}
              type={entry.type}
              fit={fit}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
