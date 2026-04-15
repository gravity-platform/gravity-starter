/**
 * SpatialIngest Service
 *
 * Runs the full spatial ingestion pipeline:
 *   1. LLM extraction  → node-service /execute (OpenAIStructuredOutput)
 *   2. Embeddings      → OpenAI text-embedding-3-large via node-service
 *   3. Returns         → SpatialEntry[] ready for dictionaryDB.uploadEntries()
 *
 * Prompts and schemas are COPIED from:
 *   apps/server/src/services/contentEngine/extraction/prompts.ts
 *   apps/server/src/services/contentEngine/extraction/schemas.ts
 * TODO: Move to shared package so there is one source of truth.
 */

import { createHash } from "crypto";
import { SpatialEntry } from "../util/types";

const NODE_SERVICE_URL = process.env.NODE_SERVICE_URL || "http://localhost:4102";

export interface RunPipelineInput {
  rawContent: string;
  category: string;
  domainPrompt: string;
  workflowId: string;
  sourceUrl?: string;
  openAIApiKey: string;
}

export interface RunPipelineResult {
  success: boolean;
  entries: SpatialEntry[];
}

export async function runSpatialIngestPipeline(input: RunPipelineInput): Promise<RunPipelineResult> {
  const { rawContent, category, domainPrompt, workflowId, sourceUrl, openAIApiKey } = input;

  // Step 1: LLM extraction
  const schema = getExtractionSchema(category);
  const systemPrompt = getExtractionPrompt(category, domainPrompt);

  const extractRes = await fetch(`${NODE_SERVICE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodeType: "OpenAIStructuredOutput",
      inputs: { content: rawContent, schema },
      config: {
        model: "gpt-4o",
        instructions: systemPrompt,
        schemaName: `${category}_extraction`,
      },
      context: { credentials: { openAICredential: { apiKey: openAIApiKey } } },
    }),
  });

  if (!extractRes.ok) {
    const err = await extractRes.text();
    throw new Error(`SpatialIngest: extraction failed (${extractRes.status}): ${err}`);
  }

  const extractData = (await extractRes.json()) as any;
  const objects: any[] = extractData.result?.objects || [];

  if (!objects.length) {
    return { success: false, entries: [] };
  }

  // Step 2: Embeddings
  const embeddingTexts = objects.map(buildEmbeddingText);

  const embedRes = await fetch(`${NODE_SERVICE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodeType: "OpenAIEmbedding",
      inputs: { texts: embeddingTexts },
      config: { model: "text-embedding-3-large", dimensions: 1536 },
      context: { credentials: { openAICredential: { apiKey: openAIApiKey } } },
    }),
  });

  if (!embedRes.ok) {
    const err = await embedRes.text();
    throw new Error(`SpatialIngest: embedding failed (${embedRes.status}): ${err}`);
  }

  const embedData = (await embedRes.json()) as any;
  const embeddings: number[][] = embedData.result?.embeddings || [];

  // Step 3: Build entries
  const entries: SpatialEntry[] = objects.map((obj, i) => ({
    universal_id: generateUniversalId(workflowId, obj.title, obj.description),
    content_hash: generateContentHash(obj),
    title: obj.title || "",
    description: obj.description || "",
    object_type: category,
    key_need: obj.keyNeed || "",
    needs: obj.needs || [],
    source_url: sourceUrl || "",
    embedding_original: embeddings[i] || [],
    needs_umap_update: true,
    workflow_id: workflowId,
    metadata: {
      callToAction: obj.callToAction,
      action: obj.action,
      questions: obj.questions,
      llmObjectType: obj.objectType,
    },
  }));

  return { success: true, entries };
}

// ---------------------------------------------------------------------------
// PROMPTS — COPIED FROM apps/server/src/services/contentEngine/extraction/prompts.ts
// TODO: move to shared package
// ---------------------------------------------------------------------------

function getCategoryDescription(category: string): string {
  const map: Record<string, string> = {
    SERVICE: "services, treatments, programs, or offerings",
    NEED: "user needs, pain points, desires, or intentions",
    IMAGE: "visual content and imagery",
    DOCUMENT: "articles, guides, or documentation",
    MCP: "actions or tools that help users accomplish tasks",
    SKILL: "agent capabilities, instructions, or guidance for handling specific situations",
  };
  return map[category.toUpperCase()] || "items";
}

