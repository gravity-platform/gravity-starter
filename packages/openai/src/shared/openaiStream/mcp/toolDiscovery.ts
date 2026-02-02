/**
 * MCP Tool Discovery
 * Handles discovery and conversion of MCP services to OpenAI tools
 *
 * Returns ONLY the 4 core MCPs (findIntent, discoverRelated, readSkill, readSkillFile).
 * Workflow MCPs are discovered at runtime via findIntent/discoverRelated.
 */

export interface MCPToolConfig {
  tools: any[];
  mcpService: Record<string, (input: any) => Promise<any>>;
}

/**
 * Discover MCP services and convert to OpenAI tools format
 *
 * Returns only the 4 core MCPs. Workflow MCPs are discovered at runtime
 * when the agent calls findIntent/discoverRelated.
 */
export async function discoverMCPTools(
  executionContext: any,
  logger: any,
  _userQuery?: string, // Kept for API compatibility but no longer used
  api?: any,
): Promise<MCPToolConfig | null> {
  logger.info("🔍 [MCP Discovery] Getting core MCPs");

  if (!executionContext) {
    logger.warn("⚠️ [MCP Discovery] No executionContext - cannot discover MCP tools");
    return null;
  }

  try {
    if (!api?.callService) {
      logger.warn("⚠️ [MCP Discovery] callService not available");
      return null;
    }

    // Get MCP schema - returns only 4 core MCPs (no query-based filtering)
    // Workflow MCPs are discovered at runtime via findIntent/discoverRelated
    const mcpSchema = await api.callService("getSchema", {}, executionContext);

    if (!mcpSchema?.methods) {
      logger.warn("⚠️ [MCP Discovery] No methods in schema");
      return null;
    }

    const methodNames = Object.keys(mcpSchema.methods);
    logger.info(`✅ [MCP Discovery] ${methodNames.length} core MCPs: ${methodNames.join(", ")}`);

    // Convert MCP schema to OpenAI Responses API tools format
    const tools = Object.entries(mcpSchema.methods).map(([methodName, methodSchema]: [string, any]) => ({
      type: "function",
      name: methodName,
      description: methodSchema.description || `Execute ${methodName} operation`,
      parameters: methodSchema.input || { type: "object", properties: {} },
    }));

    // Create service proxy functions for each tool
    const mcpService: Record<string, (input: any) => Promise<any>> = {};
    for (const [methodName] of Object.entries(mcpSchema.methods)) {
      mcpService[methodName] = async (input: any) => {
        logger.info(`⚡ Calling MCP: ${methodName}`, { input });
        return api.callService(methodName, input, executionContext);
      };
    }

    return { tools, mcpService };
  } catch (error) {
    // No MCP service connected - continue without tools
    logger.debug("No MCP service connected", { error: (error as Error).message });
    return null;
  }
}
