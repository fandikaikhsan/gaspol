"use client"

/**
 * Mock Test Mode
 * Timed assessment simulating real exam conditions
 */

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { QuestionRunner } from "@/components/assessment/QuestionRunner"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

function MockTestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const taskId = searchParams.get('taskId')
  const questionCount = parseInt(searchParams.get('count') || '20')
  const timeLimitMin = parseInt(searchParams.get('time') || '60')

  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)
      setSessionId(`mock-${Date.now()}`)

      try {
        const { data: qs, error: qsError } = await supabase
          .from('questions')
          .select('*')
          .eq('status', 'published')
          .limit(questionCount * 3)

        if (qsError) throw qsError

        // Shuffle and take requested count
        const shuffled = [...(qs || [])].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, questionCount)

        if (selected.length === 0) {
          setError('No questions available for mock test.')
          setIsLoading(false)
          return
        }

        setQuestions(selected)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Error loading mock test:', err)
        setError(err.message || 'Failed to load questions')
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [router, questionCount])

  const handleComplete = async (session: AssessmentSession) => {
    if (!user) return

    const supabase = createClient()

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

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
              context_type: 'mock',
              context_id: sessionId,
            }),
          })

          if (!response.ok) {
            console.error('Submit attempt failed:', await response.text())
            return { is_correct: false }
          }

          return response.json()
        }
      )

      const results = await Promise.all(attemptPromises)
      const correctCount = results.filter(r => r.is_correct).length
      const totalCount = questions.length
      const score = (correctCount / totalCount) * 100

      // Mark plan task as completed if taskId exists
      if (taskId) {
        await supabase
          .from('plan_tasks')
          .update({
            is_completed: true,
            completion_score: score,
            completed_at: new Date().toISOString(),
          })
          .eq('id', taskId)
          .eq('user_id', user.id)
      }

      // Refresh analytics snapshot via API route (ES256 JWT workaround)
      try {
        const accessToken = (await supabase.auth.getSession()).data.session?.access_token
        await fetch('/api/generate-snapshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ scope: 'checkpoint' }),
        })
      } catch (e) {
        console.warn('Snapshot refresh failed (non-critical):', e)
      }

      toast({
        title: "Mock Test Complete!",
        description: `Score: ${score.toFixed(0)}% (${correctCount}/${totalCount} correct)`,
      })

      router.push('/locked-in')
    } catch (err) {
      console.error('Error completing mock test:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your answers. Please try again.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Preparing mock test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <button
            onClick={() => router.push('/locked-in')}
            className="text-primary underline"
          >
            Back to Hub
          </button>
        </div>
      </div>
    )
  }

  return (
    <QuestionRunner
      questions={questions}
      moduleId={sessionId}
      contextType="mock"
      contextId={sessionId}
      onComplete={handleComplete}
      timeLimit={timeLimitMin}
      showTimer={true}
      allowNavigation={false}
      autoSubmitOnTimeUp={true}
    />
  )
}

export default function MockTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <MockTestContent />
    </Suspense>
  )
}
