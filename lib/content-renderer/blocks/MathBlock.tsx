"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "inline_math" | "block_math" }>
}

export function MathBlock({ block }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(block.content, {
        displayMode: block.type === "block_math",
        throwOnError: false,
        strict: false,
      })
    } catch {
      return null
    }
  }, [block.content, block.type])

  if (!html) {
    return <span className="text-destructive">{block.content}</span>
  }

  if (block.type === "block_math") {
    return (
      <div
        className="my-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
