/**
 * ElevenLabs TTS Types
 * Uses Eleven v3 model with Text to Dialogue API
 */

export interface ElevenLabsConfig {
  /** The text to convert to speech, or dialogue script with [DETECTIVE]: and [SUSPECT]: labels */
  text: string;
  /** Character ID for voice naming/reuse (e.g., "sus_gavin") */
  characterId?: string;
  /** Detective ID for voice naming/reuse (e.g., "det_smith") */
  detectiveId?: string;
  /** Voice prompt for character/suspect - generates voice via Voice Design API */
  characterVoicePrompt?: string;
  /** Voice prompt for detective - generates voice via Voice Design API */
  detectiveVoicePrompt?: string;
  /** Stability (0-1, default: 0.35 for v3 expressive) */
  stability?: number;
}

export interface GeneratedAudio {
  data: string; // base64 encoded audio data
  mimeType: string;
  fileName: string;
}

export interface ElevenLabsOutput {
  __outputs: {
    audio: GeneratedAudio;
    metadata: {
      format: string;
      durationSeconds: number;
      characterCount: number;
      isDialogue: boolean;
    };
  };
}

export interface DialogueSegment {
  speaker: "DETECTIVE" | "SUSPECT" | "NARRATOR";
  text: string;
}

export interface CredentialContext {
  workflowId: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  config: any;
  credentials?: Record<string, any>;
}
