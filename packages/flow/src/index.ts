import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    // Initialize platform dependencies
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Import and register flow nodes
    const { CodeNode } = await import("./Code");
    api.registerNode(CodeNode);

    const { IfElseNode } = await import("./IfElse");
    api.registerNode(IfElseNode);

    const { LoopNode } = await import("./Loop");
    api.registerNode(LoopNode);

    const { ContextNode } = await import("./Context");
    api.registerNode(ContextNode);

    const { RelayNode } = await import("./Relay");
    api.registerNode(RelayNode);

    const { NoteNode } = await import("./Note");
    api.registerNode(NoteNode);

    const { UMAPNode } = await import("./UMAP");
    api.registerNode(UMAPNode);

    const { MCPNode } = await import("./MCP/node");
    api.registerNode(MCPNode);

    const { FieldValidatorNode } = await import("./FieldValidator");
    api.registerNode(FieldValidatorNode);

    const { SuggestionsNode } = await import("./Suggestions");
    api.registerNode(SuggestionsNode);

    const { SendObjectNode } = await import("./SendObject");
    api.registerNode(SendObjectNode);
  },
});

export default plugin;
