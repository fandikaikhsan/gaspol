"use client"

/**
 * Error Pattern Analysis Component
 * Show common error patterns with actionable tips
 *
 * ADAPTIVE: Fetches error tag metadata from database
 * Tips and descriptions come from exam research (Batch 4)
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock, Zap, Target, BookOpen, TrendingUp, Calculator, FileText, Brain } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { createClient } from "@/lib/supabase/client"

interface ErrorTag {
  tag_id: string
  name: string
  count: number
  percentage: number
}

interface ErrorTagMetadata {
  description: string | null
  category: string | null
  tips: string[]
  remediation: { short?: string; detailed?: string }
}

interface ErrorPatternAnalysisProps {
  errorTags: ErrorTag[]
  examId?: string // Optional: for exam-specific metadata
}

// Category to icon mapping
const CATEGORY_ICONS: Record<string, any> = {
  time_management: Clock,
  careless: Zap,
  conceptual: Brain,
  computation: Calculator,
  comprehension: BookOpen,
  default: AlertCircle
}

// Category to color mapping
const CATEGORY_COLORS: Record<string, { color: string; bgColor: string; textColor: string }> = {
  time_management: { color: "bg-yellow-500", bgColor: "bg-yellow-50", textColor: "text-yellow-700" },
  careless: { color: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-700" },
  conceptual: { color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700" },
  computation: { color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-700" },
  comprehension: { color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700" },
  default: { color: "bg-gray-500", bgColor: "bg-gray-50", textColor: "text-gray-700" }
}

// Default tips when database doesn't have any
const DEFAULT_TIPS = [
  "Review your attempts for this error type",
  "Identify common themes in your mistakes",
  "Practice deliberately to improve"
]

export function ErrorPatternAnalysis({ errorTags, examId }: ErrorPatternAnalysisProps) {
  const [tagMetadata, setTagMetadata] = useState<Record<string, ErrorTagMetadata>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch metadata for all error tags from database
  useEffect(() => {
    async function fetchTagMetadata() {
      if (!errorTags || errorTags.length === 0) {
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const tagIds = errorTags.map(t => t.tag_id)

      const { data, error } = await supabase
        .from('tags')
        .select('id, description, category, tips, remediation')
        .in('id', tagIds)

      if (error) {
        console.error('Failed to fetch tag metadata:', error)
      } else if (data) {
        const metadata: Record<string, ErrorTagMetadata> = {}
        data.forEach(tag => {
          metadata[tag.id] = {
            description: tag.description,
            category: tag.category,
            tips: tag.tips || [],
            remediation: tag.remediation || {}
          }
        })
        setTagMetadata(metadata)
      }

      setIsLoading(false)
    }

    fetchTagMetadata()
  }, [errorTags])

  // Calculate total errors for percentage validation
  const totalErrors = errorTags.reduce((sum, tag) => sum + tag.count, 0)

  // Get info for an error tag (dynamic from database)
  const getErrorInfo = (tagId: string, tagName: string) => {
    const meta = tagMetadata[tagId]
    const category = meta?.category || 'default'
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.default
    const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default

    return {
      icon: Icon,
      ...colors,
      description: meta?.description || `${tagName} error pattern`,
      tips: meta?.tips?.length ? meta.tips : DEFAULT_TIPS
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Common Error Patterns
        </CardTitle>
        <CardDescription>
          Mistakes you make most often (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : errorTags && errorTags.length > 0 ? (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {totalErrors} total errors analyzed
                </span>
                <Badge className="bg-blue-500 text-white">
                  {errorTags.length} patterns found
                </Badge>
              </div>
            </div>

            {/* Error patterns accordion */}
            <Accordion type="single" collapsible className="w-full">
              {errorTags.map((tag, index) => {
                const info = getErrorInfo(tag.tag_id, tag.name)
                const Icon = info.icon

                return (
                  <AccordionItem key={tag.tag_id} value={tag.tag_id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 w-full pr-4">
                        {/* Icon and name */}
                        <div className={`p-2 rounded-lg ${info.bgColor}`}>
                          <Icon className={`h-5 w-5 ${info.textColor}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{tag.name}</span>
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {info.description}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="text-lg font-bold">{tag.count}</div>
                          <div className="text-xs text-muted-foreground">
                            {tag.percentage}%
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className={`p-4 rounded-lg ${info.bgColor} space-y-3`}>
                        {/* Progress indicator */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={info.textColor}>
                              Impact on your performance
                            </span>
                            <span className="font-medium">{tag.percentage}%</span>
                          </div>
                          <div className="h-2 bg-white border-2 border-charcoal rounded-full overflow-hidden">
                            <div
                              className={`h-full ${info.color}`}
                              style={{ width: `${tag.percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Actionable tips */}
                        <div>
                          <h4 className={`font-semibold text-sm ${info.textColor} mb-2`}>
                            💡 How to Improve:
                          </h4>
                          <ul className="space-y-1">
                            {info.tips.map((tip, i) => (
                              <li key={i} className="text-sm text-gray-700">
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Occurrence count */}
                        <div className="pt-2 border-t border-white">
                          <p className="text-xs text-muted-foreground">
                            Occurred <strong>{tag.count}</strong> times out of {totalErrors} errors
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>

            {/* Overall recommendations */}
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                🎯 General Strategies
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Focus on your top 1-2 error patterns first</li>
                <li>• Track your progress weekly to see improvements</li>
                <li>• Reflect on mistakes immediately after practice</li>
                <li>• Develop a pre-answer checklist (read, think, check)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium text-green-700 mb-1">Excellent work!</p>
            <p className="text-sm text-muted-foreground">
              No error patterns detected yet. Keep practicing!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
