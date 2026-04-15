import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import PostgresFetchExecutor from "./executor";

export const NODE_TYPE = "PostgresFetch";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Postgres Fetch",
    description:
      "SELECT records from any PostgreSQL table. Filter by column values, control ordering, and limit results.",
    category: "Storage",
    color: "#336791",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Trigger signal — not used for record data",
      },
    ],
    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Fetch result: { success, rows, rowCount, tableName }",
      },
    ],
    configSchema: {
      type: "object",
      required: ["connectionString", "tableName"],
      properties: {
        connectionString: {
          type: "string",
          title: "Connection String",
          description: "PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/dbname?sslmode=require)",
          default: "",
          "ui:field": "template",
        },
        tableName: {
          type: "string",
          title: "Table Name",
          description: "Table to query. Must already exist.",
          default: "",
          "ui:field": "template",
        },
        columns: {
          type: "string",
          title: "Columns (optional)",
          description: "Comma-separated column names to return. Leave blank to return all columns (SELECT *).",
          default: "",
        },
        filterColumn: {
          type: "string",
          title: "Filter Column (optional)",
          description: "Column name to filter on (e.g. mystery_id). Leave blank to return all rows.",
          default: "",
        },
        filterOperator: {
          type: "string",
          title: "Filter Operator",
          description: "Comparison operator",
          enum: ["=", "!=", ">", ">=", "<", "<=", "LIKE", "ILIKE", "IN", "IS NULL", "IS NOT NULL"],
          default: "=",
        },
        filterValue: {
          type: "string",
          title: "Filter Value",
          description:
            'Value to match. Supports template syntax. For IN use a JSON array: ["a","b"]. Not needed for IS NULL / IS NOT NULL.',
          default: "",
          "ui:field": "template",
        },
        orderBy: {
          type: "string",
          title: "Order By (optional)",
          description: "Column name to sort results by.",
          default: "",
        },
        orderDirection: {
          type: "string",
          title: "Order Direction",
          description: "Sort direction",
          enum: ["ASC", "DESC"],
          default: "ASC",
        },
        limit: {
          type: "number",
          title: "Limit (optional)",
          description: "Maximum number of rows to return. Leave blank or 0 for no limit.",
          default: 0,
          minimum: 0,
        },
        offset: {
          type: "number",
          title: "Offset (optional)",
          description: "Number of rows to skip (for pagination).",
          default: 0,
          minimum: 0,
        },
      },
    },
    capabilities: {
      isTrigger: false,
    },
    services: {
      provides: [],
      requires: {},
    },
  };
}

const definition = createNodeDefinition();

export const PostgresFetchNode = {
  definition,
  executor: PostgresFetchExecutor,
};

export { createNodeDefinition };
