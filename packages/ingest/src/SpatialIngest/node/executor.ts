import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { PromiseNode, createLogger } from "../../shared/platform";
import { SpatialIngestConfig, SpatialIngestOutput } from "../util/types";
import { runSpatialIngestPipeline } from "../service/spatialIngestService";

const NODE_TYPE = "SpatialIngest";
const logger = createLogger(NODE_TYPE);

export class SpatialIngestExecutor extends PromiseNode<SpatialIngestConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SpatialIngestConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    const startTime = Date.now();
    const workflowId = context.workflow?.id || "";
    const nodeId = context.nodeId;

    const rawContent = config.rawContent?.trim();
    if (!rawContent) {
      logger.warn(`[${NODE_TYPE}] rawContent is empty, skipping`);
      return { __outputs: { success: false, count: 0, universalIds: [] } satisfies SpatialIngestOutput };
    }

    const openAIApiKey = context.credentials?.openAICredential?.apiKey;
    if (!openAIApiKey) {
      throw new Error(`[${NODE_TYPE}] openAICredential.apiKey is required`);
    }

    const category = (config.category || "need").toLowerCase();
    const domainPrompt = config.domainPrompt || "";

    logger.info(`[${NODE_TYPE}] Starting node: ${nodeId}`, {
      workflowId,
      category,
      contentLength: rawContent.length,
      hasDomainPrompt: !!domainPrompt,
    });

    const { success, entries } = await runSpatialIngestPipeline({
      rawContent,
      category,
      domainPrompt,
      workflowId,
      sourceUrl: config.sourceUrl,
      openAIApiKey,
    });

    const universalIds = entries.map((e) => e.universal_id);

    logger.info(`[${NODE_TYPE}] Done: ${nodeId} in ${Date.now() - startTime}ms`, {
      workflowId,
      success,
      count: entries.length,
    });

    return {
      __outputs: {
        success,
        count: entries.length,
        universalIds,
        entries,
      },
    };
  }
}
