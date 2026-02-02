/**
 * OpenAI Streaming Service (Refactored)
 * Stateful callback-based streaming with MCP tool support
 *
 * Architecture:
 * - MCP Tool Discovery: Discovers and converts MCP services to OpenAI tools
 * - OpenAI Client: Initializes client and builds messages
 * - Conversation Loop: Manages multi-turn conversation with tool calling
 * - Stream Processor: Processes streaming chunks and accumulates tool calls
 * - Tool Execution: Executes tools in parallel
 * - Text Emitter: Handles real-time text emission
 */

import {
  OpenAIStreamConfig,
  StreamUsageStats,
  OpenAIStreamState,
  OpenAIStreamFinalOutput,
} from "../../OpenAIStream/util/types";

// Import modular components
import { discoverMCPTools } from "./mcp/toolDiscovery";
import { initializeOpenAIClient, buildInputItems, buildStreamParams } from "./client/openaiClient";
import { runConversationLoop } from "./conversation/conversationLoop";
import { TextEmitter } from "./streaming/textEmitter";
import { ReasoningEmitter } from "./streaming/reasoningEmitter";

type CredentialContext = any;
type NodeExecutionContext = any;

/**
 * Stream completion with callback-based emission (for CallbackNode)
 * Emits each chunk via the emit() function instead of publishing to Redis
 */
