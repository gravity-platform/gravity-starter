import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ElevenLabsConfig, ElevenLabsOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { generateTTS } from "../service/elevenlabsService";

const NODE_TYPE = "ElevenLabs";

export default class ElevenLabsExecutor extends PromiseNode<ElevenLabsConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ElevenLabsConfig,
    context: NodeExecutionContext
  ): Promise<ElevenLabsOutput> {
    const logger = createLogger("ElevenLabs");

    logger.info("Starting ElevenLabs TTS generation", {
      nodeId: context.nodeId,
      textLength: config.text?.length || 0,
    });

    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);

    try {
      // Call ElevenLabs API via service
      const result = await generateTTS(config, credentialContext);

      logger.info("ElevenLabs TTS completed", {
        format: result.format,
        durationSeconds: result.durationSeconds,
        characterCount: result.characterCount,
        isDialogue: result.isDialogue,
      });

      // Return with __outputs wrapper
      return {
        __outputs: {
          audio: {
            data: result.audioBase64,
            mimeType: result.contentType,
            fileName: `audio_${Date.now()}.mp3`,
          },
          metadata: {
            format: result.format,
            durationSeconds: result.durationSeconds,
            characterCount: result.characterCount,
            isDialogue: result.isDialogue,
          },
        },
      };
    } catch (error) {
      logger.error("ElevenLabs TTS failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: context.credentials || {},
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
