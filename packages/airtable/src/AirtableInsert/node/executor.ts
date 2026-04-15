import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AirtableInsertConfig, AirtableInsertExecutorOutput } from "../util/types";
import { insertAirtableRecords } from "../service/airtableInsertService";

const NODE_TYPE = "AirtableInsert";

export default class AirtableInsertExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: AirtableInsertConfig,
    context: NodeExecutionContext,
  ): Promise<AirtableInsertExecutorOutput> {
    try {
      const result = await insertAirtableRecords(config, context, this.logger);
      this.logger.info("Airtable insert completed", { inserted: result.inserted, skipped: result.skipped });
      return {
        __outputs: {
          inserted: result.inserted,
          skipped: result.skipped,
          total: result.total,
          errors: result.errors,
        },
      };
    } catch (error) {
      this.logger.error("Airtable insert failed", { error });
      throw error;
    }
  }
}
