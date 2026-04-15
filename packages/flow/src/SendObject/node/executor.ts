import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { SendObjectConfig, SendObjectOutput } from "../util/types";
import { publishObject } from "../service/publishObject";

const NODE_TYPE = "SendObject";

export default class SendObjectExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SendObjectConfig,
    context: NodeExecutionContext,
  ): Promise<SendObjectOutput> {
    if (!config.data) {
      throw new Error("Data is required");
    }

    let data = config.data;
    if (typeof config.data === "string") {
      try {
        data = JSON.parse(config.data);
      } catch {
        data = config.data;
      }
    }

    // Use custom objectId if provided, otherwise use nodeId
    const objectId = config.objectId && config.objectId.trim() !== "" ? config.objectId : context.nodeId;

    this.logger.info("SendObject: sending data to client", {
      id: objectId,
      nodeId: context.nodeId,
      dataKeys: typeof config.data === "object" ? Object.keys(config.data) : "primitive",
    });

    // Publish object to client via WebSocket
    if (!context.publishingContext) {
      this.logger.warn("Publishing context not available - object will not be sent to client");
    } else {
      await publishObject(
        {
          objectId,
          data,
          chatId: context.publishingContext.chatId,
          conversationId: context.publishingContext.conversationId,
          userId: context.publishingContext.userId,
          providerId: context.publishingContext.providerId || "flow",
          workflowId: context.workflowId,
          workflowRunId: context.executionId,
          nodeId: context.nodeId,
        },
        context.api,
        context,
      );
    }

    // Return data with ID for client identification
    return {
      __outputs: {
        id: objectId,
        data,
      },
    } as any;
  }
}
