/**
 * Type definitions for Abyssale node
 */

export interface AbyssaleElementOverride {
  payload?: string;
  image_url?: string;
  background_color?: string;
  color?: string;
  border_color?: string;
  border_radius?: number;
  [key: string]: any;
}

export type AbyssaleOutputType = "image" | "pdf" | "video";

export interface AbyssaleConfig {
  templateId: string;
  outputType?: AbyssaleOutputType;
  formatName?: string;
  compressionLevel?: number;
  elements?: string | Record<string, AbyssaleElementOverride>;
  multiPage?: boolean;
  pageCount?: number;
}

export interface AbyssaleFile {
  type: string;
  url: string;
  cdn_url: string;
  filename: string;
}

export interface AbyssaleFormat {
  id: string;
  width: number;
  height: number;
}

export interface AbyssaleTemplate {
  id: string;
  name: string;
  type: string;
  created_at: number;
  updated_at: number;
  category_name?: string;
}

export interface AbyssaleOutput {
  id: string;
  file: AbyssaleFile;
  format: AbyssaleFormat;
  template: AbyssaleTemplate;
}

export interface AbyssaleExecutorOutput {
  __outputs: {
    output: {
      url: string;
      cdnUrl: string;
      fileType: string;
      filename: string;
      width: number;
      height: number;
      templateId: string;
      templateName: string;
    };
  };
}
