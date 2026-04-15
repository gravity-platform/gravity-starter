import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ApolloSearchCompanyConfig, ApolloSearchCompanyExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { searchApolloCompanies } from "../service/apolloSearchCompanyService";

const NODE_TYPE = "ApolloCompany";

export class ApolloCompanyExecutor extends PromiseNode<ApolloSearchCompanyConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ApolloSearchCompanyConfig,
    context: NodeExecutionContext,
  ): Promise<ApolloSearchCompanyExecutorOutput> {
    const logger = createLogger("ApolloCompany");

    logger.info("Starting Apollo Company Search", {
      limit: config.limit,
    });

    try {
      const results = await searchApolloCompanies(config, context);

      logger.info("Apollo Company Search completed", {
        companies: results.companies.length,
        totalCount: results.totalCount,
      });

      return {
        __outputs: {
          companies: results.companies,
          totalCount: results.totalCount,
          page: results.page,
          perPage: results.perPage,
        },
      };
    } catch (error) {
      logger.error("Apollo Company Search failed", { error });
      throw error;
    }
  }
}
