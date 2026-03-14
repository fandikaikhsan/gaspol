"use client"

/**
 * Admin Campus Scores CRUD
 * T-049: List, search, create, edit, delete campus scores
 * Extended: Import JSON, accordion by university, program cards with TRYOUT fields
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  GraduationCap,
  Save,
  X,
  FileJson,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImportJsonExampleBlock } from "@/components/admin/ImportJsonExampleBlock"
import { campusTemplateJson } from "@/lib/import/templates"

interface CampusScore {
  id: string
  university_id: number | null
  university_name: string
  major: string
  program_id: number | null
  program_type: string | null
  min_score: number
  year: number | null
  source_url: string | null
  verified: boolean
  interest: number | null
  capacity: number | null
  acceptance_rate: number | null
  interest_capacity_error: number | null
  interest_negative_error: number | null
  confidence_level: number | null
  confidence_level_label: string | null
  created_at: string
}

const EMPTY_FORM: Omit<CampusScore, "id" | "created_at"> = {
  university_id: null,
  university_name: "",
  major: "",
  program_id: null,
  program_type: "",
  min_score: 0,
  year: new Date().getFullYear(),
  source_url: "",
  verified: false,
  interest: null,
  capacity: null,
  acceptance_rate: null,
  interest_capacity_error: 0,
  interest_negative_error: 0,
  confidence_level: null,
  confidence_level_label: "",
}

function getConfidenceBadgeClass(label: string | null): string {
  if (!label) return "bg-muted text-muted-foreground"
  switch (label.toLowerCase()) {
    case "superhigh":
      return "bg-primary/20 text-primary border-primary/30"
    case "high":
      return "bg-green-100 text-green-800 border-green-200"
    case "medium":
      return "bg-muted text-muted-foreground"
    case "low":
      return "bg-gray-100 text-gray-600 border-gray-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function AdminCampusPage() {
  const { toast } = useToast()
  const [records, setRecords] = useState<CampusScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<CampusScore | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importJson, setImportJson] = useState("")
  const [importYear, setImportYear] = useState(new Date().getFullYear())
  const [importVerified, setImportVerified] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = createClient()

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    const allRecords: CampusScore[] = []
    const CHUNK_SIZE = 1000

    try {
      let offset = 0
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from("campus_scores")
          .select("*")
          .order("university_name")
          .order("major")
          .range(offset, offset + CHUNK_SIZE - 1)

        if (searchQuery.trim()) {
          query = query.or(
            `university_name.ilike.%${searchQuery}%,major.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query
        if (error) throw error

        const chunk = data || []
        allRecords.push(...chunk)
        hasMore = chunk.length === CHUNK_SIZE
        offset += CHUNK_SIZE
      }

      setRecords(allRecords)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to load campus scores",
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, toast])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const groupedByUniversity = useMemo(() => {
    const groups = new Map<string, CampusScore[]>()
    for (const r of records) {
      const key =
        r.university_id != null
          ? `id-${r.university_id}`
          : `name-${r.university_name}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }
    return Array.from(groups.entries()).map(([key, programs]) => {
      const first = programs[0]
      const universityId =
        first.university_id ?? key.replace("name-", "")
      const verifiedCount = programs.filter((p) => p.verified).length
      const unverifiedCount = programs.length - verifiedCount
      const scores = programs.map((p) => p.min_score).filter((s) => s != null)
      const scoreMin = scores.length ? Math.min(...scores) : null
      const scoreMax = scores.length ? Math.max(...scores) : null
      const scoreRange =
        scoreMin != null && scoreMax != null
          ? scoreMin === scoreMax
            ? String(scoreMin)
            : `${scoreMin}–${scoreMax}`
          : "—"
      return {
        key,
        universityId,
        universityName: first.university_name,
        programs,
        programCount: programs.length,
        verifiedCount,
        unverifiedCount,
        scoreRange,
      }
    })
  }, [records])

  const totalGroups = groupedByUniversity.length
  const totalPages = Math.max(1, Math.ceil(totalGroups / pageSize))
  const effectivePage = Math.min(currentPage, totalPages)
  const paginatedGroups = useMemo(() => {
    const start = (effectivePage - 1) * pageSize
    return groupedByUniversity.slice(start, start + pageSize)
  }, [groupedByUniversity, effectivePage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const handleImport = async () => {
    const trimmed = importJson.trim()
    if (!trimmed) {
      setImportError("Please paste JSON content")
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      setImportError("Invalid JSON")
      return
    }
    const obj = parsed as Record<string, unknown>
    const data = obj.data
    if (!Array.isArray(data) || data.length === 0) {
      setImportError("JSON must have a 'data' array with at least one item")
      return
    }
    setIsImporting(true)
    setImportError(null)
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      const res = await fetch("/api/admin/import-campus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.data?.session?.access_token}`,
        },
        body: JSON.stringify({
          data,
          year: importYear,
          verified: importVerified,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setImportError(result.message || result.error || "Import failed")
        return
      }
      toast({
        title: "Import successful",
        description: `Imported ${result.imported} campus scores for year ${result.year}`,
      })
      setIsImportDialogOpen(false)
      setImportJson("")
      fetchRecords()
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed",
      )
    } finally {
      setIsImporting(false)
    }
  }

  const handleSave = async () => {
    if (
      !form.university_name.trim() ||
      !form.major.trim() ||
      form.min_score <= 0
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "University, major, and min score are required.",
      })
      return
    }
    if (!form.year || form.year < 1900 || form.year > 2100) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Year must be between 1900 and 2100.",
      })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        university_name: form.university_name,
        major: form.major,
        min_score: form.min_score,
        year: form.year,
        source_url: form.source_url || null,
        verified: form.verified,
        university_id: form.university_id,
        program_id: form.program_id,
        program_type: form.program_type || null,
        interest: form.interest,
        capacity: form.capacity,
        acceptance_rate: form.acceptance_rate,
        interest_capacity_error: form.interest_capacity_error ?? 0,
        interest_negative_error: form.interest_negative_error ?? 0,
        confidence_level: form.confidence_level,
        confidence_level_label: form.confidence_level_label || null,
      }
      if (editingId) {
        const { error } = await supabase
          .from("campus_scores")
          .update(payload)
          .eq("id", editingId)
        if (error) throw error
        toast({ title: "Updated", description: "Campus score updated." })
      } else {
        const { error } = await supabase
          .from("campus_scores")
          .insert(payload)
        if (error) throw error
        toast({ title: "Created", description: "Campus score created." })
      }
      setEditingId(null)
      setIsCreating(false)
      setForm(EMPTY_FORM)
      fetchRecords()
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (record: CampusScore) => {
    setRecordToDelete(record)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return
    setIsDeleting(true)
    const { error } = await supabase
      .from("campus_scores")
      .delete()
      .eq("id", recordToDelete.id)
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } else {
      toast({ title: "Deleted", description: "Campus score removed." })
      setRecordToDelete(null)
      fetchRecords()
    }
    setIsDeleting(false)
  }

  const startEdit = (record: CampusScore) => {
    setEditingId(record.id)
    setIsCreating(false)
    setForm({
      university_id: record.university_id,
      university_name: record.university_name,
      major: record.major,
      program_id: record.program_id,
      program_type: record.program_type ?? "",
      min_score: record.min_score,
      year: record.year,
      source_url: record.source_url,
      verified: record.verified,
      interest: record.interest,
      capacity: record.capacity,
      acceptance_rate: record.acceptance_rate,
      interest_capacity_error: record.interest_capacity_error ?? 0,
      interest_negative_error: record.interest_negative_error ?? 0,
      confidence_level: record.confidence_level,
      confidence_level_label: record.confidence_level_label ?? "",
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5" /> Campus Scores
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage university target scores for students
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsImportDialogOpen(true)
              setImportJson("")
              setImportError(null)
              setImportYear(new Date().getFullYear())
              setImportVerified(false)
            }}
          >
            <FileJson className="w-4 h-4 mr-2" /> Import JSON
          </Button>
          <Button
            onClick={() => {
              setIsCreating(true)
              setEditingId(null)
              setForm(EMPTY_FORM)
            }}
            disabled={isCreating}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Campus
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Campus Score"
        description={
          recordToDelete
            ? `Delete ${recordToDelete.university_name} – ${recordToDelete.major}?`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Import Campus from JSON
            </DialogTitle>
            <DialogDescription>
              Paste campus JSON (from docs/generated/campus.json). Use the
              &quot;data&quot; array. Metadata is for reference only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ImportJsonExampleBlock
              template={campusTemplateJson}
              label="Example template"
              onUseAsInput={() => setImportJson(campusTemplateJson)}
            />
            <div className="space-y-2">
              <Label htmlFor="import-campus-json">Campus JSON</Label>
              <Textarea
                id="import-campus-json"
                value={importJson}
                onChange={(e) => {
                  setImportJson(e.target.value)
                  setImportError(null)
                }}
                placeholder='{"metadata": {...}, "data": [{"university_id": 341, "university_name": "...", "program_id": 341001, "program_name": "...", ...}]}'
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="import-year">Year *</Label>
                <Input
                  id="import-year"
                  type="number"
                  min={1900}
                  max={2100}
                  value={importYear}
                  onChange={(e) =>
                    setImportYear(Number(e.target.value) || new Date().getFullYear())
                  }
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importVerified}
                    onChange={(e) => setImportVerified(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Verified</span>
                </label>
              </div>
            </div>
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search + Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search university or program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Show
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            per page
          </span>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={effectivePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 min-w-[80px] text-center">
              {totalGroups > 0
                ? `${(effectivePage - 1) * pageSize + 1}-${Math.min(effectivePage * pageSize, totalGroups)} of ${totalGroups}`
                : "0 of 0"}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={effectivePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Campus Score" : "New Campus Score"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>University Name *</Label>
                <Input
                  value={form.university_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, university_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>University ID</Label>
                <Input
                  type="number"
                  value={form.university_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      university_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Major / Program *</Label>
                <Input
                  value={form.major}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, major: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Program ID</Label>
                <Input
                  type="number"
                  value={form.program_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      program_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Program Type</Label>
                <Input
                  value={form.program_type ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      program_type: e.target.value || null,
                    }))
                  }
                  placeholder="e.g. Sarjana, Sarjana Terapan"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Score *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.min_score}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      min_score: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={form.year ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Source URL</Label>
                <Input
                  value={form.source_url ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, source_url: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Interest</Label>
                <Input
                  type="number"
                  value={form.interest ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      interest: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={form.capacity ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacity: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Acceptance Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.acceptance_rate ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      acceptance_rate: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.confidence_level ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      confidence_level: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Confidence Label</Label>
                <Input
                  value={form.confidence_level_label ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      confidence_level_label: e.target.value || null,
                    }))
                  }
                  placeholder="low, medium, high, superhigh"
                />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.verified}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, verified: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <Label>Verified</Label>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="brutal-outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records: Accordion by university */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-muted animate-skeleton-pulse"
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold">No campus scores yet</p>
            <p className="text-muted-foreground text-sm">
              Add your first campus score or import from JSON.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-1.5">
          {paginatedGroups.map((group) => (
            <AccordionItem
              key={group.key}
              value={group.key}
              className="border border-border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="font-semibold text-sm">{group.universityName}</span>
                  {group.programs[0]?.university_id != null && (
                    <Badge variant="outline" className="text-xs">
                      ID: {group.universityId}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {group.programCount} programs
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    ✓ {group.verifiedCount} / ✗ {group.unverifiedCount}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    Score: {group.scoreRange}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2.5 pb-2.5 space-y-1.5">
                {group.programs.map((r) => (
                  <Card
                    key={r.id}
                    className="hover:shadow-brutal-sm transition-shadow"
                  >
                    <CardContent className="py-2 px-3 flex items-center justify-between gap-3 flex-wrap text-sm">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {r.program_id != null && (
                            <span className="text-xs text-muted-foreground">
                              #{r.program_id}
                            </span>
                          )}
                          <span className="font-medium">{r.major}</span>
                          {r.program_type && (
                            <Badge variant="outline" className="text-xs">
                              {r.program_type}
                            </Badge>
                          )}
                          {r.confidence_level_label && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getConfidenceBadgeClass(r.confidence_level_label)}`}
                            >
                              {r.confidence_level_label}
                            </Badge>
                          )}
                          {r.verified ? (
                            <Badge
                              variant="outline"
                              className="text-status-strong border-status-strong text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Score: {r.min_score}</span>
                          {r.interest != null && r.capacity != null && (
                            <span>
                              Interest/Cap: {r.interest} / {r.capacity}
                            </span>
                          )}
                          {r.acceptance_rate != null && (
                            <span>
                              Accept: {r.acceptance_rate}%
                            </span>
                          )}
                          {(r.interest_capacity_error === 1 ||
                            r.interest_negative_error === 1) && (
                            <span className="text-destructive font-medium">
                              {r.interest_capacity_error === 1 && "overcapacity"}
                              {r.interest_capacity_error === 1 &&
                                r.interest_negative_error === 1 &&
                                " · "}
                              {r.interest_negative_error === 1 &&
                                "interest invalid"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(r)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(r)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
