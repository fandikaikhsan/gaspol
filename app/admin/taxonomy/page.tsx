"use client"

/**
 * Admin Taxonomy Management with CRUD
 * Complete add/edit/delete functionality
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, ChevronRight, ChevronDown, Edit, Trash2, Loader2, Sparkles } from "lucide-react"
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

interface TaxonomyNode {
  id: string
  parent_id: string | null
  level: number
  code: string
  name: string
  description: string
  position: number
  exam_id: string | null
  children?: TaxonomyNode[]
}

interface Exam {
  id: string
  name: string
}

interface Suggestion {
  name: string
  code: string
  description: string
  rationale: string
}

export default function AdminTaxonomyPage() {
  const { toast } = useToast()
  const [nodes, setNodes] = useState<TaxonomyNode[]>([])
  const [flatNodes, setFlatNodes] = useState<TaxonomyNode[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Bulk generation state
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isGeneratingTree, setIsGeneratingTree] = useState(false)
  const [generatedTree, setGeneratedTree] = useState<any[]>([])
  const [selectedTreeNodes, setSelectedTreeNodes] = useState<Set<string>>(new Set())
  const [isSavingBulk, setIsSavingBulk] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: null as string | null,
    level: 1,
    exam_id: null as string | null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load exams
      const { data: examsData } = await supabase
        .from("exams")
        .select("id, name")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      setExams(examsData || [])

      // Load taxonomy
      const { data, error } = await supabase
        .from("taxonomy_nodes")
        .select("*")
        .order("position")

      if (error) throw error

      setFlatNodes(data || [])
      const tree = buildTree(data || [])
      setNodes(tree)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load taxonomy. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const buildTree = (flatNodes: TaxonomyNode[]): TaxonomyNode[] => {
    const nodeMap = new Map<string, TaxonomyNode>()
    const roots: TaxonomyNode[] = []

    flatNodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    flatNodes.forEach((node) => {
      const treeNode = nodeMap.get(node.id)!
      if (node.parent_id === null) {
        roots.push(treeNode)
      } else {
        const parent = nodeMap.get(node.parent_id)
        if (parent) {
          parent.children!.push(treeNode)
        }
      }
    })

    return roots
  }

  const openAddDialog = (parentNode?: TaxonomyNode) => {
    const newLevel = parentNode ? parentNode.level + 1 : 1

    if (newLevel > 5) {
      toast({
        variant: "destructive",
        title: "Maximum Level Reached",
        description: "Cannot add nodes beyond level 5 (Micro-skill).",
      })
      return
    }

    setFormData({
      name: "",
      code: "",
      description: "",
      parent_id: parentNode?.id || null,
      level: newLevel,
      exam_id: parentNode?.exam_id || (exams[0]?.id || null),
    })
    setDialogMode("add")
    setSelectedNode(null)
    setSuggestions([])
    setShowSuggestions(false)
    setIsDialogOpen(true)
  }

  const openEditDialog = (node: TaxonomyNode) => {
    setFormData({
      name: node.name,
      code: node.code,
      description: node.description || "",
      parent_id: node.parent_id,
      level: node.level,
      exam_id: node.exam_id,
    })
    setDialogMode("edit")
    setSelectedNode(node)
    setSuggestions([])
    setShowSuggestions(false)
    setIsDialogOpen(true)
  }

  const getSuggestions = async () => {
    if (!formData.exam_id) {
      toast({
        variant: "destructive",
        title: "No Exam Selected",
        description: "Please select an exam first.",
      })
      return
    }

    setIsLoadingSuggestions(true)

    try {
      const supabase = createClient()
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/admin/suggest-taxonomy-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          exam_id: formData.exam_id,
          parent_id: formData.parent_id,
          level: formData.level,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to suggest taxonomy node')

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        setShowSuggestions(true)
        toast({
          title: "Suggestions Ready!",
          description: `Found ${data.suggestions.length} suggestions. Click to use.`,
        })
      } else {
        throw new Error("No suggestions returned")
      }
    } catch (error) {
      console.error("Suggestion error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Get Suggestions",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const applySuggestion = (suggestion: Suggestion) => {
    setFormData({
      ...formData,
      name: suggestion.name,
      code: suggestion.code,
      description: suggestion.description,
    })
    setShowSuggestions(false)
    toast({
      title: "Suggestion Applied",
      description: "You can edit the details before saving.",
    })
  }

  const generateTaxonomyTree = async () => {
    // Get the primary exam
    const primaryExam = exams.find(e => e.id === formData.exam_id) || exams[0]

    if (!primaryExam) {
      toast({
        variant: "destructive",
        title: "No Exam Found",
        description: "Please create an exam first.",
      })
      return
    }

    setIsGeneratingTree(true)
    setIsBulkDialogOpen(true)

    try {
      const supabase = createClient()
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const response = await fetch('/api/admin/generate-taxonomy-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ exam_id: primaryExam.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate taxonomy tree')

      if (data.success && data.tree) {
        setGeneratedTree(data.tree)
        toast({
          title: "Taxonomy Generated!",
          description: `Found ${data.tree.length} subjects. Select nodes to add.`,
        })
      } else {
        throw new Error("No tree generated")
      }
    } catch (error) {
      console.error("Tree generation error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Generate Tree",
        description: error instanceof Error ? error.message : "Please try again.",
      })
      setIsBulkDialogOpen(false)
    } finally {
      setIsGeneratingTree(false)
    }
  }

  const toggleTreeNode = (nodeId: string) => {
    const newSelected = new Set(selectedTreeNodes)
    if (newSelected.has(nodeId)) {
      newSelected.delete(nodeId)
    } else {
      newSelected.add(nodeId)
    }
    setSelectedTreeNodes(newSelected)
  }

  const selectAllTreeNodes = () => {
    const allIds = new Set<string>()
    generatedTree.forEach((subject: any) => {
      allIds.add(`subject-${subject.code}`)
      subject.subtests?.forEach((subtest: any) => {
        allIds.add(`subtest-${subtest.code}`)
      })
    })
    setSelectedTreeNodes(allIds)
  }

  const deselectAllTreeNodes = () => {
    setSelectedTreeNodes(new Set())
  }

  const saveBulkNodes = async () => {
    if (selectedTreeNodes.size === 0) {
      toast({
        variant: "destructive",
        title: "No Nodes Selected",
        description: "Please select at least one node to add.",
      })
      return
    }

    setIsSavingBulk(true)

    try {
      const supabase = createClient()
      const primaryExam = exams.find(e => e.id === formData.exam_id) || exams[0]

      // Prepare nodes to insert
      const nodesToInsert: any[] = []
      let position = 0

      for (const subject of generatedTree) {
        const subjectId = `subject-${subject.code}`

        if (selectedTreeNodes.has(subjectId)) {
          // Insert subject (Level 1)
          const subjectNode = {
            name: subject.name,
            code: subject.code,
            description: subject.description,
            parent_id: null,
            level: 1,
            exam_id: primaryExam.id,
            position: position++,
            is_active: true,
            temp_id: subjectId, // For reference when inserting subtests
          }
          nodesToInsert.push(subjectNode)
        }
      }

      // Insert subjects first
      const { data: insertedSubjects, error: subjectError } = await supabase
        .from("taxonomy_nodes")
        .insert(nodesToInsert.map(({ temp_id, ...node }) => node))
        .select()

      if (subjectError) throw subjectError

      // Now insert subtests
      const subtestNodes: any[] = []
      let subtestPosition = 0

      for (let i = 0; i < generatedTree.length; i++) {
        const subject = generatedTree[i]
        const subjectId = `subject-${subject.code}`

        if (selectedTreeNodes.has(subjectId) && subject.subtests) {
          const insertedSubject = insertedSubjects![i]

          for (const subtest of subject.subtests) {
            const subtestId = `subtest-${subtest.code}`

            if (selectedTreeNodes.has(subtestId)) {
              subtestNodes.push({
                name: subtest.name,
                code: subtest.code,
                description: subtest.description,
                parent_id: insertedSubject.id,
                level: 2,
                exam_id: primaryExam.id,
                position: subtestPosition++,
                is_active: true,
              })
            }
          }
        }
      }

      if (subtestNodes.length > 0) {
        const { error: subtestError } = await supabase
          .from("taxonomy_nodes")
          .insert(subtestNodes)

        if (subtestError) throw subtestError
      }

      toast({
        title: "Nodes Added!",
        description: `Successfully added ${nodesToInsert.length} subjects and ${subtestNodes.length} subtests.`,
      })

      // Close dialog and refresh
      setIsBulkDialogOpen(false)
      setSelectedTreeNodes(new Set())
      setGeneratedTree([])
      loadData()
    } catch (error) {
      console.error("Bulk save error:", error)
      toast({
        variant: "destructive",
        title: "Failed to Save Nodes",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setIsSavingBulk(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Name and code are required.",
      })
      return
    }

    setIsSaving(true)

    try {
      const supabase = createClient()

      if (dialogMode === "add") {
        // Get max position for ordering
        const { data: maxPosData } = await supabase
          .from("taxonomy_nodes")
          .select("position")
          .eq("parent_id", formData.parent_id)
          .order("position", { ascending: false })
          .limit(1)

        const nextPosition = maxPosData && maxPosData[0] ? maxPosData[0].position + 1 : 0

        const { error } = await supabase.from("taxonomy_nodes").insert({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          parent_id: formData.parent_id,
          level: formData.level,
          exam_id: formData.exam_id,
          position: nextPosition,
          is_active: true,
        })

        if (error) throw error

        toast({
          title: "Node Created",
          description: `${formData.name} has been added to the taxonomy.`,
        })
      } else {
        // Edit mode
        const { error } = await supabase
          .from("taxonomy_nodes")
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description,
          })
          .eq("id", selectedNode!.id)

        if (error) throw error

        toast({
          title: "Node Updated",
          description: `${formData.name} has been updated.`,
        })
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save node.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (node: TaxonomyNode) => {
    const hasChildren = node.children && node.children.length > 0

    if (hasChildren) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: "Please delete child nodes first.",
      })
      return
    }

    if (!confirm(`Delete "${node.name}"? This cannot be undone.`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("taxonomy_nodes").delete().eq("id", node.id)

      if (error) throw error

      toast({
        title: "Node Deleted",
        description: `${node.name} has been removed.`,
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete node.",
      })
    }
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const getLevelLabel = (level: number) => {
    const labels = ["", "Subject", "Subtest", "Topic", "Subtopic", "Micro-skill"]
    return labels[level] || "Unknown"
  }

  const getLevelColor = (level: number) => {
    const colors = [
      "",
      "bg-pastel-pink",
      "bg-pastel-lavender",
      "bg-pastel-mint",
      "bg-pastel-peach",
      "bg-pastel-sky",
    ]
    return colors[level] || "bg-gray-200"
  }

  const renderNode = (node: TaxonomyNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)

    return (
      <div key={node.id} className="mb-2">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border-2 border-charcoal ${getLevelColor(
            node.level
          )} hover:shadow-brutal transition-shadow`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div onClick={() => hasChildren && toggleNode(node.id)} className="cursor-pointer">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getLevelLabel(node.level)}
              </Badge>
              <span className="font-bold">{node.name}</span>
              <span className="text-xs text-muted-foreground">({node.code})</span>
            </div>
            {node.description && (
              <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            {node.level < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openAddDialog(node)
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openEditDialog(node)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(node)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading taxonomy...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Taxonomy Management</h1>
          <p className="text-muted-foreground">
            Manage the hierarchical content structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateTaxonomyTree} disabled={exams.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Nodes
          </Button>
          <Button onClick={() => openAddDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Root Node
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taxonomy Tree</CardTitle>
          <CardDescription>
            Click + to add children, edit icon to modify, trash to delete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No taxonomy nodes found</p>
              <Button onClick={() => openAddDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Node
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {nodes.map((node) => renderNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add New Node" : "Edit Node"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? `Adding a ${getLevelLabel(formData.level)} node`
                : `Editing ${selectedNode?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogMode === "add" && formData.level === 1 && (
              <div className="space-y-2">
                <Label htmlFor="exam_id">Exam</Label>
                <Select
                  value={formData.exam_id || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, exam_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AI Suggestions */}
            {dialogMode === "add" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>AI Suggestions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getSuggestions}
                    disabled={isLoadingSuggestions || !formData.exam_id}
                  >
                    {isLoadingSuggestions ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Getting suggestions...
                      </>
                    ) : (
                      <>
                        ✨ Get Suggestions
                      </>
                    )}
                  </Button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="space-y-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Click a suggestion to use it:
                    </p>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        className="w-full text-left p-3 bg-white hover:bg-blue-100 border-2 border-charcoal rounded-lg transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold">{suggestion.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.code}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {suggestion.description}
                            </p>
                            <p className="text-xs text-blue-600">
                              💡 {suggestion.rationale}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`e.g., ${
                  formData.level === 1
                    ? "Penalaran Umum"
                    : formData.level === 2
                    ? "Matematika"
                    : "Topic name"
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., PU-MAT-ALG"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "add" ? "Create Node" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Generation Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Taxonomy Nodes
            </DialogTitle>
            <DialogDescription>
              AI-generated subjects and subtests. Select which nodes to add to your taxonomy.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isGeneratingTree ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Generating complete taxonomy tree...
                  </p>
                </div>
              </div>
            ) : generatedTree.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No nodes generated yet.</p>
              </div>
            ) : (
              <>
                {/* Selection Controls */}
                <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    {selectedTreeNodes.size} nodes selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllTreeNodes}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllTreeNodes}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Hierarchical Tree Display */}
                <div className="space-y-4">
                  {generatedTree.map((subject: any) => {
                    const subjectId = `subject-${subject.code}`
                    const isSubjectSelected = selectedTreeNodes.has(subjectId)

                    return (
                      <div
                        key={subjectId}
                        className="border-2 border-charcoal rounded-lg overflow-hidden"
                      >
                        {/* Subject Level */}
                        <div
                          onClick={() => toggleTreeNode(subjectId)}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSubjectSelected
                              ? "bg-pastel-pink border-b-2 border-charcoal"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSubjectSelected}
                              onChange={() => toggleTreeNode(subjectId)}
                              className="mt-1 h-4 w-4 rounded border-charcoal"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-pastel-pink">Level 1</Badge>
                                <span className="font-bold">{subject.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {subject.code}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {subject.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Subtests Level */}
                        {subject.subtests && subject.subtests.length > 0 && (
                          <div className="bg-gray-50 p-2 space-y-2">
                            {subject.subtests.map((subtest: any) => {
                              const subtestId = `subtest-${subtest.code}`
                              const isSubtestSelected = selectedTreeNodes.has(subtestId)

                              return (
                                <div
                                  key={subtestId}
                                  onClick={() => toggleTreeNode(subtestId)}
                                  className={`p-3 rounded-lg cursor-pointer transition-colors border-2 ${
                                    isSubtestSelected
                                      ? "bg-pastel-lavender border-charcoal"
                                      : "bg-white border-gray-200 hover:border-charcoal"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSubtestSelected}
                                      onChange={() => toggleTreeNode(subtestId)}
                                      className="mt-1 h-4 w-4 rounded border-charcoal"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-pastel-lavender">Level 2</Badge>
                                        <span className="font-medium">{subtest.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {subtest.code}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {subtest.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkDialogOpen(false)
                setSelectedTreeNodes(new Set())
              }}
              disabled={isSavingBulk}
            >
              Cancel
            </Button>
            <Button
              onClick={saveBulkNodes}
              disabled={selectedTreeNodes.size === 0 || isSavingBulk}
            >
              {isSavingBulk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Selected Nodes ({selectedTreeNodes.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Taxonomy Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-pastel-pink">Level 1</Badge>
            <span>Subject (e.g., Penalaran Umum)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-pastel-lavender">Level 2</Badge>
            <span>Subtest (e.g., Matematika)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-pastel-mint">Level 3</Badge>
            <span>Topic (e.g., Aljabar)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-pastel-peach">Level 4</Badge>
            <span>Subtopic (e.g., Persamaan Linear)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-pastel-sky">Level 5</Badge>
            <span>Micro-skill (e.g., Solving Linear Equations)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
