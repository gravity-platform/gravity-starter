import { type EnhancedNodeDefinition, NodeInputType } from "@gravity-platform/plugin-base";
import ChatGPTAgentExecutor from "./executor";

const definition: EnhancedNodeDefinition = {
  type: "ChatGPTAgent",
  isService: false,
  name: "ChatGPT Agent",
  description: "Intent-based agent with streaming progress log and MCP tool calling",
  category: "AI",
  color: "#2F6F66",
  logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749262616/gravity/icons/ChatGPT-Logo.svg.webp",

  inputs: [
    {
      name: "signal",
      type: NodeInputType.OBJECT,
      description: "Data from previous nodes that can be referenced in templates",
    },
  ],

  outputs: [
    {
      name: "progress",
      type: NodeInputType.STRING,
      description: "Tool/skill call log (emitted in real-time)",
    },
    {
      name: "chunk",
      type: NodeInputType.STRING,
      description: "Streaming LLM text response (emitted in real-time)",
    },
    {
      name: "reasoning",
      type: NodeInputType.STRING,
      description: "LLM reasoning/thinking (separate output)",
    },
    {
      name: "mcpResult",
      type: NodeInputType.OBJECT,
      description: "MCP tool results",
    },
    {
      name: "text",
      type: NodeInputType.STRING,
      description: "Final synthesized response",
    },
  ],

  configSchema: {
    type: "object",
    properties: {
      model: {
        type: "string",
        title: "Model",
        description: "Select the GPT-5 model variant",
        enum: ["gpt-5.2", "gpt-5.2-pro", "gpt-5-mini", "gpt-5-nano"],
        enumNames: [
          "GPT-5.2 (Best general-purpose)",
          "GPT-5.2 Pro (Harder thinking)",
          "GPT-5 Mini (Cost-optimized)",
          "GPT-5 Nano (High-throughput)",
        ],
        default: "gpt-5.2",
      },
      reasoningEffort: {
        type: "string",
        title: "Reasoning Effort",
        description: "Control reasoning depth. GPT-5.2: none/low/medium/high/xhigh.",
        enum: ["none", "low", "medium", "high", "xhigh"],
        enumNames: [
          "None (Fastest, GPT-5.2 only)",
          "Low (Light reasoning)",
          "Medium (Balanced)",
          "High (Thorough)",
          "XHigh (Hardest, GPT-5.2 only)",
        ],
        default: "none",
      },
      reasoningSummary: {
        type: "string",
        title: "Reasoning Summary",
        description: "Control reasoning summary visibility",
        enum: ["auto", "concise", "detailed"],
        default: "concise",
      },
      verbosity: {
        type: "string",
        title: "Verbosity",
        description: "Control output length",
        enum: ["low", "medium", "high"],
        default: "medium",
      },
      enablePreambles: {
        type: "boolean",
        title: "Enable Preambles",
        description: "Let GPT-5 explain why before calling tools",
        default: true,
      },
      enableMarkdown: {
        type: "boolean",
        title: "Enable Markdown Formatting",
        description: "Format output with Markdown",
        default: false,
      },
      systemPrompt: {
        type: "string",
        title: "System Prompt",
        description: "Base system prompt. Supports template syntax like {{input.fieldName}}",
        default: "",
        "ui:field": "template",
      },
      prompt: {
        type: "string",
        title: "Prompt",
        description: "User message/prompt. Supports template syntax like {{input.fieldName}}",
        default: "",
        "ui:field": "template",
      },
      maxTokens: {
        type: "number",
        title: "Max Output Tokens",
        description: "Maximum number of tokens to generate",
        default: 2048,
        minimum: 1,
        maximum: 16384,
      },
      ambition: {
        type: "string",
        title: "Agent Ambition",
        description: "Controls how many tasks the agent can reason about and execute",
        enum: ["small", "medium", "large"],
        enumNames: ["Small (up to 5 tasks)", "Medium (up to 10 tasks)", "Large (up to 20 tasks)"],
        default: "medium",
      },
    },
    required: ["model", "prompt"],
    "ui:order": [
      "model",
      "reasoningEffort",
      "reasoningSummary",
      "verbosity",
      "ambition",
      "enablePreambles",
      "enableMarkdown",
      "systemPrompt",
      "prompt",
      "maxTokens",
    ],
  },

  credentials: [
    {
      name: "openAICredential",
      required: true,
      displayName: "OpenAI API",
      description: "OpenAI API credentials for authentication",
    },
  ],

  serviceConnectors: [
    {
      name: "mcpService",
      description: "MCP service connector - automatic schema discovery",
      serviceType: "mcp",
      isService: false,
    },
  ],
};

export const ChatGPTAgentNode = {
  definition,
  executor: ChatGPTAgentExecutor,
};

export { definition };