export async function streamCompletionCallback(
  config: OpenAIStreamConfig,
  context: CredentialContext,
  logger: any,
  executionContext: NodeExecutionContext,
  emit: (output: any) => void,
  state: OpenAIStreamState,
): Promise<OpenAIStreamFinalOutput> {
  try {
    logger.info("🚀 Starting OpenAI stream");

    // Step 0: Get conversation state from Redis (for multi-turn with 30-min TTL)
    let previousResponseId: string | undefined;
    const redis = executionContext?.api?.getRedisClient?.();
    const pubCtx = executionContext?.publishingContext;
    const convKey =
      pubCtx?.conversationId && pubCtx?.userId && executionContext?.workflow?.id
        ? { workflowId: executionContext.workflow.id, conversationId: pubCtx.conversationId, userId: pubCtx.userId }
        : null;

    if (redis && convKey) {
      try {
        const cached = await redis.get(`openai:conv:${convKey.workflowId}:${convKey.conversationId}:${convKey.userId}`);
        if (cached) {
          const convState = JSON.parse(cached);
          previousResponseId = convState.lastResponseId;
          config.previousResponseId = previousResponseId;
          logger.info(`📜 Resuming conversation from ${previousResponseId?.slice(0, 20)}...`);
        }
      } catch (e) {
        logger.debug(`No previous conversation state: ${(e as Error).message}`);
      }
    }

    // Step 1: Discover core MCPs (findIntent, discoverRelated, readSkill, readSkillFile)
    // Workflow MCPs are discovered at runtime via findIntent/discoverRelated
    const mcpConfig = await discoverMCPTools(executionContext, logger, undefined, executionContext?.api);
    if (mcpConfig) {
      config.tools = mcpConfig.tools;
      (config as any).mcpService = mcpConfig.mcpService;
    }

    // Step 2: Initialize OpenAI client
    const openai = await initializeOpenAIClient(context, logger, executionContext?.api);

    // Step 3: Build input items and stream parameters
    const inputItems = buildInputItems(config);

    const streamParams = buildStreamParams(config, inputItems, (config as any).tools);

    // Step 4: Initialize text and reasoning emitters
    const textEmitter = new TextEmitter(emit, logger);
    const reasoningEmitter = new ReasoningEmitter(emit, logger);

    // Step 5: Create MCP result emitter
    const emitMcpResult = (mcpResult: { name: string; arguments: any; result: any }) => {
      emit({ __outputs: { mcpResult } });
      logger.info(`📤 Emitted mcpResult via output connector: ${mcpResult.name}`);
    };

    // Step 6: Run conversation loop with tool calling support
    logger.info("🤖🤖🤖 [STARTING LLM] About to call runConversationLoop with tools:", {
      toolCount: (config as any).tools?.length || 0,
    });

    // Build trace context for MCP telemetry
    const traceContext =
      executionContext?.executionId && executionContext?.nodeId
        ? {
            executionId: executionContext.executionId,
            parentNodeId: executionContext.nodeId,
          }
        : undefined;

    logger.info(`🔍 [MCP TRACE DEBUG] executionContext.executionId: ${executionContext?.executionId}`);
    logger.info(`🔍 [MCP TRACE DEBUG] executionContext.nodeId: ${executionContext?.nodeId}`);
    logger.info(`🔍 [MCP TRACE DEBUG] traceContext: ${JSON.stringify(traceContext)}`);
    logger.info(`🔍 [MCP TRACE DEBUG] api exists: ${!!executionContext?.api}`);
    logger.info(`🔍 [MCP TRACE DEBUG] api.saveMCPTrace exists: ${!!executionContext?.api?.saveMCPTrace}`);

    const result = await runConversationLoop({
      openai,
      streamParams,
      inputItems,
      mcpService: (config as any).mcpService,
      textEmitter,
      reasoningEmitter,
      emit,
      emitMcpResult,
      logger,
      maxIterations: 10,
      traceContext,
      api: executionContext?.api,
    });

    logger.info(`🔍 [streamingRefactored] IMMEDIATELY after runConversationLoop - result keys:`, Object.keys(result));
    logger.info(`🔍 [streamingRefactored] fullText length: ${result.fullText?.length || 0}`);
    logger.info(`🔍 [streamingRefactored] fullText preview: "${result.fullText?.substring(0, 100)}..."`);
    logger.info(
      `🔍 [streamingRefactored] IMMEDIATELY after runConversationLoop - result.usage keys:`,
      Object.keys(result.usage || {}),
    );
    logger.info(`🔍 [streamingRefactored] IMMEDIATELY after runConversationLoop - result.usage:`, result.usage);

    // Step 7: DO NOT call textEmitter.emitFinal() here
    // The executor handles the final emit with both 'chunk' and 'text' outputs
    // Calling emitFinal here would emit only 'chunk' and cause a race condition

    // Step 8: Save token usage
    logger.info(`🔍 [streamingRefactored] result.usage:`, JSON.stringify(result.usage, null, 2));
    if (result.usage && result.usage.total_tokens > 0 && executionContext?.api?.saveTokenUsage) {
      logger.info(`💾 [streamingRefactored] Saving usage:`, JSON.stringify(result.usage, null, 2));
      await executionContext.api.saveTokenUsage({
        workflowId: executionContext.workflowId,
        executionId: executionContext.executionId,
        nodeId: executionContext.nodeId,
        nodeType: "OpenAIStream",
        model: config.model,
        usage: result.usage, // Pass entire usage object
        timestamp: new Date(),
      });
      logger.info(`💾 Token usage saved: ${result.usage.total_tokens} tokens for model ${config.model}`);
    } else {
      logger.warn(`⚠️ [streamingRefactored] No usage data to save`, {
        hasUsage: !!result.usage,
        totalTokens: result.usage?.total_tokens,
      });
    }

    // Step 9: Build final usage stats
    const isResponsesApi = result.usage && "input_tokens" in result.usage;
    const finalUsage: StreamUsageStats = {
      estimated: false,
      total_tokens: result.usage?.total_tokens || 0,
      prompt_tokens: isResponsesApi ? result.usage?.input_tokens : result.usage?.prompt_tokens,
      completion_tokens: isResponsesApi ? result.usage?.output_tokens : result.usage?.completion_tokens,
      reasoning_tokens: isResponsesApi
        ? result.usage?.output_tokens_details?.reasoning_tokens
        : result.usage?.reasoning_tokens,
      chunk_count: 0,
    };

    logger.info(
      `✅ Stream completed: ${result.fullText.length} chars${
        result.reasoning ? `, ${result.reasoning.length} reasoning chars` : ""
      }`,
    );

    // Build final output with complete text
    // Note: 'chunk' must be included for workflow routing to downstream nodes
    // mcpResult is emitted incrementally as each tool call completes
    // IMPORTANT: Do NOT emit here - the executor handles the final output via return value
    // Emitting here causes a race condition where isComplete:true is set before the emit is processed
    const finalOutput = {
      __outputs: {
        chunk: result.fullText, // Required for workflow routing
        text: result.fullText,
        reasoning: result.reasoning || undefined,
      },
    };

    logger.info(`✅ Stream completed: ${result.fullText.length} chars, ${finalUsage.total_tokens} tokens`);

    // Step 10: Save conversation state to Redis (30-min TTL, sliding expiration)
    if (redis && convKey && result.responseId) {
      try {
        const convState = { lastResponseId: result.responseId, updatedAt: Date.now() };
        await redis.setex(
          `openai:conv:${convKey.workflowId}:${convKey.conversationId}:${convKey.userId}`,
          30 * 60, // 30 minutes TTL
          JSON.stringify(convState),
        );
        logger.debug(`💾 Saved conversation state: ${result.responseId.slice(0, 20)}...`);
      } catch (e) {
        logger.warn(`Failed to save conversation state: ${(e as Error).message}`);
      }
    }

    // Return final output - executor will spread __outputs into state and set isComplete:true
    return finalOutput;
  } catch (error: any) {
    logger.error("❌ Failed to stream completion", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw new Error(`Failed to stream completion: ${error.message}`);
  }
}
