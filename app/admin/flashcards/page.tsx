"use client"

/**
 * Admin Flashcards Management
 * Create, edit, and manage flashcards with taxonomy linking
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Loader2, Search, Filter, Sparkles, Check, RotateCcw } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Flashcard {
  id: string
  micro_skill_id: string
  front_text: string
  front_image: string | null
  back_text: string
  back_image: string | null
  mnemonic: string | null
  example: string | null
  status: string
  created_at: string
  taxonomy_node?: { id: string; name: string; code: string }
}

interface TaxonomyNode {
  id: string
  name: string
  code: string
  level: number
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

export default function AdminFlashcardsPage() {
  const { toast } = useToast()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [taxonomyNodes, setTaxonomyNodes] = useState<TaxonomyNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterMicroSkill, setFilterMicroSkill] = useState<string>("all")

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    micro_skill_id: "",
    front_text: "",
    back_text: "",
    mnemonic: "",
    example: "",
    status: "draft",
  })

  // AI Generation state
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([])
  const [selectedGenerated, setSelectedGenerated] = useState<Set<number>>(new Set())
  const [generationParams, setGenerationParams] = useState({
    taxonomy_node_id: "",
    count: 5,
  })

  // Preview state
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load flashcards with taxonomy join
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select(`
          *,
          taxonomy_node:taxonomy_nodes(id, name, code)
        `)
        .order("created_at", { ascending: false })

      if (flashcardsError) throw flashcardsError

      setFlashcards(flashcardsData || [])

      // Load taxonomy nodes (level 5 = micro-skills) for linking
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
        description: "Could not load flashcards.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openAddDialog = () => {
    setDialogMode("add")
    setSelectedFlashcard(null)
    setFormData({
      micro_skill_id: "",
      front_text: "",
      back_text: "",
      mnemonic: "",
      example: "",
      status: "draft",
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (flashcard: Flashcard) => {
    setDialogMode("edit")
    setSelectedFlashcard(flashcard)
    setFormData({
      micro_skill_id: flashcard.micro_skill_id,
      front_text: flashcard.front_text,
      back_text: flashcard.back_text,
      mnemonic: flashcard.mnemonic || "",
      example: flashcard.example || "",
      status: flashcard.status,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.micro_skill_id || !formData.front_text || !formData.back_text) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Micro-skill, front text, and back text are required.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      const flashcardData = {
        micro_skill_id: formData.micro_skill_id,
        front_text: formData.front_text,
        back_text: formData.back_text,
        mnemonic: formData.mnemonic || null,
        example: formData.example || null,
        status: formData.status,
        created_by: user?.id,
      }

      if (dialogMode === "add") {
        const { error } = await supabase
          .from("flashcards")
          .insert(flashcardData)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from("flashcards")
          .update(flashcardData)
          .eq("id", selectedFlashcard!.id)

        if (error) throw error
      }

      toast({
        title: dialogMode === "add" ? "Flashcard Created!" : "Flashcard Updated!",
        description: "Flashcard saved successfully.",
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

  const handleDelete = async (flashcard: Flashcard) => {
    if (!confirm(`Delete flashcard: "${flashcard.front_text.substring(0, 50)}..."?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", flashcard.id)

      if (error) throw error

      toast({
        title: "Flashcard Deleted",
        description: "Flashcard removed successfully.",
      })

      loadData()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description: "Could not delete flashcard.",
      })
    }
  }

  const updateStatus = async (flashcard: Flashcard, newStatus: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("flashcards")
        .update({ status: newStatus })
        .eq("id", flashcard.id)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Flashcard is now ${newStatus}.`,
      })

      loadData()
    } catch (error) {
      console.error("Status update error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Update",
        description: "Could not update status.",
      })
    }
  }

  const openGenerateDialog = () => {
    setGeneratedFlashcards([])
    setSelectedGenerated(new Set())
    setPreviewIndex(null)
    setIsFlipped(false)
    setIsGenerateDialogOpen(true)
  }

  const generateFlashcards = async () => {
    if (!generationParams.taxonomy_node_id) {
      toast({
        variant: "destructive",
        title: "No Taxonomy Selected",
        description: "Please select a micro-skill first.",
      })
      return
    }

    setIsGenerating(true)

    try {
      const supabase = createClient()
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/admin/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(generationParams),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate flashcards')

      if (data.success && data.flashcards) {
        setGeneratedFlashcards(data.flashcards)
        // Auto-select all generated flashcards
        setSelectedGenerated(new Set(data.flashcards.map((_: any, idx: number) => idx)))
        toast({
          title: "Flashcards Generated!",
          description: `${data.flashcards.length} flashcards ready for review.`,
        })
      } else {
        throw new Error("No flashcards generated")
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

  const toggleGeneratedFlashcard = (index: number) => {
    const newSelected = new Set(selectedGenerated)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedGenerated(newSelected)
  }

  const selectAllGenerated = () => {
    setSelectedGenerated(new Set(generatedFlashcards.map((_, idx) => idx)))
  }

  const deselectAllGenerated = () => {
    setSelectedGenerated(new Set())
  }

  const importSelectedFlashcards = async () => {
    if (selectedGenerated.size === 0) {
      toast({
        variant: "destructive",
        title: "No Flashcards Selected",
        description: "Please select at least one flashcard to import.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Prepare flashcards to insert
      const flashcardsToInsert = Array.from(selectedGenerated).map((idx) => {
        const f = generatedFlashcards[idx]
        return {
          micro_skill_id: generationParams.taxonomy_node_id,
          front_text: f.front_text,
          back_text: f.back_text,
          mnemonic: f.mnemonic || null,
          example: f.example || null,
          status: "draft",
          created_by: user?.id,
        }
      })

      // Insert flashcards
      const { error } = await supabase
        .from("flashcards")
        .insert(flashcardsToInsert)

      if (error) throw error

      toast({
        title: "Flashcards Imported!",
        description: `Successfully imported ${selectedGenerated.size} flashcards.`,
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

  const filteredFlashcards = flashcards.filter((f) => {
    const matchesSearch =
      searchQuery === "" ||
      f.front_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.back_text.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === "all" || f.status === filterStatus

    const matchesMicroSkill =
      filterMicroSkill === "all" || f.micro_skill_id === filterMicroSkill

    return matchesSearch && matchesStatus && matchesMicroSkill
  })

  // Get unique micro-skills from flashcards for filter
  const microSkillsInUse = [...new Set(flashcards.map(f => f.micro_skill_id))]

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
          <h1 className="text-3xl font-bold">Flashcards Management</h1>
          <p className="text-muted-foreground">
            Create and manage flashcards for quick review
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openGenerateDialog}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Flashcard
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
                  placeholder="Search flashcards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Micro-skill</Label>
              <Select value={filterMicroSkill} onValueChange={setFilterMicroSkill}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Micro-skills</SelectItem>
                  {taxonomyNodes
                    .filter(n => microSkillsInUse.includes(n.id))
                    .map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name} ({node.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcards List */}
      <Card>
        <CardHeader>
          <CardTitle>Flashcards ({filteredFlashcards.length})</CardTitle>
          <CardDescription>
            {flashcards.length} total flashcards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFlashcards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No flashcards found</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Flashcard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlashcards.map((flashcard) => (
                <div
                  key={flashcard.id}
                  className="p-4 border-2 border-charcoal rounded-lg bg-white hover:shadow-brutal transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors ${
                            flashcard.status === "published"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : flashcard.status === "draft"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {flashcard.status}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_OPTIONS.map((status) => (
                          <DropdownMenuItem
                            key={status.value}
                            onClick={() => updateStatus(flashcard, status.value)}
                            className={`cursor-pointer ${flashcard.status === status.value ? "bg-muted" : ""}`}
                          >
                            <span className={`mr-2 h-2 w-2 rounded-full ${
                              status.value === "published"
                                ? "bg-green-500"
                                : status.value === "draft"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`} />
                            {status.label}
                            {flashcard.status === status.value && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {flashcard.taxonomy_node && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {flashcard.taxonomy_node.code}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Front</p>
                      <p className="font-medium line-clamp-2">{flashcard.front_text}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Back</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{flashcard.back_text}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(flashcard)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(flashcard)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {dialogMode === "add" ? "Create New Flashcard" : "Edit Flashcard"}
            </DialogTitle>
            <DialogDescription>
              Fill in the flashcard content
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Micro-skill Selection */}
            <div className="space-y-2">
              <Label>
                Micro-skill <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.micro_skill_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, micro_skill_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select micro-skill" />
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

            {/* Front Text */}
            <div className="space-y-2">
              <Label htmlFor="front_text">
                Front Text (Question) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="front_text"
                value={formData.front_text}
                onChange={(e) =>
                  setFormData({ ...formData, front_text: e.target.value })
                }
                placeholder="What is the formula for..."
                rows={3}
              />
            </div>

            {/* Back Text */}
            <div className="space-y-2">
              <Label htmlFor="back_text">
                Back Text (Answer) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="back_text"
                value={formData.back_text}
                onChange={(e) =>
                  setFormData({ ...formData, back_text: e.target.value })
                }
                placeholder="The formula is..."
                rows={3}
              />
            </div>

            {/* Mnemonic */}
            <div className="space-y-2">
              <Label htmlFor="mnemonic">Mnemonic (Optional)</Label>
              <Input
                id="mnemonic"
                value={formData.mnemonic}
                onChange={(e) =>
                  setFormData({ ...formData, mnemonic: e.target.value })
                }
                placeholder="Memory trick or acronym..."
              />
            </div>

            {/* Example */}
            <div className="space-y-2">
              <Label htmlFor="example">Example (Optional)</Label>
              <Textarea
                id="example"
                value={formData.example}
                onChange={(e) =>
                  setFormData({ ...formData, example: e.target.value })
                }
                placeholder="Real-world example..."
                rows={2}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Create Flashcard" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Flashcards with AI
            </DialogTitle>
            <DialogDescription>
              Configure parameters and let AI generate flashcards based on micro-skill
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {generatedFlashcards.length === 0 ? (
              <>
                {/* Configuration Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Micro-skill <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={generationParams.taxonomy_node_id}
                      onValueChange={(value) =>
                        setGenerationParams({ ...generationParams, taxonomy_node_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select micro-skill" />
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
                      Flashcards will be generated for this micro-skill
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Flashcards</Label>
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
                </div>

                <div className="flex items-center justify-center pt-4">
                  <Button
                    onClick={generateFlashcards}
                    disabled={isGenerating || !generationParams.taxonomy_node_id}
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Flashcards...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate {generationParams.count} Flashcards
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Generated Flashcards Review */}
                <div className="space-y-4">
                  {/* Selection Controls */}
                  <div className="flex items-center justify-between p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-900">
                      {selectedGenerated.size} of {generatedFlashcards.length} flashcards selected
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
                        onClick={() => {
                          setGeneratedFlashcards([])
                          setPreviewIndex(null)
                        }}
                      >
                        Back to Config
                      </Button>
                    </div>
                  </div>

                  {/* Flashcard Preview */}
                  {previewIndex !== null && (
                    <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">Preview Card #{previewIndex + 1}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFlipped(!isFlipped)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Flip
                        </Button>
                      </div>
                      <div className="min-h-[150px] flex items-center justify-center p-6 bg-white rounded-lg border-2 border-border">
                        {!isFlipped ? (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-2">FRONT</p>
                            <p className="text-xl font-medium">{generatedFlashcards[previewIndex].front_text}</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-2">BACK</p>
                            <p className="text-lg">{generatedFlashcards[previewIndex].back_text}</p>
                            {generatedFlashcards[previewIndex].mnemonic && (
                              <p className="mt-3 text-sm text-blue-600">
                                Mnemonic: {generatedFlashcards[previewIndex].mnemonic}
                              </p>
                            )}
                            {generatedFlashcards[previewIndex].example && (
                              <p className="mt-2 text-sm text-gray-600">
                                Example: {generatedFlashcards[previewIndex].example}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Flashcards List */}
                  <div className="space-y-2">
                    {generatedFlashcards.map((flashcard, index) => {
                      const isSelected = selectedGenerated.has(index)
                      const isPreview = previewIndex === index

                      return (
                        <div
                          key={index}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          } ${isPreview ? "ring-2 ring-primary" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleGeneratedFlashcard(index)
                              }}
                            >
                              {isSelected ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-gray-300 rounded" />
                              )}
                            </div>
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => {
                                setPreviewIndex(index)
                                setIsFlipped(false)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">#{index + 1}</Badge>
                              </div>
                              <p className="font-medium mt-1 truncate">{flashcard.front_text}</p>
                              <p className="text-sm text-muted-foreground truncate">{flashcard.back_text}</p>
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

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerateDialogOpen(false)
                setGeneratedFlashcards([])
                setSelectedGenerated(new Set())
                setPreviewIndex(null)
              }}
            >
              Cancel
            </Button>
            {generatedFlashcards.length > 0 && (
              <Button
                onClick={importSelectedFlashcards}
                disabled={selectedGenerated.size === 0 || isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import {selectedGenerated.size} Flashcards
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
