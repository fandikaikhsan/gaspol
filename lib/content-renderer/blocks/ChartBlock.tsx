"use client"

import { useEffect, useRef, useState } from "react"
import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "chart" }>
}

/**
 * ChartBlock — Vega-Lite rendering
 * Uses dynamic import to avoid bundling vega (which pulls in node canvas) in the main bundle.
 * Falls back to placeholder if vega-embed fails (e.g. SSR or bundle issues).
 */
export function ChartBlock({ block }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !block.spec) return

    let mounted = true
    let view: { view?: { finalize?: () => void } } | null = null

    import("vega-embed")
      .then(({ default: embed }) => {
        if (!mounted || !containerRef.current) return
        const spec = block.spec as Record<string, unknown>
        const vegaSpec = spec.$schema
          ? spec
          : { ...spec, $schema: "https://vega.github.io/schema/vega-lite/v5.json" }
        return embed(containerRef.current, vegaSpec, {
          actions: false,
          renderer: "svg",
        })
      })
      .then((result) => {
        if (mounted) view = result
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.message || "Chart failed to load")
          console.warn("[ChartBlock] Vega render error:", err)
        }
      })

    return () => {
      mounted = false
      view?.view?.finalize?.()
    }
  }, [block.spec])

  if (error) {
    return (
      <div className="my-4 rounded-lg border-2 border-border bg-muted/30 p-4 min-h-[160px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">[Chart: {error}]</p>
      </div>
    )
  }

  return (
    <div className="my-4 rounded-lg border-2 border-border overflow-hidden bg-white">
      <div ref={containerRef} className="w-full min-h-[200px]" />
    </div>
  )
}
