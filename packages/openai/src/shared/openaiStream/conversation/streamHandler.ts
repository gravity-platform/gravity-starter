/**
 * Stream Handler
 * Processes OpenAI response stream chunks
 */

import { processStreamChunk, initializeStreamState, StreamState } from "../streaming/streamProcessor";
import { TextEmitter } from "../streaming/textEmitter";
import { ReasoningEmitter } from "../streaming/reasoningEmitter";

export interface StreamHandlerConfig {
  textEmitter: TextEmitter;
  reasoningEmitter: ReasoningEmitter;
  logger: any;
}

/**
 * Process a single stream iteration
 */
export async function processStream(
  stream: AsyncIterable<any>,
  previousState: StreamState,
  config: StreamHandlerConfig,
): Promise<StreamState> {
  const { textEmitter, reasoningEmitter, logger } = config;

  // Reset state for this iteration (keep accumulated text/reasoning/usage)
  let streamState = initializeStreamState(previousState.fullText, previousState.reasoning, previousState.usage);

  let chunkCount = 0;

  for await (const chunk of stream) {
    chunkCount++;

    // Log every 100th chunk to show progress (reduced verbosity)
    if (chunkCount % 100 === 0) {
      logger.debug(`Streaming chunk ${chunkCount}...`);
    }

    const previousReasoning = streamState.reasoning;
    const previousText = streamState.fullText;

    streamState = processStreamChunk(chunk, streamState);

    // Emit text chunks
    const newChars = streamState.fullText.length - previousText.length;
    if (newChars > 0) {
      textEmitter.emitIfNeeded(streamState.fullText, newChars);
    }

    // Emit reasoning chunks
    const newReasoningChars = streamState.reasoning.length - previousReasoning.length;
    if (newReasoningChars > 0) {
      reasoningEmitter.emitIfNeeded(streamState.reasoning, newReasoningChars);
    }
  }

  logger.info(`✅ Processed ${chunkCount} chunks`);

  // Emit any remaining text that didn't hit the threshold
  // This ensures the final chunk of each iteration is always sent
  if (streamState.fullText.length > 0) {
    textEmitter.emitIfNeeded(streamState.fullText, 1000); // Force emit by exceeding threshold
  }

  return streamState;
}
