"use client"

/**
 * Chip-based taxonomy filter: Exam → L1 → L2 → L3 → L4 → L5
 * Chips flow left to right. Remove a chip to narrow the filter to that level.
 */
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaxonomyNodeBasic {
  id: string
  parent_id: string | null
  level: number
  code: string
  name: string
  exam_id: string | null
  position?: number
}

interface ExamBasic {
  id: string
  name: string
}

interface PathSegment {
  type: "exam" | "l1" | "l2" | "l3" | "l4" | "l5"
  id: string
  label: string
}

export interface TaxonomyFilterChipsProps {
  value: string | null
  onChange: (nodeId: string | null) => void
  placeholder?: string
}

export function TaxonomyFilterChips({
  value,
  onChange,
  placeholder = "Select exam, then drill down…",
}: TaxonomyFilterChipsProps) {
  const [exams, setExams] = useState<ExamBasic[]>([])
  const [nodes, setNodes] = useState<TaxonomyNodeBasic[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadExams = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("exams")
      .select("id, name")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    setExams(data || [])
  }, [])

  const loadTaxonomy = useCallback(async (examIds: string[]) => {
    if (examIds.length === 0) {
      setNodes([])
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from("taxonomy_nodes")
      .select("id, parent_id, level, code, name, exam_id, position")
      .eq("is_active", true)
      .in("exam_id", examIds)
      .order("level")
      .order("position")
    setNodes(data || [])
  }, [])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  useEffect(() => {
    loadTaxonomy(exams.map((e) => e.id))
  }, [exams, loadTaxonomy])

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const byParent = new Map<string | null, TaxonomyNodeBasic[]>()
  for (const n of nodes) {
    const key = n.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(n)
  }

  // Build path from value (taxonomy node ID) or from selectedExamId when building up
  const path: PathSegment[] = []
  if (value) {
    const n = nodeMap.get(value)
    if (n) {
      const chain: TaxonomyNodeBasic[] = []
      let curr: TaxonomyNodeBasic | undefined = n
      while (curr) {
        chain.unshift(curr)
        curr = curr.parent_id ? nodeMap.get(curr.parent_id) : undefined
      }
      const l1 = chain[0]
      const exam = l1?.exam_id ? exams.find((e) => e.id === l1.exam_id) : null
      if (exam) {
        path.push({ type: "exam", id: exam.id, label: exam.name })
      }
      const levelLabels = ["l1", "l2", "l3", "l4", "l5"] as const
      chain.forEach((node, i) => {
        path.push({
          type: levelLabels[i] ?? "l5",
          id: node.id,
          label: `${node.name} (${node.code})`,
        })
      })
    }
  } else if (selectedExamId) {
    const exam = exams.find((e) => e.id === selectedExamId)
    if (exam) {
      path.push({ type: "exam", id: exam.id, label: exam.name })
    }
  }

  const handleRemoveChip = (index: number) => {
    const segment = path[index]
    if (segment.type === "exam") {
      onChange(null)
      setSelectedExamId(null)
      return
    }
    if (segment.type === "l1") {
      onChange(null)
      setSelectedExamId(path[0].id)
      return
    }
    onChange(path[index - 1].id)
  }

  const nextLevelOptions: { id: string; label: string }[] = []
  let nextLevelLabel = "Select…"
  if (path.length === 0) {
    nextLevelLabel = "Select exam"
    nextLevelOptions.push(...exams.map((e) => ({ id: `exam:${e.id}`, label: e.name })))
  } else if (path.length === 1) {
    nextLevelLabel = "Select L1"
    const l1Nodes = (byParent.get(null) || []).filter((n) => n.exam_id === path[0].id)
    nextLevelOptions.push(...l1Nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((n) => ({ id: n.id, label: `${n.name} (${n.code})` })))
  } else {
    const lastNodeId = path[path.length - 1].id
    const children = (byParent.get(lastNodeId) || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    if (children.length > 0) {
      const levelNum = path.length
      nextLevelLabel = `Add L${levelNum}`
      nextLevelOptions.push(...children.map((n) => ({ id: n.id, label: `${n.name} (${n.code})` })))
    }
  }

  const handleNextLevelSelect = (selectedId: string) => {
    if (selectedId.startsWith("exam:")) {
      const examId = selectedId.slice(5)
      setSelectedExamId(exams.find((e) => e.id === examId) ? examId : null)
      return
    }
    setSelectedExamId(null)
    onChange(selectedId)
  }

  useEffect(() => {
    setIsLoading(false)
  }, [exams, nodes])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Loading taxonomy…
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Taxonomy (Exam → L1 → L2 → …)</Label>
      <div className="flex flex-wrap items-center gap-2">
        {path.map((seg, i) => (
          <Chip
            key={`${seg.type}-${seg.id}`}
            label={seg.label}
            onRemove={() => handleRemoveChip(i)}
          />
        ))}
        {nextLevelOptions.length > 0 && (
          <Select
            value=""
            onValueChange={handleNextLevelSelect}
          >
            <SelectTrigger
              className={cn(
                "h-9 w-auto min-w-[140px]",
                path.length === 0 && "min-w-[200px]"
              )}
            >
              <SelectValue placeholder={nextLevelLabel} />
            </SelectTrigger>
            <SelectContent>
              {nextLevelOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {path.length === 0 && nextLevelOptions.length === 0 && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>
    </div>
  )
}

function Chip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-secondary px-3 py-1 text-sm font-medium">
      <span className="max-w-[180px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 -mr-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
        aria-label="Remove filter"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
