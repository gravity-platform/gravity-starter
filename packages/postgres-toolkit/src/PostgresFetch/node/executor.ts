import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { PostgresFetchConfig, PostgresFetchOutput } from "../util/types";
import { executeFetch } from "../service/fetchService";

const NODE_TYPE = "PostgresFetch";

export default class PostgresFetchExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: PostgresFetchConfig,
    context: NodeExecutionContext,
  ): Promise<PostgresFetchOutput> {
    if (!config.connectionString || config.connectionString.trim() === "") {
      throw new Error("Connection string is required");
    }

    if (!config.tableName || config.tableName.trim() === "") {
      throw new Error("Table name is required");
    }

    const result = await executeFetch({
      ...config,
      logger: this.logger,
    });

    return {
      __outputs: {
        output: result,
      },
    } as any;
  }
}
