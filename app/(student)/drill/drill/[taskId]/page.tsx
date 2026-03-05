"use client"

/**
 * Drill Runner — V3 (F-002)
 *
 * Loads a module by taskId (tries module ID first, then plan_task ID).
 * Uses onCompleteWithResult to show pass/fail result screen with
 * "Lihat Pembahasan", "Coba Lagi", and "Kembali ke Drill" buttons.
 * Records module_completions on finish.
 */

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  QuestionRunner,
  ModuleResult,
} from "@/components/assessment/QuestionRunner"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { useToast } from "@/hooks/use-toast"

export default function DrillRunnerPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const taskId = params.taskId as string

  const [user, setUser] = useState<any>(null)
  const [planTaskId, setPlanTaskId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [module, setModule] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [runKey, setRunKey] = useState(0) // key to force remount on retry

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)

      // Try to find as a module ID first
      let moduleData: any = null
      let foundPlanTaskId: string | null = null

      const { data: directModule } = await supabase
        .from("modules")
        .select("*")
        .eq("id", taskId)
        .single()

      if (directModule) {
        moduleData = directModule
        // Also check if there's a plan_task referencing this module
        const { data: pt } = await supabase
          .from("plan_tasks")
          .select("id")
          .eq("module_id", taskId)
          .limit(1)
          .maybeSingle()
        foundPlanTaskId = pt?.id || null
      } else {
        // Fall back: try as plan_task ID
        const { data: taskData } = await supabase
          .from("plan_tasks")
          .select("*")
          .eq("id", taskId)
          .single()

        if (!taskData || !taskData.module_id) {
          toast({
            variant: "destructive",
            title: "Modul tidak ditemukan",
          })
          router.push("/drill")
          return
        }

        foundPlanTaskId = taskData.id

        const { data: md } = await supabase
          .from("modules")
          .select("*")
          .eq("id", taskData.module_id)
          .single()

        moduleData = md
      }

      if (!moduleData) {
        toast({
          variant: "destructive",
          title: "Modul tidak ditemukan",
        })
        router.push("/drill")
        return
      }

      setPlanTaskId(foundPlanTaskId)
      setModule(moduleData)

      // Load questions in module order
      const questionIds = (moduleData.question_ids || []) as string[]
      if (questionIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Modul tidak memiliki soal",
        })
        router.push("/drill")
        return
      }

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds)

      if (questionsData) {
        const sorted = questionIds
          .map((id) => (questionsData as Question[]).find((q) => q.id === id))
          .filter(Boolean) as Question[]
        setQuestions(sorted)
      }

      setIsLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const handleCompleteWithResult = useCallback(
    async (session: AssessmentSession): Promise<ModuleResult> => {
      if (!user || !module) throw new Error("Missing user or module")

      const supabase = createClient()
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token

      // Submit all attempts
      const results = await Promise.all(
        Object.entries(session.answers).map(async ([questionId, data]) => {
          const response = await fetch("/api/submit-attempt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              question_id: questionId,
              selected_answer: data.answer,
              time_spent_sec: data.timeSpent,
              context_type: "drill",
              context_id: planTaskId || module.id,
              module_id: module.id,
            }),
          })
          return response.json()
        }),
      )

      const correctCount = results.filter((r) => r.is_correct).length
      const score = (correctCount / questions.length) * 100
      const threshold = module.passing_threshold ?? 0.7
      const passed = score >= threshold * 100

      // Record module completion
      await supabase.from("module_completions").upsert(
        {
          user_id: user.id,
          module_id: module.id,
          score,
          passed,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,module_id" },
      )

      // Mark plan task complete if applicable
      if (planTaskId) {
        await supabase
          .from("plan_tasks")
          .update({
            is_completed: true,
            completed_at: new Date().toISOString(),
            completion_score: score,
          })
          .eq("id", planTaskId)
      }

      return {
        passed,
        score,
        correctCount,
        totalQuestions: questions.length,
        passingThreshold: threshold,
      }
    },
    [user, module, questions, planTaskId],
  )

  const handleRetry = useCallback(() => {
    // Force remount QuestionRunner to reset state
    setRunKey((k) => k + 1)
  }, [])

  const handleViewPembahasan = useCallback(() => {
    router.push(`/drill/pembahasan/${module?.id}`)
  }, [router, module])

  const handleContinue = useCallback(() => {
    router.push("/drill")
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Memuat soal...</p>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Tidak ada soal dalam modul ini</p>
      </div>
    )
  }

  return (
    <QuestionRunner
      key={runKey}
      questions={questions}
      moduleId={module?.id || ""}
      contextType="drill"
      contextId={planTaskId || module?.id || ""}
      onComplete={() => {}}
      onCompleteWithResult={handleCompleteWithResult}
      onRetry={handleRetry}
      onContinue={handleContinue}
      onViewPembahasan={handleViewPembahasan}
      timeLimit={module?.time_limit_min}
      showTimer={!!module?.time_limit_min}
      allowNavigation={true}
    />
  )
}
