import {
  getPlatformDependencies,
  type NodeExecutionContext,
  type ValidationResult,
} from "@gravity-platform/plugin-base";
import { runChatGPTAgentCallback } from "../service";
import type { ChatGPTAgentConfig, ChatGPTAgentState } from "../util/types";

const { CallbackNode } = getPlatformDependencies();

// Loop safety constants
const MAX_CONTINUE_COUNT = 50; // Max CONTINUE signals before forcing completion
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes max session duration

export default class ChatGPTAgentExecutor extends CallbackNode {
  constructor() {
    super("ChatGPTAgent");
  }

  protected async validateConfig(config: ChatGPTAgentConfig): Promise<ValidationResult> {
    return { success: true };
  }

  initializeState(inputs: any): ChatGPTAgentState {
    return {
      chunk: "",
      text: "",
      hasStartedStreaming: false,
      continueCount: 0,
      firstExecuteTime: undefined,
    };
  }

  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: ChatGPTAgentState,
    emit: (output: any) => void,
  ): Promise<any> {
    const resolvedConfig = event.config as ChatGPTAgentConfig;
    const executionContext = (this as any).executionContext as NodeExecutionContext;
    const credentialContext = this.buildCredentialContext(executionContext);

    // CONTINUE signal - user sent a follow-up message
    if (event.type === "CONTINUE") {
      // Loop safety: check CONTINUE count
      const continueCount = (state.continueCount || 0) + 1;
      if (continueCount > MAX_CONTINUE_COUNT) {
        this.logger.warn(`[ChatGPTAgent] Max CONTINUE count (${MAX_CONTINUE_COUNT}) exceeded - forcing completion`, {
          continueCount,
        });
        return {
          ...state,
          isComplete: true,
          text: state.text || "Session ended: maximum conversation turns reached.",
        };
      }

      // Loop safety: check session timeout
      if (state.firstExecuteTime) {
        const elapsed = Date.now() - state.firstExecuteTime;
        if (elapsed > SESSION_TIMEOUT_MS) {
          this.logger.warn(`[ChatGPTAgent] Session timeout (${SESSION_TIMEOUT_MS}ms) exceeded - forcing completion`, {
            elapsedMs: elapsed,
          });
          return {
            ...state,
            isComplete: true,
            text: state.text || "Session ended: maximum session duration reached.",
          };
        }
      }

      const rawMessage = event.inputs?.continue;
      // Handle both string and object formats
      const userMessage = typeof rawMessage === "string" ? rawMessage : rawMessage?.message || rawMessage?.text || "";
      if (!userMessage) {
        this.logger.warn("CONTINUE signal received but no user message in inputs.continue", {
          rawMessageType: typeof rawMessage,
          rawMessage,
        });
        return state;
      }

      this.logger.info(`[ChatGPTAgent] CONTINUE - processing follow-up`, {
        hasResponseId: !!state.responseId,
        continueCount,
      });

      const finalOutput = await runChatGPTAgentCallback(
        { ...resolvedConfig, prompt: userMessage },
        credentialContext,
        this.logger,
        executionContext,
        emit,
        state.responseId, // Pass previous responseId for conversation continuity
      );

      emit(finalOutput);

      // Check if more input needed - yield or complete
      const newState = {
        ...state,
        ...finalOutput.__outputs,
        responseId: finalOutput.__outputs?.responseId || state.responseId,
        continueCount, // Track CONTINUE count
      };
      if (finalOutput.__outputs?.focusInputRequired) {
        return newState; // Yield
      }
      return { ...newState, isComplete: true }; // Done
    }

    // EXECUTE signal - first run
    // If already streaming or yielded (has responseId), ignore duplicate EXECUTE events
    if (state.hasStartedStreaming || state.responseId) {
      this.logger.info(`[ChatGPTAgent] Ignoring duplicate event - already processed`, {
        hasStartedStreaming: state.hasStartedStreaming,
        hasResponseId: !!state.responseId,
        eventType: event.type,
      });
      return state;
    }

    if (resolvedConfig) {
      const updatedState = {
        ...state,
        hasStartedStreaming: true,
        firstExecuteTime: Date.now(), // Track session start for timeout
      };

      const finalOutput = await runChatGPTAgentCallback(
        resolvedConfig,
        credentialContext,
        this.logger,
        executionContext,
        emit,
      );

      emit(finalOutput);

      // Check if more input needed - yield or complete
      const newState = {
        ...updatedState,
        ...finalOutput.__outputs,
        responseId: finalOutput.__outputs?.responseId,
      };
      if (finalOutput.__outputs?.focusInputRequired) {
        return newState; // Yield
      }
      return { ...newState, isComplete: true }; // Done
    }

    return state;
  }

  private buildCredentialContext(context: NodeExecutionContext) {
    const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);

    return {
      workflowId,
      executionId,
      nodeId,
      nodeType: this.nodeType,
      config: context.config,
      credentials: context.credentials || {},
    };
  }

  async cleanup(state: ChatGPTAgentState): Promise<void> {
    return;
  }
}
