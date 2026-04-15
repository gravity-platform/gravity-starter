/**
 * Object publishing service
 * Publishes JSON data to the client via COMPONENT_INIT (same as design-system components)
 */

import { v4 as uuid } from "uuid";

export interface ObjectPublishConfig {
  objectId: string;
  data: any;
  chatId: string;
  conversationId: string;
  userId: string;
  providerId: string;
  workflowId: string;
  workflowRunId: string;
  nodeId: string;
  metadata?: Record<string, any>;
}

export async function publishObject(
  config: ObjectPublishConfig,
  api: any,
  context?: any,
): Promise<{ channel: string; success: boolean }> {
  const logger = api?.createLogger?.("ObjectPublisher") || console;

  try {
    // Get WebSocket manager
    const wsManager = api?.getWebSocketManager?.();
    const websocket = wsManager?.get(config.userId, config.conversationId);

    const componentKey = `${config.chatId}_${config.nodeId}`;

    logger.info("📦 Publishing object via COMPONENT_INIT", {
      nodeId: config.nodeId,
      objectId: config.objectId,
      componentKey,
    });

    const event = {
      type: "OBJECT_DATA",
      nodeId: config.nodeId,
      chatId: config.chatId,
      data: config.data,
    };

    // Check if we have a valid WebSocket connection
    if (!wsManager) {
      logger.warn("WebSocket manager not available");
      return { channel: "websocket", success: false };
    }

    if (!websocket) {
      logger.warn("WebSocket connection not found - object not sent", {
        userId: config.userId,
        conversationId: config.conversationId,
      });
      return { channel: "websocket", success: false };
    }

    // Send to WebSocket
    websocket.send(JSON.stringify(event));

    logger.info("✅ Data object sent to client", {
      nodeId: config.nodeId,
      objectId: config.objectId,
    });

    return { channel: "websocket", success: true };
  } catch (error: any) {
    logger.error("Failed to publish object", {
      error: error.message,
      workflowId: config.workflowId,
      nodeId: config.nodeId,
    });
    throw error;
  }
}
