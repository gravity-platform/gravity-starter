import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import SendObjectExecutor from "./executor";

export const NODE_TYPE = "SendObject";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Send Object",
    description: "Send JSON data to client with an ID for identification",
    category: "Flow",
    color: "#10B981",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Trigger signal (optional)",
      },
    ],
    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Data with storageKey and id for client-side storage",
      },
    ],
    configSchema: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          type: "object",
          title: "Data",
          description: "JSON data to send to client. Supports template syntax: {{signal.fieldName}}",
          default: {},
          "ui:field": "template",
        },
        objectId: {
          type: "string",
          title: "Object ID (optional)",
          description: "Optional custom ID. If not provided, uses node ID.",
          default: "",
          "ui:field": "template",
        },
      },
    },
    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const SendObjectNode = {
  definition,
  executor: SendObjectExecutor,
};

export { createNodeDefinition };
