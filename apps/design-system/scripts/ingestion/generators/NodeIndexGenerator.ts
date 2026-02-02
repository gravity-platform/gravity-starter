import type { ComponentMetadata } from "../ComponentScanner";
import { mapControlToSchemaType } from "./controlTypeUtils";

/**
 * Generate node/index.ts file
 */
export function generateNodeIndex(metadata: ComponentMetadata): string {
  // Generate config schema from argTypes with story defaults
  const configSchema = generateConfigSchema(metadata.argTypes, metadata.storyDefaults);

  // Add nodeSize if workflowSize is specified
  const nodeSizeLine = metadata.workflowSize
    ? `    nodeSize: { width: ${metadata.workflowSize.width}, height: ${metadata.workflowSize.height} },\n`
    : "";

  return `/**
 * ${metadata.name} Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ${metadata.name}Executor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "${metadata.name}";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "${metadata.name}",
    description: "${metadata.name} UI component from design system",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
${nodeSizeLine}    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "output", type: NodeInputType.OBJECT, description: "Response object" }],
    configSchema: ${JSON.stringify(configSchema, null, 6)},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const ${metadata.name}Node = {
  definition,
  executor: ${metadata.name}Executor,
};

export { createNodeDefinition as default };
`;
}

function generateConfigSchema(argTypes: Record<string, any>, storyDefaults?: Record<string, any>) {
  const properties: Record<string, any> = {};

  // Add Focus Mode config (universal for all components)
  properties.focusable = {
    type: "boolean",
    title: "Enable Focus Mode",
    description: "Allow this component to expand and become the primary interaction surface",
    default: false,
    "ui:widget": "toggle",
  };

  // Agent name shown in chat input when focused (only visible when focusable is true)
  properties.focusLabel = {
    type: "string",
    title: "Focus Mode Label",
    description: "Name shown in chat input when this component is focused (e.g., 'Bank Transfer')",
    default: "",
    "ui:dependencies": {
      focusable: true,
    },
  };

  for (const [name, argType] of Object.entries(argTypes)) {
    // Skip props that are not workflow inputs (template-only props)
    // Only include props explicitly marked with workflowInput: true
    if (argType.workflowInput !== true) {
      continue;
    }

    // Check if this is a select control with options
    const isSelectControl = argType.control?.type === "select" && argType.control?.options;

    // Map control type to schema type
    const schemaType = isSelectControl ? "string" : mapControlToSchemaType(argType.control);

    // Use story defaults if available (for preview in workflow editor)
    let defaultValue = storyDefaults?.[name];

    // For select controls without a default, use the first option
    if (isSelectControl && defaultValue === undefined && argType.control.options?.length > 0) {
      defaultValue = argType.control.options[0];
    }

    properties[name] = {
      type: schemaType,
      title: argType.description || name,
      // Always include defaults for workflow editor preview
      ...(defaultValue !== undefined && { default: defaultValue }),
    };

    // Add enum for select controls
    if (isSelectControl) {
      properties[name].enum = argType.control.options;
      // Generate enumNames with capitalized labels
      properties[name].enumNames = argType.control.options.map(
        (opt: string) =>
          opt.charAt(0).toUpperCase() +
          opt
            .slice(1)
            .replace(/([A-Z])/g, " $1")
            .trim(),
      );
    }
    // Add template field for non-enum strings and objects
    else if (schemaType === "string" || schemaType === "object") {
      properties[name]["ui:field"] = "template";
    }

    // Add number constraints (min, max, step) for number/range controls
    if (schemaType === "number" && argType.control) {
      const control = typeof argType.control === "object" ? argType.control : {};
      if (control.min !== undefined) {
        properties[name].minimum = control.min;
      }
      if (control.max !== undefined) {
        properties[name].maximum = control.max;
      }
      if (control.step !== undefined) {
        properties[name].step = control.step;
      }
    }

    // Add toggle widget for booleans
    if (schemaType === "boolean") {
      properties[name]["ui:widget"] = "toggle";
    }
  }

  return {
    type: "object",
    properties,
    required: [],
  };
}
