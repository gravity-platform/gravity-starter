/**
 * Shared OpenAI Responses streaming engine
 * This is the canonical implementation - OpenAIStream/service re-exports from here
 */

export { streamCompletionCallback } from "./streamingRefactored";

export { discoverMCPTools } from "./mcp/toolDiscovery";
export { executeToolCallsInParallel } from "./mcp/toolExecution";
export { initializeOpenAIClient, buildInputItems, buildStreamParams } from "./client/openaiClient";
export { runConversationLoop } from "./conversation/conversationLoop";
export { TextEmitter } from "./streaming/textEmitter";
export { ReasoningEmitter } from "./streaming/reasoningEmitter";
export { processStreamChunk, initializeStreamState } from "./streaming/streamProcessor";

export type { MCPToolConfig } from "./mcp/toolDiscovery";
export type { ToolCall, ToolResult, MCPTraceContext } from "./mcp/toolExecution";
export type { StreamState } from "./streaming/streamProcessor";
export type { ConversationConfig, ConversationResult, ResponseInputItem, MCPResult } from "./conversation/types";
