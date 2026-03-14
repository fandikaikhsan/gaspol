"use client"

import { useMemo } from "react"
import type { ContentBlock } from "../types"

interface Props {
  block: Extract<ContentBlock, { type: "venn" }>
}

interface SetSpec {
  id?: string
  label?: string
  cx?: number
  cy?: number
  r?: number
}

interface RegionSpec {
  id?: string
  label?: string
  setIds?: string[]
  cx?: number
  cy?: number
}

const COLORS = [
  "rgba(59, 130, 246, 0.5)",
  "rgba(34, 197, 94, 0.5)",
  "rgba(234, 179, 8, 0.5)",
]
const STROKES = ["rgb(59, 130, 246)", "rgb(34, 197, 94)", "rgb(234, 179, 8)"]
const SIZE = 200

export function VennBlock({ block }: Props) {
  const { sets = [], regions = [] } = block.spec
  const setArr = Array.isArray(sets) ? sets : []
  const regionArr = Array.isArray(regions) ? regions : []

  const circleSpecs = useMemo((): { cx: number; cy: number; r: number; label?: string; color: string }[] => {
    if (setArr.length > 0) {
      return setArr.slice(0, 3).map((s: SetSpec, i) => ({
        cx: s.cx ?? SIZE / 2 + (i === 0 ? -35 : i === 1 ? 35 : 0),
        cy: s.cy ?? SIZE / 2 + (i === 0 ? -20 : i === 1 ? -20 : 45),
        r: s.r ?? 55,
        label: s.label,
        color: COLORS[i % COLORS.length],
      }))
    }
    const n = Math.min(3, Math.max(2, regionArr.length > 4 ? 3 : 2))
    const specs: { cx: number; cy: number; r: number; color: string }[] = []
    if (n === 2) {
      specs.push({ cx: SIZE / 2 - 30, cy: SIZE / 2, r: 60, color: COLORS[0] })
      specs.push({ cx: SIZE / 2 + 30, cy: SIZE / 2, r: 60, color: COLORS[1] })
    } else {
      specs.push({ cx: SIZE / 2 - 35, cy: SIZE / 2 - 25, r: 55, color: COLORS[0] })
      specs.push({ cx: SIZE / 2 + 35, cy: SIZE / 2 - 25, r: 55, color: COLORS[1] })
      specs.push({ cx: SIZE / 2, cy: SIZE / 2 + 45, r: 55, color: COLORS[2] })
    }
    return specs
  }, [setArr, regionArr])

  const regionLabels = useMemo(() => {
    return regionArr.slice(0, 7).map((r: RegionSpec, i: number) => {
      const cx = r.cx ?? (i < 3 ? circleSpecs[i]?.cx : SIZE / 2) ?? SIZE / 2
      const cy = r.cy ?? (i < 3 ? circleSpecs[i]?.cy : SIZE / 2) ?? SIZE / 2
      return { cx, cy, label: r.label }
    })
  }, [regionArr, circleSpecs])

  return (
    <div className="my-4 rounded-lg border-2 border-border overflow-hidden bg-white p-4">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-sm h-auto mx-auto"
        style={{ minHeight: 180 }}
      >
        {circleSpecs.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.cx}
              cy={c.cy}
              r={c.r}
              fill={c.color}
              stroke={STROKES[i % STROKES.length]}
              strokeWidth={2}
            />
            {c.label && (
              <text
                x={c.cx}
                y={c.cy - c.r - 8}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="currentColor"
              >
                {c.label}
              </text>
            )}
          </g>
        ))}
        {regionLabels.map((r, i) =>
          r.label ? (
            <text
              key={i}
              x={r.cx}
              y={r.cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.9}
            >
              {r.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  )
}
