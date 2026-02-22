"use client"

/**
 * Admin Modules Management with Composer
 * Create, edit, and compose practice modules
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Clock,
  FileText,
  Edit,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Search,
  X,
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Module {
  id: string
  name: string
  description: string | null
  module_type: string
  time_limit_min: number | null
  is_published: boolean
  created_at: string
  questions?: ModuleQuestion[]
}

interface ModuleQuestion {
  id: string
  question_id: string
  order_index: number
  question: {
    id: string
    question_text: string
    question_type: string
    difficulty: string
    time_estimate_seconds: number
  }
}

interface Question {
  id: string
  question_text: string
  question_type: string
  difficulty: string
  time_estimate_seconds: number
  cognitive_level: string
}

const MODULE_TYPES = [
  { value: "baseline", label: "Baseline Assessment" },
  { value: "drill_focus", label: "Drill (Focused)" },
  { value: "drill_mixed", label: "Drill (Mixed)" },
  { value: "mock", label: "Mock Test" },
  { value: "review", label: "Review Module" },
]

export default function AdminModulesPage() {
  const { toast } = useToast()
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module_type: "drill_focus",
    time_limit_min: null as number | null,
  })

  // Composer state
  const [moduleQuestions, setModuleQuestions] = useState<ModuleQuestion[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [questionSearch, setQuestionSearch] = useState("")
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("modules")
        .select(`
          *,
          module_questions(
            id,
            question_id,
            order_index,
            question:questions(
              id,
              question_text,
              question_type,
              difficulty,
              time_estimate_seconds
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform data
      const transformedModules = (data || []).map((m: any) => ({
        ...m,
        questions: m.module_questions || [],
      }))

      setModules(transformedModules)
    } catch (error) {
      console.error("Load error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Load",
        description: "Could not load modules.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setDialogMode("create")
    setSelectedModule(null)
    setFormData({
      name: "",
      description: "",
      module_type: "drill_focus",
      time_limit_min: null,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (module: Module) => {
    setDialogMode("edit")
    setSelectedModule(module)
    setFormData({
      name: module.name,
      description: module.description || "",
      module_type: module.module_type,
      time_limit_min: module.time_limit_min,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Missing Name",
        description: "Please provide a module name.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const moduleData = {
        name: formData.name,
        description: formData.description || null,
        module_type: formData.module_type,
        time_limit_min: formData.time_limit_min,
        is_published: false,
        created_by: user?.id,
      }

      if (dialogMode === "create") {
        const { error } = await supabase.from("modules").insert(moduleData)
        if (error) throw error

        toast({
          title: "Module Created!",
          description: "You can now add questions to this module.",
        })
      } else {
        const { error } = await supabase
          .from("modules")
          .update(moduleData)
          .eq("id", selectedModule!.id)

        if (error) throw error

        toast({
          title: "Module Updated!",
          description: "Changes saved successfully.",
        })
      }

      setIsDialogOpen(false)
      loadModules()
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

  const handleDelete = async (module: Module) => {
    if (!confirm(`Delete module "${module.name}"?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("modules").delete().eq("id", module.id)

      if (error) throw error

      toast({
        title: "Module Deleted",
        description: "Module removed successfully.",
      })

      loadModules()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description: "Could not delete module.",
      })
    }
  }

  const openComposer = async (module: Module) => {
    setSelectedModule(module)
    setModuleQuestions(module.questions || [])
    setIsComposerOpen(true)
    await loadAvailableQuestions()
  }

  const loadAvailableQuestions = async () => {
    setIsLoadingQuestions(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("questions")
        .select("id, question_text, question_type, difficulty, time_estimate_seconds, cognitive_level")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setAvailableQuestions(data || [])
    } catch (error) {
      console.error("Load questions error:", error)
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  const addQuestionToModule = (question: Question) => {
    // Check if already added
    if (moduleQuestions.some((mq) => mq.question_id === question.id)) {
      toast({
        variant: "destructive",
        title: "Already Added",
        description: "This question is already in the module.",
      })
      return
    }

    const newQuestion: ModuleQuestion = {
      id: crypto.randomUUID(),
      question_id: question.id,
      order_index: moduleQuestions.length,
      question: {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        difficulty: question.difficulty,
        time_estimate_seconds: question.time_estimate_seconds,
      },
    }

    setModuleQuestions([...moduleQuestions, newQuestion])
  }

  const removeQuestionFromModule = (questionId: string) => {
    const updated = moduleQuestions
      .filter((mq) => mq.question_id !== questionId)
      .map((mq, idx) => ({ ...mq, order_index: idx }))
    setModuleQuestions(updated)
  }

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === moduleQuestions.length - 1)
    ) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updated = [...moduleQuestions]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update order_index
    updated.forEach((mq, idx) => {
      mq.order_index = idx
    })

    setModuleQuestions(updated)
  }

  const saveModuleComposition = async () => {
    if (!selectedModule) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Delete existing questions
      await supabase.from("module_questions").delete().eq("module_id", selectedModule.id)

      // Insert new questions
      const questionsToInsert = moduleQuestions.map((mq) => ({
        module_id: selectedModule.id,
        question_id: mq.question_id,
        order_index: mq.order_index,
      }))

      if (questionsToInsert.length > 0) {
        const { error } = await supabase.from("module_questions").insert(questionsToInsert)
        if (error) throw error
      }

      toast({
        title: "Module Saved!",
        description: `${moduleQuestions.length} questions added to module.`,
      })

      setIsComposerOpen(false)
      loadModules()
    } catch (error) {
      console.error("Save composition error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const togglePublish = async (module: Module) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("modules")
        .update({ is_published: !module.is_published })
        .eq("id", module.id)

      if (error) throw error

      toast({
        title: module.is_published ? "Module Unpublished" : "Module Published!",
        description: module.is_published
          ? "Module is now hidden from students."
          : "Module is now available to students.",
      })

      loadModules()
    } catch (error) {
      console.error("Publish error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Update",
        description: "Could not change publish status.",
      })
    }
  }

  const filteredModules = modules.filter((module) => {
    if (filter === "all") return true
    return module.module_type === filter
  })

  const filteredAvailableQuestions = availableQuestions.filter((q) => {
    if (!questionSearch) return true
    return q.question_text.toLowerCase().includes(questionSearch.toLowerCase())
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
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">
            Create and manage practice modules
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              All Modules
            </Button>
            {MODULE_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={filter === type.value ? "default" : "outline"}
                onClick={() => setFilter(type.value)}
                size="sm"
              >
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No modules found</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredModules.map((module) => {
            const totalTime = module.questions?.reduce(
              (sum, mq) => sum + (mq.question?.time_estimate_seconds || 0),
              0
            ) || 0
            const estimatedMinutes = Math.ceil(totalTime / 60)

            return (
              <Card
                key={module.id}
                className="hover:shadow-brutal transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {MODULE_TYPES.find((t) => t.value === module.module_type)?.label}
                        </Badge>
                        <Badge variant={module.is_published ? "default" : "secondary"}>
                          {module.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <CardTitle>{module.name}</CardTitle>
                      {module.description && (
                        <CardDescription>{module.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openComposer(module)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(module)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(module)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{module.questions?.length || 0} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>~{estimatedMinutes} min</span>
                      </div>
                    </div>
                    <Button
                      variant={module.is_published ? "outline" : "default"}
                      size="sm"
                      onClick={() => togglePublish(module)}
                      className={module.is_published ? "" : "bg-green-600 hover:bg-green-700"}
                    >
                      {module.is_published ? "Unpublish" : "Publish"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create New Module" : "Edit Module"}
            </DialogTitle>
            <DialogDescription>
              Configure module settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Module Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., TPS Drill - Penalaran Umum"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this module"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="module_type">Module Type</Label>
              <Select
                value={formData.module_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, module_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_limit">Time Limit (Optional, minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                value={formData.time_limit_min || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    time_limit_min: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Leave empty for no limit"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "create" ? "Create Module" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Composer Dialog */}
      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Module Composer: {selectedModule?.name}</DialogTitle>
            <DialogDescription>
              Add questions and arrange them in order
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Current Module Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Module Questions ({moduleQuestions.length})</Label>
              </div>

              {moduleQuestions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No questions added yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {moduleQuestions.map((mq, index) => (
                    <div
                      key={mq.id}
                      className="p-3 border-2 border-charcoal rounded-lg bg-white"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveQuestion(index, "up")}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveQuestion(index, "down")}
                            disabled={index === moduleQuestions.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {mq.question.question_type}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                mq.question.difficulty === "easy"
                                  ? "bg-green-100 text-green-800"
                                  : mq.question.difficulty === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {mq.question.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">
                            {mq.question.question_text.substring(0, 80)}...
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestionFromModule(mq.question_id)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Questions */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Add Questions</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {isLoadingQuestions ? (
                <div className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredAvailableQuestions.map((question) => {
                    const isAlreadyAdded = moduleQuestions.some(
                      (mq) => mq.question_id === question.id
                    )

                    return (
                      <div
                        key={question.id}
                        onClick={() => !isAlreadyAdded && addQuestionToModule(question)}
                        className={`p-3 border-2 rounded-lg transition-colors ${
                          isAlreadyAdded
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 bg-white hover:border-charcoal cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {question.question_type}
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              question.difficulty === "easy"
                                ? "bg-green-100 text-green-800"
                                : question.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.cognitive_level}
                          </Badge>
                          {isAlreadyAdded && (
                            <Badge className="text-xs bg-blue-100 text-blue-800">
                              Added
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          {question.question_text.substring(0, 100)}...
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsComposerOpen(false)
                setModuleQuestions([])
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveModuleComposition} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Module ({moduleQuestions.length} questions)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
