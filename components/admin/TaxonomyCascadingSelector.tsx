"use client"

/**
 * Cascading taxonomy selector: Exam -> L1 -> L2 -> L3 -> L4 -> L5
 * Used for filtering questions and linking questions to micro-skills (L5 only).
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

export interface TaxonomyNodeBasic {
  id: string
  parent_id: string | null
  level: number
  code: string
  name: string
  exam_id: string | null
  position?: number
}

export interface ExamBasic {
  id: string
  name: string
}

export interface TaxonomyCascadingSelectorProps {
  value: string | null
  onChange: (nodeId: string | null) => void
  required?: boolean
  examId?: string | null
  placeholder?: string
  /** When true, final selection is L5 only (for question linking) */
  l5Only?: boolean
}

export function TaxonomyCascadingSelector({
  value,
  onChange,
  required = false,
  examId: initialExamId,
  placeholder = "Select...",
  l5Only = true,
}: TaxonomyCascadingSelectorProps) {
  const [exams, setExams] = useState<ExamBasic[]>([])
  const [nodes, setNodes] = useState<TaxonomyNodeBasic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedExamId, setSelectedExamId] = useState<string | null>(initialExamId ?? null)
  const [selectedL1, setSelectedL1] = useState<string | null>(null)
  const [selectedL2, setSelectedL2] = useState<string | null>(null)
  const [selectedL3, setSelectedL3] = useState<string | null>(null)
  const [selectedL4, setSelectedL4] = useState<string | null>(null)
  const [selectedL5, setSelectedL5] = useState<string | null>(value)

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
    if (selectedExamId) {
      loadTaxonomy([selectedExamId])
    } else {
      setNodes([])
    }
  }, [selectedExamId, loadTaxonomy])

  // Build lookup maps
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const byParent = new Map<string | null, TaxonomyNodeBasic[]>()
  for (const n of nodes) {
    const key = n.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(n)
  }

  const l1Nodes = (byParent.get(null) || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const l2Nodes = selectedL1 ? (byParent.get(selectedL1) || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []
  const l3Nodes = selectedL2 ? (byParent.get(selectedL2) || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []
  const l4Nodes = selectedL3 ? (byParent.get(selectedL3) || []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []
  const l5Nodes = selectedL4 ? (byParent.get(selectedL4) || []).filter((n) => n.level === 5).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []

  // Resolve path from value (node ID at any level) to pre-select cascading state
  useEffect(() => {
    if (!value || nodes.length === 0) return
    const n = nodeMap.get(value)
    if (!n) return
    const path: string[] = []
    let curr: TaxonomyNodeBasic | undefined = n
    while (curr) {
      path.unshift(curr.id)
      curr = curr.parent_id ? nodeMap.get(curr.parent_id) : undefined
    }
    if (path.length < 1) return
    const l1Node = nodeMap.get(path[0])
    if (l1Node?.exam_id) setSelectedExamId(l1Node.exam_id)
    setSelectedL1(path[0])
    setSelectedL2(path[1] || null)
    setSelectedL3(path[2] || null)
    setSelectedL4(path[3] || null)
    setSelectedL5(path[4] || null)
  }, [value, nodes])

  const handleExamChange = (id: string | null) => {
    setSelectedExamId(id)
    setSelectedL1(null)
    setSelectedL2(null)
    setSelectedL3(null)
    setSelectedL4(null)
    setSelectedL5(null)
    onChange(null)
  }

  const handleL1Change = (id: string | null) => {
    setSelectedL1(id)
    setSelectedL2(null)
    setSelectedL3(null)
    setSelectedL4(null)
    setSelectedL5(null)
    onChange(l5Only ? null : id)
  }

  const handleL2Change = (id: string | null) => {
    setSelectedL2(id)
    setSelectedL3(null)
    setSelectedL4(null)
    setSelectedL5(null)
    onChange(l5Only ? null : id)
  }

  const handleL3Change = (id: string | null) => {
    setSelectedL3(id)
    setSelectedL4(null)
    setSelectedL5(null)
    onChange(l5Only ? null : id)
  }

  const handleL4Change = (id: string | null) => {
    setSelectedL4(id)
    setSelectedL5(null)
    onChange(l5Only ? null : id)
  }

  const handleL5Change = (id: string | null) => {
    setSelectedL5(id)
    onChange(id)
  }

  useEffect(() => {
    if (initialExamId && !value) setSelectedExamId(initialExamId)
  }, [initialExamId, value])

  useEffect(() => {
    setIsLoading(false)
  }, [exams, nodes])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Exam {required && <span className="text-red-500">*</span>}</Label>
        <Select value={selectedExamId || ""} onValueChange={(v) => handleExamChange(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedExamId && (
        <>
          <div className="space-y-2">
            <Label>L1 – Subject {required && <span className="text-red-500">*</span>}</Label>
            <Select value={selectedL1 || ""} onValueChange={(v) => handleL1Change(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {l1Nodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name} ({n.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedL1 && (
            <div className="space-y-2">
              <Label>L2 – Subtest</Label>
              <Select value={selectedL2 || ""} onValueChange={(v) => handleL2Change(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {l2Nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedL2 && (
            <div className="space-y-2">
              <Label>L3 – Topic</Label>
              <Select value={selectedL3 || ""} onValueChange={(v) => handleL3Change(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {l3Nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedL3 && (
            <div className="space-y-2">
              <Label>L4 – Subtopic</Label>
              <Select value={selectedL4 || ""} onValueChange={(v) => handleL4Change(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {l4Nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedL4 && l5Only && (
            <div className="space-y-2">
              <Label>L5 – Micro-skill {required && <span className="text-red-500">*</span>}</Label>
              <Select value={selectedL5 || ""} onValueChange={(v) => handleL5Change(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {l5Nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedL4 && !l5Only && (
            <div className="space-y-2">
              <Label>L5 – Micro-skill (optional)</Label>
              <Select value={selectedL5 || ""} onValueChange={(v) => handleL5Change(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select to narrow filter" />
                </SelectTrigger>
                <SelectContent>
                  {l5Nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  )
}
