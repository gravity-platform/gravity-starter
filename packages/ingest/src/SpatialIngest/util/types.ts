export interface SpatialIngestConfig {
  rawContent: string;
  category: "need" | "service" | "image" | "document" | "mcp" | "skill";
  sourceUrl?: string;
  domainPrompt?: string;
}

export interface SpatialIngestOutput {
  success: boolean;
  count: number;
  universalIds: string[];
}

export interface SpatialEntry {
  universal_id: string;
  content_hash: string;
  title: string;
  description: string;
  object_type: string;
  key_need: string;
  needs: string[];
  source_url: string;
  embedding_original: number[];
  needs_umap_update: boolean;
  workflow_id: string;
  metadata: Record<string, any>;
}