function getExtractionPrompt(category: string, domainPrompt: string): string {
  const categoryDesc = getCategoryDescription(category);
  const MAX_DOMAIN_LENGTH = 500;
  const rawDomain = domainPrompt || "";
  const contextBlock =
    rawDomain.length > MAX_DOMAIN_LENGTH ? rawDomain.slice(0, MAX_DOMAIN_LENGTH).trimEnd() + "…" : rawDomain;

  return `${contextBlock}

Your task:
1. Identify all ${categoryDesc} mentioned in the content
2. Extract relevant information for each one
3. Structure the data according to the provided JSON schema

GROUNDING - CRITICAL:
- ONLY use information explicitly present in the provided content
- DO NOT add facts, features, or details not mentioned in the source
- If information is missing, leave it out - do not invent or assume
- Every claim must be traceable to the provided content

Guidelines:
- Be accurate and comprehensive
- Use clear, natural language
- Focus on user benefits and outcomes
- CRITICAL: Extract MULTIPLE objects - create a separate object for each distinct ${categoryDesc} found
- CRITICAL: DO NOT create just one object per page - if a page mentions 5 different services, create 5 objects
- CRITICAL: Each object should represent ONE specific ${categoryDesc}, not a collection
- Write rich, detailed descriptions (150-500 characters minimum) that provide real value
- CRITICAL: Descriptions must be at least 150 characters - provide specific details, not generic statements
- CRITICAL: Do NOT start descriptions with self-referential phrases like "This need...", "This service...", "This item...". Write directly about the topic.
- CRITICAL: Provide exactly 5-7 user needs per item (aim for 6)
- CRITICAL: Generate exactly 4 questions per item

CRITICAL for Titles:
- DO NOT include the company/brand name in titles
- Titles should describe the service/need/content itself
- Good: "Performance Enhancement and Injury Prevention"
- Bad: "Company Name - Performance Enhancement and Injury Prevention"
- Keep titles concise and descriptive

CRITICAL for 3D Space Organization:
- ALWAYS identify the PRIMARY USER NEED (keyNeed) - this anchors the item in 3D space
- List ALL related user needs - these create semantic connections
- Think: "What problem does this solve?" and "Who needs this?"

CRITICAL for Questions:
- Generate exactly 4 questions that this content directly answers
- ONLY create questions based on information explicitly present in the content
- Questions should help users understand what's actually covered in the content

${getCategorySpecificPrompt(category, domainPrompt)}`;
}

