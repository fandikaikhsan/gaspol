"use client"

/**
 * RadarChartFull Component
 * Phase 3: Analytics Dashboard
 *
 * 5-axis radar chart for construct profile using Recharts
 */

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ConstructProfile, getConstructRadarData } from '@/lib/analytics/construct-scoring'

interface RadarChartFullProps {
  profile: ConstructProfile
  previousProfile?: ConstructProfile
  showComparison?: boolean
}

export function RadarChartFull({
  profile,
  previousProfile,
  showComparison = false,
}: RadarChartFullProps) {
  const currentData = getConstructRadarData(profile)

  // If showing comparison, add previous data
  const data = showComparison && previousProfile
    ? currentData.map((item, idx) => ({
        ...item,
        previousScore: getConstructRadarData(previousProfile)[idx].score,
      }))
    : currentData

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="construct"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />

          {showComparison && previousProfile && (
            <Radar
              name="Before"
              dataKey="previousScore"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted))"
              fillOpacity={0.3}
            />
          )}

          <Radar
            name="Current"
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '2px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px',
            }}
          />

          {showComparison && previousProfile && (
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
