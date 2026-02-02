/**
 * MCP Tool Execution
 * Handles parallel execution of tool calls with telemetry tracing
 */

export interface ToolCall {
  id: string; // call_id for function_call_output
  itemId?: string; // item.id for matching argument deltas
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: "tool";
  content: string;
}

/**
 * Trace context for MCP telemetry
 */
export interface MCPTraceContext {
  executionId: string;
  parentNodeId: string;
}

/**
 * Execute a single tool call with telemetry tracing
 */
async function executeToolCall(
  toolCall: ToolCall,
  mcpService: Record<string, (input: any) => Promise<any>>,
  logger: any,
  traceContext?: MCPTraceContext,
  api?: any
): Promise<ToolResult> {
  const startTime = Date.now();
  const toolName = toolCall.function.name;
  let toolArgs: any;

  try {
    toolArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    toolArgs = {};
  }

  logger.info(`⚡ Executing tool: ${toolName}`, { args: toolArgs });

  try {
    // Call the MCP service
    if (mcpService && mcpService[toolName]) {
      const toolResult = await mcpService[toolName](toolArgs);
      const endTime = Date.now();

      logger.info(`✅ Tool ${toolName} executed successfully in ${endTime - startTime}ms`);

      // Save MCP trace for telemetry (fire-and-forget)
      if (traceContext && api?.saveMCPTrace) {
        api
          .saveMCPTrace({
            executionId: traceContext.executionId,
            parentNodeId: traceContext.parentNodeId,
            toolName,
            arguments: toolArgs,
            result: toolResult,
            startTime,
            endTime,
            duration: endTime - startTime,
            success: true,
          })
          .catch((err: any) => logger.error(`Failed to save MCP trace: ${err.message}`));
      }

      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: JSON.stringify(toolResult),
      };
    } else {
      const endTime = Date.now();
      logger.warn(`⚠️ Tool ${toolName} not found in mcpService`);

      // Save failed trace
      if (traceContext && api?.saveMCPTrace) {
        api
          .saveMCPTrace({
            executionId: traceContext.executionId,
            parentNodeId: traceContext.parentNodeId,
            toolName,
            arguments: toolArgs,
            result: null,
            startTime,
            endTime,
            duration: endTime - startTime,
            success: false,
            error: "Tool not found",
          })
          .catch((err: any) => logger.error(`Failed to save MCP trace: ${err.message}`));
      }

      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: JSON.stringify({ error: "Tool not found" }),
      };
    }
  } catch (error: any) {
    const endTime = Date.now();
    logger.error(`❌ Tool execution failed`, { error: error.message });

    // Save failed trace
    if (traceContext && api?.saveMCPTrace) {
      api
        .saveMCPTrace({
          executionId: traceContext.executionId,
          parentNodeId: traceContext.parentNodeId,
          toolName,
          arguments: toolArgs,
          result: null,
          startTime,
          endTime,
          duration: endTime - startTime,
          success: false,
          error: error.message,
        })
        .catch((err: any) => logger.error(`Failed to save MCP trace: ${err.message}`));
    }

    return {
      tool_call_id: toolCall.id,
      role: "tool",
      content: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Execute all tool calls in parallel (OpenAI's parallel function calling)
 * @param toolCalls - Array of tool calls to execute
 * @param mcpService - MCP service with tool implementations
 * @param logger - Logger instance
 * @param traceContext - Optional context for MCP telemetry tracing
 */
export async function executeToolCallsInParallel(
  toolCalls: ToolCall[],
  mcpService: Record<string, (input: any) => Promise<any>>,
  logger: any,
  traceContext?: MCPTraceContext,
  api?: any
): Promise<ToolResult[]> {
  logger.info(`🔧 Model requested ${toolCalls.length} tool call(s) in parallel`);

  // Execute ALL tool calls in parallel, passing trace context for telemetry
  const toolExecutionPromises = toolCalls.map((toolCall) =>
    executeToolCall(toolCall, mcpService, logger, traceContext, api)
  );

  // Wait for ALL executions to complete
  const toolResults = await Promise.all(toolExecutionPromises);

  logger.info(`📤 All ${toolResults.length} tool results completed`);

  return toolResults;
}
