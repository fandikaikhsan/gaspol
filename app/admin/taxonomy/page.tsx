"use client"

/**
 * Admin Taxonomy Management
 * Phase 8: Admin Console
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, ChevronRight, ChevronDown } from "lucide-react"

interface TaxonomyNode {
  id: string
  parent_id: string | null
  level: number
  code: string
  name: string
  description: string
  position: number
  children?: TaxonomyNode[]
}

export default function AdminTaxonomyPage() {
  const { toast } = useToast()
  const [nodes, setNodes] = useState<TaxonomyNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTaxonomy()
  }, [])

  const loadTaxonomy = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("taxonomy_nodes")
        .select("*")
        .order("position")

      if (error) throw error

      // Build tree structure
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

    // Create map of all nodes
    flatNodes.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    // Build tree
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
          )} cursor-pointer hover:shadow-brutal transition-shadow`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4" />
          )}

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Taxonomy Tree</CardTitle>
          <CardDescription>
            Click nodes to expand/collapse. Structure: Subject → Subtest → Topic → Subtopic → Micro-skill
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No taxonomy nodes found</p>
              <p className="text-sm text-muted-foreground">
                Run the seed data to create sample taxonomy
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {nodes.map((node) => renderNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

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
