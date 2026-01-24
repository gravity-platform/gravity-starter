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

// Default voice IDs - ElevenLabs standard pre-made voices (available in all accounts)
// These are the official IDs from ElevenLabs voice library
const DEFAULT_VOICES = {
  DETECTIVE: "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, authoritative male
  SUSPECT: "XB0fDUnXU5powFXDhCwa", // Charlotte - clear female
  NARRATOR: "onwK4e9ZLuTAKqWW03F9", // Daniel - professional
};

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

// Cache for generated voice IDs to avoid regenerating
const voiceCache: Map<string, string> = new Map();

/**
 * Search for an existing voice by name
 * GET /v2/voices?search=name
 */
async function findVoiceByName(voiceName: string, apiKey: string): Promise<string | null> {
  console.log(`[ElevenLabs] Searching for existing voice: "${voiceName}"`);

  try {
    // Use v2/voices with search parameter and category=generated for designed voices
    const searchUrl = `https://api.elevenlabs.io/v2/voices?search=${encodeURIComponent(
      voiceName
    )}&category=generated&page_size=50`;
    console.log(`[ElevenLabs] Search URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[ElevenLabs] Voice search failed (${response.status}): ${errorText}`);
      return null;
    }

    const result = await response.json();
    const voiceNames = result.voices?.map((v: any) => v.name) || [];
    console.log(`[ElevenLabs] Found ${voiceNames.length} generated voices: ${voiceNames.join(", ") || "(none)"}`);

    // Find exact match by name
    const exactMatch = result.voices?.find((v: any) => v.name === voiceName);

    if (exactMatch) {
      console.log(`[ElevenLabs] ✓ Found voice "${voiceName}": ${exactMatch.voice_id}`);
      return exactMatch.voice_id;
    }

    console.log(`[ElevenLabs] ✗ Voice "${voiceName}" not found in generated voices`);
    return null;
  } catch (error) {
    console.error(`[ElevenLabs] Voice search error:`, error);
    return null;
  }
}

/**
 * Get or create a voice from a text prompt
 * 1. Search for existing voice by name
 * 2. If not found, design + save the voice
 * 3. Return permanent voice_id
 */
