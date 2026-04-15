import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ElevenLabsExecutor from "./executor";

export const NODE_TYPE = "ElevenLabs";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    type: NODE_TYPE,
    name: "ElevenLabs TTS",
    description: "Convert text to speech using ElevenLabs v3.",
    category: "Ingest",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768540562/gravity/icons/elevanlabs.jpg",
    color: "#FF69B4",
    inputs: [
      {
        name: "input",
        type: NodeInputType.STRING,
        required: true,
        description: "Text or dialogue script with [DETECTIVE]: and [SUSPECT]: labels",
      },
    ],
    outputs: [
      {
        name: "audio",
        type: NodeInputType.OBJECT,
        description: "Generated audio with data (base64), mimeType, and fileName",
      },
      {
        name: "metadata",
        type: NodeInputType.OBJECT,
        description: "Audio metadata including format, durationSeconds, characterCount, isDialogue",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          title: "Text / Script",
          description:
            "Text to convert. For dialogue use [DETECTIVE]: and [SUSPECT]: labels. Use [laughs], [sighs] for v3 audio tags.",
          default: "{{{input}}}",
          "ui:field": "template",
        },
        characterId: {
          type: "string",
          title: "Character ID",
          description:
            "Unique ID for the suspect (e.g., 'sus_claire'). Combined with Character Gender to deterministically pick a voice.",
          default: "",
          "ui:field": "template",
        },
        characterGender: {
          type: "string",
          title: "Character Gender",
          description: "Gender of the suspect/character. Routes to correct voice pool.",
          enum: ["male", "female"],
          enumNames: ["Male", "Female"],
          default: "male",
          "ui:field": "template",
        },
        stability: {
          type: "number",
          title: "Stability",
          description: "0.0=Creative, 0.5=Natural, 1.0=Robust (only these 3 values allowed)",
          default: 0.0,
          enum: [0.0, 0.5, 1.0],
        },
      },
      required: ["text"],
    },
    credentials: [
      {
        name: "elevenlabsCredential",
        type: "elevenlabsCredential",
        required: true,
      },
    ],
    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const ElevenLabsNode = {
  definition,
  executor: ElevenLabsExecutor,
};

export { createNodeDefinition };
