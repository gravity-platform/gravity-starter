/**
 * Design System Plugin
 * UI Components for Gravity workflow system
 *
 * Generated nodes are imported directly - no dynamic ingestion needed
 */

import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";
import * as path from "path";

// Import generated nodes
import { AIResponseNode } from "./AIResponse/node";
import { AccountTransferWidgetNode } from "./AccountTransferWidget/node";
import { AudioPlayerNode } from "./AudioPlayer/node";
import { BookingWidgetNode } from "./BookingWidget/node";
import { CardNode } from "./Card/node";
import { Card2Node } from "./Card2/node";
import { CardCarouselNode } from "./CardCarousel/node";
import { ChatInputNode } from "./ChatInput/node";
import { CardFinderNode } from "./CardFinder/node";
import { ListPickerNode } from "./ListPicker/node";
import { PDFViewerNode } from "./PDFViewer/node";

// All design system nodes
const nodes = [
  AIResponseNode,
  AccountTransferWidgetNode,
  AudioPlayerNode,
  BookingWidgetNode,
  CardNode,
  Card2Node,
  CardCarouselNode,
  CardFinderNode,
  ChatInputNode,
  ListPickerNode,
  PDFViewerNode,
];

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    // Register this package's path for component serving
    // __dirname is dist/src, so go up twice to get package root
    const packagePath = path.join(__dirname, "../..");

    if (api.registerComponentPath) {
      api.registerComponentPath(packagePath);
    }

    // Set platform dependencies for this package
    const { setPlatformDependencies } = await import("@gravity-platform/plugin-base");
    setPlatformDependencies({
      PromiseNode: api.classes.PromiseNode,
      CallbackNode: api.classes.CallbackNode,
      NodeInputType: api.types.NodeInputType,
      NodeConcurrency: api.types.NodeConcurrency,
      getNodeCredentials: api.getNodeCredentials,
      getConfig: api.getConfig,
      createLogger: api.createLogger,
      saveTokenUsage: api.saveTokenUsage,
      callService: api.callService,
      getRedisClient: api.getRedisClient,
      gravityPublish: api.gravityPublish,
      executeNodeWithRouting: api.executeNodeWithRouting,
      getAudioWebSocketManager: api.getAudioWebSocketManager,
    });

    // Register all nodes
    for (const node of nodes) {
      api.registerNode(node);
    }
  },
});

export default plugin;
