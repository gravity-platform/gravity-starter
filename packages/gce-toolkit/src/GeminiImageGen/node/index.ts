/**
 * Gemini Image Generation Node Definition
 * Provides AI image generation capabilities using Google's Gemini models
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import GeminiImageGenExecutor from "./executor";

// Export a function that creates the definition after platform deps are set
export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.0",
    type: "GeminiImageGen",
    isService: false,
    name: "Gemini Image Gen",
    description: "Generate images using Google's Gemini AI models",
    category: "AI",
    color: "#4285F4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768126954/gravity/icons/gemini.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes that can be referenced in templates",
      },
    ],

    outputs: [
      {
        name: "images",
        type: NodeInputType.ARRAY,
        description: "Array of generated images with base64 data and metadata",
      },
      {
        name: "text",
        type: NodeInputType.STRING,
        description: "Optional text response from Gemini",
      },
      {
        name: "metadata",
        type: NodeInputType.OBJECT,
        description: "Generation metadata including model and image count",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          title: "Model",
          description: "Select the Gemini model to use",
          enum: ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"],
          enumNames: ["Gemini 2.5 Flash Image (Nano Banana)", "Gemini 3 Pro (Nano Banana Pro)"],
          default: "gemini-2.5-flash-image",
        },
        prompt: {
          type: "string",
          title: "Image Prompt",
          description:
            "Describe the image you want to generate. Supports template syntax like {{input.fieldName}} to reference input data.",
          default: "",
          "ui:field": "template",
          "ui:ai": {
            editable: true,
          },
        },
        numberOfImages: {
          type: "number",
          title: "Number of Images",
          description: "Number of images to generate (1-10)",
          default: 1,
          minimum: 1,
          maximum: 10,
        },
        fileName: {
          type: "string",
          title: "File Name Prefix",
          description: "Prefix for generated image file names (optional)",
          default: "generated_image",
          "ui:field": "template",
        },
        referenceImageUrl: {
          type: "string",
          title: "Reference Image URL",
          description: "URL of a reference image for likeness/style. Supports {{signal.node.output.photo_url}} syntax.",
          default: "",
          "ui:field": "template",
        },
      },
      required: ["model", "prompt"],
    },

    // This is where we declare credential requirements
    credentials: [
      {
        name: "geminiCredential",
        required: true,
        displayName: "Google Gemini API",
        description: "Google Gemini API credentials for authentication",
      },
    ],

    capabilities: {
      isTrigger: false,
    },
  };
}

// Create and export the node
const definition = createNodeDefinition();

// Export as enhanced node
export const GeminiImageGenNode = {
  definition,
  executor: GeminiImageGenExecutor,
};

// Export for node registry
export { definition };
