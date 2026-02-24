"use client"

/**
 * Admin Exams Management
 * Configure exam types (UTBK, SNBT, etc.) that the platform supports
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Star, Eye, EyeOff, Calendar, BookOpen, Trash2 } from "lucide-react"
import Link from "next/link"

interface Exam {
  id: string
  name: string
  exam_type: string
  year: number
  structure_metadata: any
  research_summary: string
  is_active: boolean
  is_primary: boolean
  created_at: string
}

export default function AdminExamsPage() {
  const { toast } = useToast()
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("year", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error

      setExams(data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load exams. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActive = async (examId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("exams")
        .update({ is_active: !currentStatus })
        .eq("id", examId)

      if (error) throw error

      toast({
        title: "Status Updated",
        description: `Exam ${!currentStatus ? "activated" : "deactivated"}`,
      })

      loadExams()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status. Please try again.",
      })
    }
  }

  const setPrimary = async (examId: string) => {
    try {
      const supabase = createClient()

      // First, unset all primary flags
      await supabase.from("exams").update({ is_primary: false }).neq("id", "00000000-0000-0000-0000-000000000000")

      // Then set the selected exam as primary
      const { error } = await supabase.from("exams").update({ is_primary: true }).eq("id", examId)

      if (error) throw error

      toast({
        title: "Primary Exam Set",
        description: "This exam is now the primary exam for the platform.",
      })

      loadExams()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set primary exam. Please try again.",
      })
    }
  }

  const deleteExam = async (examId: string, examName: string) => {
    if (!confirm(`Are you sure you want to delete ${examName}? This will also delete all associated taxonomy data.`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("exams").delete().eq("id", examId)

      if (error) throw error

      toast({
        title: "Exam Deleted",
        description: `${examName} has been deleted.`,
      })

      loadExams()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete exam. Please try again.",
      })
    }
  }

  const getExamTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      UTBK: "bg-pastel-pink",
      SNBT: "bg-pastel-lavender",
      "UM PTN": "bg-pastel-mint",
    }
    return colors[type] || "bg-pastel-sky"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading exams...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Configuration</h1>
          <p className="text-muted-foreground">
            Configure exam types and let AI research their structure
          </p>
        </div>
        <Link href="/admin/exams/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Exam
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Exam Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Exam Configuration</strong> allows the platform to support different exam types
            (UTBK, SNBT, etc.)
          </p>
          <p>
            When you create a new exam, AI will research its structure, sections, time limits, and
            scoring system.
          </p>
          <p>
            This research informs taxonomy generation and ensures questions match the actual exam
            format.
          </p>
          <p>
            <strong>Primary Exam:</strong> The main exam displayed to students. Only one can be
            primary.
          </p>
        </CardContent>
      </Card>

      {/* Exams List */}
      {exams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No exams configured yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first exam to get started with content creation
            </p>
            <Link href="/admin/exams/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Exam
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card
              key={exam.id}
              className={`${getExamTypeBadgeColor(exam.exam_type)} hover:shadow-brutal transition-shadow relative`}
            >
              {exam.is_primary && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-orange-500 text-white">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Primary
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    {exam.exam_type}
                  </Badge>
                  {exam.is_active ? (
                    <Badge variant="default" className="bg-green-500">
                      <Eye className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
                <CardTitle>{exam.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {exam.year}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {exam.research_summary && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {exam.research_summary}
                  </p>
                )}

                {exam.structure_metadata && Object.keys(exam.structure_metadata).length > 0 && (
                  <div className="text-xs bg-white/50 p-2 rounded border mb-4">
                    <p className="font-semibold mb-1">Structure:</p>
                    <p className="text-muted-foreground">
                      {JSON.stringify(exam.structure_metadata).substring(0, 100)}...
                    </p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(exam.id, exam.is_active)}
                  >
                    {exam.is_active ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>

                  {!exam.is_primary && exam.is_active && (
                    <Button variant="outline" size="sm" onClick={() => setPrimary(exam.id)}>
                      <Star className="h-3 w-3 mr-1" />
                      Set Primary
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => deleteExam(exam.id, exam.name)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
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
