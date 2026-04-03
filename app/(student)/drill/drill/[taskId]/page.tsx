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
import { useRouter, useParams, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const taskId = params.taskId as string
  const skillId = searchParams.get("skillId")

  const [user, setUser] = useState<any>(null)
  const [planTaskId, setPlanTaskId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [module, setModule] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [runKey, setRunKey] = useState(0) // key to force remount on retry

  // Clear session storage when retrying (start fresh)
  useEffect(() => {
    const retry = searchParams.get("retry")
    if (retry === "1" || retry === "true") {
      try {
        localStorage.removeItem(`qr-session-${taskId}`)
      } catch {
        /* ignore */
      }
    }
  }, [taskId, searchParams])

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
        .select(`
          *,
          module_questions(question_id, order_index)
        `)
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
          router.push("/review")
          return
        }

        foundPlanTaskId = taskData.id

        const { data: md } = await supabase
          .from("modules")
          .select(`
            *,
            module_questions(question_id, order_index)
          `)
          .eq("id", taskData.module_id)
          .single()

        moduleData = md
      }

      if (!moduleData) {
        toast({
          variant: "destructive",
          title: "Modul tidak ditemukan",
        })
        router.push("/review")
        return
      }

      setPlanTaskId(foundPlanTaskId)
      setModule(moduleData)

      // If already completed and not retry, show result page instead of questions
      const retry = searchParams.get("retry")
      const { data: existingCompletion } = await supabase
        .from("module_completions")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("module_id", moduleData.id)
        .eq("context_type", "drill")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingCompletion && retry !== "1" && retry !== "true") {
        router.replace(
          `/drill/drill/${taskId}/result${skillId ? `?skillId=${skillId}` : ""}`,
        )
        setIsLoading(false)
        return
      }

      // Load questions via module_questions (ordered by order_index)
      const mqs = (moduleData.module_questions || []) as { question_id: string; order_index: number }[]
      const questionIds = mqs
        .sort((a, b) => a.order_index - b.order_index)
        .map((mq) => mq.question_id)
      if (questionIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Modul tidak memiliki soal",
        })
        router.push("/review")
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
  }, [taskId, skillId])

  const handleCompleteWithResult = useCallback(
    async (session: AssessmentSession): Promise<ModuleResult> => {
      if (!user || !module) throw new Error("Missing user or module")

      const supabase = createClient()
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token

      // Submit all attempts (check response.ok so failed requests don't count as wrong)
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
              time_spent_sec: data.timeSpent ?? 0,
              context_type: "drill",
              context_id: planTaskId || module.id,
              module_id: module.id,
            }),
          })
          const json = await response.json().catch(() => ({}))
          if (!response.ok) {
            throw new Error(
              json?.error || json?.message || "Gagal mengirim jawaban",
            )
          }
          return json
        }),
      )

      const correctCount = results.filter((r) => r.is_correct).length
      const score = (correctCount / questions.length) * 100
      const threshold = module.passing_threshold ?? 0.7
      const passed = score >= threshold * 100
      const totalTimeSec = Object.values(session.answers).reduce(
        (sum, a) => sum + (a.timeSpent || 0),
        0,
      )

      // Record module completion (insert, not upsert — each attempt is a new record)
      await supabase.from("module_completions").insert({
        user_id: user.id,
        module_id: module.id,
        context_type: "drill",
        score,
        total_questions: questions.length,
        correct_count: correctCount,
        total_time_sec: totalTimeSec,
        started_at: session.startedAt
          ? new Date(session.startedAt).toISOString()
          : new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })

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
    const q = skillId ? `?skillId=${skillId}` : ""
    router.push(`/drill/pembahasan/${module?.id}${q}`)
  }, [router, module, skillId])

  const handleContinue = useCallback(() => {
    if (skillId) {
      router.push(`/review/${skillId}/drill`)
    } else {
      router.push("/review")
    }
  }, [router, skillId])

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

  const drillModuleLabel =
    typeof module?.name === "string" && module.name.trim()
      ? module.name.trim()
      : typeof module?.title === "string" && module.title.trim()
        ? module.title.trim()
        : undefined

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
      drillModuleLabel={drillModuleLabel}
    />
  )
}
