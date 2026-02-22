"use client"

/**
 * Baseline Assessment Runner
 * Phase 2: Question Runner & Assessment Engine
 *
 * Runs a specific baseline module using QuestionRunner
 */

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { QuestionRunner } from "@/components/assessment/QuestionRunner"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyError } from "@/lib/utils/error-messages"

export default function BaselineRunnerPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const moduleId = params.moduleId as string

  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [module, setModule] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Fetch module
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single()

      if (moduleError || !moduleData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Module not found",
        })
        router.push('/baseline')
        return
      }

      setModule(moduleData)

      // Fetch questions based on question_ids
      const questionIds = moduleData.question_ids as string[]

      if (!questionIds || questionIds.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No questions in this module",
        })
        router.push('/baseline')
        return
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds)

      if (questionsError || !questionsData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load questions",
        })
        return
      }

      // Sort questions by order in question_ids array
      const sortedQuestions = questionIds
        .map(id => questionsData.find(q => q.id === id))
        .filter(Boolean) as Question[]

      setQuestions(sortedQuestions)
      setIsLoading(false)
    }

    fetchData()
  }, [moduleId, router, toast])

  const handleComplete = async (session: AssessmentSession) => {
    if (!user) return

    const supabase = createClient()

    try {
      // Submit all attempts
      const attemptPromises = Object.entries(session.answers).map(
        async ([questionId, data]) => {
          const response = await fetch('/api/submit-attempt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              question_id: questionId,
              user_answer: data.answer,
              time_spent_sec: data.timeSpent,
              context_type: 'baseline',
              context_id: moduleId,
              module_id: moduleId,
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to submit attempt for question ${questionId}`)
          }

          return response.json()
        }
      )

      const results = await Promise.all(attemptPromises)

      // Calculate score
      const correctCount = results.filter(r => r.is_correct).length
      const totalQuestions = questions.length
      const score = (correctCount / totalQuestions) * 100

      // Call finalize_baseline_module Edge Function
      const finalizeResponse = await fetch('/api/finalize-baseline-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          module_id: moduleId,
          score,
          total_questions: totalQuestions,
          correct_count: correctCount,
          started_at: session.startedAt.toISOString(),
        }),
      })

      if (!finalizeResponse.ok) {
        throw new Error('Failed to finalize module')
      }

      toast({
        title: "Module Complete! 🎉",
        description: `You scored ${score.toFixed(0)}%`,
      })

      // Redirect to results
      router.push(`/baseline/${moduleId}/result`)
    } catch (error) {
      console.error('Submission error:', error)
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: getUserFriendlyError(error, "Failed to submit your answers. Please try again."),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading assessment...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">No questions available</p>
          <button
            onClick={() => router.push('/baseline')}
            className="text-primary underline"
          >
            Return to baseline hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <QuestionRunner
      questions={questions}
      moduleId={moduleId}
      contextType="baseline"
      contextId={moduleId}
      onComplete={handleComplete}
      timeLimit={module.time_limit_min}
      showTimer={!!module.time_limit_min}
      allowNavigation={true}
      autoSubmitOnTimeUp={true}
    />
  )
}
