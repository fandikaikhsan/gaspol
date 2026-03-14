"use client"

/**
 * Admin Material Cards Management (T-037 + T-039)
 * CRUD operations + publish workflow (draft ↔ published)
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MaterialCardStatus } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  BookOpen,
  CheckCircle,
  FileEdit,
  Eye,
} from "lucide-react"
import { Sparkles } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import { OrphanWarningBadge } from "@/components/admin/OrphanWarningBadge"
import { TaxonomyFilterChips } from "@/components/admin/TaxonomyFilterChips"
import { MaterialCardViewer } from "@/components/review/MaterialCardViewer"

// Types
type ExampleItem = string | { contoh: string; penjelasan: string }

interface MaterialCard {
  id: string
  skill_id: string
  title: string
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
  examples: ExampleItem[]
  status: "draft" | "published"
  created_by: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  // Joined
  skill_name?: string
}

interface TaxonomyNode {
  id: string
  name: string
  level: number
  parent_id: string | null
}

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground",
    icon: FileEdit,
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
}

const EMPTY_FORM: Omit<
  MaterialCard,
  | "id"
  | "created_by"
  | "reviewed_by"
  | "created_at"
  | "updated_at"
  | "skill_name"
> = {
  skill_id: "",
  title: "",
  core_idea: "",
  key_facts: [""],
  common_mistakes: [""],
  examples: [{ contoh: "", penjelasan: "" }],
  status: "draft",
}

export default function AdminMaterialsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  // State
  const [materials, setMaterials] = useState<MaterialCard[]>([])
  const [skills, setSkills] = useState<TaxonomyNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filterTaxonomyNodeId, setFilterTaxonomyNodeId] = useState<string | null>(null)
  const [taxonomyTree, setTaxonomyTree] = useState<Array<{ id: string; parent_id: string | null; level: number }>>([])
  const [previewCard, setPreviewCard] = useState<MaterialCard | null>(null)

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCard, setEditingCard] = useState<MaterialCard | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<MaterialCard | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // AI Generation state (T-038)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateResults, setGenerateResults] = useState<any>(null)

  // Fetch materials (only from active exam skills)
  const fetchMaterials = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: activeExams } = await supabase
        .from("exams")
        .select("id")
        .eq("is_active", true)
      const activeExamIds = (activeExams || []).map((e: { id: string }) => e.id)
      let activeSkillIds: string[] = []
      if (activeExamIds.length > 0) {
        const { data: nodes } = await supabase
          .from("taxonomy_nodes")
          .select("id")
          .eq("level", 5)
          .in("exam_id", activeExamIds)
        activeSkillIds = (nodes || []).map((n: { id: string }) => n.id)
      }

      let query = supabase
        .from("material_cards")
        .select("*")
        .order("updated_at", { ascending: false })

      if (activeSkillIds.length > 0) {
        query = query.in("skill_id", activeSkillIds)
      } else {
        query = query.in("skill_id", [])
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as MaterialCardStatus)
      }
      if (searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,core_idea.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error
      const asString = (v: unknown): string => {
        if (typeof v === "string") return v
        if (v != null && typeof v === "object") {
          const obj = v as Record<string, unknown>
          if (typeof obj.solution === "string") return obj.solution
          if (typeof obj.example === "string") return obj.example
          if (typeof obj.text === "string") return obj.text
          return JSON.stringify(obj)
        }
        return String(v ?? "")
      }
      const normalizeExample = (v: unknown): string | { contoh: string; penjelasan: string } => {
        if (typeof v === "string") return v
        if (v != null && typeof v === "object") {
          const obj = v as Record<string, unknown>
          const contoh = typeof obj.contoh === "string" ? obj.contoh : ""
          const penjelasan = typeof obj.penjelasan === "string" ? obj.penjelasan : ""
          if ("contoh" in obj || "penjelasan" in obj) return { contoh, penjelasan }
        }
        return { contoh: asString(v), penjelasan: "" }
      }
      setMaterials(
        (data || []).map((d) => ({
          ...d,
          key_facts: Array.isArray(d.key_facts)
            ? (d.key_facts as unknown[]).map(asString)
            : [],
          common_mistakes: Array.isArray(d.common_mistakes)
            ? (d.common_mistakes as unknown[]).map(asString)
            : [],
          examples: Array.isArray(d.examples)
            ? (d.examples as unknown[]).map(normalizeExample)
            : [],
        })),
      )
    } catch (error) {
      console.error("Failed to fetch materials:", error)
      toast({ variant: "destructive", title: "Failed to load materials" })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter])

  const getL5DescendantIds = useCallback(
    (nodeId: string): Set<string> => {
      const nodeMap = new Map(taxonomyTree.map((n) => [n.id, n]))
      const byParent = new Map<string | null, typeof taxonomyTree>()
      for (const n of taxonomyTree) {
        const key = n.parent_id
        if (!byParent.has(key)) byParent.set(key, [])
        byParent.get(key)!.push(n)
      }
      const result = new Set<string>()
      const collect = (id: string) => {
        const n = nodeMap.get(id)
        if (!n) return
        if (n.level === 5) result.add(id)
        const children = byParent.get(id) || []
        for (const c of children) collect(c.id)
      }
      collect(nodeId)
      return result
    },
    [taxonomyTree],
  )

  const filterL5Ids = filterTaxonomyNodeId ? getL5DescendantIds(filterTaxonomyNodeId) : null

  // Fetch taxonomy skills (level 5, only from active exams)
  const fetchSkills = useCallback(async () => {
    try {
      const { data: activeExams } = await supabase
        .from("exams")
        .select("id")
        .eq("is_active", true)
      const activeExamIds = (activeExams || []).map((e: { id: string }) => e.id)
      if (activeExamIds.length === 0) {
        setSkills([])
        return
      }
      const { data, error } = await supabase
        .from("taxonomy_nodes")
        .select("id, name, level, parent_id")
        .eq("level", 5)
        .in("exam_id", activeExamIds)
        .order("name")

      if (error) throw error
      setSkills((data as TaxonomyNode[]) || [])
    } catch (error) {
      console.error("Failed to fetch skills:", error)
    }
  }, [])

  const fetchTaxonomyTree = useCallback(async () => {
    try {
      const { data: activeExams } = await supabase
        .from("exams")
        .select("id")
        .eq("is_active", true)
      const activeExamIds = (activeExams || []).map((e: { id: string }) => e.id)
      if (activeExamIds.length === 0) {
        setTaxonomyTree([])
        return
      }
      const { data } = await supabase
        .from("taxonomy_nodes")
        .select("id, parent_id, level")
        .eq("is_active", true)
        .in("exam_id", activeExamIds)
      setTaxonomyTree((data || []).map((n) => ({ id: n.id, parent_id: n.parent_id, level: n.level })))
    } catch (e) {
      console.error("Failed to fetch taxonomy tree:", e)
    }
  }, [])

  useEffect(() => {
    fetchMaterials()
    fetchSkills()
    fetchTaxonomyTree()
  }, [fetchMaterials, fetchSkills, fetchTaxonomyTree])

  // Open create dialog
  const handleCreate = () => {
    setEditingCard(null)
    setForm({ ...EMPTY_FORM })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (card: MaterialCard) => {
    setEditingCard(card)
    const toFormExample = (ex: ExampleItem): { contoh: string; penjelasan: string } =>
      typeof ex === "string"
        ? { contoh: ex, penjelasan: "" }
        : { contoh: ex.contoh ?? "", penjelasan: ex.penjelasan ?? "" }
    setForm({
      skill_id: card.skill_id,
      title: card.title,
      core_idea: card.core_idea,
      key_facts: card.key_facts.length > 0 ? card.key_facts : [""],
      common_mistakes:
        card.common_mistakes.length > 0 ? card.common_mistakes : [""],
      examples:
        card.examples.length > 0
          ? card.examples.map(toFormExample)
          : [{ contoh: "", penjelasan: "" }],
      status: card.status,
    })
    setIsDialogOpen(true)
  }

  // Save (create or update)
  const handleSave = async () => {
    if (!form.skill_id || !form.title || !form.core_idea) {
      toast({ variant: "destructive", title: "Please fill in required fields" })
      return
    }

    setIsSubmitting(true)
    try {
      const filteredExamples = form.examples
        .map((e) => (typeof e === "string" ? { contoh: e, penjelasan: "" } : e))
        .filter((e) => e.contoh.trim() || e.penjelasan.trim())
      const payload = {
        skill_id: form.skill_id,
        title: form.title.trim(),
        core_idea: form.core_idea.trim(),
        key_facts: form.key_facts.filter((f) => f.trim()),
        common_mistakes: form.common_mistakes.filter((m) => m.trim()),
        examples: filteredExamples,
        status: form.status,
      }

      if (editingCard) {
        const { error } = await supabase
          .from("material_cards")
          .update(payload)
          .eq("id", editingCard.id)
        if (error) throw error
        toast({ title: "Material Card updated" })
      } else {
        const { error } = await supabase.from("material_cards").insert(payload)
        if (error) throw error
        toast({ title: "Material Card created" })
      }

      setIsDialogOpen(false)
      fetchMaterials()
    } catch (error) {
      console.error("Save error:", error)
      toast({ variant: "destructive", title: "Failed to save" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete
  const handleDeleteClick = (card: MaterialCard) => {
    setCardToDelete(card)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("material_cards")
        .delete()
        .eq("id", cardToDelete.id)
      if (error) throw error
      toast({ title: "Material Card deleted" })
      setCardToDelete(null)
      fetchMaterials()
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (
    id: string,
    newStatus: "draft" | "published",
  ) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === "published") {
        updateData.reviewed_by = (await supabase.auth.getUser()).data.user?.id || null
      }

      const { error } = await supabase
        .from("material_cards")
        .update(updateData)
        .eq("id", id)

      if (error) throw error
      toast({ title: `Status changed to ${newStatus}` })
      fetchMaterials()
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update status" })
    }
  }

  // Dynamic list field helpers
  const addListItem = (field: "key_facts" | "common_mistakes" | "examples") => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "examples"
          ? [...prev[field].map((e) => (typeof e === "string" ? { contoh: e, penjelasan: "" } : e)), { contoh: "", penjelasan: "" }]
          : [...prev[field], ""],
    }))
  }

  const updateListItem = (
    field: "key_facts" | "common_mistakes" | "examples",
    index: number,
    value: string,
  ) => {
    setForm((prev) => {
      const arr = [...prev[field]]
      arr[index] = value
      return { ...prev, [field]: arr }
    })
  }

  const updateExampleItem = (
    index: number,
    subField: "contoh" | "penjelasan",
    value: string,
  ) => {
    setForm((prev) => {
      const arr = prev.examples.map((e) =>
        typeof e === "string" ? { contoh: e, penjelasan: "" } : { ...e },
      )
      if (arr[index]) {
        arr[index] = { ...arr[index], [subField]: value }
      }
      return { ...prev, examples: arr }
    })
  }

  const removeListItem = (
    field: "key_facts" | "common_mistakes" | "examples",
    index: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const filteredMaterials = materials.filter((m) => {
    if (!filterL5Ids) return true
    return filterL5Ids.has(m.skill_id)
  })

  // AI Batch Generation (T-038)
  const handleGenerate = async () => {
    if (selectedSkillIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Select at least one micro-skill",
      })
      return
    }
    setIsGenerating(true)
    setGenerateResults(null)
    try {
      const res = await fetch("/api/admin/generate-material-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxonomy_node_ids: selectedSkillIds,
          auto_save: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      setGenerateResults(data)
      toast({ title: `Generated ${data.summary?.saved || 0} material cards` })
      fetchMaterials()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: error.message || "Generation failed",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    )
  }

  const stats = {
    total: materials.length,
    draft: materials.filter((m) => m.status === "draft").length,
    published: materials.filter((m) => m.status === "published").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Material Cards</h1>
          <p className="text-muted-foreground">
            Manage learning material cards for micro-skills
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Material Card
        </Button>
        <Button
          variant="brutal-outline"
          onClick={() => {
            setIsGenerateDialogOpen(true)
            setSelectedSkillIds([])
            setGenerateResults(null)
          }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.draft}
            </div>
            <div className="text-sm text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or core idea..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <TaxonomyFilterChips
          value={filterTaxonomyNodeId}
          onChange={setFilterTaxonomyNodeId}
          placeholder="Filter by taxonomy (Exam → L1 → … → L5)"
        />
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No Material Cards</h3>
            <p className="text-muted-foreground mb-4">
              Create your first material card to get started.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Material Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMaterials.map((card) => {
            const statusConfig = STATUS_CONFIG[card.status]
            const StatusIcon = statusConfig.icon

            return (
              <Card key={card.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{card.title}</h3>
                        <Badge className={statusConfig.color} variant="outline">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {!skills.some((s) => s.id === card.skill_id) && (
                          <OrphanWarningBadge message="Skill/taxonomy node no longer exists. Reassign to a valid skill." />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {card.core_idea}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>
                          Skill: {skills.find((s) => s.id === card.skill_id)?.name ?? card.skill_id}
                        </span>
                        <span>{card.key_facts.length} facts</span>
                        <span>{card.common_mistakes.length} mistakes</span>
                        <span>{card.examples.length} examples</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {card.status === "draft" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(card.id, "published")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      )}
                      {card.status === "published" && (
                        <Button
                          size="sm"
                          variant="brutal-outline"
                          onClick={() => handleStatusChange(card.id, "draft")}
                        >
                          Unpublish
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewCard(card)}
                        title="Preview student view"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteClick(card)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? "Edit Material Card" : "Create Material Card"}
            </DialogTitle>
            <DialogDescription>
              Fill in the learning material for a micro-skill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Skill Selection */}
            <div>
              <Label>Micro-Skill *</Label>
              <Select
                value={form.skill_id}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, skill_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a micro-skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name} ({skill.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Understanding Fractions"
              />
            </div>

            {/* Core Idea */}
            <div>
              <Label>Core Idea *</Label>
              <Textarea
                value={form.core_idea}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, core_idea: e.target.value }))
                }
                placeholder="The central concept students need to understand..."
                rows={3}
              />
            </div>

            {/* Key Facts */}
            <div>
              <Label>Key Facts</Label>
              {form.key_facts.map((fact, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={fact}
                    onChange={(e) =>
                      updateListItem("key_facts", i, e.target.value)
                    }
                    placeholder={`Fact ${i + 1}`}
                  />
                  {form.key_facts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeListItem("key_facts", i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => addListItem("key_facts")}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Fact
              </Button>
            </div>

            {/* Common Mistakes */}
            <div>
              <Label>Common Mistakes</Label>
              {form.common_mistakes.map((mistake, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input
                    value={mistake}
                    onChange={(e) =>
                      updateListItem("common_mistakes", i, e.target.value)
                    }
                    placeholder={`Mistake ${i + 1}`}
                  />
                  {form.common_mistakes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeListItem("common_mistakes", i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => addListItem("common_mistakes")}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Mistake
              </Button>
            </div>

            {/* Examples (contoh + penjelasan) */}
            <div>
              <Label>Examples</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Each example has Contoh (the sample) and Penjelasan (the explanation).
              </p>
              {form.examples.map((example, i) => {
                const ex = typeof example === "string" ? { contoh: example, penjelasan: "" } : example
                return (
                  <div key={i} className="border rounded-lg p-3 mt-2 space-y-2 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Example {i + 1}</span>
                      {form.examples.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeListItem("examples", i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Contoh</Label>
                      <Textarea
                        value={ex.contoh}
                        onChange={(e) =>
                          updateExampleItem(i, "contoh", e.target.value)
                        }
                        placeholder="e.g. Kata target: 'berani'. Sinonim: 'pemberani'..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Penjelasan</Label>
                      <Textarea
                        value={ex.penjelasan}
                        onChange={(e) =>
                          updateExampleItem(i, "penjelasan", e.target.value)
                        }
                        placeholder="e.g. Dalam konteks ini, 'pemberani' adalah sinonim yang tepat..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => addListItem("examples")}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Example
              </Button>
            </div>

            {/* Status (for editing) */}
            {editingCard && (
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, status: v as "draft" | "published" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="brutal-outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingCard ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview modal (student view) */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Preview</DialogTitle>
            <DialogDescription>
              How this material card will appear to students
            </DialogDescription>
          </DialogHeader>
          {previewCard && (
            <MaterialCardViewer
              card={previewCard}
              skillName={skills.find((s) => s.id === previewCard.skill_id)?.name}
              showHeader={true}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Material Card"
        description={
          cardToDelete
            ? `Delete "${cardToDelete.title}"? This cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* AI Generation Dialog (T-038) */}
      <Dialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Sparkles className="h-5 w-5 inline mr-2" />
              Generate Material Cards with AI
            </DialogTitle>
            <DialogDescription>
              Select micro-skills to generate material cards for. Cards will be
              created as drafts.
            </DialogDescription>
          </DialogHeader>

          {generateResults ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Results: {generateResults.summary?.saved || 0} saved,{" "}
                {generateResults.summary?.errors || 0} errors
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generateResults.results?.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {r.saved ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <span className="h-4 w-4 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {r.skill_name || r.skill_id}
                    </span>
                    {r.error && (
                      <span className="text-destructive text-xs">
                        ({r.error})
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsGenerateDialogOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No Level-5 micro-skills found
                  </p>
                ) : (
                  skills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkillIds.includes(skill.id)}
                        onChange={() => toggleSkillSelection(skill.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{skill.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSkillIds.length} Level-5 micro-skill(s) selected
              </p>
              <DialogFooter>
                <Button
                  variant="brutal-outline"
                  onClick={() => setIsGenerateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedSkillIds.length === 0}
                >
                  {isGenerating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isGenerating
                    ? "Generating..."
                    : `Generate ${selectedSkillIds.length} Card(s)`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
