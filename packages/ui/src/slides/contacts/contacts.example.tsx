import { Contacts } from "@/slides/contacts/contacts";
import { ICONS } from "@/slides/icon/icons";
import { Lead } from "@/slides/lead/lead";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The closing ask on Indigo with three ways to reach Justin under it. */
export function ContactsExample() {
  return (
    <Slide ground="indigo" footer={false} gap={48}>
      <Spacer />
      <Title size="cover">
        Eine kostenlose
        <br />
        Analyse.
      </Title>
      <Lead>
        Ich schaue mir an, was Sie haben, was die Konkurrenz macht
        <br />
        und wo die Lücken sind. Unverbindlich.
      </Lead>
      <Contacts
        items={[
          ["E-Mail", "justin@lanfermann.dev", ICONS.mail],
          ["Web", "lanfermann.dev", ICONS.globe],
          ["Vor Ort", "München, direkt bei Ihnen", ICONS.pin],
        ]}
      />
    </Slide>
  );
}