function getCategorySpecificPrompt(category: string, domain: string): string {
  switch (category.toUpperCase()) {
    case "SERVICE":
      return `Focus on service details: process, duration, benefits, who it's for, pricing indicators, booking information, and unique features.

CRITICAL - Write from the USER's perspective (not the organization's):
- Title: What the USER gets or achieves (e.g., "Learn Unity Game Development", not "Unity Game Development Course")
- Description: What problem this solves for the user, who benefits, and what outcome they can expect
- keyNeed: The primary USER goal this service addresses (e.g., "Develop game development skills")
- needs: Related USER goals and pain points (5-7 items)
- Think: "What is the user trying to accomplish?" and "Why would someone seek this out?"

CRITICAL - EXTRACT MULTIPLE OBJECTS:
- Each service may address MULTIPLE distinct user needs — extract them as separate objects
- MINIMUM 3 objects per item, TARGET 5-8`;

    case "NEED":
      return `Focus on user pain points, desires, goals, and problems they're trying to solve. Capture emotional context and urgency levels.

🚨 CRITICAL - GROUNDING 🚨
- ONLY extract needs from the PROVIDED CONTENT
- DO NOT invent needs based on the system prompt or your general knowledge
- Every need you return must be traceable to a specific statement in the provided content

🚨 CRITICAL - YOU MUST EXTRACT MULTIPLE NEEDS PER PAGE 🚨
- MINIMUM 3 need objects per page, TARGET 5-8 need objects
- Each page discusses MULTIPLE different user needs - extract ALL of them
- Create a SEPARATE object for EACH distinct need mentioned
- DO NOT create just 1 object that combines everything`;

    case "IMAGE":
      return `Write about the SERVICE or NEED the image represents - not about the image itself.
CRITICAL: Identify the PRIMARY USER NEED (keyNeed) and ALL related needs.
Write as website service copy that will cluster with related text-based content in 3D space.`;

    case "DOCUMENT":
      return `Extract the user needs and problems this document helps address.

CRITICAL - Write from the USER's perspective:
- Title: What the USER learns or achieves from this document (not the document's title)
- Description: What problem this solves for the user and what they gain from reading it
- keyNeed: The primary USER goal this document addresses
- needs: Related USER goals and pain points (5-7 items)

CRITICAL - EXTRACT MULTIPLE OBJECTS:
- A document may address MULTIPLE distinct user needs — extract them as separate objects
- MINIMUM 3 objects per document, TARGET 5-8`;

    case "MCP":
      return `Focus on user goals, desires, and problems they're trying to solve with this action/tool.

CRITICAL - Write from the USER's perspective:
- Title: What the USER wants to do (e.g., "Find the Right Credit Card")
- Description: What problem this solves and who benefits
- keyNeed: The primary user goal this addresses
- needs: Related user goals and pain points (5-7 items)`;

    case "SKILL":
      return `Focus on the CUSTOMER'S pain points, desires, and problems this skill helps address.
Write from the END CUSTOMER's perspective - what do THEY need when this skill is used?

CRITICAL - Write from the CUSTOMER's perspective (not the agent's):
- Title: What situation the customer is in (e.g., "Get Help With a Complaint")
- Description: What the customer is experiencing, their frustration, and what outcome they want
- keyNeed: The primary CUSTOMER goal
- needs: Related CUSTOMER goals and pain points (5-7 items)`;

    default:
      return `Extract all relevant information and create specific, descriptive object types.
CRITICAL - Write from the USER's perspective. keyNeed and needs[] MUST reflect user intent.
MINIMUM 3 objects per item, TARGET 5-8.`;
  }
}

// ---------------------------------------------------------------------------
// SCHEMAS — COPIED FROM apps/server/src/services/contentEngine/extraction/schemas.ts
// TODO: move to shared package
// ---------------------------------------------------------------------------

const BASE_ITEM_SCHEMA = {
  type: "object",
  properties: {
    objectType: { type: "string" },
    title: { type: "string", description: "Short, clear title for the item" },
    description: {
      type: "string",
      description:
        "Detailed 3-4 sentence description that provides real value: what it is, who specifically benefits, concrete outcomes/results, and what makes it unique or effective.",
    },
    keyNeed: { type: "string", description: "Primary user need this addresses" },
    callToAction: { type: "string", description: "Action-oriented CTA" },
    action: { type: "string", description: "Short button label (1-3 words)" },
    needs: {
      type: "array",
      description: "List of user needs/intents addressed (5-7 items)",
      minItems: 5,
      maxItems: 7,
      items: { type: "string" },
    },
    questions: {
      type: "array",
      description: "Self-contained questions this content answers (exactly 4)",
      minItems: 4,
      maxItems: 4,
      items: { type: "string" },
    },
  },
  required: ["objectType", "title", "description", "keyNeed", "needs", "callToAction", "action", "questions"],
  additionalProperties: false,
};

function getExtractionSchema(category: string): object {
  return {
    type: "object",
    properties: {
      objects: {
        type: "array",
        description:
          "Array of extracted objects. Extract MULTIPLE objects — minimum 3, target 5-8 per content block.",
        items: BASE_ITEM_SCHEMA,
      },
    },
    required: ["objects"],
    additionalProperties: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmbeddingText(obj: any): string {
  return [
    obj.objectType && obj.title ? `${obj.objectType}: ${obj.title}` : "",
    obj.description || "",
    obj.keyNeed ? `Primary User Need: ${obj.keyNeed}` : "",
    obj.needs?.length ? `This helps with: ${obj.needs.join(", ")}` : "",
    obj.questions?.length ? `Questions:\n${obj.questions.map((q: string) => `- ${q}`).join("\n")}` : "",
    obj.callToAction || "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function generateUniversalId(workflowId: string, title: string, description: string): string {
  const hash = createHash("sha256").update(`${workflowId}:${title}:${description}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function generateContentHash(obj: any): string {
  const content = [obj.title || "", obj.description || "", obj.keyNeed || "", (obj.needs || []).sort().join("|")].join(":");
  return createHash("sha256").update(content).digest("hex");
}
