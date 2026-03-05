"use client"

/**
 * Drill Result — Shows last completion for a module.
 * Linked when user opens a completed module from the drill list (without Retry).
 */

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, BookOpen, RotateCcw, ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface ModuleCompletion {
  score: number
  total_questions: number
  correct_count: number
  passing_threshold?: number
}

export default function DrillResultPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation("common")
  const taskId = params.taskId as string

  const [moduleId, setModuleId] = useState<string | null>(null)
  const [completion, setCompletion] = useState<ModuleCompletion | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      let resolvedModuleId: string | null = null

      const { data: directModule } = await supabase
        .from("modules")
        .select("id")
        .eq("id", taskId)
        .single()

      if (directModule) {
        resolvedModuleId = directModule.id
      } else {
        const { data: taskData } = await supabase
          .from("plan_tasks")
          .select("module_id")
          .eq("id", taskId)
          .single()
        if (taskData?.module_id) resolvedModuleId = taskData.module_id
      }

      if (!resolvedModuleId) {
        router.push("/drill")
        return
      }

      setModuleId(resolvedModuleId)

      const { data, error } = await supabase
        .from("module_completions")
        .select("score, total_questions, correct_count")
        .eq("user_id", user.id)
        .eq("module_id", resolvedModuleId)
        .eq("context_type", "drill")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) {
        router.push("/drill")
        return
      }

      setCompletion(data as ModuleCompletion)
      setIsLoading(false)
    }

    fetchData()
  }, [taskId, router])

  if (isLoading || !completion || !moduleId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Memuat hasil...</p>
      </div>
    )
  }

  const threshold = 70 // default if not stored
  const thresholdPercent = Math.round((completion.passing_threshold ?? 0.7) * 100)
  const scorePercent = Math.round(completion.score)
  const passed = completion.score >= threshold

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          {passed ? (
            <>
              <div className="mx-auto w-20 h-20 rounded-full bg-status-strong/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-status-strong" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                🎉 {t("result.passed", { fallback: "Module Passed!" })}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("result.passedDesc", {
                  fallback: "Great job! You met the passing threshold.",
                })}
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {t("result.failed", { fallback: "Not Quite There" })}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("result.failedDesc", {
                  fallback: "Review the material below and try again.",
                })}
              </p>
            </>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">
                {t("result.yourScore", { fallback: "Your Score" })}
              </span>
              <span
                className={`text-3xl font-bold ${passed ? "text-status-strong" : "text-destructive"}`}
              >
                {scorePercent}%
              </span>
            </div>
            <Progress value={scorePercent} className="h-3 mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {completion.correct_count}/{completion.total_questions}{" "}
                {t("result.correct", { fallback: "correct" })}
              </span>
              <span>
                {t("result.passingScore", { fallback: "Passing" })}:{" "}
                {thresholdPercent}%
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push(`/drill/pembahasan/${moduleId}`)}
            className="w-full"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Lihat Pembahasan
          </Button>
          <div className="flex gap-3">
            <Button
              variant="brutal-outline"
              onClick={() => router.push(`/drill/drill/${taskId}?retry=1`)}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/drill")}
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Kembali ke Drill
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
