/**
 * Shared OpenAI Stream Engine
 * Re-exports from the canonical shared/openaiStream implementation
 */
export {
  streamCompletionCallback,
  discoverMCPTools,
  executeToolCallsInParallel,
  initializeOpenAIClient,
  buildInputItems,
  buildStreamParams,
  runConversationLoop,
  TextEmitter,
  ReasoningEmitter,
  processStreamChunk,
  initializeStreamState,
} from "./openaiStream";

export type {
  MCPToolConfig,
  ToolCall,
  ToolResult,
  MCPTraceContext,
  StreamState,
  ConversationConfig,
  ConversationResult,
  ResponseInputItem,
  MCPResult,
} from "./openaiStream";
