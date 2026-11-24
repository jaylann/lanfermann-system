import { Lead } from "@/slides/lead/lead";
import { Profile } from "@/slides/profile/profile";
import { Slide } from "@/slides/slide/slide";
import { Spacer } from "@/slides/spacer/spacer";
import { Title } from "@/slides/title/title";

/** The profile slide: the name as the title, the role as its lead, three facts a client can check. */
export function ProfileExample() {
  return (
    <Slide deck="Der digitale Handschlag" page={14}>
      <Title>Justin Lanfermann.</Title>
      <Lead>Softwareentwickler und KI-Berater in München.</Lead>
      <Spacer />
      <Profile
        facts={[
          ["Arbeit", "Websites und Automatisierung für Betriebe, die von Empfehlungen leben."],
          ["Hintergrund", "Informatik an der TU München, seit 2019 selbstständig."],
          ["Vor Ort", "Ich komme zu Ihnen in den Betrieb, im Raum München."],
        ]}
      />
    </Slide>
  );
}
