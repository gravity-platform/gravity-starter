import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AirtableExistsConfig, AirtableExistsExecutorOutput } from "../util/types";
import { checkAirtableExists } from "../service/airtableExistsService";

const NODE_TYPE = "AirtableExists";

export default class AirtableExistsExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: AirtableExistsConfig,
    context: NodeExecutionContext,
  ): Promise<AirtableExistsExecutorOutput> {
    try {
      const result = await checkAirtableExists(config, context, this.logger);
      this.logger.info("Airtable exists check completed", { exists: result.exists });
      return {
        __outputs: {
          signal: { exists: result.exists, recordId: result.recordId },
        },
      };
    } catch (error) {
      this.logger.error("Airtable exists check failed", { error });
      throw error;
    }
  }
}
