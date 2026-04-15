import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ApolloSearchConfig, ApolloSearchExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { searchApollopeople } from "../service/apolloSearchService";

const NODE_TYPE = "ApolloPeople";

export class ApolloPeopleExecutor extends PromiseNode<ApolloSearchConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ApolloSearchConfig,
    context: NodeExecutionContext,
  ): Promise<ApolloSearchExecutorOutput> {
    const logger = createLogger("ApolloPeople");

    logger.info("Starting Apollo People Search", {
      page: config.page,
      perPage: config.perPage,
    });

    try {
      const results = await searchApollopeople(config, context);

      logger.info("Apollo People Search completed", {
        people: results.people.length,
        organizations: results.organizations.length,
        totalCount: results.totalCount,
      });

      return {
        __outputs: {
          people: results.people,
          organizations: results.organizations,
          totalCount: results.totalCount,
          page: results.page,
          perPage: results.perPage,
        },
      };
    } catch (error) {
      logger.error("Apollo People Search failed", { error });
      throw error;
    }
  }
}
