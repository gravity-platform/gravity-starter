/**
 * Abyssale API Service
 * Handles API calls to Abyssale for template rendering
 * Supports both static (sync) and printer/animated (async) templates
 */

import { AbyssaleConfig, AbyssaleOutput } from "../util/types";

const ABYSSALE_API_BASE = "https://api.abyssale.com";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max

export interface DesignDetails {
  id: string;
  name: string;
  type: string;
  pages?: string[]; // page keys like ["page_1", "page_2"]
  elements: Array<{ name: string; type: string; page?: string }>;
  formats: Array<{ id: string; width: number; height: number }>;
}

export interface CredentialContext {
  workflowId: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  config: any;
  credentials?: Record<string, any>;
}

/**
 * Render an Abyssale template with the given elements
 * Automatically handles static (sync) vs printer/animated (async) templates
 */
export async function renderTemplate(
  config: AbyssaleConfig,
  credentialContext: CredentialContext,
  api: any,
): Promise<AbyssaleOutput> {
  const credentials = await api.getNodeCredentials(credentialContext, "abyssaleCredential");

  if (!credentials?.apiKey) {
    throw new Error("Abyssale API key not found in credentials. Ensure abyssaleCredential is configured on the node.");
  }

  const { templateId, formatName, compressionLevel, elements } = config;

  if (!templateId) {
    throw new Error("Template ID is required");
  }

  // Parse elements if it's a string (from template field)
  let parsedElements: Record<string, any> = {};
  if (typeof elements === "string") {
    try {
      parsedElements = elements.trim() ? JSON.parse(elements) : {};
    } catch (e) {
      throw new Error(`Invalid elements JSON: ${e}`);
    }
  } else if (elements && typeof elements === "object") {
    parsedElements = elements;
  }

  // Sanitize empty string payloads to spaces (Abyssale requires non-blank values)
  parsedElements = sanitizeElements(parsedElements);

  // Build request body
  const requestBody: Record<string, any> = {
    elements: parsedElements,
  };

  if (formatName) {
    requestBody.template_format_name = formatName;
  }

  if (compressionLevel !== undefined) {
    requestBody.file_compression_level = compressionLevel;
  }

  // Try sync endpoint first (for static templates)
  const syncResponse = await fetch(`${ABYSSALE_API_BASE}/banner-builder/${templateId}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": credentials.apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (syncResponse.ok) {
    return await syncResponse.json();
  }

  // Check if it's a "not static" error - need async endpoint
  const errorText = await syncResponse.text();
  if (errorText.includes("template_not_static") || errorText.includes("Use the /async endpoint")) {
    return await renderTemplateAsync(templateId, requestBody, credentials.apiKey);
  }

  throw new Error(`Abyssale API error (${syncResponse.status}): ${errorText}`);
}

/**
 * Render template using async endpoint (for printer/animated templates)
 * Polls for completion and returns the result
 */
async function renderTemplateAsync(
  templateId: string,
  requestBody: Record<string, any>,
  apiKey: string,
): Promise<AbyssaleOutput> {
  console.log("[Abyssale] Using async endpoint for printer template:", templateId);

  // Start async generation
  const asyncResponse = await fetch(`${ABYSSALE_API_BASE}/async/banner-builder/${templateId}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!asyncResponse.ok) {
    const errorText = await asyncResponse.text();
    throw new Error(`Abyssale async API error (${asyncResponse.status}): ${errorText}`);
  }

  const asyncResult = await asyncResponse.json();
  const generationRequestId = asyncResult.generation_request_id;
  console.log("[Abyssale] Async generation started, request ID:", generationRequestId);

  if (!generationRequestId) {
    throw new Error("No generation_request_id returned from async endpoint");
  }

  // Poll for completion using /generation-request/{id} endpoint
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    console.log(`[Abyssale] Polling attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}...`);

    const statusResponse = await fetch(`${ABYSSALE_API_BASE}/generation-request/${generationRequestId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.log(`[Abyssale] Poll failed (${statusResponse.status}):`, errorText);
      throw new Error(`Abyssale status check error (${statusResponse.status}): ${errorText}`);
    }

    const statusResult = await statusResponse.json();
    console.log(
      `[Abyssale] Poll result: is_finalized=${statusResult.is_finalized}`,
      JSON.stringify(statusResult, null, 2),
    );

    // Check if generation is complete (is_finalized = true)
    if (statusResult.is_finalized) {
      // Check for errors first
      if (statusResult.errors?.length > 0 && (!statusResult.banners || statusResult.banners.length === 0)) {
        const errorMessages = statusResult.errors.map((e: any) => e.reason).join("; ");
        throw new Error(`Abyssale generation failed: ${errorMessages}`);
      }

      // Response may have "banners" array or direct file info
      const banner = statusResult.banners?.[0] || statusResult;
      const file = banner?.file || statusResult.file;
      if (file) {
        return {
          id: generationRequestId,
          file: {
            type: file.type || "pdf",
            url: file.url,
            cdn_url: file.cdn_url || file.url,
            filename: file.filename || `${generationRequestId}.pdf`,
          },
          format: banner?.format || statusResult.format || { id: "default", width: 0, height: 0 },
          template: banner?.template ||
            statusResult.template || {
              id: templateId,
              name: "",
              type: "printer",
              created_at: 0,
              updated_at: 0,
            },
        };
      }
    }
  }

  throw new Error(`Abyssale generation timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000} seconds`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a string looks like a URL (for image layer detection)
 */
function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:");
}

/**
 * Get design details including page structure
 */
export async function getDesignDetails(templateId: string, apiKey: string): Promise<DesignDetails> {
  const response = await fetch(`${ABYSSALE_API_BASE}/designs/${templateId}`, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get design details (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Extract unique page keys from elements if present
  const pageSet = new Set<string>();
  if (data.elements) {
    for (const el of data.elements) {
      if (el.page) {
        pageSet.add(el.page);
      }
    }
  }

  return {
    ...data,
    pages: pageSet.size > 0 ? Array.from(pageSet).sort() : undefined,
  };
}

/**
 * Render a multi-page PDF from Abyssale template
 * Replicates elements to all pages if flat elements provided
 */
export async function renderMultiPagePdf(
  config: AbyssaleConfig,
  credentialContext: CredentialContext,
  api: any,
): Promise<AbyssaleOutput> {
  const credentials = await api.getNodeCredentials(credentialContext, "abyssaleCredential");

  if (!credentials?.apiKey) {
    throw new Error("Abyssale API key not found in credentials.");
  }

  const { templateId, elements, pageCount } = config;

  if (!templateId) {
    throw new Error("Template ID is required");
  }

  // Parse elements
  let parsedElements: Record<string, any> = {};
  if (typeof elements === "string") {
    try {
      parsedElements = elements.trim() ? JSON.parse(elements) : {};
    } catch (e) {
      throw new Error(`Invalid elements JSON: ${e}`);
    }
  } else if (elements && typeof elements === "object") {
    parsedElements = elements;
  }

  let pagesPayload: Record<string, any>;

  // Check if user already provided pages structure
  if (parsedElements.pages && typeof parsedElements.pages === "object") {
    // User provided { pages: { page_1: {...}, page_2: {...} } }
    pagesPayload = parsedElements.pages;
    // Sanitize each page's elements
    for (const pageKey of Object.keys(pagesPayload)) {
      pagesPayload[pageKey] = sanitizeElements(pagesPayload[pageKey]);
    }
  } else {
    // Flat elements - need to replicate to all pages
    // First, try to get page count from design details
    let numPages = pageCount || 1;

    if (!pageCount) {
      try {
        const designDetails = await getDesignDetails(templateId, credentials.apiKey);
        if (designDetails.pages && designDetails.pages.length > 0) {
          numPages = designDetails.pages.length;
          console.log(`[Abyssale] Detected ${numPages} pages from design`);
        }
      } catch (e) {
        console.log(`[Abyssale] Could not fetch design details, using pageCount=${numPages}`);
      }
    }

    // Sanitize and replicate to all pages
    const sanitizedElements = sanitizeElements(parsedElements);
    pagesPayload = {};
    for (let i = 1; i <= numPages; i++) {
      pagesPayload[`page_${i}`] = { ...sanitizedElements };
    }
  }

  console.log(`[Abyssale] Generating multi-page PDF with ${Object.keys(pagesPayload).length} pages`);

  // Multi-page PDFs use /async/banner-builder/ endpoint with { pages: {...} }
  const response = await fetch(`${ABYSSALE_API_BASE}/async/banner-builder/${templateId}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": credentials.apiKey,
    },
    body: JSON.stringify({ pages: pagesPayload }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Abyssale multi-page API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  // Multi-page printer templates return generation_request_id for async polling
  if (result.generation_request_id) {
    console.log(`[Abyssale] Multi-page generation started (async), request ID: ${result.generation_request_id}`);
    return await pollForCompletion(result.generation_request_id, templateId, credentials.apiKey);
  }

  // If sync response (has file directly), return it
  if (result.file) {
    console.log(`[Abyssale] Multi-page generation completed (sync)`);
    return result as AbyssaleOutput;
  }

  throw new Error("Unexpected response from Abyssale: no generation_request_id or file");
}

