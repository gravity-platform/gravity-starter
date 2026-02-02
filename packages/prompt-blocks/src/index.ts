import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

export interface PromptBlock {
  id: string;
  name: string;
  description?: string;
  content: string;
  tags: string[];
  category?: string;
}

/**
 * Load all prompt blocks from the blocks/ directory
 */
export function loadPromptBlocks(): PromptBlock[] {
  const blocksDir = path.join(__dirname, "..", "blocks");
  const blocks: PromptBlock[] = [];

  if (!fs.existsSync(blocksDir)) {
    return blocks;
  }

  // Recursively find all .md files
  const findMdFiles = (dir: string, category?: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        findMdFiles(fullPath, entry.name);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        const { data, content } = matter(fileContent);

        blocks.push({
          id: entry.name.replace(".md", ""),
          name: data.name || entry.name.replace(".md", ""),
          description: data.description,
          content: content.trim(),
          tags: data.tags || [],
          category,
        });
      }
    }
  };

  findMdFiles(blocksDir);
  return blocks;
}

/**
 * Get a single prompt block by ID
 */
export function getPromptBlock(id: string): PromptBlock | undefined {
  const blocks = loadPromptBlocks();
  return blocks.find((b) => b.id === id);
}

/**
 * Get prompt blocks by tag
 */
export function getPromptBlocksByTag(tag: string): PromptBlock[] {
  const blocks = loadPromptBlocks();
  return blocks.filter((b) => b.tags.includes(tag));
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const blocks = loadPromptBlocks();
  const tags = new Set<string>();
  blocks.forEach((b) => b.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}
