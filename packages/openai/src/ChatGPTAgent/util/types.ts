export interface ChatGPTAgentConfig {
  model: string;
  maxTokens?: number;
  systemPrompt?: string;
  prompt: string;
  // Note: history removed - GPT-5.2 uses previous_response_id for conversation state
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  reasoningSummary?: "auto" | "concise" | "detailed";
  verbosity?: "low" | "medium" | "high";
  enablePreambles?: boolean;
  enableMarkdown?: boolean;
  ambition?: "small" | "medium" | "large"; // Controls task decomposition and tool iteration depth
  skillLimit?: number; // Max skills to inject into system prompt (default: 3)
}

export interface ChatGPTAgentState {
  chunk: string;
  text: string;
  reasoning?: string;
  hasStartedStreaming?: boolean;
  // For multi-turn conversation persistence
  responseId?: string; // OpenAI response ID to resume conversation
  // Loop safety tracking
  continueCount?: number; // Number of CONTINUE signals received
  firstExecuteTime?: number; // Timestamp of first EXECUTE (for total timeout)
}

export interface IntentResult {
  intent: string;
  text: string;
  responseId?: string; // For multi-turn conversation persistence
}
