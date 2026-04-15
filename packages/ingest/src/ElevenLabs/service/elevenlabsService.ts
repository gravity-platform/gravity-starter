/**
 * ElevenLabs TTS Service
 * Handles text-to-speech conversion with support for multi-speaker dialogue
 * Uses Eleven v3 model with Text to Dialogue API for expressive audio
 */

import { ElevenLabsConfig, DialogueSegment } from "../util/types";
import { getNodeCredentials, createLogger } from "../../shared/platform";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const logger = createLogger("ElevenLabs");

/**
 * Get ElevenLabs API key from credentials
 */
async function getApiKey(context: any): Promise<string> {
  const credentials = await getNodeCredentials(context, "elevenlabsCredential");
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("ElevenLabs API key not found in credentials");
  }

  return apiKey;
}

// Premade voices - built into every ElevenLabs account, no creation needed, no limits
const DETECTIVE_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Female detective - always the interviewer, never used for suspects

const PREMADE_MALE_VOICES = [
  "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, authoritative
  "N2lVS1w4EtoT3dr4eOWO", // Liam
  "IKne3meq5aSn9XLyUdCD", // Charlie
  "TX3LPaxmHKxFdv7VOQHJ", // Liam (alt)
  "JBFqnCBsd6RMkjVDRZzb", // George
  "TxGEqnHWrfWFTfGW9XjX", // Josh
  "29vD33N1CtxCmqQRPOHJ", // Drew
];

// Charlotte excluded — she is reserved exclusively for DETECTIVE
const PREMADE_FEMALE_VOICES = [
  "pNInz6obpgDQGcFmaJgB", // Nicole
  "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "jBpfuIE2acCO8z3wKNLl", // Freya
  "jsCqWAovK2LkecY7zXl4", // Dorothy
  "z9fAnlkpzviPz146aGWa", // Glinda
];

const DEFAULT_VOICES = {
  DETECTIVE: DETECTIVE_VOICE_ID,
  SUSPECT: PREMADE_FEMALE_VOICES[0],
  NARRATOR: PREMADE_MALE_VOICES[0],
};

/**
 * Hash a string to a stable integer (djb2)
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Pick a suspect voice deterministically based on characterId and gender.
 * Female suspects draw from PREMADE_FEMALE_VOICES (5 voices, never Charlotte).
 * Male suspects draw from PREMADE_MALE_VOICES (7 voices).
 * Same characterId + gender always returns the same voice. No API calls, no limits.
 */
function pickVoice(characterId: string, gender: string): string {
  const g = gender.toLowerCase().trim();
  const isFemale = g === "female" || g === "f" || g === "woman";
  const pool = isFemale ? PREMADE_FEMALE_VOICES : PREMADE_MALE_VOICES;
  const index = hashString(characterId) % pool.length;
  const voiceId = pool[index];
  console.log(
    `[ElevenLabs] Picked ${isFemale ? "female" : "male"} suspect voice for "${characterId}": ${voiceId} (index ${index}/${pool.length})`,
  );
  return voiceId;
}

/**
 * Parse dialogue script into segments by speaker
 * Expects format: [DETECTIVE]: text or [SUSPECT]: text
 */
export function parseDialogueScript(script: string): DialogueSegment[] {
  const segments: DialogueSegment[] = [];
  const lines = script.split("\n");

  let currentSpeaker: "DETECTIVE" | "SUSPECT" | "NARRATOR" = "NARRATOR";
  let currentText = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for speaker labels
    const detectiveMatch = trimmedLine.match(/^\[DETECTIVE\]:\s*(.*)$/i);
    const suspectMatch = trimmedLine.match(/^\[SUSPECT\]:\s*(.*)$/i);
    const narratorMatch = trimmedLine.match(/^\[NARRATOR\]:\s*(.*)$/i);

    if (detectiveMatch) {
      // Save previous segment if exists
      if (currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = "DETECTIVE";
      currentText = detectiveMatch[1];
    } else if (suspectMatch) {
      if (currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = "SUSPECT";
      currentText = suspectMatch[1];
    } else if (narratorMatch) {
      if (currentText.trim()) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      currentSpeaker = "NARRATOR";
      currentText = narratorMatch[1];
    } else {
      // Continue current speaker's text
      currentText += " " + trimmedLine;
    }
  }

  // Don't forget the last segment
  if (currentText.trim()) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim() });
  }

  return segments;
}

/**
 * Check if text is a dialogue script (has speaker labels)
 */
export function isDialogueScript(text: string): boolean {
  return /\[(DETECTIVE|SUSPECT|NARRATOR)\]:/i.test(text);
}

/**
 * Get voice ID - pick a premade voice deterministically from characterId.
 * No API calls, no voice creation, no limits.
 */
