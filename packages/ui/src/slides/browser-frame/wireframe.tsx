import { cn } from "@/lib/cn";

type WireframeProps = {
  /** Width of the page in px: the frame without its edge. */
  width: number;
  /** Height of the page in px: the frame without its edge and, in a browser, without the bar. */
  height: number;
  /** A phone's page: a short logo and one menu button in place of the three links. */
  compact?: boolean;
};

type BlockProps = {
  width: number;
  height: number;
  /** The darker tone: a logo, a headline. */
  strong?: boolean;
};

function Block({ width, height, strong = false }: BlockProps) {
  return (
    <div
      className={cn(
        "rounded-[2px]",
        strong ? "bg-slide-placeholder-strong" : "bg-slide-placeholder",
      )}
      style={{ width, height }}
    />
  );
}

/**
 * The page that stands in a `BrowserFrame` or a `PhoneFrame` while its screenshot is missing: a
 * head, a picture and three lines of text in the two placeholder tones. Shared by the two frames
 * and not exported from the entry.
 */
export function Wireframe({ width, height, compact = false }: WireframeProps) {
  // Inside the 32px padding on both sides.
  const measure = width - 64;
  // The picture takes what the padding, the head, the three lines and the gaps (218px) leave.
  const picture = Math.max(96, height - 218);
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <Block width={compact ? 120 : 180} height={28} strong />
        {compact ? (
          <Block width={28} height={28} />
        ) : (
          <div className="flex gap-6">
            <Block width={84} height={16} />
            <Block width={84} height={16} />
            <Block width={84} height={16} />
          </div>
        )}
      </div>
      <Block width={measure} height={picture} />
      <div className="flex flex-col gap-4">
        <Block width={Math.round(measure * 0.7)} height={18} strong />
        <Block width={Math.round(measure * 0.88)} height={14} />
        <Block width={Math.round(measure * 0.8)} height={14} />
      </div>
    </div>
  );
}
