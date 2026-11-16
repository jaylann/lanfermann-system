import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { visual: { viewport: { width: 420, height: 120 } } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// A tiny inline picture, so the story needs no network.
const PICTURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#c9b79c"/><circle cx="24" cy="19" r="9" fill="#7a5c3e"/><path d="M6 48c2-12 10-17 18-17s16 5 18 17z" fill="#5f50d0"/></svg>',
  );

/** Initials until the picture has loaded, or when there is none. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>JL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>BK</AvatarFallback>
      </Avatar>
      <Avatar size="xl">
        <AvatarFallback>MM</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src={PICTURE} />
        <AvatarFallback>MM</AvatarFallback>
      </Avatar>
      <Avatar size="xl">
        <AvatarImage src={PICTURE} />
        <AvatarFallback>MM</AvatarFallback>
      </Avatar>
    </div>
  ),
};
