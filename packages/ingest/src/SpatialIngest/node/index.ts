import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { SpatialIngestExecutor } from "./executor";

export const NODE_TYPE = "SpatialIngest";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    category: "Storage",
    name: "Spatial Ingest",
    description:
      "Extract needs from raw content using master spatial prompts, generate embeddings, and upsert into the spatial dictionary (dictionary_need_states).",
    color: "#6366f1",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
        description: "Trigger signal",
      },
    ],

    outputs: [
      {
        name: "success",
        type: NodeInputType.BOOLEAN,
        description: "Whether all objects were saved",
      },
      {
        name: "count",
        type: NodeInputType.NUMBER,
        description: "Number of need objects created or updated",
      },
      {
        name: "universalIds",
        type: NodeInputType.ANY,
        description: "Stable UUIDs of the upserted dictionary records",
      },
      {
        name: "entries",
        type: NodeInputType.ANY,
        description: "Full entry objects ready for downstream processing",
      },
    ],

    configSchema: {
      type: "object",
      required: ["rawContent", "category"],
      properties: {
        rawContent: {
          type: "string",
          title: "Raw Content",
          description: "The text to extract needs from (supports templates, e.g. {{trigger.output.message}})",
          "ui:field": "template",
          "ui:order": 1,
        },
        category: {
          type: "string",
          title: "Category",
          description: "Type of content — drives which extraction prompt is used",
          enum: ["need", "service", "image", "document", "mcp", "skill"],
          enumNames: ["Need", "Service", "Image", "Document", "MCP", "Skill"],
          default: "need",
          "ui:order": 2,
        },
        sourceUrl: {
          type: "string",
          title: "Source URL",
          description: "Optional — URL the content was fetched from (supports templates)",
          "ui:field": "template",
          "ui:order": 3,
        },
        domainPrompt: {
          type: "string",
          title: "Domain Prompt",
          description: "Domain context for extraction (leave empty to use workflow description)",
          "ui:widget": "textarea",
          "ui:order": 4,
        },
      },
    },

    credentials: [
      {
        name: "openAICredential",
        required: true,
      },
    ],

    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const SpatialIngestNode = {
  definition,
  executor: SpatialIngestExecutor,
};

export { createNodeDefinition };
