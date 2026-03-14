"use client"

import type { ContentBlock } from "./types"
import { TextBlock } from "./blocks/TextBlock"
import { MathBlock } from "./blocks/MathBlock"
import { TableBlock } from "./blocks/TableBlock"
import { ImageBlock } from "./blocks/ImageBlock"
import { ChartBlock } from "./blocks/ChartBlock"
import { FunctionGraphBlock } from "./blocks/FunctionGraphBlock"
import { GeometryBlock } from "./blocks/GeometryBlock"
import { VennBlock } from "./blocks/VennBlock"

interface DocumentRendererProps {
  blocks: ContentBlock[]
  className?: string
}

export function DocumentRenderer({ blocks, className = "" }: DocumentRendererProps) {
  if (!blocks?.length) return null

  return (
    <div className={`space-y-1 ${className}`}>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  )
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return <TextBlock block={block} />
    case "inline_math":
    case "block_math":
      return <MathBlock block={block} />
    case "table":
      return <TableBlock block={block} />
    case "image":
      return <ImageBlock block={block} />
    case "chart":
      return <ChartBlock block={block} />
    case "function_graph":
      return <FunctionGraphBlock block={block} />
    case "geometry":
      return <GeometryBlock block={block} />
    case "venn":
      return <VennBlock block={block} />
    default:
      return null
  }
}
