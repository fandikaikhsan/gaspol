"use client"

/**
 * Admin Baseline Configuration
 * Phase 8: Admin Console
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Clock, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Edit, Play, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
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

interface BaselineModule {
  id: string
  module_id: string
  checkpoint_order: number
  title: string
  subtitle: string
  estimated_duration_min: number
  is_active: boolean
  module?: {
    id: string
    name: string
    question_count: number
    module_type: string
    is_published: boolean
  }
}

interface Module {
  id: string
  name: string
  question_count: number
  module_type: string
  is_published: boolean
}

export default function AdminBaselinePage() {
  const { toast } = useToast()
  const [baselineModules, setBaselineModules] = useState<BaselineModule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<BaselineModule | null>(null)

  // Available modules
  const [availableModules, setAvailableModules] = useState<Module[]>([])

  // Form data
  const [formData, setFormData] = useState({
    module_id: "",
    title: "",
    subtitle: "",
    estimated_duration_min: 15,
  })

  useEffect(() => {
    loadBaselineModules()
  }, [])

  const loadBaselineModules = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("baseline_modules")
        .select(`
          *,
          module:modules(name, question_count, status)
        `)
        .order("checkpoint_order")

      if (error) throw error

      setBaselineModules(data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load baseline modules. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableModules = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("modules")
        .select("id, name, question_count, module_type, is_published")
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAvailableModules(data || [])
    } catch (error) {
      console.error("Load modules error:", error)
    }
  }

  const openAddDialog = () => {
    setFormData({
      module_id: "",
      title: "",
      subtitle: "",
      estimated_duration_min: 15,
    })
    loadAvailableModules()
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (checkpoint: BaselineModule) => {
    setSelectedCheckpoint(checkpoint)
    setFormData({
      module_id: checkpoint.module_id,
      title: checkpoint.title,
      subtitle: checkpoint.subtitle || "",
      estimated_duration_min: checkpoint.estimated_duration_min || 15,
    })
    loadAvailableModules()
    setIsEditDialogOpen(true)
  }

  const handleAddCheckpoint = async () => {
    if (!formData.module_id || !formData.title) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please select a module and provide a title.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Get next checkpoint order
      const { data: maxOrder } = await supabase
        .from("baseline_modules")
        .select("checkpoint_order")
        .order("checkpoint_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextOrder = (maxOrder?.checkpoint_order || 0) + 1

      const { error } = await supabase.from("baseline_modules").insert({
        module_id: formData.module_id,
        checkpoint_order: nextOrder,
        title: formData.title,
        subtitle: formData.subtitle || null,
        estimated_duration_min: formData.estimated_duration_min,
        is_active: true,
      })

      if (error) throw error

      toast({
        title: "Checkpoint Added!",
        description: "Baseline checkpoint created successfully.",
      })

      setIsAddDialogOpen(false)
      loadBaselineModules()
    } catch (error) {
      console.error("Add error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Add",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCheckpoint = async () => {
    if (!selectedCheckpoint || !formData.title) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide a title.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("baseline_modules")
        .update({
          title: formData.title,
          subtitle: formData.subtitle || null,
          estimated_duration_min: formData.estimated_duration_min,
        })
        .eq("id", selectedCheckpoint.id)

      if (error) throw error

      toast({
        title: "Checkpoint Updated!",
        description: "Changes saved successfully.",
      })

      setIsEditDialogOpen(false)
      loadBaselineModules()
    } catch (error) {
      console.error("Update error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Update",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCheckpoint = async (checkpoint: BaselineModule) => {
    if (!confirm(`Delete checkpoint "${checkpoint.title}"? This will reorder remaining checkpoints.`)) {
      return
    }

    try {
      const supabase = createClient()

      // Delete the checkpoint
      const { error: deleteError } = await supabase
        .from("baseline_modules")
        .delete()
        .eq("id", checkpoint.id)

      if (deleteError) throw deleteError

      // Reorder remaining checkpoints
      const remaining = baselineModules
        .filter((b) => b.id !== checkpoint.id)
        .sort((a, b) => a.checkpoint_order - b.checkpoint_order)

      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("baseline_modules")
          .update({ checkpoint_order: i + 1 })
          .eq("id", remaining[i].id)
      }

      toast({
        title: "Checkpoint Deleted",
        description: "Checkpoint removed and order updated.",
      })

      loadBaselineModules()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description: "Could not delete checkpoint.",
      })
    }
  }

  const handleReorder = async (checkpoint: BaselineModule, direction: "up" | "down") => {
    const currentIndex = baselineModules.findIndex((b) => b.id === checkpoint.id)
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === baselineModules.length - 1)
    ) {
      return
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const targetCheckpoint = baselineModules[targetIndex]

    try {
      const supabase = createClient()

      // Three-step swap to avoid UNIQUE constraint violation
      // Step 1: Set first checkpoint to temporary negative value
      await supabase
        .from("baseline_modules")
        .update({ checkpoint_order: -1 })
        .eq("id", checkpoint.id)

      // Step 2: Update target checkpoint to current's order
      await supabase
        .from("baseline_modules")
        .update({ checkpoint_order: checkpoint.checkpoint_order })
        .eq("id", targetCheckpoint.id)

      // Step 3: Update current checkpoint to target's order
      await supabase
        .from("baseline_modules")
        .update({ checkpoint_order: targetCheckpoint.checkpoint_order })
        .eq("id", checkpoint.id)

      toast({
        title: "Order Updated",
        description: "Checkpoint moved successfully.",
      })

      loadBaselineModules()
    } catch (error) {
      console.error("Reorder error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Reorder",
        description: "Could not update order.",
      })
    }
  }

  const toggleActive = async (checkpointId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("baseline_modules")
        .update({ is_active: !currentStatus })
        .eq("id", checkpointId)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Checkpoint ${!currentStatus ? "activated" : "deactivated"}`,
      })

      loadBaselineModules()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status. Please try again.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading baseline configuration...</p>
      </div>
    )
  }

  const totalDuration = baselineModules.reduce(
    (sum, m) => sum + m.estimated_duration_min,
    0
  )
  const activeCount = baselineModules.filter((m) => m.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Baseline Configuration</h1>
          <p className="text-muted-foreground">
            Configure the baseline assessment flow for new students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Preview Flow
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Checkpoint
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-pastel-pink">
          <CardHeader className="pb-2">
            <CardDescription>Total Checkpoints</CardDescription>
            <CardTitle className="text-4xl">{baselineModules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-mint">
          <CardHeader className="pb-2">
            <CardDescription>Active Checkpoints</CardDescription>
            <CardTitle className="text-4xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-pastel-sky">
          <CardHeader className="pb-2">
            <CardDescription>Total Duration</CardDescription>
            <CardTitle className="text-4xl">{totalDuration}</CardTitle>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardHeader>
        </Card>
      </div>

      {/* Baseline Modules */}
      {baselineModules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No baseline checkpoints configured</p>
            <p className="text-sm text-muted-foreground">
              Run the seed data to create sample baseline configuration
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Baseline Checkpoints</CardTitle>
            <CardDescription>
              Students complete these in order before plan generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {baselineModules.map((baseline, index) => {
                // Calculate actual duration from module questions
                const actualDuration = baseline.module?.question_count
                  ? Math.ceil((baseline.module.question_count * 90) / 60) // Assume 90 seconds per question
                  : baseline.estimated_duration_min

                return (
                  <div
                    key={baseline.id}
                    className={`group relative rounded-2xl border-2 border-charcoal transition-all hover:shadow-brutal ${
                      baseline.is_active ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* Checkpoint Number */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
                        >
                          {baseline.checkpoint_order}
                        </div>
                      </div>

                      {/* Main Content - Horizontal Layout */}
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {/* Title */}
                        <h3 className="font-bold text-base truncate">
                          {baseline.title}
                        </h3>

                        {/* Status Badge */}
                        {baseline.is_active ? (
                          <Badge className="bg-green-500 text-white border-0 flex-shrink-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="border-charcoal flex-shrink-0">
                            Hidden
                          </Badge>
                        )}

                        {/* Divider */}
                        <div className="h-4 w-px bg-gray-300 flex-shrink-0" />

                        {/* Metadata - Inline */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{actualDuration} min</span>
                          </div>

                          {baseline.module && (
                            <>
                              <span className="truncate max-w-[200px]">
                                {baseline.module.name}
                              </span>
                              <span>
                                {baseline.module.question_count} questions
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions - Show on Hover */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Reorder */}
                        <div className="flex items-center gap-1 border-2 border-charcoal rounded-lg bg-white overflow-hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === 0}
                            onClick={() => handleReorder(baseline, "up")}
                            className="h-7 w-7 p-0 rounded-none hover:bg-gray-100 disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <div className="w-px h-4 bg-charcoal" />
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={index === baselineModules.length - 1}
                            onClick={() => handleReorder(baseline, "down")}
                            className="h-7 w-7 p-0 rounded-none hover:bg-gray-100 disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Toggle Visibility */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(baseline.id, baseline.is_active)}
                          className="border-charcoal h-7 px-2"
                          title={baseline.is_active ? "Hide from students" : "Show to students"}
                        >
                          {baseline.is_active ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(baseline)}
                          className="border-charcoal h-7 w-7 p-0"
                          title="Edit checkpoint"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCheckpoint(baseline)}
                          className="text-red-600 hover:bg-red-50 border-red-300 h-7 w-7 p-0"
                          title="Delete checkpoint"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Subtitle - Below if exists */}
                    {baseline.subtitle && (
                      <div className="px-4 pb-3 pt-0">
                        <p className="text-sm text-muted-foreground pl-14">
                          {baseline.subtitle}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900">⚠️ Important</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Checkpoints are completed in sequential order</p>
          <p>• Only active checkpoints are shown to students</p>
          <p>• Students must complete ALL active checkpoints before plan generation</p>
          <p>• Each checkpoint should be 5-10 questions (quick assessment)</p>
          <p>• Total baseline time: ~30-60 minutes recommended</p>
        </CardContent>
      </Card>

      {/* Add Checkpoint Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Baseline Checkpoint</DialogTitle>
            <DialogDescription>
              Create a new checkpoint in the baseline assessment flow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module">
                Module <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.module_id}
                onValueChange={(value) => {
                  const module = availableModules.find((m) => m.id === value)
                  setFormData({
                    ...formData,
                    module_id: value,
                    title: module?.name || "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a published module" />
                </SelectTrigger>
                <SelectContent>
                  {availableModules.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      No published modules available.
                      <br />
                      Publish a module first in Module Management.
                    </div>
                  ) : (
                    availableModules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name} ({module.question_count} questions)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only published modules are shown. Publish modules in Module Management first.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Checkpoint Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Penalaran Umum Assessment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Brief description of what this checkpoint tests"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration_min: parseInt(e.target.value) || 0,
                  })
                }
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCheckpoint} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Checkpoint Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Checkpoint</DialogTitle>
            <DialogDescription>
              Update checkpoint display information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Linked Module</Label>
              <div className="p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                <p className="font-medium">
                  {selectedCheckpoint?.module?.name || "Unknown Module"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedCheckpoint?.module?.question_count || 0} questions
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                To change the module, delete this checkpoint and create a new one
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Checkpoint Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Penalaran Umum Assessment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subtitle">Subtitle (Optional)</Label>
              <Textarea
                id="edit-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Brief description of what this checkpoint tests"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Estimated Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.estimated_duration_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration_min: parseInt(e.target.value) || 0,
                  })
                }
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCheckpoint} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Baseline Flow Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Baseline Assessment Preview</DialogTitle>
            <DialogDescription>
              Student view of the baseline assessment flow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="bg-pastel-sky">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">📊 Baseline Assessment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete these checkpoints to assess your current skill level. This helps us
                  create a personalized learning plan for you.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="font-medium">{activeCount}</span> checkpoints
                  </div>
                  <div>
                    <span className="font-medium">~{totalDuration}</span> minutes total
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {baselineModules
                .filter((b) => b.is_active)
                .map((baseline, index) => (
                  <Card
                    key={baseline.id}
                    className="border-2 border-charcoal hover:shadow-brutal transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-charcoal text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{baseline.title}</h3>
                          {baseline.subtitle && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {baseline.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{baseline.estimated_duration_min} min</span>
                            </div>
                            {baseline.module && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {baseline.module.question_count} questions
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button size="sm" className="mt-1">
                          Start
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {activeCount === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    No active checkpoints. Students won't see any baseline assessment.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
