/**
 * Tool Feedback Formatting
 * Provides friendly, conversational feedback for tool calls
 */

export interface MCPResult {
  name: string;
  arguments: any;
  result: any;
}

export interface ToolFeedback {
  start: string;
  done: string;
}

// Friendly messages for searching - randomly selected
const SEARCH_MESSAGES = [
  "Searching for relevant information...",
  "Looking up what I know about this...",
  "Checking my knowledge base...",
  "Finding the best information...",
];

// Friendly messages for skills - randomly selected
const SKILL_MESSAGES = [
  "Let me look into this more closely...",
  "I know how to help with this...",
  "Let me check the best approach...",
  "I've got some guidance on this...",
];

// Friendly messages for workflow MCPs (actions) - randomly selected
const MCP_MESSAGES = ["Connecting to service...", "Running action...", "Fetching data...", "Calling service..."];

/**
 * Pick a random message from an array
 */
function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Format tool feedback for progress display
 * Provides friendly, conversational feedback about what the assistant is doing
 */
export function formatToolFeedback(mcpResult: MCPResult): ToolFeedback {
  const { name, arguments: args, result } = mcpResult;

  // Search tools - show friendly search message with query context
  if (name === "findIntent" || name === "discoverRelated") {
    const query = args?.query || "";
    const message = query ? `Considering ${query}...` : pickRandom(SEARCH_MESSAGES);
    return {
      start: message,
      done: "\n",
    };
  }

  // Internal tools - don't show to user
  if (name === "readSkillFile" || name === "getActiveMCPs") {
    return { start: "", done: "" };
  }

  // Skill - show friendly message
  if (name === "readSkill") {
    return {
      start: pickRandom(SKILL_MESSAGES),
      done: "\n",
    };
  }

  // Workflow MCP - show action message
  return {
    start: pickRandom(MCP_MESSAGES),
    done: "\n",
  };
}

/**
 * Extract a human-readable summary from tool results
 */
export function extractResultSummary(toolName: string, result: any): string {
  if (!result) return "";

  // Handle findIntent/discoverRelated results (array of matches)
  if (Array.isArray(result)) {
    if (result.length === 0) return "";

    // Summarize by type with friendly names
    const skills = result.filter((r) => r.object_type === "skill");
    const mcps = result.filter((r) => r.object_type === "mcp");
    const needs = result.filter((r) => r.object_type === "need");
    const services = result.filter((r) => r.object_type === "service");

    const parts: string[] = [];
    if (skills.length > 0) {
      const firstName = skills[0]?.title || skills[0]?.name || "";
      parts.push(`${truncate(firstName, 30)}`);
    }
    if (mcps.length > 0) {
      parts.push(`${mcps.length} action${mcps.length > 1 ? "s" : ""}`);
    }
    if (needs.length > 0 || services.length > 0) {
      const contextCount = needs.length + services.length;
      parts.push(`${contextCount} context item${contextCount > 1 ? "s" : ""}`);
    }

    return parts.join(", ") || `${result.length} result${result.length > 1 ? "s" : ""}`;
  }

  // Handle skill content
  if (toolName === "readSkill") {
    return ""; // Already shown in start message
  }

  // Handle skill file content
  if (toolName === "readSkillFile") {
    return "";
  }

  // Handle MCP execution results
  if (result.success !== undefined) {
    return result.success ? "Done" : "Failed";
  }

  // Handle workflow results
  if (result.workflowId || result.executionId) {
    return "Started";
  }

  return "";
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
