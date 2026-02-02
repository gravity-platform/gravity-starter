/**
 * Skill Types
 * -----------
 * TypeScript interfaces for the Gravity Skills system
 */

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillFrontmatter {
  name: string;
  description: string;
  version?: string;
  category?: "ai" | "integration" | "workflow" | "utility";
  triggers?: string[];
}

/**
 * Complete skill definition (frontmatter + instructions)
 */
export interface GravitySkill extends SkillFrontmatter {
  instructions: string;
  filePath: string;
}

/**
 * Result of scanning a skill file
 */
export interface SkillScanResult {
  skillId: string;
  name: string;
  description: string;
  contentHash: string;
  isNew: boolean;
  isChanged: boolean;
  filePath: string;
  valid: boolean;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Skill available in the library (not yet imported to a workflow)
 */
export interface AvailableSkill {
  name: string;
  description: string;
  version?: string;
  category?: string;
  filePath: string;
}

/**
 * Validation result for a skill
 */
export interface SkillValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