function getVoiceId(speaker: "DETECTIVE" | "SUSPECT" | "NARRATOR", config: ElevenLabsConfig): string {
  if (speaker === "DETECTIVE") {
    return DETECTIVE_VOICE_ID;
  }
  if (speaker === "SUSPECT") {
    const id = config.characterId || "suspect_default";
    const gender = config.characterGender || "male";
    console.log(
      `[ElevenLabs] getVoiceId SUSPECT — characterId="${config.characterId}", characterGender="${config.characterGender}", resolved gender="${gender}"`,
    );
    return pickVoice(id, gender);
  }
  return DEFAULT_VOICES.NARRATOR;
}

/**
 * Generate dialogue using Text to Dialogue API
 * POST /v1/text-to-dialogue with inputs array
 */
async function generateDialogueV3(
  segments: DialogueSegment[],
  apiKey: string,
  config: ElevenLabsConfig,
): Promise<ArrayBuffer> {
  // Get voice IDs (may generate from prompts)
  const detectiveVoiceId = getVoiceId("DETECTIVE", config);
  const suspectVoiceId = getVoiceId("SUSPECT", config);

  const narratorVoiceId = DEFAULT_VOICES.NARRATOR;

  // Build inputs array for Text to Dialogue API
  const inputs = segments.map((seg) => ({
    text: seg.text,
    voice_id:
      seg.speaker === "DETECTIVE" ? detectiveVoiceId : seg.speaker === "SUSPECT" ? suspectVoiceId : narratorVoiceId,
  }));

  console.log(`[ElevenLabs] Text to Dialogue API: ${inputs.length} segments`);

  const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-dialogue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      inputs,
      model_id: "eleven_v3",
      settings: {
        stability: [0.0, 0.5, 1.0].includes(config.stability ?? 0) ? (config.stability ?? 0) : 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`[ElevenLabs] Dialogue API error: ${errorText}`);
    throw new Error("FALLBACK_TO_SEQUENTIAL");
  }

  return response.arrayBuffer();
}

/**
 * Generate speech for a single segment using standard TTS API
 */
async function generateSpeechV3(
  text: string,
  voiceId: string,
  apiKey: string,
  config: ElevenLabsConfig,
): Promise<ArrayBuffer> {
  if (!text.trim()) {
    return new ArrayBuffer(0);
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: "eleven_v3",
      voice_settings: {
        stability: [0.0, 0.5, 1.0].includes(config.stability ?? 0) ? (config.stability ?? 0) : 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}

/**
 * Concatenate multiple audio buffers (MP3)
 */
function concatenateAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const nonEmptyBuffers = buffers.filter((b) => b.byteLength > 0);
  const totalLength = nonEmptyBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const buffer of nonEmptyBuffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return result.buffer;
}

/**
 * Generate TTS audio from text or dialogue script using Eleven v3
 */
export async function generateTTS(
  config: ElevenLabsConfig,
  context: any,
): Promise<{
  audioBase64: string;
  format: string;
  durationSeconds: number;
  contentType: string;
  characterCount: number;
  isDialogue: boolean;
}> {
  const apiKey = await getApiKey(context);

  const { text } = config;
  const isDialogue = isDialogueScript(text);

  let audioBuffer: ArrayBuffer;
  let characterCount = text.length;

  if (isDialogue) {
    const segments = parseDialogueScript(text);
    console.log(`[ElevenLabs] Generating v3 dialogue with ${segments.length} segments`);

    // Try Text to Dialogue API first (best for multi-speaker)
    try {
      audioBuffer = await generateDialogueV3(segments, apiKey, config);
    } catch (error: any) {
      // Fall back to sequential TTS if dialogue API fails
      if (error.message === "FALLBACK_TO_SEQUENTIAL" || error.message.includes("FALLBACK")) {
        console.log(`[ElevenLabs] Using sequential v3 TTS fallback`);
        const audioBuffers: ArrayBuffer[] = [];

        for (const segment of segments) {
          const voiceId = getVoiceId(segment.speaker, config);
          console.log(`[ElevenLabs] Generating v3 segment: ${segment.speaker}`);
          const segmentAudio = await generateSpeechV3(segment.text, voiceId, apiKey, config);
          audioBuffers.push(segmentAudio);

          // Small delay between API calls
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        audioBuffer = concatenateAudioBuffers(audioBuffers);
      } else {
        throw error;
      }
    }
  } else {
    // Single speaker mode with v3
    const voiceId = DEFAULT_VOICES.NARRATOR;
    console.log(`[ElevenLabs] Generating single-speaker v3 audio`);
    audioBuffer = await generateSpeechV3(text, voiceId, apiKey, config);
  }

  // Convert to base64
  const audioBase64 = Buffer.from(audioBuffer).toString("base64");

  // Estimate duration (~150 words per minute, ~5 chars per word)
  const estimatedDuration = (characterCount / 5 / 150) * 60;

  return {
    audioBase64,
    format: "mp3",
    durationSeconds: Math.round(estimatedDuration),
    contentType: "audio/mpeg",
    characterCount,
    isDialogue,
  };
}
