/**
 * Postgres Toolkit Plugin
 * Provides PostgreSQL batch INSERT operations with table protection
 */

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

    // Register PostgresInsert node
    const { PostgresInsertNode } = await import("./PostgresInsert/node");
    api.registerNode(PostgresInsertNode);

    // Register PostgresFetch node
    const { PostgresFetchNode } = await import("./PostgresFetch/node");
    api.registerNode(PostgresFetchNode);
  },
});

export default plugin;
