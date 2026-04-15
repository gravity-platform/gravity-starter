import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    const { AirtableInsertNode } = await import("./AirtableInsert/node");
    api.registerNode(AirtableInsertNode);

    const { AirtableFetchNode } = await import("./AirtableFetch/node");
    api.registerNode(AirtableFetchNode);

    const { AirtableExistsNode } = await import("./AirtableExists/node");
    api.registerNode(AirtableExistsNode);

    const { AirtableCredential } = await import("./credentials");
    api.registerCredential(AirtableCredential);
  },
});

export default plugin;
