import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AbyssaleConfig, AbyssaleExecutorOutput } from "../util/types";
import { renderTemplate, renderMultiPagePdf } from "../service/abyssaleService";

const NODE_TYPE = "Abyssale";

export class AbyssaleExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: AbyssaleConfig,
    context: NodeExecutionContext,
  ): Promise<AbyssaleExecutorOutput> {
    const logger = context.api?.createLogger?.("Abyssale") || this.logger;

    logger.info("Starting Abyssale template render", {
      nodeId: context.nodeId,
      templateId: config.templateId,
      formatName: config.formatName,
    });

    // Build credential context
    const credentialContext = this.buildCredentialContext(context);

    try {
      // Route to appropriate API based on multiPage toggle
      const result = config.multiPage
        ? await renderMultiPagePdf(config, credentialContext, context.api)
        : await renderTemplate(config, credentialContext, context.api);

      logger.info("Abyssale render completed", {
        templateId: result.template.id,
        templateName: result.template.name,
        fileType: result.file.type,
        cdnUrl: result.file.cdn_url,
      });

      // Return with __outputs wrapper
      return {
        __outputs: {
          output: {
            url: result.file.url,
            cdnUrl: result.file.cdn_url,
            fileType: result.file.type,
            filename: result.file.filename,
            width: result.format.width,
            height: result.format.height,
            templateId: result.template.id,
            templateName: result.template.name,
          },
        },
      };
    } catch (error) {
      logger.error("Abyssale render failed", {
        templateId: config.templateId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   * Uses validateAndGetContext like other working nodes (BedrockClaude, OpenAIStream)
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);

    return {
      workflowId,
      executionId,
      nodeId,
      nodeType: NODE_TYPE,
      config: context.config,
      credentials: context.credentials || {},
    };
  }
}
