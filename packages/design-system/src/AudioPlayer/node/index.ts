/**
 * AudioPlayer Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AudioPlayerExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "AudioPlayer";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "AudioPlayer",
    description: "AudioPlayer UI component from design system",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 450, height: 80 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "output", type: NodeInputType.OBJECT, description: "Response object" }],
    configSchema: {
      "type": "object",
      "properties": {
            "focusable": {
                  "type": "boolean",
                  "title": "Enable Focus Mode",
                  "description": "Allow this component to expand and become the primary interaction surface",
                  "default": false,
                  "ui:widget": "toggle"
            },
            "focusLabel": {
                  "type": "string",
                  "title": "Focus Mode Label",
                  "description": "Name shown in chat input when this component is focused (e.g., 'Bank Transfer')",
                  "default": "",
                  "ui:dependencies": {
                        "focusable": true
                  }
            },
            "url": {
                  "type": "string",
                  "title": "URL of the audio file to play",
                  "default": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                  "ui:field": "template"
            },
            "title": {
                  "type": "string",
                  "title": "Optional title to display above the player",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const AudioPlayerNode = {
  definition,
  executor: AudioPlayerExecutor,
};

export { createNodeDefinition as default };
