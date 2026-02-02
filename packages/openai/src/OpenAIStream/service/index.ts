/**
 * OpenAI Stream Service Exports (GPT-5 Responses API Only)
 *
 * NOTE: This is a backwards-compatibility wrapper.
 * The canonical implementation lives in src/shared/openaiStream.
 * All exports here re-export from the shared implementation.
 */

// Re-export everything from the shared implementation
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
} from "../../shared/openaiStream";

// Re-export types
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
} from "../../shared/openaiStream";
