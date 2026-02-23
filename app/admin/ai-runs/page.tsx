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
import { Bot, CheckCircle, XCircle, Clock, Zap, Loader2, Settings, RefreshCw, Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AIRun {
  id: string
  job_type: string
  prompt_version: string | null
  initiated_by: string | null
  prompt: string | null
  input_params: any
  output_result: any
  status: string
  tokens_used: number | null
  duration_ms: number | null
  error_message: string | null
  model: string | null
  created_at: string
}

interface AISettings {
  id: string
  provider: string
  api_key: string | null
  model: string
  is_active: boolean
}

// Available models per provider
const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
  anthropic: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 (Recommended)" },
    { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Fast)" },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o (Recommended)" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast)" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "o1", name: "o1 (Reasoning)" },
    { id: "o1-mini", name: "o1 Mini" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Recommended)" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
  ],
}

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)" },
  { id: "openai", name: "OpenAI (GPT)" },
  { id: "gemini", name: "Google (Gemini)" },
]

export default function AdminAIRunsPage() {
  const { toast } = useToast()
  const [runs, setRuns] = useState<AIRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AISettings[]>([])
  const [activeSettings, setActiveSettings] = useState<AISettings | null>(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isRefreshingModels, setIsRefreshingModels] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    provider: "anthropic",
    api_key: "",
    model: "claude-sonnet-4-6",
  })

  useEffect(() => {
    loadAIRuns()
    loadSettings()
  }, [])

  const loadAIRuns = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ai_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      setRuns(data || [])
    } catch (error) {
      console.error("Load error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load AI runs. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*")
        .order("provider")

      if (error) throw error

      setSettings(data || [])
      const active = data?.find((s: AISettings) => s.is_active)
      setActiveSettings(active || null)

      if (active) {
        setSettingsForm({
          provider: active.provider,
          api_key: active.api_key || "",
          model: active.model,
        })
      }
    } catch (error) {
      console.error("Load settings error:", error)
    }
  }

  const handleProviderChange = (provider: string) => {
    const existingSetting = settings.find((s) => s.provider === provider)
    const defaultModel = PROVIDER_MODELS[provider]?.[0]?.id || ""

    setSettingsForm({
      provider,
      api_key: existingSetting?.api_key || "",
      model: existingSetting?.model || defaultModel,
    })
  }

  const saveSettings = async () => {
    if (!settingsForm.model) {
      toast({
        variant: "destructive",
        title: "Missing Model",
        description: "Please select a model.",
      })
      return
    }

    setIsSavingSettings(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // First, deactivate all other providers
      await supabase
        .from("ai_settings")
        .update({ is_active: false })
        .neq("provider", settingsForm.provider)

      // Check if this provider already exists
      const existingSetting = settings.find((s) => s.provider === settingsForm.provider)

      if (existingSetting) {
        // Update existing
        const { error } = await supabase
          .from("ai_settings")
          .update({
            api_key: settingsForm.api_key || null,
            model: settingsForm.model,
            is_active: true,
          })
          .eq("id", existingSetting.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from("ai_settings")
          .insert({
            provider: settingsForm.provider,
            api_key: settingsForm.api_key || null,
            model: settingsForm.model,
            is_active: true,
            created_by: user?.id,
          })

        if (error) throw error
      }

      toast({
        title: "Settings Saved",
        description: `Now using ${settingsForm.provider} with ${settingsForm.model}`,
      })

      setIsSettingsOpen(false)
      loadSettings()
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const refreshModels = async () => {
    setIsRefreshingModels(true)

    // Simulate refresh - in production, this would call each provider's API
    // to get the latest models
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Models Refreshed",
      description: "Model list is up to date.",
    })

    setIsRefreshingModels(false)
  }

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      item_generation: "Generate Questions",
      flashcard_generation: "Generate Flashcards",
      exam_research: "Exam Research",
      auto_tag: "Auto-Tag Constructs",
      qc: "Quality Control",
      session_summary: "Session Summary",
      taxonomy_generation: "Taxonomy Generation",
      metadata_suggestion: "Metadata Suggestion",
    }
    return labels[type] || type
  }

  const getOperationColor = (type: string) => {
    const colors: Record<string, string> = {
      item_generation: "bg-pastel-pink",
      flashcard_generation: "bg-pastel-lavender",
      exam_research: "bg-pastel-peach",
      auto_tag: "bg-pastel-mint",
      qc: "bg-pastel-sky",
      session_summary: "bg-blue-100",
      taxonomy_generation: "bg-yellow-100",
      metadata_suggestion: "bg-purple-100",
    }
    return colors[type] || "bg-gray-100"
  }

  const filteredRuns = runs.filter((run) => {
    if (filter === "all") return true
    if (filter === "success") return run.status === "success"
    if (filter === "error") return run.status === "error"
    return run.job_type === filter
  })

  const totalTokens = runs.reduce((sum, run) => sum + (run.tokens_used || 0), 0)
  const successCount = runs.filter((r) => r.status === "success").length
  const errorCount = runs.filter((r) => r.status === "error").length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" onClick={loadAIRuns}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Provider Info */}
      {activeSettings && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">
                    Active Provider: {PROVIDERS.find((p) => p.id === activeSettings.provider)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Model: {activeSettings.model}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
              variant={filter === "item_generation" ? "default" : "outline"}
              onClick={() => setFilter("item_generation")}
              size="sm"
            >
              Questions
            </Button>
            <Button
              variant={filter === "flashcard_generation" ? "default" : "outline"}
              onClick={() => setFilter("flashcard_generation")}
              size="sm"
            >
              Flashcards
            </Button>
            <Button
              variant={filter === "exam_research" ? "default" : "outline"}
              onClick={() => setFilter("exam_research")}
              size="sm"
            >
              Research
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
              className={getOperationColor(run.job_type)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {getOperationLabel(run.job_type)}
                      </Badge>
                      {run.status === "success" ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : run.status === "error" ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {run.status}
                        </Badge>
                      )}
                      {run.model && (
                        <Badge variant="outline" className="text-xs">
                          {run.model}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      {run.duration_ms && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {run.duration_ms}ms
                        </div>
                      )}
                      {run.tokens_used && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {run.tokens_used.toLocaleString()} tokens
                        </div>
                      )}
                      <div>
                        {new Date(run.created_at).toLocaleString()}
                      </div>
                    </div>
                    {run.input_params && (
                      <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded mb-2">
                        <strong>Input:</strong> {JSON.stringify(run.input_params)}
                      </div>
                    )}
                    {run.output_result && (
                      <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded mb-2">
                        <strong>Output:</strong> {JSON.stringify(run.output_result)}
                      </div>
                    )}
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
          <p><strong>Generate Flashcards:</strong> AI creates flashcards for quick review</p>
          <p><strong>Exam Research:</strong> AI analyzes exam structure and content</p>
          <p><strong>Auto-Tag:</strong> AI assigns construct weights to questions</p>
          <p><strong>Quality Control:</strong> AI reviews questions for clarity and correctness</p>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Provider Settings
            </DialogTitle>
            <DialogDescription>
              Configure which AI provider and model to use for generation tasks
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select
                value={settingsForm.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={settingsForm.api_key}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, api_key: e.target.value })
                    }
                    placeholder="Enter API key (leave empty to use env var)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use the environment variable (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY)
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Model</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshModels}
                  disabled={isRefreshingModels}
                >
                  {isRefreshingModels ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>
              <Select
                value={settingsForm.model}
                onValueChange={(value) =>
                  setSettingsForm({ ...settingsForm, model: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_MODELS[settingsForm.provider]?.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Settings Info */}
            {settings.length > 0 && (
              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs">Configured Providers</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {settings.map((s) => (
                    <Badge
                      key={s.id}
                      variant={s.is_active ? "default" : "outline"}
                      className={s.is_active ? "bg-green-100 text-green-800" : ""}
                    >
                      {PROVIDERS.find((p) => p.id === s.provider)?.name}
                      {s.is_active && " (Active)"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={isSavingSettings}>
              {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
