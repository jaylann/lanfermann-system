/**
 * An empty flexible block between the title and the evidence. One per slide, directly after the
 * title (or the lead): it is what makes the evidence stand on the bottom margin.
 */
export function Spacer() {
  return <div data-slot="slide-spacer" className="min-h-0 flex-1" />;
}
