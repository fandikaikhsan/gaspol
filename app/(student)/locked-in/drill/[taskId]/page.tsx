"use client"

/**
 * Drill Runner
 * Phase 5: Locked-In Learning Mode
 * Reuses QuestionRunner for focused/mixed drills
 */

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { QuestionRunner } from "@/components/assessment/QuestionRunner"
import { Question, AssessmentSession } from "@/lib/assessment/types"
import { useToast } from "@/hooks/use-toast"

export default function DrillRunnerPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const taskId = params.taskId as string

  const [user, setUser] = useState<any>(null)
  const [task, setTask] = useState<any>(null)
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

      // Fetch task
      const { data: taskData, error: taskError } = await supabase
        .from('plan_tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (taskError || !taskData) {
        toast({
          variant: "destructive",
          title: "Task not found",
        })
        router.push('/plan')
        return
      }

      setTask(taskData)

      // Fetch or generate module
      let moduleId = taskData.module_id

      if (!moduleId) {
        // Generate module on-the-fly
        // For demo, redirect back
        toast({
          title: "Module generation needed",
          description: "This feature requires module generation",
        })
        router.push('/plan')
        return
      }

      // Fetch module and questions
      const { data: moduleData } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single()

      if (moduleData) {
        setModule(moduleData)
        const questionIds = moduleData.question_ids as string[]

        const { data: questionsData } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds)

        if (questionsData) {
          const sorted = questionIds
            .map(id => questionsData.find(q => q.id === id))
            .filter(Boolean) as Question[]
          setQuestions(sorted)
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [taskId, router, toast])

  const handleComplete = async (session: AssessmentSession) => {
    if (!user || !task) return

    const supabase = createClient()

    try {
      // Submit attempts
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
              context_type: 'drill',
              context_id: taskId,
              module_id: session.moduleId,
            }),
          })
          return response.json()
        }
      )

      const results = await Promise.all(attemptPromises)
      const correctCount = results.filter(r => r.is_correct).length
      const score = (correctCount / questions.length) * 100

      // Mark task complete
      await supabase
        .from('plan_tasks')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          completion_score: score,
        })
        .eq('id', taskId)

      toast({
        title: "Drill Complete! 🎯",
        description: `Score: ${score.toFixed(0)}%`,
      })

      router.push('/plan')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
      })
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Loading drill...</p>
    </div>
  }

  if (!questions.length) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>No questions available</p>
    </div>
  }

  return (
    <QuestionRunner
      questions={questions}
      moduleId={module?.id || ''}
      contextType="drill"
      contextId={taskId}
      onComplete={handleComplete}
      timeLimit={module?.time_limit_min}
      showTimer={!!module?.time_limit_min}
      allowNavigation={true}
    />
  )
}
