"use client"

/**
 * Construct Radar Chart Component
 *
 * ADAPTIVE: Supports dynamic number of constructs
 * Renders n-sided polygon based on exam-specific constructs
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface ConstructRadarChartProps {
  constructs: Record<string, number> // Dynamic constructs from snapshot
  examId?: string // Optional: for fetching exam-specific construct info
}

// Default construct info (fallback)
const DEFAULT_CONSTRUCT_INFO: Record<string, {
  name: string
  fullName: string
  icon: string
  color: string
}> = {
  "C.ATTENTION": {
    name: "Attention",
    fullName: "Attention & Accuracy",
    icon: "🎯",
    color: "#10b981" // green
  },
  "C.SPEED": {
    name: "Speed",
    fullName: "Speed & Efficiency",
    icon: "⚡",
    color: "#3b82f6" // blue
  },
  "C.REASONING": {
    name: "Reasoning",
    fullName: "Logical Reasoning",
    icon: "🧠",
    color: "#8b5cf6" // purple
  },
  "C.COMPUTATION": {
    name: "Computation",
    fullName: "Computation & Calculation",
    icon: "🔢",
    color: "#f59e0b" // yellow
  },
  "C.READING": {
    name: "Reading",
    fullName: "Reading Comprehension",
    icon: "📖",
    color: "#ef4444" // red
  }
}

// Color palette for dynamic constructs
const COLOR_PALETTE = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"
]

export function ConstructRadarChart({ constructs, examId }: ConstructRadarChartProps) {
  const [constructInfo, setConstructInfo] = useState<Record<string, {
    name: string
    fullName: string
    icon: string
    color: string
  }>>(DEFAULT_CONSTRUCT_INFO)

  // Fetch exam-specific construct info
  useEffect(() => {
    async function fetchConstructInfo() {
      if (!examId) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('exam_constructs')
        .select('code, name, short_name, icon')
        .eq('exam_id', examId)
        .eq('is_active', true)
        .order('display_order')

      if (!error && data && data.length > 0) {
        const info: Record<string, any> = {}
        data.forEach((c, i) => {
          info[c.code] = {
            name: c.short_name || c.name,
            fullName: c.name,
            icon: c.icon || '📊',
            color: COLOR_PALETTE[i % COLOR_PALETTE.length]
          }
        })
        setConstructInfo({ ...DEFAULT_CONSTRUCT_INFO, ...info })
      }
    }

    fetchConstructInfo()
  }, [examId])

  const size = 300
  const center = size / 2
  const maxRadius = size / 2 - 40
  const levels = 5 // 0, 20, 40, 60, 80, 100

  // Dynamic vertices based on number of constructs
  const constructKeys = Object.keys(constructs).filter(k => constructs[k] !== undefined)
  const numConstructs = constructKeys.length || 5
  const angleStep = (2 * Math.PI) / numConstructs
  const startAngle = -Math.PI / 2 // Start at top

  // Calculate point on pentagon for a given construct index and value (0-100)
  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    const radius = (value / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    }
  }

  // Get vertex point (at 100%) for labels
  const getVertexPoint = (index: number) => {
    const angle = startAngle + index * angleStep
    const labelRadius = maxRadius + 30
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle)
    }
  }

  // Generate polygon path for data
  const dataPoints = constructKeys.map((key, index) =>
    getPoint(index, constructs[key])
  )
  const dataPath = dataPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ') + ' Z'

  // Generate grid levels (concentric pentagons)
  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const levelValue = ((i + 1) / levels) * 100
    const points = constructKeys.map((_, index) => getPoint(index, levelValue))
    const path = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
    ).join(' ') + ' Z'
    return { value: levelValue, path }
  })

  // Generate axis lines from center to each vertex
  const axisLines = constructKeys.map((_, index) => {
    const end = getPoint(index, 100)
    return { x1: center, y1: center, x2: end.x, y2: end.y }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Cognitive Constructs
        </CardTitle>
        <CardDescription>
          Your performance across {constructKeys.length} cognitive skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* SVG Radar Chart */}
          <svg width={size} height={size} className="overflow-visible">
            {/* Grid levels (concentric pentagons) */}
            {gridLevels.map((level, i) => (
              <path
                key={i}
                d={level.path}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity={0.3}
              />
            ))}

            {/* Axis lines */}
            {axisLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity={0.3}
              />
            ))}

            {/* Data polygon (filled) */}
            <path
              d={dataPath}
              fill="#3b82f6"
              fillOpacity={0.2}
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Data points (circles) */}
            {dataPoints.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
              />
            ))}

            {/* Labels at vertices */}
            {constructKeys.map((key, index) => {
              const vertex = getVertexPoint(index)
              const info = constructInfo[key] || DEFAULT_CONSTRUCT_INFO[key] || { name: key, fullName: key, icon: "📊", color: COLOR_PALETTE[0] }
              const score = Math.round(constructs[key])

              return (
                <g key={index}>
                  {/* Icon */}
                  <text
                    x={vertex.x}
                    y={vertex.y - 15}
                    textAnchor="middle"
                    fontSize="20"
                  >
                    {info.icon}
                  </text>
                  {/* Name */}
                  <text
                    x={vertex.x}
                    y={vertex.y + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#374151"
                  >
                    {info.name}
                  </text>
                  {/* Score */}
                  <text
                    x={vertex.x}
                    y={vertex.y + 20}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill={info.color}
                  >
                    {score}
                  </text>
                </g>
              )
            })}

            {/* Center point */}
            <circle
              cx={center}
              cy={center}
              r="3"
              fill="#9ca3af"
            />
          </svg>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
            {constructKeys.map((key) => {
              const info = constructInfo[key] || DEFAULT_CONSTRUCT_INFO[key] || { name: key, fullName: key, icon: "📊", color: COLOR_PALETTE[0] }
              const score = Math.round(constructs[key])
              const status = score >= 70 ? "Strong" : score >= 50 ? "Good" : "Needs Work"
              const statusColor = score >= 70 ? "bg-green-100 text-green-800" : score >= 50 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{info.name}</div>
                      <Badge className={`${statusColor} text-xs`}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-lg font-bold" style={{ color: info.color }}>
                    {score}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
