import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AirtableExistsExecutor from "./executor";

export const NODE_TYPE = "AirtableExists";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Airtable Exists",
    description: "Check if a record exists in an Airtable table by matching a field value. Returns true/false.",
    category: "Storage",
    color: "#18BFFF",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1775377626/gravity/icons/airtable.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes that can be referenced in templates",
      },
    ],
    outputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Passes exists (true/false) and recordId. Use an IfElse node on signal.exists to branch.",
      },
    ],
    configSchema: {
      type: "object",
      required: ["baseId", "tableId", "field", "value"],
      properties: {
        baseId: {
          type: "string",
          title: "Base ID",
          description: "Airtable Base ID (starts with 'app')",
          default: "",
          "ui:field": "template",
        },
        tableId: {
          type: "string",
          title: "Table Name or ID",
          description: "Table name (e.g. 'Companies') or table ID (starts with 'tbl')",
          default: "",
          "ui:field": "template",
        },
        field: {
          type: "string",
          title: "Field Name",
          description: "The field to search in (e.g. 'apollo_id' or 'primary_domain')",
          default: "",
          "ui:field": "template",
        },
        value: {
          type: "string",
          title: "Value",
          description: "The value to look for (e.g. loop.item.apollo_id)",
          default: "",
          "ui:field": "template",
        },
      },
    },
    credentials: [
      {
        name: "airtableCredential",
        required: true,
      },
    ],
    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const AirtableExistsNode = {
  definition,
  executor: AirtableExistsExecutor,
};

export { createNodeDefinition };
