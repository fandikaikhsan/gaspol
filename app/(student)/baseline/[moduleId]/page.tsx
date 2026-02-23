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

      console.log('=== BASELINE RUNNER DEBUG ===')
      console.log('Attempting to fetch module with ID:', moduleId)
      console.log('Module ID type:', typeof moduleId)
      console.log('Module ID length:', moduleId?.length)

      // Fetch module with questions using JOIN
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select(`
          *,
          module_questions(
            id,
            question_id,
            order_index,
            question:questions(*)
          )
        `)
        .eq('id', moduleId)
        .single()

      console.log('Query result - data:', moduleData)
      console.log('Query result - error:', moduleError)

      if (moduleError || !moduleData) {
        console.error('=== MODULE FETCH FAILED ===')
        console.error('Error:', moduleError)
        console.error('Module ID that failed:', moduleId)
        console.error('Error code:', moduleError?.code)
        console.error('Error message:', moduleError?.message)

        toast({
          variant: "destructive",
          title: "Module Not Found",
          description: `Could not find module with ID: ${moduleId}. Error: ${moduleError?.message || 'Unknown'}`,
        })
        router.push('/baseline')
        return
      }

      console.log('=== MODULE FOUND ===')
      console.log('Module name:', moduleData.name)
      console.log('Module type:', moduleData.module_type)
      console.log('Module questions:', moduleData.module_questions)

      setModule(moduleData)

      // Extract and sort questions from module_questions
      const moduleQuestions = moduleData.module_questions || []

      if (moduleQuestions.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No questions in this module. Please add questions via the admin Module Composer.",
        })
        router.push('/baseline')
        return
      }

      // Sort by order_index and extract question data
      const rawQuestions = moduleQuestions
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((mq: any) => mq.question)
        .filter(Boolean)

      console.log('Raw questions from DB:', rawQuestions)

      // Transform database format to Question type
      const transformedQuestions = rawQuestions.map((q: any) => {
        console.log('Transforming question:', q)

        // Map database fields to expected Question interface
        return {
          id: q.id,
          micro_skill_id: q.micro_skill_id || q.taxonomy_node_id || '',
          difficulty: q.difficulty || 'medium',
          cognitive_level: q.cognitive_level || 'L2',
          // Map question_type to question_format
          question_format: q.question_format || q.question_type || 'MCQ5',
          // Map question_text to stem
          stem: q.stem || q.question_text || '',
          stem_images: q.stem_images || [],
          options: q.options || {},
          correct_answer: q.correct_answer || '',
          explanation: q.explanation || '',
          explanation_images: q.explanation_images || [],
          construct_weights: q.construct_weights || {
            teliti: 0.2,
            speed: 0.2,
            reasoning: 0.2,
            computation: 0.2,
            reading: 0.2,
          },
        }
      }) as Question[]

      console.log('Transformed questions:', transformedQuestions)
      setQuestions(transformedQuestions)
      setIsLoading(false)
    }

    fetchData()
  }, [moduleId, router, toast])

  const handleComplete = async (session: AssessmentSession) => {
    if (!user) return

    const supabase = createClient()

    try {
      // Get and refresh session token once before submitting
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()

      console.log('=== SESSION DEBUG ===')
      console.log('Session error:', sessionError)
      console.log('Has session:', !!authSession)
      console.log('Access token present:', !!authSession?.access_token)
      console.log('Access token length:', authSession?.access_token?.length)

      let accessToken = authSession?.access_token

      if (sessionError || !accessToken) {
        console.error('Session error or no token, attempting refresh...')
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

        console.log('Refresh result:', {
          hasRefreshedSession: !!refreshedSession,
          refreshError: refreshError,
          hasRefreshedToken: !!refreshedSession?.access_token
        })

        if (refreshError || !refreshedSession?.access_token) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
          })
          router.push('/login')
          return
        }

        // Use refreshed token
        accessToken = refreshedSession.access_token
      }

      console.log('Using access token:', accessToken?.substring(0, 20) + '...')

      // Submit all attempts
      const attemptPromises = Object.entries(session.answers).map(
        async ([questionId, data]) => {
          const response = await fetch('/api/submit-attempt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              question_id: questionId,
              selected_answer: data.answer,
              time_spent_sec: data.timeSpent,
              context_type: 'baseline',
              context_id: moduleId,
              module_id: moduleId,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Submit attempt failed:', errorData)
            throw new Error(`Failed to submit attempt for question ${questionId}: ${errorData.error || errorData.message || 'Unknown error'}`)
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
          'Authorization': `Bearer ${accessToken}`,
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
