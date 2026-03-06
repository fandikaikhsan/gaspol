"use client"

/**
 * Admin Campus Scores CRUD
 * T-049: List, search, create, edit, delete campus scores
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
} from "lucide-react"
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog"

interface CampusScore {
  id: string
  university_name: string
  major: string
  min_score: number
  year: number | null
  source_url: string | null
  verified: boolean
  created_at: string
}

const EMPTY_FORM: Omit<CampusScore, "id" | "created_at"> = {
  university_name: "",
  major: "",
  min_score: 0,
  year: new Date().getFullYear(),
  source_url: "",
  verified: false,
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

  const supabase = createClient()

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    let query = supabase
      .from("campus_scores")
      .select("*")
      .order("university_name")

    if (searchQuery.trim()) {
      query = query.or(
        `university_name.ilike.%${searchQuery}%,major.ilike.%${searchQuery}%`,
      )
    }

    const { data, error } = await query.limit(100)
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
    setRecords(data || [])
    setIsLoading(false)
  }, [searchQuery])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

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
    setIsSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from("campus_scores")
          .update({
            university_name: form.university_name,
            major: form.major,
            min_score: form.min_score,
            year: form.year,
            source_url: form.source_url || null,
            verified: form.verified,
          })
          .eq("id", editingId)
        if (error) throw error
        toast({ title: "Updated", description: "Campus score updated." })
      } else {
        const { error } = await supabase.from("campus_scores").insert({
          university_name: form.university_name,
          major: form.major,
          min_score: form.min_score,
          year: form.year,
          source_url: form.source_url || null,
          verified: form.verified,
        })
        if (error) throw error
        toast({ title: "Created", description: "Campus score created." })
      }
      setEditingId(null)
      setIsCreating(false)
      setForm(EMPTY_FORM)
      fetchRecords()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
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
    const { error } = await supabase.from("campus_scores").delete().eq("id", recordToDelete.id)
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
      university_name: record.university_name,
      major: record.major,
      min_score: record.min_score,
      year: record.year,
      source_url: record.source_url,
      verified: record.verified,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsCreating(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8" /> Campus Scores
          </h1>
          <p className="text-muted-foreground">
            Manage university target scores for students
          </p>
        </div>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search university or major..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
                <Label>Major / Program *</Label>
                <Input
                  value={form.major}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, major: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Score *</Label>
                <Input
                  type="number"
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
                <Label>Year</Label>
                <Input
                  type="number"
                  value={form.year || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      year: Number(e.target.value) || null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Source URL</Label>
                <Input
                  value={form.source_url || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, source_url: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="verified"
                  checked={form.verified}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, verified: e.target.checked }))
                  }
                  className="w-4 h-4"
                />
                <Label htmlFor="verified">Verified</Label>
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

      {/* Records list */}
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
              Add your first campus score to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card
              key={r.id}
              className="hover:shadow-brutal-sm transition-shadow"
            >
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">
                      {r.university_name}
                    </span>
                    {r.verified ? (
                      <Badge
                        variant="outline"
                        className="text-status-strong border-status-strong"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Unverified
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.major} · Score: {r.min_score}{" "}
                    {r.year ? `· ${r.year}` : ""}
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
        </div>
      )}
    </div>
  )
}
