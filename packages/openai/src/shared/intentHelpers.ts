/**
 * Intent helpers - DEPRECATED
 *
 * Task decomposition is now handled by the LLM naturally through the conversation loop.
 * These functions are kept for backwards compatibility but always return single intent.
 */

export function classifyIsComplex(_prompt: string): boolean {
  // Always return false - let LLM handle task decomposition naturally
  return false;
}

export function extractIntentsHeuristic(prompt: string, _maxTasks: number): string[] {
  // Always return single intent - LLM handles decomposition via tool calls
  const text = (prompt || "").trim();
  return text ? [text] : [];
}

export function renderPlan(_intents: string[]): string {
  // No plan rendering needed - LLM handles this
  return "";
}