async function getOrCreateVoice(voiceName: string, voicePrompt: string, apiKey: string): Promise<string> {
  const cacheKey = voiceName;

  // Always verify voice exists via API (cache may be stale if voice was deleted)
  const existingVoiceId = await findVoiceByName(voiceName, apiKey);
  if (existingVoiceId) {
    console.log(`[ElevenLabs] Found existing voice "${voiceName}": ${existingVoiceId}`);
    voiceCache.set(cacheKey, existingVoiceId);
    return existingVoiceId;
  }

  // Voice not found - clear stale cache entry if present
  if (voiceCache.has(cacheKey)) {
    console.log(`[ElevenLabs] Clearing stale cache for deleted voice: ${voiceName}`);
    voiceCache.delete(cacheKey);
  }

  // Step 2: Design a new voice preview
  console.log(`[ElevenLabs] Creating new voice "${voiceName}" with prompt: "${voicePrompt.substring(0, 80)}..."`);

  // Generate preview text that matches the voice character for better results
  // Longer preview text produces more stable and expressive voices
  const previewText = voiceName.startsWith("det_")
    ? "I need you to walk me through exactly what happened that evening. Take your time, but I need every detail. Where were you, who did you see, and what time was it?"
    : "Let me be perfectly clear about something. I've told you everything I know. I was exactly where I said I was, doing exactly what I said I was doing. Check with anyone who was there.";

  const designResponse = await fetch(`${ELEVENLABS_API_BASE}/text-to-voice/design`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      voice_description: voicePrompt,
      model_id: "eleven_ttv_v3",
      text: previewText,
      guidance_scale: 7, // Higher = stricter prompt adherence (better for accents)
      loudness: 0.5,
    }),
  });

  if (!designResponse.ok) {
    const errorText = await designResponse.text();
    console.error(`[ElevenLabs] Voice Design failed (${designResponse.status}): ${errorText}`);
    throw new Error(`Voice Design API error: ${errorText}`);
  }

  const designResult = await designResponse.json();
  const generatedVoiceId = designResult.previews?.[0]?.generated_voice_id;

  if (!generatedVoiceId) {
    throw new Error("Voice Design API returned no generated_voice_id");
  }

  // Step 3: Save the voice preview to get a permanent voice_id
  console.log(`[ElevenLabs] Saving voice preview as "${voiceName}"...`);

  const saveResponse = await fetch(`${ELEVENLABS_API_BASE}/text-to-voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      voice_name: voiceName,
      voice_description: voicePrompt,
      generated_voice_id: generatedVoiceId,
    }),
  });

  if (!saveResponse.ok) {
    const errorText = await saveResponse.text();
    console.error(`[ElevenLabs] Save voice failed (${saveResponse.status}): ${errorText}`);
    throw new Error(`Save voice API error: ${errorText}`);
  }

  const saveResult = await saveResponse.json();
  const permanentVoiceId = saveResult.voice_id;

  if (!permanentVoiceId) {
    throw new Error("Save voice API returned no voice_id");
  }

  console.log(`[ElevenLabs] Created voice "${voiceName}" with ID: ${permanentVoiceId}`);
  voiceCache.set(cacheKey, permanentVoiceId);

  return permanentVoiceId;
}

/**
 * Get voice ID - look up or create voice, or use default
 * Voice names are based on config IDs (e.g., "sus_gavin") for reuse
 */
async function getVoiceId(
  speaker: "DETECTIVE" | "SUSPECT" | "NARRATOR",
  config: ElevenLabsConfig,
  apiKey: string
): Promise<string> {
  try {
    if (speaker === "DETECTIVE") {
      if (config.detectiveVoicePrompt) {
        // Use detectiveId if provided, otherwise generate a name
        const voiceName = config.detectiveId || `detective_${Date.now()}`;
        return await getOrCreateVoice(voiceName, config.detectiveVoicePrompt, apiKey);
      }
      return DEFAULT_VOICES.DETECTIVE;
    }
    if (speaker === "SUSPECT") {
      if (config.characterVoicePrompt) {
        // Use characterId if provided, otherwise generate a name
        const voiceName = config.characterId || `character_${Date.now()}`;
        return await getOrCreateVoice(voiceName, config.characterVoicePrompt, apiKey);
      }
      return DEFAULT_VOICES.SUSPECT;
    }
    return DEFAULT_VOICES.NARRATOR;
  } catch (error) {
    console.error(`[ElevenLabs] Voice creation failed for ${speaker}, using default:`, error);
    if (speaker === "DETECTIVE") return DEFAULT_VOICES.DETECTIVE;
    if (speaker === "SUSPECT") return DEFAULT_VOICES.SUSPECT;
    return DEFAULT_VOICES.NARRATOR;
  }
}

/**
 * Generate dialogue using Text to Dialogue API
 * POST /v1/text-to-dialogue with inputs array
 */
async function generateDialogueV3(
  segments: DialogueSegment[],
  apiKey: string,
  config: ElevenLabsConfig
): Promise<ArrayBuffer> {
  // Get voice IDs (may generate from prompts)
  const detectiveVoiceId = await getVoiceId("DETECTIVE", config, apiKey);
  const suspectVoiceId = await getVoiceId("SUSPECT", config, apiKey);

  // Build inputs array for Text to Dialogue API
  const inputs = segments.map((seg) => ({
    text: seg.text,
    voice_id: seg.speaker === "DETECTIVE" ? detectiveVoiceId : suspectVoiceId,
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
        stability: [0.0, 0.5, 1.0].includes(config.stability ?? 0) ? config.stability ?? 0 : 0.0,
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
  config: ElevenLabsConfig
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
        stability: [0.0, 0.5, 1.0].includes(config.stability ?? 0) ? config.stability ?? 0 : 0.0,
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
  context: any
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
          const voiceId = await getVoiceId(segment.speaker, config, apiKey);
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
