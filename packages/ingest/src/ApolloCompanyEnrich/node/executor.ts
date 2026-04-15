import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ApolloCompanyEnrichConfig, ApolloCompanyEnrichExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { enrichApolloCompany } from "../service/apolloCompanyEnrichService";

const NODE_TYPE = "ApolloCompanyEnrich";

export class ApolloCompanyEnrichExecutor extends PromiseNode<ApolloCompanyEnrichConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ApolloCompanyEnrichConfig,
    context: NodeExecutionContext,
  ): Promise<ApolloCompanyEnrichExecutorOutput> {
    const logger = createLogger("ApolloCompanyEnrich");

    try {
      const result = await enrichApolloCompany(config, context);
      logger.info("Apollo Company Enrich completed", { found: result.found });
      return { __outputs: { company: result.company, found: result.found } };
    } catch (error) {
      logger.error("Apollo Company Enrich failed", { error });
      throw error;
    }
  }
}
