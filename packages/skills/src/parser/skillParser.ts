/**
 * Skill Parser
 * ------------
 * Parse SKILL.md files into structured skill objects
 */

import matter from "gray-matter";
import { createHash } from "crypto";
import { GravitySkill, SkillFrontmatter, SkillValidationResult } from "../types/skill";

/**
 * JSON Schema for skill frontmatter validation
 */
const SKILL_SCHEMA = {
  required: ["name", "description"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 64,
      pattern: "^[a-z0-9-]+$",
    },
    description: {
      type: "string",
      minLength: 10,
      maxLength: 1024,
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
    },
    category: {
      type: "string",
      enum: ["ai", "integration", "workflow", "utility"],
    },
    triggers: {
      type: "array",
      items: { type: "string" },
      maxItems: 20,
    },
  },
};

/**
 * Parse a SKILL.md file content into a GravitySkill object
 */
export function parseSkillFile(content: string, filePath: string): GravitySkill {
  const { data, content: markdownBody } = matter(content);
  const frontmatter = data as SkillFrontmatter;

  return {
    ...frontmatter,
    instructions: markdownBody.trim(),
    filePath,
  };
}

/**
 * Validate a parsed skill against the schema
 */
export function validateSkill(skill: GravitySkill): SkillValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // 1. Validate required fields
  if (!skill.name) {
    errors.push({ field: "name", message: "Skill must have a name" });
  } else {
    // Validate name format
    if (skill.name.length > 64) {
      errors.push({ field: "name", message: "Name must be 1-64 characters" });
    }
    if (!/^[a-z0-9-]+$/.test(skill.name)) {
      errors.push({ field: "name", message: "Name must contain only lowercase letters, numbers, and hyphens" });
    }
  }

  if (!skill.description) {
    errors.push({ field: "description", message: "Skill must have a description" });
  } else if (skill.description.length < 10 || skill.description.length > 1024) {
    errors.push({ field: "description", message: "Description must be 10-1024 characters" });
  }

  // 2. Validate instructions exist
  if (!skill.instructions || skill.instructions.trim().length < 10) {
    errors.push({ field: "instructions", message: "Skill must have instructions (markdown body, min 10 chars)" });
  }

  // 3. Validate version format if provided
  if (skill.version && !/^\d+\.\d+\.\d+$/.test(skill.version)) {
    errors.push({ field: "version", message: "Version must be valid semver (e.g., 1.0.0)" });
  }

  // 4. Validate category if provided
  if (skill.category && !["ai", "integration", "workflow", "utility"].includes(skill.category)) {
    errors.push({ field: "category", message: "Category must be one of: ai, integration, workflow, utility" });
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Generate content hash for change detection
 */
export function generateSkillHash(skill: GravitySkill): string {
  const contentToHash = [skill.name, skill.description, skill.instructions].join(":");
  return createHash("sha256").update(contentToHash).digest("hex");
}
