import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { ApolloCompanyExecutor } from "./executor";

export const NODE_TYPE = "ApolloCompany";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Apollo Company",
    description:
      "Search Apollo.io for companies by keyword/description (e.g. 'AI consultancy'), name, domain, industry, location and size",
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
        name: "companies",
        type: NodeInputType.ARRAY,
        description: "Array of matched companies with profile, industry and contact details",
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
        keywords: {
          type: "string",
          title: "Keywords / Description",
          description:
            "Comma-separated keywords or descriptions to match against company profiles (e.g. 'AI consultancy, machine learning, SaaS')",
          default: "",
          "ui:field": "template",
        },
        organizationNames: {
          type: "string",
          title: "Company Names",
          description: "Comma-separated exact company names to filter by (e.g. 'Google, Meta')",
          default: "",
          "ui:field": "template",
        },
        organizationDomains: {
          type: "string",
          title: "Company Domains",
          description: "Comma-separated company domains to filter by (e.g. 'google.com, meta.com')",
          default: "",
          "ui:field": "template",
        },
        organizationLocations: {
          type: "string",
          title: "Locations",
          description: "Comma-separated HQ locations (e.g. 'London, New York, San Francisco')",
          default: "",
          "ui:field": "template",
        },
        industries: {
          type: "string",
          title: "Industries",
          description:
            "Comma-separated industry names to filter by (e.g. 'information technology, financial services, healthcare')",
          default: "",
          "ui:field": "template",
        },
        organizationNumEmployeesRanges: {
          type: "string",
          title: "Company Size Ranges",
          description:
            "Semicolon-separated employee count ranges (e.g. '1,10;11,50;51,200'). Each range is min,max. Common: '1,10' '11,50' '51,200' '201,500' '501,1000' '1001,5000' '5001,10000'",
          default: "",
          "ui:field": "template",
        },
        limit: {
          type: "number",
          title: "Number of Results",
          description: "Number of companies to return. Fetches multiple pages automatically if over 100.",
          default: 25,
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
        description: "Apollo.io master API key for company search",
      },
    ],

    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const ApolloCompanyNode = {
  definition,
  executor: ApolloCompanyExecutor,
};

export { createNodeDefinition };
