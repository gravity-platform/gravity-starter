import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { ApolloPeopleExecutor } from "./executor";

export const NODE_TYPE = "ApolloPeople";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Apollo People",
    description: "Search Apollo.io for people by title, seniority, department, location and company name or domain",
    category: "Ingest",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1775374180/gravity/icons/apollo.jpg",
    color: "#F5D800",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes that can be referenced in templates",
      },
    ],

    outputs: [
      {
        name: "people",
        type: NodeInputType.ARRAY,
        description: "Array of matched people with their profile and organisation details",
      },
      {
        name: "totalCount",
        type: NodeInputType.NUMBER,
        description: "Total number of matching records in the Apollo database",
      },
      {
        name: "page",
        type: NodeInputType.NUMBER,
        description: "Current page number returned",
      },
      {
        name: "perPage",
        type: NodeInputType.NUMBER,
        description: "Number of results per page",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        personTitles: {
          type: "string",
          title: "Person Titles",
          description: "Comma-separated job titles to filter by (e.g. 'CEO, CTO, VP Engineering')",
          default: "",
          "ui:field": "template",
        },
        organizationNames: {
          type: "string",
          title: "Organisation Names",
          description: "Comma-separated company names to filter by (e.g. 'Google, Meta')",
          default: "",
          "ui:field": "template",
        },
        organizationDomains: {
          type: "string",
          title: "Organisation Domains",
          description: "Comma-separated company domains to filter by (e.g. 'google.com, meta.com')",
          default: "",
          "ui:field": "template",
        },
        personLocations: {
          type: "string",
          title: "Person Locations",
          description: "Comma-separated locations for the person (e.g. 'New York, London')",
          default: "",
          "ui:field": "template",
        },
        personSeniorities: {
          type: "string",
          title: "Seniority Levels",
          description: "Comma-separated seniority levels (e.g. 'senior, manager, director, vp, c_suite')",
          default: "",
          "ui:field": "template",
        },
        personDepartments: {
          type: "string",
          title: "Departments",
          description: "Comma-separated departments (e.g. 'engineering, sales, marketing, operations')",
          default: "",
          "ui:field": "template",
        },
        perPage: {
          type: "number",
          title: "Results Per Page",
          description: "Number of results to return per page (max 100)",
          default: 25,
          minimum: 1,
          maximum: 100,
        },
        page: {
          type: "number",
          title: "Page",
          description: "Page number to retrieve (max 500 pages, 50,000 total records)",
          default: 1,
          minimum: 1,
          maximum: 500,
        },
      },
      required: [],
    },

    credentials: [
      {
        name: "apolloCredential",
        required: true,
        displayName: "Apollo.io API",
        description: "Apollo.io master API key for people and organisation search",
      },
    ],

    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const ApolloPeopleNode = {
  definition,
  executor: ApolloPeopleExecutor,
};

export { createNodeDefinition };
