"use client"

/**
 * Drill Practice Runner
 * Phase 5: Locked-In Learning Mode
 *
 * Handles all drill types:
 * - Mixed: Random questions from all topics
 * - Focused: Questions from specific topic(s)
 * - Weak: Questions from user's weak skills
 * - Module: Questions from a pre-made module
 */

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { QuestionRunner } from "@/components/assessment/QuestionRunner"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

function DrillPracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useTranslation('lockedIn')
  const { t: tc } = useTranslation('common')

  const mode = searchParams.get('mode') // mixed, focused, weak
  const moduleId = searchParams.get('module')
  const nodeId = searchParams.get('node')
  const nodeIds = searchParams.get('nodes')?.split(',') || []
  const questionCount = parseInt(searchParams.get('count') || '10')
  const taskId = searchParams.get('taskId')
  const checkpointId = searchParams.get('checkpointId')

  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drillInfo, setDrillInfo] = useState<{
    title: string
    subtitle: string
  }>({ title: 'Practice Drill', subtitle: '' })

  const nodeIdsKey = nodeIds.join(',')

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)
      setSessionId(`drill-${Date.now()}`)

      try {
        let questionsData: any[] = []
        let title = 'Practice Drill'
        let subtitle = ''

        if (moduleId) {
          // Load questions from module
          const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select('*, question_ids')
            .eq('id', moduleId)
            .single()

          if (moduleError || !moduleData) {
            throw new Error('Module not found')
          }

          title = moduleData.name
          subtitle = `${moduleData.question_count} questions`

          const questionIds = moduleData.question_ids as string[]

          const { data: qs, error: qsError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds)
            .eq('status', 'published')

          if (qsError) throw qsError

          // Sort by module order
          questionsData = questionIds
            .map(id => qs?.find(q => q.id === id))
            .filter(Boolean)

        } else if (mode === 'mixed') {
          // Load random questions from all published questions
          title = 'Mixed Drill'
          subtitle = `${questionCount} random questions`

          const { data: qs, error: qsError } = await supabase
            .from('questions')
            .select('*')
            .eq('status', 'published')
            .limit(questionCount * 3) // Get more to shuffle

          if (qsError) throw qsError

          // Shuffle and take requested count
          questionsData = shuffleArray(qs || []).slice(0, questionCount)

        } else if (mode === 'focused' && nodeId) {
          // Load questions from specific node
          const { data: node } = await supabase
            .from('taxonomy_nodes')
            .select('name')
            .eq('id', nodeId)
            .single()

          title = `Focus: ${node?.name || 'Topic'}`
          subtitle = `${questionCount} questions`

          const { data: qs, error: qsError } = await supabase
            .from('questions')
            .select('*')
            .eq('micro_skill_id', nodeId)
            .eq('status', 'published')
            .limit(questionCount * 2)

          if (qsError) throw qsError

          questionsData = shuffleArray(qs || []).slice(0, questionCount)

        } else if (mode === 'weak' && nodeIds.length > 0) {
          // Load questions from weak skill nodes
          title = 'Weak Skills Drill'
          subtitle = `${questionCount} questions from ${nodeIds.length} weak areas`

          const { data: qs, error: qsError } = await supabase
            .from('questions')
            .select('*')
            .in('micro_skill_id', nodeIds)
            .eq('status', 'published')
            .limit(questionCount * 3)

          if (qsError) throw qsError

          questionsData = shuffleArray(qs || []).slice(0, questionCount)

        } else {
          throw new Error('Invalid drill configuration')
        }

        if (questionsData.length === 0) {
          setError(t('practice.noQuestions'))
          setIsLoading(false)
          return
        }

        setDrillInfo({ title, subtitle })
        setQuestions(questionsData)
        setIsLoading(false)

      } catch (err: any) {
        console.error('Error loading drill:', err)
        setError(err.message || 'Failed to load questions')
        setIsLoading(false)
      }
    }

    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, mode, moduleId, nodeId, nodeIdsKey, questionCount])

  // Shuffle array helper
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleComplete = async (session: AssessmentSession) => {
    if (!user) return

    const supabase = createClient()

    try {
      // Submit all attempts
      const attemptPromises = Object.entries(session.answers).map(
        async ([questionId, data]) => {
          const accessToken = (await supabase.auth.getSession()).data.session?.access_token

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
              context_type: 'drill',
              context_id: sessionId,
              module_id: moduleId || null,
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

      // Update user analytics if this was a module
      if (moduleId) {
        await supabase
          .from('module_completions')
          .insert({
            user_id: user.id,
            module_id: moduleId,
            context_type: 'drill',
            score,
            total_questions: totalCount,
            correct_count: correctCount,
            total_time_sec: Object.values(session.answers).reduce((sum, a) => sum + a.timeSpent, 0),
            started_at: session.startedAt.toISOString(),
            completed_at: new Date().toISOString(),
          })
      }

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

      // Mark recycle checkpoint as completed if checkpointId exists
      if (checkpointId) {
        await supabase
          .from('recycle_checkpoints')
          .update({
            is_completed: true,
            score,
            completed_at: new Date().toISOString(),
          })
          .eq('id', checkpointId)
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
        title: t('practice.complete'),
        description: t('practice.scoreDesc', { score: score.toFixed(0), correct: correctCount, total: totalCount }),
      })

      // Navigate to results or back to drills
      router.push('/locked-in/drills')

    } catch (err) {
      console.error('Error completing drill:', err)
      toast({
        variant: "destructive",
        title: tc('error.title'),
        description: tc('error.submissionFailedDesc'),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">{t('practice.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-destructive">
            <CardContent className="py-8 text-center">
              <p className="text-lg font-medium text-destructive mb-4">{error}</p>
              <Button onClick={() => router.push('/locked-in/drills')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('practice.backToDrills')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <QuestionRunner
      questions={questions}
      moduleId={moduleId || sessionId}
      contextType="drill"
      contextId={sessionId}
      onComplete={handleComplete}
      showTimer={true}
      allowNavigation={true}
    />
  )
}

export default function DrillPracticePage() {
  const { t: tc } = useTranslation('common')

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-lg text-muted-foreground">{tc('status.loading')}</p>
        </div>
      </div>
    }>
      <DrillPracticeContent />
    </Suspense>
  )
}
