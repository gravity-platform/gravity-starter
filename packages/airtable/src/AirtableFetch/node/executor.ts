import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AirtableFetchConfig, AirtableFetchExecutorOutput } from "../util/types";
import { fetchAirtableRecords } from "../service/airtableFetchService";

const NODE_TYPE = "AirtableFetch";

export default class AirtableFetchExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: AirtableFetchConfig,
    context: NodeExecutionContext,
  ): Promise<AirtableFetchExecutorOutput> {
    try {
      const result = await fetchAirtableRecords(config, context, this.logger);
      this.logger.info("Airtable fetch completed", { records: result.records.length });
      return {
        __outputs: {
          records: result.records,
          totalCount: result.totalCount,
        },
      };
    } catch (error) {
      this.logger.error("Airtable fetch failed", { error });
      throw error;
    }
  }
}
