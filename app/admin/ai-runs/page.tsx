"use client"

/**
 * Admin AI Runs Logs
 * Phase 8: Admin Console
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bot, CheckCircle, XCircle, Clock, Zap } from "lucide-react"

interface AIRun {
  id: string
  operation_type: string
  input_params: any
  output_result: any
  status: string
  tokens_used: number
  duration_ms: number
  error_message: string | null
  created_at: string
  created_by: string
}

export default function AdminAIRunsPage() {
  const { toast } = useToast()
  const [runs, setRuns] = useState<AIRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    loadAIRuns()
  }, [])

  const loadAIRuns = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ai_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      setRuns(data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load AI runs. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      generate_questions: "Generate Questions",
      auto_tag: "Auto-Tag Constructs",
      quality_control: "Quality Control",
      session_summary: "Session Summary",
    }
    return labels[type] || type
  }

  const getOperationColor = (type: string) => {
    const colors: Record<string, string> = {
      generate_questions: "bg-pastel-pink",
      auto_tag: "bg-pastel-lavender",
      quality_control: "bg-pastel-mint",
      session_summary: "bg-pastel-sky",
    }
    return colors[type] || "bg-gray-200"
  }

  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true
    if (filter === "success") return run.status === "completed"
    if (filter === "error") return run.status === "error"
    return run.operation_type === filter
  })

  const totalTokens = runs.reduce((sum, run) => sum + (run.tokens_used || 0), 0)
  const successCount = runs.filter((r) => r.status === "completed").length
  const errorCount = runs.filter((r) => r.status === "error").length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading AI runs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Operations Log</h1>
          <p className="text-muted-foreground">
            Monitor AI operations, token usage, and performance
          </p>
        </div>
        <Button variant="outline" onClick={loadAIRuns}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-pastel-sky">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              Total Runs
            </CardDescription>
            <CardTitle className="text-4xl">{runs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-mint">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Successful
            </CardDescription>
            <CardTitle className="text-4xl">{successCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-pink">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Errors
            </CardDescription>
            <CardTitle className="text-4xl">{errorCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-peach">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Total Tokens
            </CardDescription>
            <CardTitle className="text-4xl">{totalTokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === "success" ? "default" : "outline"}
              onClick={() => setFilter("success")}
              size="sm"
            >
              Successful
            </Button>
            <Button
              variant={filter === "error" ? "default" : "outline"}
              onClick={() => setFilter("error")}
              size="sm"
            >
              Errors
            </Button>
            <Button
              variant={filter === "generate_questions" ? "default" : "outline"}
              onClick={() => setFilter("generate_questions")}
              size="sm"
            >
              Generate Questions
            </Button>
            <Button
              variant={filter === "auto_tag" ? "default" : "outline"}
              onClick={() => setFilter("auto_tag")}
              size="sm"
            >
              Auto-Tag
            </Button>
            <Button
              variant={filter === "quality_control" ? "default" : "outline"}
              onClick={() => setFilter("quality_control")}
              size="sm"
            >
              QC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Runs List */}
      {filteredRuns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No AI runs found</p>
            <p className="text-sm text-muted-foreground">
              AI operations will appear here once executed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run) => (
            <Card
              key={run.id}
              className={`${getOperationColor(run.operation_type)}`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {getOperationLabel(run.operation_type)}
                      </Badge>
                      {run.status === "completed" ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {run.duration_ms}ms
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {run.tokens_used} tokens
                      </div>
                      <div>
                        {new Date(run.created_at).toLocaleString()}
                      </div>
                    </div>
                    {run.error_message && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                        {run.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About AI Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Generate Questions:</strong> AI creates new questions for a micro-skill</p>
          <p><strong>Auto-Tag:</strong> AI assigns construct weights to questions</p>
          <p><strong>Quality Control:</strong> AI reviews questions for clarity and correctness</p>
          <p><strong>Session Summary:</strong> AI summarizes student performance</p>
        </CardContent>
      </Card>
    </div>
  )
}