/**
 * Poll for async generation completion
 */
async function pollForCompletion(
  generationRequestId: string,
  templateId: string,
  apiKey: string,
): Promise<AbyssaleOutput> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const statusResponse = await fetch(`${ABYSSALE_API_BASE}/generation-request/${generationRequestId}`, {
      method: "GET",
      headers: { "x-api-key": apiKey },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Abyssale status check error (${statusResponse.status}): ${errorText}`);
    }

    const statusResult = await statusResponse.json();

    if (statusResult.is_finalized) {
      if (statusResult.errors?.length > 0 && (!statusResult.banners || statusResult.banners.length === 0)) {
        const errorMessages = statusResult.errors.map((e: any) => e.reason).join("; ");
        throw new Error(`Abyssale generation failed: ${errorMessages}`);
      }

      const banner = statusResult.banners?.[0] || statusResult;
      const file = banner?.file || statusResult.file;
      if (file) {
        return {
          id: generationRequestId,
          file: {
            type: file.type || "pdf",
            url: file.url,
            cdn_url: file.cdn_url || file.url,
            filename: file.filename || `${generationRequestId}.pdf`,
          },
          format: banner?.format || statusResult.format || { id: "default", width: 0, height: 0 },
          template: banner?.template ||
            statusResult.template || {
              id: templateId,
              name: "",
              type: "multi-page",
              created_at: 0,
              updated_at: 0,
            },
        };
      }
    }
  }

  throw new Error(`Abyssale generation timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000} seconds`);
}

function sanitizeElements(elements: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(elements)) {
    if (value && typeof value === "object" && ("payload" in value || "image_url" in value)) {
      // Already in correct format: { payload: "..." } or { image_url: "..." }
      if ("image_url" in value) {
        sanitized[key] = value;
      } else {
        let payload = value.payload;
        if (payload === "" || (typeof payload === "string" && payload.trim() === "")) {
          payload = "_";
        } else if (typeof payload === "string") {
          payload = payload.replace(/\\n/g, "\n");
        }
        sanitized[key] = { ...value, payload };
      }
    } else if (typeof value === "string") {
      if (isUrl(value)) {
        // URL string - wrap as image_url for image layers
        sanitized[key] = { image_url: value };
      } else {
        // Text string - wrap in payload object
        let payload = value;
        if (payload === "" || payload.trim() === "") {
          payload = "_";
        } else {
          payload = payload.replace(/\\n/g, "\n");
        }
        sanitized[key] = { payload };
      }
    } else if (value !== null && value !== undefined) {
      // Other types (numbers, etc) - wrap in payload
      sanitized[key] = { payload: String(value) };
    }
  }
  return sanitized;
}
