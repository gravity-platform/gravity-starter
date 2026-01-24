import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { AbyssaleExecutor } from "./executor";

export const NODE_TYPE = "Abyssale";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Abyssale",
    description: "Generate high-quality images and PDFs from Abyssale templates",
    category: "Output",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768052235/gravity/icons/abyssale-picto-airtable.png",
    color: "#6366F1",

    inputs: [
      {
        name: "data",
        type: NodeInputType.OBJECT,
        description: "Data to populate template elements",
      },
    ],

    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Generated asset with url, cdnUrl, fileType, width, height",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          title: "Template ID",
          description: "Abyssale template UUID (from your Abyssale dashboard)",
        },
        multiPage: {
          type: "boolean",
          title: "Multi-Page PDF",
          description: "Generate a multi-page PDF document",
          default: false,
          "ui:widget": "toggle",
        },
        pageCount: {
          type: "number",
          title: "Page Count",
          description: "Number of pages in the template",
          minimum: 1,
          maximum: 50,
          default: 2,
          "ui:dependencies": {
            multiPage: true,
          },
        },
        compressionLevel: {
          type: "number",
          title: "Compression Level",
          description: "JPEG compression percentage (1-100)",
          default: 80,
          minimum: 1,
          maximum: 100,
        },
        elements: {
          type: "object",
          title: "Elements",
          description: "Map template layer names to values. JS: return { 'layer-name': { payload: input.text } }",
          default: "",
          "ui:field": "template",
        },
      },
      required: ["templateId"],
    },

    credentials: [
      {
        name: "abyssaleCredential",
        required: true,
        displayName: "Abyssale",
        description: "Abyssale API credentials",
      },
    ],
  };
}

const definition = createNodeDefinition();

export const AbyssaleNode = {
  definition,
  executor: AbyssaleExecutor,
};

export { createNodeDefinition };
