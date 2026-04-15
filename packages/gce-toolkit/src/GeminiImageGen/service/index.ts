/**
 * Google Gemini Image Generation service
 * Handles all Gemini API interactions with proper credential management
 */

import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import { GeminiImageGenConfig, GeminiImageGenCredentials, GeneratedImage } from "../util/types";
import { getNodeCredentials, geminiLogger as logger } from "../../shared/platform";

type CredentialContext = any;

/**
 * Fetch an image from URL and convert to base64
 */
async function fetchImageAsBase64(url: string, log: any): Promise<{ base64: string; mimeType: string }> {
  log.info("Fetching reference image", { url: url.substring(0, 100) });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  log.info("Reference image fetched and converted", {
    mimeType: contentType,
    sizeBytes: arrayBuffer.byteLength,
  });

  return { base64, mimeType: contentType };
}

/**
 * Generate images using Google Gemini's image generation API
 */
export async function generateImages(
  config: GeminiImageGenConfig,
  context: CredentialContext,
  nodeLogger?: any,
): Promise<{ images: GeneratedImage[]; text?: string }> {
  // Use provided logger or fall back to base logger
  const log = nodeLogger || logger;

  try {
    // Fetch credentials internally
    const credentials = (await getNodeCredentials(context, "geminiCredential")) as GeminiImageGenCredentials;

    if (!credentials?.apiKey) {
      throw new Error("Gemini API key not found in credentials");
    }

    const apiKey = credentials.apiKey;

    log.info("Calling Gemini Image Generation API", {
      model: config.model,
      promptLength: config.prompt.length,
    });

    // Initialize Gemini client
    const ai = new GoogleGenAI({
      apiKey,
    });

    // Build config - add system instruction for reference image enforcement when provided
    const geminiConfig: any = {
      responseModalities: ["IMAGE", "TEXT"],
    };

    if (config.referenceImageUrl) {
      geminiConfig.systemInstruction = `You are an image generation assistant. A reference photo is provided ONLY as a likeness guide for facial identity.

RULES — read carefully:
1. The TEXT PROMPT is the primary creative direction. It defines the age, scene, clothing, pose, situation, and style. The prompt ALWAYS wins over the photo for these attributes.
2. The reference photo provides ONLY the base facial identity — use it to capture the person's recognisable bone structure, eye shape, nose shape, and mouth shape.
3. If the prompt says the person is older or younger than the photo, you MUST age or de-age the face accordingly while keeping the underlying facial identity recognisable.
4. Do NOT copy the photo's lighting, background, clothing, hairstyle, expression, or age unless the prompt explicitly asks for it.
5. Think of the photo as a casting reference — same actor, different role.`;
    }

    // Build content parts
    const parts: any[] = [];

    // Fetch and add reference image if URL provided
    if (config.referenceImageUrl) {
      try {
        const { base64, mimeType } = await fetchImageAsBase64(config.referenceImageUrl, log);
        parts.push({
          inlineData: {
            mimeType,
            data: base64,
          },
        });
        log.info("Reference image added to request");
      } catch (error: any) {
        log.warn("Failed to fetch reference image, continuing without it", {
          error: error.message,
        });
      }
    }

    // Build the final prompt with reference image enforcement
    let finalPrompt = config.prompt;
    if (config.referenceImageUrl && parts.length > 0 && parts[0].inlineData) {
      // Likeness-only instruction: photo is a casting reference, prompt is the creative direction
      const referenceInstruction = `LIKENESS REFERENCE: The attached photo is a casting reference for the person's facial identity only. Use the same underlying bone structure, eye shape, nose, and mouth so the person is recognisable — but follow the prompt below for everything else including age, scene, clothing, expression, and style. The prompt is the creative director; the photo is just the casting sheet.\n\n`;
      finalPrompt = referenceInstruction + config.prompt;
      log.info("Reference image likeness instruction prepended to prompt");
    }

    // Add the main prompt
    parts.push({
      text: finalPrompt,
    });

    const contents = [
      {
        role: "user",
        parts,
      },
    ];

    // Make API call using streaming to capture all image chunks
    const response = await ai.models.generateContentStream({
      model: config.model,
      config: geminiConfig,
      contents,
    });

    const images: GeneratedImage[] = [];
    let textResponse = "";
    let fileIndex = 0;

    // Process streaming response
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }

      // Iterate through all parts in the response
      for (const part of chunk.candidates[0].content.parts) {
        // Extract image data
        if (part.inlineData) {
          const inlineData = part.inlineData;
          const mimeType = inlineData.mimeType || "image/png";
          const fileExtension = mime.getExtension(mimeType) || "png";
          const fileName = config.fileName
            ? `${config.fileName}_${fileIndex}.${fileExtension}`
            : `generated_image_${fileIndex}.${fileExtension}`;

          images.push({
            data: inlineData.data || "",
            mimeType,
            fileName,
          });

          fileIndex++;
          log.info(`Generated image ${fileIndex}`, { fileName, mimeType });
        }
        // Extract text response if any
        else if (part.text) {
          textResponse += part.text;
        }
      }
    }

    if (images.length === 0) {
      throw new Error("No images were generated by Gemini");
    }

    log.info("Gemini image generation successful", {
      model: config.model,
      imageCount: images.length,
      textLength: textResponse.length,
    });

    return {
      images,
      text: textResponse || undefined,
    };
  } catch (error: any) {
    log.error("Failed to generate images", { error: error.message });
    throw new Error(`Failed to generate images: ${error.message}`);
  }
}
