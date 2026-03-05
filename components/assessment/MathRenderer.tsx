/**
 * MathRenderer Component
 * T-036: KaTeX math rendering — inline + block math
 *
 * Parses text for LaTeX delimiters and renders math:
 * - Inline: $...$  or \(...\)
 * - Block: $$...$$ or \[...\]
 */

"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface MathRendererProps {
  text: string
  className?: string
}

/**
 * Split text into segments of plain text and math expressions.
 * Supports $...$, $$...$$, \(...\), and \[...\]
 */
function parseMath(
  input: string,
): Array<{ type: "text" | "inline" | "block"; content: string }> {
  const segments: Array<{
    type: "text" | "inline" | "block"
    content: string
  }> = []
  // Regex: block first ($$...$$, \[...\]), then inline ($...$, \(...\))
  const regex =
    /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$((?:[^$\\]|\\.)*?)\$|\\\(((?:[^\\]|\\.)*?)\\\)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: input.slice(lastIndex, match.index),
      })
    }

    if (match[1] !== undefined) {
      segments.push({ type: "block", content: match[1] })
    } else if (match[2] !== undefined) {
      segments.push({ type: "block", content: match[2] })
    } else if (match[3] !== undefined) {
      segments.push({ type: "inline", content: match[3] })
    } else if (match[4] !== undefined) {
      segments.push({ type: "inline", content: match[4] })
    }

    lastIndex = match.index + match[0].length
  }

  // Trailing text
  if (lastIndex < input.length) {
    segments.push({ type: "text", content: input.slice(lastIndex) })
  }

  return segments
}

export function MathRenderer({ text, className = "" }: MathRendererProps) {
  const rendered = useMemo(() => {
    const segments = parseMath(text)
    return segments.map((seg, i) => {
      if (seg.type === "text") {
        return <span key={i}>{seg.content}</span>
      }
      try {
        const html = katex.renderToString(seg.content, {
          displayMode: seg.type === "block",
          throwOnError: false,
          strict: false,
        })
        if (seg.type === "block") {
          return (
            <div
              key={i}
              className="my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
      } catch {
        // Fallback: render raw
        return (
          <span key={i} className="text-destructive">
            {seg.content}
          </span>
        )
      }
    })
  }, [text])

  return <span className={className}>{rendered}</span>
}
