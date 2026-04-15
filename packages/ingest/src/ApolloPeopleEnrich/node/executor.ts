import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ApolloPeopleEnrichConfig, ApolloPeopleEnrichExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { enrichApolloPerson } from "../service/apolloPeopleEnrichService";

const NODE_TYPE = "ApolloPeopleEnrich";

export class ApolloPeopleEnrichExecutor extends PromiseNode<ApolloPeopleEnrichConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ApolloPeopleEnrichConfig,
    context: NodeExecutionContext,
  ): Promise<ApolloPeopleEnrichExecutorOutput> {
    const logger = createLogger("ApolloPeopleEnrich");

    try {
      const result = await enrichApolloPerson(config, context);
      logger.info("Apollo People Enrich completed", { found: result.found });
      return { __outputs: { person: result.person, found: result.found } };
    } catch (error) {
      logger.error("Apollo People Enrich failed", { error });
      throw error;
    }
  }
}
