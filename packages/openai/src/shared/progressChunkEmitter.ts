type EmitFn = (output: any) => void;

export interface ProgressChunkEmitter {
  append: (text: string) => void;
  flush: () => void;
  emitProxy: (output: any) => void;
  getAccumulated: () => string;
}

/**
 * Creates a progress emitter that accumulates task steps and model reasoning.
 * - Task steps (from append()) are accumulated in the progress log
 * - Model reasoning (from ReasoningEmitter via emitProxy) is appended to the log
 * - Both are emitted together to the reasoning output
 * - Chunk output passes through for LLM text streaming
 */
export function createProgressChunkEmitter(emit: EmitFn, emitIntervalChars: number = 100): ProgressChunkEmitter {
  let taskSteps = ""; // Task steps from append() - "Starting...", "Calling tool...", etc.
  let modelReasoning = ""; // Model reasoning from ReasoningEmitter - full accumulated text
  let pendingChars = 0;

  const emitCombinedProgress = () => {
    // Combine task steps with model reasoning for the progress output
    const combined = taskSteps + (modelReasoning ? modelReasoning : "");
    emit({ __outputs: { progress: combined } });
  };

  return {
    append: (text: string) => {
      if (!text) return;
      taskSteps += text;
      pendingChars += text.length;
      if (pendingChars >= emitIntervalChars) {
        emitCombinedProgress();
        pendingChars = 0;
      }
    },
    flush: () => {
      if (pendingChars > 0) {
        emitCombinedProgress();
        pendingChars = 0;
      }
    },
    emitProxy: (output: any) => {
      // If this is a reasoning emit from ReasoningEmitter, REPLACE model reasoning
      // ReasoningEmitter already sends the full accumulated reasoning text each time
      if (output?.__outputs?.reasoning && typeof output.__outputs.reasoning === "string") {
        modelReasoning = output.__outputs.reasoning; // Replace, don't append
        emitCombinedProgress();
        pendingChars = 0;
        return;
      }
      // Pass through other outputs (chunk, mcpResult) directly
      emit(output);
    },
    getAccumulated: () => taskSteps + modelReasoning,
  };
}
