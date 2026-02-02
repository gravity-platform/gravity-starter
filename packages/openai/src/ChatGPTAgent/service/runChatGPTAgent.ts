import type { ChatGPTAgentConfig } from "../util/types";
import {
  discoverMCPTools,
  initializeOpenAIClient,
  buildInputItems,
  buildStreamParams,
  runConversationLoop,
  TextEmitter,
  ReasoningEmitter,
} from "../../shared/openaiStreamEngine";
import { formatToolFeedback } from "../../shared/toolFeedback";

// Loop safety constants
const CONVERSATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes max for conversation

type CredentialContext = any;
type NodeExecutionContext = any;

type EmitFn = (output: any) => void;

export interface ChatGPTAgentOutput {
  __outputs: {
    chunk: string;
    text: string;
    progress?: string;
    reasoning?: string; // Model reasoning/thinking (for analytics)
    responseId?: string; // OpenAI response ID for multi-turn (use with previous_response_id)
    focusInputRequired?: boolean; // True if agent needs user input (yields, waits for CONTINUE)
  };
}

export async function runChatGPTAgentCallback(
  config: ChatGPTAgentConfig,
  context: CredentialContext,
  logger: any,
  executionContext: NodeExecutionContext,
  emit: EmitFn,
  _previousResponseId?: string, // Deprecated - now handled by shared streaming service via Redis
): Promise<ChatGPTAgentOutput> {
  // Loop safety: track start time for timeout
  const agentStartTime = Date.now();

  // Get conversation state from Redis (for multi-turn with 30-min TTL)
  let previousResponseId: string | undefined;
  const redis = executionContext?.api?.getRedisClient?.();
  const pubCtx = executionContext?.publishingContext;
  const convKey =
    pubCtx?.conversationId && pubCtx?.userId && executionContext?.workflow?.id
      ? { workflowId: executionContext.workflow.id, conversationId: pubCtx.conversationId, userId: pubCtx.userId }
      : null;

  const redisKey = convKey ? `openai:conv:${convKey.workflowId}:${convKey.conversationId}:${convKey.userId}` : null;
  logger.info(`🔑 [Redis Conv] key=${redisKey}, hasRedis=${!!redis}`);

  // Check for reset trigger word (case-insensitive)
  const RESET_TRIGGERS = ["reset conversation", "reset_conversation"];
  const promptLower = (config.prompt || "").toLowerCase().trim();
  const shouldReset = RESET_TRIGGERS.some((trigger) => promptLower === trigger);

  // Debug: log prompt for reset check
  if (promptLower.includes("reset")) {
    logger.info(`🔍 [Reset Check] prompt="${promptLower.substring(0, 50)}", shouldReset=${shouldReset}`);
  }

  if (shouldReset && redis && redisKey) {
    try {
      await redis.del(redisKey);
      logger.info(`🔄 [Redis Conv] RESET - conversation cleared by user request`);
      // Return early with reset confirmation
      return {
        __outputs: {
          chunk: "Conversation reset. How can I help you?",
          text: "Conversation reset. How can I help you?",
          progress: undefined,
          reasoning: undefined,
          responseId: undefined,
          focusInputRequired: undefined,
        },
      };
    } catch (e) {
      logger.warn(`❌ [Redis Conv] Reset failed: ${(e as Error).message}`);
    }
  }

  if (redis && redisKey) {
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const convState = JSON.parse(cached);
        previousResponseId = convState.lastResponseId;
        logger.info(`📜 [Redis Conv] RESUMING from ${previousResponseId}`);
      } else {
        logger.info(`🆕 [Redis Conv] NEW conversation (no cache)`);
      }
    } catch (e) {
      logger.warn(`❌ [Redis Conv] Error: ${(e as Error).message}`);
    }
  } else {
    logger.warn(`⚠️ [Redis Conv] Missing redis=${!!redis} or key=${redisKey}`);
  }

  // Ambition controls how many tasks the agent can reason about and execute
  const ambitionSettings = {
    small: { maxIterations: 10 }, // Up to 5 tasks
    medium: { maxIterations: 15 }, // Up to 10 tasks
    large: { maxIterations: 20 }, // Up to 20 tasks
  };
  const { maxIterations } = ambitionSettings[config.ambition ?? "medium"];

  const openai = await initializeOpenAIClient(context, logger, executionContext?.api);

  // Get core MCPs (findIntent, discoverRelated, readSkill, readSkillFile)
  // Workflow MCPs are discovered at runtime via findIntent/discoverRelated
  const mcpConfig = await discoverMCPTools(executionContext, logger, undefined, executionContext?.api);

  const streamConfig = {
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt: config.systemPrompt,
    prompt: config.prompt,
    reasoningEffort: config.reasoningEffort,
    reasoningSummary: config.reasoningSummary,
    verbosity: config.verbosity,
    enablePreambles: config.enablePreambles,
    enableMarkdown: config.enableMarkdown,
    tools: mcpConfig?.tools,
  } as any;

  const inputItems = buildInputItems(streamConfig);
  const streamParams = buildStreamParams(streamConfig, inputItems, mcpConfig?.tools);

  // chunk = streaming text only
  const textEmitter = new TextEmitter(emit, logger);

  // reasoning = LLM reasoning (separate output)
  const reasoningEmitter = new ReasoningEmitter(emit, logger);

  // progress = tool/skill log (separate output)
  let progressLog = "";
  const emitProgress = (text: string) => {
    progressLog += text;
    emit({ __outputs: { progress: progressLog } });
  };

  // mcpResult = tool results (separate output) + log to progress
  const emitMcpResult = (mcpResult: { name: string; arguments: any; result: any }) => {
    const feedback = formatToolFeedback(mcpResult);
    emitProgress(feedback.start + feedback.done);
    emit({ __outputs: { mcpResult } });
  };

  const result = await runConversationLoop({
    openai,
    streamParams,
    inputItems,
    mcpService: mcpConfig?.mcpService,
    textEmitter,
    reasoningEmitter,
    emit,
    emitMcpResult,
    logger,
    maxIterations,
    timeoutMs: CONVERSATION_TIMEOUT_MS,
    api: executionContext?.api,
    previousResponseId, // Pass previous response ID for multi-turn
    traceContext:
      executionContext?.executionId && executionContext?.nodeId
        ? { executionId: executionContext.executionId, parentNodeId: executionContext.nodeId }
        : undefined,
  });

  const finalText = result.fullText;
  const finalReasoning = result.reasoning || "";

  // Emit final chunk with complete text
  logger.info(`🏁 [Final] Text length: ${finalText.length}, ends with: "${finalText.slice(-50)}"`);
  textEmitter.emitFinal(finalText);

  // Focus Mode: Disabled by default - using ChatGPT's internal conversation memory
  // via previous_response_id for multi-turn persistence
  const focusInputRequired = false;

  // Get responseId for multi-turn persistence
  const responseId = result.responseId;

  // Save conversation state to Redis (30-min TTL)
  if (redis && redisKey && responseId) {
    try {
      await redis.setex(redisKey, 30 * 60, JSON.stringify({ lastResponseId: responseId }));
      logger.info(`💾 [Redis Conv] SAVED ${responseId} to ${redisKey}`);
    } catch (e) {
      logger.warn(`❌ [Redis Conv] Save failed: ${(e as Error).message}`);
    }
  }

  // Save token usage to database (pass full usage object for cached_tokens tracking)
  if (result.usage && result.usage.total_tokens > 0 && executionContext?.api?.saveTokenUsage) {
    try {
      await executionContext.api.saveTokenUsage({
        workflowId: executionContext.workflow?.id,
        executionId: executionContext.executionId,
        nodeId: executionContext.nodeId,
        nodeType: "ChatGPTAgent",
        model: config.model,
        usage: result.usage, // Pass entire usage object (includes cached_tokens, reasoning_tokens)
        timestamp: new Date(),
      });
      const cached = result.usage.input_tokens_details?.cached_tokens || 0;
      logger.info(`💾 [Token Usage] Saved: ${result.usage.total_tokens} tokens (${cached} cached)`);
    } catch (e) {
      logger.warn(`❌ [Token Usage] Save failed: ${(e as Error).message}`);
    }
  }

  return {
    __outputs: {
      chunk: finalText,
      text: finalText,
      progress: progressLog || undefined,
      reasoning: finalReasoning || undefined,
      responseId: responseId || undefined,
      focusInputRequired: focusInputRequired || undefined,
    },
  };
}
