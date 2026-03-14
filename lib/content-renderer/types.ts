/**
 * Content block types for structured document rendering
 * @see docs/features/admin-question-import.features.md
 */

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "inline_math"; content: string }
  | { type: "block_math"; content: string }
  | {
      type: "table"
      spec: { headers: string[]; rows: string[][] }
    }
  | { type: "chart"; spec: Record<string, unknown> }
  | { type: "function_graph"; spec: Record<string, unknown> }
  | {
      type: "geometry"
      spec: { elements: Record<string, unknown>[]; viewBox?: { width: number; height: number } }
    }
  | { type: "venn"; spec: { sets: unknown[]; regions: unknown[] } }
  | {
      type: "image"
      spec: { url: string; alt?: string; caption?: string }
    }

export interface BlocksContainer {
  blocks: ContentBlock[]
}
