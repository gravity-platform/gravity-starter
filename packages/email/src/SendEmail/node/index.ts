import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import SendEmailExecutor from "./executor";

export const NODE_TYPE = "SendEmail";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Send Email",
    description: "Send an email via Microsoft 365 (SMTP). Accepts plain text or HTML body.",
    category: "Communication",
    color: "#0078D4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1775377626/gravity/icons/microsoft365.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Trigger signal — connect from upstream node",
      },
    ],
    outputs: [
      {
        name: "sent",
        type: NodeInputType.BOOLEAN,
        description: "True if email was sent successfully",
      },
      {
        name: "messageId",
        type: NodeInputType.STRING,
        description: "SMTP message ID returned by the mail server",
      },
    ],
    configSchema: {
      type: "object",
      required: ["provider", "to", "subject", "body"],
      properties: {
        provider: {
          type: "string",
          title: "Provider",
          description: "Email provider to use",
          default: "microsoft365",
          enum: ["microsoft365"],
          enumNames: ["Microsoft 365"],
        },
        from: {
          type: "string",
          title: "From",
          description: "Sender email address. Defaults to the credential username if left blank.",
          default: "",
          "ui:field": "template",
        },
        to: {
          type: "string",
          title: "To",
          description: "Recipient email address. Separate multiple with commas.",
          default: "",
          "ui:field": "template",
        },
        subject: {
          type: "string",
          title: "Subject",
          description: "Email subject line",
          default: "",
          "ui:field": "template",
        },
        body: {
          type: "string",
          title: "Body",
          description: "Email body — plain text or HTML",
          default: "",
          "ui:field": "template",
        },
        bodyType: {
          type: "string",
          title: "Body Type",
          description: "Whether the body is plain text or HTML",
          default: "text",
          enum: ["text", "html"],
          enumNames: ["Plain Text", "HTML"],
        },
        autoLinkUrls: {
          type: "boolean",
          title: "Auto-link URLs",
          description:
            "When HTML mode is selected, automatically convert bare URLs in the body into clickable hyperlinks",
          default: true,
        },
        gaMeasurementId: {
          type: "string",
          title: "GA Measurement ID (optional)",
          description:
            "Google Analytics Measurement ID (e.g. G-XXXXXXXXXX). Appends a 1x1 tracking pixel to the HTML body to track email opens.",
          default: "",
        },
        utmSource: {
          type: "string",
          title: "UTM Source (optional)",
          description: "e.g. 'newsletter' — added as utm_source to all links in the email",
          default: "",
          "ui:field": "template",
        },
        utmMedium: {
          type: "string",
          title: "UTM Medium (optional)",
          description: "e.g. 'email'",
          default: "",
          "ui:field": "template",
        },
        utmCampaign: {
          type: "string",
          title: "UTM Campaign (optional)",
          description: "e.g. 'april-outreach'",
          default: "",
          "ui:field": "template",
        },
        utmContent: {
          type: "string",
          title: "UTM Content (optional)",
          description: "e.g. 'cta-button' — use to differentiate links in A/B tests",
          default: "",
          "ui:field": "template",
        },
        cc: {
          type: "string",
          title: "CC (optional)",
          description: "CC recipients, comma-separated",
          default: "",
          "ui:field": "template",
        },
        bcc: {
          type: "string",
          title: "BCC (optional)",
          description: "BCC recipients, comma-separated",
          default: "",
          "ui:field": "template",
        },
      },
    },
    credentials: [
      {
        name: "microsoft365Credential",
        required: true,
      },
    ],
    capabilities: {
      isTrigger: false,
    },
  };
}

const definition = createNodeDefinition();

export const SendEmailNode = {
  definition,
  executor: SendEmailExecutor,
};

export { createNodeDefinition };
