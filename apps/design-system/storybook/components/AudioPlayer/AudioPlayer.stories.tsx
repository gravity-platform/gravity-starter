import type { Meta, StoryObj } from "@storybook/react";
import AudioPlayer from "./AudioPlayer";
import { AudioPlayerDefaults } from "./defaults";

const meta: Meta<typeof AudioPlayer> = {
  title: "Components/AudioPlayer",
  component: AudioPlayer,
  parameters: {
    layout: "padded",
    workflowSize: { width: 450, height: 80 },
  },
  argTypes: {
    url: {
      control: "text",
      description: "URL of the audio file to play",
      workflowInput: true,
    },
    title: {
      control: "text",
      description: "Optional title to display above the player",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof AudioPlayer>;

export const Default: Story = {
  args: AudioPlayerDefaults,
};

export const WithTitle: Story = {
  args: {
    ...AudioPlayerDefaults,
    title: "911 Emergency Call - Case #2847",
  },
};

export const NoUrl: Story = {
  args: {
    url: undefined,
  },
};
