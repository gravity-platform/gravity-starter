/**
 * ElevenLabs TTS Types
 * Uses Eleven v3 model with Text to Dialogue API
 */

export interface ElevenLabsConfig {
  /** The text to convert to speech, or dialogue script with [DETECTIVE]: and [SUSPECT]: labels */
  text: string;
  /** Character ID for suspect voice hashing (e.g., "sus_claire") */
  characterId?: string;
  /** Gender of the suspect character: 'male' | 'female' — routes to correct voice pool */
  characterGender?: string;
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
