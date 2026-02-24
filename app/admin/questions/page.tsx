"use client"

/**
 * Admin Questions Management
 * Create, edit, and manage questions with taxonomy linking
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Loader2, Search, Filter, Sparkles, Check, X } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Question {
  id: string
  question_text: string
  question_type: string
  difficulty: string
  cognitive_level: string
  time_estimate_seconds: number
  points: number
  explanation: string | null
  media_url: string | null
  is_active: boolean
  created_at: string
  taxonomy_nodes?: { id: string; name: string; code: string }[]
  options?: QuestionOption[]
}

interface QuestionOption {
  id?: string
  option_text: string
  is_correct: boolean
  position: number
}

interface TaxonomyNode {
  id: string
  name: string
  code: string
  level: number
}

const QUESTION_TYPES = [
  { value: "MCQ5", label: "Multiple Choice (5 options)" },
  { value: "MCQ4", label: "Multiple Choice (4 options)" },
  { value: "MCK", label: "Multiple Correct (select all that apply)" },
  { value: "TF", label: "True/False" },
]

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

const COGNITIVE_LEVELS = [
  { value: "L1", label: "L1 - Knowledge/Recall" },
  { value: "L2", label: "L2 - Understanding/Application" },
  { value: "L3", label: "L3 - Analysis/Reasoning" },
]

export default function AdminQuestionsPage() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [taxonomyNodes, setTaxonomyNodes] = useState<TaxonomyNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "MCQ5",
    difficulty: "medium",
    cognitive_level: "L2",
    time_estimate_seconds: 120,
    points: 1,
    explanation: "",
    media_url: "",
    taxonomy_node_ids: [] as string[],
  })

  // Options state
  const [options, setOptions] = useState<QuestionOption[]>([
    { option_text: "", is_correct: false, position: 0 },
    { option_text: "", is_correct: false, position: 1 },
    { option_text: "", is_correct: false, position: 2 },
    { option_text: "", is_correct: false, position: 3 },
    { option_text: "", is_correct: false, position: 4 },
  ])

  // AI Generation state
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const [selectedGenerated, setSelectedGenerated] = useState<Set<number>>(new Set())
  const [generationParams, setGenerationParams] = useState({
    taxonomy_node_id: "",
    count: 5,
    difficulty: "medium",
    cognitive_level: "L2",
    question_type: "MCQ5",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load questions with joins
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          *,
          question_options(id, option_text, is_correct, position)
        `)
        .order("created_at", { ascending: false })

      if (questionsError) throw questionsError

      // Load taxonomy links separately
      const questionIds = questionsData?.map((q) => q.id) || []
      let taxonomyMap: Record<string, any[]> = {}

      if (questionIds.length > 0) {
        const { data: taxonomyData } = await supabase
          .from("question_taxonomy")
          .select(`
            question_id,
            taxonomy_nodes(id, name, code)
          `)
          .in("question_id", questionIds)

        if (taxonomyData) {
          taxonomyData.forEach((item: any) => {
            if (!taxonomyMap[item.question_id]) {
              taxonomyMap[item.question_id] = []
            }
            taxonomyMap[item.question_id].push(item.taxonomy_nodes)
          })
        }
      }

      // Transform data
      const transformedQuestions = questionsData?.map((q: any) => ({
        ...q,
        taxonomy_nodes: taxonomyMap[q.id] || [],
        options: q.question_options || [],
      })) || []

      setQuestions(transformedQuestions)

      // Load taxonomy nodes for linking
      const { data: nodesData } = await supabase
        .from("taxonomy_nodes")
        .select("id, name, code, level")
        .eq("is_active", true)
        .order("level")
        .order("position")

      setTaxonomyNodes(nodesData || [])
    } catch (error) {
      console.error("Load error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load",
        description: "Could not load questions.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openAddDialog = () => {
    setDialogMode("add")
    setSelectedQuestion(null)
    setFormData({
      question_text: "",
      question_type: "MCQ5",
      difficulty: "medium",
      cognitive_level: "L2",
      time_estimate_seconds: 120,
      points: 1,
      explanation: "",
      media_url: "",
      taxonomy_node_ids: [],
    })
    setOptions([
      { option_text: "", is_correct: false, position: 0 },
      { option_text: "", is_correct: false, position: 1 },
      { option_text: "", is_correct: false, position: 2 },
      { option_text: "", is_correct: false, position: 3 },
      { option_text: "", is_correct: false, position: 4 },
    ])
    setIsDialogOpen(true)
  }

  const openEditDialog = (question: Question) => {
    setDialogMode("edit")
    setSelectedQuestion(question)
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      difficulty: question.difficulty,
      cognitive_level: question.cognitive_level,
      time_estimate_seconds: question.time_estimate_seconds,
      points: question.points,
      explanation: question.explanation || "",
      media_url: question.media_url || "",
      taxonomy_node_ids: question.taxonomy_nodes?.map((n) => n.id) || [],
    })
    setOptions(
      question.options && question.options.length > 0
        ? question.options
        : [
            { option_text: "", is_correct: false, position: 0 },
            { option_text: "", is_correct: false, position: 1 },
            { option_text: "", is_correct: false, position: 2 },
            { option_text: "", is_correct: false, position: 3 },
            { option_text: "", is_correct: false, position: 4 },
          ]
    )
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.question_text || !formData.question_type) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Question text and type are required.",
      })
      return
    }

    // Validate options for MCQ questions
    if (formData.question_type.startsWith("MCQ") || formData.question_type === "MCK") {
      const filledOptions = options.filter((opt) => opt.option_text.trim())
      const correctOptions = filledOptions.filter((opt) => opt.is_correct)

      if (filledOptions.length < 2) {
        toast({
          variant: "destructive",
          title: "Invalid Options",
          description: "Please provide at least 2 options.",
        })
        return
      }

      if (correctOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "No Correct Answer",
          description: "Please mark at least one option as correct.",
        })
        return
      }

      if (formData.question_type.startsWith("MCQ") && correctOptions.length > 1) {
        toast({
          variant: "destructive",
          title: "Multiple Correct Answers",
          description: "MCQ questions should have only one correct answer.",
        })
        return
      }
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      const questionData = {
        question_text: formData.question_text,
        question_type: formData.question_type,
        difficulty: formData.difficulty,
        cognitive_level: formData.cognitive_level,
        time_estimate_seconds: formData.time_estimate_seconds,
        points: formData.points,
        explanation: formData.explanation || null,
        media_url: formData.media_url || null,
        is_active: true,
        created_by: user?.id,
        updated_by: user?.id,
      }

      let questionId: string

      if (dialogMode === "add") {
        // Create question
        const { data, error } = await supabase
          .from("questions")
          .insert(questionData)
          .select()
          .single()

        if (error) throw error
        questionId = data.id
      } else {
        // Update question
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", selectedQuestion!.id)

        if (error) throw error
        questionId = selectedQuestion!.id

        // Delete existing options and taxonomy links
        await supabase.from("question_options").delete().eq("question_id", questionId)
        await supabase.from("question_taxonomy").delete().eq("question_id", questionId)
      }

      // Insert options
      if (formData.question_type.startsWith("MCQ") || formData.question_type === "MCK") {
        const filledOptions = options
          .filter((opt) => opt.option_text.trim())
          .map((opt, idx) => ({
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            position: idx,
          }))

        if (filledOptions.length > 0) {
          const { error: optionsError } = await supabase
            .from("question_options")
            .insert(filledOptions)

          if (optionsError) throw optionsError
        }
      }

      // Link taxonomy nodes
      if (formData.taxonomy_node_ids.length > 0) {
        const taxonomyLinks = formData.taxonomy_node_ids.map((nodeId) => ({
          question_id: questionId,
          taxonomy_node_id: nodeId,
        }))

        const { error: taxonomyError } = await supabase
          .from("question_taxonomy")
          .insert(taxonomyLinks)

        if (taxonomyError) throw taxonomyError
      }

      toast({
        title: dialogMode === "add" ? "Question Created!" : "Question Updated!",
        description: "Question saved successfully.",
      })

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (question: Question) => {
    if (!confirm(`Delete question: "${question.question_text.substring(0, 50)}..."?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", question.id)

      if (error) throw error

      toast({
        title: "Question Deleted",
        description: "Question removed successfully.",
      })

      loadData()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description: "Could not delete question.",
      })
    }
  }

  const openGenerateDialog = () => {
    setGeneratedQuestions([])
    setSelectedGenerated(new Set())
    setIsGenerateDialogOpen(true)
  }

  const generateQuestions = async () => {
    if (!generationParams.taxonomy_node_id) {
      toast({
        variant: "destructive",
        title: "No Taxonomy Selected",
        description: "Please select a taxonomy node first.",
      })
      return
    }

    setIsGenerating(true)

    try {
      const supabase = createClient()
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/admin/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(generationParams),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate questions')

      if (data.success && data.questions) {
        setGeneratedQuestions(data.questions)
        // Auto-select all generated questions
        setSelectedGenerated(new Set(data.questions.map((_: any, idx: number) => idx)))
        toast({
          title: "Questions Generated!",
          description: `${data.questions.length} questions ready for review.`,
        })
      } else {
        throw new Error("No questions generated")
      }
    } catch (error) {
      console.error("Generation error:", error)
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleGeneratedQuestion = (index: number) => {
    const newSelected = new Set(selectedGenerated)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedGenerated(newSelected)
  }

  const selectAllGenerated = () => {
    setSelectedGenerated(new Set(generatedQuestions.map((_, idx) => idx)))
  }

  const deselectAllGenerated = () => {
    setSelectedGenerated(new Set())
  }

  const importSelectedQuestions = async () => {
    if (selectedGenerated.size === 0) {
      toast({
        variant: "destructive",
        title: "No Questions Selected",
        description: "Please select at least one question to import.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Prepare questions to insert
      const questionsToInsert = Array.from(selectedGenerated).map((idx) => {
        const q = generatedQuestions[idx]
        return {
          question_text: q.question_text,
          question_type: generationParams.question_type,
          difficulty: generationParams.difficulty,
          cognitive_level: generationParams.cognitive_level,
          time_estimate_seconds: q.time_estimate_seconds || 120,
          points: q.points || 1,
          explanation: q.explanation || null,
          media_url: null,
          is_active: true,
          created_by: user?.id,
          updated_by: user?.id,
        }
      })

      // Insert questions
      const { data: insertedQuestions, error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select()

      if (questionsError) throw questionsError

      // Insert options for each question
      for (let i = 0; i < insertedQuestions.length; i++) {
        const question = insertedQuestions[i]
        const originalIdx = Array.from(selectedGenerated)[i]
        const originalQuestion = generatedQuestions[originalIdx]

        if (originalQuestion.options && originalQuestion.options.length > 0) {
          const optionsToInsert = originalQuestion.options.map((opt: any, pos: number) => ({
            question_id: question.id,
            option_text: opt.text,
            is_correct: opt.is_correct,
            position: pos,
          }))

          const { error: optionsError } = await supabase
            .from("question_options")
            .insert(optionsToInsert)

          if (optionsError) throw optionsError
        }

        // Link to taxonomy node
        if (generationParams.taxonomy_node_id) {
          const { error: taxonomyError } = await supabase
            .from("question_taxonomy")
            .insert({
              question_id: question.id,
              taxonomy_node_id: generationParams.taxonomy_node_id,
            })

          if (taxonomyError) throw taxonomyError
        }
      }

      toast({
        title: "Questions Imported!",
        description: `Successfully imported ${selectedGenerated.size} questions.`,
      })

      setIsGenerateDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Import error:", error)
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateOption = (index: number, field: keyof QuestionOption, value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([
      ...options,
      { option_text: "", is_correct: false, position: options.length },
    ])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "At least 2 options are required.",
      })
      return
    }
    setOptions(options.filter((_, i) => i !== index))
  }

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      searchQuery === "" ||
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDifficulty =
      filterDifficulty === "all" || q.difficulty === filterDifficulty

    const matchesType = filterType === "all" || q.question_type === filterType

    return matchesSearch && matchesDifficulty && matchesType
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Questions Management</h1>
          <p className="text-muted-foreground">
            Create and manage test questions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openGenerateDialog}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Question
          </Button>
        </div>
      </div>

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
              <Label>Difficulty</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          <CardDescription>
            {questions.length} total questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No questions found</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 border-2 border-charcoal rounded-lg bg-white hover:shadow-brutal transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{question.question_type}</Badge>
                        <Badge
                          className={
                            question.difficulty === "easy"
                              ? "bg-green-100 text-green-800"
                              : question.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {question.difficulty}
                        </Badge>
                        <Badge variant="outline">{question.cognitive_level}</Badge>
                        <Badge variant="outline">
                          {question.time_estimate_seconds}s
                        </Badge>
                        <Badge variant="outline">{question.points} pt</Badge>
                      </div>
                      <p className="font-medium mb-2">{question.question_text}</p>
                      {question.taxonomy_nodes && question.taxonomy_nodes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {question.taxonomy_nodes.map((node, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                              {node.code}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(question)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(question)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Create New Question" : "Edit Question"}
            </DialogTitle>
            <DialogDescription>
              Fill in the question details and options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Question Text */}
            <div className="space-y-2">
              <Label htmlFor="question_text">
                Question Text <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="question_text"
                value={formData.question_text}
                onChange={(e) =>
                  setFormData({ ...formData, question_text: e.target.value })
                }
                placeholder="Enter the question text..."
                rows={4}
              />
            </div>

            {/* Question Type and Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question_type">
                  Question Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, question_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cognitive Level and Points */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cognitive_level">Cognitive Level</Label>
                <Select
                  value={formData.cognitive_level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cognitive_level: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COGNITIVE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_estimate">Time (seconds)</Label>
                <Input
                  id="time_estimate"
                  type="number"
                  value={formData.time_estimate_seconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time_estimate_seconds: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      points: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </div>
            </div>

            {/* Options (for MCQ questions) */}
            {(formData.question_type.startsWith("MCQ") ||
              formData.question_type === "MCK") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Answer Options <span className="text-red-500">*</span>
                  </Label>
                  {options.length < 8 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(e) =>
                          updateOption(index, "is_correct", e.target.checked)
                        }
                        className="mt-3 h-4 w-4 rounded border-charcoal"
                      />
                      <Input
                        value={option.option_text}
                        onChange={(e) =>
                          updateOption(index, "option_text", e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check the box(es) to mark correct answer(s)
                </p>
              </div>
            )}

            {/* Explanation */}
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="Explain the correct answer..."
                rows={3}
              />
            </div>

            {/* Taxonomy Linking */}
            <div className="space-y-2">
              <Label>Link to Taxonomy (Optional)</Label>
              <Select
                value={formData.taxonomy_node_ids[0] || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, taxonomy_node_ids: [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select taxonomy node" />
                </SelectTrigger>
                <SelectContent>
                  {taxonomyNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {"  ".repeat(node.level - 1)} {node.name} ({node.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Create Question" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Questions with AI
            </DialogTitle>
            <DialogDescription>
              Configure parameters and let AI generate questions based on taxonomy
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {generatedQuestions.length === 0 ? (
              <>
                {/* Configuration Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Taxonomy Node <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={generationParams.taxonomy_node_id}
                      onValueChange={(value) =>
                        setGenerationParams({ ...generationParams, taxonomy_node_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select taxonomy node" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxonomyNodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {"  ".repeat(node.level - 1)} {node.name} ({node.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Questions will be generated based on this taxonomy node
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Questions</Label>
                      <Input
                        type="number"
                        value={generationParams.count}
                        onChange={(e) =>
                          setGenerationParams({
                            ...generationParams,
                            count: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                        max="20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select
                        value={generationParams.question_type}
                        onValueChange={(value) =>
                          setGenerationParams({ ...generationParams, question_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <Select
                        value={generationParams.difficulty}
                        onValueChange={(value) =>
                          setGenerationParams({ ...generationParams, difficulty: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cognitive Level</Label>
                      <Select
                        value={generationParams.cognitive_level}
                        onValueChange={(value) =>
                          setGenerationParams({ ...generationParams, cognitive_level: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COGNITIVE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-4">
                  <Button
                    onClick={generateQuestions}
                    disabled={isGenerating || !generationParams.taxonomy_node_id}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate {generationParams.count} Questions
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Generated Questions Review */}
                <div className="space-y-4">
                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      {selectedGenerated.size} of {generatedQuestions.length} questions selected
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllGenerated}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAllGenerated}>
                        Deselect All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGeneratedQuestions([])}
                      >
                        Back to Config
                      </Button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {generatedQuestions.map((question, index) => {
                      const isSelected = selectedGenerated.has(index)

                      return (
                        <div
                          key={index}
                          onClick={() => toggleGeneratedQuestion(index)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isSelected ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Q{index + 1}</Badge>
                                <Badge variant="outline">
                                  {question.time_estimate_seconds}s
                                </Badge>
                                <Badge variant="outline">{question.points} pt</Badge>
                              </div>
                              <p className="font-medium mb-2">{question.question_text}</p>
                              {question.options && question.options.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {question.options.map((opt: any, optIdx: number) => (
                                    <div
                                      key={optIdx}
                                      className={`text-sm p-2 rounded ${
                                        opt.is_correct
                                          ? "bg-green-100 text-green-800 font-medium"
                                          : "bg-gray-50 text-gray-700"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}. {opt.text}
                                      {opt.is_correct && " ✓"}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {question.explanation && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                  <span className="font-medium text-blue-900">
                                    Explanation:
                                  </span>{" "}
                                  {question.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerateDialogOpen(false)
                setGeneratedQuestions([])
                setSelectedGenerated(new Set())
              }}
            >
              Cancel
            </Button>
            {generatedQuestions.length > 0 && (
              <Button
                onClick={importSelectedQuestions}
                disabled={selectedGenerated.size === 0 || isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {selectedGenerated.size} Questions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
