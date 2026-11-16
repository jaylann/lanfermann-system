import {
  Add01Icon,
  Alert02Icon,
  ArrowDown01Icon,
  Building03Icon,
  Calendar03Icon,
  Call02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  EuroIcon,
  FilterIcon,
  Home01Icon,
  InformationCircleIcon,
  Invoice01Icon,
  Link01Icon,
  Location01Icon,
  LockIcon,
  Mail01Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  PencilEdit02Icon,
  Search01Icon,
  Settings01Icon,
  StarIcon,
  Tick02Icon,
  UserGroupIcon,
  UserIcon,
  ViewIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "@/components/icon/icon";

const meta = {
  title: "Foundations/Icons",
  component: Icon,
  parameters: { layout: "padded", visual: { viewport: { width: 860, height: 520 } } },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

const set = [
  Search01Icon,
  Mail01Icon,
  Call02Icon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  Building03Icon,
  Home01Icon,
  UserIcon,
  UserGroupIcon,
  Invoice01Icon,
  EuroIcon,
  Wrench01Icon,
  Settings01Icon,
  LockIcon,
  ViewIcon,
  Notification01Icon,
  StarIcon,
  Link01Icon,
  Copy01Icon,
  Download01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  FilterIcon,
  MoreHorizontalIcon,
  Add01Icon,
  Cancel01Icon,
  Tick02Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
];

/**
 * Hugeicons, stroke pinned to 1.5px at every size so it holds beside Sofia Sans 500. Icons take
 * the text colour of their context; they are never Indigo on their own.
 */
export const Sizes: Story = {
  args: { icon: Search01Icon },
  render: () => (
    <div className="flex w-full max-w-3xl flex-col">
      {([14, 16, 18, 20, 24] as const).map((size, index) => (
        <div
          key={size}
          className={
            index === 0
              ? "grid grid-cols-[4rem_1fr] items-center gap-6 border-t-2 border-rule py-4"
              : "grid grid-cols-[4rem_1fr] items-center gap-6 border-t border-line py-4"
          }
        >
          <p className="text-sm text-fg-muted">{size}px</p>
          <div className="flex flex-wrap gap-x-4 gap-y-3 text-fg">
            {set.map((icon, i) => (
              <Icon key={i} icon={icon} size={size} />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

/** Beside a label: 14px in small controls, 16px in default ones, 18px in large ones. */
export const BesideLabels: Story = {
  args: { icon: Download01Icon },
  parameters: { visual: { viewport: { width: 860, height: 220 } } },
  render: () => (
    <div className="flex items-center gap-8 text-fg">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <Icon icon={Download01Icon} size={14} /> Herunterladen
      </span>
      <span className="flex items-center gap-2 text-base font-medium">
        <Icon icon={Download01Icon} size={16} /> Auftragsbestätigung herunterladen
      </span>
      <span className="flex items-center gap-2 text-base font-medium">
        <Icon icon={Mail01Icon} size={18} /> E-Mail senden
      </span>
    </div>
  ),
};
