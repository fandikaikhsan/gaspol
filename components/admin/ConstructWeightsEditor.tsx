"use client"

/**
 * Construct Weights Editor Component
 * AI-powered metadata editor with visual validation
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Loader2, Check, AlertCircle, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"

interface ConstructWeights {
  "C.ATTENTION": number
  "C.SPEED": number
  "C.REASONING": number
  "C.COMPUTATION": number
  "C.READING": number
}

interface ConstructWeightsEditorProps {
  questionId: string
  currentWeights?: ConstructWeights
  difficulty?: string
  cognitiveLevel?: string
  onSave: (weights: ConstructWeights) => void
  disabled?: boolean
}

const CONSTRUCT_INFO = {
  "C.ATTENTION": {
    name: "Attention & Accuracy",
    icon: "🎯",
    color: "bg-green-500",
    description: "Focus, detail orientation, avoiding careless errors"
  },
  "C.SPEED": {
    name: "Speed & Efficiency",
    icon: "⚡",
    color: "bg-blue-500",
    description: "Working under time pressure, rapid processing"
  },
  "C.REASONING": {
    name: "Logical Reasoning",
    icon: "🧠",
    color: "bg-purple-500",
    description: "Problem-solving, critical thinking, analysis"
  },
  "C.COMPUTATION": {
    name: "Computation & Calculation",
    icon: "🔢",
    color: "bg-yellow-500",
    description: "Mathematical operations, numerical work"
  },
  "C.READING": {
    name: "Reading Comprehension",
    icon: "📖",
    color: "bg-red-500",
    description: "Text understanding, information extraction"
  }
}

const DEFAULT_WEIGHTS: ConstructWeights = {
  "C.ATTENTION": 0.20,
  "C.SPEED": 0.20,
  "C.REASONING": 0.20,
  "C.COMPUTATION": 0.20,
  "C.READING": 0.20
}

export function ConstructWeightsEditor({
  questionId,
  currentWeights,
  difficulty,
  cognitiveLevel,
  onSave,
  disabled = false
}: ConstructWeightsEditorProps) {
  const { toast } = useToast()
  const [weights, setWeights] = useState<ConstructWeights>(
    currentWeights || DEFAULT_WEIGHTS
  )
  const [suggestions, setSuggestions] = useState<any>(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Calculate total (should be 1.0)
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0)
  const isValid = Math.abs(total - 1.0) < 0.01

  // Get AI suggestions
  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase.functions.invoke("suggest_metadata", {
        body: {
          question_id: questionId,
          use_ai: true
        }
      })

      if (error) throw error

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        setShowSuggestions(true)

        toast({
          title: "AI Suggestions Ready!",
          description: `Confidence: ${Math.round(data.suggestions.confidence * 100)}%`
        })
      }
    } catch (error) {
      console.error("Failed to load suggestions:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load Suggestions",
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Apply suggestions
  const applySuggestions = () => {
    if (suggestions?.construct_weights) {
      setWeights(suggestions.construct_weights)
      setShowSuggestions(false)
      toast({
        title: "Suggestions Applied",
        description: "Review and save when ready"
      })
    }
  }

  // Update individual weight
  const updateWeight = (key: keyof ConstructWeights, value: number) => {
    setWeights({
      ...weights,
      [key]: Math.max(0, Math.min(1, value))
    })
  }

  // Normalize weights to sum to 1.0
  const normalizeWeights = () => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    if (sum === 0) return

    const normalized = Object.entries(weights).reduce((acc, [key, val]) => ({
      ...acc,
      [key]: parseFloat((val / sum).toFixed(2))
    }), {} as ConstructWeights)

    setWeights(normalized)
    toast({
      title: "Weights Normalized",
      description: "Adjusted to sum to 100%"
    })
  }

  // Save weights
  const handleSave = () => {
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Weights",
        description: "Weights must sum to 100% (1.0)"
      })
      return
    }

    onSave(weights)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Construct Weights</h3>
          <p className="text-xs text-muted-foreground">
            Cognitive skill distribution for this question
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSuggestions}
          disabled={isLoadingSuggestions || disabled}
        >
          {isLoadingSuggestions ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-3 w-3" />
              Get AI Suggestions
            </>
          )}
        </Button>
      </div>

      {/* Validation Status */}
      <div className={`p-3 rounded-lg border-2 ${
        isValid
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              isValid ? "text-green-900" : "text-red-900"
            }`}>
              Total: {(total * 100).toFixed(1)}%
            </span>
          </div>
          {!isValid && (
            <Button
              variant="outline"
              size="sm"
              onClick={normalizeWeights}
              disabled={disabled}
            >
              Normalize
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && suggestions && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              AI Suggestions
            </CardTitle>
            <CardDescription className="text-xs">
              {suggestions.reasoning}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              {Object.entries(suggestions.construct_weights).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {CONSTRUCT_INFO[key as keyof ConstructWeights].icon} {CONSTRUCT_INFO[key as keyof ConstructWeights].name}
                  </span>
                  <Badge variant="outline">{(value * 100).toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                Confidence: {Math.round(suggestions.confidence * 100)}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                Source: {suggestions.source}
              </Badge>
            </div>
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={applySuggestions}
              disabled={disabled}
            >
              Apply Suggestions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Weight Sliders */}
      <div className="space-y-3">
        {Object.entries(CONSTRUCT_INFO).map(([key, info]) => {
          const weight = weights[key as keyof ConstructWeights]
          const percentage = weight * 100
          const suggestionWeight = suggestions?.construct_weights?.[key]
          const suggestionPercentage = suggestionWeight ? suggestionWeight * 100 : null

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <span className="text-base">{info.icon}</span>
                  {info.name}
                </Label>
                <div className="flex items-center gap-2">
                  {suggestionPercentage !== null && showSuggestions && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      AI: {suggestionPercentage.toFixed(0)}%
                    </Badge>
                  )}
                  <Input
                    type="number"
                    value={percentage.toFixed(0)}
                    onChange={(e) => updateWeight(
                      key as keyof ConstructWeights,
                      parseFloat(e.target.value) / 100 || 0
                    )}
                    className="w-16 h-7 text-xs text-right"
                    min="0"
                    max="100"
                    step="1"
                    disabled={disabled}
                  />
                  <span className="text-xs text-muted-foreground w-4">%</span>
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={percentage}
                  className="h-2"
                />
                {/* Suggestion marker */}
                {suggestionPercentage !== null && showSuggestions && (
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-blue-600"
                    style={{ left: `${suggestionPercentage}%` }}
                    title={`AI suggests ${suggestionPercentage.toFixed(0)}%`}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      <Button
        className="w-full"
        onClick={handleSave}
        disabled={!isValid || disabled}
      >
        Save Construct Weights
      </Button>
    </div>
  )
}
