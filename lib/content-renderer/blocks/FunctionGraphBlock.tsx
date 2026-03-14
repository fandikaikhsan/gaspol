"use client"

import { useMemo } from "react"
import { evaluate } from "mathjs"
import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "function_graph" }>
}

interface Domain {
  x?: [number, number]
  y?: [number, number]
}

interface Curve {
  type?: string
  expression?: string
  label?: string
}

interface Point {
  x: number
  y: number
  label?: string
}

interface Spec {
  domain?: Domain
  axes?: boolean
  grid?: boolean
  curves?: Curve[]
  points?: Point[]
}

const PADDING = 40
const WIDTH = 320
const HEIGHT = 240

function evalExpr(expr: string, x: number): number | null {
  try {
    const sanitized = expr.replace(/\^/g, "**").replace(/\\/g, "")
    const result = evaluate(sanitized, { x })
    return typeof result === "number" && isFinite(result) ? result : null
  } catch {
    return null
  }
}

export function FunctionGraphBlock({ block }: Props) {
  const spec = block.spec as Spec
  const domain = spec.domain ?? { x: [-5, 5], y: [-5, 5] }
  const xRange = domain.x ?? [-5, 5]
  const yRange = domain.y ?? [-5, 5]
  const xMin = xRange[0]
  const xMax = xRange[1]
  const yMin = yRange[0]
  const yMax = yRange[1]
  const showAxes = spec.axes !== false
  const showGrid = spec.grid !== false

  const toSvg = useMemo(() => {
    const scaleX = (x: number) =>
      PADDING + ((x - xMin) / (xMax - xMin || 1)) * (WIDTH - 2 * PADDING)
    const scaleY = (y: number) =>
      HEIGHT - PADDING - ((y - yMin) / (yMax - yMin || 1)) * (HEIGHT - 2 * PADDING)
    return { x: scaleX, y: scaleY }
  }, [xMin, xMax, yMin, yMax])

  const curvePaths = useMemo(() => {
    const paths: string[] = []
    for (const curve of spec.curves ?? []) {
      const expr = curve.expression
      if (!expr) continue
      const points: { x: number; y: number }[] = []
      const step = (xMax - xMin) / 100
      for (let x = xMin; x <= xMax; x += step) {
        const y = evalExpr(expr, x)
        if (y !== null && y >= yMin && y <= yMax) {
          points.push({ x, y })
        }
      }
      if (points.length < 2) continue
      const d = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${toSvg.x(p.x).toFixed(1)} ${toSvg.y(p.y).toFixed(1)}`)
        .join(" ")
      paths.push(d)
    }
    return paths
  }, [spec.curves, xMin, xMax, yMin, yMax, toSvg])

  const gridLines = useMemo(() => {
    if (!showGrid) return null
    const lines: React.ReactNode[] = []
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      const sx = toSvg.x(x)
      lines.push(
        <line
          key={`vg-${x}`}
          x1={sx}
          y1={PADDING}
          x2={sx}
          y2={HEIGHT - PADDING}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />,
      )
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const sy = toSvg.y(y)
      lines.push(
        <line
          key={`hg-${y}`}
          x1={PADDING}
          y1={sy}
          x2={WIDTH - PADDING}
          y2={sy}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />,
      )
    }
    return lines
  }, [showGrid, xMin, xMax, yMin, yMax, toSvg])

  const axesLines = useMemo(() => {
    if (!showAxes) return null
    const ox = toSvg.x(0)
    const oy = toSvg.y(0)
    const inY = yMin <= 0 && 0 <= yMax
    const inX = xMin <= 0 && 0 <= xMax
    return (
      <>
        {inY && (
          <line
            x1={ox}
            y1={PADDING}
            x2={ox}
            y2={HEIGHT - PADDING}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        )}
        {inX && (
          <line
            x1={PADDING}
            y1={oy}
            x2={WIDTH - PADDING}
            y2={oy}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        )}
      </>
    )
  }, [showAxes, xMin, xMax, yMin, yMax, toSvg])

  return (
    <div className="my-4 rounded-lg border-2 border-border overflow-hidden bg-white p-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-md h-auto"
        style={{ minHeight: 180 }}
      >
        {gridLines}
        {axesLines}
        {curvePaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {(spec.points ?? []).map((p, i) => (
          <g key={i}>
            <circle
              cx={toSvg.x(p.x)}
              cy={toSvg.y(p.y)}
              r={5}
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth={2}
            />
            {p.label && (
              <text
                x={toSvg.x(p.x) + 8}
                y={toSvg.y(p.y) + 4}
                fontSize={12}
                fontWeight={600}
                fill="currentColor"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
