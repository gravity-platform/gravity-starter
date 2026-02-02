/**
 * Tool Call Handler
 * Processes tool calls and determines conversation flow
 */

import { executeToolCallsInParallel, MCPTraceContext, ToolCall } from "../mcp/toolExecution";
import { StreamState } from "../streaming/streamProcessor";
import { ResponseInputItem, MCPResult } from "./types";

// Tools that return data for LLM to use (don't end conversation)
// These tools provide context for the LLM to formulate a response
const DATA_TOOLS = [
  "findIntent", // Vector search - precision matching
  "discoverRelated", // Spatial search - discovery
  "readSkill", // Read skill instructions
  "readSkillFile", // Read skill files
  "getActiveMCPs", // Get available MCPs
];

export interface ToolHandlerResult {
  shouldEndConversation: boolean;
  mcpResults: MCPResult[];
  toolOutputs: ResponseInputItem[];
  discoveredMCPs?: DiscoveredMCP[];
}

export interface DiscoveredMCP {
  id: string;
  title: string;
  description: string;
  workflowId: string;
  nodeId: string;
  methodName: string;
  schema?: any; // Full MCP schema from metadata.schema
}

/**
 * Check if any tool is a workflow MCP (ends conversation)
 */
export function hasWorkflowMCP(toolCalls: ToolCall[]): boolean {
  return toolCalls.some((tc: ToolCall) => !DATA_TOOLS.includes(tc.function.name));
}

/**
 * Parse tool result to JSON
 */
function parseToolResult(content: string): any {
  try {
    return JSON.parse(content || "{}");
  } catch {
    return content;
  }
}

/**
 * Process tool calls and return results
 */
export async function handleToolCalls(
  streamState: StreamState,
  mcpService: Record<string, (input: any) => Promise<any>>,
  logger: any,
  traceContext?: MCPTraceContext,
  api?: any,
): Promise<ToolHandlerResult> {
  logger.info(`🔧 Model requested ${streamState.toolCalls.length} tool call(s)`);

  // Execute all tool calls in parallel
  const toolResults = await executeToolCallsInParallel(streamState.toolCalls, mcpService, logger, traceContext, api);

  // Check if workflow MCP was called
  const isWorkflowMCP = hasWorkflowMCP(streamState.toolCalls);

  // Build MCP results for emission
  const mcpResults: MCPResult[] = streamState.toolCalls.map((toolCall: ToolCall, index: number) => ({
    name: toolCall.function.name,
    arguments: JSON.parse(toolCall.function.arguments),
    result: parseToolResult(toolResults[index]?.content),
  }));

  // Extract discovered MCPs from findIntent/discoverRelated results
  const discoveredMCPs: DiscoveredMCP[] = [];
  for (let i = 0; i < streamState.toolCalls.length; i++) {
    const toolName = streamState.toolCalls[i].function.name;
    if (toolName === "findIntent" || toolName === "discoverRelated") {
      const results = parseToolResult(toolResults[i]?.content);
      if (Array.isArray(results)) {
        for (const item of results) {
          if (item.object_type === "mcp" && item.metadata?.schema?.methods) {
            // Get methodName from schema.methods keys
            const methodName = Object.keys(item.metadata.schema.methods)[0];
            if (methodName) {
              discoveredMCPs.push({
                id: item.id || item.universal_id,
                title: item.title || "",
                description: item.description || "",
                workflowId: item.metadata?.workflowId || item.workflow_id,
                nodeId: item.metadata?.nodeId,
                methodName,
                schema: item.metadata?.schema,
              });
            }
          }
        }
      }
    }
  }

  // Build tool outputs for next iteration (only if not workflow MCP)
  const toolOutputs: ResponseInputItem[] = isWorkflowMCP
    ? []
    : toolResults.map((result, i) => ({
        type: "function_call_output" as const,
        call_id: streamState.toolCalls[i].id,
        output: result.content,
      }));

  return {
    shouldEndConversation: isWorkflowMCP,
    mcpResults,
    toolOutputs,
    discoveredMCPs: discoveredMCPs.length > 0 ? discoveredMCPs : undefined,
  };
}
