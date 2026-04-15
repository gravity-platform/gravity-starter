import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AirtableInsertExecutor from "./executor";

export const NODE_TYPE = "AirtableInsert";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Airtable Insert",
    description: "Append records to an Airtable table with optional dedup. Accepts an object or array of objects.",
    category: "Storage",
    color: "#18BFFF",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1775377626/gravity/icons/airtable.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Records to insert — object or array of objects",
      },
    ],
    outputs: [
      {
        name: "inserted",
        type: NodeInputType.NUMBER,
        description: "Number of records inserted",
      },
      {
        name: "skipped",
        type: NodeInputType.NUMBER,
        description: "Number of records skipped (duplicates)",
      },
      {
        name: "total",
        type: NodeInputType.NUMBER,
        description: "Total records received",
      },
      {
        name: "errors",
        type: NodeInputType.ARRAY,
        description: "Any batch errors",
      },
    ],
    configSchema: {
      type: "object",
      required: ["baseId", "tableId", "records"],
      properties: {
        baseId: {
          type: "string",
          title: "Base ID",
          description: "Airtable Base ID (starts with 'app', found in the API docs for your base)",
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
        records: {
          type: "object",
          title: "Records",
          description: "Object or array of objects to insert. Keys must match Airtable column names exactly.",
          default: {},
          "ui:field": "template",
        },
        dedupField: {
          type: "string",
          title: "Dedup Field (optional)",
          description:
            "Field name to check for duplicates before inserting (e.g. 'id' or 'primary_domain'). Leave blank to skip dedup.",
          default: "",
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

export const AirtableInsertNode = {
  definition,
  executor: AirtableInsertExecutor,
};

export { createNodeDefinition };
