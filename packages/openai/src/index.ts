/**
 * @gravity/openai
 * OpenAI integration for Gravity platform
 */

import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    // Set up platform dependencies using the standard initializer
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Import nodes after dependencies are set
    const { OpenAINode } = await import("./OpenAI/node");
    const { OpenAIServiceNode } = await import("./OpenAIService/node");
    const { OpenAIStreamNode } = await import("./OpenAIStream/node");
    const { ChatGPTAgentNode } = await import("./ChatGPTAgent/node");
    const { OpenAIEmbeddingServiceNode } = await import("./OpenAIEmbeddingService/node");
    const { OpenAIStructuredOutputNode } = await import("./OpenAIStructuredOutput/node");

    // Import credential
    const { OpenAICredential } = await import("./credentials");

    // Register nodes - pass the complete node objects
    api.registerNode(OpenAINode);
    api.registerNode(OpenAIServiceNode);
    api.registerNode(OpenAIStreamNode);
    api.registerNode(ChatGPTAgentNode);
    api.registerNode(OpenAIEmbeddingServiceNode);
    api.registerNode(OpenAIStructuredOutputNode);

    // Register credential
    api.registerCredential(OpenAICredential);

    // Import and register services
    const { createEmbedding } = await import("./OpenAIEmbeddingService/service/embeddings");
    const { queryChatGPT } = await import("./OpenAI/service/queryChatGPT");

    // Register services for platform use
    api.registerService("openai-embeddings", createEmbedding);
    api.registerService("openai-chat", queryChatGPT);
    // Note: OpenAIStream is now a CallbackNode - no service registration needed
  },
});

export default plugin;
