"use client"

/**
 * Exam Detail View
 * Displays research summary, structure metadata, constructs, content areas, and error patterns
 */

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, BookOpen, Loader2, Brain } from "lucide-react"
import Link from "next/link"

interface Exam {
  id: string
  name: string
  exam_type: string
  year: number
  research_summary: string | null
  structure_metadata: Record<string, unknown> | null
  construct_profile: Record<string, unknown> | null
  is_active: boolean
  is_primary: boolean
}

interface ExamConstruct {
  code: string
  name: string
  short_name: string | null
  description: string | null
  icon: string | null
  color: string | null
  improvement_tips: unknown[]
}

export default function ExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  const [exam, setExam] = useState<Exam | null>(null)
  const [constructs, setConstructs] = useState<ExamConstruct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExam()
  }, [id])

  const loadExam = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("id, name, exam_type, year, research_summary, structure_metadata, construct_profile, is_active, is_primary")
        .eq("id", id)
        .single()

      if (examError) throw examError
      if (!examData) {
        toast({ variant: "destructive", title: "Exam not found" })
        router.push("/admin/exams")
        return
      }

      setExam(examData as Exam)

      const { data: constructsData, error: constructsError } = await supabase.rpc("get_exam_constructs", {
        p_exam_id: id,
      })

      if (!constructsError) {
        setConstructs((constructsData as ExamConstruct[]) || [])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load exam details.",
      })
      router.push("/admin/exams")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!exam) return null

  const structureMetadata = exam.structure_metadata as Record<string, unknown> | null
  const contentAreas = structureMetadata?.content_areas as unknown[] | undefined
  const errorPatterns = structureMetadata?.error_patterns as Record<string, unknown> | undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{exam.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">{exam.exam_type}</Badge>
            <Calendar className="h-4 w-4" />
            {exam.year}
          </p>
        </div>
      </div>

      {exam.research_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Research Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{exam.research_summary}</p>
          </CardContent>
        </Card>
      )}

      {constructs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Constructs
            </CardTitle>
            <CardDescription>Cognitive constructs for this exam</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {constructs.map((c) => (
                <div
                  key={c.code}
                  className="rounded-lg border bg-muted/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {c.code}
                    </Badge>
                  </div>
                  {c.short_name && (
                    <p className="text-xs text-muted-foreground mt-1">{c.short_name}</p>
                  )}
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-2">{c.description}</p>
                  )}
                  {c.improvement_tips && Array.isArray(c.improvement_tips) && c.improvement_tips.length > 0 && (
                    <ul className="mt-2 text-xs list-disc list-inside space-y-1">
                      {(c.improvement_tips as string[]).slice(0, 2).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {structureMetadata && Object.keys(structureMetadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Structure Metadata</CardTitle>
            <CardDescription>Exam structure, sections, and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
              {JSON.stringify(structureMetadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {contentAreas && contentAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(contentAreas, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {errorPatterns && Object.keys(errorPatterns).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Error Patterns</CardTitle>
            <CardDescription>Common error patterns from research</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(errorPatterns, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
