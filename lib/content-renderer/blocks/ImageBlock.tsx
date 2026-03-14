"use client"

import Image from "next/image"
import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "image" }>
}

export function ImageBlock({ block }: Props) {
  const { url, alt, caption } = block.spec

  return (
    <div className="my-4 space-y-1">
      <div className="relative w-full rounded-lg border-2 border-border overflow-hidden bg-muted">
        <Image
          src={url}
          alt={alt || "Question image"}
          width={800}
          height={400}
          className="w-full h-auto"
        />
      </div>
      {caption && (
        <p className="text-sm text-muted-foreground text-center">{caption}</p>
      )}
    </div>
  )
}
