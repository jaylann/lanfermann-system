import { Icon } from "@/slides/icon/icon";
import { ICONS, MARKS } from "@/slides/icon/icons";
import { Meta } from "@/slides/meta/meta";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The pictograms and the marks, as the kit's one set. */
export function IconExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={5}>
      <Title>Ein Satz Piktogramme, sieben Marken.</Title>
      <Spacer />
      <div className="flex slide-span-12 flex-wrap gap-8">
        {[...Object.values(ICONS), ...Object.values(MARKS)].map((icon) => (
          <Icon key={icon.name} icon={icon} size={48} />
        ))}
      </div>
      <Meta>
        Piktogramme: Phosphor Icons, bold. Marken: Simple Icons. Beide stehen klein vor einem Titel,
        nie allein.
      </Meta>
    </Slide>
  );
}
