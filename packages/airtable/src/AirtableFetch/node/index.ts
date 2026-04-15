import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AirtableFetchExecutor from "./executor";

export const NODE_TYPE = "AirtableFetch";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Airtable Fetch",
    description: "Fetch records from an Airtable table with optional filtering, sorting and field selection.",
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
        name: "records",
        type: NodeInputType.ARRAY,
        description: "Array of records fetched from Airtable (each record includes its Airtable id + all fields)",
      },
      {
        name: "totalCount",
        type: NodeInputType.NUMBER,
        description: "Number of records returned",
      },
    ],
    configSchema: {
      type: "object",
      required: ["baseId", "tableId"],
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
        filterFormula: {
          type: "string",
          title: "Filter Formula (optional)",
          description:
            "Airtable formula to filter records (e.g. \"{Status}='Active'\" or \"AND({Score}>80,{Region}='EMEA')\")",
          default: "",
          "ui:field": "template",
        },
        fields: {
          type: "string",
          title: "Fields (optional)",
          description: "Comma-separated list of field names to return. Leave blank to return all fields.",
          default: "",
          "ui:field": "template",
        },
        view: {
          type: "string",
          title: "View (optional)",
          description: "Name or ID of an Airtable view to use (applies the view's filters and sorts)",
          default: "",
          "ui:field": "template",
        },
        sortField: {
          type: "string",
          title: "Sort Field (optional)",
          description: "Field name to sort results by",
          default: "",
          "ui:field": "template",
        },
        sortDirection: {
          type: "string",
          title: "Sort Direction",
          description: "Sort direction when a Sort Field is set",
          default: "asc",
          enum: ["asc", "desc"],
        },
        maxRecords: {
          type: "number",
          title: "Max Records",
          description: "Maximum number of records to fetch. Paginates automatically.",
          default: 100,
          minimum: 1,
          maximum: 5000,
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

export const AirtableFetchNode = {
  definition,
  executor: AirtableFetchExecutor,
};

export { createNodeDefinition };
