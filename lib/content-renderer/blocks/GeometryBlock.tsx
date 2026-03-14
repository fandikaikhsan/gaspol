"use client"

import { useMemo } from "react"
import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "geometry" }>
}

interface Segment {
  kind: "segment"
  id?: string
  from?: { x: number; y: number }
  to?: { x: number; y: number }
}

interface Point {
  kind: "point"
  id?: string
  at?: { x: number; y: number }
  label?: string
}

type Element = Segment | Point

const DEFAULT_SIZE = 200

function isSegment(e: Element): e is Segment {
  return e.kind === "segment"
}

function isPoint(e: Element): e is Point {
  return e.kind === "point"
}

export function GeometryBlock({ block }: Props) {
  const { elements = [], viewBox } = block.spec
  const vw = viewBox?.width ?? DEFAULT_SIZE
  const vh = viewBox?.height ?? DEFAULT_SIZE

  const bounds = useMemo(() => {
    let minX = 0
    let maxX = vw
    let minY = 0
    let maxY = vh
    for (const el of elements as Element[]) {
      if (isSegment(el) && el.from && el.to) {
        minX = Math.min(minX, el.from.x, el.to.x)
        maxX = Math.max(maxX, el.from.x, el.to.x)
        minY = Math.min(minY, el.from.y, el.to.y)
        maxY = Math.max(maxY, el.from.y, el.to.y)
      }
      if (isPoint(el) && el.at) {
        minX = Math.min(minX, el.at.x)
        maxX = Math.max(maxX, el.at.x)
        minY = Math.min(minY, el.at.y)
        maxY = Math.max(maxY, el.at.y)
      }
    }
    const pad = 20
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scale = Math.min((vw - pad) / rangeX, (vh - pad) / rangeY, 1.5)
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    return { minX, maxX, minY, maxY, scale, cx, cy }
  }, [elements, vw, vh])

  const toSvg = useMemo(() => {
    const { scale, cx, cy } = bounds
    const tx = vw / 2 - cx * scale
    const ty = vh / 2 - cy * scale
    return (x: number, y: number) => ({
      x: x * scale + tx,
      y: y * scale + ty,
    })
  }, [bounds, vw, vh])

  return (
    <div className="my-4 rounded-lg border-2 border-border overflow-hidden bg-white p-2">
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        className="w-full max-w-md h-auto"
        style={{ minHeight: 160 }}
      >
        {(elements as Element[]).map((el, i) => {
          if (isSegment(el) && el.from && el.to) {
            const f = toSvg(el.from.x, el.from.y)
            const t = toSvg(el.to.x, el.to.y)
            return (
              <line
                key={el.id ?? i}
                x1={f.x}
                y1={f.y}
                x2={t.x}
                y2={t.y}
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            )
          }
          if (isPoint(el) && el.at) {
            const p = toSvg(el.at.x, el.at.y)
            return (
              <g key={el.id ?? i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="currentColor"
                  stroke="white"
                  strokeWidth={1.5}
                />
                {el.label && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="currentColor"
                  >
                    {el.label}
                  </text>
                )}
              </g>
            )
          }
          return null
        })}
      </svg>
    </div>
  )
}
