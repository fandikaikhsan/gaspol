"use client"

/**
 * Admin Material Cards Management (T-037 + T-039)
 * CRUD operations + publish workflow (draft → review → published)
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MaterialCardStatus } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Clock,
  FileEdit,
  ArrowRight,
} from "lucide-react"
import { Sparkles } from "lucide-react"

// Types
interface MaterialCard {
  id: string
  skill_id: string
  title: string
  core_idea: string
  key_facts: string[]
  common_mistakes: string[]
  examples: string[]
  status: 'draft' | 'review' | 'published'
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
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: FileEdit },
  review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  published: { label: 'Published', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const EMPTY_FORM: Omit<MaterialCard, 'id' | 'created_by' | 'reviewed_by' | 'created_at' | 'updated_at' | 'skill_name'> = {
  skill_id: '',
  title: '',
  core_idea: '',
  key_facts: [''],
  common_mistakes: [''],
  examples: [''],
  status: 'draft',
}

export default function AdminMaterialsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  // State
  const [materials, setMaterials] = useState<MaterialCard[]>([])
  const [skills, setSkills] = useState<TaxonomyNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCard, setEditingCard] = useState<MaterialCard | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // AI Generation state (T-038)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateResults, setGenerateResults] = useState<any>(null)

  // Fetch materials
  const fetchMaterials = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('material_cards')
        .select('*')
        .order('updated_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as MaterialCardStatus)
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,core_idea.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setMaterials((data || []).map(d => ({
        ...d,
        key_facts: Array.isArray(d.key_facts) ? d.key_facts as string[] : [],
        common_mistakes: Array.isArray(d.common_mistakes) ? d.common_mistakes as string[] : [],
        examples: Array.isArray(d.examples) ? d.examples as string[] : [],
      })))
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      toast({ variant: 'destructive', title: 'Failed to load materials' })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter])

  // Fetch taxonomy skills (level 5)
  const fetchSkills = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('taxonomy_nodes')
        .select('id, name, level, parent_id')
        .eq('level', 5)
        .order('name')

      if (error) throw error
      setSkills((data as TaxonomyNode[]) || [])
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    }
  }, [])

  useEffect(() => {
    fetchMaterials()
    fetchSkills()
  }, [fetchMaterials, fetchSkills])

  // Open create dialog
  const handleCreate = () => {
    setEditingCard(null)
    setForm({ ...EMPTY_FORM })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (card: MaterialCard) => {
    setEditingCard(card)
    setForm({
      skill_id: card.skill_id,
      title: card.title,
      core_idea: card.core_idea,
      key_facts: card.key_facts.length > 0 ? card.key_facts : [''],
      common_mistakes: card.common_mistakes.length > 0 ? card.common_mistakes : [''],
      examples: card.examples.length > 0 ? card.examples : [''],
      status: card.status,
    })
    setIsDialogOpen(true)
  }

  // Save (create or update)
  const handleSave = async () => {
    if (!form.skill_id || !form.title || !form.core_idea) {
      toast({ variant: 'destructive', title: 'Please fill in required fields' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        skill_id: form.skill_id,
        title: form.title.trim(),
        core_idea: form.core_idea.trim(),
        key_facts: form.key_facts.filter(f => f.trim()),
        common_mistakes: form.common_mistakes.filter(m => m.trim()),
        examples: form.examples.filter(e => e.trim()),
        status: form.status,
      }

      if (editingCard) {
        const { error } = await supabase
          .from('material_cards')
          .update(payload)
          .eq('id', editingCard.id)
        if (error) throw error
        toast({ title: 'Material Card updated' })
      } else {
        const { error } = await supabase
          .from('material_cards')
          .insert(payload)
        if (error) throw error
        toast({ title: 'Material Card created' })
      }

      setIsDialogOpen(false)
      fetchMaterials()
    } catch (error) {
      console.error('Save error:', error)
      toast({ variant: 'destructive', title: 'Failed to save' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('material_cards')
        .delete()
        .eq('id', id)
      if (error) throw error
      toast({ title: 'Material Card deleted' })
      setDeleteConfirmId(null)
      fetchMaterials()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete' })
    }
  }

  // Status transition (T-039: publish workflow)
  const handleStatusChange = async (id: string, newStatus: 'draft' | 'review' | 'published') => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'published') {
        updateData.reviewed_by = (await supabase.auth.getUser()).data.user?.id || null
      }

      const { error } = await supabase
        .from('material_cards')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      toast({ title: `Status changed to ${newStatus}` })
      fetchMaterials()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update status' })
    }
  }

  // Dynamic list field helpers
  const addListItem = (field: 'key_facts' | 'common_mistakes' | 'examples') => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], ''] }))
  }

  const updateListItem = (field: 'key_facts' | 'common_mistakes' | 'examples', index: number, value: string) => {
    setForm(prev => {
      const arr = [...prev[field]]
      arr[index] = value
      return { ...prev, [field]: arr }
    })
  }

  const removeListItem = (field: 'key_facts' | 'common_mistakes' | 'examples', index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  // Filtered + searched materials
  const filteredMaterials = materials

  // AI Batch Generation (T-038)
  const handleGenerate = async () => {
    if (selectedSkillIds.length === 0) {
      toast({ variant: 'destructive', title: 'Select at least one micro-skill' })
      return
    }
    setIsGenerating(true)
    setGenerateResults(null)
    try {
      const res = await fetch('/api/admin/generate-material-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxonomy_node_ids: selectedSkillIds, auto_save: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGenerateResults(data)
      toast({ title: `Generated ${data.summary?.saved || 0} material cards` })
      fetchMaterials()
    } catch (error: any) {
      toast({ variant: 'destructive', title: error.message || 'Generation failed' })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  // Stats
  const stats = {
    total: materials.length,
    draft: materials.filter(m => m.status === 'draft').length,
    review: materials.filter(m => m.status === 'review').length,
    published: materials.filter(m => m.status === 'published').length,
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
        <Button variant="brutal-outline" onClick={() => {
          setIsGenerateDialogOpen(true)
          setSelectedSkillIds([])
          setGenerateResults(null)
        }}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate with AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.review}</div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
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
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
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
            <p className="text-muted-foreground mb-4">Create your first material card to get started.</p>
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{card.title}</h3>
                        <Badge className={statusConfig.color} variant="outline">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {card.core_idea}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Skill: {card.skill_id}</span>
                        <span>{card.key_facts.length} facts</span>
                        <span>{card.common_mistakes.length} mistakes</span>
                        <span>{card.examples.length} examples</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Publish workflow buttons (T-039) */}
                      {card.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="brutal-outline"
                          onClick={() => handleStatusChange(card.id, 'review')}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Submit for Review
                        </Button>
                      )}
                      {card.status === 'review' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(card.id, 'published')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      )}
                      {card.status === 'published' && (
                        <Button
                          size="sm"
                          variant="brutal-outline"
                          onClick={() => handleStatusChange(card.id, 'draft')}
                        >
                          Unpublish
                        </Button>
                      )}

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
                        onClick={() => setDeleteConfirmId(card.id)}
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
              {editingCard ? 'Edit Material Card' : 'Create Material Card'}
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
                onValueChange={(v) => setForm(prev => ({ ...prev, skill_id: v }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Understanding Fractions"
              />
            </div>

            {/* Core Idea */}
            <div>
              <Label>Core Idea *</Label>
              <Textarea
                value={form.core_idea}
                onChange={(e) => setForm(prev => ({ ...prev, core_idea: e.target.value }))}
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
                    onChange={(e) => updateListItem('key_facts', i, e.target.value)}
                    placeholder={`Fact ${i + 1}`}
                  />
                  {form.key_facts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeListItem('key_facts', i)}
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
                onClick={() => addListItem('key_facts')}
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
                    onChange={(e) => updateListItem('common_mistakes', i, e.target.value)}
                    placeholder={`Mistake ${i + 1}`}
                  />
                  {form.common_mistakes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeListItem('common_mistakes', i)}
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
                onClick={() => addListItem('common_mistakes')}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Mistake
              </Button>
            </div>

            {/* Examples */}
            <div>
              <Label>Examples</Label>
              {form.examples.map((example, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Textarea
                    value={example}
                    onChange={(e) => updateListItem('examples', i, e.target.value)}
                    placeholder={`Example ${i + 1}`}
                    rows={2}
                  />
                  {form.examples.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeListItem('examples', i)}
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
                onClick={() => addListItem('examples')}
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
                  onValueChange={(v) => setForm(prev => ({ ...prev, status: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="brutal-outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCard ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material Card</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The material card will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="brutal-outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog (T-038) */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Sparkles className="h-5 w-5 inline mr-2" />
              Generate Material Cards with AI
            </DialogTitle>
            <DialogDescription>
              Select micro-skills to generate material cards for. Cards will be created as drafts.
            </DialogDescription>
          </DialogHeader>

          {generateResults ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">
                Results: {generateResults.summary?.saved || 0} saved,{' '}
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
                    <span className="truncate">{r.skill_name || r.skill_id}</span>
                    {r.error && <span className="text-destructive text-xs">({r.error})</span>}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsGenerateDialogOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No micro-skills found</p>
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
                {selectedSkillIds.length} skill(s) selected
              </p>
              <DialogFooter>
                <Button variant="brutal-outline" onClick={() => setIsGenerateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating || selectedSkillIds.length === 0}>
                  {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isGenerating ? 'Generating...' : `Generate ${selectedSkillIds.length} Card(s)`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
