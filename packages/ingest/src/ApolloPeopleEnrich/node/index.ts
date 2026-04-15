import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { ApolloPeopleEnrichExecutor } from "./executor";

export const NODE_TYPE = "ApolloPeopleEnrich";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Apollo People Enrich",
    description: "Enrich a person's profile from Apollo.io using email, name, domain or LinkedIn URL",
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
        name: "person",
        type: NodeInputType.OBJECT,
        description: "Enriched person profile from Apollo.io",
      },
      {
        name: "found",
        type: NodeInputType.BOOLEAN,
        description: "Whether a matching person was found in Apollo",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          title: "Email",
          description: "Email address of the person (strongest identifier)",
          default: "",
          "ui:field": "template",
        },
        linkedinUrl: {
          type: "string",
          title: "LinkedIn URL",
          description: "LinkedIn profile URL (e.g. 'https://linkedin.com/in/johndoe')",
          default: "",
          "ui:field": "template",
        },
        firstName: {
          type: "string",
          title: "First Name",
          description: "Person's first name",
          default: "",
          "ui:field": "template",
        },
        lastName: {
          type: "string",
          title: "Last Name",
          description: "Person's last name",
          default: "",
          "ui:field": "template",
        },
        domain: {
          type: "string",
          title: "Company Domain",
          description: "Domain of the person's company (e.g. 'google.com')",
          default: "",
          "ui:field": "template",
        },
        organizationName: {
          type: "string",
          title: "Company Name",
          description: "Name of the person's company",
          default: "",
          "ui:field": "template",
        },
        revealPersonalEmails: {
          type: "boolean",
          title: "Reveal Personal Emails",
          description: "Request personal email addresses (consumes credits)",
          default: false,
          "ui:widget": "toggle",
        },
        revealPhoneNumber: {
          type: "boolean",
          title: "Reveal Phone Number",
          description: "Request phone numbers (consumes credits)",
          default: false,
          "ui:widget": "toggle",
        },
      },
      required: [],
    },

    credentials: [
      {
        name: "apolloCredential",
        required: true,
        displayName: "Apollo.io API",
        description: "Apollo.io master API key for enrichment",
      },
    ],

    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const ApolloPeopleEnrichNode = {
  definition,
  executor: ApolloPeopleEnrichExecutor,
};

export { createNodeDefinition };
