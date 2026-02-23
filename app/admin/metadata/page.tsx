"use client"

/**
 * Admin Metadata Management
 * Research-driven metadata management with AI assistance
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  Search,
  Filter,
  Download,
  Upload,
  TrendingUp
} from "lucide-react"
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
import { ConstructWeightsEditor } from "@/components/admin/ConstructWeightsEditor"
import { Progress } from "@/components/ui/progress"

interface QuestionMetadata {
  id: string
  question_text: string
  question_type: string
  difficulty: string
  cognitive_level: string
  time_estimate_seconds: number
  construct_weights: any
  has_construct_weights: boolean
  has_time_estimate: boolean
  has_cognitive_level: boolean
  has_difficulty: boolean
  completeness_status: "complete" | "partial" | "missing"
  research_available: boolean
  is_active: boolean
}

export default function AdminMetadataPage() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<QuestionMetadata[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCompleteness, setFilterCompleteness] = useState<string>("all")
  const [filterResearch, setFilterResearch] = useState<string>("all")

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionMetadata | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Bulk operations
  const [isBulkApplying, setIsBulkApplying] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load metadata completeness view
      const { data: questionsData, error: questionsError } = await supabase
        .from("question_metadata_completeness")
        .select("*")
        .order("created_at", { ascending: false })

      if (questionsError) throw questionsError

      setQuestions(questionsData || [])

      // Load statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc("get_metadata_completeness_stats")

      if (!statsError && statsData && statsData.length > 0) {
        setStats(statsData[0])
      }
    } catch (error) {
      console.error("Load error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load",
        description: "Could not load metadata status."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (question: QuestionMetadata) => {
    setSelectedQuestion(question)
    setIsEditDialogOpen(true)
  }

  const handleSaveWeights = async (weights: any) => {
    if (!selectedQuestion) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("questions")
        .update({
          construct_weights: weights,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedQuestion.id)

      if (error) throw error

      toast({
        title: "Weights Saved!",
        description: "Construct weights updated successfully."
      })

      setIsEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "Please try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  const bulkApplyResearchDefaults = async () => {
    if (!confirm(
      "Apply research-based defaults to all questions without metadata?\n\n" +
      "This will update questions that have linked taxonomy nodes with research data. " +
      "Existing metadata will NOT be overwritten."
    )) {
      return
    }

    setIsBulkApplying(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.rpc("bulk_apply_research_defaults", {
        p_exam_id: null, // Apply to all exams
        p_overwrite_existing: false
      })

      if (error) throw error

      const { updated_count, skipped_count, error_count } = data

      toast({
        title: "Bulk Update Complete!",
        description: `Updated: ${updated_count} | Skipped: ${skipped_count} | Errors: ${error_count}`
      })

      loadData()
    } catch (error) {
      console.error("Bulk apply error:", error)
      toast({
        variant: "destructive",
        title: "Bulk Update Failed",
        description: error instanceof Error ? error.message : "Please try again."
      })
    } finally {
      setIsBulkApplying(false)
    }
  }

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedQuestions(newSelected)
  }

  const selectAll = () => {
    setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)))
  }

  const deselectAll = () => {
    setSelectedQuestions(new Set())
  }

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      searchQuery === "" ||
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCompleteness =
      filterCompleteness === "all" || q.completeness_status === filterCompleteness

    const matchesResearch =
      filterResearch === "all" ||
      (filterResearch === "available" && q.research_available) ||
      (filterResearch === "missing" && !q.research_available)

    return matchesSearch && matchesCompleteness && matchesResearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metadata Management</h1>
          <p className="text-muted-foreground">
            Research-driven metadata with AI assistance
          </p>
        </div>
        <Button
          onClick={bulkApplyResearchDefaults}
          disabled={isBulkApplying}
        >
          {isBulkApplying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Bulk Apply Research Defaults
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_questions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Complete Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.complete_metadata}
              </div>
              <Progress
                value={stats.completion_percentage}
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completion_percentage}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Partial Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.partial_metadata}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Research Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.research_available}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Completeness</Label>
              <Select value={filterCompleteness} onValueChange={setFilterCompleteness}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Research Data</Label>
              <Select value={filterResearch} onValueChange={setFilterResearch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="available">Research Available</SelectItem>
                  <SelectItem value="missing">No Research</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Controls */}
      {selectedQuestions.size > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">
                {selectedQuestions.size} questions selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
                <Button variant="outline" size="sm">
                  <Sparkles className="mr-2 h-3 w-3" />
                  Bulk Generate Metadata
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
              <CardDescription>
                Click on a question to manage its metadata
              </CardDescription>
            </div>
            {filteredQuestions.length > 0 && (
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => {
                const isSelected = selectedQuestions.has(question.id)

                return (
                  <div
                    key={question.id}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-charcoal bg-white hover:shadow-brutal"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestionSelection(question.id)}
                        className="mt-1 h-4 w-4 rounded border-charcoal"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Completeness Badge */}
                          <Badge
                            className={
                              question.completeness_status === "complete"
                                ? "bg-green-100 text-green-800"
                                : question.completeness_status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {question.completeness_status === "complete" && <Check className="mr-1 h-3 w-3" />}
                            {question.completeness_status === "missing" && <AlertCircle className="mr-1 h-3 w-3" />}
                            {question.completeness_status}
                          </Badge>

                          {/* Research Available Badge */}
                          {question.research_available && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              Research Available
                            </Badge>
                          )}

                          <Badge variant="outline">{question.question_type}</Badge>
                          <Badge variant="outline">{question.difficulty || "?"}</Badge>
                          <Badge variant="outline">{question.cognitive_level || "?"}</Badge>
                        </div>

                        <p className="font-medium mb-2">
                          {question.question_text.substring(0, 100)}
                          {question.question_text.length > 100 && "..."}
                        </p>

                        {/* Metadata Status */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={question.has_construct_weights ? "text-green-600" : "text-red-600"}>
                            {question.has_construct_weights ? "✓" : "✗"} Construct Weights
                          </span>
                          <span className={question.has_time_estimate ? "text-green-600" : "text-red-600"}>
                            {question.has_time_estimate ? "✓" : "✗"} Time Estimate
                          </span>
                          <span className={question.has_cognitive_level ? "text-green-600" : "text-red-600"}>
                            {question.has_cognitive_level ? "✓" : "✗"} Cognitive Level
                          </span>
                          <span className={question.has_difficulty ? "text-green-600" : "text-red-600"}>
                            {question.has_difficulty ? "✓" : "✗"} Difficulty
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(question)}
                      >
                        <Sparkles className="mr-2 h-3 w-3" />
                        Manage Metadata
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Metadata Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Construct Weights</DialogTitle>
            <DialogDescription>
              {selectedQuestion?.question_text.substring(0, 100)}
              {selectedQuestion && selectedQuestion.question_text.length > 100 && "..."}
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <ConstructWeightsEditor
              questionId={selectedQuestion.id}
              currentWeights={selectedQuestion.construct_weights}
              difficulty={selectedQuestion.difficulty}
              cognitiveLevel={selectedQuestion.cognitive_level}
              onSave={handleSaveWeights}
              disabled={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
