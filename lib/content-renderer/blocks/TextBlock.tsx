"use client"

import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "text" }>
}

export function TextBlock({ block }: Props) {
  return <span className="whitespace-pre-wrap">{block.content}</span>
}
